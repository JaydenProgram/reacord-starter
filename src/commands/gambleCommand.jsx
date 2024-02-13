const UserProfile = require('../economy/UserProfile');
const { Client } = require("discord.js");
const { ReacordDiscordJs } = require("reacord");
const { FancyMessage } = require("../reactComponents/fancyMessage");

async function gambleCommandLogic({ interaction, reacord }) {
    if (!interaction.inGuild()) {
        interaction.reply({
            content: "Must be in a server to run this command.",
            ephemeral: true,
        });
        return;
    }
    const amount = interaction.options.getNumber('amount');

    if (amount < 10 ) {
        interaction.reply('You must gamble more than 10 coins to gamble.');
        return;
    }

    let userProfile = await UserProfile.findOne({
        userId: interaction.user.id,
    });

    if (!userProfile) {
        userProfile = new UserProfile({
            userId: interaction.user.id,
        });
    }

    if (amount > userProfile.balance) {
        interaction.reply('You don\'t have enough balance to gamble.');
        return;
    }

    const didWin = Math.random() > 0.5;

    if (!didWin) {
        userProfile.balance -= amount;
        await userProfile.save();

        reacord
        .createInteractionReply(interaction)
        .render(<FancyMessage title="You didnt win anything!🥱" description="Most gamblers stop before their big win❗" imageUrl={null} color={0xFF0000} />);
        return;
    }

    const amountWon = Number((amount * (Math.random() + 0.55)).toFixed(0));

    userProfile.balance += amountWon;
    await userProfile.save();

    reacord
        .createInteractionReply(interaction)
        .render(<FancyMessage title={"🎆You won $" + amountWon} description={"💵Your new balance is $" + userProfile.balance} imageUrl={null} color={0x55FF00} />);
}

 const gambleCommand = {
    name: "gamble",
    description: "Gamble some of your balance",
    options: [
        {
            name: "amount",
            description: "The amount of money you want to gamble",
            type: 10,
        },
    ],
    run: gambleCommandLogic,
 };
 
 module.exports = { gambleCommand };