import mongoose from "mongoose";

const dmgModSchema = new mongoose.Schema(
    {
        damageType: { type: String, required: true },
        value: { type: Number, required: true, min: 0, max: 999 },
    },
    { _id: false }
);

const characterSchema = new mongoose.Schema({
    playerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    characterName: { type: String, required: true, minlength: 1, maxlength: 100 },
    //Namespaced (Foundry-aligned): attributes / saves / perception / skills.
    //attributes also holds the calculator-specific attack mods (str, strHit, dexHit), which
    //Foundry derives per-weapon. hp is the base max HP that seeds the battle store's current/maxHealth.
    stats: {
        attributes: {
            ac: { type: Number, min: -9999, max: 9999, default: 0 },
            dc: { type: Number, min: -9999, max: 9999, default: 0 },
            hp: { type: Number, min: 0, max: 99999, default: 0 },
            str: { type: Number, min: -9999, max: 9999, default: 0 },
            strHit: { type: Number, min: -9999, max: 9999, default: 0 },
            dexHit: { type: Number, min: -9999, max: 9999, default: 0 },
        },
        saves: {
            fortitude: { type: Number, min: -9999, max: 9999, default: 0 },
            reflex: { type: Number, min: -9999, max: 9999, default: 0 },
            will: { type: Number, min: -9999, max: 9999, default: 0 },
        },
        perception: { type: Number, min: -9999, max: 9999, default: 0 },
        skills: {
            athletics: { type: Number, min: -9999, max: 9999, default: 0 },
            acrobatics: { type: Number, min: -9999, max: 9999, default: 0 },
            arcana: { type: Number, min: -9999, max: 9999, default: 0 },
            crafting: { type: Number, min: -9999, max: 9999, default: 0 },
            deception: { type: Number, min: -9999, max: 9999, default: 0 },
            diplomacy: { type: Number, min: -9999, max: 9999, default: 0 },
            intimidation: { type: Number, min: -9999, max: 9999, default: 0 },
            medicine: { type: Number, min: -9999, max: 9999, default: 0 },
            nature: { type: Number, min: -9999, max: 9999, default: 0 },
            occultism: { type: Number, min: -9999, max: 9999, default: 0 },
            performance: { type: Number, min: -9999, max: 9999, default: 0 },
            religion: { type: Number, min: -9999, max: 9999, default: 0 },
            society: { type: Number, min: -9999, max: 9999, default: 0 },
            stealth: { type: Number, min: -9999, max: 9999, default: 0 },
            survival: { type: Number, min: -9999, max: 9999, default: 0 },
            thievery: { type: Number, min: -9999, max: 9999, default: 0 }
        }
    },
    image: { type: String },
    resistances: { type: [dmgModSchema], default: [] },
    weaknesses: { type: [dmgModSchema], default: [] },
    immunities: { type: [String], default: [] },
}, { timestamps: true });

characterSchema.index({ playerID: 1 });

export default mongoose.model("Character", characterSchema);
