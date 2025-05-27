import { getRefund } from "./woocommApi.js";

//====================================================================================
/**
 * Function to generate a prompt for respondToUser() function
 * @param {string} context - The context for the chat
 * @param {array} getJsonOrder - The order Json data
 * @param {string} userMessage - The message type by the user in Telegram
 * @returns {string} The prompt string
 */
//====================================================================================
export const respondToUserPrompt = (
  context,
  getJsonOrder,
  userMessage,
  chatType
) => {
  // Set the chat commands based on the chat type
  let orderRefund = getRefund(userMessage);
  const jSONData = JSON.stringify(getJsonOrder, null, 3);
  const formattingText =
    "format your response using telegram html. DO NOT WRAP the response in a HTML tag.";

  return `You are an operational assistant for Tulipanna, a boutique florist operating in Bondi Beach, Sydney, Australia.  
      
      Use the following session context and business data to provide a response.
  
      Previous Conversation Context:
      ${context}
  
      Business Data Summaries:
      ${jSONData}
  
      User message: "${userMessage}"
  
      IMPORTANT COMMAND RULES:
      1. Only attempt to refund an order if the user message has the word refund in it.
  
      IMPORTANT CONTEXT RULES:
      1. Maintain context from previous messages in the conversation.
      2. If the user asks about an order that was previously mentioned, use that context to provide a complete answer.
      3. If the user asks a follow-up question about a previous topic, use the conversation history to provide a relevant response.
      4. If the user uses the word refund in the message to refund an order use the following command: ${orderRefund}

      EXAMPLES:

      - "show me the order details for order number 345"
      - "show me order 14233"
      - "what's the status of order #123"
      - "check order 456"

      ${formattingText}
    `;
};
