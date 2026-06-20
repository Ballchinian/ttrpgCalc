//Gymnast swashbuckler bravado action (also a general Athletics action). Counts as an attack.
//Critical success knocks the target prone (which integrates cleanly with the off-guard system).
export default {
    name: "Shove",
    type: "roll",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "attack" }],
    check: { actorStat: "athletics", targetStat: "fortitude", reverseOutcome: false },
    outcomes: {
        criticalSuccess: { text: "You shove the target back and knock it prone.", effects: [
            { type: "addCondition", condition: "prone", target: "targetCharacters", duration: { type: "manual" } },
        ]},
        success: { text: "You shove the target back.", effects: [] },
        failure: { text: "You fail to shove the target.", effects: [] },
        criticalFailure: { text: "You stumble and fail to shove the target.", effects: [] },
    },
    description: "Shove: an Athletics check against the target's Fortitude DC that counts as an attack. Critical success also knocks the target prone. On a success you gain panache.",
};
