import { FRONTEND_BASE_URL } from "../config/mainConfig.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const REFRESH_TTL = 7 * 24 * 60 * 60 * 1000;

//Module-level singleton so the SMTP connection pool is reused across requests
const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
});

//Store a sha256 hash of tokens in DB so a DB breach can't be used to hijack sessions
const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

//Signs a short-lived access token for the given user
const signAccessToken = (user) => jwt.sign(
    { userID: user._id, email: user.email },
    process.env.JWT_SECRET, { expiresIn: "15m" }
);

//Creates a new refresh token: raw token goes to cookie, hash goes to DB
const rotateRefreshToken = async (user) => {
    const raw = crypto.randomBytes(64).toString("hex");
    user.refreshToken = hashToken(raw);
    user.refreshTokenExpiry = new Date(Date.now() + REFRESH_TTL);
    await user.save();
    return raw;
};

//Sets an httpOnly refresh token cookie on the response
const setRefreshCookie = (res, token) =>
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: REFRESH_TTL,
    });

export const login = async(req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email?.toLowerCase().trim();
        if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = await rotateRefreshToken(user);
        setRefreshCookie(res, refreshToken);

        return res.json({
            success: true,
            accessToken,
            user: { name: user.name, email: user.email },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Login Failure" });
    }
};

export const register = async(req, res) => {
    const { name, password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return res.status(400).json({ success: false, message: "Password must be 8-128 characters" });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return res.status(201).json({
            success: true,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Register Failure" });
    }
};

export const requestResetPassword = async(req, res) => {
    const email = req.body.email?.toLowerCase().trim();
    try {
        const user = await User.findOne({ email });
        //Return 200 even when email not found to prevent user enumeration
        if (!user) return res.status(200).json({ message: "Password reset email sent." });

        //Raw token goes in email link; hash goes in DB so a breach can't be used to reset accounts
        const rawToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = hashToken(rawToken);
        user.resetTokenExpiry = new Date(Date.now() + 3600000); //1 hour TTL

        try {
            await user.save();
            await emailTransporter.sendMail({
                from: process.env.EMAIL_USERNAME,
                to: email,
                subject: "Password Reset Request",
                html: `<p>Click <a href="${FRONTEND_BASE_URL}/reset-password/${rawToken}">here</a> to reset your password. Link expires in 1 hour.</p>`
            });
        } catch (emailErr) {
            //Roll back token so the user can retry immediately without waiting an hour
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();
            throw emailErr;
        }

        return res.status(200).json({ message: "Password reset email sent." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Password reset failure" });
    }
};

export const confirmResetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== "string") {
        return res.status(400).json({ success: false, message: "Token is required" });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
        return res.status(400).json({ success: false, message: "Password must be 8-128 characters" });
    }

    try {
        //$gt: token expiry must be in the future
        const user = await User.findOne({
            resetToken: hashToken(token),
            resetTokenExpiry: { $gt: Date.now() },
        }).select("+resetToken +resetTokenExpiry");
        if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset token" });

        const hashed = await bcrypt.hash(newPassword, 12);

        user.password = hashed;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        //Invalidate all active sessions so an attacker who triggered the reset can't stay logged in
        user.refreshToken = null;
        user.refreshTokenExpiry = null;
        await user.save();

        return res.json({ success: true, message: "Password updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Reset Password Failure" });
    }
};

//refreshToken: stored in DB so it can be invalidated server-side, keeps JWT TTL short without kicking the user out
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

        //$gt: token expiry must be in the future
        const user = await User.findOne({
            refreshToken: hashToken(refreshToken),
            refreshTokenExpiry: { $gt: Date.now() },
        }).select("+refreshToken +refreshTokenExpiry");
        if (!user) return res.status(401).json({ message: "Invalid or expired refresh token" });

        const accessToken = signAccessToken(user);
        const newRefreshToken = await rotateRefreshToken(user);
        setRefreshCookie(res, newRefreshToken);

        return res.json({ accessToken });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Refresh failure" });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await User.updateOne({ refreshToken: hashToken(refreshToken) }, { refreshToken: null, refreshTokenExpiry: null });
        }
        res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "strict" });
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Logout failure" });
    }
};
