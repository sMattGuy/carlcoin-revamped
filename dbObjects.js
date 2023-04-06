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


module.exports = { Buildings, Items, Upgrades, Users, User_Items, User_Buildings, User_Stats, User_Upgrades };