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

export const getOrderByName = async (name) => {
  try {
    let allOrders = [];
    let page = 1;
    let hasMore = true;

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
