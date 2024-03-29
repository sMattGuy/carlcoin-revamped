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
const Cosmetic = require('./models/Cosmetics.js')(sequelize, Sequelize.DataTypes);
require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Items.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Buildings.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Stats.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Metrics.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Upgrades.js')(sequelize, Sequelize.DataTypes);
require('./models/Avatar.js')(sequelize, Sequelize.DataTypes);
require('./models/User_Cosmetics.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ force, alter }).then(async () => {
	const inserts = [
		Buildings.upsert({ name: 'House', cost: 100, payout: 10}),
		Buildings.upsert({ name: 'Apartment', cost: 250, payout: 25 }),
		Buildings.upsert({ name: 'Mansion', cost: 600, payout: 50 }),
		Buildings.upsert({ name: 'Skyscraper', cost: 1250, payout: 100 }),
		Buildings.upsert({ name: 'City', cost: 2550, payout: 200 }),
		Buildings.upsert({ name: 'Country', cost: 5150, payout: 400 }),
		Buildings.upsert({ name: 'Satellite', cost: 10200, payout: 800 }),
		Buildings.upsert({ name: 'Moon', cost: 20450, payout: 1600 }),
		Buildings.upsert({ name: 'Planet', cost: 40950, payout: 3200 }),
		Buildings.upsert({ name: 'Sun', cost: 81950, payout: 6400 }),
		Buildings.upsert({ name: 'Solar System', cost: 163950, payout: 12800 }),
		Buildings.upsert({ name: 'Galaxy', cost: 327950, payout: 25600 }),
		Buildings.upsert({ name: 'Pulsar', cost: 655950, payout: 51200 }),
		Buildings.upsert({ name: 'Blackhole', cost: 1311950, payout: 102400 }),
		Buildings.upsert({ name: 'Universe', cost: 2623950, payout: 204800 }),
		Items.upsert({ name: 'Diamond Pick', cost: 500, consume: false, rank: 1 }),
		Items.upsert({ name: 'Hard Hat', cost: 600, consume: false, rank: 2 }),
		Items.upsert({ name: 'Homerun Bat', cost: 600, consume: false, rank: 2 }),
		Items.upsert({ name: 'Fog Machine', cost: 800, consume: false, rank: 2 }),
		Items.upsert({ name: 'Nerd Glasses', cost: 1000, consume: false, rank: 2 }),
		Items.upsert({ name: 'Ponder Orb', cost: 2000, consume: false, rank: 3 }),
		Items.upsert({ name: 'Meditation Orb', cost: 2000, consume: false, rank: 3 }),
		Items.upsert({ name: 'Energy Drink', cost: 20, consume: true, rank: 0 }),
		Items.upsert({ name: 'Sanity Pill', cost: 50, consume: true, rank: 0 }),
		Items.upsert({ name: 'Lootbox Pill', cost: 50, consume: true, rank: 0 }),
		Upgrades.upsert({ name: 'Jackhammer', cost: 1000, rank: 1 }),
		Upgrades.upsert({ name: '57 Leaf Clover', cost: 4000, rank: 3 }),
		Upgrades.upsert({ name: 'Muscle Tonic', cost: 3000, rank: 2 }),
		Upgrades.upsert({ name: 'Speed Cola', cost: 3000, rank: 2 }),
		Upgrades.upsert({ name: 'Thick Skin', cost: 3000, rank: 2 }),
		Upgrades.upsert({ name: 'Calm Mind', cost: 2000, rank: 3 }),
	];
	await Promise.all(inserts);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);
