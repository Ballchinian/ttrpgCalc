//Magus action: enter the Arcane Cascade stance, applying the `arcane-cascade` effect (extra Strike
//damage). Remove the stance effect when you leave it.
export default {
    name: "Arcane Cascade",
    type: "automatic",
    targetType: "self",
    actionCost: 1,
    traits: [{ name: "concentrate" }, { name: "magus" }, { name: "stance" }],
    effects: [
        { type: "addCondition", condition: "arcane-cascade", target: "activeActor", adjustBy: "$cascadeDamage", duration: { type: "manual" } },
    ],
    description: "You enter an arcane cascade stance: your Strikes deal extra damage. Remove the stance when you leave it.",
};
