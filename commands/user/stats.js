const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats,generate_avatar } = require('../../helper.js');

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
		
		let user_data = await get_user(user.id);
		let user_stats = await get_user_stats(user.id);
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
			
			let dailyPayout = 0;
			for(const build of user_buildings){
				dailyPayout += build.building.payout * build.amount;
			}
			
			let lootboxAvailable = '';
			if(user_data.last_lootbox + 86400000 <= Date.now()){
				lootboxAvailable = `Yes`;
			}
			else{
				let returnToWork = user_data.last_lootbox + 86400000 - Date.now();
				returnToWork = Math.floor(returnToWork / 1000); //seconds
				returnToWork = Math.floor(returnToWork / 60); //mins
				lootboxAvailable = `No, ${returnToWork} mins left`
			}
			let avatar = await generate_avatar(user.id);
			const levelUpEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('General Stats')
				.setThumbnail('attachment://avatar.png')
				.setDescription(`You are level ${user_stats.level}. Current XP ${user_stats.experience}/${user_stats.next_level}`)
				.addFields(
					{name: 'Balance', value: `${user_data.balance}`, inline: true},
					{name: 'Prestige Balance', value: `${user_data.prestigeBalance}`, inline: true},
					{name: 'Current Life', value: `${user_data.life}`, inline: true},
					{name: 'Can Work?', value: `${canWork}`, inline: true},
					{name: 'Loot Box?', value: `${lootboxAvailable}`, inline: true},
					{name: 'Daily Payout', value: `${dailyPayout}`, inline: true},
					{name: 'Sanity', value: `${getSanityLevel(user_stats.sanity)}`, inline: true},
				);
			await interaction.reply({embeds:[levelUpEmbed], files:[avatar]});
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

function getSanityLevel(sanity_value){
	if(sanity_value >= -10){
		return 'Normal';
	}
	else if(sanity_value >= -20){
		return 'Annoyed';
	}
	else if(sanity_value >= -30){
		return 'Irate';
	}
	else if(sanity_value >= -40){
		return 'Goofy';
	}
	else if(sanity_value >= -50){
		return 'Crazy';
	}
	else if(sanity_value >= -60){
		return 'Insane';
	}
	else if(sanity_value >= -70){
		return 'Mentally Ill';
	}
	else if(sanity_value >= -80){
		return 'Grippy Socks';
	}
	else if(sanity_value >= -90){
		return 'Schizophrenic';
	}
	else if(sanity_value >= -100){
		return 'Enlightened';
	}
	else{
		return 'Incomprehensible';
	}
}
