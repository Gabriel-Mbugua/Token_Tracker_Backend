const { Worker } = require("bullmq")
const { addDocument } = require("../database/db");
const { fetchRaydiumAccounts } = require("../services/solana");
const { NODE_ENV, redis } = require("../config/config");
const { processTokenJobService } = require("../services/token.service");

const REDIS_HOST = redis.host;
const REDIS_PORT = redis.port;
const REDIS_PASSWORD = redis.password

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD
}

if(NODE_ENV !== "production") return
console.log("Initialised workers...")

/* ------------------- Helper function to create a worker ------------------- */
const createWorker = (name, processFunction, connection) => {

    const worker = new Worker(name, async job => {
        console.log(`Processing ${name} job ${job.id}:`, JSON.stringify(job.data));
        try {
            const result = await processFunction(job.data);
            console.log(`${name} Job ${job.id} completed successfully`);
            return result;
        } catch (error) {
            console.error(`Error processing ${name} job ${job.id}:`, error);
            throw error; // Re-throw to trigger the 'failed' event
        }
    }, { 
        connection: connection,
        concurrency,
        lockDuration,
    });

    worker.on('failed', async (job, err) => {
        console.log(`Job ${job.id} failed with error ${err.message}`);
        try{
            await sendSlackTool({
                url: QUEUE_SLACK_HOOK,
                title: `${name} Job Failed`,
                keyValues: [
                    { key: `*Name:*\n ${job.name} `, value: `*Error:*\n ${err.message}`, },
                ]
            });
        }catch(slackError){
            console.error('Failed to send Slack notification:', slackError);
        }
    });

    worker.on('error', async (error) => {
        try{
            console.error(`Error in ${name} worker: `, error);
            await sendSlackTool({
                url: QUEUE_SLACK_HOOK,
                title: `${name} Job Error`,
                keyValues: [{ key: `*Error:*\n`, value: `*Error:*\n ${error.message}`, }]
            });
        }catch(slackError){
            console.error('Failed to send Slack notification:', slackError);
        }
    });

    worker.on('completed', (job) => {
        console.log(`${name} Job ${job.id} completed`);
    });

    return worker;
};

/* ------------------- Function to initialize all workers ------------------- */
let initializedWorkers = null

const initializeWorkers = () => {
    console.log(`Initializing mq workers for ${NODE_ENV} environment...`);

    if(initializedWorkers){
        console.log('Workers already initialized');
        return initializedWorkers;
    }

    const workers = {
        solanaQueue: createWorker('solQueue', processTokenJobService, connection),
    };

    console.log('All workers initialized successfully');
    return workers;
};

module.exports = {
    initializeWorkers,
    getWorkers: () => initializedWorkers,
}