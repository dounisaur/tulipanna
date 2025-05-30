/**
 * WooCommerce API integration module
 * Provides functions to interact with the WooCommerce REST API
 * @module woocommApi
 */

import { loadEnvironmentVariables } from "./setupEnvironment.js";

loadEnvironmentVariables();

/**
 * Configuration object for WooCommerce API authentication and endpoints
 * @type {Object}
 * @property {string} domain - WooCommerce store domain
 * @property {string} consumerKey - API consumer key
 * @property {string} consumerSecret - API consumer secret
 * @property {string} baseUrl - Base URL for API endpoints
 */
const config = {
  domain: process.env.WOOCOMMERCE_DOMAIN,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  baseUrl: process.env.WOOCOMMERCE_BASE_URL,
};

/**
 * Generates the Basic Authentication header for WooCommerce API requests
 * @returns {Object} Headers object with Authorization and Content-Type
 */
const getAuthHeader = () => {
  return {
    Authorization: `Basic ${btoa(
      `${config.consumerKey}:${config.consumerSecret}`
    )}`,
    "Content-Type": "application/json",
  };
};

/**
 * Fetches all products from the WooCommerce store
 * @async
 * @returns {Promise<Array>} Array of product objects
 * @throws {Error} If the API request fails
 */
export const getProducts = async () => {
  try {
    const response = await fetch(`${config.baseUrl}/products`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

/**
 * Fetches a single product by its ID
 * @async
 * @param {number|string} id - The product ID
 * @returns {Promise<Object>} Product object
 * @throws {Error} If the API request fails
 */
export const getProduct = async (id) => {
  try {
    const response = await fetch(`${config.baseUrl}/products/${id}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new order in the WooCommerce store
 * @async
 * @param {Object} orderData - The order data to create
 * @returns {Promise<Object>} Created order object
 * @throws {Error} If the API request fails
 */
export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${config.baseUrl}/orders`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

/**
 * Fetches all orders from the WooCommerce store
 * @async
 * @returns {Promise<Array>} Array of order objects
 * @throws {Error} If the API request fails
 */
export const getOrders = async () => {
  try {
    const response = await fetch(`${config.baseUrl}/orders`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

/**
 * Fetches a single order by its ID
 * @async
 * @param {number|string} id - The order ID
 * @returns {Promise<Object|null>} Order object or null if not found
 * @throws {Error} If the API request fails
 */
export const getOrder = async (id) => {
  try {
    const response = await fetch(`${config.baseUrl}/orders/${id}`, {
      headers: getAuthHeader(),
    });

    if (response.status === 404) {
      console.log(`Order ${id} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
};

/**
 * Searches for orders by customer name using pagination
 * @async
 * @param {string} name - The customer name to search for
 * @returns {Promise<Array>} Array of matching order objects
 * @throws {Error} If the API request fails
 */
export const getOrderByName = async (name) => {
  try {
    let allOrders = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages of results until no more orders are found
    while (hasMore) {
      const response = await fetch(
        `${config.baseUrl}/orders?search=${name}&page=${page}&per_page=100`,
        {
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const orders = await response.json();

      if (orders.length === 0) {
        hasMore = false;
      } else {
        allOrders = [...allOrders, ...orders];
        page++;
      }
    }
    return allOrders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};
