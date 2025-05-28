import { OpenAI } from "@langchain/openai";
import { ChromaClient } from "chromadb";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { loadEnvironmentVariables } from "./setupEnvironment.js";

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

// Initialize OpenAI Embeddings for vector representations
const openAIEmbeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
  openAIApiKey: process.env.OPENAI_API_KEY,
});
console.log("OpenAI embeddings initialized");

/**
 * Custom embedding function for ChromaDB
 * This function converts text into vector embeddings that ChromaDB can store and query
 */
const embeddingFunction = {
  generate: async (texts) => {
    console.log(`Generating embeddings for ${texts.length} texts`);
    const results = await Promise.all(
      texts.map(async (text) => {
        const result = await openAIEmbeddings.embedQuery(text);
        return result;
      })
    );
    console.log("Embeddings generated successfully");
    return results;
  },
};

// Initialize ChromaDB client
const chromaClient = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`,
});
console.log("ChromaDB client initialized");

let collection;

/**
 * Initializes or retrieves the ChromaDB collection for storing conversations
 * This collection will store the vector embeddings of conversations
 */
async function initializeCollection() {
  try {
    console.log("Checking for existing collections...");
    const collections = await chromaClient.listCollections();
    const collectionExists = collections.some(
      (c) => c.name === "conversation_history"
    );

    if (collectionExists) {
      console.log("Found existing conversation_history collection");
      collection = await chromaClient.getCollection({
        name: "conversation_history",
        embeddingFunction,
      });
    } else {
      console.log("Creating new conversation_history collection");
      collection = await chromaClient.createCollection({
        name: "conversation_history",
        embeddingFunction,
      });
    }
    console.log("ChromaDB collection initialized successfully");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("Collection already exists, getting existing collection");
      collection = await chromaClient.getCollection({
        name: "conversation_history",
        embeddingFunction,
      });
    } else {
      console.error("Error initializing ChromaDB collection:", error);
      throw error;
    }
  }
}

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
 * Stores a conversation in the vector database with operation metadata
 * @param {string} userId - Unique identifier for the user
 * @param {string} message - User's message
 * @param {string} response - AI's response
 * @param {Object} metadata - Additional metadata about the operation
 */
async function storeConversation(userId, message, response, metadata = {}) {
  if (!collection) {
    console.log("Collection not initialized, initializing now...");
    await initializeCollection();
  }

  const conversation = `User: ${message}\nAssistant: ${response}`;
  console.log(`Storing conversation for user ${userId}`);

  try {
    // Generate embeddings for the conversation
    const embeddings = await embeddingFunction.generate([conversation]);

    // Prepare metadata with all fields as strings
    const formattedMetadata = {
      userId: String(userId),
      timestamp: String(Date.now()),
      operationType: String(metadata.operationType || "GENERAL"),
      orderNumber: metadata.orderNumber ? String(metadata.orderNumber) : "",
      customerName: metadata.customerName ? String(metadata.customerName) : "",
      amount: metadata.amount ? String(metadata.amount) : "",
      status: metadata.status ? String(metadata.status) : "",
    };

    // Add to collection with embeddings
    await collection.add({
      ids: [`${userId}_${Date.now()}`],
      embeddings: embeddings,
      documents: [conversation],
      metadatas: [formattedMetadata],
    });

    console.log("Conversation stored successfully");
  } catch (error) {
    console.error("Error storing conversation:", error);
    // Continue execution even if storage fails
  }
}

/**
 * Retrieves relevant conversation history based on the current question and filters
 * @param {string} userId - Unique identifier for the user
 * @param {string} currentQuestion - The current question being asked
 * @param {Object} filters - Optional filters for the search
 * @param {number} limit - Maximum number of relevant conversations to retrieve
 * @returns {string} - Concatenated relevant conversation history
 */
async function getRelevantHistory(
  userId,
  currentQuestion,
  filters = {},
  limit = 5
) {
  if (!collection) {
    console.log("Collection not initialized, initializing now...");
    await initializeCollection();
  }

  try {
    console.log(`Retrieving conversation history for user ${userId}`);
    const results = await collection.query({
      queryTexts: [currentQuestion],
      nResults: limit,
      where: {
        userId,
        ...filters,
      },
    });

    console.log(`Retrieved ${results.documents.length} relevant conversations`);
    return results.documents.join("\n\n");
  } catch (error) {
    console.error("Error retrieving conversation history:", error);
    return ""; // Return empty string if retrieval fails
  }
}

/**
 * Analyzes a general question about past operations
 * @param {string} userId - Unique identifier for the user
 * @param {string} question - The question about past operations
 * @returns {string} - Analysis of past operations
 */
async function analyzePastOperations(userId, question) {
  try {
    console.log(`Analyzing past operations for user ${userId}`);

    // Get relevant conversation history
    const history = await getRelevantHistory(userId, question);

    // If no history exists, return a clear message
    if (!history || history.trim() === "") {
      return "There are no messages in the conversation history. The database has been recently reset.";
    }

    // Create a prompt for analyzing the history
    const analysisPrompt = `Based on the following conversation history, answer the question about past operations.
    Focus on extracting patterns, totals, and specific details mentioned in the history.
    
    Conversation History:
    ${history}
    
    Question: ${question}
    
    Provide a clear and concise answer based only on the information available in the history.`;

    const response = await ragModel.invoke(analysisPrompt);
    return response;
  } catch (error) {
    console.error("Error analyzing past operations:", error);
    return "I apologize, but I encountered an error while analyzing past operations.";
  }
}

/**
 * Main RAG chain that combines retrieval and generation
 * 1. Retrieves relevant conversation history
 * 2. Formats the prompt with context and question
 * 3. Generates a response using the AI ragModel
 */
const ragChain = RunnableSequence.from([
  {
    context: async ({ userId, question }) => {
      console.log(`Processing question for user ${userId}: ${question}`);
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
async function processMessage(userId, message) {
  try {
    console.log(`Processing message from user ${userId}`);

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

// Initialize the collection when the module is loaded
console.log("Initializing ChromaDB collection...");
initializeCollection().catch(console.error);

export {
  processMessage,
  storeConversation,
  getRelevantHistory,
  analyzePastOperations,
};
