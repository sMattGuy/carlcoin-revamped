module.exports = (sequelize, DataTypes) => {
	return sequelize.define('items', {
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
		},
		consume: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};