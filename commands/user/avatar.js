const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generate_avatar } = require('../../helper.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Displays your avatar!')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to view')
				.setRequired(false)),
	async execute(interaction) {
		//get user
		let user = interaction.options.getUser('user') ?? interaction.user;
		await interaction.deferReply();
		let user_avatar = await generate_avatar(user.id);
		await interaction.editReply({files:[user_avatar]});
	},
};
