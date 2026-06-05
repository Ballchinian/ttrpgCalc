export default {
    name: "prone",
    maxLevel: 1,
    //defaultDuration: no auto-decrement; ends when the character Stands (manual removal)
    defaultDuration: { type: "manual" },
    offGuard: true,
    //offGuard:true already applies -2 to AC via off-guard; "ac" here would double-count it
    //PF2e: prone gives -2 circumstance to attack rolls; ranged attack cover not modelled
    //fixedValue: 2 overrides effect.number; the attack penalty is always exactly -2
    statModifier: { bonusType: "circumstance", affectedStats: ["strHit", "dexHit"], operation: "subtract", fixedValue: 2 },
    description: `You're lying on the ground. You are off-guard and take a –2 circumstance penalty to attack rolls. The only move actions you can use while you're prone are Crawl and Stand. Standing up ends the prone condition. You can Take Cover while prone to hunker down and gain greater cover against ranged attacks, even if you don't have an object to get behind, which grants you a +4 circumstance bonus to AC against ranged attacks (but you remain off-guard).`
};
