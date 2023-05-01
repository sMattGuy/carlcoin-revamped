const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats } = require('../../helper.js');
const { Buildings, Items } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purchase')
		.setDescription('Lets you buy stuff!')
		.addStringOption(option =>
			option.setName('menu')
				.setDescription('What you want to browse')
				.setRequired(true)
				.addChoices(
					{ name: 'Buildings', value: 'buildings' },
					{ name: 'Items', value: 'items' },
				)),
	async execute(interaction) {
		let user = interaction.user;
		let menu_option = interaction.options.getString('menu');
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		let user_items = await user_data.getItems(user_data);
		let user_buildings = await user_data.getBuildings(user_data);
		
		if(menu_option == 'buildings'){
			//generate rows for buildings
			let buildings = await Buildings.findAll();
			//house, apartment, mansion, skyscraper, city, country, satellite
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<buildings.length;i++){
				let cost = buildings[i].cost
				let users_building = await user_data.getBuilding(user_data, buildings[i]);
				if(users_building)
					cost += (buildings[i].payout * users_building.amount * 2)
				selectMenu.addOptions({label: `${buildings[i].name}`, description: `Costs ${cost}CC`, value: `${buildings[i].id}`})
			}
			selectMenu.addOptions({label: `Cancel`, description: `Cancels the transaction`, value: `cancel`});
			const row = new ActionRowBuilder().addComponents(selectMenu);
			const buyEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Select what to purchase!')
				.setDescription(`Use the menu below to make a purchase!`)
			await interaction.reply({embeds:[buyEmbed],components:[row],ephemeral:true});
			//wait for reply
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			let message = await interaction.fetchReply();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.on('collect', async menuInteraction => {
				//if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id) return;
				collector.stop();
				await interaction.editReply({ content: 'Validating purchase!', components: [], ephemeral:true });
				const selected = menuInteraction.values[0];
				if(selected == 'cancel'){
					const cancelEmbed = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought nothing!`)
						.setDescription(`See you next time!`);
					await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
					return;
				}
				//get building based on ID
				let selectedBuilding = await Buildings.findOne({where:{id: selected}});
				let cost = selectedBuilding.cost;
				let users_building = await user_data.getBuilding(user_data, selectedBuilding);
				if(users_building)
					cost += (selectedBuilding.payout * users_building.amount * 2);
				//check if user can afford it
				if(user_data.balance - cost < 0){
					//cant afford
					const cantBuyEmbed = new EmbedBuilder()
						.setColor(0xeb3434)
						.setTitle('You don\'t have enough CC!')
						.setDescription(`You cannot afford this building! You need ${Math.abs(user_data.balance - cost)}CC!`);
					await interaction.followUp({embeds:[cantBuyEmbed], ephemeral:true});
				}
				else{
					//purchase
					user_data = await get_user(interaction.user.id);
					user_data.balance -= cost;
					await user_data.addBuilding(user_data, selectedBuilding);
					user_data.save();
					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought 1 ${selectedBuilding.name}!`)
						.setDescription(`You now own have ${user_data.balance}CC!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else{
			//generate rows for items
			let items = await Items.findAll();
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<items.length;i++){
				let cost = items[i].cost
				let users_items = await user_data.getItem(user_data, items[i]);
				if(users_items)
					cost += (items[i].rank * 25 * users_items.amount)
				selectMenu.addOptions({label: `${items[i].name}`, description: `Costs ${cost}CC`, value: `${items[i].id}`})
			}
			selectMenu.addOptions({label: `Cancel`, description: `Cancels the transaction`, value: `cancel`});
			const row = new ActionRowBuilder().addComponents(selectMenu);
			const buyEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Select what to purchase!')
				.setDescription(`Use the menu below to make a purchase!`)
			await interaction.reply({embeds:[buyEmbed],components:[row],ephemeral:true});
			//wait for reply
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			let message = await interaction.fetchReply();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.on('collect', async menuInteraction => {
				//if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				await interaction.editReply({ content: 'Validating purchase!', components: [], ephemeral:true });
				collector.stop()
				const selected = menuInteraction.values[0];
				if(selected == 'cancel'){
					const cancelEmbed = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought nothing!`)
						.setDescription(`See you next time!`);
					await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
					return;
				}
				//get building based on ID
				let selectedItem = await Items.findOne({where:{id: selected}});
				let cost = selectedItem.cost;
				user_data = await get_user(interaction.user.id);
				let users_items = await user_data.getItem(user_data, selectedItem);
				if(users_items)
					cost += (selectedItem.rank * 25 * users_items.amount);
				//check if user can afford it
				if(user_data.balance - cost < 0){
					//cant afford
					const cantBuyEmbed = new EmbedBuilder()
						.setColor(0xeb3434)
						.setTitle('You don\'t have enough CC!')
						.setDescription(`You cannot afford this item! You need ${Math.abs(user_data.balance - cost)}CC!`);
					await interaction.followUp({embeds:[cantBuyEmbed], ephemeral:true});
				}
				else{
					//purchase
					user_data.balance -= cost;
					await user_data.addItem(user_data, selectedItem);
					await user_data.save();
					users_items = await user_data.getItem(user_data, selectedItem);
					if(selectedItem.name == 'Hard Hat'){
						user_stats.defense += 10 * users_items.amount;
					}
					else if(selectedItem.name == 'Homerun Bat'){
						user_stats.strength += 10 * users_items.amount;
					}
					else if(selectedItem.name == 'Fog Machine'){
						user_stats.evade += 10 * users_items.amount;
					}
					else if(selectedItem.name == 'Nerd Glasses'){
						user_stats.intel += 10 * users_items.amount;
					}
					else if(selectedItem.name == 'Ponder Orb'){
						user_stats.wisdom += 10 * users_items.amount;
					}
					else if(selectedItem.name == 'Meditation Orb'){
						user_stats.constitution += 10 * users_items.amount;
					}
					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought 1 ${selectedItem.name}!`)
						.setDescription(`You now own have ${user_data.balance}CC!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
	},
};
