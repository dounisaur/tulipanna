import { ChromaClient } from "chromadb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { loadEnvironmentVariables } from "./setupEnvironment.js";

// Load environment variables
loadEnvironmentVariables();

// Initialize OpenAI Embeddings for vector representations
const openAIEmbeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize ChromaDB client
export const chromaClient = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`,
});
console.log("ChromaDB client initialized");

/**
 * Custom embedding function for ChromaDB
 * This function converts text into vector embeddings that ChromaDB can store and query
 */
export const embeddingFunction = {
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

let collection;

/**
 * Initializes or retrieves the ChromaDB collection for storing conversations
 * This collection will store the vector embeddings of conversations
 */
export async function initializeCollection() {
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
 * Stores a conversation in the vector database with operation metadata
 * @param {string} userId - Unique identifier for the user
 * @param {string} message - User's message
 * @param {string} response - AI's response
 * @param {Object} metadata - Additional metadata about the operation
 */
export async function storeConversation(
  userId,
  message,
  response,
  metadata = {}
) {
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
export async function getRelevantHistory(
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

// Initialize the collection when the module is loaded
console.log("Initializing ChromaDB collection...");
initializeCollection().catch(console.error);
