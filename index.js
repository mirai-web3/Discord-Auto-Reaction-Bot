/**
 * Discord Auto Reaction Bot
 * 
 * Enhanced with human-like behavior and rate limit protection.
 * Uses .env file for configuration.
 */
require('dotenv').config();
const Discord = require('discord-simple-api');
const fs = require('fs');

// Load configuration from .env file
const config = {
  token: process.env.DISCORD_TOKEN,
  channelId: process.env.CHANNEL_ID,
  defaultEmoji: process.env.DEFAULT_EMOJI || '🔥',
  reactionProbability: parseInt(process.env.REACTION_PROBABILITY || '85'),
  
  // Time parameters (in milliseconds)
  minReactionDelay: 1500,    // Min time before reacting (1.5 seconds)
  maxReactionDelay: 6000,    // Max time before reacting (6 seconds)
  baseCheckInterval: 8000,   // Base interval for checking messages (8 seconds)
  intervalVariation: 4000,   // Random variation added to interval (0-4 seconds)
  
  // Rate limiting protection
  consecutiveErrorThreshold: 3,  // How many errors before backing off
  backoffMultiplier: 2,          // How much to multiply the interval when backing off
  maxBackoffInterval: 300000,    // Maximum backoff interval (5 minutes)
  
  // Persistence
  logFile: 'reaction-log.json'
};

// Validate required configuration
if (!config.token || !config.channelId) {
  console.error('ERROR: Missing required environment variables.');
  console.error('Please create a .env file with DISCORD_TOKEN and CHANNEL_ID.');
  process.exit(1);
}

// Initialize Discord client
const discordClient = new Discord(config.token);

// State variables
let lastProcessedMessageId = '';
let consecutiveErrors = 0;
let currentInterval = config.baseCheckInterval;
let activeCheckInterval = null;
let isProcessing = false;

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
    fs.writeFileSync(config.logFile, JSON.stringify({ 
      lastMessageId: messageId,
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error saving log file: ${error.message}`);
  }
}

/**
 * Generate a random delay between min and max milliseconds
 * @returns {number} Random delay in milliseconds
 */
function getRandomDelay() {
  return Math.floor(Math.random() * (config.maxReactionDelay - config.minReactionDelay + 1)) + config.minReactionDelay;
}

/**
 * Determine if we should react to a message based on probability
 * @returns {boolean} True if we should react, false otherwise
 */
function shouldReactToMessage() {
  return Math.random() * 100 <= config.reactionProbability;
}

/**
 * Calculate human-like timing based on message length
 * @param {string} content - Message content
 * @returns {number} Delay in milliseconds
 */
function calculateHumanLikeDelay(content = '') {
  // Base delay
  const baseDelay = getRandomDelay();
  
  // Add time based on message length (simulates reading time)
  const readingTime = content.length * 20; // ~20ms per character
  
  // Cap reading time at 3 seconds
  const cappedReadingTime = Math.min(readingTime, 3000);
  
  return baseDelay + cappedReadingTime;
}

/**
 * Handle backing off when rate limited
 */
function handleRateLimitBackoff() {
  consecutiveErrors++;
  
  if (consecutiveErrors >= config.consecutiveErrorThreshold) {
    // Increase the check interval (backoff)
    currentInterval = Math.min(
      currentInterval * config.backoffMultiplier,
      config.maxBackoffInterval
    );
    
    console.warn(`Rate limit detected. Backing off. New check interval: ${currentInterval / 1000}s`);
    
    // Reset the interval with the new timing
    resetCheckInterval();
  }
}

/**
 * Reset the error counter when successful
 */
function handleSuccessfulOperation() {
  if (consecutiveErrors > 0) {
    consecutiveErrors = 0;
    
    // If we were backed off, gradually return to normal
    if (currentInterval > config.baseCheckInterval) {
      currentInterval = Math.max(
        currentInterval / config.backoffMultiplier,
        config.baseCheckInterval
      );
      console.log(`Reducing backoff. New check interval: ${currentInterval / 1000}s`);
      resetCheckInterval();
    }
  }
}

/**
 * Reset the check interval with current timing
 */
function resetCheckInterval() {
  // Clear existing interval if any
  if (activeCheckInterval) {
    clearInterval(activeCheckInterval);
  }
  
  // Add random variation to the interval
  const variation = Math.floor(Math.random() * config.intervalVariation);
  const intervalTime = currentInterval + variation;
  
  // Set new interval
  activeCheckInterval = setInterval(checkAndReactToMessages, intervalTime);
  console.log(`Check interval set to ${intervalTime / 1000}s`);
}

/**
 * Check for new messages and react to them
 */
async function checkAndReactToMessages() {
  // Prevent overlapping checks
  if (isProcessing) {
    return;
  }
  
  isProcessing = true;
  
  try {
    // Get messages from the channel (limit to 5 to reduce API usage)
    const messages = await discordClient.getMessagesInChannel(config.channelId, 5);
    
    if (!messages || messages.length === 0) {
      isProcessing = false;
      return;
    }

    // Sort messages by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Get the newest message
    const latestMessage = messages[0];
    
    // Process new messages
    if (latestMessage.id !== lastProcessedMessageId) {
      // Find index of last processed message
      const lastProcessedIndex = messages.findIndex(msg => msg.id === lastProcessedMessageId);
      
      // Determine messages to process
      let messagesToProcess = [];
      
      if (lastProcessedIndex === -1) {
        // If last message not found in batch, just process the latest message
        // to avoid potential spam on startup or after long downtime
        messagesToProcess = [latestMessage];
      } else {
        // Process all messages newer than the last one we processed
        messagesToProcess = messages.slice(0, lastProcessedIndex);
      }
      
      // Process each message with human-like behavior
      for (const message of messagesToProcess) {
        // Skip messages from ourselves to avoid self-reactions
        if (message.author && message.author.bot) {
          continue;
        }
        
        // Random chance to skip reaction (more human-like)
        if (!shouldReactToMessage()) {
          console.log(`Randomly skipped reaction to message: ${message.id}`);
          continue;
        }
        
        // Calculate delay based on message content
        const delay = calculateHumanLikeDelay(message.content);
        
        // Use setTimeout to add a human-like delay before reacting
        setTimeout(async () => {
          try {
            await discordClient.addReaction(config.channelId, message.id, config.defaultEmoji);
            console.log(`Added ${config.defaultEmoji} reaction to message: ${message.id}`);
          } catch (error) {
            if (error.response && error.response.status === 429) {
              console.error('Rate limit hit! Backing off...');
              handleRateLimitBackoff();
            } else {
              console.error(`Error adding reaction to message ${message.id}: ${error.message}`);
            }
          }
        }, delay);
      }
      
      // Update the last processed message ID
      lastProcessedMessageId = latestMessage.id;
      saveLastProcessedMessageId(latestMessage.id);
      
      // Reset error counter on successful operation
      handleSuccessfulOperation();
    }
  } catch (error) {
    console.error(`Error checking for messages: ${error.message}`);
    
    // Check if the error is rate limiting related
    if (error.response && error.response.status === 429) {
      handleRateLimitBackoff();
    }
  } finally {
    isProcessing = false;
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
console.log('='.repeat(50));
console.log(`Starting Discord Auto Reaction Bot`);
console.log(`Channel ID: ${config.channelId}`);
console.log(`Using emoji: ${config.defaultEmoji}`);
console.log(`Reaction probability: ${config.reactionProbability}%`);
console.log('='.repeat(50));

// Perform the initial check after a small delay
setTimeout(() => {
  checkAndReactToMessages();
  resetCheckInterval(); // Set up the interval checks
}, 2000);

// Handle program termination
process.on('SIGINT', () => {
  if (activeCheckInterval) {
    clearInterval(activeCheckInterval);
  }
  console.log('\nAuto-reaction bot gracefully stopped');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Continue running but back off if needed
  handleRateLimitBackoff();
});

// Export the function to change emoji for external use
module.exports = {
  changeReactionEmoji
};
