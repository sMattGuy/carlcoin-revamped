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
				let user_buildings = await list[i].getBuildings(list[i]);
				let currentValue = list[i].balance;
				for(let j=0;j<user_buildings.length;j++){
					currentValue += user_buildings[j].building.cost * user_buildings[j].amount;
				}
				message += `${i+1}. ${username}: ${currentValue}\n`;
			} catch(e){
				console.log('failed to get username');
			}
		}
		await interaction.editReply({content:codeBlock(`${message}`)});
	},
};
