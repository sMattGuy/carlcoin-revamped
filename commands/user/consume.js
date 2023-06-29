const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, Events, StringSelectMenuBuilder, ComponentType, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats, get_user_metrics } = require('../../helper.js');
const { Items } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('consume')
		.setDescription('Lets you use a consumable!'),
	async execute(interaction) {
		let user = interaction.user;
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		let user_metric = await get_user_metrics(interaction.user.id);
	
		await interaction.deferReply({ephemeral:true});

		purchaseLoop();
		async function purchaseLoop(){
			let user_items = await user_data.getItems(user_data);
			let validItems = false;
			//generate rows for items
			let selectMenu = new StringSelectMenuBuilder()
			selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
			for(let i=0;i<user_items.length;i++){
				if(user_items[i].item.consume && user_items[i].amount > 0){
					validItems = true;
					selectMenu.addOptions({label: `${user_items[i].item.name}`, description: `Owned: ${user_items[i].amount}`, value: `${user_items[i].item_id}`})
				}
			}
			selectMenu.addOptions({label: `Cancel`, description: `Cancels the consumption`, value: `cancel`});
			if(!validItems){
				const cantEatEmbed = new EmbedBuilder()
					.setColor(0xeb3434)
					.setTitle('No consumables!')
					.setDescription(`You don't have any consumables`);
				await interaction.editReply({embeds:[cantEatEmbed], ephemeral:true});
				return;
			}
			
			const row = new ActionRowBuilder().addComponents(selectMenu);
			const buyEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Select what to consume!')
				.setDescription(`Use the menu below to make a choice!`)
			await interaction.editReply({embeds:[buyEmbed],components:[row],ephemeral:true});
			
			//wait for reply
			let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
			let message = await interaction.fetchReply();
			const collector = message.createMessageComponentCollector({filter, time: 60000});
			collector.on('collect', async menuInteraction => {
				await menuInteraction.update({ content: 'Validating purchase!', components: [], ephemeral:true });
				const selected = menuInteraction.values[0];
				if(selected == 'cancel'){
					const cancelEmbed = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`Finished Consuming!`)
						.setDescription(`See you next time!`);
					await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
					return;
				}
				//purchase
				user_data = await get_user(interaction.user.id);
				user_stats = await get_user_stats(interaction.user.id);
				let selectedItem = await Items.findOne({where: {id: selected}})
				let user_item = await user_data.getItem(user_data, selectedItem);
				let used_something = false;

				if(user_item.amount <= 0){
					const cantEatEmbed = new EmbedBuilder()
						.setColor(0xeb3434)
						.setTitle('No consumables!')
						.setDescription(`You don't have any of that consumable`);
					await interaction.followUp({embeds:[cantEatEmbed], ephemeral:true});
				}
			
				if(user_item.item.name == 'Energy Drink'){
					if(user_data.last_worked > Date.now()){
						const cantEatEmbed = new EmbedBuilder()
							.setColor(0xeb3434)
							.setTitle(`You don't need it!`)
							.setDescription(`You are already able to work!`);
						await interaction.followUp({embeds:[cantEatEmbed], ephemeral:true});
					}
					else{
						used_something = true;
						//energy drink
						user_data.last_worked -= 7200000;
						user_data.save();
					}
				}
				else if(user_item.item.name == 'Sanity Pill'){
					//sanity pill
					if(user_stats.sanity > -10){
						const cantEatEmbed = new EmbedBuilder()
							.setColor(0xeb3434)
							.setTitle(`You don't need it!`)
							.setDescription(`You are already sane!`);
						await interaction.followUp({embeds:[cantEatEmbed], ephemeral:true});
					}
					else{
						used_something = true;
						let newSanity = user_stats.sanity + -(user_stats.sanity/Math.abs(user_stats.sanity))*25;
						if (newSanity < 0 && user_stats.sanity >= 0 || newSanity >= 0 && user_stats.sanity < 0) {
							user_stats.sanity = 0;
						}
						else{
							user_stats.sanity = newSanity;
						}
					}
					user_stats.save();
				}
				else if(user_item.item.name == 'Lootbox Pill'){
					if(user_data.last_lootbox > Date.now()){
						const cantEatEmbed = new EmbedBuilder()
							.setColor(0xeb3434)
							.setTitle(`You don't need it!`)
							.setDescription(`Your lootbox is available!`);
						await interaction.followUp({embeds:[cantEatEmbed], ephemeral:true});
					}
					else{
						used_something = true;
						//lootbox pill
						user_data.last_lootbox -= 21600000;
						user_data.save();
					}
				}
				if(used_something){
					user_metric.consumables_used += 1;
					await user_metric.save();
					
					user_item.amount -= 1;
					user_item.save();
					const bought = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`You consumed 1 ${user_item.item.name}!`)
						.setDescription(`You now have ${user_item.amount}!`);
					await interaction.followUp({embeds:[bought], ephemeral:true});
				}
				purchaseLoop();
			});
			collector.on('end', collected => {
				interaction.editReply({components:[], ephemeral:true});
			});
		}
	}
}
