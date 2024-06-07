const { Queue } = require("bullmq")
const path = require("path")
require('dotenv').config({
    path: path.join(__dirname, '../','./.env')
});

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const DELAY = 1000
const ATTEMPTS = 1
const removeOnComplete = true
const removeOnFail = false

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD
}

// if(process.env.NODE_ENV !== "production") return
console.log("Initialised queues...")

const solanaQueue = new Queue('solQueue', {
    connection
})

const queues =  {
    'solQueue': solanaQueue
}

/**
 * Adds a job to a specified queue with given parameters, handling errors and returning the job ID upon success.
 * @param {Object} params - The parameters for adding a job.
 * @param {Object} params.data - The data to be processed by the job.
 * @param {string} params.queueName - The name of the queue to which the job should be added.
 * @param {string} params.jobName - The name of the job.
 * @param {number} [params.delay=DELAY] - Optional delay before the job is processed.
 * @returns {Object} An object containing `success: true` and the `jobId` if the job is added successfully.
 * @throws {Error} Throws an error if the job addition fails.
 */
const addJob = async ({
    data,
    queueName,
    jobName,
    delay = DELAY
}) => {
    try {
        const queue = queues[queueName];

        if (!queue) throw new Error(`Queue not found`);

        const options = {
            delay,
            removeOnComplete,
            removeOnFail,
            attempts: ATTEMPTS
        };

        console.log({jobName, data, options})
        const job = await queue.add(jobName, data, options);

        return {
            success: true,
            jobId: job.id
        };
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
};

module.exports = {
    addJob
}