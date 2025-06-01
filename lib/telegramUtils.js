/**
 * Utility functions for interacting with the Telegram Bot API
 * @module telegramUtils
 */

//====================================================================================
/**
 * Sets up a webhook for the Telegram bot to receive updates
 * @async
 * @param {string} TELEGRAM_TOKEN - The bot's authentication token
 * @param {string} WEBHOOK_URL - The URL where Telegram will send updates
 * @returns {Promise<Object>} The response from Telegram's API
 * @throws {Error} If the webhook setup fails
 */
//====================================================================================
export async function setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL) {
  try {
    // Make POST request to Telegram's setWebhook endpoint
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          drop_pending_updates: true, // Discard any pending updates when setting webhook
        }),
      }
    );
    const data = await response.json();

    // Log webhook setup information for debugging
    console.log("\n=== WEBHOOK SETUP ===========================");
    console.log(`🤖 Bot: ${TELEGRAM_TOKEN.slice(-5)}`); // Show last 5 chars of token for security
    console.log(`🔗 URL: ${WEBHOOK_URL}`);
    console.log(`📊 Status: `, data);
    console.log("\n⚠️  TROUBLESHOOTING TIP ⚠️");
    console.log("If messages are not being received, verify that WEBHOOK_URL");
    console.log("matches your latest local ngrok or Heroku URI");
    console.log("=============================================");
    return data;
  } catch (error) {
    console.error("Error setting webhook:", error);
    throw error;
  }
}

/**
 * Sends a message to a specific Telegram chat
 * @async
 * @param {string|number} chatId - The ID of the chat to send the message to
 * @param {string} text - The message text to send (supports Markdown formatting)
 * @returns {Promise<Object>} The response from Telegram's API
 * @throws {Error} If the message sending fails
 */
export async function sendMessage(chatId, text) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  try {
    // Make POST request to Telegram's sendMessage endpoint
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown", // Enable Markdown formatting in messages
        }),
      }
    );
    const data = await response.json();

    // Log error if message sending failed
    if (!data.ok) {
      console.error("Error sending message:", data);
    }
    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}
