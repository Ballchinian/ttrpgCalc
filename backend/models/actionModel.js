import mongoose from "mongoose";
import { WEAPON_GROUPS } from "../data/weaponGroups.js";
import { SPELL_TRADITIONS } from "../data/spellTraditions.js";

//General number schema for dice (d12), num, 2d and modifier +2
const bonusDiceSchema = new mongoose.Schema(
    {
        numRolled: { type: Number, required: true, min: 1, max: 20 },
        diceRolled: { type: Number, required: true, min: 1, max: 100 },
    },
    { _id: false }
);

const diceSchema = new mongoose.Schema(
    {
        numRolled: { type: Number, required: true, min: 1, max: 20 },
        diceRolled: { type: Number, required: true, min: 1, max: 100 },
        modifier: { type: Number, required: true, min: -200, max: 200 },
        bonusDice: { type: bonusDiceSchema },
    },
    { _id: false }
);

//For weapon traits
const traitSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        label: { type: String, required: true },
        data: { type: mongoose.Schema.Types.Mixed }
    },
    { _id: false }
);

const durationSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["manual", "rounds", "endOfRound", "decrement", "endOfNextTurn"], default: "manual" },
        remaining: { type: Number },
    },
    { _id: false }
);

//Need to cover for damage, healing, and conditions (add/remove)
const effectSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["damage", "healing", "addCondition", "removeCondition"],
            required: true
        },
        number: { type: diceSchema },
        multiplier: { type: Number },
        damageType: { type: String },
        //Damage instance category, mirroring Foundry (only "persistent" is currently modelled)
        category: { type: String, enum: ["persistent", "splash", "precision"] },
        condition: {
            type: String,
            validate: {
                validator: function () {
                    if (["addCondition", "removeCondition"].includes(this.type)) return !!this.condition;
                    return true;
                },
                message: "condition is required for addCondition/removeCondition effects"
            }
        },
        //Determines who the condition/effect applies to; defaults to the targeted character
        target: { type: String, enum: ["targetCharacters", "activeActor"], default: "targetCharacters" },
        adjustBy: { type: Number, min: -50, max: 50 },
        duration: { type: durationSchema },
        tags: {
            type: [String],
            default: []
        }
    },
    { _id: false }
);

const outcomeSchema = new mongoose.Schema(
    {
        effects: {
            type: [effectSchema],
            default: []
        }
    },
    { _id: false }
);

const checkSchema = new mongoose.Schema(
    {
        targetStat: {
            type: String,
            enum: ["ac", "fortitude", "reflex", "will", "athletics", "perception"]
        },
        actorStat: {
            type: String,
            //toHit kept for backwards compat with records saved before the strHit/dexHit rename
            enum: ["dc", "strHit", "dexHit", "toHit", "none",
                   "athletics", "acrobatics", "intimidation", "stealth",
                   "arcana", "crafting", "deception", "diplomacy", "medicine",
                   "nature", "occultism", "performance", "religion", "society",
                   "survival", "thievery", "perception", "fortitude", "reflex", "will"]
        }
    },
    { _id: false }
);

const actionSchema = new mongoose.Schema({
    playerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: { type: String, required: true, minlength: 1, maxlength: 100 },
    //Type determines how the action is resolved, auto and skill for futureproof
    type: { type: String, enum: ["roll", "automatic"], required: true },
    category: { type: String, enum: ["weapon", "spell"], required: true },
    //PF2e weapon group: determines critical specialisation and (for ranged groups) which attack stat is used
    group: { type: String, enum: [...WEAPON_GROUPS] },
    //PF2e spell traditions (arcane/divine/occult/primal): array since spells can appear on multiple lists
    tradition: { type: [{ type: String, enum: [...SPELL_TRADITIONS] }], default: [] },
    //Doesnt require check for automatic actions
    check: { type: checkSchema, required: function () { return this.type !== "automatic" } },
    traits: { type: [traitSchema], default: [] },
    targetType: { type: String, enum: ["self", "single", "aoe"], required: true },
    actionCost: { type: Number, min: 0, max: 3, default: 1 },
    basicSave: { type: Boolean, default: false },
    outcomes: {
        criticalSuccess: { type: outcomeSchema, default: () => ({}) },
        success: { type: outcomeSchema, default: () => ({}) },
        failure: { type: outcomeSchema, default: () => ({}) },
        criticalFailure: { type: outcomeSchema, default: () => ({}) }
    }
}, { timestamps: true });

actionSchema.index({ playerID: 1 });

const Action = mongoose.model("Action", actionSchema);
export default Action;
