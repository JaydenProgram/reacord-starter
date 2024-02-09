import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { ReacordDiscordJs } from "reacord";
import { setupCommands } from "./commands";
import { fetchSkyBlockItems } from "./economy/ItemGamble";
const mongoose = require('mongoose');

async function startBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    const reacord = new ReacordDiscordJs(client);

    setupCommands(client, reacord);

    client.once("ready", () => {
        console.info("Ready!");
    });

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');
        
        await client.login(process.env.BOT_TOKEN);
    } catch (error) {
        console.error('Error during startup:', error);
    }
}

startBot();

