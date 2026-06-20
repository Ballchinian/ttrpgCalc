//Fencer swashbuckler bravado action (also a general Deception action): Deception vs the target's
//Perception DC. Bravado payoff is panache on a success. (Applying off-guard on a success is a future
//refinement - it needs the offGuardSources model to support a sourceless, timed off-guard.)
export default {
    name: "Feint",
    type: "roll",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "mental" }],
    check: { actorStat: "deception", targetStat: "perception", reverseOutcome: false },
    outcomes: {
        criticalSuccess: { text: "Your feint completely fools the target.", effects: [] },
        success: { text: "Your feint fools the target.", effects: [] },
        failure: { text: "Your feint fails.", effects: [] },
        criticalFailure: { text: "Your feint is seen through.", effects: [] },
    },
    description: "Feint: a Deception check against the target's Perception DC. On a success you gain panache.",
};
