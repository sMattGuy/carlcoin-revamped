const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('work')
		.setDescription('Lets you work for coin!'),
	async execute(interaction) {
		await interaction.reply(`${interaction.user.username} work!`);
	},
};