import express from "express";
import { tokenControllers } from "../controllers/index.js";

const router = express.Router();

router.get("/", tokenControllers.getTokens);

export default router;
