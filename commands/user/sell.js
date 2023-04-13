const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats } = require('../../helper.js');
const { Buildings } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sell')
		.setDescription('Lets you sell a building!'),
	async execute(interaction) {
		let user = interaction.user;
		
		let user_data = await get_user(interaction.user.id);
		let user_buildings = await user_data.getBuildings(user_data);
		
		let validBuildings = false;
		//generate rows for items
		let selectMenu = new StringSelectMenuBuilder()
		selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
		for(let i=0;i<user_buildings.length;i++){
			if(user_buildings[i].amount > 0){
				validBuildings = true;
				selectMenu.addOptions({label: `${user_buildings[i].building.name}`, description: `Value: ${Math.floor(user_buildings[i].building.cost*0.65)}`, value: `${user_buildings[i].building_id}`})
			}
		}
		selectMenu.addOptions({label: `Cancel`, description: `Cancel selling`, value: `cancel`})
		if(!validBuildings){
			const cantSellEmbed = new EmbedBuilder()
				.setColor(0xeb3434)
				.setTitle('No buildings!')
				.setDescription(`You don't have any buildings!`);
			await interaction.reply({embeds:[cantSellEmbed], ephemeral:true});
			return;
		}
		
		const row = new ActionRowBuilder().addComponents(selectMenu);
		const buyEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle('Select what to sell!')
			.setDescription(`Use the menu below to make a choice!`)
		await interaction.reply({embeds:[buyEmbed],components:[row],ephemeral:true});
		let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
		//wait for reply
		let message = await interaction.fetchReply();
		const collector = message.createMessageComponentCollector({filter, time: 60000});
		collector.on('collect', async menuInteraction => {
			//if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id ) return;
			await interaction.editReply({ content: 'Validating purchase!',embeds:[], components: [], ephemeral:true });
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
			let selectedBuilding = await Buildings.findOne({where: {id: selected}})
			user_buildings = await user_data.getBuilding(user_data, selectedBuilding);
			
			if(user_buildings.amount <= 0){
				const cantSellEmbed = new EmbedBuilder()
					.setColor(0xeb3434)
					.setTitle('No buildings!')
					.setDescription(`You don't have any of that buildings!`);
				await interaction.followUp({embeds:[cantSellEmbed], ephemeral:true});
				return;
			}
			
			user_data.balance += Math.floor(selectedBuilding.cost*0.65);
			user_buildings.amount -= 1;
			user_buildings.save();
			user_data.save();
			const bought = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle(`You sold 1 ${selectedBuilding.name}!`)
				.setDescription(`You now own have ${user_buildings.amount}!`);
			await interaction.followUp({embeds:[bought], ephemeral:true});
		});
		collector.on('end', collected => {
			interaction.editReply({components:[], ephemeral:true});
		});
	}
}