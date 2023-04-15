module.exports = (sequelize, DataTypes) => {
	return sequelize.define('upgrades', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		cost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		rank: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
	}, {
		timestamps: false,
	});
};
