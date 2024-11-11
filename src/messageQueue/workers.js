import { Worker } from "bullmq";
import { config } from "../config/config.js";
import { processRaydiumTokenJob } from "../services/raydium/listener.js";

const { redis, NODE_ENV } = config;

const REDIS_HOST = redis.host;
const REDIS_PORT = redis.port;
const REDIS_PASSWORD = redis.password;

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
};

const concurrency = 5;
const lockDuration = 30_000;

// if(NODE_ENV !== "production") return
console.log("Initialised workers...");

/* ------------------- Helper function to create a worker ------------------- */
const createWorker = (name, processFunction, connection) => {
    const worker = new Worker(
        name,
        async (job) => {
            console.log(`L-W-26 Processing ${name} job ${job.id}:`, JSON.stringify(job.data));
            try {
                const result = await processFunction(job.data);
                console.log(`${name} Job ${job.id} completed successfully`);
                return result;
            } catch (error) {
                console.error(`Error processing ${name} job ${job.id}:`, error);
                throw error; // Re-throw to trigger the 'failed' event
            }
        },
        {
            connection: connection,
            concurrency,
            lockDuration,
        }
    );

    worker.on("failed", async (job, err) => {
        try {
            console.log(`Job ${job.id} failed with error ${err.message}`);
        } catch (slackError) {
            console.error("Failed to send Slack notification:", slackError);
        }
    });

    worker.on("error", async (error) => {
        try {
            console.error(`Error in ${name} worker: `, error);
        } catch (slackError) {
            console.error("Failed to send Slack notification:", slackError);
        }
    });

    worker.on("completed", (job) => {
        console.log(`${name} Job ${job.id} completed`);
    });

    return worker;
};

/* ------------------- Function to initialize all workers ------------------- */
let initializedWorkers = null;

export const initializeWorkers = () => {
    console.log(`Initializing mq workers for ${NODE_ENV} environment...`);

    if (initializedWorkers) {
        console.log("Workers already initialized");
        return initializedWorkers;
    }

    const workers = {
        solanaQueue: createWorker("solQueue", processRaydiumTokenJob, connection),
    };

    console.log("All workers initialized successfully");
    return workers;
};

export const getWorkers = () => initializedWorkers;
