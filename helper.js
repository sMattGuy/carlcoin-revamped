const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Users, User_Stats, User_Metrics, Avatar, Cosmetic } = require('./dbObjects.js');
const Canvas = require('@napi-rs/canvas');

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
async function get_user_metrics(userID){
	//returns the user if it can, otherwise creates a brand new user for the given ID
	let user_metrics = await User_Metrics.findOne({where: {user_id: userID}});
	if(!user_metrics){
		//make new user if couldnt be found
		user_metrics = await User_Metrics.create({user_id: userID});
	}
	return user_metrics;
}

async function get_user_avatar(userID){
	let avatar = await Avatar.findOne({where: {user_id: userID}});
	if(!avatar){
		avatar = await Avatar.create({user_id: userID});
	}
	return avatar;
}
async function generate_avatar(userID){
	let avatar_data = await get_user_avatar(userID);
	const canvas = Canvas.createCanvas(500,500);
	const context = canvas.getContext('2d');
	//get each item
	let background = '';
	let body = '';
	let glasses = '';
	let glasses2 = '';
	let hat = '';
	let special = '';
	let special2 = '';
	//get image path for each cosmetic
	let avatar_image = await Canvas.loadImage(`./images/avatar.png`);
	if(avatar_data.background != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.background}});
		background = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	if(avatar_data.body != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.body}});
		body = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	if(avatar_data.glasses != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.glasses}});
		glasses = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	if(avatar_data.glasses2 != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.glasses2}});
		glasses2 = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	if(avatar_data.hat != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.hat}});
		hat = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	if(avatar_data.special != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.special}});
		special = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	if(avatar_data.special2 != -1){
		let load = await Cosmetic.findOne({where:{id: avatar_data.special2}});
		special2 = await Canvas.loadImage(`./images/cosmetics/${load.file}`);
	}
	//start drawing image
	if(background != ''){
		context.drawImage(background,0,0);
	}
	context.drawImage(avatar_image,0,0);
	if(body != ''){
		context.drawImage(body,0,127);
	}
	if(glasses != ''){
		context.drawImage(glasses,0,140);
	}
	if(glasses2 != ''){
		context.drawImage(glasses2,0,140);
	}
	if(hat != ''){
		context.drawImage(hat,30,30);
	}
	if(special != ''){
		context.drawImage(special,0,0);
	}
	if(special2 != ''){
		context.drawImage(special2,0,0);
	}
	const attachment = new AttachmentBuilder(await canvas.encode('png'),{name:'avatar.png'});
	return attachment;
}

async function giveLevels(user_stats, experience_gain, interaction){
	let user_metric = await get_user_metrics(user_stats.user_id);
	user_metric.experience_earned += experience_gain;
	if(await user_stats.giveXP(experience_gain, user_stats)){
		//user has leveled up, alert them and display new stats
		if(user_metric.highest_level < user_stats.level){
			user_metric.highest_level = user_stats.level;
		}
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
	await user_metric.save();
}

async function killUser(user_data, user_stats, interaction){
	let killSaveChance = 0.95 - (user_stats.constitution * 0.001);
	if(killSaveChance <= 0.85){
		killSaveChance = 0.85;
	}
	if(user_stats.constitution != 0 && Math.random() > killSaveChance){
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
		let user_metric = await get_user_metrics(user_data.user_id);
		user_metric.cc_total_lost += user_data.balance;
		user_metric.cc_lost_death += user_data.balance;
		user_metric.deaths += 1;
		
		user_metric.save();
		user_data.killUser(user_data);
		const deathEmbed = new EmbedBuilder()
			.setColor(0xff293b)
			.setTitle(`You have died!`)
			.setDescription(`Your mental health has dipped too low. You wander into the abyss and never return... You've lost everything!`);
		await interaction.followUp({embeds:[deathEmbed]});
	}
}

async function changeSanity(user_data, user_stats, interaction, balance, bet){
	let sanity = bet;
	//add users property to their current balance
	let user_buildings = await user_data.getBuildings(user_data);
	let building_value = 0;
	for(let i=0;i<user_buildings.length;i++){
		building_value += user_buildings[i].building.cost * user_buildings[i].amount;
	}
	console.log(`Building value: ${building_value}`);
	balance += building_value;
	if(user_stats.sanity > 0){
		user_stats.sanity = 0;
	}
	if(balance > 100){
		//adjust to percentage of bet
		let bet_ratio = bet / balance;
		console.log(`ratio ${bet_ratio}`)
		let sign = Math.sign(bet_ratio);
		bet_ratio *= 100;
		bet_ratio = Math.pow(Math.abs(bet_ratio), 2.27);
		bet_ratio /= 73;
		bet_ratio = Math.ceil(bet_ratio);
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
	if(sanity > 0){
		sanity += Math.ceil(Math.random()*5 + 5);
	}
	else{
		sanity -= Math.ceil(Math.random()*5 + 5);
	}
	if(sanity > 0){
		sanity *= -1;
	}
	console.log(`sanity drain: ${sanity}`);
	user_stats.sanity += sanity;
	console.log(`post sanity: ${user_stats.sanity}`);
	//sanity over 100, ceiling it
	if(user_stats.sanity > 100){
		user_stats.sanity = 100;
	}
	//test user death and save data
	if(user_stats.sanity < -100){
		killUser(user_data, user_stats, interaction);
	}
	//sanity past -80, warn deaths door
	else if(user_stats.sanity <= -80 && prev_sanity > -80){
		await user_data.save();
		await user_stats.save();
		const insaneEmbed = new EmbedBuilder()
			.setColor(0xff293b)
			.setTitle(`You're at Death's Door!`)
			.setDescription(`One more bet and it could spell your doom! You REALLY should consider a Sanity Pill!`);
			await interaction.followUp({embeds:[insaneEmbed],ephemeral:true});
	}
	//sanity past -50, alert insane
	else if(user_stats.sanity <= -50 && prev_sanity > -50){
		await user_data.save();
		await user_stats.save();
		const insaneEmbed = new EmbedBuilder()
			.setColor(0xff293b)
			.setTitle(`Something doesn't feel right...`)
			.setDescription(`You've gone insane! Either wait some time or take a Sanity Pill!`);
			await interaction.followUp({embeds:[insaneEmbed],ephemeral:true});
	}
	else{
		await user_data.save();
		await user_stats.save();
	}
}

async function give_lootbox(user_data, interaction){
	let user_metric = await get_user_metrics(user_data.user_id);
	if(user_data.last_lootbox + 64800000 <= Date.now()){
		user_metric.lootboxes_earned += 1;
		//generate and give lootbox
		user_data.last_lootbox = Date.now();
		/*
			rarity
			1	common
			2	rare
			3	super rare
			4	ultra rare
		*/
		const rarity_levels = ['Common', 'Rare', 'Super Rare', 'Ultra Rare']
		let rarity = Math.random();
		let cosmetic_get = '';
		let rarity_level_img = 'common.png';
		if(rarity < 0.005){
			//ultra rare
			cosmetic_get = await Cosmetic.findAll({where:{rarity: 4}});
			rarity_level_img = 'ultra_rare.png';
		}
		else if(rarity < 0.05){
			//super rare
			cosmetic_get = await Cosmetic.findAll({where:{rarity: 3}});
			rarity_level_img = 'super_rare.png';
		}
		else if(rarity < 0.2){
			//rare
			cosmetic_get = await Cosmetic.findAll({where:{rarity: 2}});
			rarity_level_img = 'rare.png';
		}
		else{
			//common
			cosmetic_get = await Cosmetic.findAll({where:{rarity: 1}});
		}
		let random_selection = Math.floor(Math.random() * cosmetic_get.length);
		let selected_cosmetic = cosmetic_get[random_selection];
		//check if user has cosmetic
		let user_cosmetic = await user_data.getCosmetic(user_data, selected_cosmetic);
		if(user_cosmetic.amount == 0){
			//new cosmetic for them
			user_cosmetic.amount = 1;
			user_cosmetic.save();
			//apply new cosmetic if slot is not in use
			let user_avatar = await get_user_avatar(user_data.user_id);
			if(selected_cosmetic.type == 0 && user_avatar.background == -1){
				user_avatar.background = selected_cosmetic.id;
			}
			else if(selected_cosmetic.type == 1 && user_avatar.body == -1){
				user_avatar.body = selected_cosmetic.id;
			}
			else if(selected_cosmetic.type == 2 && user_avatar.glasses == -1){
				user_avatar.glasses = selected_cosmetic.id;
			}
			else if(selected_cosmetic.type == 2 && user_avatar.glasses2 == -1){
				user_avatar.glasses2 = selected_cosmetic.id;
			}
			else if(selected_cosmetic.type == 3 && user_avatar.hat == -1){
				user_avatar.hat = selected_cosmetic.id;
			}
			else if(selected_cosmetic.type == 4 && user_avatar.special == -1){
				user_avatar.special = selected_cosmetic.id;
			}
			else if(selected_cosmetic.type == 4 && user_avatar.special2 == -1){
				user_avatar.special2 = selected_cosmetic.id;
			}
			user_avatar.save();
			const canvas = Canvas.createCanvas(500,500);
			const context = canvas.getContext('2d');
			//draw item
			const cos_image = await Canvas.loadImage(`./images/cosmetics/${selected_cosmetic.file}`);
			context.drawImage(cos_image,canvas.width/2 - cos_image.width/2, canvas.height/2 - cos_image.height/2);
			//draw rarity
			const rarity_image = await Canvas.loadImage(`./images/cosmetics/${rarity_level_img}`);
			context.drawImage(rarity_image,0,0);
			//build attachment
			const attachment = new AttachmentBuilder(await canvas.encode('png'),{name:'cosmetic.png'});
			const cosmeticEmbed = new EmbedBuilder()
				.setColor(0x2eb7f6)
				.setTitle(`${interaction.user.username} got a new cosmetic!`)
				.setDescription(`${interaction.user.username} unboxed the ${selected_cosmetic.name}, a ${rarity_levels[selected_cosmetic.rarity - 1]} item!`)
				.setImage('attachment://cosmetic.png');
			interaction.followUp({embeds:[cosmeticEmbed],files:[attachment]});
		}
		else{
			//already have, reward with coin
			let coinreward = 10 * user_cosmetic.cosmetic.rarity;
			user_data.balance += coinreward;
			user_data.last_lootbox -= 32400000;
			//metrics
			user_metric.cc_total_gained += coinreward;
			if(user_metric.highest_cc_balance < user_data.balance){
				user_metric.highest_cc_balance = user_data.balance;
			}
			const cosmeticEmbed = new EmbedBuilder()
				.setColor(0x2eb7f6)
				.setTitle('You got a duplicate!')
				.setDescription(`Since you already own the ${selected_cosmetic.name}, You get ${coinreward}CC instead!`)
			interaction.followUp({embeds:[cosmeticEmbed],ephemeral:true});
		}
		user_data.save();
		user_metric.save();
	}
	else{
		//not their time, ignore it
	}
}
module.exports = {get_user, get_user_stats, get_user_metrics, giveLevels, killUser, changeSanity, generate_avatar, get_user_avatar, give_lootbox}
