const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Users, User_Stats } = require('./dbObjects.js');

async function get_user(userID){
	//returns the user if it can, otherwise creates a brand new user for the given ID
	let user = await Users.findOne({where: {user_id: userID}});
	if(!user){
		//make new user if couldnt be found
		user = await Users.create({user_id: userID});
		let user_stats = await User_Stats.create({user_id: userID});
	}
	return user;
}

async function get_user_stats(userID){
	//returns the user if it can, otherwise creates a brand new user for the given ID
	let user_stats = await User_Stats.findOne({where: {user_id: userID}});
	if(!user_stats){
		//make new user if couldnt be found
		user_stats = await User_Stats.create({user_id: userID});
	}
	return user_stats;
}

async function giveLevels(user_stats, experience_gain, interaction){
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
			);
		await interaction.followUp({embeds:[levelUpEmbed]});
	}
}

async function killUser(user_data, user_stats, interaction){
	let killSaveChance = user_stats.constitution * 0.001;
	if(killSaveChance >= 0.95){
		killChance = 0.94;
	}
	if(user_stats.constitution != 0 && Math.random() + killSaveChance > 0.95){
		const conSaveEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle(`You almost died!`)
			.setDescription(`On the brink of insanity, your CON saves you! Now might be a good time to take a Sanity Pill!`);
		user_stats.sanity = -99;
		user_stats.save();
		user_data.save();
		await interaction.followUp({embeds:[conSaveEmbed]});
	}
	else{
		//kill user
		user_data.killUser(user_data);
		const deathEmbed = new EmbedBuilder()
			.setColor(0xff293b)
			.setTitle(`You have died!`)
			.setDescription(`Your mental health has dipped too low. You wander into the abyss and never return... You've lost everything!`);
		await interaction.followUp({embeds:[deathEmbed]});
	}
}

async function changeSanity(user_data, user_stats, interaction, balance, sanity){
	console.log(`current sanity: ${user_stats.sanity}`);
	if(user_stats.sanity == 0){
		user_stats.sanity = -1;
	}
	if(balance > 100){
		//adjust to percentage of bet
		let bet_ratio = sanity / balance;
		console.log(`ratio ${bet_ratio}`)
		let sign = Math.sign(bet_ratio);
		bet_ratio *= 100;
		bet_ratio = Math.pow(Math.abs(bet_ratio), 2.27);
		bet_ratio /= 73;
		bet_ratio = Math.ceil(bet_ratio);
		bet_ratio += 1;
		bet_ratio *= sign
		console.log(`ratio result ${bet_ratio}`)
		//increase sanity based on current sanity
		let san_sign = Math.sign(user_stats.sanity);
		let sanity_modifier = Math.ceil(Math.pow(Math.abs(user_stats.sanity)/22,2));
		console.log(`sanity mod: ${sanity_modifier}`);
		sanity_modifier *= san_sign;
		console.log(`sanity mod post sign: ${sanity_modifier}`);
		sanity = bet_ratio + sanity_modifier;
	}
	let prev_sanity = user_stats.sanity;
	console.log(`sanity drain: ${sanity}`);
	user_stats.sanity += sanity;
	console.log(`post sanity: ${user_stats.sanity}`);
	//sanity over 100, ceiling it
	if(user_stats.sanity > 100){
		user_stats.sanity = 100;
	}
	//sanity goes from below -50 to above, no longer insane
	if(prev_sanity <= -50 && user_stats.sanity > -50){
		const insaneEmbed = new EmbedBuilder()
			.setColor(0x3bff29)
			.setTitle(`Your mind is clear!`)
			.setDescription(`Your insanity fades... You're no longer insane!`);
		await interaction.followUp({embeds:[insaneEmbed],ephemeral:true});
	}
	//sanity past -50, alert insane
	if(user_stats.sanity <= -50 && prev_sanity > -50){
		const insaneEmbed = new EmbedBuilder()
			.setColor(0xff293b)
			.setTitle(`Something doesn't feel right...`)
			.setDescription(`You've gone insane! Either wait some time or take a Sanity Pill!`);
		await interaction.followUp({embeds:[insaneEmbed],ephemeral:true});
	}
	//test user death and save data
	if(user_stats.sanity < -100){
		if(prev_sanity >= 0 && user_stats.level <= 30){
			user_stats.sanity = -99;
			const insaneEmbed = new EmbedBuilder()
				.setColor(0xff293b)
				.setTitle(`You nearly died!`)
				.setDescription(`Betting that much made you sick in the head! Take a break for a bit before betting again!`);
			await interaction.followUp({embeds:[insaneEmbed]});
			user_data.save();
			user_stats.save();
		}
		else{
			killUser(user_data, user_stats, interaction);
		}
	}
	else{
		user_data.save();
		user_stats.save();
	}
}
module.exports = {get_user, get_user_stats, giveLevels, killUser, changeSanity}
