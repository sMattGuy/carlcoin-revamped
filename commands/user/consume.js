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
		let user_items = await user_data.getItems(user_data);
		let user_metric = await get_user_metrics(interaction.user.id);
		
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
			await interaction.reply({embeds:[cantEatEmbed], ephemeral:true});
			return;
		}
		
		const row = new ActionRowBuilder().addComponents(selectMenu);
		const buyEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle('Select what to consume!')
			.setDescription(`Use the menu below to make a choice!`)
		await interaction.reply({embeds:[buyEmbed],components:[row],ephemeral:true});
		
		//wait for reply
		let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
		let message = await interaction.fetchReply();
		const collector = message.createMessageComponentCollector({filter, time: 60000});
		collector.on('collect', async menuInteraction => {
			//if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
			await interaction.editReply({ content: 'Validating consumption!', components: [], ephemeral:true });
			const selected = menuInteraction.values[0];
			if(selected == 'cancel'){
				const cancelEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle(`You consumed nothing!`)
					.setDescription(`See you next time!`);
				await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
				return;
			}
			//purchase
			user_data = await get_user(interaction.user.id);
			user_stats = await get_user_stats(interaction.user.id);
			let selectedItem = await Items.findOne({where: {id: selected}})
			user_items = await user_data.getItem(user_data, selectedItem);
			
			if(user_items.amount <= 0){
				const cantEatEmbed = new EmbedBuilder()
					.setColor(0xeb3434)
					.setTitle('No consumables!')
					.setDescription(`You don't have any consumables`);
				await interaction.followUp({embeds:[cantEatEmbed], ephemeral:true});
				return;
			}
		
			if(user_items.item.name == 'Energy Drink'){
				//energy drink
				user_data.last_worked -= 7200000;
				user_data.save();
			}
			else if(user_items.item.name == 'Sanity Pill'){
				//sanity pill
				if(user_stats.sanity != 0){
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
			else if(user_items.item.name == 'Lootbox Pill'){
				//lootbox pill
				user_data.last_lootbox -= 21600000;
				user_data.save();
			}
			user_metric.consumables_used += 1;
			await user_metric.save();
			
			user_items.amount -= 1;
			user_items.save();
			const bought = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle(`You consumed 1 ${user_items.item.name}!`)
				.setDescription(`You now have ${user_items.amount}!`);
			await interaction.followUp({embeds:[bought], ephemeral:true});
		});
		collector.on('end', collected => {
			interaction.editReply({components:[], ephemeral:true});
		});
	}
}
