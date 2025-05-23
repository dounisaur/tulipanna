import { ChatOpenAI } from "@langchain/openai";
import { loadEnvironmentVariables } from "../setupEnvironment.js";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { OrderTool } from "./tools.js";

// Load environment variables
loadEnvironmentVariables();

// Initialize the LLM with console logging
const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  callbacks: [new ConsoleCallbackHandler()],
  verbose: true,
});

// Head Agent - Determines which coordinator agent should handle the request
export class HeadAgent {
  constructor() {
    this.llm = llm;
  }

  async extractOrderNumber(message) {
    const prompt = `Extract the order number from the following message. The order number is a string of numbers and letters.
    If there is no order number, respond with "NONE".
    The order number is always preceded by "order number" or "order #" or "order".
    Message: ${message}
    
    Examples:
    - "show me the order details for order number 345" -> 345
    - "what's the status of order #123" -> 123
    - "check order 456" -> 456
    - "show me the order details for order number AZ345" -> AZ345
    - "what's the status of order #AZ123" -> AZ123
    - "check order AZ456" -> AZ456
    - "show me all orders for John Doe" -> NONE
    - "help me with my order" -> NONE
    
    Respond with ONLY the order number or "NONE".`;

    console.log("\nExtracting order number...");
    const response = await this.llm.invoke(prompt);
    const orderNumber = response.content.trim();
    console.log("Extracted order number:", orderNumber);

    return orderNumber === "NONE" ? null : orderNumber;
  }

  async analyze(message) {
    console.log("\n=== Head Agent Analysis ===");
    console.log("Input message:", message);

    const prompt = `Analyze the following message and determine which agent should handle it:
    Message: ${message}
    
    The message should be routed to one of these agents:
    1. COMPARISON_AGENT - For requests about comparing data across time periods
    2. DAILY_SALES_AGENT - For requests about specific daily sales data
    3. REFUND_AGENT - For requests about refunds or order cancellations
    4. ORDER_DETAILS_AGENT - For requests about order details for a specific order or for all orders for a customer name (order number, status, etc.)
    5. ORDER_STATUS_AGENT - For requests about the status of an order
    6. HELP_AGENT - For requests about help with the bot.
    
    Examples:
    - "show me the comparison for the last 5 years of data for mothers days sales" -> COMPARISON_AGENT
    - "Show me march 25 daily sales data" -> DAILY_SALES_AGENT
    - "refund order number 345" -> REFUND_AGENT
    - "show me the order details for order number 345" -> ORDER_DETAILS_AGENT
    - "show me the order details for all orders for customer name John Doe" -> ORDER_DETAILS_AGENT
    - "show me the status of order number 345" -> ORDER_STATUS_AGENT
    - "help" -> HELP_AGENT

    Respond with ONLY one of these categories: COMPARISON_AGENT, DAILY_SALES_AGENT, REFUND_AGENT, ORDER_DETAILS_AGENT, ORDER_STATUS_AGENT, HELP_AGENT`;

    console.log("\nSending prompt to LLM...");
    const response = await this.llm.invoke(prompt);
    const agentType = response.content.trim();
    console.log("LLM Response:", agentType);

    // Extract order number if present
    const orderNumber = await this.extractOrderNumber(message);

    console.log("=== End Head Agent Analysis ===\n");

    return {
      agentType,
      orderNumber,
    };
  }
}

// Coordinator Agents
export class ComparisonAgent {
  async handle(message) {
    console.log("\n=== Comparison Agent ===");
    console.log("Handling message:", message);
    console.log("=== End Comparison Agent ===\n");
    return "This would be handled by the Comparison Agent";
  }
}

export class DailySalesAgent {
  async handle(message) {
    console.log("\n=== Daily Sales Agent ===");
    console.log("Handling message:", message);
    console.log("=== End Daily Sales Agent ===\n");
    return "This would be handled by the Daily Sales Agent";
  }
}

export class RefundAgent {
  async handle(message) {
    console.log("\n=== Refund Agent ===");
    console.log("Handling message:", message);
    console.log("=== End Refund Agent ===\n");
    return "This would be handled by the Refund Agent";
  }
}

export class OrderDetailsAgent {
  constructor() {
    this.orderTool = new OrderTool();
  }

  async handle(message, orderNumber = null) {
    console.log("\n=== Order Details Agent ===");
    console.log("Handling message:", message);

    if (!orderNumber) {
      return "I need an order number to fetch the details. Please provide an order number.";
    }

    try {
      console.log("Processing order number:", orderNumber);

      const orderDetails = await this.orderTool.execute(orderNumber);

      if (!orderDetails) {
        return `No order found with order number: ${orderNumber}`;
      }

      const formattedResponse = `
📦 *Order Details*
━━━━━━━━━━━━━━━━
🆔 Order #${orderDetails.id}
📊 Status: ${orderDetails.status}
📅 Date: ${new Date(orderDetails.date_created).toLocaleString()}
📦 Product: ${orderDetails.line_items[0].name}
💰 Total: ${orderDetails.total}
👤 Customer: ${orderDetails.billing.first_name} ${
        orderDetails.billing.last_name
      }
      `.trim();

      console.log("=== End Order Details Agent ===\n");
      return formattedResponse;
    } catch (error) {
      console.error("Error fetching order details:", error);
      return `Error fetching details for order ${orderNumber}. Please verify the order number and try again.`;
    }
  }
}

export class OrderStatusAgent {
  async handle(message, orderNumber = null) {
    console.log("\n=== Order Status Agent ===");
    console.log("Handling message:", message);
    if (orderNumber) {
      console.log("Processing order number:", orderNumber);
    }
    console.log("=== End Order Status Agent ===\n");
    return `Handling order status for order number: ${orderNumber}`;
  }
}

export class HelpAgent {
  async handle(message) {
    console.log("\n=== Help Agent ===");
    console.log("Handling message:", message);
    console.log("=== End Help Agent ===\n");
    return "This would be handled by the Help Agent";
  }
}
