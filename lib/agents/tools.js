import { getOrder } from "../woocommApi.js";
import { llm } from "../llm.js";
import { getOrderByName } from "../woocommApi.js";

export class OrderTool {
  async execute(orderNumber) {
    try {
      const order = await getOrder(orderNumber);
      return order;
    } catch (error) {
      console.error(`Error in OrderTool: ${error.message}`);
      throw error;
    }
  }
}

export class OrderNumberExtractorTool {
  constructor() {
    this.llm = llm;
  }

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

export class CustomerNameExtractorTool {
  constructor() {
    this.llm = llm;
  }

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

export class CustomerOrdersTool {
  async execute(customerName) {
    try {
      // Split the customer name into first and last name
      const [firstName, lastName] = customerName.split(" ");

      // Get all orders - use firstName for the search
      const orderObject = await getOrderByName(firstName);

      // Filter orderObject by customer name
      const customerOrders = orderObject.filter(
        (order) =>
          order.billing.first_name.toLowerCase() === firstName.toLowerCase() &&
          order.billing.last_name.toLowerCase() === lastName.toLowerCase()
      );

      if (customerOrders.length === 0) {
        return {
          success: false,
          message: `❌ No orders found for customer: ${firstName} ${lastName}`,
        };
      }

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
      console.error("Error in CustomerOrdersTool:", error);
      return {
        success: false,
        message: "Error fetching orders. Please try again later.",
      };
    }
  }
}

export class OrderDetailsTool {
  async execute(orderNumber) {
    try {
      const orderDetails = await getOrder(orderNumber);

      if (!orderDetails) {
        return {
          success: false,
          message: `No order found with order number: ${orderNumber}`,
        };
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

      return {
        success: true,
        message: formattedResponse,
        order: orderDetails,
      };
    } catch (error) {
      console.error("Error in OrderDetailsTool:", error);
      return {
        success: false,
        message: `Error fetching details for order ${orderNumber}. Please verify the order number and try again.`,
      };
    }
  }
}
