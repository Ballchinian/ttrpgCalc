import express from "express";
import rateLimit from "express-rate-limit";
import { importPathbuilder } from "../controllers/importController.js";

const router = express.Router();

//Caps outbound proxy calls so this endpoint can't be used to hammer pathbuilder2e.com
const importLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many import attempts, please try again later." },
});

router.get("/pathbuilder/:code", importLimiter, importPathbuilder);

export default router;
