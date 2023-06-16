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
	Cosmetic.upsert({ name: 'Bird Brain', rarity: 1, type: 3, file:'bird_thoughts.png' }),
	Cosmetic.upsert({ name: 'Chowder Hat', rarity: 3, type: 3, file:'chowder_hat.png' }),
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
