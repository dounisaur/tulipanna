import { getOrder } from "../woocommApi.js";
import { llm } from "../llm.js";

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
