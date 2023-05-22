module.exports = (sequelize, DataTypes) => {
	return sequelize.define('cosmetics', {
		name: {
			type: DataTypes.STRING,
			defaultValue: 'Generic',
			allowNull: false,
		},
		rarity: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		type: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		file: {
			type: DataTypes.STRING,
			defaultValue: 'No File',
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};

/*
	cosmetic types
	0	background
	1	body
	2	glasses
	3	hat
	4	special
*/
