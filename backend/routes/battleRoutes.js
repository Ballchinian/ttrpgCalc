import express from "express";
import { resolveAction } from "../controllers/battleController.js";

const router = express.Router();

//Resolve a single action
router.post("/", resolveAction);

export default router;
