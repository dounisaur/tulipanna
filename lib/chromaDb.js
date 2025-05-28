import { ChromaClient } from "chromadb";

// Initialize ChromaDB client
export const chromaClient = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`,
});
console.log("ChromaDB client initialized");
