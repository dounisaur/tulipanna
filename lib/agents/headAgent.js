// Head Agent - Determines which coordinator agent should handle the request
import { llm } from "../llm.js";
import {
  OrderNumberExtractorTool,
  CustomerNameExtractorTool,
} from "./tools.js";
import { processMessage } from "../ragUtils.js";

export class HeadAgent {
  constructor() {
    this.llm = llm;
    this.orderNumberExtractor = new OrderNumberExtractorTool();
    this.customerNameExtractor = new CustomerNameExtractorTool();
  }

  //====================================================================================
  /**
   * Analyzes the message and determines which agent should handle the request
   * @param {string} message - The message to analyze
   * @param {string} userId - The user ID
   * @returns {Object} The result of the analysis
   */
  //====================================================================================
  async analyze(message, userId) {
    console.log("\n=== HEAD AGENT ANALYSIS ===========================");
    console.log(`📝 Input message: ${message}`);

    // First, determine if this is an operational question or an analytical question
    const questionTypePrompt = `Analyze the following message and determine if it's:
    1. An operational question (needs to be handled by a specific agent)
    2. An analytical question (about past operations or patterns)
    
    Examples of operational questions:
    - "Show me the status of order #12345"
    - "I need to refund order #67890"
    - "What are the details for John Smith's orders?"
    - "Show me today's sales data"
    
    Examples of analytical questions:
    - "What were our best selling products last month?"
    - "How do our sales compare between this year and last year?"
    - "What's the trend in customer complaints over the past 6 months?"
    - "Which days of the week have the highest order volume?"
    
    Message: ${message}
    
    Respond with either "OPERATIONAL" or "ANALYTICAL".`;

    const questionType = await this.llm.invoke(questionTypePrompt);
    const isAnalytical = questionType.content.trim() === "ANALYTICAL";

    if (isAnalytical) {
      console.log("📊 This is an analytical question about past operations");
      const analysis = await processMessage(userId, message);
      return {
        isAnalytical: true,
        response: analysis,
      };
    }

    // For operational questions, proceed with agent routing
    const prompt = `Analyze the following message and determine which agent should handle it:
    Message: ${message}
    
    The message should be routed to one of these agents:
    1. COMPARISON_AGENT - For requests about comparing data across time periods
    2. DAILY_SALES_AGENT - For requests about specific daily sales data
    3. REFUND_AGENT - For requests about refunds or order cancellations
    4. ORDER_DETAILS_AGENT - For requests about order details for a specific order
    5. ORDER_STATUS_AGENT - For requests about the status for a specific order
    6. CUSTOMER_ORDERS_AGENT - For requests about all orders for a customer name
    7. HELP_AGENT - For requests about help with the bot.
    
    Examples:
    - "show me the comparison for the last 5 years of data for mothers days sales" -> COMPARISON_AGENT
    - "Show me march 25 daily sales data" -> DAILY_SALES_AGENT
    - "refund order number 345" -> REFUND_AGENT
    - "show me the order details for order number 345" -> ORDER_DETAILS_AGENT
    - "show me the order details for all orders for customer name John Doe" -> CUSTOMER_ORDERS_AGENT
    - "show me the status of order number 345" -> ORDER_STATUS_AGENT
    - "help" -> HELP_AGENT

    Respond with ONLY one of these categories: COMPARISON_AGENT, DAILY_SALES_AGENT, REFUND_AGENT, ORDER_DETAILS_AGENT, ORDER_STATUS_AGENT, CUSTOMER_ORDERS_AGENT, HELP_AGENT`;

    console.log("\n🤖 Sending prompt to LLM...");
    const response = await this.llm.invoke(prompt);
    const agentType = response.content.trim();
    console.log(`📊 LLM Response: ${agentType}`);

    // Extract both order number and customer name
    const orderNumber = await this.orderNumberExtractor.execute(message);
    const customerName = await this.customerNameExtractor.execute(message);

    console.log("=============================================\n");

    return {
      isAnalytical: false,
      agentType,
      orderNumber,
      customerName,
    };
  }
}
