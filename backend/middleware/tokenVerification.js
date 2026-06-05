import jwt from "jsonwebtoken";

export function tokenVerification(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "No token" });

    //Discard "Bearer" prefix and take the raw token string
    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ message: "Malformed authorization header" });
    }
    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userID = decoded.userID;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token expired" });
        }
        return res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid token" });
    }
}
