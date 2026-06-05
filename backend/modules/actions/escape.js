export default {
    name: "Escape",
    type: "roll",
    targetType: "single",
    traits: [{ name: "attack" }],
    check: {
        actorStat: "strHit",
        targetStat: "athletics",
        reverseOutcome: false,
    },
    outcomes: {
        critSuccess: {
            text: "You get free and remove the grabbed, immobilized, and restrained conditions imposed by your chosen target. You can then Stride up to 5 feet.",
            effects: [
                { type: "removeCondition", condition: "grabbed", target: "activeActor" },
                { type: "removeCondition", condition: "immobilized", target: "activeActor" },
                { type: "removeCondition", condition: "restrained", target: "activeActor" },
            ]
        },
        success: {
            text: "You get free and remove the grabbed, immobilized, and restrained conditions imposed by your chosen target.",
            effects: [
                { type: "removeCondition", condition: "grabbed", target: "activeActor" },
                { type: "removeCondition", condition: "immobilized", target: "activeActor" },
                { type: "removeCondition", condition: "restrained", target: "activeActor" },
            ]
        },
        failure: {
            text: "You fail to free yourself.",
            effects: []
        },
        critFailure: {
            text: "You don't get free, and you can't attempt to Escape again until your next turn.",
            effects: []
        }
    },
    description: "You attempt to escape from being grabbed, immobilized, or restrained. Choose one creature, object, spell effect, hazard, or other impediment imposing any of those conditions on you. Attempt a check using your unarmed attack modifier against the DC of the effect. This is typically the Athletics DC of a creature grabbing you, the Thievery DC of a creature who tied you up, the spell DC for a spell effect, or the listed Escape DC of an object, hazard, or other impediment. You can attempt an Acrobatics or Athletics check instead of using your attack modifier if you choose (but this action still has the attack trait)."
};
