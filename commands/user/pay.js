const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats } = require('../../helper.js');

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
		
		user_data.save();
		payee_data.save();
		
		const payEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle('Payment Successful!')
			.setDescription(`You sent ${amount}CC to ${userToPay.username}!`)
		await interaction.reply({embeds:[payEmbed]});
	},
};