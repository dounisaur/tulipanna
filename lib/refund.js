import { loadEnvironmentVariables } from "./setupEnvironment.js";

loadEnvironmentVariables();

// Configuration object for WooCommerce API
const config = {
  domain: process.env.WOOCOMMERCE_DOMAIN,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  baseUrl: process.env.WOOCOMMERCE_BASE_URL,
};

// Helper function to get authorization header
const getAuthHeader = () => {
  return {
    Authorization: `Basic ${btoa(
      `${config.consumerKey}:${config.consumerSecret}`
    )}`,
    "Content-Type": "application/json",
  };
};

/**
 * Process a refund for an order
 * @param {string} orderId - The ID of the order to refund
 * @param {number} amount - The amount to refund (in cents)
 * @param {string} reason - The reason for the refund
 * @returns {Promise<Object>} The refund response
 */
export const processRefund = async (orderId, amount, reason) => {
  try {
    // First, get the order to verify it exists and check its status
    const orderResponse = await fetch(`${config.baseUrl}/orders/${orderId}`, {
      headers: getAuthHeader(),
    });

    if (!orderResponse.ok) {
      throw new Error(`Order not found or error: ${orderResponse.status}`);
    }

    const order = await orderResponse.json();

    // Check if the order is eligible for refund
    if (order.status !== "completed" && order.status !== "processing") {
      throw new Error(
        "Order is not eligible for refund. Only completed or processing orders can be refunded."
      );
    }

    // Create the refund
    const refundResponse = await fetch(
      `${config.baseUrl}/orders/${orderId}/refunds`,
      {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          amount: amount,
          reason: reason,
          api_refund: true, // This will trigger the actual refund through the payment gateway
        }),
      }
    );

    if (!refundResponse.ok) {
      throw new Error(`Refund failed: ${refundResponse.status}`);
    }

    const refund = await refundResponse.json();
    return refund;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw error;
  }
};

/**
 * Get refund details for an order
 * @param {string} orderId - The ID of the order
 * @returns {Promise<Array>} Array of refunds for the order
 */
export const getRefunds = async (orderId) => {
  try {
    const response = await fetch(
      `${config.baseUrl}/orders/${orderId}/refunds`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get refunds: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting refunds:", error);
    throw error;
  }
};

/**
 * Get details of a specific refund
 * @param {string} orderId - The ID of the order
 * @param {string} refundId - The ID of the refund
 * @returns {Promise<Object>} The refund details
 */
export const getRefund = async (orderId, refundId) => {
  try {
    const response = await fetch(
      `${config.baseUrl}/orders/${orderId}/refunds/${refundId}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get refund: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting refund:", error);
    throw error;
  }
};
