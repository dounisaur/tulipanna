// Head Agent - Determines which coordinator agent should handle the request
import { llm } from "../llm.js";
import {
  OrderNumberExtractorTool,
  CustomerNameExtractorTool,
} from "./tools.js";

export class HeadAgent {
  constructor() {
    this.llm = llm;
    this.orderNumberExtractor = new OrderNumberExtractorTool();
    this.customerNameExtractor = new CustomerNameExtractorTool();
    this.conversationHistory = new Map(); // Map of chatId -> array of messages
  }

  // Dump entire conversation history for debugging
  dumpConversationHistory(chatId) {
    console.log("\n=== FULL CONVERSATION HISTORY DUMP ===");
    console.log(`Chat ID: ${chatId}`);
    const history = this.conversationHistory.get(chatId) || [];
    console.log(`Total messages: ${history.length}`);
    history.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log(`Timestamp: ${msg.timestamp}`);
      console.log(`Role: ${msg.role}`);
      console.log(`Content: ${msg.content}`);
      console.log(`Metadata:`, msg.metadata);
    });
    console.log("================================\n");
  }

  // Add a message to the conversation history
  addToHistory(chatId, role, content, metadata = {}) {
    if (!this.conversationHistory.has(chatId)) {
      this.conversationHistory.set(chatId, []);
    }

    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.conversationHistory.get(chatId).push(message);
    console.log("\n=== CONVERSATION HISTORY UPDATE ===");
    console.log(`📝 Added message to history for chat ${chatId}:`);
    console.log(`Role: ${role}`);
    console.log(`Content: ${content}`);
    console.log(`Metadata:`, metadata);
    console.log("================================\n");

    // Dump full history after each update
    this.dumpConversationHistory(chatId);
  }

  // Get recent conversation history
  getRecentHistory(chatId, count = 5) {
    const history = this.conversationHistory.get(chatId) || [];
    console.log("\n=== CONVERSATION HISTORY RETRIEVAL ===");
    console.log(`📚 Retrieved ${history.length} messages for chat ${chatId}:`);
    history.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log(`Role: ${msg.role}`);
      console.log(`Content: ${msg.content}`);
      console.log(`Metadata:`, msg.metadata);
    });
    console.log("================================\n");
    return history.slice(-count);
  }

  // Check if this is a general query about past operations
  async isGeneralQuery(message, chatId) {
    const history = this.getRecentHistory(chatId);
    const historyString = history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    console.log("\n=== GENERAL QUERY CHECK ===");
    console.log("Current message:", message);
    console.log("Recent history:", historyString);

    const prompt = `Analyze if the following message is a general query about past operations in the conversation.
    Consider the recent conversation history for context.

    Recent conversation history:
    ${historyString}

    Current message: ${message}

    Determine if this message is:
    1. A general query about past operations (e.g., "how many orders were refunded", "what did we do with order 123", "show me all the refunds")
    2. A new operation request that should be routed to a specific agent

    Respond with ONLY "GENERAL_QUERY" or "ROUTE_TO_AGENT".`;

    const response = await this.llm.invoke(prompt);
    const isGeneral = response.content.trim() === "GENERAL_QUERY";

    console.log("LLM Response:", response.content.trim());
    console.log("Is general query:", isGeneral);
    console.log("================================\n");

    return isGeneral;
  }

  // Handle general queries about past operations
  async handleGeneralQuery(message, chatId) {
    const history = this.conversationHistory.get(chatId) || [];
    const historyString = history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    console.log("\n=== HANDLING GENERAL QUERY ===");
    console.log("Question:", message);
    console.log("Full history:", historyString);

    const prompt = `You are an assistant that helps answer questions about past operations in a conversation.
    Use the conversation history to provide accurate and relevant information.

    Recent conversation history:
    ${historyString}

    Current question: ${message}

    Guidelines:
    1. Only use information from the conversation history
    2. Be specific about what operations were performed
    3. Include relevant details like order numbers, customer names, and timestamps
    4. If no relevant information exists, say so clearly
    5. Keep the response concise and focused on the question

    Provide a clear and accurate response based on the conversation history.`;

    const response = await this.llm.invoke(prompt);
    console.log("LLM Response:", response.content.trim());
    console.log("================================\n");

    return response.content.trim();
  }

  async analyze(message, chatId) {
    console.log("\n=== HEAD AGENT ANALYSIS ===========================");
    console.log(`📝 Input message: ${message}`);

    // Add user message to history
    this.addToHistory(chatId, "user", message);

    // Check if this is a general query about past operations
    const isGeneral = await this.isGeneralQuery(message, chatId);
    if (isGeneral) {
      const response = await this.handleGeneralQuery(message, chatId);
      this.addToHistory(chatId, "assistant", response, {
        agentType: "HEAD_AGENT",
      });
      return {
        agentType: "HEAD_AGENT",
        orderNumber: null,
        customerName: null,
        response,
      };
    }

    const prompt = `Analyze the following message and determine which agent should handle it:
    Message: ${message}
    
    The message should be routed to one of these agents:
    1. COMPARISON_AGENT - For requests about comparing data across time periods
    2. DAILY_SALES_AGENT - For requests about specific daily sales data
    3. REFUND_AGENT - For requests about refunds or order cancellations
    4. ORDER_DETAILS_AGENT - For requests about order details for a specific order. (order number, status, etc.)
    5. ORDER_STATUS_AGENT - For requests about the status for a specific order
    6. CUSTOMER_ORDERS_AGENT - For requests about all orders for a customer name (order number, status, etc.)
    7. HELP_AGENT - For requests about help with the bot.
    
    Examples:
    - "show me the comparison for the last 5 years of data for mothers days sales" -> COMPARISON_AGENT
    - "Show me march 25 daily sales data" -> DAILY_SALES_AGENT
    - "refund order number 345" -> REFUND_AGENT
    - "show me the order details for order number 345" -> ORDER_DETAILS_AGENT
    - "show me the order details for all orders for customer name John Doe" -> CUSTOMER_ORDERS_AGENT
    - "show me the status of order number 345" -> ORDER_STATUS_AGENT
    - "help" -> HELP_AGENT

    Respond with ONLY one of these categories: COMPARISON_AGENT, DAILY_SALES_AGENT, REFUND_AGENT, ORDER_DETAILS_AGENT, ORDER_STATUS_AGENT, CUSTOMER_ORDERS_AGENT, HELP_AGENT
    
    If the user does not provide a customer name or order number, where required, route to the appropriate agent with "NONE".`;

    console.log("\n🤖 Sending prompt to LLM...");
    const response = await this.llm.invoke(prompt);
    const agentType = response.content.trim();
    console.log(`📊 LLM Response: ${agentType}`);

    // Extract both order number and customer name
    const orderNumber = await this.orderNumberExtractor.execute(message);
    const customerName = await this.customerNameExtractor.execute(message);

    console.log("=============================================\n");

    return {
      agentType,
      orderNumber,
      customerName,
    };
  }

  // Method to record coordinator agent responses
  recordCoordinatorResponse(chatId, agentType, response, metadata = {}) {
    this.addToHistory(chatId, "assistant", response, {
      agentType,
      ...metadata,
    });
  }
}
