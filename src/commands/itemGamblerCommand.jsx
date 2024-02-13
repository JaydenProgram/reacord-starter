const UserProfile = require('../economy/UserProfile');
const { Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");
const { Embed } = require("reacord");
const { fetchSkyBlockItems, fetchImages } = require("../economy/ItemGamble");
const { FancyMessage } = require("../reactComponents/fancyMessage");

async function itemGamblerCommandLogic({ interaction, reacord }) {
    let gamblingInProgress = false;
    if (gamblingInProgress) {
        interaction.reply("Sorry, a gambling process is already in progress. Please wait and try again later.");
        return;
    }

    gamblingInProgress = true;
    const items = await fetchSkyBlockItems();
    const jsonData = await fetchImages();
    
    const itemRarity = {
        "COMMON": 30,
        "UNCOMMON": 20,
        "RARE": 10,
        "EPIC": 8,
        "LEGENDARY": 3.5,
        "MYTHIC": 1.5,
        "DIVINE": 0.75,
        "SPECIAL": 4,
        "VERY_SPECIAL": 0.5
    };

    const itemColor = {
        "COMMON": parseInt("C2C2C2", 16),
        "UNCOMMON": parseInt("71DC11", 16),
        "RARE": parseInt("1195DC", 16),
        "EPIC": parseInt("8611DC", 16),
        "LEGENDARY": parseInt("E8C515", 16),
        "MYTHIC": parseInt("D115E8", 16),
        "DIVINE": parseInt("15DEE8", 16),
        "SPECIAL": parseInt("CB2A2A", 16),
        "VERY_SPECIAL": parseInt("FC0000", 16)
    };

    if (!items) {
        interaction.reply('Failed to fetch SkyBlock items. Please try again later.');
        return;
    }

    function rollForItem(items) {
        const totalWeight = Object.values(itemRarity).reduce((acc, weight) => acc + weight, 0);
        const randomNum = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (const [rarity, weight] of Object.entries(itemRarity)) {
            cumulativeWeight += weight;
            if (randomNum <= cumulativeWeight) {
                const itemsWithRarity = items.filter(item => item.tier === rarity);
                if (itemsWithRarity.length > 0) {
                    const randomIndex = Math.floor(Math.random() * itemsWithRarity.length);
                    return itemsWithRarity[randomIndex];
                }
            }
        }
        return null;
    }

    function getImageUrl(rolledItem, jsonData) {
        const itemId = rolledItem.id;
        const realId = jsonData['itemHash.json'][itemId];
        const itemData = jsonData['images.json'][realId];
        if (itemData) {
            return rolledItem.skin === 'enchanted' ? itemData.enchanted : itemData.normal;
        }
        return null;    
    }

     // Simulate a gambling roll
    const rolledItem = await rollForItem(items);
    const imageUrl = await getImageUrl(rolledItem, jsonData);
    const embedColor = itemColor[rolledItem.tier];
    const jsonItem = JSON.stringify(rolledItem);
    const percentageCalculate = (itemRarity[rolledItem.tier] / Object.values(itemRarity).reduce((acc, weight) => acc + weight, 0)) * 100;
    const itemPercentage = percentageCalculate.toFixed(2) + "%";
    try {
        let userProfile = await UserProfile.findOne({
            userId: interaction.user.id,
        });

        if (!userProfile) {
            userProfile = new UserProfile({
                userId: interaction.user.id,
            });
        }

        const amount = 10;

        if (userProfile.balance < amount ) {
            interaction.reply('You need at least $10 to gamble.');
            return;
        }

        const initialItemCount = userProfile.items.length;
        userProfile.items.push({
            itemId: rolledItem.id,
            itemName: rolledItem.name,
        });
        const isPushSuccessful = userProfile.items.length > initialItemCount;

        if (isPushSuccessful) {
            userProfile.balance -= 10;
        } else {
            return;
        }

        await userProfile.save();
        reacord
            .createInteractionReply(interaction)
            .render(<FancyMessage title={"You won " + rolledItem.name + "("+itemPercentage+")"} description={"Item rarity: " + rolledItem.tier + "\nCheck your inventory using /inventory"} imageUrl={imageUrl} color={embedColor} />);
        } catch (error) {
            console.error('Error awarding item to user:', error.message);
            if (error.code === 10062) {
                interaction.reply('Unknown interaction. Please try again later.');
            } else {
                interaction.reply('An error occurred while processing your request. Please try again later.');
            }
        } finally {
            gamblingInProgress = false;
        }
}

const itemGamblerCommand = { 
    name: "itemgambler",
    description: "Pay $10 to get 1 item",
    run: itemGamblerCommandLogic, 
};

module.exports = { itemGamblerCommand };