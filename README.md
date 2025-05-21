# Discord Auto Reaction Bot

A human-like automatic reaction bot for Discord that adds emoji reactions to new messages in a channel. Built with natural behavior patterns to avoid detection and rate limits.

## Features

- **Automatic Reactions**: Reacts to new messages as they appear in a specified channel
- **Human-Like Behavior**: Variable delays, selective reactions, and natural timing patterns
- **Rate Limit Protection**: Intelligent backoff system to avoid Discord's "Too Many Requests" errors
- **Memory-Only Operation**: No log files or disk storage needed
- **Real-Time Statistics**: Tracks and displays bot performance with timestamps
- **Customizable**: Configure emoji, reaction probability, and timing parameters

## Installation

1. **Clone or download this repository**

2. **Install dependencies**

   ```bash
   npm install discord-simple-api dotenv
   ```

3. **Create a .env file**

   Create a `.env` file in the project root with:

   ```
   DISCORD_TOKEN=your_discord_token_here
   CHANNEL_ID=your_channel_id_here
   DEFAULT_EMOJI=🔥
   REACTION_PROBABILITY=85
   ```

4. **Start the bot**

   ```bash
   node index.js
   ```

## How It Works

The bot monitors a specific Discord channel and reacts to new messages with a configurable emoji. It uses several techniques to appear more natural:

- **Variable timing**: Adds random delays before reacting
- **Reading simulation**: Longer messages get longer "reading" delays
- **Selective reactions**: Only reacts to a percentage of messages based on REACTION_PROBABILITY
- **Timestamp logging**: All operations are logged with precise timestamps

### REACTION_PROBABILITY Explained

The `REACTION_PROBABILITY` setting (default: 85) controls how often the bot reacts to messages:

- Set to 100: Bot will attempt to react to every message (very bot-like)
- Set to 85: Bot will react to approximately 85% of messages
- Set to 50: Bot will react to only half of the messages
- Lower values make the bot appear more casual/human-like

## Troubleshooting

- **Rate limit errors**: The bot automatically backs off when it encounters rate limits
- **Connection issues**: Check your Discord token is valid
- **No reactions**: Ensure the channel ID is correct and the bot has permission to react

## Acknowledgements

This project relies on [Discord-Simple-API](https://github.com/dante4rt/Discord-Simple-API) created by [Muhammad Ramadhani (dante4rt)](https://github.com/dante4rt). Many thanks to the author for creating this simple yet powerful Discord API wrapper that makes this bot possible.
