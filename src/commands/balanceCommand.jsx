const UserProfile = require('../economy/UserProfile');
const { Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");
const { FancyMessage } = require("../reactComponents/fancyMessage");

async function balanceCommandLogic({ interaction, reacord }) {
    if (!interaction.inGuild()) {
        interaction.reply({
            content: "Must be in a server to run this command.",
            ephemeral: true,
        });
        return;
    }
    const targetUserId = interaction.options.getUser('target-user')?.id || interaction.user.id;
    const targetMember = await interaction.guild.members.fetch(targetUserId);

    try {
        let userProfile = await UserProfile.findOne({ userId: targetUserId });

        if (!userProfile) {
            userProfile = new UserProfile({ userId: targetUserId });
        }

        reacord
        .createInteractionReply(interaction)
        .render(targetUserId === interaction.user.id ? <FancyMessage title="💵" description={"Your balance is $" + userProfile.balance} imageUrl={null} color={0x04F704}/> : 
        <FancyMessage title="💵" description={targetMember.displayName + "'s balance is $" + userProfile.balance} imageUrl={null} color={0x04F704}/>);
    } catch (error) {
        console.log(`Error handling /balance: ${error}`)
    }
}

const balanceCommand = {
    name: "balance",
    description: "Check your balance",
    options: [
        {
            name: "target-user",
            description: "The user whose balance you want to see",
            type: 6,
        }
    ],
    run: balanceCommandLogic, // Assuming balanceCommandLogic is the function for balance command logic
};

module.exports = { balanceCommand };

