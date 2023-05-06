const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get_user, get_user_stats, giveLevels } = require('../../helper.js');
const { Items, Upgrades } = require('../../dbObjects.js');
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
			let item = await Items.findOne({where:{name:'Diamond Pick'}});
			let user_items = await user.getItem(user, item);
			if(user_items){
				//has pickaxe, increase multiplier
				coin_increase += 1 * user_items.amount;
			}
			//check upgrades
			let upgrade = await Upgrades.findOne({where:{name:'Jackhammer'}});
			let user_upgrades = await user.getUpgrade(user, upgrade);
			if(user_upgrades){
				//has pickaxe, increase multiplier
				coin_increase += 5 * user_upgrades.amount;
			}
			//check sanity level and modify max coins
			let sanityPercent = user_stats.sanity / 100;
			upper_bound += Math.floor(10 * sanityPercent);
			upper_bound += user_stats.strength;
			upper_bound *= coin_increase;
			let lower_bound = user_stats.strength;
			//roll the dice
			let best = 0;
			for(let i=0;i<=user_stats.luck;i++){
				let coinReward = Math.floor(Math.random()*(upper_bound-lower_bound+1)+lower_bound);
				if(coinReward > best)
					best = coinReward;
			}
			//update user
			let experience_gain = Math.floor(best/2);
			const workEmbed = new EmbedBuilder()
				.setColor(0xf5bf62)
				.setTitle('Off to work!')
				.setDescription(`Your current range is from ${lower_bound}CC to ${upper_bound}CC. You worked hard in the Carlcoin Mines and got ${best}CC! You now have ${user.balance + best}CC and got ${experience_gain}XP!`)
			await interaction.reply({embeds:[workEmbed]});
			user.last_worked = Date.now();
			user.balance += best;
			
			if(user_stats.sanity != 0){
				let newSanity = user_stats.sanity + -(user_stats.sanity/Math.abs(user_stats.sanity))*10;
				if (newSanity < 0 && user_stats.sanity >= 0 || newSanity >= 0 && user_stats.sanity < 0) {
					user_stats.sanity = 0;
				}
				else{
					user_stats.sanity = newSanity;
				}
			}
			
			await giveLevels(user_stats, experience_gain, interaction);
			user.save();
			user_stats.save();
		}
		else{
			//user cannot work, notify them
			let returnToWork = user.last_worked + 21600000 - Date.now();
			returnToWork = Math.floor(returnToWork / 1000); //seconds
			returnToWork = Math.floor(returnToWork / 60); //mins
			const noWorkEmbed = new EmbedBuilder()
				.setColor(0xeb3434)
				.setTitle('Can\'t work yet!')
				.setDescription(`You cannot work yet! Come back in ${returnToWork} minutes!`)
			await interaction.reply({embeds:[noWorkEmbed], ephemeral:true});
		}
	},
};
