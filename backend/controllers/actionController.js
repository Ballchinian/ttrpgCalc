import mongoose from "mongoose";
import Action from "../models/actionModel.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

export const fetchActions = async (req, res) => {
    try {
        const actions = await Action.find({ playerID: req.userID }).lean();
        return res.json({
            weapons: actions.filter(a => a.category === "weapon"),
            spells: actions.filter(a => a.category === "spell"),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch actions" });
    }
};

export const addAction = async (req, res) => {
    try {
        const { name, type, category, group, tradition, check, traits, targetType, actionCost, basicSave, outcomes } = req.body;
        const action = new Action({
            playerID: req.userID,
            name, type, category, group, tradition, check, traits, targetType, actionCost, basicSave, outcomes,
        });
        const saved = await action.save();
        return res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
        return res.status(500).json({ message: "Failed to add action" });
    }
};

export const updateAction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: "Invalid action ID" });
        const { name, type, category, group, tradition, check, traits, targetType, actionCost, basicSave, outcomes } = req.body;
        const updatedAction = await Action.findOneAndUpdate(
            { _id: id, playerID: req.userID },
            { $set: { name, type, category, group, tradition, check, traits, targetType, actionCost, basicSave, outcomes } },
            { new: true, runValidators: true }
        );
        if (!updatedAction) return res.status(404).json({ message: "Action not found" });
        return res.json(updatedAction);
    } catch (err) {
        console.error(err);
        if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
        return res.status(500).json({ message: "Failed to update action" });
    }
};

export const deleteAction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: "Invalid action ID" });
        const deleted = await Action.findOneAndDelete({ _id: id, playerID: req.userID });
        if (!deleted) return res.status(404).json({ message: "Action not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete action" });
    }
};
