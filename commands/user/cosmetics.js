const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
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
						.setRequired(true)))
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
							{name: 'Hat', value: 'hat'},
							{name: 'Special', value: 'special'},
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
				for(let i=0;i<user_cosmetics.length;i++){
					if(user_cosmetics[i].amount != 0){
						let newEntry = `${cosmetic_names[user_cosmetics[i].cosmetic.type]}, ${user_cosmetics[i].cosmetic.name}\n`;
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
			let cosmetic_name = interaction.options.getString('name');
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
					if(cosmetic_type == 2){
						avatar.glasses = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 3){
						avatar.hat = user_cosmetic.cosmetic_id;
					}
					if(cosmetic_type == 4){
						avatar.special = user_cosmetic.cosmetic_id;
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
			else if(cosmetic_type == 'hat'){
				avatar.hat = -1;
			}
			else if(cosmetic_type == 'special'){
				avatar.special = -1;
			}
			await avatar.save();
			const cosmeticEmbed = new EmbedBuilder()
				.setTitle('You removed a cosmetic')
				.setColor(0x2eb7f6)
				.setDescription('The cosmetic has been sent to your inventory.');
			interaction.reply({embeds:[cosmeticEmbed], ephemeral:true});
		}
	},
};
