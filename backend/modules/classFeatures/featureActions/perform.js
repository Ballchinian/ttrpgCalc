//Battledancer swashbuckler bravado action: a flourish/performance. Modeled as an automatic self
//action whose only payoff here is panache (injected into outcomes.success by injectGrants).
export default {
    name: "Perform",
    type: "automatic",
    targetType: "self",
    actionCost: 1,
    traits: [{ name: "concentrate" }],
    outcomes: {
        success: { text: "You perform with flair.", effects: [] },
    },
    description: "Perform: a dazzling flourish. On a success you gain panache.",
};
