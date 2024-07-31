# Solana Token Listener

## Description

This project is a Node.js application that listens for new token creations on the Solana blockchain, specifically focusing on Raydium transactions. It processes these transactions, extracts token information, and stores it in a MongoDB database. The application uses a message queue system for handling jobs asynchronously and includes a simple API for retrieving token data.

## Features

- Real-time listening for Raydium transactions on Solana
- Extraction and processing of token metadata
- Asynchronous job processing using BullMQ
- MongoDB integration for data storage
- RESTful API for retrieving token information
- Error handling and logging

## Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB
- Redis (for BullMQ)

## Installation

1. Clone the repository:

git clone https://github.com/yourusername/solana-token-listener.git

2. Install dependencies:

cd solana-token-listener
npm install

3. Set up environment variables:
Create a `.env` file in the root directory and add the following variables:

PORT=3050
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=your_database_name
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
QUICKNODE_SOLANA_HTTP_URL=your_solana_http_url
QUICKNODE_SOLANA_WSS_URL=your_solana_websocket_url
SOLANA_LISTENER=true

## Usage

1. Start the server:

npm start

2. The application will start listening for Solana transactions and processing them automatically.

3. To retrieve token data, use the following API endpoint:

GET /tokens

## Project Structure

- `config/`: Configuration files
- `controllers/`: Request handlers
- `database/`: Database connection and operations
- `messageQueue/`: Job queue setup and workers
- `middlewares/`: Express middlewares
- `models/`: MongoDB schemas
- `routes/`: API routes
- `services/`: Business logic and Solana interaction
- `utils/`: Utility functions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.