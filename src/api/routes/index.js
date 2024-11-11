import express from "express";
import tokenRoutes from "./token.routes.js";

const router = express.Router();

router.use("/tokens", tokenRoutes);

export default router;
