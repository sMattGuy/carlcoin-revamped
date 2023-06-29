const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats, get_user_metrics } = require('../../helper.js');
const { Buildings, Items, Upgrades, Cosmetic } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateuser')
		.setDescription('Owner Only! Lets you update a user.')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to modify')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('stat')
				.setDescription('The stat to change')
				.setRequired(true)
				.addChoices(
					{name:'General',value:'general'},
					{name:'Stats',value:'stats'},
					{name:'Buildings',value:'buildings'},
					{name:'Items',value:'items'},
					{name:'Upgrades',value:'upgrades'},
					{name:'Cosmetics',value:'cosmetics'},
				)
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('The value to change to')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('for cosmetics only')),
	async execute(interaction) {
		let user = interaction.options.getUser('user');
		if(interaction.guild.ownerId != interaction.user.id){
			await interaction.reply({content: 'You cannot use this command!', ephemeral:true})
			return;
		}
		if(user.bot){
			await interaction.reply({content: 'Bots cannot play Carlcoin!', ephemeral:true})
			return;
		}
		let optionChoice = interaction.options.getString('stat');
		let amount = interaction.options.getInteger('amount');
		
		if(optionChoice == 'general'){
			let selectMenu = new StringSelectMenuBuilder()
				.setCustomId('select')
				.setPlaceholder('Nothing Selected')
				.addOptions(
					{label:'Balance',description:'Click me!',value:'balance',},
					{label:'PBalance',description:'Click me!',value:'prestigeBalance',},
					{label:'Life',description:'Click me!',value:'life',},
					{label:'Last Worked',description:'Click me!',value:'last_worked',},
					{label:'Last Lootbox',description:'Click me!',value:'last_lootbox',},
					{label:'Cancel',description:'Click me!',value:'cancel',},
				);
			const row = new ActionRowBuilder().addComponents(selectMenu);
			await interaction.reply({components:[row],ephemeral:true});
			let message = await interaction.fetchReply();
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.once('collect', async menuInteraction => {
				//if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				const selected = menuInteraction.values[0];
				let user_data = await get_user(user.id);
				let user_metric = await get_user_metrics(user.id);
				if(selected == 'balance'){
					let net_balance = amount - user_data.balance;
					user_data.balance = amount;
					user_metric.cc_bestowed = net_balance;
				}
				else if(selected == 'prestigeBalance'){
					user_data.prestigeBalance = amount;
				}
				else if(selected == 'life'){
					user_data.life = amount;
				}
				else if(selected == 'last_worked'){
					user_data.last_worked = amount;
				}
				else if(selected == 'last_lootbox'){
					user_data.last_lootbox = amount;
				}
				user_data.save();
				user_metric.save();
				await interaction.editReply({content:'Updated!',components:[],ephemeral:true});
				return;
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(optionChoice == 'stats'){
			let selectMenu = new StringSelectMenuBuilder()
				.setCustomId('select')
				.setPlaceholder('Nothing Selected')
				.addOptions(
					{label:'Experience',description:'Click me!',value:'experience',},
					{label:'Level',description:'Click me!',value:'level',},
					{label:'PLevel',description:'Click me!',value:'plevel',},
					{label:'Next Level',description:'Click me!',value:'next_level',},
					{label:'Luck',description:'Click me!',value:'luck',},
					{label:'Strength',description:'Click me!',value:'strength',},
					{label:'Defense',description:'Click me!',value:'defense',},
					{label:'Evade',description:'Click me!',value:'evade',},
					{label:'Intel',description:'Click me!',value:'intel',},
					{label:'Wisdom',description:'Click me!',value:'wisdom',},
					{label:'Constitution',description:'Click me!',value:'constitution',},
					{label:'Sanity',description:'Click me!',value:'sanity',},
					{label:'Cancel',description:'Click me!',value:'cancel',},
				);
			const row = new ActionRowBuilder().addComponents(selectMenu);
			await interaction.reply({components:[row],ephemeral:true});
			let message = await interaction.fetchReply();
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.once('collect', async menuInteraction => {
				if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				const selected = menuInteraction.values[0];
				let user_stats = await get_user_stats(user.id);
				if(selected == 'experience'){
					user_stats.experience = amount;
				}
				else if(selected == 'level'){
					user_stats.level = amount;
				}
				else if(selected == 'plevel'){
					user_stats.plevel = amount;
				}
				else if(selected == 'next_level'){
					user_stats.next_level = amount;
				}
				else if(selected == 'luck'){
					user_stats.luck = amount;
				}
				else if(selected == 'strength'){
					user_stats.strength = amount;
				}
				else if(selected == 'defense'){
					user_stats.defense = amount;
				}
				else if(selected == 'evade'){
					user_stats.evade = amount;
				}
				else if(selected == 'intel'){
					user_stats.intel = amount;
				}
				else if(selected == 'wisdom'){
					user_stats.wisdom = amount;
				}
				else if(selected == 'constitution'){
					user_stats.constitution = amount;
				}
				else if(selected == 'sanity'){
					user_stats.sanity = amount;
				}
				user_stats.save();
				await interaction.editReply({content:'Updated!',components:[],ephemeral:true});
				return;
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(optionChoice == 'buildings'){
			let buildings = await Buildings.findAll();
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<buildings.length;i++){
				selectMenu.addOptions({label: `${buildings[i].name}`, description: `Click me!`, value: `${buildings[i].id}`})
			}
			selectMenu.addOptions({label:'Cancel',description:'Click me!',value:'cancel'})
			const row = new ActionRowBuilder().addComponents(selectMenu);
			await interaction.reply({components:[row],ephemeral:true});
			let message = await interaction.fetchReply();
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.once('collect', async menuInteraction => {
				if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				const selected = menuInteraction.values[0];
				if(selected == 'cancel'){
					interaction.editReply({content:'done!'});
					return;
				}
				let user_data = await get_user(user.id);
				let building_data = await Buildings.findOne({where: {id:selected}});
				let user_building = await user_data.getBuilding(user_data, building_data);
				user_building.amount = amount;
				user_building.save();
				await interaction.editReply({content:'Updated!',components:[],ephemeral:true});
				return;
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(optionChoice == 'items'){
			let items = await Items.findAll();
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<items.length;i++){
				selectMenu.addOptions({label: `${items[i].name}`, description: `Click me!`, value: `${items[i].id}`})
			}
			selectMenu.addOptions({label:'Cancel',description:'Click me!',value:'cancel'})
			const row = new ActionRowBuilder().addComponents(selectMenu);
			await interaction.reply({components:[row],ephemeral:true});
			let message = await interaction.fetchReply();
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.once('collect', async menuInteraction => {
				if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				const selected = menuInteraction.values[0];
				if(selected == 'cancel'){
					interaction.editReply({content:'done!'});
					return;
				}
				let user_data = await get_user(user.id);
				let item_data = await Items.findOne({where: {id:selected}});
				let user_item = await user_data.getItem(user_data, item_data);
				user_item.amount = amount;
				user_item.save();
				await interaction.editReply({content:'Updated!',components:[],ephemeral:true});
				return;
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(optionChoice == 'upgrades'){
			let upgrades = await Upgrades.findAll();
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<upgrades.length;i++){
				selectMenu.addOptions({label: `${upgrades[i].name}`, description: `Click me!`, value: `${upgrades[i].id}`})
			}
			selectMenu.addOptions({label:'Cancel',description:'Click me!',value:'cancel'})
			const row = new ActionRowBuilder().addComponents(selectMenu);
			await interaction.reply({components:[row],ephemeral:true});
			let message = await interaction.fetchReply();
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.once('collect', async menuInteraction => {
				if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				const selected = menuInteraction.values[0];
				if(selected == 'cancel'){
					interaction.editReply({content:'done!'});
					return;
				}
				let user_data = await get_user(user.id);
				let upgrade_data = await Upgrades.findOne({where: {id:selected}});
				let user_upgrade = await user_data.getUpgrade(user_data, upgrade_data);
				user_upgrade.amount = amount;
				user_upgrade.save();
				await interaction.editReply({content:'Updated!',components:[],ephemeral:true});
				return;
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(optionChoice == 'cosmetics'){
			let user_data = await get_user(user.id);
			let cos_name = interaction.options.getString('name');
			let new_cosmetic = await Cosmetic.findOne({where:{name:cos_name}});
			if(!new_cosmetic){
				await interaction.reply({content:'Failed to get cosmetic', ephemeral:true});
			}
			else{
				let user_cosmetic = await user_data.getCosmetic(user_data, new_cosmetic);
				user_cosmetic.amount = amount;
				await user_cosmetic.save();
				await interaction.reply({content:'Updated!', ephemeral:true});
			}
		}
	},
};
