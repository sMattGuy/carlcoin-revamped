const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder} = require('discord.js');
const { get_user_avatar, get_user, get_user_stats, get_user_metrics } = require('../../helper.js');
const { Buildings, Items, Cosmetic } = require('../../dbObjects.js');
const Canvas = require('@napi-rs/canvas');

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
					{ name: 'Lootbox', value: 'lootbox' },
				)),
	async execute(interaction) {
		let user = interaction.user;
		let menu_option = interaction.options.getString('menu');
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		let user_items = await user_data.getItems(user_data);
		let user_buildings = await user_data.getBuildings(user_data);
		let user_metric = await get_user_metrics(interaction.user.id);
		
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
					cost += Math.floor(buildings[i].payout * Math.pow(users_building.amount, 2) * 2)
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
					cost += Math.floor(selectedBuilding.payout * Math.pow(users_building.amount, 2) * 2);
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
					user_metric.buildings_purchased += 1;
					user_metric.cc_total_lost += cost;
					user_metric.save();
					user_data.save();
					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought 1 ${selectedBuilding.name}!`)
						.setDescription(`You now have ${user_data.balance}CC!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(menu_option == 'items'){
			//generate rows for items
			let items = await Items.findAll();
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<items.length;i++){
				let cost = items[i].cost
				let users_items = await user_data.getItem(user_data, items[i]);
				if(users_items){
					cost += Math.floor(items[i].rank * (items[i].cost/2) * Math.pow(users_items.amount,2));
					if(items[i].name == 'Energy Drink'){
						cost += Math.ceil(Math.pow(user_stats.level, 1.5));
					}
					else if(items[i].name == 'Sanity Pill'){
						cost += Math.ceil(Math.pow(user_stats.level, 1.7));
					}
					else if(items[i].name == 'Lootbox Pill'){
						cost += Math.ceil(Math.pow(user_stats.level, 1.3));
					}
				}
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
				if(users_items){
					cost += Math.floor(selectedItem.rank * (selectedItem.cost/2) * Math.pow(users_items.amount,2));
					if(selectedItem.name == 'Energy Drink'){
						cost += Math.ceil(Math.pow(user_stats.level, 1.5));
					}
					else if(selectedItem.name == 'Sanity Pill'){
						cost += Math.ceil(Math.pow(user_stats.level, 1.7));
					}
					else if(selectedItem.name == 'Lootbox Pill'){
						cost += Math.ceil(Math.pow(user_stats.level, 1.3));
					}
				}
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
						user_stats.defense += 2 * users_items.amount;
					}
					else if(selectedItem.name == 'Homerun Bat'){
						user_stats.strength += 2 * users_items.amount;
					}
					else if(selectedItem.name == 'Fog Machine'){
						user_stats.evade += 2 * users_items.amount;
					}
					else if(selectedItem.name == 'Nerd Glasses'){
						user_stats.intel += 2 * users_items.amount;
					}
					else if(selectedItem.name == 'Ponder Orb'){
						user_stats.wisdom += 2 * users_items.amount;
					}
					else if(selectedItem.name == 'Meditation Orb'){
						user_stats.constitution += 2 * users_items.amount;
					}
					user_metric.items_purchased += 1;
					user_metric.cc_total_lost += cost;
					user_metric.save();
					user_stats.save();
					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought 1 ${selectedItem.name}!`)
						.setDescription(`You now have ${user_data.balance}CC!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
		}
		else if(menu_option == 'lootbox'){
			if(user_data.last_lootbox + 64800000 > Date.now()){
				//cant purchase box at this time
				const cantBuyEmbed = new EmbedBuilder()
					.setColor(0xeb3434)
					.setTitle(`Invalid Purchase!`)
					.setDescription(`You cannot purchase a lootbox until your timer is up! Check your stats to see when your next Lootbox is available!`);
				await interaction.reply({embeds:[cantBuyEmbed], ephemeral:true});
				return;
			}
			let selectMenu = new StringSelectMenuBuilder()
			
			let typebox_cost = Math.ceil(50 + Math.pow(user_stats.level, 1.5));
			let rarebox_cost = Math.ceil(100 + Math.pow(user_stats.level, 2));
			let superbox_cost = Math.ceil(1000 + Math.pow(user_stats.level, 2.5));

			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			selectMenu.addOptions({label: `Background Lootbox`, description: `100% Background! Cost: ${typebox_cost}`, value: `bkr`});
			selectMenu.addOptions({label: `Body Lootbox`, description: `100% Background! Cost: ${typebox_cost}`, value: `bdy`});
			selectMenu.addOptions({label: `Glasses Lootbox`, description: `100% Background! Cost: ${typebox_cost}`, value: `gls`});
			selectMenu.addOptions({label: `Hat Lootbox`, description: `100% Background! Cost: ${typebox_cost}`, value: `hat`});
			selectMenu.addOptions({label: `Special Lootbox`, description: `100% Background! Cost: ${typebox_cost}`, value: `spc`});
			selectMenu.addOptions({label: `Rare Lootbox`, description: `100% Rare or Better! Cost: ${rarebox_cost}`, value: `rare`});
			selectMenu.addOptions({label: `Super Rare Lootbox`, description: `100% Super Rare or Better! Cost: ${superbox_cost}`, value: `superrare`});
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
				user_data = await get_user(interaction.user.id);
				let cost = 0;
				let lootbox_name = 'null';
				let type = '';
				let rarechance = 0.2;
				let superrarechance = 0.05;
				if(selected == 'bkr'){
					cost = typebox_cost;
					type = 0;
					lootbox_name = 'Type Lootbox';
				}
				else if(selected == 'bdy'){
					cost = typebox_cost;
					type = 1;
					lootbox_name = 'Type Lootbox';
				}
				else if(selected == 'gls'){
					cost = typebox_cost;
					type = 2;
					lootbox_name = 'Type Lootbox';
				}
				else if(selected == 'hat'){
					cost = typebox_cost;
					type = 3;
					lootbox_name = 'Type Lootbox';
				}
				else if(selected == 'spc'){
					cost = typebox_cost;
					type = 4;
					lootbox_name = 'Type Lootbox';
				}
				else if(selected == 'rare'){
					cost = rarebox_cost;
					rarechance = 1;
					lootbox_name = 'Rare Lootbox';
				}
				else if(selected == 'superrare'){
					cost = superbox_cost;
					superrarechance = 1;
					lootbox_name = 'Super Rare Lootbox';
				}
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
					await user_data.save();
					
					await mod_give_lootbox(type, rarechance, superrarechance);

					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You bought a ${lootbox_name}!`)
						.setDescription(`You now have ${user_data.balance}CC!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
			});
			collector.on('end', async () => {
				await interaction.editReply({components:[],ephemeral:true});
			});
			async function mod_give_lootbox(type, rarechance, superrarechance){
				user_metric.lootboxes_earned += 1;
				//generate and give lootbox
				user_data.last_lootbox = Date.now();
				/*
					rarity
					1	common
					2	rare
					3	super rare
					4	ultra rare
				*/
				
				let ultraIncrease = user_data.dup_count * 0.001;
				let superIncrease = user_data.dup_count * 0.005;
				let rareIncrease = user_data.dup_count * 0.01;
	
				const rarity_levels = ['Common', 'Rare', 'Super Rare', 'Ultra Rare']
				let rarity_roll = Math.random();
				let cosmetic_get = '';
				let rarity_level_img = 'common.png';
				if(rarity_roll < 0.005 + ultraIncrease){
					//ultra rare
					let where = {rarity: 4}
					if(type != ''){
						where = {rarity: 4, type};
					}
					cosmetic_get = await Cosmetic.findAll({where});
					rarity_level_img = 'ultra_rare.png';
				}
				else if(rarity_roll < superrarechance + superIncrease){
					//super rare
					let where = {rarity: 3}
					if(type != ''){
						where = {rarity: 3, type};
					}
					cosmetic_get = await Cosmetic.findAll({where});
					rarity_level_img = 'super_rare.png';
				}
				else if(rarity_roll < rarechance + rareIncrease){
					//rare
					let where = {rarity: 2}
					if(type != ''){
						where = {rarity: 2, type};
					}
					cosmetic_get = await Cosmetic.findAll({where});
					rarity_level_img = 'rare.png';
				}
				else{
					//common
					let where = {rarity: 1}
					if(type != ''){
						where = {rarity: 1, type};
					}
					cosmetic_get = await Cosmetic.findAll({where});
				}
				let random_selection = Math.floor(Math.random() * cosmetic_get.length);
				let selected_cosmetic = cosmetic_get[random_selection];
				//check if user has cosmetic
				let user_cosmetic = await user_data.getCosmetic(user_data, selected_cosmetic);
				if(user_cosmetic.amount == 0){
					user_data.dup_count = 0;
					//new cosmetic for them
					user_cosmetic.amount = 1;
					user_cosmetic.save();
					//apply new cosmetic if slot is not in use
					let user_avatar = await get_user_avatar(user_data.user_id);
					if(selected_cosmetic.type == 0 && user_avatar.background == -1){
						user_avatar.background = selected_cosmetic.id;
					}
					else if(selected_cosmetic.type == 1 && user_avatar.body == -1){
						user_avatar.body = selected_cosmetic.id;
					}
					else if(selected_cosmetic.type == 2 && user_avatar.glasses == -1){
						user_avatar.glasses = selected_cosmetic.id;
					}
					else if(selected_cosmetic.type == 2 && user_avatar.glasses2 == -1){
						user_avatar.glasses2 = selected_cosmetic.id;
					}
					else if(selected_cosmetic.type == 3 && user_avatar.hat == -1){
						user_avatar.hat = selected_cosmetic.id;
					}
					else if(selected_cosmetic.type == 4 && user_avatar.special == -1){
						user_avatar.special = selected_cosmetic.id;
					}
					else if(selected_cosmetic.type == 4 && user_avatar.special2 == -1){
						user_avatar.special2 = selected_cosmetic.id;
					}
					user_avatar.save();
					const canvas = Canvas.createCanvas(500,500);
					const context = canvas.getContext('2d');
					//draw item
					const cos_image = await Canvas.loadImage(`./images/cosmetics/${selected_cosmetic.file}`);
					context.drawImage(cos_image,canvas.width/2 - cos_image.width/2, canvas.height/2 - cos_image.height/2);
					//draw rarity
					const rarity_image = await Canvas.loadImage(`./images/cosmetics/${rarity_level_img}`);
					context.drawImage(rarity_image,0,0);
					//build attachment
					const attachment = new AttachmentBuilder(await canvas.encode('png'),{name:'cosmetic.png'});
					const cosmeticEmbed = new EmbedBuilder()
						.setColor(0x2eb7f6)
						.setTitle(`${interaction.user.username} bought a new cosmetic!`)
						.setDescription(`${interaction.user.username} unboxed the ${selected_cosmetic.name}, a ${rarity_levels[selected_cosmetic.rarity - 1]} item!`)
						.setImage('attachment://cosmetic.png');
					interaction.followUp({embeds:[cosmeticEmbed],files:[attachment]});
				}
				else{
					user_data.dup_count += 1;
					//already have, reward with coin
					let coinreward = 10 * user_cosmetic.cosmetic.rarity;
					user_data.balance += coinreward;
					user_data.last_lootbox -= 32400000;
					//metrics
					user_metric.cc_total_gained += coinreward;
					if(user_metric.highest_cc_balance < user_data.balance){
						user_metric.highest_cc_balance = user_data.balance;
					}
					const cosmeticEmbed = new EmbedBuilder()
						.setColor(0x2eb7f6)
						.setTitle('You got a duplicate!')
						.setDescription(`Since you already own the ${selected_cosmetic.name}, You get ${coinreward}CC instead! Don't worry though! Next time you're ${user_data.dup_count * 0.1}% more likely to get an Ultra Rare, ${user_data.dup_count * 0.5}% more likely to get a Super Rare, and ${user_data.dup_count}% more likely to get a Rare!`)
					interaction.followUp({embeds:[cosmeticEmbed]});
				}
				user_data.save();
				user_metric.save();
			}
		}
	},
};
