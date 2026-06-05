export default {
    name: "Stand",
    type: "automatic",
    targetType: "self",
    traits: [],
    effects: [
        { type: "removeCondition", condition: "prone", target: "activeActor" }
    ],
    description: "You stand up from being prone."
};
