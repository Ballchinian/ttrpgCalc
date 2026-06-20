//Inventor action: rev up your Overdrive. Modeled as an automatic success (the Crafting check vs a flat
//DC isn't simulated) that applies the `overdrive` effect (extra Strike damage) for the encounter.
export default {
    name: "Overdrive",
    type: "automatic",
    targetType: "self",
    actionCost: 1,
    traits: [{ name: "concentrate" }, { name: "inventor" }, { name: "manipulate" }],
    effects: [
        { type: "addCondition", condition: "overdrive", target: "activeActor", adjustBy: "$overdriveDamage", duration: { type: "manual" } },
    ],
    description: "Your Overdrive comes online (assumed success): you deal extra damage on your Strikes until the end of the encounter.",
};
