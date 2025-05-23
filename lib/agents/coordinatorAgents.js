import { loadEnvironmentVariables } from "../setupEnvironment.js";
import { OrderTool } from "./tools.js";

// Load environment variables
loadEnvironmentVariables();

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

export class CustomerOrdersAgent {
  async handle(message, customerName = null) {
    console.log("\n=== Customer Order Agent ===");
    console.log("Handling message:", message);
    if (customerName) {
      console.log("Processing customer name:", customerName);
    }
    console.log("=== End Customer Order Agent ===\n");
    return `Displaying customer orders for customer: ${customerName}`;
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
