
//Critical specialization definitions for the frontend: tooltip text + how the effect is resolved.
//`kind` drives behaviour:
//  "auto"           — backend injects the effect on a crit; nothing to do here.
//  "info"           — narrative forced movement; tooltip only, no mechanical effect.
//  "save"           — target rolls `save` vs the attacker's class DC; on a failure apply `condition`.
//                     Resolved by the NichePrompt system (luck rolls, avg computes, choose asks the user).
//  "adjacentDamage" — choose an adjacent creature that takes the weapon's damage dice (axe).
export const CRIT_SPEC_DEFS = {
    axe: {
        description: "Choose one creature adjacent to the target and within your reach. If its AC is lower than your attack roll for the critical hit, it takes damage equal to the weapon damage dice you rolled (not doubled, no bonuses). A prompt appears after a critical hit.",
        kind: "adjacentDamage",
    },
    bow: {
        description: "If the target is adjacent to a surface, the missile pins it there: it becomes immobilized until it Interacts to succeed at a DC 10 Athletics check. Auto-applied — remove manually if the target isn't against a surface.",
        kind: "auto",
    },
    brawling: {
        description: "The target must succeed at a Fortitude save against your class DC or be slowed 1 until the end of your next turn. A prompt appears after a critical hit.",
        kind: "save", save: "fortitude", condition: "slowed", value: 1, conditionLabel: "slowed 1", duration: { type: "endOfNextTurn" },
    },
    club: {
        description: "You knock the target up to 10 feet away from you (forced movement). Apply manually.",
        kind: "info",
    },
    crossbow: {
        description: "The bolt lodges in the target, dealing 1d8 persistent bleed damage. Auto-applied.",
        kind: "auto",
    },
    dart: {
        description: "The dart lodges in the target, dealing 1d6 persistent bleed damage. Auto-applied.",
        kind: "auto",
    },
    firearm: {
        description: "The target must succeed at a Fortitude save against your class DC or be stunned 1. A prompt appears after a critical hit.",
        kind: "save", save: "fortitude", condition: "stunned", value: 1, conditionLabel: "stunned 1", duration: { type: "manual" },
    },
    flail: {
        description: "The target is knocked prone unless it succeeds at a Reflex save against your class DC. A prompt appears after a critical hit.",
        kind: "save", save: "reflex", condition: "prone", conditionLabel: "prone", duration: { type: "manual" },
    },
    hammer: {
        description: "The target is knocked prone unless it succeeds at a Fortitude save against your class DC. A prompt appears after a critical hit.",
        kind: "save", save: "fortitude", condition: "prone", conditionLabel: "prone", duration: { type: "manual" },
    },
    knife: {
        description: "The target takes 1d6 persistent bleed damage. Auto-applied.",
        kind: "auto",
    },
    pick: {
        description: "The weapon viciously pierces the target, dealing 2 additional damage per weapon damage die. Auto-applied.",
        kind: "auto",
    },
    polearm: {
        description: "The target is moved 5 feet in a direction of your choice (forced movement). Apply manually.",
        kind: "info",
    },
    shield: {
        description: "You knock the target back 5 feet (forced movement). Apply manually.",
        kind: "info",
    },
    sling: {
        description: "The target must succeed at a Fortitude save against your class DC or be stunned 1. A prompt appears after a critical hit.",
        kind: "save", save: "fortitude", condition: "stunned", value: 1, conditionLabel: "stunned 1", duration: { type: "manual" },
    },
    spear: {
        description: "The weapon pierces the target, weakening its attacks: it becomes clumsy 1 until the start of your next turn. Auto-applied.",
        kind: "auto",
    },
    sword: {
        description: "The target is made off-balance, becoming off-guard until the start of your next turn. Auto-applied.",
        kind: "auto",
    },
};
