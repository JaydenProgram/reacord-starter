const UserProfile = require('../economy/UserProfile');
const { Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");
const { FancyMessage } = require("../reactComponents/fancyMessage");

async function dailyCommandLogic({ interaction, reacord }) {
    const dailyAmount = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    if (!interaction.inGuild()) {
        interaction.reply({
            content: "Must be in a server to run this command.",
            ephemeral: true,
        });
        return;
    }
    try {
        let userProfile = await UserProfile.findOne({
            userId: interaction.user.id,
        });

        if (userProfile) {
            const lastDailyDate = userProfile.lastDailyCollected?.toDateString();
            const currentDate = new Date().toDateString();

            if (lastDailyDate === currentDate) {
                reacord
                    .createInteractionReply(interaction)
                    .render(<FancyMessage title="You already collected your daily today🤣" description="Come back tommorow🙄" imageUrl={null} color={0xF70404}/>);
                return;
            }
        } else {
            userProfile = new UserProfile({
                userId: interaction.user.id,
            });
        }

        userProfile.balance += dailyAmount;
        userProfile.lastDailyCollected = new Date();

        await userProfile.save();

        reacord
            .createInteractionReply(interaction)
            .render(<FancyMessage title={`${dailyAmount} was added to your balance. 💵`} description={`New balance: ${userProfile.balance}`} imageUrl={null} color={0x04F704}/>);
    } catch (error) {
        console.log(`Error handling /daily: ${error}`);
        interaction.reply({
            content: "An error occurred while processing your request. Please try again later.",
            ephemeral: true,
        });
    }
}

const dailyCommand = {
    name: "daily",
    description: "Collect your daily",
    run: dailyCommandLogic, // Assuming dailyCommandLogic is the function for daily command logic
};

module.exports = { dailyCommand };
