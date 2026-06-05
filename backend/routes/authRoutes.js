import express from "express";
import rateLimit from "express-rate-limit";
import { login, register, requestResetPassword, confirmResetPassword, refresh, logout } from "../controllers/authController.js";

const router = express.Router();

//Strict limiter for sensitive auth routes: slows brute-force on login/register/reset
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
});

//Permissive limiter for automated session routes: refresh is called silently by the frontend on expiry
//20/15min would lock out users with multiple open tabs; 200/15min is safe for normal usage
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
});

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);
router.post("/request-reset-password", authLimiter, requestResetPassword);
router.post("/confirm-reset-password", authLimiter, confirmResetPassword);
router.post("/refresh", sessionLimiter, refresh);
router.post("/logout", sessionLimiter, logout);

export default router;
