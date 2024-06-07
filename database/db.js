const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({
    path: path.join(__dirname, '../','./.env')
});

const URI = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

let client = new MongoClient(URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
})

client.connect();
client = client.db(dbName);
console.log(`MongoDB connected to ${dbName}...`);

/* ------------------------- Connect to the database ------------------------ */

const listDatabases = async () => {
    try{
        const databases = await client.admin().listDatabases()

        return databases.databases
    }catch(err){
        console.error(err)
    }
}
// listDatabases().then(res => console.log(res)).catch(err => console.error(err))

/**
 * Asynchronously adds a document to a specified MongoDB collection.
 * Handles errors and returns a success or failure response.
 * @param {Object} params - The parameters object.
 * @param {string} params.collection - The name of the MongoDB collection.
 * @param {string} params.documentId - The unique identifier for the document.
 * @param {Object} params.data - The data to be inserted into the document.
 * @returns {Object} - An object indicating success or failure along with relevant data.
 */
const addDocument = async ({ collection, documentId, data }) => {
    try {
        const createdAt = new Date();
        const response = await client.collection(collection).insertOne({
            _id: documentId,
            serverTimestamp: createdAt,
            ...data
        });

        return {
            success: true,
            message: "Doc created successfully!",
            payload: data
        };
    } catch (err) {
        console.log(err.message);
        return {
            success: false,
            message: err.message,
            payload: data
        };
    }
};
// addDocument({
//     collection: 'users',
//     documentId: "4",
//     data: {
//         userName: "gabe",
//         userId: 4
//     }
// }).then(res => console.log(res)).catch(err => console.error(err))

const addManyDocuments = async ({ collection, data }) => {
    try{
        const response = await client.collection(collection).insertMany(data, { ordered: false })

        const { insertedCount, insertedIds } = response

        return {
            success: true,
            message: "Added docs successfully!",
            insertedCount,
            insertedIds,
        }
    }catch(err){
        console.log(err)
        return {
            success: false,
            message: err.message,
        }
    }
}
// addManyDocuments({
//     collection: "users",
//     data: [
//         {
//             _id: "2",
//             userName: "gabe2"
//         },
//         {
//             _id: "3",
//             userName: "gabe3"
//         }
//     ] 
// }).then(res => console.log(res))

/**
 * Retrieves a document from a specified MongoDB collection using an ID.
 * @param {Object} options - An object containing collection name and document ID.
 * @param {string} options.collection - The name of the MongoDB collection to query.
 * @param {string} options.id - The ID of the document to retrieve.
 * @returns {Object} An object with success status, message, and retrieved document or error message.
 */
const getDocument = async ({ collection, id }) => {
    try {
        const response = await client.collection(collection).findOne({ _id: id });
        return {
            success: true,
            message: "Data Fetched Successfully!",
            payload: response
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            message: err.message
        };
    }
};
// getDocument({
//     collection: "users",
//     id: "RqDFSj1n9GUtZv18JRmFGMEb4kz1"
// }).then(res => console.log(res))

/**
 * Updates a document in a MongoDB collection.
 * @param {Object} options - The options object.
 * @param {string} options.collection - The name of the MongoDB collection.
 * @param {string} options.documentId - The ID of the document to be updated.
 * @param {Object} options.data - The data to be used in the update operation.
 * @param {string} [options.operation='$set'] - The MongoDB update operator (default is `$set`).
 * @param {boolean} [options.upsert=false] - A boolean indicating whether to insert the document if it does not exist (default is `false`).
 * @returns {Object} - An object indicating the success or failure of the update operation.
 */
const updateDocument = async ({ collection, documentId, data, operation = '$set', upsert = false }) => {
    try {
        // Prepare the update operation dynamically based on the input
        const updateOperation = operation === 'multiple' ? data : { [operation]: data };

        const response = await client.collection(collection).updateOne(
            { _id: documentId },
            updateOperation,
            { upsert }
        );

        if (!response?.acknowledged) {
            return {
                success: false,
                message: "Failed to update",
                data: response
            };
        }

        return {
            success: true,
            message: response
        };
    } catch (err) {
        return {
            success: false,
            message: err.message
        };
    }
};
// updateDocument({
//     collection: "users",
//     documentId: "RqDFSj1n9GUtZv18JRmFGMEb4kz1",
//     data: {
//         activeRequests: 0
//     }
// }).then(res => console.log(res))

/**
 * Updates multiple documents in a specified MongoDB collection where a certain key does not exist.
 * @param {Object} options - The options object.
 * @param {string} options.collection - The name of the MongoDB collection to update.
 * @param {Object} options.data - The data to set in the documents.
 * @param {string} options.whereKey - The key to check for existence in the documents.
 * @param {any} options.whereValue - The value to check for the key (not used in this function).
 * @returns {Object} An object indicating the success or failure of the update operation.
 */
const updateManyDocuments = async ({ collection, data, whereKey, whereValue }) => {
    try {
        const response = await client.collection(collection).updateMany(
            { [whereKey]: { $eq: whereValue } }, // where clause
            { $set: data }
        );

        return {
            success: response?.acknowledged,
            message: response?.acknowledged ? response : "Failed to update",
            data: response
        };
    } catch (err) {
        return {
            success: false,
            message: err.message
        };
    }
}
// updateManyDocument({
//     collection: "users",
//     documentId: "RqDFSj1n9GUtZv18JRmFGMEb4kz1",
//     data: {
//         activeRequests: 0
//     }
// }).then(res => console.log(res))


/**
 * Asynchronously deletes a document from a specified MongoDB collection using its ID.
 * @param {Object} options - The options object.
 * @param {string} options.collection - The name of the MongoDB collection.
 * @param {string} options.documentId - The ID of the document to delete.
 * @returns {Object} An object with success flag, message, and payload if successful, or error message if failed.
 */
const deleteDocument = async ({ collection, documentId }) => {
    try {
        const response = await client.collection(collection).deleteOne({ _id: documentId });

        return {
            success: true,
            message: "Doc deleted successfully!",
            payload: response
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            message: err.message
        };
    }
};

const deleteManyDocuments = async ({ collection, date }) => {
    try{
        const response = await client.collection(collection).deleteMany(
            {"signedUpOn": { $lt: date} }
        )

        return {
            success: true,
            message: "Doc deleted successfully!",
            payload: response
        }
    }catch(err){
        console.error(err)
        return {
            success: true,
            message: err.message
        }
    }
}

/**
 * Increments a specified field in a MongoDB document by a given amount.
 * @param {Object} options - The options object.
 * @param {string} options.collection - The name of the MongoDB collection.
 * @param {string} options.id - The ID of the document to update.
 * @param {string} options.key - The field to increment.
 * @param {number} options.amount - The amount by which to increment the field.
 * @returns {boolean} - true if successful, false otherwise
 */
const incrementValue = async ({ collection, id, key, amount }) => {
    console.log(`Incrementing ${id} ${key} in ${collection} by ${amount}`);
    try {
        const response = await client.collection(collection).updateOne({ _id: id }, { $inc: { [key]: amount } });
        if (!response.acknowledged) throw new Error('Update not acknowledged');
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}
// incrementValue({
//     id: "RqDFSj1n9GUtZv18JRmFGMEb4kz1",
//     collection: "users",
//     key: activeRequests,
//     amount: 1
// })


/**
 * Asynchronously decrements a specified field in a MongoDB document by a given amount.
 * @param {Object} params - The parameters object.
 * @param {string} params.collection - The name of the MongoDB collection.
 * @param {string} params.id - The unique identifier of the document to update.
 * @param {string} params.key - The field in the document to decrement.
 * @param {number} params.amount - The amount by which to decrement the field.
 * @returns {boolean} - true if successful, false otherwise
 */
const decrementValue = async ({ collection, id, key, amount }) => {
    console.log(`Decrementing ${id} ${key} in ${collection} by ${amount}`);
    try {
        const response = await client.collection(collection).updateOne(
            { _id: id },
            { $inc: { [key]: -amount } }
        );

        if (!response.acknowledged) {
            throw new Error('Update not acknowledged');
        }

        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}
// decrementValue({
//     id: "RqDFSj1n9GUtZv18JRmFGMEb4kz1",
//     collection: "users",
//     key: activeRequests,
//     amount: 1
// })

module.exports = {
    dbClient: client,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    incrementValue,
    decrementValue,
    addManyDocuments,
    deleteManyDocuments,
    updateManyDocuments,
}
