export default {
    name: "off-guard",
    maxLevel: 1,
    //defaultDuration: no auto-decrement; source condition determines when this ends (manual removal)
    defaultDuration: { type: "manual" },
    offGuard: true,
    //fixedValue: 2 overrides effect.number; off-guard is always exactly -2 regardless of level
    statModifier: { bonusType: "circumstance", affectedStats: ["ac"], operation: "subtract", fixedValue: 2 },
    description: `You're distracted or otherwise unable to focus your full attention on defense. You take a –2 circumstance penalty to AC.`,
};
