export default {
    name: "Grapple",
    type: "roll",
    targetType: "single",
    traits: [{ name: "attack" }],
    check: {
        actorStat: "athletics",
        targetStat: "fortitude",
        reverseOutcome: false,
    },
    outcomes: {
        critSuccess: {
            text: "Your target is restrained until the end of your next turn unless you move or your target Escapes.",
            effects: [
                { type: "addCondition", condition: "restrained", duration: { type: "manual" }, target: "targetCharacters" }
            ]
        },
        success: {
            text: "Your target is grabbed until the end of your next turn unless you move or your target Escapes.",
            effects: [
                { type: "addCondition", condition: "grabbed", duration: { type: "manual" }, target: "targetCharacters" }
            ]
        },
        failure: {
            text: "You fail to grab your target. If you already had them grabbed or restrained, those conditions end.",
            effects: [
                { type: "removeCondition", condition: "grabbed", target: "targetCharacters" },
                { type: "removeCondition", condition: "restrained", target: "targetCharacters" }
            ]
        },
        critFailure: {
            text: "Your target breaks free. You fall prone.",
            effects: [
                { type: "removeCondition", condition: "grabbed", target: "targetCharacters" },
                { type: "removeCondition", condition: "restrained", target: "targetCharacters" },
                { type: "addCondition", condition: "prone", duration: { type: "manual" }, target: "activeActor" }
            ]
        }
    },
    description: "You attempt to grab a creature or object with your free hand. Attempt an Athletics check against the target's Fortitude DC. You can Grapple a target you already have grabbed or restrained without having a hand free."
};
