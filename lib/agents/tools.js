import { getOrder } from "../woocommApi.js";
import { llm } from "../llm.js";
import { getOrderByName } from "../woocommApi.js";

//====================================================================================
/**
 * Order Number Extractor Tool Class Definition
 * @class
 * @description Extracts the order number from a message
 */
//====================================================================================
export class OrderNumberExtractorTool {
  constructor() {
    this.llm = llm;
  }

  //====================================================================================
  /**
   * Executes the order number extraction tool
   * @param {string} message - The message to extract the order number from
   * @returns {string} The extracted order number or "NONE" if not found
   */
  //====================================================================================
  async execute(message) {
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
}

//====================================================================================
/**
 * Customer Name Extractor Tool Class Definition
 * @class
 * @description Extracts the customer name from a message
 */
//====================================================================================
export class CustomerNameExtractorTool {
  constructor() {
    this.llm = llm;
  }

  //====================================================================================
  /**
   * Executes the customer name extraction tool
   * @param {string} message - The message to extract the customer name from
   * @returns {string} The extracted customer name or "NONE" if not found
   */
  //====================================================================================
  async execute(message) {
    const prompt = `Extract the customer name from the following message. The customer name should be a full name (first and last name).
    If there is no customer name, respond with "NONE".
    The customer name is usually preceded by phrases like "customer name", "for customer", "for", or appears after "orders for".
    Message: ${message}
    
    Examples:
    - "show me all orders for customer name John Doe" -> John Doe
    - "what are the orders for Jane Smith" -> Jane Smith
    - "show me the order details for all orders for customer name Alice Johnson" -> Alice Johnson
    - "check orders for Bob Wilson" -> Bob Wilson
    - "show me the status of order number 345" -> NONE
    - "help me with my order" -> NONE
    - "what's the status of order #123" -> NONE
    
    Respond with ONLY the full customer name or "NONE".`;

    console.log("\nExtracting customer name...");
    const response = await this.llm.invoke(prompt);
    const customerName = response.content.trim();
    console.log("Extracted customer name:", customerName);

    return customerName === "NONE" ? null : customerName;
  }
}

//====================================================================================
/**
 * Customer Orders Tool Class Definition
 * @class
 * @description Fetches all orders for a customer
 */
//====================================================================================
export class CustomerOrdersTool {
  //====================================================================================
  /**
   * Executes the customer orders tool
   * @param {string} customerName - The name of the customer to fetch orders for
   * @returns {Object} The result of the execution
   */
  //====================================================================================
  async execute(customerName) {
    try {
      console.log("\n=== CUSTOMER ORDERS TOOL ===========================");
      console.log(`👤 Processing customer: ${customerName}`);

      // Split the customer name into first and last name
      const [firstName, lastName] = customerName.split(" ");

      // Get all orders
      const orderObject = await getOrderByName(firstName);

      // Filter orderObject by customer name
      const customerOrders = orderObject.filter(
        (order) =>
          order.billing.first_name.toLowerCase() === firstName.toLowerCase() &&
          order.billing.last_name.toLowerCase() === lastName.toLowerCase()
      );

      if (customerOrders.length === 0) {
        console.log(`❌ No orders found for: ${firstName} ${lastName}`);
        return {
          success: false,
          message: `❌ No orders found for customer: ${firstName} ${lastName}`,
        };
      }

      console.log(
        `✅ Found ${customerOrders.length} orders for ${firstName} ${lastName}`
      );
      console.log("=============================================\n");

      // Sort orders by date, newest first
      customerOrders.sort(
        (a, b) => new Date(b.date_created) - new Date(a.date_created)
      );

      // Format all orders for this customer
      let response = `Found ${customerOrders.length} orders for ${firstName} ${lastName}:\n\n`;

      // Add each order to the response
      customerOrders.forEach((orderObject, index) => {
        response += `
📦 *Order #${orderObject.id}*
━━━━━━━━━━━━━━━━
👤 Customer: ${orderObject.billing.first_name} ${orderObject.billing.last_name}
📊 Status: ${orderObject.status}
📦 Product: ${orderObject.line_items[0].name}
📅 Date: ${new Date(orderObject.date_created).toLocaleString()}
💰 Total: $${orderObject.total}
        `.trim();

        if (index < customerOrders.length - 1) {
          response += "\n\n";
        }
      });

      return {
        success: true,
        message: response,
        orders: customerOrders,
      };
    } catch (error) {
      console.error("❌ Error in CustomerOrdersTool:", error);
      return {
        success: false,
        message: "Error fetching orders. Please try again later.",
      };
    }
  }
}

//====================================================================================
/**
 * Order Details Tool Class Definition
 * @class
 * @description Fetches details for a specific order
 */
//====================================================================================
export class OrderDetailsTool {
  //====================================================================================
  /**
   * Executes the order details tool
   * @param {string} orderNumber - The number of the order to fetch details for
   * @returns {Object} The result of the execution
   */
  //====================================================================================
  async execute(orderNumber) {
    try {
      console.log("\n=== ORDER DETAILS TOOL ===========================");
      console.log(`🔍 Fetching details for order: ${orderNumber}`);

      const orderDetails = await getOrder(orderNumber);

      if (!orderDetails) {
        console.log(`❌ No order found: ${orderNumber}`);
        return {
          success: false,
          message: `No order found with order number: ${orderNumber}`,
        };
      }

      console.log(`✅ Order found: ${orderNumber}`);
      console.log("=============================================\n");

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

      return {
        success: true,
        message: formattedResponse,
        order: orderDetails,
      };
    } catch (error) {
      console.error("❌ Error in OrderDetailsTool:", error);
      return {
        success: false,
        message: `Error fetching details for order ${orderNumber}. Please verify the order number and try again.`,
      };
    }
  }
}
