const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Buildings = require('./models/Buildings.js')(sequelize, Sequelize.DataTypes);
const Items = require('./models/Items.js')(sequelize, Sequelize.DataTypes);
const Upgrades = require('./models/Upgrades.js')(sequelize, Sequelize.DataTypes);
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Items.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Buildings.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Stats.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Upgrades.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ force, alter }).then(async () => {
	const inserts = [
		Buildings.upsert({ name: 'House', cost: 100 }),
		Buildings.upsert({ name: 'Apartment', cost: 250 }),
		Buildings.upsert({ name: 'Mansion', cost: 600 }),
		Buildings.upsert({ name: 'Skyscraper', cost: 1250 }),
		Buildings.upsert({ name: 'City', cost: 2550 }),
		Buildings.upsert({ name: 'Country', cost: 5150 }),
		Buildings.upsert({ name: 'Satellite', cost: 10200 }),
		Items.upsert({ name: 'Diamond Pick', cost: 500, consume: false }),
		Items.upsert({ name: 'Hard Hat', cost: 600, consume: false }),
		Items.upsert({ name: 'Homerun Bat', cost: 600, consume: false }),
		Items.upsert({ name: 'Fog Machine', cost: 800, consume: false }),
		Items.upsert({ name: 'Nerd Glasses', cost: 1000, consume: false }),
		Items.upsert({ name: 'Ponder Orb', cost: 2000, consume: false }),
		Items.upsert({ name: 'Meditation Orb', cost: 2000, consume: false }),
		Items.upsert({ name: 'Energy Drink', cost: 20, consume: true }),
		Items.upsert({ name: 'Sanity Pill', cost: 50, consume: true }),
		Upgrades.upsert({ name: 'Jackhammer', cost: 1000 }),
		Upgrades.upsert({ name: '57 Leaf Clover', cost: 4000 }),
		Upgrades.upsert({ name: 'Muscle Tonic', cost: 3000 }),
		Upgrades.upsert({ name: 'Speed Cola', cost: 3000 }),
		Upgrades.upsert({ name: 'Thick Skin', cost: 3000 }),
		Upgrades.upsert({ name: 'Calm Mind', cost: 2000 }),
	];
	await Promise.all(inserts);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);
