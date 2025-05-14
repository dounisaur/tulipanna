import { loadEnvironmentVariables } from "./setupEnvironment.js";
import axios from "axios";

// Load environment variables
loadEnvironmentVariables();

// Get the API key from the environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

//====================================================================================
/**
 * Function to query the openAi LLM
 * @param {string} prompt - The prompt to send to the LLM
 * @param {number} chatId - The id for the Telegram chat
 * @param {string} userMessage - The message type by the user in Telegram
 * @returns {string} The response from the LLM
 */
//====================================================================================
export async function openAiQuery(prompt, chatId, userMessage) {
    try {
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0, // Setting temperature to 0 for deterministic output
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      const responseText = openaiResponse.data.choices[0].message.content.trim();
  
      /*
      if (userMessage) {
        // Update session history for this chat ID
        updateConversationHistory(chatId, "user", userMessage);
      }
  
      // Update session history with assistant's response
      updateConversationHistory(chatId, "assistant", responseText);
      */
  
      return responseText;
    } catch (error) {
      console.error("Error generating summary:", error);
      return "Oops, I couldn't generate a response. Please try again.";
    }
  }

  //====================================================================================
/**
 * Function to generate a summary using session context
 * Triggered from within the webhook when the user types regular text
 * Uses the summary field in the air table for "Business Data Summaries:"
 * @param {number} chatId - The id for the Telegram chat
 * @param {string} userMessage - The message sent from Telegram
 * @param {string} orderJson - JSON object containing order details
 * @returns {string} The response from the LLM
 */
//====================================================================================
export async function respondToUser(
  chatId,
  userMessage,
  orderJson,
  chatType
) {
  // Get session context
  const context = getConversationHistory(chatId);

  // Generate prompt
  const prompt = respondToUserPrompt(
    context,
    orderJson,
    userMessage,
    chatType
  );

  // Query LLM to receive response, and update session context for this chatID and assistant's response
  const responseText = await openAiQuery(prompt, chatId, userMessage);

  return responseText;
}