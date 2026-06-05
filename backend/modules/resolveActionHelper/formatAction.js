import successTable from "../../utility/successTable.js";
import likelihoodTable from "../../utility/likelihoodTable.js";
import { actionModules } from "../actions/actionModules/actionModules.js";
import { buildTraitProfile } from "../actions/traitModules/traitModules.js";
import { avgOfDice } from "../../utility/diceUtils.js";
import { MULTIPLIER_TABLE, BASIC_SAVE_MULTIPLIER_TABLE, OUTCOME_KEYS } from "../../data/outcomeDefs.js";

const SAVE_STATS = new Set(["fortitude", "reflex", "will", "perception"]);

//Stats stored as full DCs (no +10 conversion needed); everything else is a raw modifier
const FULL_DC_STATS = new Set(["ac", "dc"]);

//PF2e: raw modifiers are added to 10 to produce a DC for comparison
const MODIFIER_TO_DC_OFFSET = 10;

//Maximum number of MAP attack slots tracked (0, 1, 2)
const MAX_MAP_ATTACKS = 2;

//Faces on a standard die roll
const D20_FACES = 20;

export const formatAction = (diceMode, activeActor, targetCharacters, action) => {
    //Global actions are looked up by name string; DB actions (weapons/spells) are passed as the full object
    const module = actionModules[action.actionData] ?? action.actionData;
    const actionName = module.name ?? action.actionData?.name ?? "?";

    //For reverseOutcome: rollModifier is the roll being added, targetDC is what it's compared against
    const buildTargetList = (check, reverseOutcome, finesse, ranged) => {
        return targetCharacters.map(char => {
            const [dcOwner, dcStat, modOwner, modStat] = reverseOutcome
                ? [activeActor, check.actorStat, char, check.targetStat]
                : [char, check.targetStat, activeActor, check.actorStat];
            //Backwards compat: records saved before rename still store actorStat as "toHit"
            const effectiveModStat = modStat === "toHit" ? "strHit" : modStat;
            let dcValue = dcOwner.stats[dcStat] ?? dcOwner.stats.skills?.[dcStat] ?? 0;
            let modValue = modOwner.stats[effectiveModStat] ?? modOwner.stats.skills?.[effectiveModStat] ?? 0;
            //Guard against NaN (e.g. character saved with an empty DC field), NaN comparisons always false, making every roll a "success"
            if (!Number.isFinite(dcValue)) dcValue = 0;
            if (!Number.isFinite(modValue)) modValue = 0;
            //Modifier stats (saves, skills) need +10 to convert to DC regardless of roll direction
            if (!FULL_DC_STATS.has(dcStat)) dcValue += MODIFIER_TO_DC_OFFSET;
            //Ranged: always use dexHit; Finesse: use dexHit if it beats strHit
            if (ranged && effectiveModStat === "strHit") modValue = modOwner.stats.dexHit ?? modValue;
            else if (finesse && effectiveModStat === "strHit") modValue = Math.max(modValue, modOwner.stats.dexHit ?? 0);
            return {
                id: char.id,
                name: char.name,
                targetDC: { name: dcStat, value: dcValue, breakdown: dcOwner._breakdown?.[dcStat] ?? [] },
                rollModifier: { name: effectiveModStat, value: modValue, breakdown: modOwner._breakdown?.[effectiveModStat] ?? [] }
            };
        });
    };

    //Two distinct resolution paths depending on diceMode
    const resolveCheckedAction = (targetValueList, reverseOutcome, effectiveMod, critThreshold) => {
        return targetValueList.map(({ id, name, targetDC, rollModifier }) => {
            const base = { id, name, actionType: effectiveMod.type, targetDC, rollModifier, activeActorName: activeActor.name, actionName, reverseOutcome, basicSave: effectiveMod.basicSave ?? false };
            //chanceOfOutcome and outcomeEffects are computed for all modes so the log
            //can always render the full outcome breakdown, not just the applied result
            //Save spells (target's POV): critFailure=double, failure=full, success=half, critSuccess=0
            //Attacks (actor's POV): critSuccess=double, success=full, failure/critFailure=miss
            const multiplierTable = reverseOutcome ? BASIC_SAVE_MULTIPLIER_TABLE : MULTIPLIER_TABLE;
            const { totalAvgMultiplier, chanceOfOutcome } = likelihoodTable(targetDC.value, rollModifier.value, multiplierTable, critThreshold);
            const outcomeEffects = effectiveMod.outcomes;

            if (diceMode === "luck") {
                const diceResult = Math.floor(Math.random() * D20_FACES) + 1;
                const outcomeKey = successTable(targetDC.value, rollModifier.value, diceResult, critThreshold);
                //outcomeKey is roller's POV: for saves that's target's POV (critFailure = target failed badly = max dmg)
                //For saves: use save multiplier table. For non-save: fall back to stored multiplier or table value.
                const rawEffects = effectiveMod.outcomes[outcomeKey]?.effects ?? [];
                const effects = rawEffects.map(e => {
                    if (e.type !== "damage" && e.type !== "healing") return e;
                    const fallback = multiplierTable[outcomeKey] ?? 1;
                    const mult = (reverseOutcome || e.multiplier == null) ? fallback : e.multiplier;
                    return { ...e, multiplier: mult };
                });
                //Expected damage/healing: base 1x dice × probability-weighted multiplier
                //For saves: "failure" = 1x base; for attacks: "success" = 1x base
                const baseKey = reverseOutcome ? "failure" : "success";
                const baseEffects = effectiveMod.outcomes?.[baseKey]?.effects ?? [];
                const avgDamageEffects = baseEffects.filter(e => e.type === "damage");
                const avgHealingEffects = baseEffects.filter(e => e.type === "healing");
                const avgDamage = Math.round(avgDamageEffects.reduce((sum, e) => sum + avgOfDice(e.number, totalAvgMultiplier), 0));
                const avgHealing = avgHealingEffects.length > 0
                    ? Math.round(avgHealingEffects.reduce((sum, e) => sum + avgOfDice(e.number, totalAvgMultiplier), 0))
                    : undefined;
                return { ...base, effects, diceResult, outcomeKey, chanceOfOutcome, outcomeEffects, avgDamage, avgHealing, totalAvgMultiplier };

            } else if (diceMode === "choose") {
                //Pre-compute avg damage per outcome so frontend can apply the picked one without a round-trip
                const resolvedOutcomes = {};
                Object.entries(outcomeEffects).forEach(([key, outcomeData]) => {
                    resolvedOutcomes[key] = (outcomeData?.effects ?? []).map(e => {
                        if (e.type !== "damage" && e.type !== "healing") return e;
                        //Use the tier multiplier for saves or when no explicit multiplier is stored
                        const fallback = multiplierTable[key] ?? 1;
                        const mult = (reverseOutcome || e.multiplier == null) ? fallback : e.multiplier;
                        return { ...e, resolvedValue: avgOfDice(e.number, mult) };
                    });
                });
                return { ...base, effects: [], chanceOfOutcome, outcomeEffects, resolvedOutcomes, isChooseMode: true };

            } else {
                //Avg mode: damage uses the 1x baseline outcome (success for attacks, failure for saves)
                //so avgMultiplier scales it correctly across all outcome probabilities.
                //Conditions use the most likely outcome — a 5%-chance success shouldn't always apply its conditions.
                const baseKey = reverseOutcome ? "failure" : "success";
                const mostLikelyKey = OUTCOME_KEYS.reduce((best, key) =>
                    (chanceOfOutcome[key] ?? 0) > (chanceOfOutcome[best] ?? 0) ? key : best
                , OUTCOME_KEYS[0]);
                const damageEffects = (effectiveMod.outcomes[baseKey]?.effects ?? [])
                    .filter(e => e.type === "damage" || e.type === "healing")
                    .map(e => ({ ...e, avgMultiplier: totalAvgMultiplier }));
                const conditionEffects = (effectiveMod.outcomes[mostLikelyKey]?.effects ?? [])
                    .filter(e => e.type !== "damage" && e.type !== "healing");
                const effects = [...damageEffects, ...conditionEffects];
                return { ...base, effects, totalAvgMultiplier, chanceOfOutcome, outcomeEffects, mostLikelyKey };
            }
        });
    };

    const resolveAutomaticAction = (module) => {
        //module.effects for global actions (e.g. Stand), module.outcomes.success spells
        const effects = module.effects ?? module.outcomes?.success?.effects ?? [];
        //Self-target actions have no selected targets; fall back to a synthetic active-actor entry
        const targets = targetCharacters.length > 0 ? targetCharacters : [activeActor];
        return targets.map(({ id, name }) => ({ id, name, actionType: module.type, effects, activeActorName: activeActor.name, actionName }));
    };

    //Inject the actor's STR modifier into damage effects for melee weapons (ranged get no str bonus to damage)
    function withStrMod(mod) {
        if (!mod || module.category !== "weapon") return module;
        const patchEffects = effects => effects.map(e =>
            e.type !== "damage" ? e : { ...e, number: { ...e.number, modifier: (e.number?.modifier ?? 0) + mod } }
        );
        return {
            ...module,
            outcomes: Object.fromEntries(
                Object.entries(module.outcomes ?? {}).map(([key, outcome]) => [
                    key, { ...outcome, effects: patchEffects(outcome?.effects ?? []) }
                ])
            )
        };
    }

    //Parse "NdM" or "NdM±C" into the number object diceUtils expects
    function parseDiceString(str) {
        const m = String(str ?? "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
        if (!m) return null;
        return { numRolled: Number(m[1]), diceRolled: Number(m[2]), modifier: m[3] ? Number(m[3]) : 0 };
    }

    //Append an elemental damage effect to every outcome; multiplier=null so the
    //outcome multiplier table (2× crit, 1× hit, 0× miss) applies automatically
    function withElementalDamage(mod, elementalDamage) {
        if (!elementalDamage) return mod;
        const number = parseDiceString(elementalDamage.diceRolled);
        if (!number) return mod;
        const elementalEffect = { type: "damage", damageType: elementalDamage.element, number };
        return {
            ...mod,
            outcomes: Object.fromEntries(
                Object.entries(mod.outcomes ?? {}).map(([key, outcome]) => [
                    key, { ...outcome, effects: [...(outcome?.effects ?? []), elementalEffect] }
                ])
            )
        };
    }

    switch (module.type) {

        //Automatic actions, no roll required
        case "automatic":
            return { entries: resolveAutomaticAction(module), newMapAttacks: null };

        //All roll-based actions: weapons, most spells, and global skill/attack actions
        case "roll": {
            const check = module.check;

            //Explicit override wins; fallback: only known save stats produce a reversed roll
            const reverseOutcome = check.reverseOutcome !== undefined ? check.reverseOutcome : SAVE_STATS.has(check.targetStat);
            const { mapPenalty, countsAsAttack, critThreshold, finesse, ranged, elementalDamage } = buildTraitProfile(module.traits);
            //Melee weapons add STR mod to damage; ranged get no ability modifier to damage
            const strMod = (!ranged && module.category === "weapon") ? (activeActor.stats.str ?? 0) : 0;
            const effectiveModule = withElementalDamage(withStrMod(strMod), elementalDamage);
            let targetValueList = buildTargetList(check, reverseOutcome, finesse, ranged);
            let newMapAttacks = null;
            if (countsAsAttack) {
                const mapIndex = activeActor.mapAttacks ?? 0;
                if (mapIndex > 0) {
                    const penalty = mapIndex * mapPenalty;
                    if (reverseOutcome) {
                        //reverseOutcome=true with attack trait: actor's stat is the DC, so reduce it
                        targetValueList = targetValueList.map(t => ({
                            ...t,
                            targetDC: {
                                ...t.targetDC,
                                breakdown: [...t.targetDC.breakdown, { source: "MAP", valueChange: -penalty }],
                                value: t.targetDC.value - penalty,
                            }
                        }));
                    } else {
                        targetValueList = targetValueList.map(t => ({
                            ...t,
                            rollModifier: {
                                ...t.rollModifier,
                                breakdown: [...t.rollModifier.breakdown, { source: "MAP", valueChange: -penalty }],
                                value: t.rollModifier.value - penalty,
                            }
                        }));
                    }
                }
                newMapAttacks = Math.min(mapIndex + 1, MAX_MAP_ATTACKS);
            }

            return { entries: resolveCheckedAction(targetValueList, reverseOutcome, effectiveModule, critThreshold), newMapAttacks };
        }

        default:
            console.error("Unregistered actionType:", module.type);
            return { entries: [], newMapAttacks: null };
    }
};
