const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Cosmetic = require('./models/Cosmetics.js')(sequelize, Sequelize.DataTypes);

const inserts = [
	Cosmetic.upsert({ name: 'Beach', rarity: 1, type: 0, file:'beach.png' }),
	Cosmetic.upsert({ name: 'Chevy Hat', rarity: 2, type: 3, file:'chevy_hat.png' }),
	Cosmetic.upsert({ name: 'Funny Glasses', rarity: 1, type: 2, file:'funny_glasses.png' }),
	Cosmetic.upsert({ name: 'Ghostly Gibus', rarity: 1, type: 3, file:'ghostly_gibus.png' }),
	Cosmetic.upsert({ name: 'Please be Pepperoni', rarity: 2, type: 1, file:'pepperoni_shirt.png' }),
	Cosmetic.upsert({ name: 'Rainbow Cloud', rarity: 3, type: 4, file:'rainbow_cloud.png' }),
	Cosmetic.upsert({ name: 'Round Glasses', rarity: 1, type: 2, file:'round_glasses.png' }),
	Cosmetic.upsert({ name: 'Team Captain', rarity: 3, type: 3, file:'team_captain_hat.png' }),
	Cosmetic.upsert({ name: 'Terminator Glasses', rarity: 2, type: 2, file:'terminator_glasses.png' }),
	Cosmetic.upsert({ name: 'Tophat', rarity: 2, type: 3, file:'tophat.png' }),
	Cosmetic.upsert({ name: 'Burning Fedora', rarity: 4, type: 3, file:'burning_fedora.png' }),
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
*/
