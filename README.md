# Simple Express API

A simple Express.js application with basic REST API endpoints.

## Available Routes

- `GET /` - Welcome message
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create a new item

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Testing the API

You can test the API using curl or any API client like Postman:

```bash
# Get welcome message
curl http://localhost:3000

# Get all items
curl http://localhost:3000/api/items

# Get item by ID
curl http://localhost:3000/api/items/1

# Create new item
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"New Item"}' \
  http://localhost:3000/api/items
``` 