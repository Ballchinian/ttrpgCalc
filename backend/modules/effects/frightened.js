export default {
    name: "frightened",
    maxLevel: 10,
    defaultDuration: { type: "decrement" },
    //fixedValue intentionally absent: statResolution uses effect.number as the penalty (scales with level)
    statModifier: { bonusType: "status", affectedStats: ["checks", "dcs"], operation: "subtract" },
    description: `You're gripped by fear and struggle to control your nerves. You take a status penalty equal to this value to all your checks and DCs. Unless specified otherwise, at the end of each of your turns, the value decreases by 1.`
};
