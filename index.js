/**
 * Discord Auto Reaction Bot
 * 
 * This script uses Discord-Simple-API to automatically react to new messages
 * in a specific channel with configurable emojis.
 */
const Discord = require('discord-simple-api');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const config = {
  token: process.env.DISCORD_TOKEN,
  channelId: process.env.CHANNEL_ID,
  defaultEmoji: process.env.DEFAULT_EMOJI || '🔥', // Use default if not specified in .env
  minDelay: 1000,                  // Minimum delay before reacting (1 second)
  maxDelay: 3000,                  // Maximum delay before reacting (3 seconds)
  checkInterval: 5000,             // Check for new messages every 5 seconds
  logFile: 'reaction-log.json'     // File to store the last processed message ID
};

// Initialize Discord client
const discordClient = new Discord(config.token);

// Store for last processed message ID
let lastProcessedMessageId = '';

// Try to load the last processed message ID from the log file
try {
  if (fs.existsSync(config.logFile)) {
    const logData = JSON.parse(fs.readFileSync(config.logFile, 'utf8'));
    lastProcessedMessageId = logData.lastMessageId || '';
    console.log(`Loaded last processed message ID: ${lastProcessedMessageId}`);
  }
} catch (error) {
  console.warn(`Could not load from log file: ${error.message}`);
}

/**
 * Save the last processed message ID to the log file
 * @param {string} messageId - The ID of the last processed message
 */
function saveLastProcessedMessageId(messageId) {
  try {
    fs.writeFileSync(config.logFile, JSON.stringify({ lastMessageId: messageId }));
  } catch (error) {
    console.error(`Error saving log file: ${error.message}`);
  }
}

/**
 * Generate a random delay between min and max milliseconds
 * @returns {number} Random delay in milliseconds
 */
function getRandomDelay() {
  return Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
}

/**
 * Check for new messages and react to them
 */
async function checkAndReactToMessages() {
  try {
    // Get the latest messages from the channel (limit to 10 to avoid API abuse)
    const messages = await discordClient.getMessagesInChannel(config.channelId, 10);
    
    if (!messages || messages.length === 0) {
      return;
    }

    // Sort messages by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Get the newest message
    const latestMessage = messages[0];
    
    // Check if this is a new message we haven't processed yet
    if (latestMessage.id !== lastProcessedMessageId) {
      // If we have a last processed ID and it's in the list, only process newer messages
      const startIndex = lastProcessedMessageId ? 
        messages.findIndex(msg => msg.id === lastProcessedMessageId) : 
        messages.length;
      
      // If we found the last processed message, react to all newer messages
      const messagesToReact = startIndex > 0 ? 
        messages.slice(0, startIndex) : 
        [latestMessage]; // Otherwise just react to the latest message

      // React to each new message with a random delay
      for (const message of messagesToReact) {
        const delay = getRandomDelay();
        
        // Use setTimeout to add a random delay (appears more human-like)
        setTimeout(async () => {
          try {
            await discordClient.addReaction(config.channelId, message.id, config.defaultEmoji);
            console.log(`Added ${config.defaultEmoji} reaction to message: ${message.id}`);
          } catch (error) {
            console.error(`Error adding reaction to message ${message.id}: ${error.message}`);
          }
        }, delay);
      }
      
      // Update the last processed message ID
      lastProcessedMessageId = latestMessage.id;
      saveLastProcessedMessageId(latestMessage.id);
    }
  } catch (error) {
    console.error(`Error checking for messages: ${error.message}`);
  }
}

/**
 * Change the reaction emoji
 * @param {string} newEmoji - The new emoji to use for reactions
 */
function changeReactionEmoji(newEmoji) {
  if (newEmoji) {
    config.defaultEmoji = newEmoji;
    console.log(`Reaction emoji changed to: ${newEmoji}`);
    return true;
  }
  return false;
}

// Start the auto-reaction process
console.log(`Starting auto-reaction bot for channel: ${config.channelId}`);
console.log(`Using emoji: ${config.defaultEmoji}`);

// Perform the initial check
checkAndReactToMessages();

// Set up the interval to check for new messages periodically
// Add a small random offset to the interval to appear less bot-like
const intervalTime = config.checkInterval + Math.floor(Math.random() * 1000);
const checkInterval = setInterval(checkAndReactToMessages, intervalTime);

// Handle program termination
process.on('SIGINT', () => {
  clearInterval(checkInterval);
  console.log('Auto-reaction bot stopped');
  process.exit(0);
});

// Export the function to change emoji for external use
module.exports = {
  changeReactionEmoji
};
