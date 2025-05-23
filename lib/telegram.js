import { initializeAgents } from "./llm.js";
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
 * Function to process webhook requests
 * @param {NextApiRequest} req - The incoming request object
 * @param {NextApiResponse} res - The response object to send back to the client
 * @param {string} botToken - The token for the Telegram bot
 * @param {string} botType - The type of the Telegram bot
 */
//====================================================================================
export async function processWebhook(req, res, botToken, botType) {
  if (req.session.isProcessing) {
    return res.status(429).send("Too many requests");
  }

  req.session.isProcessing = true; // Set processing flag
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
  } finally {
    req.session.isProcessing = false; // Reset processing flag
  }
}

//====================================================================================
/**
 * Main handler function for processing incoming Telegram messages
 * Routes messages to appropriate agents based on message content and type
 *
 * @param {Object} req - The incoming request object containing the message
 * @returns {Promise<void>} - Handles the message processing and response
 */
//====================================================================================
export async function handler(req) {
  const { body } = req;

  if (!body || !body.message) {
    console.log("Received invalid message format:", body);
    return;
  }

  const messageObj = body.message;
  if (!messageObj || typeof messageObj !== "object") {
    console.log("Invalid message object:", messageObj);
    return;
  }

  const messageText = messageObj.text || "";
  const chatId = messageObj.chat.id;
  console.log("Received message:", messageText);

  // Initialize agents
  const {
    headAgent,
    comparisonAgent,
    dailySalesAgent,
    refundAgent,
    orderDetailsAgent,
    orderStatusAgent,
    customerOrdersAgent,
    helpAgent,
  } = await initializeAgents();

  try {
    // Analyze the message type
    const { agentType, orderNumber, customerName } = await headAgent.analyze(
      messageText
    );
    console.log("Message routed to:", agentType);

    // Handle the message based on the agent type
    let response;
    switch (agentType) {
      case "COMPARISON_AGENT":
        response = await comparisonAgent.handle(messageText);
        break;
      case "DAILY_SALES_AGENT":
        response = await dailySalesAgent.handle(messageText);
        break;
      case "REFUND_AGENT":
        response = await refundAgent.handle(messageText);
        break;
      case "ORDER_DETAILS_AGENT":
        response = await orderDetailsAgent.handle(messageText, orderNumber);
        break;
      case "ORDER_STATUS_AGENT":
        response = await orderStatusAgent.handle(messageText, orderNumber);
        break;
      case "CUSTOMER_ORDERS_AGENT":
        response = await customerOrdersAgent.handle(messageText, customerName);
        break;
      case "HELP_AGENT":
        response = await helpAgent.handle(messageText);
        break;
      default:
        response =
          "I'm not sure how to handle that type of request. Please try rephrasing your question.";
    }

    // Send the response back to the user
    await sendMessage(chatId, response);
  } catch (error) {
    console.error("Error processing message:", error);
    await sendMessage(
      chatId,
      "I apologize, but I encountered an error while processing your message. Please try again."
    );
  }
}

export async function sendMessage(chatId, text) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  try {
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
          parse_mode: "Markdown",
        }),
      }
    );
    const data = await response.json();

    if (!data.ok) {
      console.error("Error sending message:", data);
    }
    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}
