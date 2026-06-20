//Bard composition cantrip: inspire your allies. Applies inspired-courage (+1 status to attack rolls
//and +1 status Strike damage) to the selected friendly targets. Target your allies - including
//yourself - to buff them.
export default {
    name: "Courageous Anthem",
    type: "automatic",
    targetType: "aoe",
    actionCost: 1,
    traits: [{ name: "concentrate" }, { name: "auditory" }, { name: "emotion" }, { name: "mental" }, { name: "bard" }],
    effects: [
        { type: "addCondition", condition: "inspired-courage", target: "targetCharacters", duration: { type: "manual" } },
    ],
    description: "An inspiring anthem grants selected allies a +1 status bonus to attack rolls and +1 status damage on their Strikes.",
};
