import { getOrder } from "../woocommApi.js";

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
