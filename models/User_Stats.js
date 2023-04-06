module.exports = (sequelize, DataTypes) => {
	return sequelize.define('stats', {
		user_id: {
			type: DataTypes.STRING,
			unique: true,
		},
		experience: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		level: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		next_level: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		luck: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		strength: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		defense: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		evade: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		intel: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		wisdom: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		constitution: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		sanity: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};