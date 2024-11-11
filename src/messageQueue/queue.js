import { Queue } from "bullmq";
import { config } from "../config/config.js";

const { redis, NODE_ENV } = config;

const REDIS_HOST = redis.host;
const REDIS_PORT = redis.port;
const REDIS_PASSWORD = redis.password;

const DELAY = 1000;
const ATTEMPTS = 1;
const removeOnComplete = true;
const removeOnFail = false;

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
};

// if(NODE_ENV !== "production") return
console.log("Initialised queues...");

/* ----------------------- Function to create a queue ----------------------- */
const createQueue = (name, connection) => {
    return new Queue(name, {
        connection,
        defaultJobOptions: {
            attempts: ATTEMPTS,
            removeOnComplete,
            removeOnFail,
        },
    });
};

const queues = {
    solQueue: createQueue("solQueue", connection),
};

export const addJob = async ({ data, queueName, jobName, delay = DELAY }) => {
    try {
        const queue = queues[queueName];

        if (!queue) throw new Error(`Queue not found`);

        const options = {
            delay,
            removeOnComplete,
            removeOnFail,
            attempts: ATTEMPTS,
        };

        const job = await queue.add(jobName, data, options);

        return {
            success: true,
            jobId: job.id,
        };
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
};
