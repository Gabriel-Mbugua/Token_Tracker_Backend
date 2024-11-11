import pkg from "pg";
const { Pool } = pkg;
import { config } from "../config/config.js";

const { postgres } = config;

const pool = new Pool({
    user: postgres.user,
    host: postgres.host,
    database: postgres.database,
    password: postgres.password,
    port: postgres.port,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

export let client = null;

export const connectToDatabase = async () => {
    try {
        client = await pool.connect();
        console.log("connected to db...");
        return client;
    } catch (err) {
        console.log("Failed to connect to db...", err);
        process.exit(1);
    }
};
