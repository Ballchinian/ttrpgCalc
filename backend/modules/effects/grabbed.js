export default {
    name: "grabbed",
    maxLevel: 1,
    //defaultDuration: no auto-decrement; persists until the grappler releases or is escaped (manual removal)
    defaultDuration: { type: "manual" },
    offGuard: true,
    //Forces a DC 5 flat check on the afflicted creature's manipulate actions (spells count as manipulate)
    //or the action is lost. Generic "trait -> flat check" interaction consumed by the action panel.
    traitFlatCheck: { trait: "manipulate", dc: 5 },
    //AC penalty owned by off-guard: adding it here would double-count the circumstance penalty
    description: `You're held in place by another creature, giving you the off-guard and immobilized conditions. If you attempt a manipulate action while grabbed, you must succeed at a DC 5 flat check or it is lost; roll the check after spending the action, but before any effects are applied.`
};
