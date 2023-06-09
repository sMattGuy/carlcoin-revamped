module.exports = (sequelize, DataTypes) => {
	return sequelize.define('metrics', {
		user_id: {
			type: DataTypes.STRING,
			unique: true,
		},
		games_won: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		games_lost: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		blackjack_plays: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		rps_plays: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		battle_plays: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		threecard_plays: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		videopoker_plays: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		ascentions: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		deaths: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_payed: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_received: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_gambled: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_gambled_won: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_gambled_lost: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_worked: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_lost_death: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_total_gained: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_total_lost: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_earned_realty: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		cc_bestowed: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		pc_earned: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		most_cc_won: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		most_cc_lost: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		consumables_used: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		upgrades_purchased: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		items_purchased: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		buildings_purchased: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		buildings_sold: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		experience_earned: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		highest_level: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		highest_cc_balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		lootboxes_earned: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};