import express from "express";
import { raydiumListener } from "./src/services/raydium/listener.js";
import { connection } from "./src/database/index.js";
import { initializeWorkers } from "./src/messageQueue/workers.js";
import { config } from "./src/config/config.js";
// import { errorHandler } from "./src/middlewares/errorHandler.js";
import apiRoutes from "./src/api/routes/index.js";

const app = express();

app.use(express.json());

app.use("/api", apiRoutes);

// app.use(errorHandler);

const startServer = async () => {
    try {
        /* ------------------------------ Initialise db ----------------------------- */
        await connection.connectToDatabase();

        /* --------------------------- Initialise workers --------------------------- */
        await initializeWorkers();

        /* ----------------------------- Start Listener ----------------------------- */
        raydiumListener.start();

        /* ---------------------------- Start the server ---------------------------- */
        global.server = app.listen(config.port, () => {
            console.info(`Server running on port http://localhost:${config.port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

/* ---------------------------- GRACEFUL SHUTDOWN --------------------------- */
process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    /* ------------------------------ Close workers ----------------------------- */
    await closeWorkers();
    /* ------------------------- Close queue connections ------------------------ */
    await closeConnections();
    /* ----------------------- Close redis cache instance ----------------------- */
    redisClient.disconnect();

    if (global.server) {
        global.server.close(() => {
            console.log("Server closed");
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
