import { effectModules } from "../effects/effectModules/effectModules.js";
import { sumOfDice, avgOfDice } from "../../utility/diceUtils.js";

//PF2e priority: immunity beats resistance, weakness stacks on top of resistance
export function applyDamageModifiers(rawDamage, damageType, char) {
    if (!damageType || rawDamage <= 0) return rawDamage;
    const type = damageType.toLowerCase();
    if ((char.immunities ?? []).some(i => i.toLowerCase() === type)) return 0;
    const res = (char.resistances ?? []).find(r => r.damageType.toLowerCase() === type);
    const wk = (char.weaknesses ?? []).find(w => w.damageType.toLowerCase() === type);
    //PF2e applies weakness then resistance, clamping the total at 0 only at the end —
    //so heavy resistance can fully cancel a weakened hit (clamping mid-way would over-count).
    let damage = rawDamage;
    if (wk) damage += wk.value;
    if (res) damage -= res.value;
    return Math.max(0, damage);
}

//Returns modifier entries that were applied, for display in the damage type chip
export function getDamageModInfo(rawDamage, damageType, char) {
    if (!damageType || rawDamage <= 0) return [];
    const type = damageType.toLowerCase();
    if ((char.immunities ?? []).some(i => i.toLowerCase() === type)) {
        return [{ kind: "immunity", delta: -rawDamage }];
    }
    const res = (char.resistances ?? []).find(r => r.damageType.toLowerCase() === type);
    const wk = (char.weaknesses ?? []).find(w => w.damageType.toLowerCase() === type);
    const mods = [];
    if (res) mods.push({ kind: "resistance", value: res.value, delta: -Math.min(rawDamage, res.value) });
    if (wk) mods.push({ kind: "weakness", value: wk.value, delta: wk.value });
    return mods;
}

//PF2e condition hierarchy: keys cover the listed conditions (less severe and redundant)
const CONDITION_COVERS = {
    restrained: ["grabbed", "immobilized"],
    grabbed: ["immobilized"],
};

//True if a more-severe condition already makes `name` redundant
function isCoveredByHigher(name, effects) {
    return Object.entries(CONDITION_COVERS).some(
        ([superior, covered]) => covered.includes(name) && effects.some(e => e.slug === superior)
    );
}

//Names of conditions superseded (and removed) when `name` is applied
const supersededBy = name => CONDITION_COVERS[name] ?? [];

export const damageResolution = (characters, actionInfo) => {
    return characters.map(character => {
        const raw = actionInfo.avgMultiplier !== undefined
            ? avgOfDice(actionInfo.number, actionInfo.avgMultiplier)
            : sumOfDice(actionInfo.number, actionInfo.multiplier);
        const damage = applyDamageModifiers(raw, actionInfo.damageType, character);
        return { ...character, stats: { ...character.stats, currentHealth: Math.max(0, character.stats.currentHealth - damage) } };
    });
};

export const healingResolution = (characters, actionInfo) => {
    return characters.map(character => {
        const healing = actionInfo.avgMultiplier !== undefined
            ? avgOfDice(actionInfo.number, actionInfo.avgMultiplier)
            : sumOfDice(actionInfo.number, actionInfo.multiplier);
        const maxHealth = character.stats.maxHealth ?? character.stats.attributes?.hp ?? 0;
        return { ...character, stats: { ...character.stats, currentHealth: Math.min(maxHealth, Math.max(0, character.stats.currentHealth + healing)) } };
    });
};

export const conditionResolution = (characters, actionInfo) => {
    if (!actionInfo.condition || typeof actionInfo.condition !== "string") {
        console.error("conditionResolution: missing or invalid condition name", actionInfo);
        return characters;
    }
    return characters.map(character => {
        const actionName = actionInfo.condition.toLowerCase();
        const mod = effectModules[actionName];
        const rawLevel = actionInfo.adjustBy ?? 1;
        //Clamp to maxLevel if the module defines a numeric cap
        const condLevel = (mod?.maxLevel != null && mod.maxLevel !== "infinite")
            ? Math.min(rawLevel, mod.maxLevel)
            : rawLevel;
        //Prefer the action's own duration over the module default
        const duration = actionInfo.duration ?? mod?.defaultDuration ?? { type: "manual" };

        let effects = character.effects ?? [];
        if (actionInfo.type === "addCondition") {
            //Skip if a more severe condition already covers this one
            if (isCoveredByHigher(actionName, effects)) return character;
            //Remove less-severe conditions that this one supersedes
            const toRemove = new Set(supersededBy(actionName));
            if (toRemove.size) effects = effects.filter(e => !toRemove.has(e.slug));

            const existingEffect = effects.find(e => e.slug === actionName);
            if (existingEffect) {
                //Apply highest level; always refresh duration (PF2e: reapplication refreshes duration)
                const newLevel = Math.max(existingEffect.value, condLevel);
                effects = effects.map(e => e.slug === actionName ? { ...e, value: newLevel, duration } : e);
            } else {
                if (!mod) {
                    console.error(`Unknown effect module: ${actionName}`);
                    return { ...character, effects };
                }
                effects = [...effects, { slug: actionName, value: condLevel, description: mod.description, duration }];
            }
        } else {
            effects = effects.filter(e => e.slug !== actionName);
        }
        return { ...character, effects };
    });
};
