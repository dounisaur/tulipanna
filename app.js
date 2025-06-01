// Import necessary modules
import { setTelegramWebhook } from "./lib/telegramUtils.js";
import { handleTelegramMessage } from "./lib/messageHandler.js";
import express from "express";
import { loadEnvironmentVariables } from "./lib/setupEnvironment.js";

// Load environment variables
loadEnvironmentVariables();

// Create an instance of express
const app = express();
// Set the port for the server to listen on
const port = process.env.PORT || 3000;

// Extract environment variables for Telegram token and webhook URL
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Middleware to parse JSON bodies
app.use(express.json());

// Handle incoming POST requests for Telegram webhook
app.post("/", async (req, res) => {
  // Process the request and send the response
  res.send(await handleTelegramMessage(req));
});

// Handle incoming GET requests to verify server is running
app.get("/", (req, res) => {
  // Send a response to the client and log to the console
  res.send("Anna Bot is running");
  console.log("Anna Bot is running");
});

// Start the server and listen on the specified port
app.listen(port, () => {
  // Log to the console that the server is running
  console.log(`Server is running on port ${port}`);
  // Set the Telegram webhook
  setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL);
});
