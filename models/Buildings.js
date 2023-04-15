module.exports = (sequelize, DataTypes) => {
	return sequelize.define('buildings', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		cost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		payout: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};
