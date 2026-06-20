import dotenv from "dotenv";
dotenv.config();

//express: framework for building web applications in Node.js
import express from "express";
//cors: middleware to enable cross-origin requests
import cors from "cors";
//helmet: sets defense-in-depth HTTP security headers
import helmet from "helmet";
//mongoose: MongoDB object modeling tool for defining schemas
import mongoose from "mongoose";
import { tokenVerification } from "./middleware/tokenVerification.js";
import cookieParser from "cookie-parser";
import { FRONTEND_BASE_URL } from "./config/mainConfig.js";
import characterRoutes from "./routes/characterRoutes.js";
import battleRoutes from "./routes/battleRoutes.js";
import actionRoutes from "./routes/actionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import savedBattleRoutes from "./routes/savedBattleRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

//Railway (and most PaaS hosts) sit one reverse-proxy hop in front of the app. Without this, req.ip
//resolves to the proxy's address for every request, so express-rate-limit buckets all users together
//(one shared limit) and warns about the X-Forwarded-For header. Trust exactly one hop, not `true`
//(the permissive setting express-rate-limit flags as spoofable).
app.set("trust proxy", 1);

//Defense-in-depth security headers (nosniff, frameguard, HSTS, referrer-policy, hide X-Powered-By).
//CSP and the cross-origin isolation headers are disabled here: the API only serves JSON (its
//XSS-relevant CSP lives on the frontend host, frontend/public/_headers), and COEP/CORP would block
//the separate frontend origin and cross-origin Cloudinary image loads.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
    FRONTEND_BASE_URL,
    "http://localhost:3000",
    "http://localhost:5173",
].filter(Boolean);


app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

//Saved battles carry the full parties + recap history, so they need a larger body limit than the
//50 KB single-action default. Mounted before the global parser so this route's limit wins.
app.use("/api/saved-battles", tokenVerification, express.json({ limit: "512kb" }), savedBattleRoutes);

//50 KB cap prevents oversized single-action resolve payloads
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/actions", tokenVerification, actionRoutes);
app.use("/api/characters", tokenVerification, characterRoutes);
app.use("/api/battles", tokenVerification, battleRoutes);
app.use("/api/import", tokenVerification, importRoutes);

//Catch-all 404: returns JSON instead of Express default HTML
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

//Global error handler: catches any error passed to next(err) from route handlers
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message ?? "Internal server error" });
});

//Connect to MongoDB: exit on failure so a process manager can restart
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => { console.error(err); process.exit(1); });