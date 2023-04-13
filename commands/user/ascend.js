const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector, StringSelectMenuBuilder } = require('discord.js');
const { get_user, get_user_stats, giveLevels, killUser } = require('../../helper.js');
const { Upgrades } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ascend')
		.setDescription('Lets you ascend to a higher plane of being!'),
	async execute(interaction) {
		let user_data = await get_user(interaction.user.id);
		let user_stats = await get_user_stats(interaction.user.id);
		let user_buildings = await user_data.getBuildings(user_data);
		
		let totalValue = user_data.balance;
		for(let i=0;i<user_buildings.length;i++){
			totalValue += user_buildings[i].building.cost * user_buildings[i].amount;
		}
		let prestigeGain = Math.floor(totalValue / 10);
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
		const ascendEmbed = new EmbedBuilder()
			.setColor(0xf5bf62)
			.setTitle(`Are you sure?`)
			.setDescription(`Ascending means losing everything! Your mortal possessions will grant you ${prestigeGain} Prestige CC in the afterlife! Are you sure you want to ascend?`);
			
		await interaction.reply({embeds:[ascendEmbed],components:[row],ephemeral:true});
		let filter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isButton();
		let collector = new InteractionCollector(interaction.client,{time: 60000, filter});
		collector.once('collect', async i => {
			//if(i.message.interaction.id != interaction.id || i.user.id != interaction.user.id || !i.isButton()) return;
			collector.stop();
			await i.update({components:[]});
			if(i.customId == 'ascend'){
				await user_data.killUser(user_data);
				user_data.prestigeBalance += prestigeGain;
				user_data.save();
				let upgrades = await Upgrades.findAll();
				let selectMenu = new StringSelectMenuBuilder()
				selectMenu.setCustomId('select').setPlaceholder('Nothing Selected');
				for(let i=0;i<upgrades.length;i++){
					let cost = upgrades[i].cost
					let users_upgrade = await user_data.getUpgrade(user_data, upgrades[i]);
					if(users_upgrade)
						cost += (upgrades[i].id * 50 * users_upgrade.amount)
					selectMenu.addOptions({label: `${upgrades[i].name}`, description: `Costs ${cost}CC`, value: `${upgrades[i].id}`})
				}
				selectMenu.addOptions({label: `Cancel`, description: `Cancel the purchase`, value: `cancel`})
				const upgradeRow = new ActionRowBuilder().addComponents(selectMenu);
				const buyEmbed = new EmbedBuilder()
					.setColor(0xf5bf62)
					.setTitle('Select what to purchase!')
					.setDescription(`This is your only chance to buy an upgrade! You have ${user_data.prestigeBalance} Prestige CC!`)
				await interaction.editReply({embeds:[buyEmbed],components:[upgradeRow],ephemeral:true});
				let upFilter = i => i.message.interaction.id == interaction.id && i.user.id == interaction.user.id && i.isStringSelectMenu();
				const upgradeCollector = new InteractionCollector(interaction.client, {time: 15000,filter:upFilter})
				upgradeCollector.on('collect', async menuInteraction => {
					//if(!menuInteraction.isStringSelectMenu() || menuInteraction.user.id != interaction.user.id || menuInteraction.message.interaction.id != interaction.id) return;
					upgradeCollector.stop();
					await interaction.editReply({ content: 'Validating purchase!', components: [], ephemeral:true });
					const selected = menuInteraction.values[0];
					if(selected == 'cancel'){
						const cancelEmbed = new EmbedBuilder()
							.setColor(0xf5bf62)
							.setTitle(`You consumed nothing!`)
							.setDescription(`See you next time!`);
						await interaction.followUp({embeds:[cancelEmbed], ephemeral:true});
						return;
					}
					//get selected upgrade
					let selectedUpgrade = await Upgrades.findOne({where:{id: selected}});
					let cost = selectedUpgrade.cost;
					let users_upgrades = await user_data.getUpgrade(user_data, selectedUpgrade);
					if(users_upgrades)
						cost += (selectedUpgrade.id * 50 * users_upgrades.amount);
					//check if user can afford it
					if(user_data.prestigeBalance - cost < 0){
						//cant afford
						const cantBuyEmbed = new EmbedBuilder()
							.setColor(0xeb3434)
							.setTitle('You don\'t have enough Prestige CC!')
							.setDescription(`You cannot afford this upgrade! You need ${Math.abs(user_data.prestigeBalance - cost)} Prestige CC! Now back to the overworld with you!`);
						await interaction.followUp({embeds:[cantBuyEmbed], ephemeral:true});
					}
					else{
						//purchase
						user_data = await get_user(interaction.user.id);
						user_data.prestigeBalance -= cost;
						await user_data.addUpgrade(user_data, selectedUpgrade);
						user_data.save();
						if(selectedUpgrade.name == '57 Leaf Clover'){
							user_stats.luck += 1;
						}
						else if(selectedUpgrade.name == 'Muscle Tonic'){
							user_stats.strength += 3;
						}
						else if(selectedUpgrade.name == 'Speed Cola'){
							user_stats.evade += 3;
						}
						else if(selectedUpgrade.name == 'Thick Skin'){
							user_stats.defense += 3;
						}
						else if(selectedUpgrade.name == 'Calm Mind'){
							user_stats.constitution += 3;
						}
						user_stats.save();
						const bought = new EmbedBuilder()
							.setColor(0xf5bf62)
							.setTitle(`You bought 1 ${selectedUpgrade.name}!`)
							.setDescription(`You now own have ${user_data.prestigeBalance} Prestige CC! Now back to the overworld with you!`);
						await interaction.followUp({embeds:[bought], ephemeral:true});
					}
				});
				upgradeCollector.on('end', () => {
					
				});
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
		collector.once('end', async i=> {
			
		});
	},
};