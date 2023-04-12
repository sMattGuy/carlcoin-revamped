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
				{name: 'SAN', value: `${user_stats.sanity}`, inline: true},
			);
		await interaction.followUp({embeds:[levelUpEmbed]});
	}
}

async function killUser(user_data, user_stats, interaction){
	if(user_stats.constitution != 0 && Math.random() + (user_stats.constitution * 0.01) > 0.85){
		const conSaveEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle(`You almost died!`)
			.setDescription(`On the brink of insanity, your CON saves you! Now might be a good time to take a Sanity Pill!`);
		user_stats.sanity = -95;
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
module.exports = {get_user, get_user_stats, giveLevels, killUser}