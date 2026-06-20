import mongoose from "mongoose";

//A saved encounter: the serialized battle store + recap history, so a battle can be restored on any
//device and two can be compared. `data` is free-form (the frontend store shapes) so it evolves with
//the stores without schema churn. Up to MAX_SAVED_BATTLES per user is enforced in the controller.
const savedBattleSchema = new mongoose.Schema({
    ownerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: { type: String, required: true, minlength: 1, maxlength: 100 },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

savedBattleSchema.index({ ownerID: 1 });

export default mongoose.model("SavedBattle", savedBattleSchema);
