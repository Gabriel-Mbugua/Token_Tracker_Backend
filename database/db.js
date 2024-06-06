const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({
    path: path.join(__dirname, '../','./.env')
});

const URI = process.env.MONGO_URI;

const client = new MongoClient(URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
})

/**
 * Attempts to establish a connection to a MongoDB database.
 * Logs success or error messages accordingly.
 */
const connectDB = async () => {
    try {
        console.log('MongoDB connected...');
        await client.connect();
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB()


module.exports = {
    db: client 
}
