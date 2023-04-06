module.exports = (sequelize, DataTypes) => {
	return sequelize.define('stats', {
		user_id: {
			type: DataTypes.STRING,
			unique: true,
		},
		experience: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},
		next_level: {
			type: DataTypes.INTEGER,
			defaultValue: 10,
			allowNull: false,
		},
		luck: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		strength: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		defense: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		evade: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		intel: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		wisdom: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		constitution: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		sanity: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};