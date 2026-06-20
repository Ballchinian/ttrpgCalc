//Fencer swashbuckler bravado action (also a general Deception action): Deception vs observers'
//Perception DC to become hidden. Bravado payoff is panache on a success.
export default {
    name: "Create a Diversion",
    type: "roll",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "mental" }, { name: "manipulate" }],
    check: { actorStat: "deception", targetStat: "perception", reverseOutcome: false },
    outcomes: {
        criticalSuccess: { text: "Your diversion works flawlessly.", effects: [] },
        success: { text: "Your diversion works.", effects: [] },
        failure: { text: "Your diversion fails.", effects: [] },
        criticalFailure: { text: "Your diversion fails badly.", effects: [] },
    },
    description: "Create a Diversion: a Deception check against observers' Perception DC to become hidden. On a success you gain panache.",
};
