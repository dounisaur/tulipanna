import { loadEnvironmentVariables } from "./setupEnvironment.js";
import axios from "axios";
import { ChatOpenAI } from "@langchain/openai";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { HeadAgent } from "./agents/headAgent.js";
import {
  ComparisonAgent,
  DailySalesAgent,
  RefundAgent,
  OrderDetailsAgent,
  OrderStatusAgent,
  HelpAgent,
  CustomerOrdersAgent,
} from "./agents/coordinatorAgents.js";

// Load environment variables
loadEnvironmentVariables();

// Get the API key from the environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize the LLM with console logging
export const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  callbacks: [new ConsoleCallbackHandler()],
  verbose: true,
});

// Create single instances of agents
const headAgent = new HeadAgent();
const comparisonAgent = new ComparisonAgent();
const dailySalesAgent = new DailySalesAgent();
const refundAgent = new RefundAgent();
const orderDetailsAgent = new OrderDetailsAgent();
const orderStatusAgent = new OrderStatusAgent();
const customerOrdersAgent = new CustomerOrdersAgent();
const helpAgent = new HelpAgent();

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

export async function initializeAgents() {
  return {
    headAgent,
    comparisonAgent,
    dailySalesAgent,
    refundAgent,
    orderDetailsAgent,
    orderStatusAgent,
    customerOrdersAgent,
    helpAgent,
  };
}
