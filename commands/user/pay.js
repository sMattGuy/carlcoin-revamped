const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats, get_user_metrics } = require('../../helper.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pay')
		.setDescription('Lets you pay another user!')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('The user you want to pay')
				.setRequired(true))
		.addIntegerOption(option => 
			option.setName('amount')
				.setDescription('The amount you want to send')
				.setMinValue(1)
				.setRequired(true)),
	async execute(interaction) {
		let userToPay = interaction.options.getUser('user');
		let amount = interaction.options.getInteger('amount');
		
		if(userToPay.bot){
			interaction.reply({content: 'Bots cannot user Carlcoin!', ephemeral:true});
			return;
		}
		
		let user_data = await get_user(interaction.user.id);
		let payee_data = await get_user(userToPay.id);
		
		//check that user can afford paying them
		if(user_data.balance < amount){
			interaction.reply({content: 'You don\'t have enough coins!', ephemeral:true});
			return;
		}
		//send over money
		payee_data.balance += amount;
		user_data.balance -= amount;
		//get metrics
		let user_metric = await get_user_metrics(interaction.user.id);
		let payee_metric = await get_user_metrics(userToPay.id);
		user_metric.cc_payed += amount;
		payee_metric.cc_received += amount;
		user_metric.cc_total_lost += amount;
		payee_metric.cc_total_gained += amount;
		if(payee_metric.highest_cc_balance < payee_data.balance){
			payee_metric.highest_cc_balance = payee_data.balance;
		}
		
		user_data.save();
		payee_data.save();
		user_metric.save();
		payee_metric.save();
		
		const payEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle('Payment Successful!')
			.setDescription(`You sent ${amount}CC to ${userToPay.username}!`)
		await interaction.reply({embeds:[payEmbed]});
	},
};