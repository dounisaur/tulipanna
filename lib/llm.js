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

// Load environment variables for API keys and configuration
loadEnvironmentVariables();

// Get the API key from the environment variables for OpenAI authentication
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize the LLM with console logging and specific configuration
// Using GPT-4 with deterministic output (temperature: 0) for consistent responses
export const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  callbacks: [new ConsoleCallbackHandler()],
  verbose: true,
});

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
    // Make a direct API call to OpenAI's chat completion endpoint
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Using GPT-4 optimized mini model for faster responses
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

    // Extract and clean the response text from the API response
    const responseText = openaiResponse.data.choices[0].message.content.trim();

    return responseText;
  } catch (error) {
    // Handle any errors during API communication or response processing
    console.error("Error generating summary:", error);
    return "Oops, I couldn't generate a response. Please try again.";
  }
}

//====================================================================================
/**
 * Function to initialize all agents used in the system
 * @returns {Object} Object containing all initialized agents
 */
//====================================================================================
export async function initializeAgents() {
  // Initialize each specialized agent for different types of queries
  const headAgent = new HeadAgent();
  const comparisonAgent = new ComparisonAgent();
  const dailySalesAgent = new DailySalesAgent();
  const refundAgent = new RefundAgent();
  const orderDetailsAgent = new OrderDetailsAgent();
  const orderStatusAgent = new OrderStatusAgent();
  const customerOrdersAgent = new CustomerOrdersAgent();
  const helpAgent = new HelpAgent();

  // Return all initialized agents as a single object for easy access
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
