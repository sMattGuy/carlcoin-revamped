const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector, StringSelectMenuBuilder } = require('discord.js');
const { get_user, get_user_stats, get_user_metrics, giveLevels, killUser } = require('../../helper.js');
const { Upgrades } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ascend')
		.setDescription('Lets you ascend to a higher plane of being!'),
	async execute(interaction) {
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		let user_buildings = await user_data.getBuildings(user_data);
		let user_metric = await get_user_metrics(interaction.user.id);
		
		
		let totalValue = user_data.balance;
		for(let i=0;i<user_buildings.length;i++){
			totalValue += user_buildings[i].building.cost * user_buildings[i].amount;
		}
	

		if(totalValue < 100000){
			const poorEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle(`You don't have enough coin!`)
			.setDescription(`You need at least 100000 CC networth to prestige! Come back later when youre richer!`);
			
			await interaction.reply({embeds:[poorEmbed],ephemeral:true});
			return;
		}
		
		let prestigeGain = Math.floor(totalValue / 10);
		let prestigeLevel = Math.floor(totalValue / 100000);
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('ascend')
					.setLabel('ASCEND!')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('cancel')
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Secondary),
			);

		let onebutton = new ButtonBuilder()
			.setCustomId('oneitem')
			.setLabel('1')
			.setStyle(ButtonStyle.Primary)
		let tenbutton = new ButtonBuilder()
			.setCustomId('tenitem')
			.setLabel('10')
			.setStyle(ButtonStyle.Secondary)
		let hundredbutton = new ButtonBuilder()
			.setCustomId('hundreditem')
			.setLabel('100')
			.setStyle(ButtonStyle.Secondary)

		const amountRow = new ActionRowBuilder()
			.addComponents(onebutton,tenbutton,hundredbutton);

		const ascendEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle(`Are you sure?`)
			.setDescription(`Ascending means losing everything! Your mortal possessions will grant you ${prestigeGain} Prestige CC in the afterlife and put you at Prestige ${user_stats.plevel + prestigeLevel}! Are you sure you want to ascend?`);
			
		await interaction.reply({embeds:[ascendEmbed],components:[row],ephemeral:true});
		let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isButton();
		let message = await interaction.fetchReply();
		const collector = message.createMessageComponentCollector({filter, time: 60000});
		collector.once('collect', async i => {
			collector.stop();
			await i.update({components:[]});
			if(i.customId == 'ascend'){
				user_metric.ascentions += 1;
				user_metric.pc_earned += prestigeGain;
				user_metric.cc_total_lost += user_data.balance;
				await user_data.killUser(user_data);
				user_stats = await get_user_stats(interaction.user.id);
				user_data.prestigeBalance += prestigeGain;
				user_stats.plevel += prestigeLevel;
				await user_data.save();
				let upgrades = await Upgrades.findAll();
				let purchaseAmount = 1;

				purchaseLoop();
				async function purchaseLoop(){
					async function buildSelectMenu(){
						let selectMenu = new StringSelectMenuBuilder()
						selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
						for(let i=0;i<upgrades.length;i++){
							let cost = upgrades[i].cost
							let users_upgrade = await user_data.getUpgrade(user_data, upgrades[i]);
							if(users_upgrade || purchaseAmount > 1){
								for(let j=1;j<=purchaseAmount;j++){
									cost += (upgrades[i].rank * 100 * Math.pow(users_upgrade.amount + j, 2))
								}
							}
							selectMenu.addOptions({label: `${upgrades[i].name}`, description: `Costs ${cost}CC`, value: `${upgrades[i].id}`})
						}
						selectMenu.addOptions({label: `End`, description: `End and return to Earth`, value: `end`})
						return new ActionRowBuilder().addComponents(selectMenu);
					}
					
					const upgradeRow = await buildSelectMenu();
					const buyEmbed = new EmbedBuilder()
						.setColor(0xf5bf62)
						.setTitle('Select what to purchase!')
						.setDescription(`This is your only chance to buy an upgrade! You have ${user_data.prestigeBalance} Prestige CC!`);
					await interaction.editReply({embeds:[buyEmbed],components:[upgradeRow,amountRow],ephemeral:true});
					let upFilter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && (i.isStringSelectMenu() || i.isButton());
					let message = await interaction.fetchReply();
					const upgradeCollector = message.createMessageComponentCollector({filter:upFilter, time: 60000});
					upgradeCollector.on('collect', async menuInteraction => {
						upgradeCollector.stop();
						await menuInteraction.update({ content: 'Validating purchase!', components: [], ephemeral:true });
						let selected = ''
						if(menuInteraction.isStringSelectMenu()){
							selected = menuInteraction.values[0];
						}
						else{
							selected = menuInteraction.customId;
						}
						if(selected == 'oneitem'){
							purchaseAmount = 1;
							onebutton.setStyle(ButtonStyle.Primary);
							tenbutton.setStyle(ButtonStyle.Secondary);
							hundredbutton.setStyle(ButtonStyle.Secondary);
							purchaseLoop();
						}
						else if(selected == 'tenitem'){
							purchaseAmount = 10;
							onebutton.setStyle(ButtonStyle.Secondary);
							tenbutton.setStyle(ButtonStyle.Primary);
							hundredbutton.setStyle(ButtonStyle.Secondary);
							purchaseLoop();
						}
						else if(selected == 'hundreditem'){
							purchaseAmount = 100;
							onebutton.setStyle(ButtonStyle.Secondary);
							tenbutton.setStyle(ButtonStyle.Secondary);
							hundredbutton.setStyle(ButtonStyle.Primary);
							purchaseLoop();
						}
						else if(selected == 'end'){
							const cancelEmbed = new EmbedBuilder()
								.setColor(0xf5bf62)
								.setTitle(`Good luck out there!`)
								.setDescription(`See you next time!`);
							await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
							user_metric.save();
							return;
						}
						else{
							//get selected upgrade
							let selectedUpgrade = await Upgrades.findOne({where:{id: selected}});
							let cost = selectedUpgrade.cost;
							let users_upgrades = await user_data.getUpgrade(user_data, selectedUpgrade);
							if(users_upgrades){
								for(let i=1;i<=purchaseAmount;i++){
									cost += (selectedUpgrade.rank * 100 * Math.pow(users_upgrades.amount+i,2));
								}
							}
							//check if user can afford it
							if(user_data.prestigeBalance - cost < 0){
								//cant afford
								const cantBuyEmbed = new EmbedBuilder()
									.setColor(0xeb3434)
									.setTitle('You don\'t have enough Prestige CC!')
									.setDescription(`You cannot afford this upgrade! You need ${Math.abs(user_data.prestigeBalance - cost)} Prestige CC!`);
								await interaction.followUp({embeds:[cantBuyEmbed], ephemeral:true});
							}
							else{
								//purchase
								user_data = await get_user(interaction.user.id);
								user_data.prestigeBalance -= cost;
								for(let i=0;i<purchaseAmount;i++){
									await user_data.addUpgrade(user_data, selectedUpgrade);
								}
								await user_data.save();
								let gotten_users_upgrades = await user_data.getUpgrade(user_data, selectedUpgrade);
								if(selectedUpgrade.name == '57 Leaf Clover'){
									user_stats.luck += 1;
								}
								else if(selectedUpgrade.name == 'Muscle Tonic'){
									user_stats.strength = 10 * gotten_users_upgrades.amount;
								}
								else if(selectedUpgrade.name == 'Speed Cola'){
									user_stats.evade = 10 * gotten_users_upgrades.amount;
								}
								else if(selectedUpgrade.name == 'Thick Skin'){
									user_stats.defense = 10 * gotten_users_upgrades.amount;
								}
								else if(selectedUpgrade.name == 'Calm Mind'){
									user_stats.constitution = 10 * gotten_users_upgrades.amount;
								}
								user_metric.upgrades_purchased += purchaseAmount;
								await user_stats.save();
								const bought = new EmbedBuilder()
									.setColor(0xf5bf62)
									.setTitle(`You bought ${purchaseAmount} ${selectedUpgrade.name}!`)
									.setDescription(`You now own have ${user_data.prestigeBalance} Prestige CC!`);
								await interaction.followUp({embeds:[bought], ephemeral:true});
							}
							await user_metric.save();
							purchaseLoop();
						}
					});
					upgradeCollector.on('end', async () => {
						await interaction.editReply({components:[],ephemeral:true});
					});
				}
			}
			else if(i.customId == 'cancel'){
				const cancelEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle(`It's too early to die!`)
					.setDescription(`Your time will come eventually...`);
				await interaction.editReply({embeds:[cancelEmbed],components:[],ephemeral:true});
			}
			else{
				//something strange happened
				console.log('im not supposed to be here')
			}
		});
		collector.once('end', async () => {
			await interaction.editReply({components:[],ephemeral:true});
		});
	},
};
