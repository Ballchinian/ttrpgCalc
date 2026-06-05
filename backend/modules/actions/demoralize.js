export default {
    name: "Demoralize",
    type: "roll",
    targetType: "single",
    traits: [],
    check: {
        actorStat: "intimidation",
        targetStat: "will",
        reverseOutcome: false,
    },
    outcomes: {
        critSuccess: {
            text: "The target becomes frightened 2.",
            effects: [
                { type: "addCondition", condition: "frightened", adjustBy: 2, duration: { type: "decrement" }, target: "targetCharacters" }
            ]
        },
        success: {
            text: "The target becomes frightened 1.",
            effects: [
                { type: "addCondition", condition: "frightened", adjustBy: 1, duration: { type: "decrement" }, target: "targetCharacters" }
            ]
        },
        failure: {
            text: "You fail to frighten the target.",
            effects: []
        },
        critFailure: {
            text: "You critically fail. You become frightened 1.",
            effects: [
                { type: "addCondition", condition: "frightened", adjustBy: 1, duration: { type: "decrement" }, target: "activeActor" }
            ]
        }
    },
    description: "With a sudden shout, a well-timed taunt, or a cutting put-down, you can shake an enemy's resolve. Choose a creature within 30 feet of you who you're aware of. Attempt an Intimidation check against that target's Will DC. If the target doesn't understand the language you are speaking, or you're not speaking a language, you take a –4 circumstance penalty to the check. Regardless of your result, the target is temporarily immune to your attempts to Demoralize it for 10 minutes."
};
