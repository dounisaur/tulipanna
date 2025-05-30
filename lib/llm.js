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
