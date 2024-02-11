import {
	type ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
} from "discord.js"
import { ReacordDiscordJs } from "reacord"
const UserProfile = require('./economy/UserProfile');
const mongoose = require('mongoose');
import { fetchAuctionItems, fetchBazaarItems, fetchSkyBlockItems } from "./economy/ItemGamble";
import { fetchImages } from "./economy/ItemGamble";
import { Embed } from "reacord"
import { getItemNetworth, getPrices } from "skyhelper-networth";


let gamblingInProgress = false;


interface FancyMessageProps {
    title: string;
    description: string;
    imageUrl: string; // imageUrl should be of type string
	color: number;
}


function FancyMessage({ title, description, imageUrl, color }: FancyMessageProps) {
    return (
        <Embed
            title={title}
            description={description}
            color={color}
            image={imageUrl ? { url: imageUrl.toString() } : { url: 'https://i.pinimg.com/736x/8d/53/f4/8d53f47ee07e149e0bbf043db72ccc98.jpg' }} // Convert URL object to string
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
						.render(<FancyMessage title="You already collected your daily today🤣" description="Come back tommorow🙄" imageUrl="" color={0xF70404}/>)
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
					.render(<FancyMessage title={dailyAmount + "was added to your balance. 💵"} description={"New balance:" + userProfile.balance} imageUrl="" color={0x04F704}/>)
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
				.render(targetUserId === interaction.user.id ? <FancyMessage title="💵" description={"Your balance is $" + userProfile.balance} imageUrl="" color={0x04F704}/> : 
				<FancyMessage title="💵" description={targetMember.displayName + "'s balance is $" + userProfile.balance} imageUrl="" color={0x04F704}/>)
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
			const amount: number = interaction.options.getNumber('amount');
	
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
				.render(<FancyMessage title="You didnt win anything!🥱" description="Most gamblers stop before their big win❗" imageUrl="" color={0xFF0000} />)
				return;
			}
	
			const amountWon = Number((amount * (Math.random() + 0.55)).toFixed(0));
	
			userProfile.balance += amountWon;
			await userProfile.save();
	
			reacord
				.createInteractionReply(interaction)
				.render(<FancyMessage title={"🎆You won $" + amountWon} description={"💵Your new balance is $" + userProfile.balance} imageUrl="" color={0x55FF00} />)
		},
	},
	{
		name: "itemgambler",
		description: "You pay $10 you get 1 item/b",
		run: async ({ interaction, reacord }) => {

            // Check if gambling process is already in progress
            if (gamblingInProgress) {
                interaction.reply("Sorry, a gambling process is already in progress. Please wait and try again later.");
                return;
            }

            gamblingInProgress = true;
			const items = await fetchSkyBlockItems();
			const jsonData = await fetchImages();
			
			// Define your rarity weights
			const itemRarity = {
				"COMMON": 30,
				"UNCOMMON": 20,
				"RARE": 10,
				"EPIC": 8,
				"LEGENDARY": 3.5,
				"MYTHIC": 1.5,
				"DIVINE": 0.75, //
				"SPECIAL": 4, // Rare but not as rare as Mythic or Divine
				"VERY_SPECIAL": 0.5 //
			};

			const itemColor = {
				"COMMON": parseInt("C2C2C2", 16), // Grey
				"UNCOMMON": parseInt("71DC11", 16), // Green
				"RARE": parseInt("1195DC", 16), // Blue
				"EPIC": parseInt("8611DC", 16), // Purple
				"LEGENDARY": parseInt("E8C515", 16), // Gold
				"MYTHIC": parseInt("D115E8", 16), // Purple
				"DIVINE": parseInt("15DEE8", 16), // Light blue
				"SPECIAL": parseInt("CB2A2A", 16), // Red
				"VERY_SPECIAL": parseInt("FC0000", 16) // Different red
			};

        if (!items) {
            interaction.reply('Failed to fetch SkyBlock items. Please try again later.');
            return;
        }

		// Function to simulate a gambling roll
		function rollForItem(items) {
			// Calculate total weight based on rarity weights
			const totalWeight = Object.values(itemRarity).reduce((acc, weight) => acc + weight, 0);
			
			// Generate a random number between 0 and totalWeight
			const randomNum = Math.random() * totalWeight;

			// Iterate through rarity weights and check where the random number falls
			let cumulativeWeight = 0;
			for (const [rarity, weight] of Object.entries(itemRarity)) {
				cumulativeWeight += weight;
				if (randomNum <= cumulativeWeight) {
					// console.log("Selected rarity:", rarity);

					// Filter items by the selected rarity
					const itemsWithRarity = items.filter(item => item.tier === rarity);

					// If items are found, select a random item and return it
					if (itemsWithRarity.length > 0) {
						const randomIndex = Math.floor(Math.random() * itemsWithRarity.length);
						console.log(itemsWithRarity[randomIndex]);
						return itemsWithRarity[randomIndex];
					}
				}
			}

			console.log("No items found for any rarity.");
			return null; // Return null if no items found for any rarity
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
        const rolledItem = await rollForItem(items);
		const imageUrl = await getImageUrl(rolledItem, jsonData);
		const embedColor = itemColor[rolledItem.tier];
        const jsonItem = JSON.stringify(rolledItem);
		const percentageCalculate = (itemRarity[rolledItem.tier] / Object.values(itemRarity).reduce((acc, weight) => acc + weight, 0)) * 100;
		const itemPercentage = percentageCalculate.toFixed(2) + "%";
        // const itemNetworth = getItemNetworth(jsonItem, { prices: getPrices() })
		
		// console.log(embedColor);
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
				.render(<FancyMessage title={"You won " + rolledItem.name + "("+itemPercentage+")"} description={"Item rarity: " + rolledItem.tier + "\nCheck your inventory using /inventory"} imageUrl={imageUrl} color={embedColor} />)
			} catch (error) {
				console.error('Error awarding item to user:', error.message);
				// Check if the error is due to an unknown interaction
                if (error.code === 10062) {
                    // Handle the case of an unknown interaction
                    interaction.reply('Unknown interaction. Please try again later.');
                } else {
                    // Handle other types of errors
                    interaction.reply('An error occurred while processing your request. Please try again later.');
                }
			} finally {
                gamblingInProgress = false;
            }
		},
	},
	{
		name: "ping",
		description: "ping me",
		run: async ({ interaction, reacord }) => {
			interaction.reply(`You fucking little bitch. Ping me one more time and I will unleash horrors beyond your comprehension. I will make sure you never Sleep again. I won't just kill you, no, no, no, I will give you a fate worse than death. First, I will break into your house cut off your balls. Next, I will Tie you into an electric chair and make you listen to Baby Shark on loop for 10 hours strait. And After that, I will repeat for the next day, and the next, and the next until you can barely open your eyes. and what will happen after that? Will I kill you? No, Instead of killing you, I will remove what is left of your penis and shove it into your mouth. I will make you choack on it. Then I will (Again) make you listen to Baby Shark on loop for 10 hours strait. And After that, I will repeat for the next day, and the next, and the next until you can barely open your eyes. Then I will gouge your fucking eyes out, I will gouge out the left one, wait until you stop screaming and crying for help, then I will cut off the right one. if you are dead, I will make it look like you hanged yourself because your parents didn't love you enough. I will draw the blood red diamond In YOUR blood. This will cause a chain reaction and will definingly make Everyone (including me) happy, the world will be a utopia, a better place even. If you ARE alive, Then I will SLOWLY Turn the Electric chair voltage, and then I will make you overdose on painkillers so I won't hurt, YET. Then I will activate the electric chair and It WILL give YOU a slow and painful fucking death. This means your dead, which circles back to option 1 I mentioned earlier: I will make it look like you hanged yourself because your parents didn't love you enough. I will draw the blood red diamond In YOUR blood. This will cause a chain reaction and will definingly make Everyone (including me) happy, the world will be a utopia, a better place even. I have 37 more characters left so: In conclusion Kill yourself or I will do it for you`);
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
