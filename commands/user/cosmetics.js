const { SlashCommandBuilder, EmbedBuilder, codeBlock, ActionRowBuilder, StringSelectMenuBuilder, InteractionCollector } = require('discord.js');
const { get_user, get_user_avatar, generate_avatar } = require('../../helper.js');
const { Cosmetic } = require('../../dbObjects.js');

const cosmetic_names = ['Background','Body','Glasses','Hat','Special'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cosmetics')
		.setDescription('Lets you work with cosmetics!')
		.addSubcommand(subcommand => 
			subcommand
				.setName('view')
				.setDescription('Lets you see your cosmetics!'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('equip')
				.setDescription('Lets you equip a cosmetic!')
				.addStringOption(option => 
					option
						.setName('name')
						.setDescription('The cosmetics name, must be exactly case sensitive correct!')
						.setRequired(true))
				.addIntegerOption(option => 
					option
						.setName('slotnum')
						.setDescription('The slot for glasses or special to equip to, not required by default')
						.addChoices(
							{name: '1', value: 1},
							{name: '2', value: 2},
						)
						.setRequired(false)))
		.addSubcommand(subcommand => 
			subcommand
				.setName('remove')
				.setDescription('Lets you remove a cosmetic!')
				.addStringOption(option => 
					option
						.setName('type')
						.setDescription('The type to remove!')
						.setRequired(true)
						.addChoices(
							{name: 'Background', value: 'background'},
							{name: 'Body', value: 'body'},
							{name: 'Glasses', value: 'glasses'},
							{name: 'Glasses 2', value: 'glasses2'},
							{name: 'Hat', value: 'hat'},
							{name: 'Special', value: 'special'},
							{name: 'Special 2', value: 'special2'},
						))),
	async execute(interaction) {
		//get user
		let user_data = await get_user(interaction.user.id);
		let subcommand = interaction.options.getSubcommand();
		let avatar = await get_user_avatar(interaction.user.id);
		if(subcommand == 'view'){
			let user_cosmetics = await user_data.getCosmetics(user_data);
			if(user_cosmetics.length == 0){
				interaction.reply({content:'You have no cosmetics!', ephemeral:true});
			}
			else{
				await interaction.reply({content:codeBlock('Current Cosmetics'), ephemeral:true});
				let cosmetic_list = ``;
				let equipped_ids = [avatar.background, avatar.body, avatar.glasses, avatar.glasses2, avatar.hat, avatar.special, avatar.special2];
				for(let i=0;i<user_cosmetics.length;i++){
					if(user_cosmetics[i].amount != 0){
						let wearingthing = '';
						if(equipped_ids.includes(user_cosmetics[i].cosmetic_id)){
							wearingthing = '(Equipped)'
						}
						let newEntry = `${cosmetic_names[user_cosmetics[i].cosmetic.type]}, ${user_cosmetics[i].cosmetic.name} ${wearingthing}\n`;
						if(cosmetic_list.length + newEntry.length > 2000){
							interaction.followUp({content:codeBlock(cosmetic_list), ephemeral:true});
							cosmetic_list = ``;
						}
						cosmetic_list += newEntry;
					}
				}
				if(cosmetic_list != ``){
					interaction.followUp({content:codeBlock(cosmetic_list), ephemeral:true});
				}
				else{
					interaction.followUp({content:codeBlock('You have no cosmetics!'), ephemeral:true});
				}
			}
		}
		else if(subcommand == 'equip'){
			//create buttons
			const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('0')
					.setLabel(`Background`)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('1')
					.setLabel('Body')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('2')
					.setLabel('Glasses')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('3')
					.setLabel('Hat')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('4')
					.setLabel('Special')
					.setStyle(ButtonStyle.Primary),
			);
			//let cosmetic_name = interaction.options.getString('name');
			let cosmetic_slot = interaction.options.getInteger('slotnum') ?? 1;
			
			const boardEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle(`Which Slot?`)
				.setDescription(`Select which slot you want to change!`)
		
			await interaction.editReply({embeds:[boardEmbed],components:[row],ephemeral:true});
			let filter = i => i.user.id == interaction.user.id && i.isButton();
			let message = await interaction.fetchReply();
			let cosmetic_butt_collector = message.createMessageComponentCollector({time: 60000, filter});
			cosmetic_butt_collector.on('collect', async i => {
				await cosmetic_butt_collector.stop();
				let cosmetic_number = parseInt(i.i.customId);
				//start building the cosmetic menu
				let user_cosmetic = await user_data.getCosmetics(user_data);
				let hasCosmetic = false;
				let selectMenu = new StringSelectMenuBuilder()
				selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
				for(let i=0;i<user_cosmetic.length;i++){
					if(cosmetic_number == user_cosmetic[i].cosmetic.type){
						hasCosmetic = true;
						selectMenu.addOptions({label: `${user_cosmetic[i].cosmetic.name}`, description: `Select to equip!`, value: `${i}`});
					}
				}
				//check if empty
				if(!hasCosmetic){
					//no cosmetics
					const cantEquipEmbed = new EmbedBuilder()
						.setColor(0xeb3434)
						.setTitle('No Cosmetics of that type!')
						.setDescription(`You don't have any cosmetics for that slot!`);
					await interaction.editReply({embeds:[cantEquipEmbed], ephemeral:true});
					return;
				}
				selectMenu.addOptions({label: `Cancel`, description: `Cancels the command`, value: `cancel`});
				const selectmenurow = new ActionRowBuilder().addComponents(selectMenu);
				
				const selectionEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle('Select what to equip!')
					.setDescription(`Use the menu below to make a choice!`)
				await interaction.reply({embeds:[selectionEmbed],components:[selectmenurow],ephemeral:true});
				
				//wait for reply
				let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
				let message = await interaction.fetchReply();
				const selectioncollector = message.createMessageComponentCollector({filter, time: 60000});
				selectioncollector.on('collect', async menuInteraction => {
					await selectioncollector.stop();
					const selected = menuInteraction.values[0];
					if(selected == 'cancel'){
						const cancelEmbed = new EmbedBuilder()
							.setColor(0xf5bf62)
							.setTitle(`You equipped nothing!`)
							.setDescription(`See you next time!`);
						await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
						return;
					}
					let selectedCosmetic = user_cosmetic[parseInt(selected)];
					
					let cosmetic_type = selectedCosmetic.cosmetic.type;
					if(cosmetic_type == 0){
						avatar.background = selectedCosmetic.cosmetic_id;
					}
					if(cosmetic_type == 1){
						avatar.body = selectedCosmetic.cosmetic_id;
					}
					if(cosmetic_type == 2 && cosmetic_slot == 1){
						avatar.glasses = selectedCosmetic.cosmetic_id;
					}
					if(cosmetic_type == 2 && cosmetic_slot == 2){
						avatar.glasses2 = selectedCosmetic.cosmetic_id;
					}
					if(cosmetic_type == 3){
						avatar.hat = selectedCosmetic.cosmetic_id;
					}
					if(cosmetic_type == 4 && cosmetic_slot == 1){
						avatar.special = selectedCosmetic.cosmetic_id;
					}
					if(cosmetic_type == 4 && cosmetic_slot == 2){
						avatar.special2 = selectedCosmetic.cosmetic_id;
					}
					await avatar.save();
					
					let avatar_img = await generate_avatar(interaction.user.id);
					const cosmeticEmbed = new EmbedBuilder()
						.setTitle('You equipped the cosmetic!')
						.setImage('attachment://avatar.png')
						.setColor(0x2eb7f6)
					interaction.editReply({embeds:[cosmeticEmbed], files:[avatar_img], ephemeral:true});
				});
				selectioncollector.on('end', async () => {
					await interaction.editReply({components:[],ephemeral:true});
				});
			});
			cosmetic_butt_collector.on('end', async i=> {
				await interaction.editReply({components:[],ephemeral:true});
			});
			/*
			let cosmetic = await Cosmetic.findOne({where:{name:cosmetic_name}});
			if(!cosmetic){
				const errorEmbed = new EmbedBuilder()
					.setTitle('Cosmetic doesn\'t exist!')
					.setDescription(`Make sure it's spelled exactly as shown in /cosmetic view!`)
					.setColor(0xff293b)
				interaction.reply({embeds:[errorEmbed], ephemeral:true});
			}
			else{
				let user_cosmetic = await user_data.getCosmetic(user_data, cosmetic);
				if(user_cosmetic.amount == 0){
					const errorEmbed = new EmbedBuilder()
						.setTitle('You don\'t have this!')
						.setDescription(`You do not own this cosmetic!`)
						.setColor(0xff293b)
					interaction.reply({embeds:[errorEmbed], ephemeral:true});
				}
				else{
					let cosmetic_type = user_cosmetic.cosmetic.type;
					if(cosmetic_type == 0){
						avatar.background = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 1){
						avatar.body = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 2 && cosmetic_slot == 1){
						avatar.glasses = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 2 && cosmetic_slot == 2){
						avatar.glasses2 = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 3){
						avatar.hat = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 4 && cosmetic_slot == 1){
						avatar.special = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 4 && cosmetic_slot == 2){
						avatar.special2 = user_cosmetic.cosmetic_id;
					}
					await avatar.save();
					let avatar_img = await generate_avatar(interaction.user.id);
					const cosmeticEmbed = new EmbedBuilder()
						.setTitle('You equipped the cosmetic!')
						.setImage('attachment://avatar.png')
						.setColor(0x2eb7f6)
					interaction.reply({embeds:[cosmeticEmbed], files:[avatar_img], ephemeral:true});
				}
			}
			*/
		}
		else{
			//remove
			let cosmetic_type = interaction.options.getString('type');
			if(cosmetic_type == 'background'){
				avatar.background = -1;
			}
			else if(cosmetic_type == 'body'){
				avatar.body = -1;
			}
			else if(cosmetic_type == 'glasses'){
				avatar.glasses = -1;
			}
			else if(cosmetic_type == 'glasses2'){
				avatar.glasses2 = -1;
			}
			else if(cosmetic_type == 'hat'){
				avatar.hat = -1;
			}
			else if(cosmetic_type == 'special'){
				avatar.special = -1;
			}
			else if(cosmetic_type == 'special2'){
				avatar.special2 = -1;
			}
			await avatar.save();
			let avatar_img = await generate_avatar(interaction.user.id);
			const cosmeticEmbed = new EmbedBuilder()
				.setTitle('You removed a cosmetic')
				.setColor(0x2eb7f6)
				.setImage('attachment://avatar.png')
				.setDescription('The cosmetic has been sent to your inventory.');
			interaction.reply({embeds:[cosmeticEmbed], files:[avatar_img], ephemeral:true});
		}
	},
};
