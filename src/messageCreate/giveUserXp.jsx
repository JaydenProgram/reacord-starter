import Level from "../economy/UserProfile";
import calculateLevels from "../economy/calculateLevels";
const { Client, Message } = require('discord.js');
import { ReacordDiscordJs } from "reacord"

function getRandomXp(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 */

module.exports = async (client, message) => {
    if (!message.inGuild() || message.author.bot) return;

    const xpToGive = getRandomXp(5, 15);

    const query = {
        userId: message.author.id,
        guildId: message.guild.id,
    };

    try {
        const level = await Level.findOne(query);

        if (level) {
            level.xp += xpToGive;

            if (level.xp > calculateLevels(level.level)) {
                level.xp = 0;
                level.level += 1;

                reacord.createChannelMessage(channel).render(`${message.member} you have leveled up to **level ${level.level}**.`);
            
            }
            await level.save().catch((e) => {
                console.log(`Error saving updated level ${e}`);
                return;
            })
        }

        // if (!level)

        else {
            // create new level
            const newLevel = new Level({
                userId: message.author.id,
                guildId: message.guild.id,
                xp: xpToGive,
            });
            await newLevel.save();
        }
    } catch (error) {
        console.log(`error giving xp: ${error}`);
    }
}