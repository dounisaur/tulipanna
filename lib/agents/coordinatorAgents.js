import { loadEnvironmentVariables } from "../setupEnvironment.js";
import { CustomerOrdersTool } from "./tools.js";
import { OrderDetailsTool } from "./tools.js";

// Load environment variables
loadEnvironmentVariables();

// Coordinator Agents Class Definitions
export class ComparisonAgent {
  //====================================================================================
  /**
   * Function to handle the comparison agent functionality
   * @param {string} message - The message to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message) {
    console.log("\n=== COMPARISON AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    return "This would be handled by the Comparison Agent";
  }
}

// DailySalesAgent class definition
export class DailySalesAgent {
  //====================================================================================
  /**
   * Function to handle the daily sales agent functionality
   * @param {string} message - The message to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message) {
    console.log("\n=== DAILY SALES AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    return "This would be handled by the Daily Sales Agent";
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
  //====================================================================================
  /**
   * Function to handle the order status agent functionality
   * @param {string} message - The message to handle
   * @param {string} orderNumber - The order number to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message, orderNumber = null) {
    console.log("\n=== ORDER STATUS AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);

    if (orderNumber) {
      console.log(`🔍 Processing order number: ${orderNumber}`);
    }

    console.log("=============================================\n");
    return `Handling order status for order number: ${orderNumber}`;
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
  //====================================================================================
  /**
   * Function to handle the help agent functionality
   * @param {string} message - The message to handle
   * @returns {string} The response from the agent
   */
  //====================================================================================
  async handle(message) {
    console.log("\n=== HELP AGENT ===========================");
    console.log(`📝 Handling message: ${message}`);
    console.log("=============================================\n");

    return "This would be handled by the Help Agent";
  }
}
