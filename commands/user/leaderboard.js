const { SlashCommandBuilder, codeBlock } = require('discord.js');
const { Users } = require('../../dbObjects.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('See the top 10 richest!'),
	async execute(interaction) {
		let list = await Users.findAll();
		let userArray =  [];
		await interaction.deferReply();
		for(let i=0;i<list.length;i++){
			try{
				const username = await interaction.guild.members.fetch(list[i].user_id).then(userf => {return userf.displayName});
				let user_buildings = await list[i].getBuildings(list[i]);
				let currentValue = list[i].balance;
				for(let j=0;j<user_buildings.length;j++){
					currentValue += user_buildings[j].building.cost * user_buildings[j].amount;
				}
				userArray.push({'name':username,'balance':currentValue});
			} catch(e){
				console.log('failed to get username');
			}
		}
		userArray.sort(function (a,b){
			return (parseInt(b.balance) - parseInt(a.balance));
		});
		let message = 'Top 10 Carlcoin Earners\n';
		for(let i=0;i<10;i++){
			message += `${i+1}. ${userArray[i].name}: ${userArray[i].balance}\n`;
		}
		await interaction.editReply({content:codeBlock(`${message}`)});
	},
};
