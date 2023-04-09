// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const cron = require('cron');
const { Op } = require('sequelize');
const { Client, codeBlock, Collection, Events, GatewayIntentBits } = require('discord.js');
const { Users } = require('./dbObjects.js');
const { token } = require('./config.json');

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

let dailyPayout = new cron.CronJob('0 18 * * *', async () => {
	//get users buildings and pay out rent
	let userList = await Users.findAll();
	userList.forEach(async user => {
		let userBuildings = await user.getBuildings(user);
		let payout = 0;
		for(let i=0;i<userBuildings.length;i++){
			payout += (userBuildings[i].building.id * 10) * userBuildings[i].amount;
		}
		user.balance += payout;
		user.save();
	});
});
dailyPayout.start();

// Log in to Discord with your client's token
client.login(token);
