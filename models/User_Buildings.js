module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_buildings', {
		user_id: DataTypes.STRING,
		building_id: DataTypes.INTEGER,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};