import mongoose from "mongoose";
const statConstant = { type: Number, min: -9999, max: 9999, default: 0 };

const dmgModSchema = new mongoose.Schema(
    {
        damageType: { type: String, required: true },
        value: { type: Number, required: true, min: 0, max: 999 },
    },
    { _id: false }
);

//Optional class ability (e.g. Swashbuckler). Generic shape so any entry in data/classFeatures.js
//fits: which feature, the chosen style, and a free-form config map (e.g. preciseStrike, finisherDice).
const classOptionSchema = new mongoose.Schema(
    {
        feature: { type: String },
        style: { type: String },
        config: { type: mongoose.Schema.Types.Mixed, default: {} },
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
            ac: statConstant,
            dc: statConstant,
            hp: { type: Number, min: 0, max: 99999, default: 0 },
            str: statConstant,
            strHit: statConstant,
            dexHit: statConstant,
            //Resilient rune (0-3): item bonus added to all three saves when the character enters battle.
            //Stored here (no armour concept) and kept separate from base saves so its source stays visible.
            resilient: { type: Number, min: 0, max: 3, default: 0 },
        },
        saves: {
            fortitude: statConstant,
            reflex: statConstant,
            will: statConstant,
        },
        perception: statConstant,
        skills: {
            athletics: statConstant,
            acrobatics: statConstant,
            arcana: statConstant,
            crafting: statConstant,
            deception: statConstant,
            diplomacy: statConstant,
            intimidation: statConstant,
            medicine: statConstant,
            nature: statConstant,
            occultism: statConstant,
            performance: statConstant,
            religion: statConstant,
            society: statConstant,
            stealth: statConstant,
            survival: statConstant,
            thievery: statConstant
        }
    },
    image: { type: String },
    resistances: { type: [dmgModSchema], default: [] },
    weaknesses: { type: [dmgModSchema], default: [] },
    immunities: { type: [String], default: [] },
    classOption: { type: classOptionSchema, default: null },
}, { timestamps: true });

characterSchema.index({ playerID: 1 });

export default mongoose.model("Character", characterSchema);
