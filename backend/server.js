import dotenv from "dotenv";
dotenv.config();

//express: framework for building web applications in Node.js
import express from "express";
//cors: middleware to enable cross-origin requests
import cors from "cors";
//mongoose: MongoDB object modeling tool for defining schemas
import mongoose from "mongoose";
import { tokenVerification } from "./middleware/tokenVerification.js";
import cookieParser from "cookie-parser";
import { FRONTEND_BASE_URL } from "./config/mainConfig.js";
import characterRoutes from "./routes/characterRoutes.js";
import battleRoutes from "./routes/battleRoutes.js";
import actionRoutes from "./routes/actionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

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

//50 KB cap prevents oversized battle payloads
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/actions", tokenVerification, actionRoutes);
app.use("/api/characters", tokenVerification, characterRoutes);
app.use("/api/battles", tokenVerification, battleRoutes);

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