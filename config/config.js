require('dotenv').config();

module.exports = {
    SOLANA_LISTENER: true,
    NODE_ENV: process.env.NODE_ENV,
    mongoUri: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME,
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    },
    solana: {
        httpUrl: process.env.QUICKNODE_SOLANA_HTTP_URL,
        wsUrl: process.env.QUICKNODE_SOLANA_WSS_URL,
        raydiumPublicKey: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        instructionName: "initialize2",
        commitment: 'confirmed', // 'processed' | 'confirmed' | 'finalized' | 'recent' | 'single' | 'singleGossip' | 'root' | 'max';
        excludedPublickKeys: ["So11111111111111111111111111111111111111112"]
    }
};

