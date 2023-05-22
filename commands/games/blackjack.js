const { SlashCommandBuilder, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats, giveLevels, changeSanity } = require('../../helper.js');

const blackjackCards = ['♠A','♠2','♠3','♠4','♠5','♠6','♠7','♠8','♠9','♠10','♠J','♠Q','♠K','♥A','♥2','♥3','♥4','♥5','♥6','♥7','♥8','♥9','♥10','♥J','♥Q','♥K','♦A','♦2','♦3','♦4','♦5','♦6','♦7','♦8','♦9','♦10','♦J','♦Q','♦K','♣A','♣2','♣3','♣4','♣5','♣6','♣7','♣8','♣9','♣10','♣J','♣Q','♣K'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription('Lets you play blackjack!')
		.addIntegerOption(option => 
			option.setName('amount')
				.setDescription('The amount you want to bet')
				.setMinValue(1)
				.setRequired(true)),
	async execute(interaction) {
		//get user
		let user = await get_user(interaction.user.id);
		let betAmount = interaction.options.getInteger('amount');
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		
		if(user_data.balance < betAmount){
			await interaction.reply({content: 'You don\'t have enough coins!', ephemeral:true});
			return;
		}
		await interaction.deferReply();
		let usedCards = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
		
		let dealerCards = [];
		let playerCards = [];
		let playingGame = false;
		let int_check_success = false;
		let luck_chance = false;
		let luck_message = '';
		if(Math.random() > .90 && user_stats.luck != 0){
			luck_chance = true;
			luck_message = 'Luck is on your side!';
		}
		//dealer
		drawCard(dealerCards, 0, false);
		drawCard(dealerCards, 0, false);
		//player
		drawCard(playerCards, user_stats.luck, luck_chance);
		drawCard(playerCards, user_stats.luck, luck_chance);
		let naturalWin = false;	
		let got_insurance = false;
		let insuranceWin = false;
		let insuranceAmount = Math.floor(betAmount/2);
		//check if insurance can be used this game
		if(dealerCards[0]%13 == 0 && user_data.balance >= betAmount+insuranceAmount){
			//dealer shown card is an ace, prompt the user if they want insurance
			let playerValue = getCardValue(playerCards);
			if(playerValue == 21){
				//player has a natural
				playBlackjack();
			}
			else{
				let user_ins_cards = getPrettyCards(playerCards);
				/*
				if(user_stats.sanity <= -50){
					user_ins_cards = `??, ??`;
				}
				*/
				const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('insurance')
						.setLabel(`Insure Bet`)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('continue')
						.setLabel('Play Hand')
						.setStyle(ButtonStyle.Secondary),
				);
				const boardEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle(`Want Insurance?`)
					.setDescription(`The dealers upcard is an ace! Want to insure your bet for ${insuranceAmount}CC?`)
					.addFields(
						{name: `Dealer (11)`, value: `${blackjackCards[dealerCards[0]]}, ??`},
						{name: `You (${playerValue})`, value: `${user_ins_cards}`},
					);
			
				await interaction.editReply({embeds:[boardEmbed],components:[row]});
				let filter = i => i.user.id == interaction.user.id && i.isButton();
				let message = await interaction.fetchReply();
				let insurance_collector = message.createMessageComponentCollector({time: 45000, filter});
				insurance_collector.on('collect', async i => {
					playingGame = true;
					insurance_collector.stop();
					await i.update({components:[]});
					if(i.customId == 'insurance'){
						//user got insurance
						got_insurance = true;
						if(getCardValue(dealerCards) == 21){
							//dealer has 21, insurance worked
							insuranceWin = true;
							endGame();
						}
						else{
							//insurance was a failure, game continues as normal
							playBlackjack();
						}
					}
					else if(i.customId == 'continue'){
						//user decided to play the game normally
						playBlackjack();
					}
					else{
						//something strange happened
						console.log('im not supposed to be here')
					}
				});
				insurance_collector.on('end', async i=> {
					await interaction.editReply({components:[]});
					if(!playingGame){
						playingGame = true;
						//user timed out, auto loss
						const timeEmbed = new EmbedBuilder()
							.setColor(0xf5bf62)
							.setTitle(`You didn't respond in time!`)
							.setDescription(`Not responding counts as a loss!`)
						await interaction.followUp({embeds:[timeEmbed]});
						lose();
					}
				});
			}
		}
		else{
			//continue game as normal
			playBlackjack();
		}
		async function playBlackjack(){
			//check instant win
			if(getCardValue(playerCards) == 21){
				naturalWin = true;
				endGame();
			}
			else if(getCardValue(dealerCards) == 21){
				naturalWin = true;
				endGame();
			}
			else{
				//game didnt end right away, start running the main game
				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('hit')
							.setLabel('Hit')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('stand')
							.setLabel('Stand')
							.setStyle(ButtonStyle.Secondary),
					);
					
				const firstrow = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('hit')
							.setLabel('Hit')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('stand')
							.setLabel('Stand')
							.setStyle(ButtonStyle.Secondary),
					);
				if(user_data.balance-(2*betAmount) >= 0){
					firstrow.addComponents(
						new ButtonBuilder()
							.setCustomId('double')
							.setLabel('Double Down')
							.setStyle(ButtonStyle.Secondary),
					);
				}
				let cardValue = [1,2,3,4,5,6,7,8,9,10,10,10,10];
				let dealerValue = cardValue[dealerCards[0]%13];
				if(dealerValue == 1){
					dealerValue = 11;
				}
				let playerValue = getCardValue(playerCards);
				
				const boardEmbed = new EmbedBuilder();
				//sanity check
				/*
				if(user_stats.sanity <= -50){
					//debuff user for being crazy
					boardEmbed
						.setColor(0xf5bf62)
						.setTitle(`Current Table.`)
						.setDescription(`Something doesn't feel right... You can't comprehend your cards!`)
						.addFields(
							{name: `Dealer (${dealerValue})`, value: `${blackjackCards[dealerCards[0]]}, ??`},
							{name: `You (??)`, value: `??, ??`},
						);
				}
				*/
				//int check else
				let intChance = 0.90 - (user_stats.intel * 0.01);
				if(intChance <= 0.8){
					intChance = 0.8;
				}
				if(user_stats.intel != 0 && Math.random() > intChance){
					dealerValue = getCardValue(dealerCards);
					int_check_success = true;
					boardEmbed
						.setColor(0xf5bf62)
						.setTitle(`Current Table. ${luck_message}`)
						.setDescription(`Your INT helps you count the cards... You're sure the dealer has this hand!`)
						.addFields(
							{name: `Dealer (${dealerValue})`, value: `${getPrettyCards(dealerCards)}`},
							{name: `You (${playerValue})`, value: `${getPrettyCards(playerCards)}`},
						);
				}
				else{
					boardEmbed
						.setColor(0xf5bf62)
						.setTitle(`Current Table. ${luck_message}`)
						.addFields(
							{name: `Dealer (${dealerValue})`, value: `${blackjackCards[dealerCards[0]]}, ??`},
							{name: `You (${playerValue})`, value: `${getPrettyCards(playerCards)}`},
						);
				}
					
				await interaction.editReply({embeds:[boardEmbed],components:[firstrow]});
				let filter = i => i.user.id == interaction.user.id && i.isButton();
				let message = await interaction.fetchReply();
				let collector = message.createMessageComponentCollector({time: 45000, filter});
				collector.on('collect', async i => {
					playingGame = true;
					collector.stop();
					await i.update({components:[]});
					if(i.customId == 'hit'){
						hit();
					}
					else if(i.customId == 'stand'){
						stand();
					}
					else if(i.customId == 'double'){
						doubleDown();
					}
					else{
						//something strange happened
						console.log('im not supposed to be here')
					}
				});
				collector.on('end', async i=> {
					await interaction.editReply({components:[]});
					if(!playingGame){
						playingGame = true;
						//user timed out, auto loss
						const timeEmbed = new EmbedBuilder()
							.setColor(0xf5bf62)
							.setTitle(`You didn't respond in time!`)
							.setDescription(`Not responding counts as a loss!`)
						await interaction.followUp({embeds:[timeEmbed]});
						lose();
					}
				});
				
				//player functions
				async function hit(){
					let playingGameHit = false;
					drawCard(playerCards, user_stats.luck, luck_chance);
					let cardValue = getCardValue(playerCards);
					if(cardValue > 21){
						playingGameHit = true;
						//busted or at 21
						endGame();
					}
					else if(cardValue == 21){
						playingGameHit = true;
						stand();
					}
					else{
						let cardValue = [1,2,3,4,5,6,7,8,9,10,10,10,10];
						let dealerValue = cardValue[dealerCards[0]%13];
						let insaneCards = '';
						for(let i=0;i<playerCards.length;i++){
							if(i == playerCards.length-1){
								insaneCards += '??';
							}
							else{
								insaneCards += '??, ';
							}
						}
						if(dealerValue == 1){
							dealerValue = 11;
						}
						let playerValue = getCardValue(playerCards);
						
						const hitEmbed = new EmbedBuilder()
							.setColor(0xf5bf62)
							.setTitle(`Current Table. ${luck_message}`)
							.setDescription(`Hit! You pulled ${blackjackCards[playerCards[playerCards.length-1]]}. You now have ${playerValue}`)
						if(int_check_success){
							dealerValue = getCardValue(dealerCards);
							hitEmbed.addFields(
								{name: `Dealer (${dealerValue})`, value: `${getPrettyCards(dealerCards)}`},
								{name: `You (${playerValue})`, value: `${getPrettyCards(playerCards)}`},
							);
						}
						/*
						else if(user_stats.sanity <= -50){
							hitEmbed.addFields(
								{name: `Dealer (${dealerValue})`, value: `${blackjackCards[dealerCards[0]]}, ??`},
								{name: `You (??)`, value: `${insaneCards}`},
							);
						}
						*/
						else{
							hitEmbed.addFields(
								{name: `Dealer (${dealerValue})`, value: `${blackjackCards[dealerCards[0]]}, ??`},
								{name: `You (${playerValue})`, value: `${getPrettyCards(playerCards)}`},
							);
						}
						
						await interaction.editReply({embeds:[hitEmbed],components:[row]});
						let hitCollector = message.createMessageComponentCollector({ time: 45000, filter });
						hitCollector.on('collect', async i => {
							playingGameHit = true;
							hitCollector.stop();
							await i.update({components:[]});
							if(i.customId == 'hit'){
								hit();
							}
							else if(i.customId == 'stand'){
								stand();
							}
							else{
								//something strange happened
								console.log('im not supposed to be here')
							}
						});
						hitCollector.on('end', async i=> {
							await interaction.editReply({components:[]});
							if(!playingGameHit){
								playingGameHit = true;
								//user timed out, auto loss
								const timeEmbed = new EmbedBuilder()
									.setColor(0xf5bf62)
									.setTitle(`You didn't respond in time!`)
									.setDescription(`Not responding counts as a loss!`)
								await interaction.followUp({embeds:[timeEmbed]});
								lose();
							}
						});
					}
				}
				async function stand(){
					playingGame = true;
					let dealerTotal = getCardValue(dealerCards);
					while(dealerTotal < 17){
						drawCard(dealerCards, 0, false);
						dealerTotal = getCardValue(dealerCards);
					}
					endGame();
				}
				async function doubleDown(){
					playingGame = true;
					betAmount *= 2;
					drawCard(playerCards, user_stats.luck, luck_chance);
					let dealerTotal = getCardValue(dealerCards);
					while(dealerTotal < 17){
						drawCard(dealerCards, 0, false);
						dealerTotal = getCardValue(dealerCards);
					}
					endGame();
				}
			}
		}
		async function endGame(){
			playingGame = true;
			let playerCardValue = getCardValue(playerCards);
			let dealerCardValue = getCardValue(dealerCards);
			if(insuranceWin){
				//special function for insurance win
				win_insurance();
			}
			else if(playerCardValue > 21){
				//bust
				lose();
			}
			else if(dealerCardValue > 21){
				//dealer bust
				win();
			}
			else if(dealerCardValue == playerCardValue){
				//draw
				const drawEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle(`It's a draw! ${luck_message}`)
					.addFields(
						{name: `Dealer (${dealerCardValue})`, value: `${getPrettyCards(dealerCards)}`},
						{name: `You (${playerCardValue})`, value: `${getPrettyCards(playerCards)}`},
					);
				await interaction.editReply({embeds:[drawEmbed],components:[]});
			}
			else if(playerCardValue > dealerCardValue){
				//player wins
				win();
			}
			else{
				//player lost
				lose();
			}
			return;
		}
		//helper functions
		function getPrettyCards(cardArray){
			let prettyCards = [];
			cardArray.forEach(item => {
				prettyCards.push(blackjackCards[item]);
			});
			return prettyCards;
		}
		function getCardValue(cardArray){
			let value = 0;
			let cardValue = [1,2,3,4,5,6,7,8,9,10,10,10,10];
			let ace = false;
			cardArray.forEach(item => {
				if(0 == item%13){
					ace = true;
				}
				value += cardValue[item%13];
			});
			if(ace && value+10 <= 21){
				value += 10;
			}
			return value;
		}
		function drawCard(cardArray, luck, luckChance){
			let newCard = (Math.floor(Math.random() * 52));
			while(usedCards[newCard]){
				newCard = (Math.floor(Math.random() * 52));
			}
			if(luckChance){
				for(let i=0;i<luck;i++){
					let luckCard = (Math.floor(Math.random() * 52));
					while(usedCards[luckCard]){
						luckCard = (Math.floor(Math.random() * 52));
					}
					let tempArray = [...cardArray];
					tempArray.push(newCard);
					let luckArray = [...cardArray];
					luckArray.push(luckCard);
					let currentValue = getCardValue(tempArray);
					let luckValue = getCardValue(luckArray);
					if(luckValue > currentValue && luckValue <= 21){
						newCard = luckCard;
					}
				}
			}
			usedCards[newCard] = true;
			cardArray.push(newCard);
		}
		
		async function lose(){
			playingGame = true;
			let dealerCardValue = getCardValue(dealerCards);
			let playerCardValue = getCardValue(playerCards);
			if(got_insurance){
				betAmount += insuranceAmount;
			}
			const loseEmbed = new EmbedBuilder()
				.setColor(0xff293b)
				.setTitle(`You lost! ${luck_message}`)
				.setDescription(`You now have ${user_data.balance - betAmount}CC!`)
				.addFields(
					{name: `Dealer (${dealerCardValue})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${playerCardValue})`, value: `${getPrettyCards(playerCards)}`},
				);
			//dealer wins
			await interaction.editReply({embeds:[loseEmbed],components:[]});
			//attempt wisdom save
			let wisSaveChance = 0.95 - (user_stats.wisdom * 0.001);
			if(wisSaveChance <= 0.8){
				wisSaveChance = 0.8;
			}
			if(user_stats.wisdom != 0 && Math.random() > wisSaveChance){
				const wisSaveEmbed = new EmbedBuilder()
					.setColor(0xff293b)
					.setTitle(`But it never happened!`)
					.setDescription(`You had the WIS to know that this would have been a loss, so you never played in the first place!`);
				await interaction.followUp({embeds:[wisSaveEmbed],ephemeral:true});
				return;
			}
			//attempt evade save
			let evdSaveChance = 0.9 - (user_stats.evade * 0.001);
			if(evdSaveChance <= 0.80){
				evdSaveChance = 0.80;
			}
			else if(user_stats.evade != 0 && Math.random() > evdSaveChance){
				const evdSaveEmbed = new EmbedBuilder()
					.setColor(0xff293b)
					.setTitle(`But you're quick!`)
					.setDescription(`Using your EVD you quickly pocket half your bet back! You now have ${user_data.balance - Math.floor(betAmount/2)}CC`);
				betAmount = Math.floor(betAmount/2);
				await interaction.followUp({embeds:[evdSaveEmbed],ephemeral:true});
			}
			let prev_balance = user_data.balance;
			user_data.balance -= betAmount;
			await user_data.save();
			await changeSanity(user_data,user_stats,interaction,prev_balance,-betAmount);
			return;
		}
		async function win(){
			//player wins
			playingGame = true;
			let dealerCardValue = getCardValue(dealerCards);
			let playerCardValue = getCardValue(playerCards);
			if(naturalWin){
				betAmount = Math.floor(betAmount * 1.5)
			}	
			if(got_insurance){
				betAmount -= insuranceAmount
			}
			const winEmbed = new EmbedBuilder()
				.setColor(0x3bff29)
				.setTitle(`You win! ${luck_message}`)
				.setDescription(`You now have ${user_data.balance + betAmount}CC!`)
				.addFields(
					{name: `Dealer (${dealerCardValue})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${playerCardValue})`, value: `${getPrettyCards(playerCards)}`},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let prev_balance = user_data.balance;
			user_data.balance += betAmount;
			await user_data.save();
			//await changeSanity(user_data,user_stats,interaction,prev_balance,betAmount);
			await giveLevels(user_stats, Math.floor(betAmount/2), interaction);
			await user_stats.save();
			await give_lootbox(user_data, interaction);
			return;
		}
		async function win_insurance(){
			//player wins by insurance
			playingGame = true;
			let dealerCardValue = getCardValue(dealerCards);
			let playerCardValue = getCardValue(playerCards);
			const winEmbed = new EmbedBuilder()
				.setColor(0x3bff29)
				.setTitle(`Your insurance pays off!`)
				.setDescription(`Thanks to your insurance you avoided losing! You now have ${user_data.balance}CC!`)
				.addFields(
					{name: `Dealer (${dealerCardValue})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${playerCardValue})`, value: `${getPrettyCards(playerCards)}`},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let newSanity = betAmount + insuranceAmount;
			//await changeSanity(user_data,user_stats,interaction,user_data.balance,newSanity);
			await giveLevels(user_stats, Math.floor(betAmount/2), interaction);
			await user_stats.save();
			await give_lootbox(user_data, interaction);
			return;
		}
	},
};
