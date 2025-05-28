import { initializeAgents } from "./llm.js";
import { processMessage, storeConversation } from "./ragUtils.js";
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
 * Main messageHandler function for processing incoming Telegram messages
 * Routes messages to appropriate agents based on message content and type
 *
 * @param {Object} req - The incoming request object containing the message
 * @returns {Promise<void>} - Handles the message processing and response
 */
//====================================================================================
export async function messageHandler(req) {
  const { body } = req;

  if (!body || !body.message) {
    console.log("Received invalid message format:", body);
    return;
  }

  const messageObj = body.message;
  const userId = `tg_${messageObj.from.id}`;

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
    const analysis = await headAgent.analyze(messageText, userId);

    let response;
    if (analysis.isAnalytical) {
      // Handle analytical questions directly
      response = analysis.response;
    } else {
      // Handle operational questions through coordinator agents
      console.log("Message routed to:", analysis.agentType);

      switch (analysis.agentType) {
        case "COMPARISON_AGENT":
          response = await comparisonAgent.handle(messageText);
          break;
        case "DAILY_SALES_AGENT":
          response = await dailySalesAgent.handle(messageText);
          break;
        case "REFUND_AGENT":
          response = await refundAgent.handle(
            messageText,
            analysis.orderNumber
          );
          break;
        case "ORDER_DETAILS_AGENT":
          response = await orderDetailsAgent.handle(
            messageText,
            analysis.orderNumber
          );
          break;
        case "ORDER_STATUS_AGENT":
          response = await orderStatusAgent.handle(
            messageText,
            analysis.orderNumber
          );
          break;
        case "CUSTOMER_ORDERS_AGENT":
          response = await customerOrdersAgent.handle(
            messageText,
            analysis.customerName
          );
          break;
        case "HELP_AGENT":
          response = await helpAgent.handle(messageText);
          break;
        default:
          response =
            "I'm not sure how to handle that type of request. Please try rephrasing your question.";
      }

      // Store the conversation with metadata
      await storeConversation(userId, messageText, response, {
        operationType: analysis.agentType,
        orderNumber: analysis.orderNumber,
        customerName: analysis.customerName,
      });
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
