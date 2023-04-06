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
const User_Upgrades = require('./models/User_Upgrades.js')(sequelize, Sequelize.DataTypes);

User_Items.belongsTo(Items, { foreignKey: 'item_id', as: 'item' });
User_Buildings.belongsTo(Buildings, { foreignKey: 'building_id', as: 'building' });
User_Upgrades.belongsTo(Upgrades, { foreignKey: 'upgrade_id', as: 'upgrade' });

Reflect.defineProperty(Users.prototype, 'getItems', {
	value: (user) => {
		return User_Items.findAll({
			where: {user_id: user.user_id},
			include: ['item'],
		});
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

Reflect.defineProperty(User_Stats.prototype, 'giveXP', {
	value: (xp, stats) => {
		let leveled = false;
		stats.experience += xp;
		while(stats.experience >= stats.next_level){
			leveled = true;
			//user has enough xp to level up
			stats.level += 1;
			stats.experience -= stats.next_level
			stats.next_level = stats.level * 2 + 10;
			//str, def, evd, int, wis, con
			let randomStat1 = Math.floor(Math.random()*6)
			let randomStat2 = Math.floor(Math.random()*6)
			if(randomStat1 == 0 || randomStat2 == 0){
				stats.strength += Math.floor(Math.random()*2)+1
			}
			if(randomStat1 == 1 || randomStat2 == 1){
				stats.defense += Math.floor(Math.random()*2)+1
			}
			if(randomStat1 == 2 || randomStat2 == 2){
				stats.evade += Math.floor(Math.random()*2)+1
			}
			if(randomStat1 == 3 || randomStat2 == 3){
				stats.intel += Math.floor(Math.random()*2)+1
			}
			if(randomStat1 == 4 || randomStat2 == 4){
				stats.wisdom += Math.floor(Math.random()*2)+1
			}
			if(randomStat1 == 5 || randomStat2 == 5){
				stats.constitution += Math.floor(Math.random()*2)+1
			}
		}
		return leveled;
	}
});
module.exports = { Buildings, Items, Upgrades, Users, User_Items, User_Buildings, User_Stats, User_Upgrades };