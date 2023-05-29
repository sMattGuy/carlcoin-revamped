const { SlashCommandBuilder, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats, giveLevels, changeSanity, give_lootbox, generate_avatar } = require('../../helper.js');
const { Hand } = require('pokersolver');

const card_icons = ['♠A','♠2','♠3','♠4','♠5','♠6','♠7','♠8','♠9','♠10','♠J','♠Q','♠K','♥A','♥2','♥3','♥4','♥5','♥6','♥7','♥8','♥9','♥10','♥J','♥Q','♥K','♦A','♦2','♦3','♦4','♦5','♦6','♦7','♦8','♦9','♦10','♦J','♦Q','♦K','♣A','♣2','♣3','♣4','♣5','♣6','♣7','♣8','♣9','♣10','♣J','♣Q','♣K'];
const card_codes = ['As','2s','3s','4s','5s','6s','7s','8s','9s','Ts','Js','Qs','Ks','Ah','2h','3h','4h','5h','6h','7h','8h','9h','Th','Jh','Qh','Kh','Ad','2d','3d','4d','5d','6d','7d','8d','9d','Td','Jd','Qd','Kd','Ac','2c','3c','4c','5c','6c','7c','8c','9c','Tc','Jc','Qc','Kc'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('videopoker')
		.setDescription('Lets you play Video Poker!')
		.addIntegerOption(option => 
			option.setName('bet')
				.setDescription('The amount you want to bet')
				.setMinValue(1)
				.setRequired(true)),
	async execute(interaction) {
		//get user
		let user = await get_user(interaction.user.id);
		let bet = interaction.options.getInteger('bet');
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		
		if(user_data.balance < bet){
			await interaction.reply({content: `You don't have enough coins!`, ephemeral:true});
			return;
		}
		
		await interaction.deferReply();
		let usedCards = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
		
		let playerCards = [];
		let playingGame = false;
		let cardsHeld = [0,0,0,0,0];
		
		let luck_chance = false;
		let luck_message = '';
		if(Math.random() > .90 && user_stats.luck != 0){
			luck_chance = true;
			luck_message = 'Luck is on your side!';
		}
		
		let avatar = await generate_avatar(interaction.user.id);
		//player
		drawCard(playerCards);
		drawCard(playerCards);
		drawCard(playerCards);
		drawCard(playerCards);
		drawCard(playerCards);
		//special luck function
		if(luck_chance){
			rollLuckyHand(playerCards, user_stats.luck);
		}
		let player_hand = getHandResults(playerCards, 'standard', false);
		
		//create buttons
		let card1Button = new ButtonBuilder()
			.setCustomId('card1')
			.setLabel('Held')
			.setStyle(ButtonStyle.Primary)
		let card2Button = new ButtonBuilder()
			.setCustomId('card2')
			.setLabel('Held')
			.setStyle(ButtonStyle.Primary)
		let card3Button = new ButtonBuilder()
			.setCustomId('card3')
			.setLabel('Held')
			.setStyle(ButtonStyle.Primary)
		let card4Button = new ButtonBuilder()
			.setCustomId('card4')
			.setLabel('Held')
			.setStyle(ButtonStyle.Primary)
		let card5Button = new ButtonBuilder()
			.setCustomId('card5')
			.setLabel('Held')
			.setStyle(ButtonStyle.Primary)
		let sendHandButton = new ButtonBuilder()
			.setCustomId('sendhand')
			.setLabel('Send Hand')
			.setStyle(ButtonStyle.Danger)
		
		//run program
		playVideoPoker();
		async function playVideoPoker(){
			playingGame = false;
			//create row for buttons
			const row = new ActionRowBuilder()
				.addComponents(
					card1Button,
					card2Button,
					card3Button,
					card4Button,
					card5Button,
				);
			const sendRow = new ActionRowBuilder()
				.addComponents(
					sendHandButton,
				);
			const boardEmbed = new EmbedBuilder();
			const pretty_holding = ['H','D']
			boardEmbed
				.setColor(0xf5bf62)
				.setTitle(`Current Table. ${luck_message}`)
				.setThumbnail('attachment://avatar.png')
				.setDescription(`Click to discard cards (H) means heald, (D) means discarded. when you're ready click Send Hand to submit it!`)
				.addFields(
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
					{name: `Card Status`, value: `${pretty_holding[cardsHeld[0]]}  |  ${pretty_holding[cardsHeld[1]]}  |  ${pretty_holding[cardsHeld[2]]}  |  ${pretty_holding[cardsHeld[3]]}  |  ${pretty_holding[cardsHeld[4]]}`},
				);
				
			await interaction.editReply({embeds:[boardEmbed],components:[row,sendRow],files:[avatar]});
			
			let filter = i => i.user.id == interaction.user.id && i.isButton();
			let message = await interaction.fetchReply();
			let videoPokerCollector = message.createMessageComponentCollector({time: 60000, filter});
			videoPokerCollector.on('collect', async i => {
				playingGame = true;
				await videoPokerCollector.stop();
				const cardRegex = new RegExp('card\\d')
				await i.update({components:[]});
				if(cardRegex.test(i.customId)){
					updateCardHold(i.customId);
					playVideoPoker();
				}
				else if(i.customId == 'sendhand'){
					endGame();
				}
				else{
					//something strange happened
					console.log('im not supposed to be here')
				}
			});
			videoPokerCollector.on('end', async i=> {
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
				await interaction.editReply({components:[]});
			});
		}
		function updateCardHold(cardToHold){
			let selectedCardValue = 0;
			if(cardToHold == 'card1'){
				selectedCard = card1Button;
				cardsHeld[0] = (cardsHeld[0] + 1)%2;
				selectedCardValue = cardsHeld[0];
			}
			else if(cardToHold == 'card2'){
				selectedCard = card2Button;
				cardsHeld[1] = (cardsHeld[1] + 1)%2;
				selectedCardValue = cardsHeld[1];
			}
			else if(cardToHold == 'card3'){
				selectedCard = card3Button;
				cardsHeld[2] = (cardsHeld[2] + 1)%2;
				selectedCardValue = cardsHeld[2];
			}
			else if(cardToHold == 'card4'){
				selectedCard = card4Button;
				cardsHeld[3] = (cardsHeld[3] + 1)%2;
				selectedCardValue = cardsHeld[3];
			}
			else if(cardToHold == 'card5'){
				selectedCard = card5Button;
				cardsHeld[4] = (cardsHeld[4] + 1)%2;
				selectedCardValue = cardsHeld[4];
			}
			if(selectedCardValue == 1){
				selectedCard.setLabel('Discarded');
				selectedCard.setStyle(ButtonStyle.Secondary);
			}
			else{
				selectedCard.setLabel('Held');
				selectedCard.setStyle(ButtonStyle.Primary);
			}
		}
		//helper functions
		function getPrettyCards(cardArray){
			let prettyCards = [];
			for(let i=0;i<cardArray.length;i++){
				let cardFace = card_icons[cardArray[i]];
				prettyCards.push(cardFace);
			}
			return prettyCards;
		}
		function drawCard(cardArray){
			let newCard = (Math.floor(Math.random() * 52));
			while(usedCards[newCard]){
				newCard = (Math.floor(Math.random() * 52));
			}
			usedCards[newCard] = true;
			cardArray.push(newCard);
		}
		function rollLuckyHand(cardArray, luck){
			for(i=0;i<luck;i++){
				//temp allow getting cards in hand ie puts cards back in deck
				usedCards[cardArray[0]] = false;
				usedCards[cardArray[1]] = false;
				usedCards[cardArray[2]] = false;
				usedCards[cardArray[3]] = false;
				usedCards[cardArray[4]] = false;
				//get 5 new cards, sets cards as used
				let tempArray = [];
				drawCard(tempArray);
				drawCard(tempArray);
				drawCard(tempArray);
				drawCard(tempArray);
				drawCard(tempArray);
				//compare hands
				let currentHand = getHandResults(cardArray, 'standard');
				let tempHand = getHandResults(tempArray, 'standard');
				if(tempHand.rank > currentHand.rank){
					//new hand is better just overwrite it
					cardArray = tempArray;
				}
				else{
					//old hand was better reverse used cards
					usedCards[tempArray[0]] = false;
					usedCards[tempArray[1]] = false;
					usedCards[tempArray[2]] = false;
					usedCards[tempArray[3]] = false;
					usedCards[tempArray[4]] = false;
					usedCards[cardArray[0]] = true;
					usedCards[cardArray[1]] = true;
					usedCards[cardArray[2]] = true;
					usedCards[cardArray[3]] = true;
					usedCards[cardArray[4]] = true;
				}
			}
		}
		function getPayoutModifier(hand){
			/*
				pays out if pair or better is gotten
				9. Royal Flush 1000 to 1
				9. Straight Flush		200 to 1
				8. Four of a Kind		50 to 1
				7. Full House		25 to 1
				6. Flush		20 to 1		
				5. Straight		10 to 1
			*/
			if(hand.rank == 9 && hand.descr == 'Royal Flush'){
				return 250;
			}
			else if(hand.rank == 9){
				return 50;
			}
			else if(hand.rank == 8){
				return 25;
			}
			else if(hand.rank == 7){
				return 9;
			}
			else if(hand.rank == 6){
				return 6;
			}
			else if(hand.rank == 5){
				return 4;
			}
			else if(hand.rank == 4){
				return 3;
			}
			else if(hand.rank == 3){
				return 2;
			}
			else if(hand.rank == 2){
				return 1;
			}
			else{
				return 0;
			}
		}
		//game specific functions
		function getHandResults(cardArray, game){
			let codedArray = [];
			for(let i=0;i<cardArray.length;i++){
				codedArray.push(card_codes[cardArray[i]]);
			}
			let hand = Hand.solve(codedArray, game);
			return hand;
		}
		
		//game ending helpers
		async function endGame(){
			//discard cards and draw new ones in its place
			if(cardsHeld[0] == 1){
				let newCard = (Math.floor(Math.random() * 52));
				while(usedCards[newCard]){
					newCard = (Math.floor(Math.random() * 52));
				}
				usedCards[newCard] = true;
				playerCards[0] = newCard;
			}
			if(cardsHeld[1] == 1){
				let newCard = (Math.floor(Math.random() * 52));
				while(usedCards[newCard]){
					newCard = (Math.floor(Math.random() * 52));
				}
				usedCards[newCard] = true;
				playerCards[1] = newCard;
			}
			if(cardsHeld[2] == 1){
				let newCard = (Math.floor(Math.random() * 52));
				while(usedCards[newCard]){
					newCard = (Math.floor(Math.random() * 52));
				}
				usedCards[newCard] = true;
				playerCards[2] = newCard;
			}
			if(cardsHeld[3] == 1){
				let newCard = (Math.floor(Math.random() * 52));
				while(usedCards[newCard]){
					newCard = (Math.floor(Math.random() * 52));
				}
				usedCards[newCard] = true;
				playerCards[3] = newCard;
			}
			if(cardsHeld[4] == 1){
				let newCard = (Math.floor(Math.random() * 52));
				while(usedCards[newCard]){
					newCard = (Math.floor(Math.random() * 52));
				}
				usedCards[newCard] = true;
				playerCards[4] = newCard;
			}
			player_hand = getHandResults(playerCards, 'standard', false);
			//win on pair of jacks or better
			if(player_hand.rank > 2){
				//better than pair
				win();
			}
			else if(player_hand.rank == 2 && player_hand.cards[0].rank >= 10){
				//win on pair of jacks or better
				win();
			}
			else{
				//player loses
				lose();
			}
		}
		//end game states
		async function lose(){
			playingGame = true;
			const loseEmbed = new EmbedBuilder()
				.setColor(0xff293b)
				.setTitle(`You lost!`)
				.setThumbnail('attachment://avatar.png')
				.setDescription(`You now have ${user_data.balance - bet}CC!`)
				.addFields(
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
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
				await interaction.followUp({embeds:[wisSaveEmbed], ephemeral: true});
				return;
			}
			
			//attempt evade save
			let evdSaveChance = 0.9 - (user_stats.evade * 0.001);
			if(evdSaveChance <= 0.8){
				evdSaveChance = 0.8;
			}
			else if(user_stats.evade != 0 && Math.random() > evdSaveChance){
				const evdSaveEmbed = new EmbedBuilder()
					.setColor(0xff293b)
					.setTitle(`But you're quick!`)
					.setDescription(`Using your EVD you quickly pocket half your bet back! You now have ${user_data.balance + Math.floor(bet/2)}CC`);
				bet = Math.floor(bet/2);
				await interaction.followUp({embeds:[evdSaveEmbed], ephemeral: true});
			}
			
			let prev_balance = user_data.balance;
			user_data.balance -= bet;
			let sanityDrain = Math.ceil(-bet * 1.5);
			await user_data.save();
			await changeSanity(user_data,user_stats,interaction,prev_balance,sanityDrain);
			return;
		}
		async function win(){
			//player wins
			playingGame = true;
			let payoutMod = getPayoutModifier(player_hand);
			bet *= payoutMod;
			const winEmbed = new EmbedBuilder()
				.setColor(0x3bff29)
				.setTitle(`You win! ${luck_message}`)
				.setThumbnail('attachment://avatar.png')
				.setDescription(`You now have ${user_data.balance + bet}CC!`)
				.addFields(
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let prev_balance = user_data.balance;
			user_data.balance += bet;
			await user_data.save();
			await giveLevels(user_stats, Math.floor(bet/2), interaction);
			user_stats.save();
			await give_lootbox(user_data, interaction);
			return;
		}
	},
};
