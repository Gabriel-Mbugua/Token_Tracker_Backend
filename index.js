const express = require('express');
const tokenRoutes = require('./routes/token.routes');
const { solListener } = require('./services/solana');
const { connectToDatabase } = require('./database/connection');
const { initializeWorkers } = require('./messageQueue/workers');
const { NODE_ENV } = require('./config/config');
const { errorHandler } = require('./middlewares/errorHandler');
require('dotenv').config();

const PORT = process.env.PORT || 3000;


const app = express();

app.use(express.json());

app.use('/tokens', tokenRoutes);

app.use(errorHandler)

const startServer = async () => {
    try {  
        /* ------------------------------ Initialise db ----------------------------- */
        await connectToDatabase()

        /* --------------------------- Initialise workers --------------------------- */
        if (NODE_ENV === "production") initializeWorkers()

        /* ----------------------------- Start Listener ----------------------------- */
        solListener()

        /* ---------------------------- Start the server ---------------------------- */
        global.server = app.listen(port, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

/* ---------------------------- GRACEFUL SHUTDOWN --------------------------- */
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    /* ------------------------------ Close workers ----------------------------- */
    await closeWorkers()
    /* ------------------------- Close queue connections ------------------------ */
    await closeConnections()
    /* ----------------------- Close redis cache instance ----------------------- */
    redisClient.disconnect()

    if (global.server) {
        global.server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));