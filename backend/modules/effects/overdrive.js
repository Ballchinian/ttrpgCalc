export default {
    name: "overdrive",
    //value holds the bonus damage (scales with level and a critical Overdrive check) - no level cap
    maxLevel: "infinite",
    category: "effect",
    defaultDuration: { type: "manual" },
    strikeDamage: { kind: "flat", fromValue: true, category: "untyped", damageType: "same", filter: "allStrikes", label: "Overdrive" },
    description: `Your Overdrive is online: you deal this much additional damage on your Strikes until the end of the encounter.`,
};
