const UserProfile = require('../economy/UserProfile');
const { Client, MessageActionRow, MessageButton } = require("discord.js");
const { ReacordDiscordJs, Button, ActionRow } = require("reacord");
const { FancyMessageWithButtons } = require("../reactComponents/fancyMessageWithButtons");
const { checkItemPrice } = require("../economy/checkItemPrice");

async function inventoryCommandLogic({ interaction, reacord }) {
   
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

        // Extract items from the user profile
        const userItems = userProfile ? userProfile.items.map(item => ({
            name: item.itemName,
            id: item.itemId,
        })) : [];

        const itemsPerPage = 5; // Number of items per page
        let currentPage = 0;
        const totalPages = Math.ceil(userItems.length / itemsPerPage);

        const displayPage = (page) => {
            const itemsOnPage = userItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
            const description = itemsOnPage.map(item => `- ${item.name}`).join('\n');
            const title = targetUserId === interaction.user.id ? "Your inventory" : `${targetMember.displayName}'s inventory`;
            
            // Create buttons
            const previousButton = {
                label: "Previous",
                customId: "previous",
                onClick: handleButtonClick
            };
            const nextButton = {
                label: "Next",
                customId: "next",
                onClick: handleButtonClick
            };
            
            return (
                <FancyMessageWithButtons
                    title={title}
                    description={description}
                    imageUrl={null}
                    color={0x04F704}
                    buttons={[previousButton, nextButton]}
                />
            );
        };

        const message = reacord.createInteractionReply(interaction).render(displayPage(currentPage));


        function handleButtonClick(event) {
            event.deferUpdate();

            if (event.customId === 'previous') {
                currentPage = (currentPage - 1 + totalPages) % totalPages;
            } else if (event.customId === 'next') {
                currentPage = (currentPage + 1) % totalPages;
            }

            message.edit(displayPage(currentPage));
        }

    } catch (error) {
        console.log(`Error handling /inventory: ${error}`);
    }
}





 const intentoryCommand = { 
    name: "inventory",
    description: "check your inventory",
    options: [
        {
            name: "target-user",
            description: "The user whose inventory you want to see",
            type: 6,
        }
    ],
    run: inventoryCommandLogic,
 };
 
 module.exports = { intentoryCommand };