const { SlashCommandBuilder, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, InteractionCollector } = require('discord.js');
const { get_user, get_user_stats, giveLevels, changeSanity } = require('../../helper.js');
const { Hand } = require('pokersolver');

const card_icons = ['♠A','♠2','♠3','♠4','♠5','♠6','♠7','♠8','♠9','♠10','♠J','♠Q','♠K','♥A','♥2','♥3','♥4','♥5','♥6','♥7','♥8','♥9','♥10','♥J','♥Q','♥K','♦A','♦2','♦3','♦4','♦5','♦6','♦7','♦8','♦9','♦10','♦J','♦Q','♦K','♣A','♣2','♣3','♣4','♣5','♣6','♣7','♣8','♣9','♣10','♣J','♣Q','♣K'];
const card_codes = ['As','2s','3s','4s','5s','6s','7s','8s','9s','Ts','Js','Qs','Ks','Ah','2h','3h','4h','5h','6h','7h','8h','9h','Th','Jh','Qh','Kh','Ad','2d','3d','4d','5d','6d','7d','8d','9d','Td','Jd','Qd','Kd','Ac','2c','3c','4c','5c','6c','7c','8c','9c','Tc','Jc','Qc','Kc'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('threecard')
		.setDescription('Lets you play three card poker!')
		.addIntegerOption(option => 
			option.setName('ante')
				.setDescription('The amount you want to bet, this will be doubled if you decide to play the hand')
				.setMinValue(1)
				.setRequired(true))
		.addIntegerOption(option => 
			option.setName('pairplus')
				.setDescription('A bonus bet given if you get a pair or better, regardless of winning')
				.setMinValue(0)
				.setRequired(false))
		.addIntegerOption(option => 
			option.setName('sixcardbonus')
				.setDescription('A bonus bet made out of your cards and the dealers based on highest 5 cards, regardless of winning')
				.setMinValue(0)
				.setRequired(false)),
	async execute(interaction) {
		//get user
		let user = await get_user(interaction.user.id);
		let ante_bet = interaction.options.getInteger('ante');
		let pair_plus_bet = interaction.options.getInteger('pairplus') ?? 0;
		let six_card_bet = interaction.options.getInteger('sixcardbonus') ?? 0;
		
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		
		let total_possible_bet = ante_bet + ante_bet + pair_plus_bet + six_card_bet;
		if(user_data.balance < total_possible_bet){
			await interaction.reply({content: `You don't have enough coins!`, ephemeral:true});
			return;
		}
		await interaction.deferReply();
		let usedCards = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
		
		let dealerCards = [];
		let playerCards = [];
		let playingGame = false;
		let int_check_success = false;
		//dealer
		drawCard(dealerCards, 0);
		drawCard(dealerCards, 0);
		drawCard(dealerCards, 0);
		//player
		drawCard(playerCards, user_stats.luck);
		drawCard(playerCards, user_stats.luck);
		drawCard(playerCards, user_stats.luck);
		
		const player_hand = getHandResults(playerCards, 'threecard', false);
		const dealer_hand = getHandResults(dealerCards, 'threecard', true);
		let playerAndDealer = [dealerCards[0],dealerCards[1],dealerCards[2],playerCards[0],playerCards[1],playerCards[2]];
		
		const combined_hand = getHandResults(playerAndDealer, 'standard');
		
		//calculate current payouts
		let anteBetPayout = ante_bet * anteBonus(player_hand);
		let pairPlusPayout = (pair_plus_bet * pairPlusBonus(player_hand)) - pair_plus_bet;
		let sixCardPayout = (six_card_bet * sixCardBonus(combined_hand)) - six_card_bet;
		
		//run program
		playThreeCard();
		async function playThreeCard(){
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('play')
						.setLabel('Play')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('fold')
						.setLabel('Fold')
						.setStyle(ButtonStyle.Secondary),
				);
				
				const boardEmbed = new EmbedBuilder();
				//sanity check
				if(user_stats.sanity <= -50){
					//debuff user for being crazy
					boardEmbed
						.setColor(0xf5bf62)
						.setTitle(`Current Table`)
						.setDescription(`Something doesn't feel right... You can't comprehend your cards!`)
						.addFields(
							{name: `Dealer`, value: `??, ??, ??`},
							{name: `You (??)`, value: `??, ??, ??`},
							{name: `Ante Bonus Payout`, value: `??`, inline: true},
							{name: `Pair Plus Bonus Payout`, value: `??`, inline: true},
							{name: `Six Card Bonus Payout`, value: `??`, inline: true},
						);
				}
				//int check
				else if(user_stats.intel != 0 && Math.random() + (user_stats.intel * 0.01) > .90){
					int_check_success = true;
					boardEmbed
						.setColor(0xf5bf62)
						.setTitle(`Current Table`)
						.setDescription(`Your INT helps you count the cards... You're sure the dealer has this card!`)
						.addFields(
							{name: `Dealer`, value: `${card_icons[dealerCards[0]]}, ??, ??`},
							{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
							{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
							{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
							{name: `Six Card Bonus Payout`, value: `??`, inline: true},
						);
				}
				else{
					boardEmbed
						.setColor(0xf5bf62)
						.setTitle(`Current Table`)
						.addFields(
							{name: `Dealer`, value: `??, ??, ??`},
							{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
							{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
							{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
							{name: `Six Card Bonus Payout`, value: `??`, inline: true},
						);
				}
					
				await interaction.editReply({embeds:[boardEmbed],components:[row]});
				let filter = i => i.user.id == interaction.user.id && i.isButton();
				let message = await interaction.fetchReply();
				let collector = message.createMessageComponentCollector({time: 45000, filter});
				collector.on('collect', async i => {
					playingGame = true;
					collector.stop();
					await i.update({components:[]});
					if(i.customId == 'play'){
						endGame(true);
					}
					else if(i.customId == 'fold'){
						endGame(false);
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
		}
		//helper functions
		function getPrettyCards(cardArray){
			let prettyCards = [];
			cardArray.forEach(item => {
				prettyCards.push(card_icons[item]);
			});
			return prettyCards;
		}
		function drawCard(cardArray, luck){
			let newCard = (Math.floor(Math.random() * 52));
			while(usedCards[newCard]){
				newCard = (Math.floor(Math.random() * 52));
			}
			usedCards[newCard] = true;
			cardArray.push(newCard);
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
		function anteBonus(hand){
			/*
				pays as a minor bonus to players always
				6. Straight Flush		5 to 1
				5. Three of a Kind	4 to 1
				4. Straight				1 to 1
			*/
			if(hand.rank == 6){
				return 5;
			}
			else if(hand.rank == 5){
				return 4;
			}
			else if(hand.rank == 4){
				return 1;
			}
			else{
				return 0;
			}
		}
		function pairPlusBonus(hand){
			/*
				pays out if pair or better is gotten
				6. Straight Flush		40 to 1
				5. Three of a Kind	30 to 1
				4. Straight		5 to 1
				3. Flush		4 to 1		
				2. Pair		1 to 1
			*/
			if(hand.rank == 6){
				return 40;
			}
			else if(hand.rank == 5){
				return 30;
			}
			else if(hand.rank == 4){
				return 5;
			}
			else if(hand.rank == 3){
				return 4;
			}
			else if(hand.rank == 2){
				return 1;
			}
			else{
				return 0;
			}
		}
		function sixCardBonus(hand){
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
				return 1000;
			}
			else if(hand.rank == 9){
				return 200;
			}
			else if(hand.rank == 8){
				return 50;
			}
			else if(hand.rank == 7){
				return 25;
			}
			else if(hand.rank == 6){
				return 20;
			}
			else if(hand.rank == 5){
				return 10;
			}
			else{
				return 0;
			}
		}
		//game ending helpers
		async function endGame(playing){
			//decides if win or loss
			if(playing){
				let hand_results = Hand.winners([player_hand, dealer_hand]);
				if(dealer_hand.rank == 1 && dealer_hand.cards[0].rank < 11){
					//dealer hand doesnt qualify
					noQualify();
				}
				else if(hand_results.length > 1){
					//draw
					draw();
				}
				else{
					let playerWins = hand_results[0] == player_hand;
					if(playerWins){
						win();
					}
					else{
						lose();
					}
				}
			}
			else{
				//folded
				fold();
			}
		}
		//end game states
		async function noQualify(){
			//dealer doesnt qualify
			playingGame = true;
			/*
				payout
				ante bet
				play bet
				ante bonus
				pair plus bonus
				six card bonus
			*/
			let totalWinnings = ante_bet + anteBetPayout + pairPlusPayout + sixCardPayout;
			const winEmbed = new EmbedBuilder()
				.setColor(0x3bff29)
				.setTitle(`Dealer doesn't Qualify!`)
				.setDescription(`You now have ${user_data.balance + totalWinnings}CC!`)
				.addFields(
					{name: `Dealer (${dealer_hand.descr})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
					{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
					{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
					{name: `Six Card Bonus Payout`, value: `${sixCardPayout}`, inline: true},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let prev_balance = user_data.balance;
			user_data.balance += totalWinnings;
			await user_data.save();
			if(totalWinnings < 0){
				await changeSanity(user_data,user_stats,interaction,prev_balance,totalWinnings);
			}
			await giveLevels(user_stats, Math.floor(totalWinnings/2), interaction);
			user_stats.save();
			return;
		}
		async function fold(){
			//player folds
			playingGame = true;
			/*
				payout
				ante bet
				ante bonus
				pair plus bonus
				six card bonus
			*/
			let totalWinnings = -ante_bet - pair_plus_bet - six_card_bet;
			const winEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle(`You folded!`)
				.setDescription(`You now have ${user_data.balance + totalWinnings}CC!`)
				.addFields(
					{name: `Dealer (${dealer_hand.descr})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
					{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
					{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
					{name: `Six Card Bonus Payout`, value: `${sixCardPayout}`, inline: true},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let prev_balance = user_data.balance;
			user_data.balance += totalWinnings;
			await user_data.save();
			if(totalWinnings < 0){
				await changeSanity(user_data,user_stats,interaction,prev_balance,totalWinnings);
			}
			await giveLevels(user_stats, Math.floor(totalWinnings/2), interaction);
			user_stats.save();
			return;
		}
		async function draw(){
			//player draws
			playingGame = true;
			/*
				payout
				ante bet
				play bet
				ante bonus
				pair plus bonus
				six card bonus
			*/
			let totalWinnings = anteBetPayout + pairPlusPayout + sixCardPayout;
			const winEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle(`It's a Draw!`)
				.setDescription(`You now have ${user_data.balance + totalWinnings}CC!`)
				.addFields(
					{name: `Dealer (${dealer_hand.descr})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
					{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
					{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
					{name: `Six Card Bonus Payout`, value: `${sixCardPayout}`, inline: true},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let prev_balance = user_data.balance;
			user_data.balance += totalWinnings;
			await user_data.save();
			if(totalWinnings < 0){
				await changeSanity(user_data,user_stats,interaction,prev_balance,totalWinnings);
			}
			await giveLevels(user_stats, Math.floor(totalWinnings/2), interaction);
			user_stats.save();
			return;
		}
		async function lose(){
			playingGame = true;
			/*
				payout
				ante bet
				play bet
				ante bonus
				pair plus bonus
				six card bonus
			*/
			let totalWinnings = -ante_bet + -ante_bet + anteBetPayout + pairPlusPayout + sixCardPayout;
			const loseEmbed = new EmbedBuilder()
				.setColor(0xff293b)
				.setTitle(`You lost!`)
				.setDescription(`You now have ${user_data.balance + totalWinnings}CC!`)
				.addFields(
					{name: `Dealer (${dealer_hand.descr})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
					{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
					{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
					{name: `Six Card Bonus Payout`, value: `${sixCardPayout}`, inline: true},
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
				await interaction.followUp({embeds:[wisSaveEmbed]});
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
					.setDescription(`Using your EVD you quickly pocket half your bet back! You now have ${user_data.balance + Math.floor(totalWinnings/2)}CC`);
				totalWinnings = Math.floor(totalWinnings/2);
				await interaction.followUp({embeds:[evdSaveEmbed]});
			}
			let prev_balance = user_data.balance;
			user_data.balance += totalWinnings;
			await user_data.save();
			if(totalWinnings < 0){
				await changeSanity(user_data,user_stats,interaction,prev_balance,totalWinnings);
			}
			return;
		}
		async function win(){
			//player wins
			playingGame = true;
			/*
				payout
				ante bet
				play bet
				ante bonus
				pair plus bonus
				six card bonus
			*/
			let totalWinnings = ante_bet + ante_bet + anteBetPayout + pairPlusPayout + sixCardPayout;
			const winEmbed = new EmbedBuilder()
				.setColor(0x3bff29)
				.setTitle(`You win!`)
				.setDescription(`You now have ${user_data.balance + totalWinnings}CC!`)
				.addFields(
					{name: `Dealer (${dealer_hand.descr})`, value: `${getPrettyCards(dealerCards)}`},
					{name: `You (${player_hand.descr})`, value: `${getPrettyCards(playerCards)}`},
					{name: `Ante Bonus Payout`, value: `${anteBetPayout}`, inline: true},
					{name: `Pair Plus Bonus Payout`, value: `${pairPlusPayout}`, inline: true},
					{name: `Six Card Bonus Payout`, value: `${sixCardPayout}`, inline: true},
				);
			await interaction.editReply({embeds:[winEmbed],components:[]});
			let prev_balance = user_data.balance;
			user_data.balance += totalWinnings;
			await user_data.save();
			if(totalWinnings < 0){
				await changeSanity(user_data,user_stats,interaction,prev_balance,totalWinnings);
			}
			await giveLevels(user_stats, Math.floor(totalWinnings/2), interaction);
			user_stats.save();
			return;
		}
	},
};
