import { loadEnvironmentVariables } from "./setupEnvironment.js";
import { respondToUserPrompt } from "./prompts.js";
import axios from "axios";

// Load environment variables
loadEnvironmentVariables();

// Get the API key from the environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let conversationHistory = new Map(); // Store session history for the current conversation

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

    if (userMessage) {
      // Update session history for this chat ID
      updateConversationHistory(chatId, "user", userMessage);
    }

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
 * @param {array} getJsonOrder - Json file of order details
 * @returns {string} The response from the LLM
 */
//====================================================================================
export async function respondToUser(
  chatId,
  userMessage,
  getJsonOrder,
  chatType
) {
  // Get session context
  const context = "find me an order";

  console.log("THIS IS THE context", context);

  // Generate prompt
  const prompt = respondToUserPrompt(
    context,
    getJsonOrder,
    userMessage,
    chatType
  );

  // Query LLM to receive response, and update session context for this chatID and assistant's response
  const responseText = await openAiQuery(prompt, chatId, userMessage);

  return responseText;
}

//====================================================================================
/**
 * Function to update the session history for this chat
 * @param {number} chatId - The id for the Telegram chat
 * @param {string} role - The role for context of the chat
 * @param {string} content - The content of the message
 */
//====================================================================================
export function updateConversationHistory(chatId, role, content) {
  if (!conversationHistory.has(chatId)) {
    conversationHistory.set(chatId, { messages: [], lastUpdated: new Date() });
  }

  const chatSession = conversationHistory.get(chatId);
  chatSession.messages.push({ role, content });
  chatSession.lastUpdated = new Date();
}

//====================================================================================
/**
 * Function to get the session context for a given chat ID
 * @param {number} chatId - The id for the Telegram chat
 * @param {object} content - The context of the chat
 */
//====================================================================================
function getConversationHistory(chatId) {
  const chatSession = conversationHistory.get(chatId);
  if (!chatSession) return "";

  return chatSession.messages
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n");
}
