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
const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const User_Items = require('./models/User_Items.js')(sequelize, Sequelize.DataTypes);
const User_Buildings = require('./models/User_Buildings.js')(sequelize, Sequelize.DataTypes);
const User_Stats = require('./models/User_Stats.js')(sequelize, Sequelize.DataTypes);
const User_Metrics = require('./models/User_Metrics.js')(sequelize, Sequelize.DataTypes);
const User_Upgrades = require('./models/User_Upgrades.js')(sequelize, Sequelize.DataTypes);
const User_Cosmetics = require('./models/User_Cosmetics.js')(sequelize, Sequelize.DataTypes);
const Cosmetic = require('./models/Cosmetics.js')(sequelize, Sequelize.DataTypes);
const Avatar = require('./models/Avatar.js')(sequelize, Sequelize.DataTypes);

User_Items.belongsTo(Items, { foreignKey: 'item_id', as: 'item' });
User_Buildings.belongsTo(Buildings, { foreignKey: 'building_id', as: 'building' });
User_Upgrades.belongsTo(Upgrades, { foreignKey: 'upgrade_id', as: 'upgrade' });
User_Cosmetics.belongsTo(Cosmetic, { foreignKey: 'cosmetic_id', as: 'cosmetic'});

Reflect.defineProperty(Users.prototype, 'addCosmetic', {
	value: async (user, cosmetic) => {
		const userCosmetic = await User_Cosmetics.findOne({
			where: {user_id: user.user_id, cosmetic_id: cosmetic.id},
		});
		if(userCosmetic){
			userCosmetic.amount = 1;
			return userCosmetic.save();
		}
		return User_Cosmetics.create({user_id: user.user_id, cosmetic_id:cosmetic.id, amount:1});
	}
});
Reflect.defineProperty(Users.prototype, 'getCosmetic', {
	value: async (user, cosmetic) => {
		const user_cosmetic = await User_Cosmetics.findOne({
			where: {user_id: user.user_id, cosmetic_id:cosmetic.id},
			include: ['cosmetic'],
		});
		if(user_cosmetic){
			return user_cosmetic;
		}
		return User_Cosmetics.create({user_id: user.user_id, cosmetic_id:cosmetic.id, amount:0});
	}
});
Reflect.defineProperty(Users.prototype, 'getCosmetics', {
	value: (user) => {
		return User_Cosmetics.findAll({
			where: {user_id: user.user_id, amount: 1},
			include: ['cosmetic'],
			order: [['cosmetic','rarity','desc']],
		});
	}
});

Reflect.defineProperty(Users.prototype, 'addItem', {
	value: async (user, item) => {
		const userItem = await User_Items.findOne({
			where: {user_id: user.user_id, item_id: item.id},
		});
		if(userItem){
			userItem.amount += 1;
			return userItem.save();
		}
		return User_Items.create({user_id: user.user_id, item_id:item.id, amount:1});
	}
});
Reflect.defineProperty(Users.prototype, 'getItem', {
	value: async (user, item) => {
		const user_item = await User_Items.findOne({
			where: {user_id: user.user_id, item_id:item.id},
			include: ['item'],
		});
		if(user_item){
			return user_item;
		}
		return User_Items.create({user_id: user.user_id, item_id:item.id, amount:0});
	}
});
Reflect.defineProperty(Users.prototype, 'getItems', {
	value: (user) => {
		return User_Items.findAll({
			where: {user_id: user.user_id},
			include: ['item'],
		});
	}
});

Reflect.defineProperty(Users.prototype, 'addUpgrade', {
	value: async (user, upgrade) => {
		const user_upgrade = await User_Upgrades.findOne({
			where: {user_id: user.user_id, upgrade_id: upgrade.id},
		});
		if(user_upgrade){
			user_upgrade.amount += 1;
			return user_upgrade.save();
		}
		return User_Upgrades.create({user_id: user.user_id, upgrade_id: upgrade.id, amount: 1});
	}
});
Reflect.defineProperty(Users.prototype, 'getUpgrade', {
	value: async (user, upgrade) => {
		const user_upgrade = await User_Upgrades.findOne({
			where: {user_id: user.user_id, upgrade_id: upgrade.id},
			include: ['upgrade'],
		});
		if(user_upgrade){
			return user_upgrade;
		}
		return User_Upgrades.create({user_id: user.user_id, upgrade_id: upgrade.id, amount: 0});
	}
});
Reflect.defineProperty(Users.prototype, 'getUpgrades', {
	value: (user) => {
		return User_Upgrades.findAll({
			where: {user_id: user.user_id},
			include: ['upgrade'],
		});
	}
});

Reflect.defineProperty(Users.prototype, 'addBuilding', {
	value: async (user, building) => {
		const userBuilding = await User_Buildings.findOne({
			where: {user_id: user.user_id, building_id: building.id},
		});
		if(userBuilding){
			userBuilding.amount += 1;
			return userBuilding.save();
		}
		return User_Buildings.create({user_id: user.user_id, building_id:building.id, amount:1});
	}
});
Reflect.defineProperty(Users.prototype, 'getBuilding', {
	value: async (user, building) => {
		const user_building = await User_Buildings.findOne({
			where: {user_id: user.user_id, building_id:building.id},
			include: ['building'],
		});
		if(user_building){
			return user_building;
		}
		return User_Buildings.create({user_id: user.user_id, building_id:building.id, amount:0});
	}
});
Reflect.defineProperty(Users.prototype, 'getBuildings', {
	value: (user) => {
		return User_Buildings.findAll({
			where: {user_id: user.user_id},
			include: ['building'],
			order: [['building_id', 'ASC']]
		});
	}
});

Reflect.defineProperty(User_Stats.prototype, 'giveXP', {
	value: (xp, stats) => {
		let leveled = false;
		stats.experience += xp;
		while(stats.experience >= stats.next_level){
			leveled = true;
			//user has enough xp to level up
			stats.level += 1;
			if(stats.level <= 100){
				stats.sanity = 0;
			}
			stats.experience -= stats.next_level;
			stats.next_level = Math.ceil(Math.pow(stats.level/0.51,1.77));
			//str, def, evd, int, wis, con
			let randomStat1 = Math.floor(Math.random()*6);
			//extreme luck
			if(Math.random() > .999){
				randomStat1 = 6;
			}
			if(randomStat1 == 0){
				stats.strength += Math.floor(Math.random()*2)+1;
			}
			if(randomStat1 == 1){
				stats.defense += Math.floor(Math.random()*2)+1;
			}
			if(randomStat1 == 2){
				stats.evade += Math.floor(Math.random()*2)+1;
			}
			if(randomStat1 == 3){
				stats.intel += Math.floor(Math.random()*2)+1;
			}
			if(randomStat1 == 4){
				stats.wisdom += Math.floor(Math.random()*2)+1;
			}
			if(randomStat1 == 5){
				stats.constitution += Math.floor(Math.random()*2)+1;
			}
			if(randomStat1 == 6){
				stats.luck += 1;
			}
		}
		return leveled;
	}
});

Reflect.defineProperty(Users.prototype, 'killUser', {
	value: async (user) => {
		user.balance = 0;
		user.life += 1;
		const removals = [
			User_Buildings.destroy({
				where: {user_id: user.user_id}
			}),
			User_Items.destroy({
				where: {user_id: user.user_id}
			}),
			User_Stats.destroy({
				where: {user_id: user.user_id}
			})
		];
		await Promise.all(removals);
		await user.save();
		let user_stats = await User_Stats.findOne({where: {user_id: user.user_id}});
		if(!user_stats){
			//make new user if couldnt be found
			user_stats = await User_Stats.create({user_id: user.user_id});
		}
		let user_upgrades = await user.getUpgrades(user);
		for(const currentUpgrade of user_upgrades){
			if(currentUpgrade.upgrade.name == '57 Leaf Clover'){
				user_stats.luck += 1 * currentUpgrade.amount;
			}
			else if(currentUpgrade.upgrade.name == 'Muscle Tonic'){
				user_stats.strength += 10 * currentUpgrade.amount;
			}
			else if(currentUpgrade.upgrade.name == 'Speed Cola'){
				user_stats.evade += 10 * currentUpgrade.amount;
			}
			else if(currentUpgrade.upgrade.name == 'Thick Skin'){
				user_stats.defense += 10 * currentUpgrade.amount;
			}
			else if(currentUpgrade.upgrade.name == 'Calm Mind'){
				user_stats.constitution += 10 * currentUpgrade.amount;
			}
		}
		await user_stats.save();
	}
});
module.exports = { Buildings, Items, Upgrades, Users, User_Items, User_Buildings, User_Stats, User_Upgrades, User_Cosmetics, Cosmetic, Avatar, User_Metrics };
