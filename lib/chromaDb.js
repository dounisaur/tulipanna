import { ChromaClient } from "chromadb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { loadEnvironmentVariables } from "./setupEnvironment.js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

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

// Initialize text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

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
    await initializeCollection();
  }

  const conversation = `User: ${message}\nAssistant: ${response}`;
  console.log(`Storing conversation for user ${userId}`);

  try {
    // Split the conversation into chunks
    const chunks = await textSplitter.splitText(conversation);
    console.log(`Split conversation into ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    const embeddings = await embeddingFunction.generate(chunks);

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

    // Create unique IDs for each chunk
    const ids = chunks.map((_, i) => `${userId}_${Date.now()}_${i}`);
    console.log("Generated chunk IDs:", ids);

    // Add to collection with embeddings
    await collection.add({
      ids,
      embeddings,
      documents: chunks,
      metadatas: chunks.map(() => formattedMetadata),
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
    // Log the IDs of retrieved documents to check for duplicates
    if (results.ids) {
      console.log("Retrieved document IDs:", results.ids);
    }
    return results.documents;
  } catch (error) {
    console.error("Error retrieving conversation history:", error);
    return []; // Return empty array if retrieval fails
  }
}

/**
 * Test function to verify text splitter functionality
 * This will store a long conversation and verify it's properly chunked
 */
export async function testTextSplitter() {
  try {
    console.log("\n=== Testing Text Splitter ===");
    console.log("Checking environment variables...");
    console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("CHROMA_HOST:", process.env.CHROMA_HOST);
    console.log("CHROMA_PORT:", process.env.CHROMA_PORT);

    // Create a test-specific collection
    const testCollectionName = "test_conversation_history";
    console.log(`\nCreating test collection: ${testCollectionName}`);

    // Check if test collection exists and delete it if it does
    const collections = await chromaClient.listCollections();
    if (collections.some((c) => c.name === testCollectionName)) {
      console.log("Deleting existing test collection...");
      await chromaClient.deleteCollection({ name: testCollectionName });
      // Wait a moment to ensure deletion is processed
      await new Promise((res) => setTimeout(res, 1000));
    }

    let testCollection;
    try {
      // Try to create the test collection
      testCollection = await chromaClient.createCollection({
        name: testCollectionName,
        embeddingFunction,
      });
      console.log("Test collection created successfully");
    } catch (err) {
      if (err.message && err.message.includes("already exists")) {
        console.log(
          "Test collection still exists, getting existing collection..."
        );
        testCollection = await chromaClient.getCollection({
          name: testCollectionName,
          embeddingFunction,
        });
      } else {
        throw err;
      }
    }

    const timestamp = Date.now();
    console.log("Test timestamp:", timestamp);

    // Create a long conversation that will definitely be split into multiple chunks
    const longMessage =
      "I have a question about my recent order #12345. " +
      "I ordered 3 items: a blue t-shirt, a pair of jeans, and a hat. " +
      "The t-shirt arrived but the jeans and hat are missing. " +
      "I also noticed that the t-shirt is a different shade of blue than what was shown on the website. " +
      "Can you help me track down my missing items and explain the color difference? " +
      "I've been a customer for over 2 years and this is the first time I've had any issues. " +
      "I need these items for an upcoming event next week, so it's quite urgent. " +
      "Also, I was wondering if you could tell me about your return policy for items that don't match the website description.";

    const longResponse =
      "I understand your concerns about your order #12345. " +
      "Let me help you with both the missing items and the color discrepancy. " +
      "First, I've checked your order and I can see that the jeans and hat were shipped separately " +
      "due to different warehouse locations. They should arrive within 2-3 business days. " +
      "Regarding the t-shirt color, we recently updated our product photography to better match " +
      "the actual colors, but it seems the blue t-shirt you received is from our previous batch. " +
      "We offer a 30-day return policy for items that don't match the website description, " +
      "and I can help you initiate a return if you'd like. Would you like me to send you " +
      "a return label for the t-shirt? I can also expedite the shipping for your missing items " +
      "at no additional cost to make sure they arrive before your event.";

    // Store the conversation in test collection
    console.log("\nStoring test conversation...");
    const conversation = `User: ${longMessage}\nAssistant: ${longResponse}`;
    const chunks = await textSplitter.splitText(conversation);
    console.log(`Split conversation into ${chunks.length} chunks`);

    const embeddings = await embeddingFunction.generate(chunks);
    const ids = chunks.map((_, i) => `test_user_${timestamp}_${i}`);
    console.log("Generated chunk IDs:", ids);

    const formattedMetadata = {
      userId: "test_user",
      timestamp: String(timestamp),
      operationType: "TEST",
      orderNumber: "12345",
    };

    await testCollection.add({
      ids,
      embeddings,
      documents: chunks,
      metadatas: chunks.map(() => formattedMetadata),
    });
    console.log("Conversation stored successfully in test collection");

    // Retrieve the conversation from test collection
    console.log("\nRetrieving test conversation...");
    const results = await testCollection.query({
      queryTexts: ["What happened with my order #12345?"],
      nResults: 5,
      where: {
        $and: [
          { userId: { $eq: "test_user" } },
          { timestamp: { $eq: String(timestamp) } },
        ],
      },
    });

    // Flatten the result (ChromaDB returns an array of arrays)
    const flatChunks = Array.isArray(results.documents)
      ? results.documents.flat()
      : [];

    console.log("\nRetrieved conversation chunks:");
    console.log("Number of chunks retrieved:", flatChunks.length);
    if (results.ids) {
      console.log("Retrieved document IDs:", results.ids.flat());
    }

    flatChunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index + 1} ---`);
      console.log(chunk);
      console.log("--- End Chunk ---");
    });

    // Clean up test collection
    console.log("\nCleaning up test collection...");
    await chromaClient.deleteCollection({ name: testCollectionName });
    console.log("Test collection deleted");

    console.log("\n=== Text Splitter Test Complete ===");
    return true;
  } catch (error) {
    console.error("Error in text splitter test:", error);
    return false;
  }
}

// Initialize the collection when the module is loaded
console.log("Initializing ChromaDB collection...");
initializeCollection().catch(console.error);
