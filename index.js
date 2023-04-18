// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const cron = require('cron');
const { Op } = require('sequelize');
const { Client, codeBlock, Collection, Events, GatewayIntentBits } = require('discord.js');
const { Users } = require('./dbObjects.js');
const { token } = require('./config.json');
const { get_user_stats } = require('./helper.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

async function dailyp(){
	//get users buildings and pay out rent
	let userList = await Users.findAll();
	userList.forEach(async user => {
		let userBuildings = await user.getBuildings(user);
		let payout = 0;
		for(let i=0;i<userBuildings.length;i++){
			payout += userBuildings[i].building.payout * userBuildings[i].amount;
		}
		user.balance += payout;
		user.save();
	});
}
async function hourlys(){
	let userList = await Users.findAll();
	userList.forEach(async user => {
		let user_stats = await get_user_stats(user.user_id);
		if(user_stats.sanity != 0){
			let newSanity = user_stats.sanity + -(user_stats.sanity/Math.abs(user_stats.sanity))*10;
			if (newSanity < 0 && user_stats.sanity >= 0 || newSanity >= 0 && user_stats.sanity < 0) {
				user_stats.sanity = 0;
			}
			else{
				user_stats.sanity = newSanity;
			}
		}
		user_stats.save();
	});
}
let dailyPayout = new cron.CronJob('0 18 * * *', dailyp);
let hourlySanity = new cron.CronJob('0 * * * *', hourlys);
dailyPayout.start();
hourlySanity.start();
// Log in to Discord with your client's token
client.login(token);
