import { openAiQuery } from "./llm.js";
import { getOrders, getOrder } from "./woocommApi.js";
//====================================================================================
/**
 * Function to set the Telegram Webhook
 */
//====================================================================================
export async function setTelegramWebhook(TELEGRAM_TOKEN, WEBHOOK_URL) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          drop_pending_updates: true,
        }),
      }
    );
    const data = await response.json();

    console.log("\n=== WEBHOOK SETUP ===========================");
    console.log(`🤖 Bot: ${TELEGRAM_TOKEN.slice(-5)}`);
    console.log(`🔗 URL: ${WEBHOOK_URL}`);
    console.log(`📊 Status: `, data);
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

      console.log(`\n=== INCOMING MESSAGE ===`);
      console.log(`🤖 Bot: ${TELEGRAM_TOKEN.slice(-5)}`);
      console.log(`💬 Type: ${chatType}`);
      console.log(`📝 Message: ${userMessage}`);
      console.log(`👤 Chat ID: ${chatId}`);
      // console.log("=============================================");
    }
  };
}

export async function handleMessage(messageObj) {
  if (!messageObj || typeof messageObj !== "object") {
    console.log("Invalid message object received in handleMessage");
    return;
  }

  const messageText = messageObj.text || "";
  console.log("Received message:", messageText);

  // Handle commands (messages starting with /)
  if (messageText.charAt(0) === "/") {
    const [rawCommand, ...args] = messageText.substr(1).split(" ");
    const command = rawCommand.trim().toLowerCase();

    switch (command) {
      case "start":
        return sendMessage(
          messageObj,
          "👋 Welcome to Tulipanna Bot! I'm here to help you with your questions about our products and services. Feel free to ask me anything!",
          true
        );
      case "help":
        return sendMessage(
          messageObj,
          "Here are the available commands:\n\n" +
          "/start - Start a conversation\n" +
          "/help - Show this help message\n" +
          "/orders - View recent orders\n" +
          "/ordernumber [number] - Get details for a specific order\n\n" +
          "You can also just type your questions directly, and I'll do my best to help!",
          true
        );
      case "orders":
        console.log("Matched orders case");
        const orders = await getOrders();

        console.log("orders", orders[0]);

        const orderObject = orders[0];
        const orderDetails = `
          First Name: ${orderObject.billing.first_name}
          Last Name: ${orderObject.billing.last_name}
          Order #${orderObject.id}
          Status: ${orderObject.status}
          Date: ${new Date(orderObject.date_created).toLocaleString()}
          Total: ${orderObject.total}
        `.trim();
        console.log("orderDetails", orderDetails);
        return sendMessage(messageObj, orderDetails, true);
        // COMMENTING THIS OUT FOR NOW - RESPONSE IS TOO LONG FOR TELEGRAM
        return sendMessage(
          messageObj,
          `Orders: ${JSON.stringify(orders[0])}`,
          true
        );
      case "ordernumber":
        console.log("Matched orderNumber case");
        // Check if any arguments were provided
        if (!args || args.length === 0) {
          console.log("No arguments provided");
          return sendMessage(
            messageObj,
            "❌ Error: No order number provided.\nPlease use the format: /orderNumber 12345",
            true
          );
        }

        // Check if the order number is a valid number
        const orderNumber = args[0];
        if (!/^\d+$/.test(orderNumber)) {
          return sendMessage(
            messageObj,
            "❌ Error: Invalid order number format.\nPlease provide a valid number (e.g., /orderNumber 12345)",
            true
          );
        }

        console.log("Processing order number:", orderNumber);

        try {
          const order = await getOrder(orderNumber);
          if (!order || Object.keys(order).length === 0) {
            return sendMessage(
              messageObj,
              `❌ No order found with order number: ${orderNumber}`,
              true
            );
          }

          // Format the order details in a more readable way
          const orderDetails = `
            Order #${order.id}
            Status: ${order.status}
            Date: ${new Date(order.date_created).toLocaleString()}
            Total: ${order.total}
            Customer: ${order.billing.first_name} ${order.billing.last_name}
          `.trim();

          return sendMessage(messageObj, orderDetails, true);
        } catch (error) {
          console.error(`Error fetching order ${orderNumber}:`, error);
          return sendMessage(
            messageObj,
            `Error fetching order ${orderNumber}. Please verify the order number and try again.`,
            true
          );
        }
      default:
        return sendMessage(
          messageObj,
          "I don't know what to do with that command!",
          true
        );
    }
  } else {
    const llmResponse = await openAiQuery(messageText);
    return sendMessage(messageObj, llmResponse, false);
  }
}

export async function handler(req, method) {
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
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: command
            ? `Command: ${text}`
            : `Message sent by ${messageObj.from.first_name} ${messageObj.from.last_name}: ${text}`,
          text: command ? text : text,
          parse_mode: "Markdown",
        }),
      }
    );
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