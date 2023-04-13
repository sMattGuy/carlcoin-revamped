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
					cost += (buildings[i].id * 50 * users_building.amount)
				selectMenu.addOptions({label: `${buildings[i].name}`, description: `Costs ${cost}CC`, value: `${buildings[i].id}`})
			}
			const row = new ActionRowBuilder().addComponents(selectMenu);
			const buyEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Select what to purchase!')
				.setDescription(`Use the menu below to make a purchase!`)
			await interaction.reply({embeds:[buyEmbed],components:[row],ephemeral:true});
			//wait for reply
			const collector = new InteractionCollector(interaction.client, {time: 15000})
			collector.on('collect', async menuInteraction => {
				if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id) return;
				collector.stop();
				await interaction.editReply({ content: 'Validating purchase!', components: [], ephemeral:true });
				const selected = menuInteraction.values[0];
				//get building based on ID
				let selectedBuilding = await Buildings.findOne({where:{id: selected}});
				let cost = selectedBuilding.cost;
				let users_building = await user_data.getBuilding(user_data, selectedBuilding);
				if(users_building)
					cost += (selectedBuilding.id * 50 * users_building.amount);
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
			collector.on('end', collected => {
				
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
					cost += (items[i].id * 50 * users_items.amount)
				selectMenu.addOptions({label: `${items[i].name}`, description: `Costs ${cost}CC`, value: `${items[i].id}`})
			}
			const row = new ActionRowBuilder().addComponents(selectMenu);
			const buyEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Select what to purchase!')
				.setDescription(`Use the menu below to make a purchase!`)
			await interaction.reply({embeds:[buyEmbed],components:[row],ephemeral:true});
			//wait for reply
			const collector = new InteractionCollector(interaction.client, {time: 15000})
			collector.on('collect', async menuInteraction => {
				if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
				await interaction.editReply({ content: 'Validating purchase!', components: [], ephemeral:true });
				collector.stop()
				const selected = menuInteraction.values[0];
				//get building based on ID
				let selectedItem = await Items.findOne({where:{id: selected}});
				let cost = selectedItem.cost;
				let users_items = await user_data.getItem(user_data, selectedItem);
				if(users_items)
					cost += (selectedItem.id * 50 * users_items.amount);
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
					user_data = await get_user(interaction.user.id);
					user_data.balance -= cost;
					await user_data.addItem(user_data, selectedItem);
					user_data.save();
					if(selectedItem.name == 'Hard Hat'){
						user_stats.defense += 1;
					}
					else if(selectedItem.name == 'Homerun Bat'){
						user_stats.strength += 1;
					}
					else if(selectedItem.name == 'Fog Machine'){
						user_stats.evade += 1;
					}
					else if(selectedItem.name == 'Nerd Glasses'){
						user_stats.intel += 1;
					}
					else if(selectedItem.name == 'Ponder Orb'){
						user_stats.wisdom += 1;
					}
					else if(selectedItem.name == 'Meditation Orb'){
						user_stats.constitution += 1;
					}
					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought 1 ${selectedItem.name}!`)
						.setDescription(`You now own have ${user_data.balance}CC!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
			});
			collector.on('end', collected => {
				
			});
		}
	},
};