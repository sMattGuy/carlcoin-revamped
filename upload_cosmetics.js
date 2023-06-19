const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Cosmetic = require('./models/Cosmetics.js')(sequelize, Sequelize.DataTypes);

const inserts = [
	/*
	Cosmetic.upsert({ name: 'Bustling Fungus', rarity: 3, type: 4, file:'bustling_fungus.png' }),
	Cosmetic.upsert({ name: 'Great Sword', rarity: 2, type: 4, file:'great_sword.png' }),
	Cosmetic.upsert({ name: 'Knight Armor', rarity: 1, type: 1, file:'knight_armor.png' }),
	Cosmetic.upsert({ name: 'Knight Helmet', rarity: 1, type: 3, file:'knight_helmet.png' }),
	*/
];
Promise.all(inserts);
console.log('Database synced');
/*
	cosmetic types
	0	background
	1	body
	2	glasses
	3	hat
	4	special
*/

/*
	rarity
	1	common
	2	rare
	3	super rare
	4	ultra rare
	999	reward
*/
