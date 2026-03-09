# Minecraft Bot

This project is a Minecraft bot built using the [mineflayer](https://github.com/PrismarineJS/mineflayer) library. The bot is designed to automate various tasks in the game, such as mining, fishing, crafting, and more. It supports a variety of commands and features to enhance gameplay automation.

## Features

- **Mining**: Automated diamond strip mining with lava and gravel detection and inventory management.
- **Fishing**: Automated fishing with junk item filtering.
- **Crafting**: Craft items using recipes, with support for searching nearby chests for materials.
- **AFK Mode**: Simulate player activity to prevent being kicked for inactivity.
- **Auto Sleep**: Automatically sleep in a bed during nighttime.
- **Base Management**: Set and manage base locations (chest and bed).
- **Inventory Management**: Deposit items into chests and manage inventory space.
- **Pathfinding**: Navigate to specific locations or follow players.
- **Custom Commands**: Easily extendable command system.

## Installation

### Prerequisites

- Node.js (v16 or higher recommended)
- A Minecraft server to connect to

### Steps

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd minecraft-bot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the bot:
   - Open the `config.js` file and update the following fields:
     - `host`: The IP address or hostname of the Minecraft server.
     - `port`: The port of the Minecraft server.
     - `username`: The bot's username.
     - `owner`: Your Minecraft username (for receiving notifications).

4. Start the bot:
   ```bash
   node index.js
   ```
   Optionally, you can specify a username when starting the bot:
   ```bash
   node index.js <bot-username>
   ```

## Commands

The bot supports the following commands, which can be sent via in-game whispers:

- **`/tell username afk`**: Enable AFK mode.
- **`/tell username afk stop`**: Disable AFK mode.
- **`/tell username autoSleep`**: Enable auto-sleep mode.
- **`/tell username autoSleep stop`**: Disable auto-sleep mode.
- **`/tell username base`**: Automatically detect and save the base (chest and bed).
- **`/tell username base clear`**: Clear saved base locations.
- **`/tell username base status`**: Display saved base locations.
- **`/tell username chat <message>`**: Send a chat message.
- **`/tell username chestinfo`**: Scan nearby chests and display their contents.
- **`/tell username come`**: Make the bot come to your location.
- **`/tell username come <x> <y> <z>`**: Make the bot go to specific coordinates.
- **`/tell username craft <item> [amount] [search]`**: Craft an item, optionally searching nearby chests for materials.
- **`/tell username eat`**: Make the bot eat food from its inventory.
- **`/tell username fish`**: Start fishing.
- **`/tell username fish stop`**: Stop fishing.
- **`/tell username fish deposit`**: Deposit caught items into the base chest.

## File Structure

- `index.js`: Main entry point for the bot.
- `config.js`: Configuration file for server and bot settings.
- `bot_memory.json`: Stores persistent data such as base locations.
- `lib/common.js`: Utility functions for memory management, notifications, and more.
- `systems/mining.js`: Advanced mining logic with hazard detection.
- `commands/`: Directory containing individual command implementations.

## Dependencies

- [mineflayer](https://github.com/PrismarineJS/mineflayer): Core library for creating Minecraft bots.
- [mineflayer-pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder): Pathfinding plugin for navigation.
- [mineflayer-pvp](https://github.com/PrismarineJS/mineflayer-pvp): PvP plugin for combat.
- [minecraft-data](https://github.com/PrismarineJS/minecraft-data): Provides Minecraft data for items, blocks, etc.

## License

This project is licensed under the ISC License.
