const { SlashCommandBuilder, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats, giveLevels } = require('../../helper.js');

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
		let usedCards = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
		
		let dealerCards = [];
		let playerCards = [];
		//dealer
		drawCard(dealerCards);
		drawCard(dealerCards);
		//player
		drawCard(playerCards);
		drawCard(playerCards);
				
		//check instant win
		if(getCardValue(playerCards) == 21){
			endGame();
		}
		else if(getCardValue(dealerCards) == 21){
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
				
			let cardValue = [1,2,3,4,5,6,7,8,9,10,10,10,10];
			let dealerValue = cardValue[dealerCards[0]%13];
			if(dealerValue == 1){
				dealerValue = 11;
			}
			let playerValue = getCardValue(playerCards);
			
			const boardEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle(`Current Table`)
				.addFields(
					{name: `Dealer (${dealerValue})`, value: `${blackjackCards[dealerCards[0]]}, ??`},
					{name: `You (${playerValue})`, value: `${getPrettyCards(playerCards)}`},
				);
			await interaction.reply({embeds:[boardEmbed],components:[row]});
			let collector = new InteractionCollector(interaction.client,{time: 60000 });
			collector.once('collect', async i => {
				if(i.message.interaction.id != interaction.id || i.user.id != interaction.user.id || !i.isButton()) return;
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
			collector.once('end', async i=> {
				await interaction.editReply({components:[]});
			});
			
			//player functions
			async function hit(){
				drawCard(playerCards);
				let cardValue = getCardValue(playerCards);
				if(cardValue >= 21){
					//busted or at 21
					endGame();
				}
				else{
					let cardValue = [1,2,3,4,5,6,7,8,9,10,10,10,10];
					let dealerValue = cardValue[dealerCards[0]%13];
					if(dealerValue == 1){
						dealerValue = 11;
					}
					let playerValue = getCardValue(playerCards);
					
					const hitEmbed = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle(`Current Table`)
						.setDescription(`Hit! You pulled ${blackjackCards[playerCards[playerCards.length-1]]}. You now have ${playerValue}`)
						.addFields(
							{name: `Dealer (${dealerValue})`, value: `${blackjackCards[dealerCards[0]]}, ??`},
							{name: `You (${playerValue})`, value: `${getPrettyCards(playerCards)}`},
						);
					
					await interaction.editReply({embeds:[hitEmbed],components:[row]});
					collector = new InteractionCollector(interaction.client, { time: 60000 });
					collector.once('collect', async i => {
						if(i.message.interaction.id != interaction.id || i.user.id != interaction.user.id || !i.isButton()) return;
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
					collector.once('end', async i=> {
						await interaction.editReply({components:[]});
					});
				}
			}
			async function stand(){
				let dealerTotal = getCardValue(dealerCards);
				while(dealerTotal < 17){
					drawCard(dealerCards);
					dealerTotal = getCardValue(dealerCards);
				}
				endGame();
			}
			async function endGame(){
				let playerCardValue = getCardValue(playerCards);
				let dealerCardValue = getCardValue(dealerCards);
				if(playerCardValue > 21){
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
						.setTitle(`It's a draw!`)
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
		function drawCard(cardArray){
			let newCard = (Math.floor(Math.random() * 52));
			while(usedCards[newCard]){
				newCard = (Math.floor(Math.random() * 52));
			}
			usedCards[newCard] == true;
			cardArray.push(newCard);
		}
		
		async function lose(){
			let dealerCardValue = getCardValue(dealerCards);
			let playerCardValue = getCardValue(playerCards);
			const loseEmbed = new EmbedBuilder()
				.setColor(0xff293b)
				.setTitle(`You lost!`)
				.addFields(
					{name: `Dealer (${dealerCardValue})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${playerCardValue})`, value: `${getPrettyCards(playerCards)}`},
				);
			//dealer wins
			await interaction.editReply({embeds:[loseEmbed],components:[]});
			user_data.balance -= betAmount;
			user_stats.sanity -= betAmount;
			if(user_stats.sanity < -100){
				//kill user
				user_data.killUser(user_data);
				const deathEmbed = new EmbedBuilder()
					.setColor(0xff293b)
					.setTitle(`You have died!`)
					.setDescription(`Your mental health has dipped too low. You wander into the abyss and never return... You've lost everything!`);
				await interaction.followUp({embeds:[deathEmbed]});
			}
			else{
				user_data.save();
				user_stats.save();
			}
			return;
		}
		async function win(){
			//player wins
			let dealerCardValue = getCardValue(dealerCards);
			let playerCardValue = getCardValue(playerCards);
			const winEmbed = new EmbedBuilder()
				.setColor(0x3bff29)
				.setTitle(`You win!`)
				.addFields(
					{name: `Dealer (${dealerCardValue})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${playerCardValue})`, value: `${getPrettyCards(playerCards)}`},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			user_data.balance += betAmount;
			user_stats.sanity += betAmount
			if(user_stats.sanity > 100){
				user_stats.sanity = 100;
			}
			user_data.save();
			await giveLevels(user_stats, Math.floor(betAmount/2), interaction);
			user_stats.save();
			return;
		}
	},
};