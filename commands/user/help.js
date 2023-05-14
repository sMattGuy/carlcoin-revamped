const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Gives you a link to the Wiki!'),
	async execute(interaction) {
		const helpEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setDescription(`Here is a link to the Wiki! https://matthewflammia.xyz/mediawiki`);
		await interaction.reply({embeds:[helpEmbed],ephemeral:true});
	},
};
