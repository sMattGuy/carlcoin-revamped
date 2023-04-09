const { SlashCommandBuilder, codeBlock } = require('discord.js');
const { Users } = require('../../dbObjects.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('See the top 10 richest!'),
	async execute(interaction) {
		let list = await Users.findAll({order:[['balance','DESC']], limit: 10});
		let message = `Top 10 Carlcoiners\n`;
		await interaction.deferReply();
		for(let i=0;i<list.length;i++){
			try{
				const username = await interaction.guild.members.fetch(list[i].user_id).then(userf => {return userf.displayName});
				message += `${i+1}. ${username}: ${list[i].balance}\n`;
			} catch(e){
				console.log('failed to get username');
			}
		}
		await interaction.editReply({content:codeBlock(`${message}`)});
	},
};