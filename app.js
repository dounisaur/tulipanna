import { setTelegramWebhook, createWebhookInfoHandler, processWebhook } from "./lib/telegram.js";
import express from "express";
import { loadEnvironmentVariables } from "./lib/setupEnvironment.js";


// Load environment variables
loadEnvironmentVariables();

const app = express();
const port = process.env.PORT || 3000;

// set environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Middleware to parse JSON bodies
app.use(express.json());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL);
});

// Webhook handler for daily bot
app.post("/", (req, res) => {
  console.log("/webhook-daily route");
  processWebhook(req, res, TELEGRAM_TOKEN, "daily");
});

app.get("/webhook-daily", createWebhookInfoHandler(TELEGRAM_TOKEN, "daily"));
