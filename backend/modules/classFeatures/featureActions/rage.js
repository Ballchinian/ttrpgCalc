export default {
    name: "Rage",
    type: "automatic",
    targetType: "self",
    actionCost: 1,
    //Full PF2e trait list (some inert today, kept for future interactions)
    traits: [
        { name: "barbarian" }, { name: "concentrate" }, { name: "rage" },
        { name: "emotion" }, { name: "mental" },
    ],
    //$rageDamage / $rageTempHP are resolved from the actor's classOption.config by hydrateFeatureAction.
    //The rage condition's stored value (= rage damage) drives the melee/unarmed Strike augment.
    effects: [
        { type: "addCondition", condition: "rage", target: "activeActor", adjustBy: "$rageDamage", duration: { type: "manual" } },
        { type: "tempHP", target: "activeActor", value: "$rageTempHP" },
    ],
    description: "You fly into a rage: gain temporary HP and deal extra damage on melee & unarmed Strikes. Lasts about a minute (remove the rage effect when you stop).",
};
