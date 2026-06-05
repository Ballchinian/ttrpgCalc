import express from "express";
import multer from "multer";
import { fetchCharacters, createCharacter, updateCharacter, deleteCharacter } from "../controllers/characterController.js";
import { parser } from "../config/cloudinary.js";

const router = express.Router();

//Upload image to Cloudinary, return the resulting URL
router.post("/upload", (req, res, next) => {
    parser.single("image")(req, res, (err) => {
        //Return 400 for multer errors (file type, file size) instead of propagating to global handler
        if (err instanceof multer.MulterError || err?.message?.startsWith("Invalid file type")) {
            return res.status(400).json({ error: err.message });
        }
        if (err) return next(err);
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        //req.file.path is the Cloudinary URL when using CloudinaryStorage
        res.json({ url: req.file.path });
    });
});

router.get("/", fetchCharacters);
router.post("/", createCharacter);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);

export default router;