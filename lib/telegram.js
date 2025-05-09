//====================================================================================
/**
 * Function to set the Telegram Webhook
 */
//====================================================================================
export async function setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        drop_pending_updates: true,
      }),
    });
    const data = await response.json();

    console.log("\n=== WEBHOOK SETUP ===========================");
    console.log(`🤖 Bot: ${TELEGRAM_TOKEN.slice(-5)}`);
    console.log(`🔗 URL: ${WEBHOOK_URL}`);
    console.log("📊 Status: ", data);
    console.log("\n⚠️  TROUBLESHOOTING TIP ⚠️");
    console.log("If messages are not being received, verify that WEBHOOK_URL");
    console.log("matches your latest local ngrok or Heroku URI");
    console.log("=============================================");
    return data;
  } catch (error) {
    console.error("Error setting webhook:", error);
    throw error;
  }
}

export function createWebhookHandler(TELEGRAM_TOKEN) {
  return async (req, res) => {
    const message = req.body.message;
    if (message && message.text) {
      const chatId = message.chat.id;
      const userMessage = message.text;

      console.log("\n=== INCOMING MESSAGE ===");
      console.log(`🤖 Bot: ${TELEGRAM_TOKEN.slice(-5)}`);
      console.log(`💬 Type: ${message.chat.type}`);
      console.log(`📝 Message: ${userMessage}`);
      console.log(`👤 Chat ID: ${chatId}`);
      // console.log("=============================================");
    }
  };
}

export function handleMessage(messageObj) {
  if (!messageObj || typeof messageObj !== "object") {
    console.log("Invalid message object received in handleMessage");
    return;
  }

  const messageText = messageObj.text || "";

  if (messageText.charAt(0) === "/") {
    const command = messageText.substr(1);
    switch (command) {
      case "start":
        return sendMessage(messageObj, "Hi there! I am bot, take me to your leader", true);
      default:
        return sendMessage(messageObj, "I don't know what to do with that command!", true);
    }
  } else {
    return sendMessage(messageObj, messageText, false);
  }
}

export async function handler(req) {
  const { body } = req;

  if (!body || !body.message) {
    console.log("Received invalid message format:", body);
    return;
  }

  const messageObj = body.message;
  if (!messageObj || typeof messageObj !== "object") {
    console.log("Invalid message object:", messageObj);
    return;
  }

  await handleMessage(messageObj);
  //  return;
}

export async function sendMessage(messageObj, text, command) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  try {
    const chatId = messageObj.chat.id;
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: command
          ? `Command: ${text}`
          : `Message sent by ${messageObj.from.first_name} ${messageObj.from.last_name}: ${text}`,
      }),
    });
    const data = await response.json();
    console.log("Message sent:", data);

    if (!data.ok) {
      console.error("Error sending message:", data);
    }
    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}
