import dotenv from "dotenv";

dotenv.config();

export const config = {
    SOLANA_LISTENER: process.env.SOLANA_LISTENER,
    port: process.env.PORT || 3050,
    NODE_ENV: process.env.NODE_ENV || "development",
    postgres: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    },
    solana: {
        httpUrl: process.env.QUICKNODE_SOLANA_HTTP_URL,
        wsUrl: process.env.QUICKNODE_SOLANA_WSS_URL,
        raydiumPublicKey: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        instructionName: "initialize2",
        commitment: "confirmed", // 'processed' | 'confirmed' | 'finalized' | 'recent' | 'single' | 'singleGossip' | 'root' | 'max';
        excludedPublickKeys: ["So11111111111111111111111111111111111111112"],
    },
};
