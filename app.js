import "dotenv/config";
/*
import { PORT, TELEGRAM_TOKEN, SERVER_URL } from process.env;
import axios from 'axios';
import qs from 'query-string';
import express_session from 'express-session';
import bodyParser from 'body-parser';
import { axiosInstance } from "./lib/axios.js";
*/

import { handler, handleMessage, setTelegramWebhook } from "./lib/telegram.js";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

// Load environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/", async (req, res) => {
  // console.log(req.body);
  res.send(await handler(req));
});

// Route to verify server is running
app.get("/", (req, res) => {
  res.send("Anna Bot is running");
  console.log("Anna Bot is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL);
});
