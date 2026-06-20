//Ranger action: designate a creature as your hunted prey. With the Precision hunter's edge, you deal
//extra damage on the first Strike each turn against it (the ranger's `precisionEdge` autoRider).
export default {
    name: "Hunt Prey",
    type: "automatic",
    targetType: "single",
    actionCost: 1,
    traits: [{ name: "concentrate" }, { name: "ranger" }],
    effects: [
        { type: "addCondition", condition: "hunted-prey", target: "targetCharacters", duration: { type: "manual" } },
    ],
    description: "You designate a creature as your hunted prey. With the Precision edge you deal extra damage on the first Strike each turn against it.",
};
