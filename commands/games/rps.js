const { ButtonStyle, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { get_user, get_user_stats, giveLevels, changeSanity } = require('../../helper.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription('Challenge another to RPS!')
		.addUserOption(option => 
			option
				.setName("user")
				.setDescription("Who you want to challenge")
				.setRequired(true))
		.addIntegerOption(option => 
			option.setName('amount')
				.setDescription('The amount you want to bet')
				.setMinValue(1)
				.setRequired(true)),
	async execute(interaction) {
		let enemy_user = await interaction.options.getUser('user');
		let bet_amount = await interaction.options.getInteger('amount');
		//check if trying to battle self
		if(enemy_user.id == interaction.user.id){
			await interaction.reply({content:'You cannot fight yourself!',ephemeral: true});
			return;
		}
		if(enemy_user.bot){
			await interaction.reply({content: `Robots don't like RPS!`,ephemeral: true});
			return;
		}
		
		//get user and challenger
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		
		let enemy_data = await get_user(enemy_user.id);
		let enemy_stats = await get_user_stats(enemy_user.id);
		
		if(user_data.balance < bet_amount){
			await interaction.reply({content: 'You don\'t have enough coins!', ephemeral:true});
			return;
		}
		if(enemy_data.balance < bet_amount){
			await interaction.reply({content: 'Your opponent doesn\'t have enough coins!', ephemeral:true});
			return;
		}
		
		await interaction.reply(`Starting RPS`);
		//get the acceptance of battle
		const startFilter = i => i.user.id === enemy_user.id && (i.customId === 'accept' || i.customId === 'deny');
		const accRow = new ActionRowBuilder()
			.addComponents(
			new ButtonBuilder()
				.setCustomId('accept')
				.setLabel('Accept')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('deny')
				.setLabel('Deny')
				.setStyle(ButtonStyle.Danger),
		);
		const accCollector = await interaction.channel.createMessageComponentCollector({filter:startFilter, time: 60000});
		await interaction.editReply({content:`${enemy_user}! You have been challenged to RPS with ${bet_amount}CC on the line! Click 'accept' to accept the rock paper scissors battle, or 'deny' to refuse the battle! You have 1 min to respond!`,components:[accRow]}).then(msg => {
			accCollector.once('collect', async buttInteraction => {
				if(buttInteraction.customId == 'accept'){
					acceptRPS();
				}
				else if(buttInteraction.customId == 'deny'){
					await buttInteraction.update({content:`You have declined the game!`,components:[]});
					return;
				}
			});
			accCollector.once('end',async collected => {
				if(collected.size == 0){
					await interaction.editReply({content:'Opponent didn\'t respond!',components:[]}).catch(e => console.log('no interaction exists'));
				}
			});
		});
		async function acceptRPS(){
			//begin battle
			interaction.editReply({content:`Getting challengers throw, please wait!`,components:[]});
			const filter = i => i.customId === 'rock' || i.customId === 'paper' || i.customId === 'scissors';
			const gameRow = new ActionRowBuilder()
				.addComponents(
				new ButtonBuilder()
					.setCustomId('rock')
					.setLabel('Rock')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('paper')
					.setLabel('Paper')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('scissors')
					.setLabel('Scissors')
					.setStyle(ButtonStyle.Primary),
			);
			const challDM = await interaction.user.createDM();
			const oppDM = await enemy_user.createDM();
			const challengerCollector = await challDM.createMessageComponentCollector({filter,time:60000});
			const opponentCollector = await oppDM.createMessageComponentCollector({filter,time:60000});
			interaction.user.send({content:`Select a throw!`,components:[gameRow]}).then(challMsg => {
				challengerCollector.once('collect', async bi => {
					bi.update({content:`Got it, going to get opponents throw now`,components:[]});
					enemy_user.send({content:`Select a throw!`,components:[gameRow]}).then(oppMsg => {
						opponentCollector.once('collect', async obi => {
							await bi.editReply({content:`Go back to the channel you were challenged to see who wins!`,components:[]});
							await obi.update({content:`Go back to the channel you were challenged to see who wins!`,components:[]});
							
							user_data = await get_user(interaction.user.id);
							user_stats = await get_user_stats(interaction.user.id);
							enemy_data = await get_user(enemy_user.id);
							enemy_stats = await get_user_stats(enemy_user.id);
							
							let challThrow = bi.customId;
							let oppThrow = obi.customId;
							if(challThrow != 'rock' && challThrow != 'scissors' && challThrow != 'paper' && oppThrow != 'rock' && oppThrow != 'scissors' && oppThrow != 'paper'){
								await interaction.editReply(`Someone didn't choose correctly, the match is canceled!`);
							}
							else if((challThrow == 'rock' && oppThrow == 'scissors')||(challThrow == 'scissors' && oppThrow == 'paper')||(challThrow == 'paper' && oppThrow == 'rock')){
								await interaction.editReply({content:`${interaction.user.username} threw ${challThrow}, ${enemy_user.username} threw ${oppThrow}\n${interaction.user.username} won!`});
								update_users(user_data, user_stats, enemy_data, enemy_stats);
							}
							else if(challThrow == oppThrow){
								await interaction.editReply({content:`${interaction.user.username} threw ${challThrow}, ${enemy_user.username} threw ${oppThrow}\nIt's a tie!`});
							}
							else{
								await interaction.editReply({content:`${interaction.user.username} threw ${challThrow}, ${enemy_user.username} threw ${oppThrow}\n${enemy_user.username} won!`});
								update_users(enemy_data, enemy_stats, user_data, user_stats);
							}
							async function update_users(winner, winner_stats, loser, loser_stats){
								//update winner
								winner.balance += bet_amount;
								await winner.save();
								await changeSanity(winner,winner_stats,interaction,bet_amount);
								await giveLevels(winner_stats, Math.floor(bet_amount/2), interaction);
								//update loser
								loser.balance -= bet_amount;
								await loser.save();
								await changeSanity(loser,loser_stats,interaction,-bet_amount);
							}
						});
						opponentCollector.once('end',async collected => {
							if(collected.size == 0){
								await interaction.editReply(`Opponent didn't respond in time!`);
								oppMsg.delete();
							}
						});
					});
				});
				challengerCollector.once('end',async collected => {
					if(collected.size == 0){
						await interaction.editReply(`Challenger didn't respond in time!`);
						challMsg.delete();
					}
				});
			});
		}
	}
}
