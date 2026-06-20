//Rascal swashbuckler bravado action. Counts as an attack (so it uses/raises MAP). Its bravado payoff
//is panache on a success, injected by injectGrants for a Rascal. (A future refinement could apply
//off-guard, which needs the offGuardSources model to support a sourceless, timed off-guard.)
export default {
    name: "Dirty Trick",
    type: "roll",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "attack" }, { name: "manipulate" }],
    check: { actorStat: "thievery", targetStat: "reflex", reverseOutcome: false },
    outcomes: {
        criticalSuccess: { text: "Your dirty trick lands perfectly.", effects: [] },
        success: { text: "Your dirty trick works.", effects: [] },
        failure: { text: "Your dirty trick fails.", effects: [] },
        criticalFailure: { text: "Your dirty trick backfires.", effects: [] },
    },
    description: "A Rascal's Dirty Trick: a Thievery check against the target's Reflex DC that counts as an attack. On a success you gain panache.",
};
