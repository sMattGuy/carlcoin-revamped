const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats } = require('../../helper.js');

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
			interaction.reply({content: 'You don\'t have enough coins!', ephemeral:true});
			return;
		}
		let usedCards = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
		
		//dealer
		let dealerCard1 = (Math.floor(Math.random() * 52));
		usedCards[dealerCard1] = true;
		let dealerCard2 = (Math.floor(Math.random() * 52));
		while(usedCards[dealerCard2]){
			dealerCard2 = (Math.floor(Math.random() * 52));
		}
		usedCards[dealerCard2] = true;
		//player
		let playerCard1 = (Math.floor(Math.random() * 52));
		while(usedCards[playerCard1]){
			playerCard1 = (Math.floor(Math.random() * 52));
		}
		usedCards[playerCard1] = true;
		let playerCard2 = (Math.floor(Math.random() * 52));
		while(usedCards[playerCard2]){
			playerCard2 = (Math.floor(Math.random() * 52));
		}
		usedCards[playerCard2] = true;
		let dealerCards = [dealerCard1,dealerCard2];
		let playerCards = [playerCard1,playerCard2];
		
		const drawEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle(`It's a draw!`)
			.addFields(
				{name: 'Dealer', value: `${dealerCards}`},
				{name: 'You', value: `${playerCards}`},
			);
		const winEmbed = new EmbedBuilder()
			.setColor(0x3bff29)
			.setTitle(`You win!`)
			.addFields(
				{name: 'Dealer', value: `${dealerCards}`},
				{name: 'You', value: `${playerCards}`},
			);
		const loseEmbed = new EmbedBuilder()
			.setColor(0xff293b)
			.setTitle(`You lost!`)
			.addFields(
				{name: 'Dealer', value: `${dealerCards}`},
				{name: 'You', value: `${playerCards}`},
			);
			
		let dealerWin = false;
		let playerWin = false;
		//check instant win
		if(((playerCard1%13 == 0)&&(playerCard2%13 == 9 || playerCard2%13 == 10 || playerCard2%13 == 11 || playerCard2%13 == 12))|| ((playerCard2%13 == 0)&&(playerCard1%13 == 9 || playerCard1%13 == 10 || playerCard1%13 == 11 || playerCard1%13 == 12))){
			playerWin = true;
		}
		if(((dealerCard1%13 == 0)&&(dealerCard2%13 == 9 || dealerCard2%13 == 10 || dealerCard2%13 == 11 || dealerCard2%13 == 12)) || ((dealerCard2%13 == 0)&&(dealerCard1%13 == 9 || dealerCard1%13 == 10 || dealerCard1%13 == 11 || dealerCard1%13 == 12))){
			dealerWin = true;
		}
		
		if(playerWin && dealerWin){
			//draw
			interaction.reply({embeds:[drawEmbed]});
			return;
		}
		else if(playerWin){
			//player wins
			await interaction.reply({embeds:[winEmbed]});
			user_data.balance += betAmount;
			if(user_stats.sanity != 0){
				let newSanity = user_stats.sanity + -(user_stats.sanity/Math.abs(user_stats.sanity))*betAmount;
				if (newSanity < 0 && user_stats.sanity >= 0 || newSanity >= 0 && user_stats.sanity < 0) {
					user_stats.sanity = 0;
				}
				else{
					user_stats.sanity = newSanity;
				}
			}
			user_data.save();
			if(await user_stats.giveXP(Math.floor(betAmount), user_stats)){
				//user has leveled up, alert them and display new stats
				const levelUpEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle('Level Up!')
					.setDescription(`Congratulations! You are now level ${user_stats.level}. Current XP ${user_stats.experience}/${user_stats.next_level}`)
					.addFields(
						{name: 'STR', value: `${user_stats.strength}`, inline: true},
						{name: 'DEF', value: `${user_stats.defense}`, inline: true},
						{name: 'EVD', value: `${user_stats.evade}`, inline: true},
						{name: 'INT', value: `${user_stats.intel}`, inline: true},
						{name: 'WIS', value: `${user_stats.wisdom}`, inline: true},
						{name: 'CON', value: `${user_stats.constitution}`, inline: true},
						{name: 'LCK', value: `${user_stats.luck}`, inline: true},
						{name: 'SAN', value: `${user_stats.sanity}`, inline: true},
					);
				await interaction.followUp({embeds:[levelUpEmbed]});
			}
			user_stats.save();
			return;
		}
		else if(dealerWin){
			//dealer wins
			interaction.reply({embeds:[loseEmbed]});
			user_data.balance -= betAmount;
			user_stats.sanity -= betAmount;
			if(user_stats.sanity < -100){
				//kill user
				user_data.killUser(user_data);
				const loseEmbed = new EmbedBuilder()
				.setColor(0xff293b)
				.setTitle(`You have died!`)
				.setDescription(`Your mental health has dipped too low. You wander into the abyss and never return... You've lost everything!`);
			}
			else{
				user_data.save();
				user_stats.save();
			}
			return;
		}
		else{
			//game didnt end right away, start running the main game
			
		}
	},
};