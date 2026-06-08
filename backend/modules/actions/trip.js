export default {
    name: "Trip",
    type: "roll",
    targetType: "single",
    traits: [{ name: "attack" }],
    check: {
        actorStat: "athletics",
        targetStat: "reflex",
        reverseOutcome: false,
    },
    outcomes: {
        criticalSuccess: {
            text: "The target falls, lands prone, and takes 1d6 bludgeoning damage.",
            effects: [
                { type: "addCondition", condition: "prone", duration: { type: "manual" }, target: "targetCharacters" },
                { type: "damage", number: { numRolled: 1, diceRolled: 6, modifier: 0 }, damageType: "bludgeoning", target: "targetCharacters" }
            ]
        },
        success: {
            text: "The target falls and lands prone.",
            effects: [{ type: "addCondition", condition: "prone", duration: { type: "manual" }, target: "targetCharacters" }]
        },
        failure: {
            text: "You fail to trip the target.",
            effects: []
        },
        criticalFailure: {
            text: "You lose your balance, fall, and land prone.",
            effects: [{ type: "addCondition", condition: "prone", duration: { type: "manual" }, target: "activeActor" }]
        }
    },
    description: "Your target can't be more than one size larger than you. You try to knock a creature to the ground. Attempt an Athletics check against the target's Reflex DC."
};