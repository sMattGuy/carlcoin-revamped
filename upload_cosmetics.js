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
	Cosmetic.upsert({ name: 'Vampire Room', rarity: 2, type: 0, file:'dracula_room.png' }),
	Cosmetic.upsert({ name: 'Blood Pool', rarity: 1, type: 4, file:'blood_pool.png' }),
	Cosmetic.upsert({ name: 'Vampire Face', rarity: 2, type: 2, file:'vampire_face.png' }),
	Cosmetic.upsert({ name: 'Vampire Outfit', rarity: 3, type: 1, file:'vampire_outfit.png' }),
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
