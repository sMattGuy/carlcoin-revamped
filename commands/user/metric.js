const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
const { get_user_metrics } = require('../../helper.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('metrics')
		.setDescription('Shows your metrics!')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to view')
				.setRequired(false)),
	async execute(interaction) {
		//get user
		let user = interaction.options.getUser('user') ?? interaction.user;
		let user_metric = await get_user_metrics(user.id);
		let message = `${user.username}'s Metrics\nGames Won: ${user_metric.games_won}\nGames Lost: ${user_metric.games_lost}\nBlackjack Plays: ${user_metric.blackjack_plays}\nRPS Plays: ${user_metric.rps_plays}\nBattle Plays: ${user_metric.battle_plays}\nThree Card Plays: ${user_metric.threecard_plays}\nVideo Poker Plays: ${user_metric.videopoker_plays}\nAscentions: ${user_metric.ascentions}\nDeaths: ${user_metric.deaths}\nCC Payed: ${user_metric.cc_payed}\nCC Received: ${user_metric.cc_received}\nCC Gambled: ${user_metric.cc_gambled}\nCC Won Gambling: ${user_metric.cc_gambled_won}\nCC Lost Gambling: ${user_metric.cc_gambled_lost}\nCC Worked: ${user_metric.cc_worked}\nCC Lost from Death: ${user_metric.cc_lost_death}\nCC Total Gained: ${user_metric.cc_total_gained}\nCC Total Lost: ${user_metric.cc_total_lost}\nCC Earned from Realty: ${user_metric.cc_earned_realty}\nCC Bestowed: ${user_metric.cc_bestowed}\nPC Earned: ${user_metric.pc_earned}\nMost CC Won: ${user_metric.most_cc_won}\nMost CC Lost: ${user_metric.most_cc_lost}\nConsumables Used: ${user_metric.consumables_used}\nUpgrades Purchased: ${user_metric.upgrades_purchased}\nItems Purchased: ${user_metric.items_purchased}\nBuildings Purchased: ${user_metric.buildings_purchased}\nBuildings Sold: ${user_metric.buildings_sold}\nXP Earned: ${user_metric.experience_earned}\nHighest Level: ${user_metric.highest_level}\nHighest Balance: ${user_metric.highest_cc_balance}\nLootboxes Earned: ${user_metric.lootboxes_earned}`;
		await interaction.reply({content:codeBlock(`${message}`)});
	},
};
