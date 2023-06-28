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
	Cosmetic.upsert({ name: 'Finn The Human', rarity: 3, type: 3, file:'finn_the_human.png' }),
	Cosmetic.upsert({ name: 'Gir Hat', rarity: 2, type: 3, file:'girr_hat.png' }),
	Cosmetic.upsert({ name: 'Cow Spots', rarity: 1, type: 1, file:'cow_spots.png' }),
	Cosmetic.upsert({ name: 'Frog Hat', rarity: 2, type: 3, file:'frog_hat.png' }),
	Cosmetic.upsert({ name: 'Sasuke Headband', rarity: 1, type: 3, file:'sasuke_headband.png' }),
	Cosmetic.upsert({ name: 'Doggy Face', rarity: 1, type: 2, file:'doggy_face.png' }),
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
