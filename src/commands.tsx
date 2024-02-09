import {
	type ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
} from "discord.js"
import { ReacordDiscordJs } from "reacord"
import { Counter } from "./counter"
const UserProfile = require('./economy/UserProfile');
const mongoose = require('mongoose');
import { fetchSkyBlockItems } from "./economy/ItemGamble";
import { fetchImages } from "./economy/ItemGamble";
import { Embed } from "reacord"

interface FancyMessageProps {
    title: string;
    description: string;
    imageUrl: string; // imageUrl should be of type string
}

function FancyMessage({ title, description, imageUrl }: FancyMessageProps) {
    return (
        <Embed
            title={title}
            description={description}
            color={0x00ff00}
            image={{ url: imageUrl.toString() }} // Convert URL object to string
        />
    );
}

type Command = {
	name: string
	description: string
	options?: ApplicationCommandOptionData[]
	run: (context: CommandContext) => unknown
}

type CommandContext = {
	interaction: ChatInputCommandInteraction
	client: Client
	reacord: ReacordDiscordJs
}

const commands: Command[] = [
	{
		name: "daily",
		description: "Collect your daily",
		run: async ({ interaction, reacord }) => {
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
						.render(<FancyMessage title="You already collected your daily today🤣" description="Come back tommorow🙄" imageUrl="" />)
						return;
					}
				} else {
					userProfile = new UserProfile({
						userId: interaction.user.id,
					});
				}

				userProfile.balance += dailyAmount;
				userProfile.lastDailyCollected = new Date();

				userProfile.save();

				reacord
					.createInteractionReply(interaction)
					.render(<FancyMessage title={dailyAmount + "was added to your balance. 💵"} description={"New balance:" + userProfile.balance} imageUrl=""/>)
			} catch (error) {
				console.log(`Error handling /daily: ${error}`)
			}
			
		},
	},
	{
		name: "balance",
		description: "check your balance",
		options: [
			{
				name: "target-user",
				description: "The user who's balance you want to see",
				type: ApplicationCommandOptionType.User,
			},
		],
		run: async ({ interaction, reacord }) => {
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
				.render(targetUserId === interaction.user.id ? <FancyMessage title="💵" description={"Your balance is $" + userProfile.balance} imageUrl="" /> : 
				<FancyMessage title="💵" description={targetMember.displayName + "'s balance is $" + userProfile.balance} imageUrl="" />)
			} catch (error) {
				console.log(`Error handling /balance: ${error}`)
			}
		},
	},
	{
		name: "gamble",
		description: "Gamble some of your balance",
		options: [
			{
				name: "amount",
				description: "The amount of money you want to gamble",
				type: ApplicationCommandOptionType.Number,
			},
		],
		run: async ({ interaction, reacord }) => {
			if (!interaction.inGuild()) {
				interaction.reply({
					content: "Must be in a server to run this command.",
					ephemeral: true,
				});
				return;
			}
			const amount = interaction.options.getNumber('amount');
	
			if (amount < 10 ) {
				interaction.reply('You must gamble more than 10 coins broke ahh');
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
				interaction.reply('You don\'t have enough balance to gamble broke ahh');
				return;
			}
	
			const didWin = Math.random() > 0.5;
	
			if (!didWin) {
				userProfile.balance -= amount;
				await userProfile.save();
	
				reacord
				.createInteractionReply(interaction)
				.render(<FancyMessage title="You didnt win anything!🥱" description="Most gamblers stop before their big win❗" imageUrl="" />)
				return;
			}
	
			const amountWon = Number((amount * (Math.random() + 0.55)).toFixed(0));
	
			userProfile.balance += amountWon;
			await userProfile.save();
	
			reacord
				.createInteractionReply(interaction)
				.render(<FancyMessage title={"🎆You won $" + amountWon} description={"💵Your new balance is $" + userProfile.balance} imageUrl="" />)
		},
	},
	{
		name: "itemgambler",
		description: "You pay $10 you get 1 item/b",
		run: async ({ interaction, reacord }) => {
			const items = await fetchSkyBlockItems();
			const jsonData = await fetchImages();
        if (!items) {
            interaction.reply('Failed to fetch SkyBlock items. Please try again later.');
            return;
        }

		// Function to simulate a gambling roll
		function rollForItem(items) {
    	// Simulate a random roll to select an item
    		const randomIndex = Math.floor(Math.random() * items.length);
    		return items[randomIndex];
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
        const rolledItem = rollForItem(items);
		const imageUrl = getImageUrl(rolledItem, jsonData);
		// Function to get the image URL for the rolled item
		

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
				interaction.reply('You cant gamble broky, get your money up not your funny up');
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
				.render(<FancyMessage title={"🎆You won " + rolledItem.name} description={"Check your inventory using /inventory"} imageUrl={imageUrl} />)
			} catch (error) {
				console.error('Error awarding item to user:', error.message);
				interaction.reply('Failed to award item. Please try again later.');
			}
		},
	},
	{
		name: "trade",
		description: "Trade your items",
		run: async ({ interaction, reacord }) => {
			interaction.reply(`on gang! `);
		},
	},
]

export function setupCommands(client: Client<true>, reacord: ReacordDiscordJs) {
	client.once("ready", async () => {
		try {
			const applicationCommands = commands.map((command) => ({
				name: command.name,
				description: command.description,
				options: command.options,
			}))

			await client.application.commands.set(applicationCommands)

			const commandNames = applicationCommands.map((c) => c.name).join(", ")
			console.info("Registered commands:", commandNames)
		} catch (error) {
			console.error("Failed to register commands:", error)
		}
	})

	client.on("interactionCreate", async (interaction) => {
		if (!interaction.isChatInputCommand()) return

		const command = commands.find((c) => c.name === interaction.commandName)
		try {
			await command?.run({ interaction, client, reacord })
		} catch (error) {
			console.error(`Failed to run command "${command?.name}":`, error)
		}
	})
}
