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
 * Text splitter for breaking down conversations into manageable chunks
 * This helps with processing long conversations and maintaining context
 */
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

/**
 * Template for the RAG prompt
 * This defines how the AI should use conversation history to answer questions
 */
const template = `You are an AI assistant operating in my E-commerce store. Use the following pieces of conversation history to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer. You are given a question and a conversation history.
You need to answer the question based on the conversation history.
You need to answer the question in a way that is helpful to the user.
You need to answer the question in a way that is concise and to the point.


Conversation History:
{context}

Current Question: {question}

Answer:`;

const prompt = PromptTemplate.fromTemplate(template);

/**
 * Main RAG chain that combines retrieval and generation
 * 1. Retrieves relevant conversation history
 * 2. Formats the prompt with context and question
 * 3. Generates a response using the AI ragModel
 */
const ragChain = RunnableSequence.from([
  {
    context: async ({ userId, question }) => {
      const history = await getRelevantHistory(userId, question);
      return history;
    },
    question: ({ question }) => question,
  },
  prompt,
  ragModel,
  new StringOutputParser(),
]);

/**
 * Processes a new message from a user
 * @param {string} userId - Unique identifier for the user
 * @param {string} message - The user's message
 * @returns {string} - The AI's response
 */
export async function processMessage(userId, message) {
  try {
    console.log(`Processing message from user${userId}: ${message}`);

    // Get response from RAG chain
    const response = await ragChain.invoke({
      userId,
      question: message,
    });
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
