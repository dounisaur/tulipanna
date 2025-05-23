import { openAiQuery, respondToUser } from "./llm.js";
import axios from "axios";
import { getOrders, getOrder, getOrderByName } from "./woocommApi.js";
//====================================================================================
/**
 * Function to set the Telegram Webhook
 */
//====================================================================================
export async function setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          drop_pending_updates: true,
        }),
      }
    );
    const data = await response.json();

    console.log("\n=== WEBHOOK SETUP ===========================");
    console.log(`🤖 Bot: ${TELEGRAM_TOKEN.slice(-5)}`);
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

//====================================================================================
/**
 * Function to get the webhook information
 * @returns {object} Webhook information object
 */
//====================================================================================
export async function getWebhookInfo(botToken) {
  console.log("I am in the function getWebhookInfo");
  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;

    const response = await axios.post(url);

    if (response.data.ok) {
      console.log(
        `Webhook information: ${JSON.stringify(response.data, null, 2)}`
      );
      return response.data;
    } else {
      console.error("Failed to get Webhook information:", response.data);
      return response.data;
    }
  } catch (error) {
    console.error("Failed to get Webhook information:", error);
    throw error;
  }
}

//====================================================================================
/**
 * Factory function to create a webhook information handler for a Telegram bot
 * @param {string} botToken - The token for the specific Telegram bot
 * @returns {Function} A webhook information handler function that retrieves the webhook
 * information
 */
//====================================================================================
export function createWebhookInfoHandler(botToken) {
  console.log("I am in the function createWebhookInfoHandler");
  return async (req, res) => {
    try {
      const webhookInfo = await getWebhookInfo(botToken);
      res.status(200).send({
        message: "Webhook information retrieved successfully",
        webhookInfo,
      });
    } catch {
      res.status(500).send("Failed to retrieve webhook information");
    }
  };
}

//====================================================================================
/**
 * Function to send a message to Telegram with HTML formatting
 * @param {string} botToken - The Telegram bot token to use for sending the message
 * @param {number} chatId - The id for the Telegram chat
 * @param {string} text - The message to send to Telegram
 * @returns {void} Returns early if text is empty, otherwise sends message to Telegram
 */
//====================================================================================
export async function sendMessageToTelegram(botToken, chatId, text) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    console.error(
      `Error sending message to chat ID ${chatId}: Text is empty or not a string`
    );
    return;
  }

  // Replace <br> tags with newlines
  const formattedText = text.replace(/<br>/g, "\n");

  // Split message if it exceeds Telegram's limit
  const MAX_LENGTH = 4000; // Using 4000 to be safe
  const chunks = [];

  if (formattedText.length > MAX_LENGTH) {
    // Split into chunks, trying to break at double newlines when possible
    let currentChunk = "";
    const paragraphs = formattedText.split("\n\n");

    for (const paragraph of paragraphs) {
      if ((currentChunk + "\n\n" + paragraph).length > MAX_LENGTH) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
  } else {
    chunks.push(formattedText);
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Send each chunk sequentially
  for (let i = 0; i < chunks.length; i++) {
    try {
      if (chunks.length > 1) {
        // Add part number if message was split
        // const partIndicator = `[Part ${i + 1}/${chunks.length}]\n\n`;
        await axios.post(telegramApiUrl, {
          chat_id: chatId,
          // text: partIndicator + chunks[i],
          text: chunks[i],
          parse_mode: "HTML",
        });
      } else {
        await axios.post(telegramApiUrl, {
          chat_id: chatId,
          text: chunks[i],
          parse_mode: "HTML",
        });
      }

      // Add a small delay between messages to maintain order
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(
        "Error sending message to Telegram:",
        error.response ? error.response.data : error.message
      );
    }
  }
}

//====================================================================================
/**
 * Function to process webhook requests
 * @param {NextApiRequest} req - The incoming request object
 * @param {NextApiResponse} res - The response object to send back to the client
 * @param {string} botToken - The token for the Telegram bot
 * @param {string} botType - The type of the Telegram bot
 */
//====================================================================================
export async function processWebhook(req, res, botToken, botType) {
  console.log("I am in the function processWebhook");

  try {
    // Check for user addition/removal events and other notifications
    if (req.body.message) {
      const message = req.body.message;

      // Normal message processing
      await createWebhookHandler(botToken, botType)(req, res);
    }

    // Send response after processing
    if (!res.headersSent) {
      return res.status(200).send("Message processed"); // Ensure this is only called once
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Send error response only if it hasn't been sent yet
    if (!res.headersSent) {
      return res.status(500).send("Internal Server Error");
    }
  }
}

export function createWebhookHandler(botToken, chatType) {
  console.log("I am in the function createWebhookHandler");
  return async (req, res) => {
    const message = req.body.message;

    if (message && message.text) {
      const chatId = message.chat.id;
      const userMessage = message.text;

      console.log(`\n=== INCOMING MESSAGE ===`);
      console.log(`🤖 Bot: ${botToken.slice(-5)}`);
      console.log(`💬 Type: ${chatType}`);
      console.log(`📝 Message: ${userMessage}`);
      console.log(`👤 Chat ID: ${chatId}`);
      // console.log("=============================================");

      console.log("Tulipanna Daily Bot message received", userMessage);
      const getOrdersJson = await getOrders();

      const response =
        getOrdersJson.length > 0
          ? await respondToUser(chatId, userMessage, getOrdersJson, chatType)
          : "No data available for a daily summary";
      // console.log("response to telegram is:: " + response);
      // Send the response back to the user via Telegram
      await sendMessageToTelegram(botToken, chatId, response);
    }
  };
}
