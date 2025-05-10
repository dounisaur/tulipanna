const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

class WooCommerceAPI {
    constructor(url, consumerKey, consumerSecret) {
        this.url = url.replace(/\/+$/, ''); // Remove trailing slashes
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
    }

    /**
     * Generate OAuth signature
     */
    generateOAuthSignature(method, endpoint, parameters) {
        const params = { ...parameters };
        const keys = Object.keys(params).sort();
        const sortedParams = keys.map(key => `${key}=${params[key]}`).join('&');
        
        const baseString = [
            method.toUpperCase(),
            encodeURIComponent(this.url + endpoint),
            encodeURIComponent(sortedParams)
        ].join('&');

        return crypto
            .createHmac('sha256', this.consumerSecret)
            .update(baseString)
            .digest('base64');
    }

    /**
     * Make a request to the WooCommerce API
     */
    request(method, endpoint, data = null) {
        return new Promise((resolve, reject) => {
            const timestamp = Math.floor(Date.now() / 1000);
            const nonce = crypto.randomBytes(16).toString('hex');

            const parameters = {
                oauth_consumer_key: this.consumerKey,
                oauth_nonce: nonce,
                oauth_signature_method: 'HMAC-SHA256',
                oauth_timestamp: timestamp,
                oauth_version: '1.0'
            };

            if (method === 'GET' && data) {
                Object.assign(parameters, data);
            }

            const signature = this.generateOAuthSignature(method, endpoint, parameters);
            parameters.oauth_signature = signature;

            const requestUrl = new URL(this.url + endpoint);
            if (method === 'GET' && data) {
                Object.keys(data).forEach(key => {
                    requestUrl.searchParams.append(key, data[key]);
                });
            }

            const options = {
                hostname: requestUrl.hostname,
                port: 443,
                path: requestUrl.pathname + requestUrl.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `OAuth ${Object.keys(parameters)
                        .map(key => `${key}="${encodeURIComponent(parameters[key])}"`)
                        .join(', ')}`
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseData);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsedData);
                        } else {
                            reject(new Error(`API Error: ${res.statusCode} ${JSON.stringify(parsedData)}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Convenience methods for different HTTP methods
    get(endpoint, params = {}) {
        return this.request('GET', endpoint, params);
    }

    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
}

// Example usage:
/*
const woocommerce = new WooCommerceAPI(
    'https://your-store.com',
    'your_consumer_key',
    'your_consumer_secret'
);

// Get all products
woocommerce.get('/wp-json/wc/v3/products')
    .then(data => console.log(data))
    .catch(error => console.error(error));

// Create a product
woocommerce.post('/wp-json/wc/v3/products', {
    name: 'Test Product',
    type: 'simple',
    regular_price: '21.99',
    description: 'This is a test product'
})
    .then(data => console.log(data))
    .catch(error => console.error(error));
*/

module.exports = WooCommerceAPI; 