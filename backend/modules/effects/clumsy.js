export default {
    name: "clumsy",
    maxLevel: 10,
    defaultDuration: { type: "decrement" },
    //fixedValue intentionally absent: statResolution uses effect.number as the penalty (scales with level)
    statModifier: { bonusType: "status", affectedStats: ["dexChecks"], operation: "subtract" },
    description: `Your movements become clumsy and inexact. Clumsy always includes a value. You take a status penalty equal to the condition value to Dexterity-based rolls and DCs, including AC, Reflex saves, ranged attack rolls, and skill checks using Acrobatics, Stealth, and Thievery.`
};
