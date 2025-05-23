import { openAiQuery } from "./llm.js";
import { getOrders, getOrder, getOrderByName } from "./woocommApi.js";
import { HeadAgent } from "./agents/headAgent.js";
import {
  ComparisonAgent,
  DailySalesAgent,
  RefundAgent,
  OrderDetailsAgent,
  OrderStatusAgent,
  HelpAgent,
  CustomerOrdersAgent,
} from "./agents/coordinatorAgents.js";
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

//====================================================================================
/**
 * Function to process webhook requests
 * @param {NextApiRequest} req - The incoming request object
 * @param {NextApiResponse} res - The response object to send back to the client
 * @param {string} botToken - The token for the Telegram bot
 * @param {string} botType - The type of the Telegram bot
 */
//====================================================================================
export async function processWebhook(req, res, botToken, botType) {
  if (req.session.isProcessing) {
    return res.status(429).send("Too many requests");
  }

  req.session.isProcessing = true; // Set processing flag
  try {
    // Check for user addition/removal events and other notifications
    if (req.body.message) {
      const message = req.body.message;

      // Normal message processing
      await createWebhookHandler(botToken, botType)(req, res);
    }

    // Send response after processing
    if (!res.headersSent) {
      return res.status(200).send("Message processed"); // Ensure this is only called once
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Send error response only if it hasn't been sent yet
    if (!res.headersSent) {
      return res.status(500).send("Internal Server Error");
    }
  } finally {
    req.session.isProcessing = false; // Reset processing flag
  }
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
        break;
      case "help":
        return sendMessage(
          messageObj,
          "Here are the available commands:\n\n" +
            "/start - Start a conversation\n" +
            "/help - Show this help message\n" +
            "/orders - View recent orders\n" +
            "/find [first name] [last name] - Find orders by customer name\n" +
            "/ordernumber [number] - Get details for a specific order\n\n" +
            "You can also just type your questions directly, and I'll do my best to help!",
          true
        );
        break;
      case "orders":
        const orders = await getOrders();

        console.log("orders", orders[0]);

        const orderObject = orders[0];
        const orderDetails = `
          Order #${orderObject.id}
          First Name: ${orderObject.billing.first_name}
          Last Name: ${orderObject.billing.last_name}
          Product: ${orderObject.line_items[0].name}
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
        break;
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
            Product: ${order.line_items[0].name}
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
        break;
      case "find":
        // Check if any arguments were provided
        if (!args || args.length < 2) {
          return sendMessage(
            messageObj,
            "❌ Error: Please provide both first name and last name.\nFormat: /find John Smith",
            true
          );
        }

        const firstName = args[0];
        const lastName = args[1];
        const name = `${firstName} ${lastName}`;

        try {
          // Get all orders
          const orderObject = await getOrderByName(name);

          // Filter orderObject by customer name
          const customerOrders = orderObject.filter(
            (order) =>
              order.billing.first_name.toLowerCase() ===
                firstName.toLowerCase() &&
              order.billing.last_name.toLowerCase() === lastName.toLowerCase()
          );

          if (customerOrders.length === 0) {
            return sendMessage(
              messageObj,
              `❌ No orders found for customer: ${firstName} ${lastName}`,
              true
            );
          }

          // Format all orders for this customer
          let response = `Found ${customerOrders.length} orders for ${firstName} ${lastName}:\n\n`;

          // Sort orders by date, newest first
          customerOrders.sort(
            (a, b) => new Date(b.date_created) - new Date(a.date_created)
          );

          // Add each order to the response
          customerOrders.forEach((orderObject, index) => {
            response += `
Order #${orderObject.id}
Customer Name: ${orderObject.billing.first_name} ${
              orderObject.billing.last_name
            }
Status: ${orderObject.status}
Product: ${orderObject.line_items[0].name}
Date: ${new Date(orderObject.date_created).toLocaleString()}
Total: $${orderObject.total}
            `.trim();

            if (index < customerOrders.length - 1) {
              response += "\n\n";
            }
          });

          // Split into multiple messages if needed
          const MAX_MESSAGE_LENGTH = 4000;
          if (response.length > MAX_MESSAGE_LENGTH) {
            const messages = [];
            let currentMessage = "";
            const orderBlocks = response.split("\n\n");

            for (const block of orderBlocks) {
              if ((currentMessage + block).length > MAX_MESSAGE_LENGTH) {
                messages.push(currentMessage);
                currentMessage = block;
              } else {
                currentMessage += (currentMessage ? "\n\n" : "") + block;
              }
            }
            if (currentMessage) {
              messages.push(currentMessage);
            }

            // Send first message
            await sendMessage(messageObj, messages[0], true);

            // Send remaining messages
            for (let i = 1; i < messages.length; i++) {
              await sendMessage(messageObj, messages[i], true);
            }
            return;
          }

          return sendMessage(messageObj, response, true);
        } catch (error) {
          console.error("Error fetching orders:", error);
          return sendMessage(
            messageObj,
            "Error fetching orders. Please try again later.",
            true
          );
        }
      default:
        return sendMessage(
          messageObj,
          "I don't know what to do with that command!",
          true
        );
        break;
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

  const messageText = messageObj.text || "";
  console.log("Received message:", messageText);

  // Initialize agents
  const headAgent = new HeadAgent();
  const comparisonAgent = new ComparisonAgent();
  const dailySalesAgent = new DailySalesAgent();
  const refundAgent = new RefundAgent();
  const orderDetailsAgent = new OrderDetailsAgent();
  const orderStatusAgent = new OrderStatusAgent();
  const customerOrdersAgent = new CustomerOrdersAgent();
  const helpAgent = new HelpAgent();

  try {
    // Analyze the message type
    const { agentType, orderNumber, customerName } = await headAgent.analyze(
      messageText
    );
    console.log("Message routed to:", agentType);

    let response;
    switch (agentType) {
      case "COMPARISON_AGENT":
        response = await comparisonAgent.handle(messageText);
        break;
      case "DAILY_SALES_AGENT":
        response = await dailySalesAgent.handle(messageText);
        break;
      case "REFUND_AGENT":
        response = await refundAgent.handle(messageText);
        break;
      case "ORDER_DETAILS_AGENT":
        response = await orderDetailsAgent.handle(messageText, orderNumber);
        break;
      case "ORDER_STATUS_AGENT":
        response = await orderStatusAgent.handle(messageText, orderNumber);
        break;
      case "CUSTOMER_ORDERS_AGENT":
        response = await customerOrdersAgent.handle(messageText, customerName);
        break;
      case "HELP_AGENT":
        response = await helpAgent.handle(messageText);
        break;
      default:
        response =
          "I'm not sure how to handle that type of request. Please try rephrasing your question.";
    }

    // Send the response back to the user
    await sendMessage(messageObj, response, false);
  } catch (error) {
    console.error("Error processing message:", error);
    await sendMessage(
      messageObj,
      "I apologize, but I encountered an error while processing your message. Please try again.",
      false
    );
  }
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

    if (!data.ok) {
      console.error("Error sending message:", data);
    }
    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}
