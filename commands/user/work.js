const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats } = require('../../helper.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('work')
		.setDescription('Lets you work for coin!'),
	async execute(interaction) {
		//get user
		let user = await get_user(interaction.user.id);
		//check if user can work
		if(user.last_worked + 21600000 <= Date.now()){
			user_stats = await get_user_stats(interaction.user.id);
			let coin_increase = 1;
			let upper_bound = 10 //max coin you can get
			//user can work, go through various processes
			user.last_worked = Date.now();
			//check for items that might increase skill
			let items = await user.getItems(user);
			let pickaxe = items.findIndex(item => item.name == "Diamond Pick");
			if(pickaxe >= 0 && items[pickaxe].amount > 0){
				//has pickaxe, increase multiplier
				coin_increase += 2;
			}
			//check upgrades
			let upgrades = await user.getUpgrades(user);
			let hammer = upgrades.findIndex(upgrade => upgrade.name == "Jackhammer");
			if(hammer >= 0 && upgrades[hammer].amount > 0){
				//has pickaxe, increase multiplier
				coin_increase += 5;
			}
			//check sanity level and modify max coins
			let sanityPercent = user_stats.sanity / 100;
			upper_bound += Math.floor(10 * sanityPercent);
			//roll the dice
			let coinReward = Math.floor(Math.random()*upper_bound)+1
			coinReward *= coin_increase;
			//update user
			let experience_gain = Math.floor(coinReward/2);
			await interaction.reply(`You worked hard in the Carlcoin Mines and gor ${coinReward}CC! You also got ${experience_gain}XP!`);
			user.last_worked = Date.now();
			user.balance += coinReward;
			if(user_stats.sanity != 0){
				user_stats.sanity += (user_stats.sanity/-user_stats.sanity)*5;
			}
			if(await user_stats.giveXP(experience_gain, user_stats)){
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
			user.save();
			user_stats.save();
		}
		else{
			//user cannot work, notify them
			let returnToWork = user.last_worked + 21600000 - Date.now();
			returnToWork = Math.floor(returnToWork / 1000); //seconds
			returnToWork = Math.floor(returnToWork / 60); //mins
			interaction.reply(`You cannot work yet! Come back in ${returnToWork} minutes!`);
		}
	},
};