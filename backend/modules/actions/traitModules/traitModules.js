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
};

export const DEFAULT_MAP_PENALTY = 5;
const profileDefaults = { mapPenalty: DEFAULT_MAP_PENALTY, countsAsAttack: false, critThreshold: 20, finesse: false, ranged: false };

export const buildTraitProfile = (traits = []) => {
    const profile = { ...profileDefaults };
    traits.forEach(t => traitModules[t.name]?.resolve?.(profile, t.data));
    return profile;
};
