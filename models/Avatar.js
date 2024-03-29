module.exports = (sequelize, DataTypes) => {
	return sequelize.define('avatar', {
		user_id: {
			type: DataTypes.STRING,
			unique: true,
		},
		background: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
		body: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
		glasses: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
		glasses2: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
		hat: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
		special: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
		special2: {
			type: DataTypes.INTEGER,
			defaultValue: -1,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};
