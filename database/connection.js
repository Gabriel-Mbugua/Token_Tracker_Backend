const path = require('path');
const mongoose = require('mongoose');
const { mongoUri, dbName } = require('../config/config');


const connectToDatabase = async () => {
    try{
        await mongoose.connect(mongoUri)
        console.log("connected to db...")
    }catch(err){
        console.log("Failed to connect to db...", err)
        process.exit(1)
    }
}

module.exports = {
    connectToDatabase
}