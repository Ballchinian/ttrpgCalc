import { DAMAGE_TYPES, ELEMENTAL_DAMAGE_TYPES } from "../../../data/damageTypes.js";

export const traitModules = {
    attack: {
        label: "Attack",
        render: null,
        effects: { countsAsAttack: true },
        resolve: (profile) => { profile.countsAsAttack = true; },
    },
    agile: {
        label: "Agile",
        render: null,
        effects: { mapPenalty: 4 },
        resolve: (profile) => { profile.mapPenalty = 4; },
    },
    finesse: {
        label: "Finesse",
        render: null,
        effects: { finesse: true },
        resolve: (profile) => { profile.finesse = true; },
    },
    ranged: {
        label: "Ranged",
        render: null,
        effects: { ranged: true },
        resolve: (profile) => { profile.ranged = true; },
    },
    heavy: {
        label: "Heavy",
        render: null,
        effects: { heavy: true },
        resolve: (profile) => { profile.heavy = true; },
    },
    light: {
        label: "Light",
        render: null,
        effects: { light: true },
        resolve: (profile) => { profile.light = true; },
    },
    reach: {
        label: "Reach",
        render: null,
        effects: { reach: true },
        resolve: (profile) => { profile.reach = true; },
    },
    //Marker traits used by condition interactions (e.g. grabbed forces a flat check on manipulate actions).
    //No effect on the action's own profile; the interaction lives on the condition (see classFeatures-style
    //traitFlatCheck on effect modules).
    manipulate: {
        label: "Manipulate",
        render: null,
        effects: {},
        resolve: () => {},
    },
    concentrate: {
        label: "Concentrate",
        render: null,
        effects: {},
        resolve: () => {},
    },
    //Marker traits (no profile effect) - let condition/effect interactions match on actions and surface
    //in the trait editors. The frontend trait catalog (traitCatalog.js) adds many more inert names.
    barbarian: { label: "Barbarian", render: null, effects: {}, resolve: () => {} },
    emotion:   { label: "Emotion",   render: null, effects: {}, resolve: () => {} },
    mental:    { label: "Mental",    render: null, effects: {}, resolve: () => {} },
    rage:      { label: "Rage",      render: null, effects: {}, resolve: () => {} },
    stance:    { label: "Stance",    render: null, effects: {}, resolve: () => {} },
    flourish:  { label: "Flourish",  render: null, effects: {}, resolve: () => {} },
    versatile: {
        label: "Versatile",
        render: { fields: [
            { key: "damageType", type: "select", label: "Alternate Damage Type", options: DAMAGE_TYPES }
        ]},
        effects: {},
        resolve: (profile, data) => { if (data?.damageType) profile.versatileDamageType = data.damageType; },
    },
    elementalDamage: {
        label: "Elemental Damage",
        render: { fields: [
            { key: "element", type: "select", label: "Element", options: ELEMENTAL_DAMAGE_TYPES },
            { key: "diceRolled", type: "text", label: "Damage Die", placeholder: "e.g. 1d6", validateAs: "dmgDie" }
        ]},
        effects: {},
        resolve: (profile, data) => { if (data?.element) profile.elementalDamage = data; },
    },
    keen: {
        label: "Keen",
        render: { fields: [
            { key: "threshold", type: "number", label: "Crit Threshold", min: 15, max: 20 }
        ]},
        effects: {},
        //profileDefaults.critThreshold = 20 is the authoritative fallback: only override when a value was stored
        resolve: (profile, data) => { if (data?.threshold != null) profile.critThreshold = data.threshold; },
    },
    //Die-valued weapon traits. PF2e writes these as a die size (e.g. "deadly d8"); the editor must prompt
    //for that die. They're inert here (no resolve effect - crit-damage maths isn't modelled yet) but carry
    //their die in trait.data so it's stored and shown, and so future mechanics can read it.
    deadly: {
        label: "Deadly",
        render: { fields: [{ key: "die", type: "select", label: "Deadly Die", options: ["d6", "d8", "d10", "d12"] }] },
        effects: {},
        resolve: () => {},
    },
    fatal: {
        label: "Fatal",
        render: { fields: [{ key: "die", type: "select", label: "Fatal Die", options: ["d8", "d10", "d12"] }] },
        effects: {},
        resolve: () => {},
    },
    "fatal-aim": {
        label: "Fatal Aim",
        render: { fields: [{ key: "die", type: "select", label: "Fatal Die", options: ["d8", "d10", "d12"] }] },
        effects: {},
        resolve: () => {},
    },
    "two-hand": {
        label: "Two-Hand",
        render: { fields: [{ key: "die", type: "select", label: "Two-Handed Die", options: ["d6", "d8", "d10", "d12"] }] },
        effects: {},
        resolve: () => {},
    },
    jousting: {
        label: "Jousting",
        render: { fields: [{ key: "die", type: "select", label: "Jousting Die", options: ["d6", "d8"] }] },
        effects: {},
        resolve: () => {},
    },
};

export const DEFAULT_MAP_PENALTY = 5;
const profileDefaults = { mapPenalty: DEFAULT_MAP_PENALTY, countsAsAttack: false, critThreshold: 20, finesse: false, ranged: false };

export const buildTraitProfile = (traits = []) => {
    const profile = { ...profileDefaults };
    traits.forEach(t => traitModules[t.name]?.resolve?.(profile, t.data));
    return profile;
};
