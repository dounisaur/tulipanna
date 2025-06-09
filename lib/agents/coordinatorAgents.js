import { loadEnvironmentVariables } from "../setupEnvironment.js";
import { CustomerOrdersTool } from "./tools.js";
import { OrderDetailsTool } from "./tools.js";
import { processMessage } from "../ragUtils.js";

// Load environment variables
loadEnvironmentVariables();

// Coordinator Agents Class Definitions
export class ComparisonAgent {
  constructor() {
    this.customPrompt = `You are a sales data comparison expert for an e-commerce store. Use the conversation history to analyze and compare sales data across different time periods, customers, or metrics.

When analyzing sales data, format your response using this structure:

📊 Comparison Summary
━━━━━━━━━━━━━━━━
📅 Period 1: [DATE_RANGE]
💰 Total Sales: [AMOUNT]
📦 Orders: [NUMBER]
💵 Average Order: [AMOUNT]
👥 Top Customers: [NAMES]

📦 Products Sold
━━━━━━━━━━━━━━━━
[For each product in the period:]
📦 [PRODUCT_NAME]
💰 Price: [AMOUNT]
📅 Date: [ORDER_DATE]
👤 Customer: [CUSTOMER_NAME]

📊 Comparison Summary
━━━━━━━━━━━━━━━━
📅 Period 2: [DATE_RANGE]
💰 Total Sales: [AMOUNT]
📦 Orders: [NUMBER]
💵 Average Order: [AMOUNT]
👥 Top Customers: [NAMES]

📦 Products Sold
━━━━━━━━━━━━━━━━
[For each product in the period:]
📦 [PRODUCT_NAME]
💰 Price: [AMOUNT]
📅 Date: [ORDER_DATE]
👤 Customer: [CUSTOMER_NAME]

📈 Analysis
━━━━━━━━━━━━━━━━
📊 Growth Rate: [PERCENTAGE]
📉 Key Changes: [LIST]
🔍 Notable Trends: [DESCRIPTION]

For each comparison, provide:
1. Clear breakdown of the data for each period
2. Percentage changes where relevant
3. Key trends or patterns
4. Notable differences or anomalies

If the conversation history contains order data, use it to provide detailed comparisons. Always maintain this structured format in your response and list ALL products sold in each period.
If there are not related orders in the conversation history, say that you don't have the information to answer the question.

Conversation History:
{context}

Current Question: {question}

Answer:`;
  }

  //====================================================================================
  /**
   * Function to handle the comparison agent functionality
   * @param {string} message - The message to handle
   * @param {string} userId - The user ID for conversation history
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, userId) {
    console.log("\n=== COMPARISON AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    try {
      const response = await processMessage(userId, message, this.customPrompt);
      return response;
    } catch (error) {
      console.error("Error in ComparisonAgent:", error);
      return "I apologize, but I encountered an error while processing your comparison request. Please try again.";
    }
  }
}

// DailySalesAgent class definition
export class DailySalesAgent {
  constructor() {
    this.customPrompt = `You are a daily sales analysis expert for an e-commerce store. Use the conversation history to provide detailed information about sales data for specific dates.

When analyzing daily sales data, focus on:
1. Total sales for the specified date
2. Number of orders placed
3. List of all orders with their details
4. Product distribution
5. Customer distribution

For each daily analysis, provide:
1. A summary of the day's performance
2. Detailed breakdown of all orders
3. Key metrics and statistics
4. Notable patterns or anomalies

The order data in the conversation history follows this structure:
📦 Order #[ORDER_NUMBER]
━━━━━━━━━━━━━━━━
👤 Customer: [CUSTOMER_NAME]
📊 Status: [ORDER_STATUS]
📦 Product: [PRODUCT_NAME]
📅 Date: [ORDER_DATE]
💰 Total: [ORDER_TOTAL]

Example:
📦 Order #14255
━━━━━━━━━━━━━━━━
👤 Customer: Dimitris Karikis
📊 Status: processing
📦 Product: Timeless - Grand, Bouquet Only
📅 Date: 3/21/2025, 8:07:30 PM
💰 Total: $99.95

If the conversation history contains order data for the requested date, use it to provide a comprehensive analysis. Format the response in a clear, structured way.

Conversation History:
{context}

Current Question: {question}

Answer:`;
  }

  //====================================================================================
  /**
   * Function to handle the daily sales agent functionality
   * @param {string} message - The message to handle
   * @param {string} userId - The user ID for conversation history
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, userId) {
    console.log("\n=== DAILY SALES AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    try {
      const response = await processMessage(userId, message, this.customPrompt);
      return response;
    } catch (error) {
      console.error("Error in DailySalesAgent:", error);
      return "I apologize, but I encountered an error while processing your daily sales request. Please try again.";
    }
  }
}

// RefundAgent class definition
export class RefundAgent {
  //====================================================================================
  /**
   * Function to handle the refund agent functionality
   * @param {string} message - The message to handle
   * @param {string} orderNumber - The order number to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, orderNumber = null) {
    console.log("\n=== REFUND AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    if (!orderNumber) {
      console.log("❌ No order number provided");
      return "I need an order number to fetch the details. Please provide an order number.";
    }

    return `The refund for order number: ${orderNumber} has been processed.`;
  }
}

// OrderDetailsAgent class definition
export class OrderDetailsAgent {
  constructor() {
    this.orderDetailsTool = new OrderDetailsTool();
  }

  //====================================================================================
  /**
   * Function to handle the order details agent functionality
   * @param {string} message - The message to handle
   * @param {string} orderNumber - The order number to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, orderNumber = null) {
    console.log("\n=== ORDER DETAILS AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);

    if (!orderNumber) {
      console.log("❌ No order number provided");
      return "I need an order number to fetch the details. Please provide an order number.";
    }

    try {
      console.log(`🔍 Processing order number: ${orderNumber}`);
      const result = await this.orderDetailsTool.execute(orderNumber);

      console.log("=============================================\n");
      return result.message;
    } catch (error) {
      console.error("❌ Error in OrderDetailsAgent:", error);
      return "An error occurred while fetching order details. Please try again later.";
    }
  }
}

// OrderStatusAgent class definition
export class OrderStatusAgent {
  constructor() {
    this.customPrompt = `You are an order status tracking expert for an e-commerce store. Use the conversation history to help answer questions about order statuses and tracking.

Focus on:
- Current order status information
- Order processing stages
- Shipping and delivery status
- Order timeline and history
- Status-related issues and resolutions

When providing order status information, always:
1. Be clear about the current status
2. Provide relevant timestamps
3. Explain any delays or issues
4. Suggest next steps when appropriate

Conversation History:
{context}

Current Question: {question}

Answer:`;
  }

  //====================================================================================
  /**
   * Function to handle the order status agent functionality
   * @param {string} message - The message to handle
   * @param {string} userId - The user ID for conversation history
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, userId) {
    console.log("\n=== ORDER STATUS AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);

    try {
      const response = await processMessage(userId, message, this.customPrompt);
      console.log("=============================================\n");
      return response;
    } catch (error) {
      console.error("Error in OrderStatusAgent:", error);
      return "I apologize, but I encountered an error while processing your order status request. Please try again.";
    }
  }
}

// CustomerOrdersAgent class definition
export class CustomerOrdersAgent {
  constructor() {
    this.customerOrdersTool = new CustomerOrdersTool();
  }

  //====================================================================================
  /**
   * Function to handle the customer orders agent functionality
   * @param {string} message - The message to handle
   * @param {string} customerName - The customer name to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, customerName = null) {
    console.log("\n=== CUSTOMER ORDERS AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);

    if (!customerName) {
      console.log("❌ No customer name provided");
      return "I need a customer name to fetch the details. Please provide a customer name.";
    }

    console.log(`👤 Processing customer name: ${customerName}`);

    try {
      const result = await this.customerOrdersTool.execute(customerName);

      console.log("=============================================\n");
      return result.message;
    } catch (error) {
      console.error("❌ Error in CustomerOrdersAgent:", error);
      return "An error occurred while fetching customer orders. Please try again later.";
    }
  }
}

// HelpAgent class definition
export class HelpAgent {
  constructor() {
    this.customPrompt = `You are a helpful assistant for an e-commerce store's customer service system. Use the conversation history to provide accurate and helpful information about the system's capabilities.

Focus on:
- Explaining available features and commands
- Providing usage examples
- Clarifying system limitations
- Offering troubleshooting guidance
- Suggesting alternative approaches

When providing help, always:
1. Be clear and concise
2. Provide specific examples
3. Explain the context when relevant
4. Offer next steps or alternatives

Conversation History:
{context}

Current Question: {question}

Answer:`;
  }

  //====================================================================================
  /**
   * Function to handle the help agent functionality
   * @param {string} message - The message to handle
   * @param {string} userId - The user ID for conversation history
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, userId) {
    console.log("\n=== HELP AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    try {
      const response = await processMessage(userId, message, this.customPrompt);
      return response;
    } catch (error) {
      console.error("Error in HelpAgent:", error);
      return "I apologize, but I encountered an error while processing your help request. Please try again.";
    }
  }
}
