const { Worker } = require("bullmq")
const path = require("path");
const { addDocument } = require("../database/db");
const { fetchRaydiumAccounts } = require("../services/solana");
const { NODE_ENV, redis } = require("../config/config");
require('dotenv').config({
    path: path.join(__dirname, '../','./.env')
});

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

const solanaQueue = new Worker('solQueue', async job => {
    try{
        console.log(`L-MQ-W-20 Processing job ${job.id}:`, JSON.stringify(job.data))
        const { data } = job
        const { txId } = data

        const tokenInfo = await fetchRaydiumAccounts({ txId })

        const { mint } = tokenInfo
        const { name } = tokenInfo.data

        const saveDocument = await addDocument({
            collection: "tokens",
            documentId: `${mint}_${name}`,
            data: {
                ...tokenInfo,
                network: "solana"
            },
        })

        return saveDocument
    }catch(err){
        console.error(err)
    }
}, { connection })

solanaQueue.on('failed', async (job, err) =>{
    console.log(`L-MQ-W-35 ${job.id} failed with error: ${err.message}`)
})

solanaQueue.on('error', async (err) =>{
    console.log(`L-MQ-W-39 Error in worker:`, err)
})

solanaQueue.on('completed', async (job, err) =>{
    console.log(`L-MQ-W-35 ${job.id} completed.`)
})