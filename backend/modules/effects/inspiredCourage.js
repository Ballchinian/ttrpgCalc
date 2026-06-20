export default {
    name: "inspired-courage",
    maxLevel: 1,
    category: "effect",
    defaultDuration: { type: "manual" },
    //Courageous Anthem: +1 status to attack rolls (handled by statResolution)...
    statModifier: { bonusType: "status", affectedStats: ["strHit", "dexHit"], operation: "add", fixedValue: 1 },
    //...and +1 status damage on every Strike (handled by injectStrikeAugments)
    strikeDamage: { kind: "flat", value: 1, category: "status", damageType: "same", filter: "allStrikes", label: "Inspire Courage" },
    description: `Courageous Anthem inspires you: you gain a +1 status bonus to attack rolls and deal +1 status damage on your Strikes.`,
};
