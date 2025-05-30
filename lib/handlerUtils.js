import { initializeAgents } from "./llm.js";
import { storeConversation } from "./ragUtils.js";
import { sendMessage } from "./telegramUtils.js";

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

  // Get the message object and create user ID
  const messageObj = body.message;
  const userId = `tg_${messageObj.from.id}`;

  if (!messageObj || typeof messageObj !== "object") {
    console.log("Invalid message object:", messageObj);
    return;
  }

  // Get the message text and chat ID
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
