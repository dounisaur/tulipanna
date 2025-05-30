import { initializeAgents } from "./llm.js";
import { storeConversation } from "./chromaDb.js";
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
  // Extract the request body
  const { body } = req;

  // Validate the incoming message format
  if (!body || !body.message) {
    console.log("Received invalid message format:", body);
    return;
  }

  // Extract user information and create a unique user ID
  const messageObj = body.message;
  const userId = `tg_${messageObj.from.id}`;

  // Validate the message object structure
  if (!messageObj || typeof messageObj !== "object") {
    console.log("Invalid message object:", messageObj);
    return;
  }

  // Extract message content and chat identifier
  const messageText = messageObj.text || "";
  const chatId = messageObj.chat.id;
  console.log("Received message:", messageText);

  // Initialize all available agents for message processing
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
    // Use the head agent to analyze the message and determine its type
    const analysis = await headAgent.analyze(messageText, userId);

    let response;
    // Handle analytical questions directly through the head agent
    if (analysis.isAnalytical) {
      response = analysis.response;
    } else {
      // Route operational questions to specialized agents based on the analysis
      console.log("Message routed to:", analysis.agentType);

      // Process the message using the appropriate specialized agent
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

      // Store the conversation history with relevant metadata for future reference
      await storeConversation(userId, messageText, response, {
        operationType: analysis.agentType,
        orderNumber: analysis.orderNumber,
        customerName: analysis.customerName,
      });
    }

    // Send the processed response back to the user via Telegram
    await sendMessage(chatId, response);
  } catch (error) {
    // Handle any errors that occur during message processing
    console.error("Error processing message:", error);
    await sendMessage(
      chatId,
      "I apologize, but I encountered an error while processing your message. Please try again."
    );
  }
}
