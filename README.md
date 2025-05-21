# Discord Auto Reaction Bot

A simple bot that automatically reacts to new messages in a Discord channel with a customizable emoji.

## Features

- Reacts only to new messages as they arrive
- Uses configurable emoji (default: 🔥)
- Adds random delays to appear more human-like
- Easy to set up and run

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install discord-simple-api dotenv fs
   ```

2. Create a `.env` file in the same directory as the script with the following contents:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   CHANNEL_ID=your_target_channel_id_here
   DEFAULT_EMOJI=🔥
   ```

3. Replace the placeholder values in the `.env` file:
   - `your_discord_bot_token_here`: Your Discord bot token
   - `your_target_channel_id_here`: The ID of the channel you want to monitor
   - `🔥`: Your preferred emoji (optional, defaults to 🔥)

## Running the Bot

Start the bot with:
```bash
node index.js
```

The bot will:
- Monitor the specified channel for new messages
- React to each new message with your chosen emoji
- Add a random delay (1-3 seconds) before reacting
- Check for new messages every 5 seconds
- Keep track of the last processed message to avoid duplicate reactions

## Stopping the Bot

Press `Ctrl+C` in the terminal to stop the bot.

## Changing Settings

Edit the `.env` file to change the bot token, channel ID, or default emoji.

For more advanced settings (like reaction delays or check interval), modify the configuration section in the script.
