//Investigator action: devise a stratagem so your next Strike gains Strategic Strike precision damage
//(the `devised` effect, whose value = the number of d6). Remove `devised` after the Strike (auto-consume
//on Strike is a future refinement).
export default {
    name: "Devise a Stratagem",
    type: "automatic",
    targetType: "self",
    actionCost: 1,
    traits: [{ name: "concentrate" }, { name: "investigator" }],
    effects: [
        { type: "addCondition", condition: "devised", target: "activeActor", adjustBy: "$strategicDice", duration: { type: "manual" } },
    ],
    description: "You devise a stratagem: your next Strike gains Strategic Strike precision damage. Remove the 'devised' effect after the Strike.",
};
