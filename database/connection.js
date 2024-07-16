const path = require('path');
const mongoose = require('mongoose');
const { mongoUri, dbName } = require('../config/config');

let client = new MongoClient(mongoUri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    tls: true, // Ensure TLS is enabled
    tlsAllowInvalidCertificates: true // Adjust as per your SSL setup
});


const connectToDatabase = async () => {
    try{
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
        console.log("connected to db...")
    }catch(err){
        console.log("Failed to connect to db...", err)
        process.exit(1)
    }
}

module.exports = {
    connectToDatabase
}