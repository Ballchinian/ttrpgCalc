import { effectModules } from "../effects/effectModules/effectModules.js";
import successTable from "../../utility/successTable.js";
import likelihoodTable from "../../utility/likelihoodTable.js";
import { avgOfDice, sumOfDiceDetailed } from "../../utility/diceUtils.js";
import { OUTCOME_KEYS, MULTIPLIER_TABLE, BASIC_SAVE_MULTIPLIER_TABLE } from "../../data/outcomeDefs.js";
import { applyDamageModifiers } from "./actionResolution.js";

const OFF_GUARD_PENALTY = 2;

//PF2e: outcomes shift by 10 across critical thresholds (e.g. roll >= DC+10 = crit success)
const CRIT_THRESHOLD_SHIFT = 10;

//Minimum base rate before dividing (avoids divide-by-zero or noisy ratios near zero)
const MIN_RATE_DIVISOR = 0.01;

//Float epsilon for detecting a meaningful probability shift between baseline and actual
const PROB_SHIFT_EPSILON = 0.001;

const CONDITION_NAMES = new Set(Object.keys(effectModules));

//Sum what conditions contribute to a breakdown side (positive = boosted, negative = penalised)
function conditionContribution(breakdown) {
    return breakdown
        .filter(b => CONDITION_NAMES.has(b.source.toLowerCase()))
        .reduce((sum, b) => sum + b.valueChange, 0);
}

//Build condition source names with level included (e.g. "frightened 3")
function conditionSourcesWithLevel(breakdown, characterEffects) {
    return [...new Set(
        breakdown
            .filter(b => CONDITION_NAMES.has(b.source.toLowerCase()))
            .map(b => {
                const eff = characterEffects.find(e => e.slug === b.source.toLowerCase());
                return eff?.value > 1 ? `${b.source} ${eff.value}` : b.source;
            })
    )];
}

//Probability-weighted damage multiplier (roller's POV probs × roller's POV multiplier table)
function expectedMultiplier(probs, multTable = MULTIPLIER_TABLE) {
    return OUTCOME_KEYS.reduce((sum, key) => sum + (probs[key] ?? 0) * (multTable[key] ?? 0), 0);
}

//Probability-weighted expected damage gain for avg/choose mode
function computeDamageGain(damageEffects, multiplierGain) {
    return Math.round(
        damageEffects.reduce((sum, e) => sum + avgOfDice(e.number, multiplierGain), 0)
    );
}

//Raw avg damage for a specific outcome using each effect's own multiplier
function rawDamageForOutcome(outcomeEffects, key) {
    const effects = (outcomeEffects?.[key]?.effects ?? []).filter(e => e.type === "damage");
    return Math.round(effects.reduce((sum, e) => sum + avgOfDice(e.number, e.multiplier ?? 1), 0));
}

//For choose mode effects is empty; pull dice expressions from outcomeEffects instead
function getDamageEffects(entry, diceMode) {
    if (diceMode !== "choose") return (entry.effects ?? []).filter(e => e.type === "damage");
    return (entry.outcomeEffects?.success?.effects ?? []).filter(e => e.type === "damage");
}

//Rate at which the actor's action "hits" (attacks: success+criticalSuccess; saves: target's failure+criticalFailure)
function successRateMultiplier(actualNorm, baselineNorm, isSave = false) {
    const hitKeys = isSave ? ["failure", "criticalFailure"] : ["success", "criticalSuccess"];
    const actualRate = hitKeys.reduce((s, k) => s + (actualNorm[k] ?? 0), 0);
    const baseRate = hitKeys.reduce((s, k) => s + (baselineNorm[k] ?? 0), 0);
    return baseRate > MIN_RATE_DIVISOR ? Math.round((actualRate / baseRate) * 100) / 100 : null;
}

//Largest circumstance penalty already in a breakdown side (positive number = size of penalty)
function worstCircumstancePenalty(breakdown) {
    return breakdown
        .filter(b => b.type === "circumstance" && b.valueChange < 0)
        .reduce((max, b) => Math.max(max, -b.valueChange), 0);
}

//Three focused analysis helpers

//Returns a conditionImpact object if conditions shifted the outcome, otherwise null
function analyzeConditionImpact(entry, isSave, dcBreakdown, modBreakdown, diceMode, targetCharacters, activeActor) {
    const dcContribution = conditionContribution(dcBreakdown);
    const modContribution = conditionContribution(modBreakdown);
    if (dcContribution === 0 && modContribution === 0) return null;

    const baselineDC = entry.targetDC.value - dcContribution;
    const baselineMod = entry.rollModifier.value - modContribution;

    //For attacks: DC owner is the target, roller is the actor
    //For saves: DC owner is the actor (spell DC), roller is the target (making their save)
    const targetChar = targetCharacters.find(c => c.id === entry.id);
    if (!targetChar) return null;
    const dcOwnerEffects = (isSave ? activeActor : targetChar)?.effects ?? [];
    const modRollerEffects = (isSave ? targetChar : activeActor)?.effects ?? [];

    const actorConditions = conditionSourcesWithLevel(isSave ? dcBreakdown : modBreakdown, isSave ? dcOwnerEffects : modRollerEffects);
    const targetConditions = conditionSourcesWithLevel(isSave ? modBreakdown : dcBreakdown, isSave ? modRollerEffects : dcOwnerEffects);
    if (actorConditions.length === 0 && targetConditions.length === 0) return null;

    const actorContrib = isSave ? dcContribution : modContribution;
    const targetContrib = isSave ? modContribution : dcContribution;
    const base = {
        targetId: entry.id, targetName: entry.name, actorName: activeActor.name,
        actorConditions, targetConditions,
        actorArrow:  actorContrib  >= 0 ? "↑" : "↓",
        targetArrow: targetContrib <= 0 ? "↑" : "↓",
    };

    //Saves use target's POV table (criticalFailure=2x); attacks use actor's POV table (criticalSuccess=2x)
    const multTable = isSave ? BASIC_SAVE_MULTIPLIER_TABLE : MULTIPLIER_TABLE;

    if (diceMode === "luck" && entry.diceResult !== undefined && entry.outcomeKey) {
        const baselineOutcome = successTable(baselineDC, baselineMod, entry.diceResult);
        if (baselineOutcome === entry.outcomeKey) return null;
        const toMult = multTable[entry.outcomeKey] ?? 0;
        const fromMult = multTable[baselineOutcome] ?? 0;
        let damageGain;
        if (toMult > 0 && entry.resolvedDamage !== undefined) {
            damageGain = Math.round(entry.resolvedDamage * (toMult - fromMult) / toMult);
        } else {
            //Use actual rolled damage when the actual outcome dealt damage; otherwise fall back to average
            damageGain = rawDamageForOutcome(entry.outcomeEffects, entry.outcomeKey) - rawDamageForOutcome(entry.outcomeEffects, baselineOutcome);
        }
        //outcomeKey is already roller's POV (target's POV for saves) — use directly as display keys
        return { ...base, from: baselineOutcome, to: entry.outcomeKey, damageGain };
    }

    if (diceMode === "avg" || diceMode === "choose") {
        const damageEffects = getDamageEffects(entry, diceMode);
        const { chanceOfOutcome: baselineNorm } = likelihoodTable(baselineDC, baselineMod, multTable);
        //chanceOfOutcome is roller's POV (target's POV for saves, actor's POV for attacks)
        const actualNorm = entry.chanceOfOutcome ?? {};
        const anyShift = OUTCOME_KEYS.some(key => Math.abs((actualNorm[key] ?? 0) - (baselineNorm[key] ?? 0)) > PROB_SHIFT_EPSILON);
        if (!anyShift) return null;
        return {
            ...base,
            hitMultiplier: successRateMultiplier(actualNorm, baselineNorm, isSave),
            damageGain: computeDamageGain(damageEffects, expectedMultiplier(actualNorm, multTable) - expectedMultiplier(baselineNorm, multTable)),
        };
    }

    return null;
}

//Per-condition isolated impact — returns [{ conditionName, damageGain }] for session breakdown
function analyzePerConditionImpacts(entry, isSave, dcBreakdown, modBreakdown, diceMode, targetChar) {
    const multTable = isSave ? BASIC_SAVE_MULTIPLIER_TABLE : MULTIPLIER_TABLE;
    const damageEffects = getDamageEffects(entry, diceMode);

    //Collect each unique condition's total contribution to DC and mod
    const condMap = new Map();
    for (const b of dcBreakdown) {
        if (!CONDITION_NAMES.has(b.source.toLowerCase())) continue;
        const name = b.source.toLowerCase();
        if (!condMap.has(name)) condMap.set(name, { dcTotal: 0, modTotal: 0 });
        condMap.get(name).dcTotal += b.valueChange;
    }
    for (const b of modBreakdown) {
        if (!CONDITION_NAMES.has(b.source.toLowerCase())) continue;
        const name = b.source.toLowerCase();
        if (!condMap.has(name)) condMap.set(name, { dcTotal: 0, modTotal: 0 });
        condMap.get(name).modTotal += b.valueChange;
    }
    if (condMap.size === 0) return [];

    const results = [];
    for (const [condName, { dcTotal, modTotal }] of condMap.entries()) {
        const withoutDC = entry.targetDC.value - dcTotal;
        const withoutMod = entry.rollModifier.value - modTotal;

        if (diceMode === "luck" && entry.diceResult !== undefined && entry.outcomeKey) {
            const withoutOutcome = successTable(withoutDC, withoutMod, entry.diceResult);
            if (withoutOutcome === entry.outcomeKey) continue;
            const toMult = multTable[entry.outcomeKey] ?? 0;
            const fromMult = multTable[withoutOutcome] ?? 0;
            let damageGain;
            if (toMult > 0 && entry.resolvedDamage !== undefined) {
                damageGain = Math.round(entry.resolvedDamage * (toMult - fromMult) / toMult);
            } else {
                damageGain = rawDamageForOutcome(entry.outcomeEffects, entry.outcomeKey) - rawDamageForOutcome(entry.outcomeEffects, withoutOutcome);
            }
            if (damageGain === 0) continue;
            results.push({ conditionName: condName, damageGain });
        } else if (diceMode === "avg" || diceMode === "choose") {
            const { chanceOfOutcome: withoutNorm } = likelihoodTable(withoutDC, withoutMod, multTable);
            const actualNorm = entry.chanceOfOutcome ?? {};
            const anyShift = OUTCOME_KEYS.some(k => Math.abs((actualNorm[k] ?? 0) - (withoutNorm[k] ?? 0)) > PROB_SHIFT_EPSILON);
            if (!anyShift) continue;
            const actualMult = expectedMultiplier(actualNorm, multTable);
            const withoutMult = expectedMultiplier(withoutNorm, multTable);
            let damageGain;
            if (targetChar) {
                damageGain = Math.round(damageEffects.reduce((sum, e) => {
                    const rawWith = avgOfDice(e.number, actualMult);
                    const rawWithout = avgOfDice(e.number, withoutMult);
                    return sum + applyDamageModifiers(rawWith, e.damageType, targetChar) - applyDamageModifiers(rawWithout, e.damageType, targetChar);
                }, 0));
            } else {
                damageGain = computeDamageGain(damageEffects, actualMult - withoutMult);
            }
            if (Math.abs(damageGain) < 1) continue;
            results.push({ conditionName: condName, damageGain });
        }
    }
    return results;
}

//Returns { offGuardBenefit, impact }, impact is null when off-guard wouldn't change the result
function analyzeOffGuardImpact(entry, isSave, dcBreakdown, diceMode, activeActorName, targetChar) {
    //Off-guard only affects AC, spell saves (reverseOutcome) use Will/Fort/Reflex, skip entirely
    if (isSave) return { offGuardBenefit: 0, impact: null };
    //Target already has off-guard (or prone/any offGuard:true effect) — hypothesis is moot
    if (targetChar?.effects?.some(e => effectModules[e.slug]?.offGuard === true)) {
        return { offGuardBenefit: 0, impact: null };
    }
    //Clamp by any existing circumstance penalty already on AC to avoid double-counting
    const existingPenalty = worstCircumstancePenalty(dcBreakdown);
    const offGuardBenefit = Math.max(0, OFF_GUARD_PENALTY - existingPenalty);
    if (offGuardBenefit === 0) return { offGuardBenefit: 0, impact: null };

    const offGuardDC = entry.targetDC.value - offGuardBenefit;
    const base = { targetId: entry.id, targetName: entry.name, actorName: activeActorName };

    if (diceMode === "luck" && entry.diceResult !== undefined && entry.outcomeKey) {
        const ogOutcome = successTable(offGuardDC, entry.rollModifier.value, entry.diceResult);
        if (ogOutcome === entry.outcomeKey) return { offGuardBenefit, impact: null };
        const fromMult = MULTIPLIER_TABLE[entry.outcomeKey] ?? 0;
        const toMult = MULTIPLIER_TABLE[ogOutcome] ?? 0;
        let damageGain, damageGainTooltip;
        if (fromMult > 0 && entry.resolvedDamage !== undefined) {
            //Use actual rolled damage when fromMult > 0 (attack connected)
            damageGain = Math.round(entry.resolvedDamage * (toMult - fromMult) / fromMult);
            damageGainTooltip = `${entry.resolvedDamage} actual dmg × (×${toMult} − ×${fromMult}) / ×${fromMult} = ${damageGain}`;
        } else {
            //Miss → upgraded outcome: roll hypothetical damage applying the tier multiplier to
            //null-multiplier effects (elemental traits use null so the tier table governs, same
            //as resolveCheckedAction does — without this, elemental dice show at 1× on a failure)
            const fallbackMult = MULTIPLIER_TABLE[ogOutcome] ?? 0;
            const ogEffects = (entry.outcomeEffects?.[ogOutcome]?.effects ?? []).filter(e => e.type === "damage");
            const tooltipParts = [];
            damageGain = 0;
            for (const e of ogEffects) {
                const mult = (entry.reverseOutcome || e.multiplier == null) ? fallbackMult : e.multiplier;
                if (mult === 0) continue;
                const { total, rolls, bonusRolls, modifier, multiplier } = sumOfDiceDetailed(e.number, mult);
                //Apply target's resistances/weaknesses/immunities to the hypothetical rolled damage
                const modifiedTotal = targetChar ? applyDamageModifiers(total, e.damageType, targetChar) : total;
                damageGain += modifiedTotal;
                const rollSum = rolls.reduce((s, r) => s + r, 0) + bonusRolls.reduce((s, r) => s + r, 0);
                let expr = `${e.number.numRolled}d${e.number.diceRolled} [${rolls.join(", ")}]`;
                if (bonusRolls.length > 0) expr += ` + [${bonusRolls.join(", ")}]`;
                if (modifier > 0) expr += ` + ${modifier}`;
                else if (modifier < 0) expr += ` ${modifier}`;
                if (multiplier !== 1) expr += ` = ${rollSum + modifier} ×${multiplier} = ${modifiedTotal}`;
                else expr += ` = ${modifiedTotal}`;
                tooltipParts.push(expr);
            }
            damageGainTooltip = tooltipParts.length > 0 ? tooltipParts.join(" | ") : null;
        }
        return { offGuardBenefit, impact: { ...base, from: entry.outcomeKey, to: ogOutcome, damageGain, damageGainTooltip } };
    }

    if (diceMode === "avg" || diceMode === "choose") {
        const damageEffects = getDamageEffects(entry, diceMode);
        //chanceOfOutcome is actor-POV; isSave=false branch so toActorPov would be a no-op anyway
        const actualNorm = entry.chanceOfOutcome ?? {};
        const { chanceOfOutcome: ogChance } = likelihoodTable(offGuardDC, entry.rollModifier.value, MULTIPLIER_TABLE);
        const ogMult = expectedMultiplier(ogChance);
        const actualMult = expectedMultiplier(actualNorm);
        let damageGain;
        if (targetChar) {
            //Resistance-aware: compute gain per damage type separately so immunity/resistance clamps correctly
            damageGain = Math.round(damageEffects.reduce((sum, e) => {
                const rawWithOG = avgOfDice(e.number, ogMult);
                const rawWithout = avgOfDice(e.number, actualMult);
                return sum + applyDamageModifiers(rawWithOG, e.damageType, targetChar) - applyDamageModifiers(rawWithout, e.damageType, targetChar);
            }, 0));
        } else {
            damageGain = computeDamageGain(damageEffects, ogMult - actualMult);
        }
        const hitMultiplier = successRateMultiplier(ogChance, actualNorm);
        //Always record the impact if off-guard would reduce AC, small gains that round to 0 are still real
        return { offGuardBenefit, impact: { ...base, hitMultiplier, damageGain } };
    }

    return { offGuardBenefit, impact: null };
}

//Collects per-damage-type modifier info from effects that have _damageModifiers set
function buildDmgModifierInfo(effects) {
    const map = {};
    (effects ?? []).forEach(eff => {
        if (eff.type !== "damage" || !eff.damageType || !eff._damageModifiers?.length) return;
        const key = eff.damageType.toLowerCase();
        if (!map[key]) map[key] = { damageType: eff.damageType, mods: [] };
        map[key].mods.push(...eff._damageModifiers);
    });
    return Object.values(map);
}

//Builds a hover tooltip string from effects of a given type that have dice roll data (luck mode only)
function buildEffectTooltip(effects, type) {
    const matching = (effects ?? []).filter(e => e.type === type && e._diceRolls);
    if (matching.length === 0) return null;
    return matching.map(e => {
        const rolls = e._diceRolls;
        const bonusRolls = e._bonusRolls ?? [];
        const mod = e._diceModifier ?? 0;
        const mul = e._diceMultiplier ?? 1;
        const rollSum = rolls.reduce((s, r) => s + r, 0);
        const bonusSum = bonusRolls.reduce((s, r) => s + r, 0);
        const preTotal = rollSum + bonusSum + mod;
        const total = Math.max(0, Math.floor(preTotal * mul));
        //Use only the dice portion (no modifier) so the modifier appears once after the rolls
        const bonusDiceStr = e.number.bonusDice ? `+${e.number.bonusDice.numRolled}d${e.number.bonusDice.diceRolled}` : "";
        let expr = `${e.number.numRolled}d${e.number.diceRolled}${bonusDiceStr} [${rolls.join(", ")}]`;
        if (bonusRolls.length > 0) expr += ` + [${bonusRolls.join(", ")}]`;
        if (mod > 0) expr += ` + ${mod}`;
        if (mod < 0) expr += ` ${mod}`;
        if (mul !== 1) expr += ` = ${preTotal} ×${mul} = ${total}`;
        else           expr += ` = ${total}`;
        return expr;
    }).join(" | ");
}

//Builds the rollOutcome summary: outcome key, dice result, thresholds, MAP, and off-guard benefit
function buildRollOutcome(entry, isSave, modBreakdown, offGuardBenefit) {
    //For avg/choose, find the most likely outcome; chanceOfOutcome is roller's POV, use it directly
    //undefined when a real dice result already exists (luck mode)
    let avgOutcomeKey;
    if (entry.outcomeKey === undefined) {
        const probs = entry.chanceOfOutcome ?? {};
        avgOutcomeKey = OUTCOME_KEYS.reduce((b, key) => (probs[key] ?? 0) > (probs[b] ?? 0) ? key : b);
    }
    //cf/f are the maximum die faces for that tier; s/cs are the minimum — all display as ≤ or ≥ respectively
    const threshold = entry.targetDC.value - entry.rollModifier.value;
    const thresholds = { cf: threshold - CRIT_THRESHOLD_SHIFT, f: threshold - 1, s: threshold, cs: threshold + CRIT_THRESHOLD_SHIFT };
    const mapEntry = modBreakdown.find(b => b.source === "MAP");
    const mapPenalty = mapEntry ? Math.abs(mapEntry.valueChange) : 0;
    const diceTooltip = buildEffectTooltip(entry.effects, "damage");
    const healingTooltip = buildEffectTooltip(entry.effects, "healing");
    //outcomeKey is already roller's POV (target's POV for saves) — no flip needed
    return { outcomeKey: entry.outcomeKey, diceResult: entry.diceResult, avgOutcomeKey, thresholds, offGuardBenefit: isSave ? 0 : offGuardBenefit, mapPenalty, isSave, diceTooltip, healingTooltip, avgDamage: entry.avgDamage, avgHealing: entry.avgHealing };
}

//Main export

//Returns { [targetId]: { conditionImpacts, offGuardImpacts, rollOutcome } }
export function collectStats(actionInfo, diceMode, targetCharacters = [], activeActor = null) {
    const byTarget = {};
    const ensure = id => {
        if (!byTarget[id]) byTarget[id] = { conditionImpacts: [], offGuardImpacts: [], perConditionImpacts: [], rollOutcome: null, rawDamage: 0, rawHealing: 0, diceTooltip: null, healingTooltip: null };
        return byTarget[id];
    };

    for (const entry of actionInfo) {
        //rawDamage/rawHealing and dice tooltips accumulate for ALL entry types (roll AND automatic)
        if (entry.id) {
            const tgt = ensure(entry.id);
            tgt.rawDamage += entry.rawDamage ?? 0;
            tgt.rawHealing += entry.rawHealing ?? 0;
            const dt = buildEffectTooltip(entry.effects, "damage");
            if (dt) tgt.diceTooltip = tgt.diceTooltip ? `${tgt.diceTooltip} | ${dt}` : dt;
            const ht = buildEffectTooltip(entry.effects, "healing");
            if (ht) tgt.healingTooltip = tgt.healingTooltip ? `${tgt.healingTooltip} | ${ht}` : ht;
            const dmgMods = buildDmgModifierInfo(entry.effects);
            if (dmgMods.length > 0) tgt.dmgModifierInfo = dmgMods;
        }

        if (entry.actionType !== "roll") continue;

        const tgt = ensure(entry.id);
        const isSave = entry.reverseOutcome ?? (entry.targetDC?.name !== "ac");
        const dcBreakdown = entry.targetDC?.breakdown ?? [];
        const modBreakdown = entry.rollModifier?.breakdown ?? [];

        const condImpact = analyzeConditionImpact(entry, isSave, dcBreakdown, modBreakdown, diceMode, targetCharacters, activeActor);
        if (condImpact) tgt.conditionImpacts.push(condImpact);

        const targetChar = targetCharacters.find(c => c.id === entry.id);
        const perCond = analyzePerConditionImpacts(entry, isSave, dcBreakdown, modBreakdown, diceMode, targetChar);
        if (perCond.length > 0) tgt.perConditionImpacts.push(...perCond);

        const { offGuardBenefit, impact: ogImpact } = analyzeOffGuardImpact(entry, isSave, dcBreakdown, diceMode, activeActor?.name, targetChar);
        if (ogImpact) tgt.offGuardImpacts.push(ogImpact);

        tgt.rollOutcome = buildRollOutcome(entry, isSave, modBreakdown, offGuardBenefit);
    }

    return byTarget;
}
