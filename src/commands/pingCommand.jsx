const UserProfile = require('../economy/UserProfile');
const { Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");

async function pingCommandLogic({ interaction, reacord }) {
    interaction.reply('Pong!');
}

 const pingCommand = { 
    name: "ping",
    description: "Ping me",
    run: pingCommandLogic,
 };
 
 module.exports = { pingCommand };