module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_upgrades', {
		user_id: DataTypes.STRING,
		upgrade_id: DataTypes.INTEGER,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};