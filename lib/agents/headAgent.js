// Head Agent - Determines which coordinator agent should handle the request
import { llm } from "../llm.js";
import { OrderNumberExtractorTool } from "./tools.js";

export class HeadAgent {
  constructor() {
    this.llm = llm;
    this.orderNumberExtractor = new OrderNumberExtractorTool();
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
    4. ORDER_DETAILS_AGENT - For requests about order details for a specific order. (order number, status, etc.)
    5. ORDER_STATUS_AGENT - For requests about the status of an order
    6. CUSTOMER_ORDER_AGENT - For requests about all orders for a customer name (order number, status, etc.)
    7. HELP_AGENT - For requests about help with the bot.
    
    Examples:
    - "show me the comparison for the last 5 years of data for mothers days sales" -> COMPARISON_AGENT
    - "Show me march 25 daily sales data" -> DAILY_SALES_AGENT
    - "refund order number 345" -> REFUND_AGENT
    - "show me the order details for order number 345" -> ORDER_DETAILS_AGENT
    - "show me the order details for all orders for customer name John Doe" -> CUSTOMER_ORDER_AGENT
    - "show me the status of order number 345" -> ORDER_STATUS_AGENT
    - "help" -> HELP_AGENT

    Respond with ONLY one of these categories: COMPARISON_AGENT, DAILY_SALES_AGENT, REFUND_AGENT, ORDER_DETAILS_AGENT, ORDER_STATUS_AGENT, CUSTOMER_ORDER_AGENT, HELP_AGENT`;

    console.log("\nSending prompt to LLM...");
    const response = await this.llm.invoke(prompt);
    const agentType = response.content.trim();
    console.log("LLM Response:", agentType);

    // Use the tool to extract order number
    const orderNumber = await this.orderNumberExtractor.execute(message);

    console.log("=== End Head Agent Analysis ===\n");

    return {
      agentType,
      orderNumber,
    };
  }
}
