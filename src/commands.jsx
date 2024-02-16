const { ApplicationCommandOptionType, ChatInputCommandInteraction, Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");
const UserProfile = require('./economy/UserProfile');
const { fetchSkyBlockItems, fetchImages } = require("./economy/ItemGamble");
const { Embed } = require("reacord");
const { getItemNetworth, getPrices } = require("skyhelper-networth");
const { dailyCommand } = require('./commands/dailyCommand');
const { balanceCommand } = require('./commands/balanceCommand');
const { gambleCommand } = require('./commands/gambleCommand');
const { itemGamblerCommand } = require('./commands/itemGamblerCommand');
const { intentoryCommand } = require('./commands/inventoryCommand');




console.log(dailyCommand);

const commands = [
    dailyCommand,
    balanceCommand,
    gambleCommand,
    itemGamblerCommand,
    intentoryCommand,
];

function setupCommands(client, reacord) {
    client.once("ready", async () => {
        try {
            const applicationCommands = commands.map((command) => ({
                name: command.name,
                description: command.description,
                options: command.options,
            }));

            await client.application.commands.set(applicationCommands);

            const commandNames = applicationCommands.map((c) => c.name).join(", ");
            console.info("Registered commands:", commandNames);
        } catch (error) {
            console.error("Failed to register commands:", error);
        }
    });

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = commands.find((c) => c.name === interaction.commandName);
        try {
            await command?.run({ interaction, client, reacord });
        } catch (error) {
            console.error(`Failed to run command "${command?.name}":`, error);
        }
    });
}

module.exports = { setupCommands };
