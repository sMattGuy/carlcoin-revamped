const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats } = require('../../helper.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Lets you check your stats!')
		.addStringOption(option =>
			option.setName('menu')
				.setDescription('The Stat menu to see')
				.setRequired(true)
				.addChoices(
					{ name: 'General', value: 'general' },
					{ name: 'Level Stats', value: 'level' },
					{ name: 'Buildings', value: 'building'},
					{ name: 'Items/Upgrades', value: 'itemupgrade' },
				))
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to view')
				.setRequired(false)),
	async execute(interaction) {
		let user = interaction.options.getUser('user') ?? interaction.user;
		let menu_option = interaction.options.getString('menu');
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		let user_items = await user_data.getItems(user_data);
		let user_upgrades = await user_data.getUpgrades(user_data);
		let user_buildings = await user_data.getBuildings(user_data);
		
		if(menu_option == 'general'){
			let canWork = ``
			if(user_data.last_worked + 21600000 <= Date.now()){
				canWork = `Yes`;
			}
			else{
				let returnToWork = user_data.last_worked + 21600000 - Date.now();
				returnToWork = Math.floor(returnToWork / 1000); //seconds
				returnToWork = Math.floor(returnToWork / 60); //mins
				canWork = `No, ${returnToWork} mins left`
			}
			const levelUpEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('General Stats')
				.setDescription(`You are level ${user_stats.level}. Current XP ${user_stats.experience}/${user_stats.next_level}`)
				.addFields(
					{name: 'Balance', value: `${user_data.balance}`, inline: true},
					{name: 'Prestige Balance', value: `${user_data.prestigeBalance}`, inline: true},
					{name: 'Current Life', value: `${user_data.life}`, inline: true},
					{name: 'Can Work?', value: `${canWork}`, inline: true},
				);
			await interaction.reply({embeds:[levelUpEmbed]});
		}
		else if(menu_option == 'level'){
			const levelUpEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Character Stats')
				.addFields(
					{name: 'STR', value: `${user_stats.strength}`, inline: true},
					{name: 'DEF', value: `${user_stats.defense}`, inline: true},
					{name: 'EVD', value: `${user_stats.evade}`, inline: true},
					{name: 'INT', value: `${user_stats.intel}`, inline: true},
					{name: 'WIS', value: `${user_stats.wisdom}`, inline: true},
					{name: 'CON', value: `${user_stats.constitution}`, inline: true},
					{name: 'LCK', value: `${user_stats.luck}`, inline: true},
					{name: 'SAN', value: `${user_stats.sanity}`, inline: true},
				);
			await interaction.reply({embeds:[levelUpEmbed]});
		}
		else if(menu_option == 'building'){
			const levelUpEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Buildings');
			if(user_buildings.length == 0){
				levelUpEmbed.setDescription(`You don't have any buildings!`);
			}
			else{
				for(const build of user_buildings){
					levelUpEmbed.addFields({name:`${build.building.name}`,value:`${build.amount}`,inline:true});
				}
			}
			await interaction.reply({embeds:[levelUpEmbed]});
		}
		else{
			//user items
			const levelUpEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Items/Upgrades');
			if(user_items.length == 0 && user_upgrades == 0){
				levelUpEmbed.setDescription(`You don't have any items or upgrades!`);
			}
			else{
				for(const item of user_items){
					levelUpEmbed.addFields({name:`${item.item.name}`,value:`${item.amount}`,inline:true});
				}
				for(const upgrade of user_upgrades){
					levelUpEmbed.addFields({name:`${upgrade.upgrade.name}`,value:`${upgrade.amount}`,inline:true});
				}
			}
			await interaction.reply({embeds:[levelUpEmbed]});
		}
	},
};