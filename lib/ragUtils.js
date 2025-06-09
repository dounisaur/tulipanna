import { OpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { loadEnvironmentVariables } from "./setupEnvironment.js";
import { storeConversation, getRelevantHistory } from "./chromaDb.js";

// Load environment variables
loadEnvironmentVariables();

console.log("\n=== RAGUtils module loaded ===========================");

/**
 * This module implements a RAG (Retrieval-Augmented Generation) system with conversation history.
 * It uses:
 * - OpenAI for text generation and embeddings
 * - ChromaDB for vector storage of conversations
 * - LangChain for orchestrating the RAG pipeline
 */

// Initialize OpenAI for text generation
const ragModel = new OpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});
console.log("OpenAI ragModel initialized");

/**
 * Processes a new message from a user
 * @param {string} userId - Unique identifier for the user
 * @param {string} message - The user's message
 * @param {string} customPrompt - Optional custom prompt for the agent
 * @returns {string} - The AI's response
 */
export async function processMessage(userId, message, customPrompt = null) {
  try {
    console.log(`Processing message from user${userId}: ${message}`);

    // Get relevant conversation history
    const history = await getRelevantHistory(userId, message);

    // Create the prompt template
    const template =
      customPrompt ||
      `You are an AI assistant for an e-commerce store. Use the following pieces of conversation history to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Conversation History:
{context}

Current Question: {question}

Answer:`;

    const prompt = PromptTemplate.fromTemplate(template);

    // Create the RAG chain
    const ragChain = RunnableSequence.from([
      {
        context: () => history,
        question: () => message,
      },
      prompt,
      ragModel,
      new StringOutputParser(),
    ]);

    // Get response from RAG chain
    const response = await ragChain.invoke();
    console.log("Generated response successfully");

    // Store the conversation
    await storeConversation(userId, message, response);
    console.log("Conversation stored in history");

    return response;
  } catch (error) {
    console.error("Error processing message:", error);
    return "I apologize, but I encountered an error processing your message. Please try again.";
  }
}
