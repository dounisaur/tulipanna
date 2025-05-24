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
    const { agentType, orderNumber, customerName, response } =
      await headAgent.analyze(messageText, chatId);
    console.log("Message routed to:", agentType);

    // If this was handled by the head agent (general query)
    if (agentType === "HEAD_AGENT") {
      await sendMessage(chatId, response);
      return;
    }

    // Handle the message based on the agent type
    let agentResponse;
    switch (agentType) {
      case "COMPARISON_AGENT":
        agentResponse = await comparisonAgent.handle(messageText);
        break;
      case "DAILY_SALES_AGENT":
        agentResponse = await dailySalesAgent.handle(messageText);
        break;
      case "REFUND_AGENT":
        agentResponse = await refundAgent.handle(messageText);
        break;
      case "ORDER_DETAILS_AGENT":
        agentResponse = await orderDetailsAgent.handle(
          messageText,
          orderNumber
        );
        break;
      case "ORDER_STATUS_AGENT":
        agentResponse = await orderStatusAgent.handle(messageText, orderNumber);
        break;
      case "CUSTOMER_ORDERS_AGENT":
        agentResponse = await customerOrdersAgent.handle(
          messageText,
          customerName
        );
        break;
      case "HELP_AGENT":
        agentResponse = await helpAgent.handle(messageText);
        break;
      default:
        agentResponse =
          "I'm not sure how to handle that type of request. Please try rephrasing your question.";
    }

    // Record the coordinator agent's response in the head agent's history
    headAgent.recordCoordinatorResponse(chatId, agentType, agentResponse, {
      orderNumber,
      customerName,
    });

    // Send the response back to the user
    await sendMessage(chatId, agentResponse);
  } catch (error) {
    console.error("Error processing message:", error);
    const errorMessage =
      "I apologize, but I encountered an error while processing your message. Please try again.";
    headAgent.recordCoordinatorResponse(chatId, "ERROR", errorMessage, {
      error: true,
    });
    await sendMessage(chatId, errorMessage);
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
