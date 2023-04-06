const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Lets you check your stats!')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to view')
				.setRequired(false)),
	async execute(interaction) {
		let user = interaction.options.getUser('user') ?? interaction.user
		await interaction.reply(`${user.username} pong!`);
	},
};