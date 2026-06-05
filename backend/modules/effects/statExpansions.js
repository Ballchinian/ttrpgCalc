const allSkills = [
    "acrobatics", "arcana", "athletics", "crafting", "deception",
    "diplomacy", "intimidation", "medicine", "nature", "occultism",
    "perception", "performance", "religion", "society", "stealth",
    "survival", "thievery"
];

const saves = ["fortitude", "reflex", "will"];

//Map of shorthand keys used in effect definitions to the real stat names they expand to
const STAT_EXPANSIONS = {
    //everything you roll (attacks + skills + saves)
    checks: [...allSkills, ...saves, "strHit", "dexHit"],
    //skill checks only
    skills: allSkills,
    //saving throws only
    saves: saves,
    //everything opponents roll against
    dcs: ["ac", "dc"],

    //Strength-based checks and attack rolls
    strChecks: ["athletics", "strHit"],
    //Dexterity-based checks, saves, attack rolls, and AC
    dexChecks: ["ac", "acrobatics", "stealth", "thievery", "reflex", "dexHit"],
    //Intelligence-based skill checks
    intChecks: ["arcana", "crafting", "occultism", "society"],
    //Wisdom-based skill checks and Will save
    wisChecks: ["medicine", "nature", "perception", "religion", "survival", "will"],
    //Charisma-based skill checks
    chaChecks: ["deception", "diplomacy", "intimidation", "performance"],
};

export default STAT_EXPANSIONS;
