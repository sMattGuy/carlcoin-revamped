module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 100,
			allowNull: false,
		},
		prestigeBalance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		life: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},
		last_worked: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		last_lootbox: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		dup_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};
