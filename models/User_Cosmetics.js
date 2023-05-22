module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_cosmetics', {
		user_id: DataTypes.STRING,
		cosmetic_id: DataTypes.INTEGER,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};