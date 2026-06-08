import { effectModules } from "../effects/effectModules/effectModules.js";
import STAT_EXPANSIONS from "../effects/statExpansions.js";
import { addToStat } from "../../utility/statAccess.js";

//Builds { statName: { bonusType: { add, subtract, addSource, subtractSource } } },
//then flattens to { statName: { add, subtract } }
//Also builds a breakdown map { statName: [{ source, valueChange }] } for tooltip display
const resolveEffects = (character, newBonuses) => {
    const statBonusMap = {};

    //From manual bonuses entered on the frontend
    Object.entries(newBonuses).forEach(([statName, bonusTypes]) => {
        statBonusMap[statName] = {};
        Object.entries(bonusTypes).forEach(([bonusType, value]) => {
            statBonusMap[statName][bonusType] = {
                add: Math.max(0, value),
                subtract: Math.max(0, -value),
                addSource: value > 0 ? `${bonusType} bonus` : null,
                subtractSource: value < 0 ? `${bonusType} penalty` : null,
            };
        });
    });

    //Apply effects, keeping highest add and highest subtract per bonusType (same type doesn't stack)
    for (const effect of character.effects || []) {
        const statModifier = effectModules[effect.slug?.toLowerCase()]?.statModifier;
        if (!statModifier) continue;

        //Expand any shorthand keys (e.g. "checks", "dexDcs") to real stat names
        const affectedStats = [...new Set(
            statModifier.affectedStats.flatMap(key => STAT_EXPANSIONS[key] ?? [key])
        )];
        const { bonusType, operation } = statModifier;
        //fixedValue overrides effect.value so binary conditions (maxLevel:1) can still apply a value != 1
        const number = statModifier.fixedValue ?? effect.value;

        affectedStats.forEach(statName => {
            if (!statBonusMap[statName]) statBonusMap[statName] = {};
            if (!statBonusMap[statName][bonusType]) {
                statBonusMap[statName][bonusType] = { add: 0, subtract: 0, addSource: null, subtractSource: null };
            }
            const entry = statBonusMap[statName][bonusType];
            if (operation === "add" && number > entry.add) { entry.add = number; entry.addSource = effect.slug; }
            else if (operation === "subtract" && number > entry.subtract) { entry.subtract = number; entry.subtractSource = effect.slug; }
        });
    }

    //Flatten, different bonusTypes stack, so sum across them per statName
    const result = {};
    const breakdown = {};
    Object.entries(statBonusMap).forEach(([statName, bonusTypes]) => {
        result[statName] = { add: 0, subtract: 0 };
        const breakdownEntry = [];
        Object.entries(bonusTypes).forEach(([bonusType, { add, subtract, addSource, subtractSource }]) => {
            result[statName].add += add;
            result[statName].subtract += subtract;
            if (add > 0 && addSource) breakdownEntry.push({ source: addSource, valueChange: add, type: bonusType });
            if (subtract > 0 && subtractSource) breakdownEntry.push({ source: subtractSource, valueChange: -subtract, type: bonusType });
        });
        if (breakdownEntry.length) breakdown[statName] = breakdownEntry;
    });

    return { result, breakdown };
};

//Flatten nested offensive bonus structure into stat-keyed bonus objects
//weapon.attack applies to both strHit and dexHit (generic weapon bonus)
//dc.attack applies to the dc stat (spell attack modifier bonus)
function destructureOffensiveBonuses(bonuses) {
    const transformedBonuses = { ...bonuses };
    if (transformedBonuses.weapon?.attack) {
        transformedBonuses.strHit = { ...transformedBonuses.strHit, ...transformedBonuses.weapon.attack };
        transformedBonuses.dexHit = { ...transformedBonuses.dexHit, ...transformedBonuses.weapon.attack };
        delete transformedBonuses.weapon;
    }
    if (transformedBonuses.dc?.attack) {
        //Only spread numeric bonus types; dc.damage is a nested object and must not enter the flat map
        const { attack, damage: _discardedDamage, ...rest } = transformedBonuses.dc;
        transformedBonuses.dc = { ...rest, ...attack };
    }
    return transformedBonuses;
}

export default function applyStatChanges(bonuses, character) {
    const { result, breakdown } = resolveEffects(character, destructureOffensiveBonuses(bonuses));
    //Clone the namespaced groups so deltas don't mutate the original character's stats
    const src = character.stats ?? {};
    const stats = {
        ...src,
        attributes: { ...(src.attributes ?? {}) },
        saves: { ...(src.saves ?? {}) },
        skills: { ...(src.skills ?? {}) },
    };

    for (const [statName, { add, subtract }] of Object.entries(result)) {
        addToStat(stats, statName, add - subtract);
    }

    return { ...character, stats, _breakdown: breakdown };
}
