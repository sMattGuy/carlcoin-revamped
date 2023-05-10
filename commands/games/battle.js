const { ButtonStyle, SlashCommandBuilder, codeBlock, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats, giveLevels, killUser } = require('../../helper.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('battle')
		.setDescription('Challenge another user to a battle!')
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
		//assign challenger
		let challengerID = interaction.user.id;
		let challengerName = interaction.user.username;
		let challenger = interaction.user;
		
		let optionOpp = await interaction.options.getUser('user');
		let opponentID = optionOpp.id;
		let opponentName = optionOpp.username;
		
		let bet_amount = await interaction.options.getInteger('amount');
		//check if trying to battle self
		if(opponentID == challengerID){
			await interaction.reply({content:'You cannot fight yourself!',ephemeral: true});
			return;
		}
		if(optionOpp.bot){
			await interaction.reply({content: `Robots don't like fighting!`,ephemeral: true});
			return;
		}
		
		//get user and challenger
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		
		let enemy_data = await get_user(opponentID);
		let enemy_stats = await get_user_stats(opponentID);
		
		if(user_data.balance < bet_amount){
			await interaction.reply({content: 'You don\'t have enough coins!', ephemeral:true});
			return;
		}
		if(enemy_data.balance < bet_amount){
			await interaction.reply({content: 'Your opponent doesn\'t have enough coins!', ephemeral:true});
			return;
		}
		await interaction.reply(`Starting Battle`);
		//get the acceptance of battle
		const startFilter = i => i.user.id === opponentID && (i.customId === 'accept' || i.customId === 'deny');
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
		const accCollector = await interaction.channel.createMessageComponentCollector({filter:startFilter, time: 60000, max:1});
		await interaction.editReply({content:`${optionOpp}! You have been challenged to a BATTLE with ${bet_amount}CC on the line! Click 'accept' to accept the battle, or 'deny' to refuse the battle! You have 1 min to respond!`,components:[accRow]}).then(msg => {
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
					return;
				}
			});
		});
		async function acceptRPS(){
			let challengerHealth = 10 + (3 * (user_stats.level - 1)) + user_stats.defense;
			let opponentHealth = 10 + (3 * (enemy_stats.level - 1)) + enemy_stats.defense;
			
			//begin battle
			interaction.editReply({content:`Fighters, check your DM's!`,components:[]});
			
			const challDM = await challenger.createDM();
			const oppDM = await optionOpp.createDM();
			
			doAttack(challenger, challDM, user_stats, challengerHealth, optionOpp, oppDM, enemy_stats, opponentHealth);
			async function doAttack(RoundAttacker, RoundAttackerDM, RoundAttackerStats, RoundAttackerHealth, RoundDefender, RoundDefenderDM, RoundDefenderStats, RoundDefenderHealth){
				let damageCalc = 0;
				const defendFilter = i => i.customId === 'defend' || i.customId === 'evade';
				const defendRow = new ActionRowBuilder()
					.addComponents(
					new ButtonBuilder()
						.setCustomId('defend')
						.setLabel('Defend')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('evade')
						.setLabel('Evade')
						.setStyle(ButtonStyle.Primary),
				);
				const attackFilter = i => i.customId === 'attack';
				const attackRow = new ActionRowBuilder()
					.addComponents(
					new ButtonBuilder()
						.setCustomId('attack')
						.setLabel('Attack')
						.setStyle(ButtonStyle.Primary),
				);
				const attackerCollector = await RoundAttackerDM.createMessageComponentCollector({attackFilter,time:60000,max:1});
				RoundAttacker.send({content:codeBlock(`Select an option!\nYour HP:${RoundAttackerHealth}\nATK:${RoundAttackerStats.strength} DEF:${RoundAttackerStats.defense} EVD:${RoundAttackerStats.evade}\nEnemy HP:${RoundDefenderHealth}\nATK:${RoundDefenderStats.strength} DEF:${RoundDefenderStats.defense} EVD:${RoundDefenderStats.evade}`),components:[attackRow]}).then(challMsg => {
					attackerCollector.once('collect', async bi => {
						damageCalc = 0;
						let maxDamage = 6 + RoundAttackerStats.strength;
						damageCalc = Math.floor(Math.random()*maxDamage)+1;
						if(damageCalc < 0)
							damageCalc = 0;
						bi.update({content:codeBlock(`You rolled ${damageCalc} for attack! Let's see what your opponent does...`),components:[]});
						
						//start opponents choice
						if(damageCalc == 0){	
							let filler = `Your opponent missed! (rolled ${damageCalc})`;
							RoundDefender.send({content:codeBlock(filler)});
							doAttack(RoundDefender, RoundDefenderDM, RoundDefenderStats, RoundDefenderHealth, RoundAttacker, RoundAttackerDM, RoundAttackerStats, RoundAttackerHealth);
						}
						else{
							const defenderCollector = await RoundDefenderDM.createMessageComponentCollector({defendFilter,time:60000,max:1});
							let filler = `Your opponent rolled a ${damageCalc}!`;
							
							RoundDefender.send({content:codeBlock(`Select an option! ${filler}\nYour HP:${RoundDefenderHealth}\nATK:${RoundDefenderStats.strength} DEF:${RoundDefenderStats.defense} EVD:${RoundDefenderStats.evade}\nEnemy HP:${RoundAttackerHealth}\nATK:${RoundAttackerStats.strength} DEF:${RoundAttackerStats.defense} EVD:${RoundAttackerStats.evade}`),components:[defendRow]}).then(oppMsg => {
								defenderCollector.once('collect', async obi => {
									let defenseAmount = 0
									if(obi.customId == 'defend'){
										let maxDefense = 6 + RoundDefenderStats.defense;
										defenseAmount = Math.floor(Math.random()*maxDefense)+1;
										damageCalc -= defenseAmount;
										if(damageCalc <= 0)
											damageCalc = 1;
									}
									else{
										//evade
										let maxEvade = 6 + RoundDefenderStats.evade;
										defenseAmount = Math.floor(Math.random()*maxEvade)+1;
										if(defenseAmount > damageCalc)
											damageCalc = 0;
									}
									
									let DefenderTurnDescription = `You rolled a ${defenseAmount}! You took ${damageCalc} damage!`;
									let AttackerTurnDescription = `Your opponent rolled a ${defenseAmount}! You dealt ${damageCalc} damage!`;
									
									await bi.editReply({content:codeBlock(AttackerTurnDescription),components:[]});
									await obi.update({content:codeBlock(DefenderTurnDescription),components:[]});
									
									RoundDefenderHealth -= damageCalc;
							
									if(RoundDefenderHealth <= 0){
										//oppoenent has died
										await bi.editReply({content:codeBlock(`Your opponent has died, you have won!`),components:[]});
										await obi.editReply({content:codeBlock(`You have died, GAMEOVER!`),components:[]});

										if(RoundAttacker == challenger){
											await interaction.editReply({content:`${challengerName} has defeated ${opponentName}!`});
											update_users(user_data, user_stats, enemy_data, enemy_stats);
										}
										else{
											await interaction.editReply({content:`${opponentName} has defeated ${challengerName}!`});
											update_users(enemy_data, enemy_stats, user_data, user_stats);
										}
										return;
									}
									doAttack(RoundDefender, RoundDefenderDM, RoundDefenderStats, RoundDefenderHealth, RoundAttacker, RoundAttackerDM, RoundAttackerStats, RoundAttackerHealth);
								});
								defenderCollector.once('end',async collected => {
									if(collected.size == 0){
										oppMsg.delete()
										await interaction.editReply(`Opponent didn't respond in time!`);
										if(RoundAttacker == challenger){
											//opponent didnt respond
											update_users(user_data, user_stats, enemy_data, enemy_stats);
										}
										else{
											//challenger didnt respond
											update_users(enemy_data, enemy_stats, user_data, user_stats);
										}
									}
								});
							});
						}
					});
					attackerCollector.once('end',async collected => {
						if(collected.size == 0){
							interaction.editReply(`Challenger didn't respond in time!`);
							challMsg.delete();
							if(RoundAttacker == challenger){
								//opponent didnt respond
								update_users(user_data, user_stats, enemy_data, enemy_stats);
							}
							else{
								//challenger didnt respond
								update_users(enemy_data, enemy_stats, user_data, user_stats);
							}
						}
					});
				});
			}
		}
		async function update_users(winner, winner_stats, loser, loser_stats){
			//update winner
			winner.balance += bet_amount;
			winner_stats.sanity += bet_amount;
			if(winner_stats.sanity > 100){
				winner_stats.sanity = 100;
			}
			winner.save();
			await giveLevels(winner_stats, Math.floor(bet_amount/2), interaction);
			winner_stats.save();
			//update loser
			let prev_sanity = loser_stats.sanity;
			loser.balance -= bet_amount;
			loser_stats.sanity -= bet_amount;
			if(prev_sanity >= 0 && loser_stats.sanity < 0){
				const insaneEmbed = new EmbedBuilder()
					.setColor(0xff293b)
					.setTitle(`Be careful!`)
					.setDescription(`Your mental fortitude is starting to slip... You dont have death protection anymore!`);
				await interaction.followUp({embeds:[insaneEmbed]});
			}
			if(loser_stats.sanity <= -50){
				const insaneEmbed = new EmbedBuilder()
					.setColor(0xff293b)
					.setTitle(`Something doesn't feel right...`)
					.setDescription(`You've gone insane! Either wait some time or take a Sanity Pill!`);
				await interaction.followUp({embeds:[insaneEmbed]});
			}
			if(loser_stats.sanity < -100){
				if(prev_sanity >= 0){
					loser_stats.sanity = -99;
					const insaneEmbed = new EmbedBuilder()
						.setColor(0xff293b)
						.setTitle(`You nearly died!`)
						.setDescription(`Betting that much made you sick in the head! Take a break for a bit before betting again!`);
					await interaction.followUp({embeds:[insaneEmbed]});
					loser.save();
					loser_stats.save();
				}
				else{
					killUser(loser, loser_stats, interaction);
				}
			}
			else{
				loser.save();
				loser_stats.save();
			}
		}
	}
}
