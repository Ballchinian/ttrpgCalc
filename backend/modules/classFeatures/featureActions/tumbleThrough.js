//Rascal swashbuckler bravado action: an Acrobatics check vs the target's Reflex DC to move through it.
//Its bravado payoff is panache on a success (injected by injectGrants for a Rascal).
export default {
    name: "Tumble Through",
    type: "roll",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "move" }],
    check: { actorStat: "acrobatics", targetStat: "reflex", reverseOutcome: false },
    outcomes: {
        criticalSuccess: { text: "You tumble gracefully through the foe's space.", effects: [] },
        success: { text: "You tumble through the foe's space.", effects: [] },
        failure: { text: "You fail to tumble through.", effects: [] },
        criticalFailure: { text: "You stumble and fail to tumble through.", effects: [] },
    },
    description: "Tumble Through: an Acrobatics check against a foe's Reflex DC to move through its space. On a success you gain panache.",
};
