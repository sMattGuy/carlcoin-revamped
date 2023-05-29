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
	Cosmetic.upsert({ name: 'Anime Face', rarity: 1, type: 2, file:'anime_face.png' }),
	Cosmetic.upsert({ name: 'Cargo Snail', rarity: 2, type: 4, file:'cargo_snail.png' }),
	Cosmetic.upsert({ name: 'Crazy Eyes', rarity: 1, type: 2, file:'crazy_eyes.png' }),
	Cosmetic.upsert({ name: 'Deer Moment', rarity: 1, type: 1, file:'deer_moment.png' }),
	Cosmetic.upsert({ name: 'Leaf Village', rarity: 1, type: 0, file:'leaf_village.png' }),
	Cosmetic.upsert({ name: 'M60', rarity: 3, type: 4, file:'m60.png' }),
	Cosmetic.upsert({ name: 'Naruto Eyes', rarity: 1, type: 2, file:'naruto_eyes.png' }),
	Cosmetic.upsert({ name: 'Naruto Hair', rarity: 2, type: 3, file:'naruto_hair.png' }),
	Cosmetic.upsert({ name: 'Naruto Kunai', rarity: 2, type: 4, file:'naruto_kunai.png' }),
	Cosmetic.upsert({ name: 'Naruto Outfit', rarity: 2, type: 1, file:'naruto_outfit.png' }),
	Cosmetic.upsert({ name: 'Pepepperoni', rarity: 999, type: 2, file:'pepepperoni.png' }),
	Cosmetic.upsert({ name: 'Rectangle Glasses', rarity: 1, type: 2, file:'rectangle_glasses.png' }),
	Cosmetic.upsert({ name: 'Serious Eyes', rarity: 1, type: 2, file:'serious_eyes.png' }),
	Cosmetic.upsert({ name: 'Sleepy Eyes', rarity: 1, type: 2, file:'sleepy_eyes.png' }),
	Cosmetic.upsert({ name: 'Single Action Army', rarity: 3, type: 4, file:'single_action.png' }),
	Cosmetic.upsert({ name: 'Tiny Eyes', rarity: 1, type: 2, file:'tiny_eyes.png' }),
	Cosmetic.upsert({ name: 'Tiny Glasses', rarity: 1, type: 2, file:'tiny_glasses.png' }),
	Cosmetic.upsert({ name: 'War Helmet', rarity: 2, type: 3, file:'war_helmet.png' }),
	Cosmetic.upsert({ name: 'War Outfit', rarity: 2, type: 1, file:'war_outfit.png' }),
	Cosmetic.upsert({ name: 'Warzone', rarity: 1, type: 0, file:'warzone.png' }),
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
