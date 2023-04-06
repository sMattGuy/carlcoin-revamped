module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_items', {
		user_id: DataTypes.STRING,
		items_id: DataTypes.INTEGER,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};