const UserProfile = require('../economy/UserProfile');
const { Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");
const { FancyMessage } = require("../reactComponents/fancyMessage");  

function checkItemPrice(rolledItem, itemsPrice) {
    // Convert the item ID to lowercase
    const itemIdLowercase = rolledItem.id.toLowerCase();

    // Check if the item name exists in the fetched prices data
    if (itemsPrice && itemsPrice[itemIdLowercase]) {
        const itemPrice = itemsPrice[itemIdLowercase];
        console.log(`The price of ${rolledItem.name} is ${itemPrice}.`);
        // Use the retrieved price as needed
        return itemPrice;
    } else {
        console.log(`Price data for ${rolledItem.name} not found.`);
        return "0";
    }
}

module.exports = { checkItemPrice };