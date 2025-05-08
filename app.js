require("dotenv").config();
/*
const { PORT, TELEGRAM_TOKEN, SERVER_URL } = process.env
const axios = require('axios')
const qs = require('query-string')
const express_session = require('express-session');
const bodyParser = require('body-parser');
const { axiosInstance } = require("./lib/axios");
*/

const { handler, handleMesage, setTelegramWebhook } = require("./lib/telegram");
const express = require("express");

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
