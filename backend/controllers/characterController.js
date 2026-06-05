import mongoose from "mongoose";
import Character from "../models/characterModel.js";

const CLOUDINARY_RE = /^https:\/\/res\.cloudinary\.com\//;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const fetchCharacters = async (req, res) => {
    try {
        const characters = await Character.find({ playerID: req.userID }).lean();
        return res.json(characters);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Get Character failure" });
    }
};

export const createCharacter = async (req, res) => {
    try {
        const { characterName, stats, image, resistances, weaknesses, immunities } = req.body;
        if (image && !CLOUDINARY_RE.test(image)) {
            return res.status(400).json({ message: "Invalid image URL" });
        }
        const newCharacter = new Character({ playerID: req.userID, characterName, stats, image, resistances, weaknesses, immunities });
        const saved = await newCharacter.save();
        return res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Create Character failure" });
    }
};

export const updateCharacter = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid character ID" });
        const { characterName, stats, image, resistances, weaknesses, immunities } = req.body;
        if (image && !CLOUDINARY_RE.test(image)) {
            return res.status(400).json({ message: "Invalid image URL" });
        }
        const updatedCharacter = await Character.findOneAndUpdate(
            { _id: req.params.id, playerID: req.userID },
            { $set: { characterName, stats, image, resistances, weaknesses, immunities } },
            { new: true, runValidators: true }
        );
        if (!updatedCharacter) return res.status(404).json({ message: "Character not found" });
        return res.json(updatedCharacter);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Update Character failure" });
    }
};

export const deleteCharacter = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid character ID" });
        const deleted = await Character.findOneAndDelete({ _id: req.params.id, playerID: req.userID });
        if (!deleted) return res.status(404).json({ message: "Character not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Delete Character failure" });
    }
};