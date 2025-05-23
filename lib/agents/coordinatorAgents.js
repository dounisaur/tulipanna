import { loadEnvironmentVariables } from "../setupEnvironment.js";
import { OrderTool } from "./tools.js";
import { CustomerOrdersTool } from "./tools.js";
import { OrderDetailsTool } from "./tools.js";

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
    this.orderDetailsTool = new OrderDetailsTool();
  }

  async handle(message, orderNumber = null) {
    console.log("\n=== Order Details Agent ===");
    console.log("Handling message:", message);

    if (!orderNumber) {
      return "I need an order number to fetch the details. Please provide an order number.";
    }

    try {
      console.log("Processing order number:", orderNumber);
      const result = await this.orderDetailsTool.execute(orderNumber);

      console.log("=== End Order Details Agent ===\n");
      return result.message;
    } catch (error) {
      console.error("Error in OrderDetailsAgent:", error);
      return "An error occurred while fetching order details. Please try again later.";
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
  constructor() {
    this.customerOrdersTool = new CustomerOrdersTool();
  }

  async handle(message, customerName = null) {
    console.log("\n=== Customer Order Agent ===");
    console.log("Handling message:", message);

    if (!customerName) {
      return "I need a customer name to fetch the details. Please provide a customer name.";
    }

    console.log("Processing customer name:", customerName);

    try {
      const result = await this.customerOrdersTool.execute(customerName);

      console.log("=== End Customer Order Agent ===\n");
      return result.message;
    } catch (error) {
      console.error("Error in CustomerOrdersAgent:", error);
      return "An error occurred while fetching customer orders. Please try again later.";
    }
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
