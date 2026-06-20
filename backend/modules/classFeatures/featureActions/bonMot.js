//Wit swashbuckler bravado action (also a Diplomacy skill feat): a quip vs the target's Will DC.
//Bravado payoff is panache on a success. (The Perception/Will status penalty is a future condition.)
export default {
    name: "Bon Mot",
    type: "roll",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "auditory" }, { name: "concentrate" }, { name: "emotion" }, { name: "linguistic" }, { name: "mental" }],
    check: { actorStat: "diplomacy", targetStat: "will", reverseOutcome: false },
    outcomes: {
        criticalSuccess: { text: "Your bon mot lands perfectly, rattling the target.", effects: [] },
        success: { text: "Your bon mot rattles the target.", effects: [] },
        failure: { text: "Your bon mot falls flat.", effects: [] },
        criticalFailure: { text: "Your bon mot rebounds on you.", effects: [] },
    },
    description: "Bon Mot: a Diplomacy check against the target's Will DC. On a success you gain panache.",
};
