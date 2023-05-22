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
	
	Cosmetic.upsert({ name: 'Moon', rarity: 1, type: 0, file:'moon.png' }),
	Cosmetic.upsert({ name: 'Astro Outfit', rarity: 2, type: 1, file:'astro_outfit.png' }),
	Cosmetic.upsert({ name: 'Astro Helmet', rarity: 1, type: 3, file:'space_helmet.png' }),
	Cosmetic.upsert({ name: 'American Flag', rarity: 1, type: 4, file:'american_flag.png' }),
	
	Cosmetic.upsert({ name: 'Chefs Kitchen', rarity: 2, type: 0, file:'chefs_kitchen.png' }),
	Cosmetic.upsert({ name: 'Chef Coat', rarity: 3, type: 1, file:'chef_coat.png' }),
	Cosmetic.upsert({ name: 'Chef Hat', rarity: 1, type: 3, file:'chef_hat.png' }),
	Cosmetic.upsert({ name: 'Gordon Ramsey', rarity: 2, type: 4, file:'gordon_ramsey.png' }),
	
	Cosmetic.upsert({ name: 'Desert', rarity: 1, type: 0, file:'indy_background.png' }),
	Cosmetic.upsert({ name: 'Indy Outfit', rarity: 3, type: 1, file:'indy_outfit.png' }),
	Cosmetic.upsert({ name: 'Indy Face', rarity: 2, type: 2, file:'indy_face.png' }),
	Cosmetic.upsert({ name: 'Indy Hat', rarity: 3, type: 3, file:'indy_hat.png' }),
	Cosmetic.upsert({ name: 'Rifle', rarity: 4, type: 4, file:'rifle.png' }),
	
	Cosmetic.upsert({ name: 'Moneybags Island', rarity: 2, type: 0, file:'moneybags_island.png' }),
	Cosmetic.upsert({ name: 'Moneybags Suit', rarity: 3, type: 1, file:'moneybags_suit.png' }),
	Cosmetic.upsert({ name: 'Moneybags Monocle', rarity: 2, type: 2, file:'moneybags_monocle.png' }),
	Cosmetic.upsert({ name: 'Moneybags Hat', rarity: 4, type: 3, file:'moneybags_hat.png' }),
	Cosmetic.upsert({ name: 'Moneybags Sack', rarity: 1, type: 4, file:'moneybags_sack.png' }),
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
