import { getGrantForAction, getStrikeRider, getAutoRiders, weaponMatchesFilter, weaponMatchesAugmentFilter, resolveRiderDamage } from "../../data/classFeatures.js";
import { effectModules } from "../effects/effectModules/effectModules.js";

const MAX_RIDER_FLAT = 50;
const MAX_RIDER_DICE_NUM = 20;
const MAX_RIDER_DICE_FACES = 100;

//Clone an outcomes object with `effect` appended to each listed outcome's effects array
function pushIntoOutcomes(outcomes, outcomeKeys, effect) {
    const next = { ...outcomes };
    for (const key of outcomeKeys) {
        const o = next[key] ?? { effects: [] };
        next[key] = { ...o, effects: [...(o.effects ?? []), effect] };
    }
    return next;
}

//Convert a resolved damage descriptor into the clamped { numRolled, diceRolled, modifier } the dice
//utilities expect. Flat -> a pure modifier; dice -> N dN with no modifier. Shared by every rider path.
function augmentNumber(dmg) {
    if (!dmg) return null;
    return dmg.kind === "flat"
        ? { numRolled: 0, diceRolled: 1, modifier: Math.max(0, Math.min(MAX_RIDER_FLAT, dmg.value)) }
        : {
            numRolled: Math.max(1, Math.min(MAX_RIDER_DICE_NUM, dmg.numRolled)),
            diceRolled: Math.max(1, Math.min(MAX_RIDER_DICE_FACES, dmg.diceRolled)),
            modifier: 0,
        };
}

//Append a strike-augment damage effect to success (1*) and criticalSuccess (2*), mirroring how the
//weapon's own damage doubles on a crit. `_classRider` keeps formatAction from adding STR/striking to
//it; `_augment` carries { source, label } so the recap can attribute the bonus damage.
function pushAugment(outcomes, number, { category, damageType, source, label }) {
    const base = { type: "damage", category: category ?? "untyped", damageType, _classRider: true, _augment: { source, label } };
    return {
        ...outcomes,
        success: { ...outcomes.success, effects: [...(outcomes.success?.effects ?? []), { ...base, number }] },
        criticalSuccess: { ...outcomes.criticalSuccess, effects: [...(outcomes.criticalSuccess?.effects ?? []), { ...base, number, multiplier: 2 }] },
    };
}

//Resolve "$configKey" tokens in a feature action's effect fields from the actor's classOption.config,
//so a static action template (e.g. Rage) can pull per-character values (rage damage, temp HP).
//Only top-level effect fields are resolved (nested objects like `duration` are left as-is).
export function hydrateFeatureAction(module, classOption) {
    const cfg = classOption?.config ?? {};
    const resolve = (v) => (typeof v === "string" && v.startsWith("$")) ? (Number(cfg[v.slice(1)]) || 0) : v;
    const hydrateEffects = (effects) => (effects ?? []).map(e => {
        const out = { ...e };
        for (const k of Object.keys(out)) out[k] = resolve(out[k]);
        return out;
    });
    if (Array.isArray(module.effects)) return { ...module, effects: hydrateEffects(module.effects) };
    if (module.outcomes) {
        return {
            ...module,
            outcomes: Object.fromEntries(
                Object.entries(module.outcomes).map(([k, o]) => [k, { ...o, effects: hydrateEffects(o?.effects) }])
            ),
        };
    }
    return module;
}

//Grant pipeline: if `actionName` is a bravado action for this actor's class option, inject an
//actor-targeted addCondition into the configured outcomes (e.g. success/criticalSuccess -> panache).
//The engine only applies the resolved outcome's effects, so this respects luck/avg/choose modes.
//Returns the original module unchanged when no grant applies.
export function injectGrants(actionModule, actionName, activeActor) {
    const grant = getGrantForAction(activeActor?.classOption, actionName);
    if (!grant || !actionModule?.outcomes) return actionModule;
    const effect = {
        type: "addCondition",
        condition: grant.condition,
        target: grant.target ?? "activeActor",
        duration: grant.duration ?? { type: "manual" },
    };
    return { ...actionModule, outcomes: pushIntoOutcomes(actionModule.outcomes, grant.outcomes, effect) };
}

//Strike-rider pipeline: validate the chosen option against the registry, the weapon filter, and the
//actor's required condition, then inject a precision damage instance into success (1x) and
//criticalSuccess (2x) - mirroring how the weapon's own damage doubles on a crit.
export function injectStrikeRider(dbAction, activeActor, choice) {
    if (!choice?.optionId || dbAction?.category !== "weapon") return dbAction;
    const rider = getStrikeRider(activeActor?.classOption);
    if (!rider) return dbAction;
    const option = rider.options.find(o => o.id === choice.optionId);
    if (!option?.damage) return dbAction; //"normal" or unknown -> no rider
    const hasCondition = (activeActor.effects ?? []).some(e => e.slug === rider.requiresCondition);
    if (!hasCondition || !weaponMatchesFilter(rider, dbAction)) return dbAction;

    const dmg = resolveRiderDamage(activeActor.classOption, option, null);
    const number = augmentNumber(dmg);
    if (!number) return dbAction;
    const damageType = dbAction.outcomes?.success?.effects?.find(e => e.type === "damage")?.damageType ?? "untyped";
    return { ...dbAction, outcomes: pushAugment(dbAction.outcomes, number, {
        category: "precision", damageType, source: rider.requiresCondition, label: option.label,
    }) };
}

//Collect always-on Strike augments from the actor's conditions (effect modules with `strikeDamage`,
//e.g. Rage, Inspire Courage) - gated by the weapon filter and (optionally) "first attack of the turn".
function conditionStrikeAugments(activeActor, dbAction) {
    const out = [];
    const firstAttack = (activeActor?.mapAttacks ?? 0) === 0;
    for (const eff of activeActor?.effects ?? []) {
        const sd = effectModules[eff.slug?.toLowerCase()]?.strikeDamage;
        if (!sd) continue;
        if (!weaponMatchesAugmentFilter(sd.filter, dbAction)) continue;
        if (sd.onlyFirstAttack && !firstAttack) continue;
        //Amount: read the condition's stored value (set by the granting action) or a fixed value.
        //kind "dice" treats the amount as a number of dice (e.g. devised: value d6); else flat.
        const amount = sd.fromValue ? (eff.value ?? 0) : (sd.value ?? 0);
        if (!(amount > 0)) continue;
        const dmg = sd.kind === "dice"
            ? { kind: "dice", numRolled: amount, diceRolled: sd.diceFaces ?? 6 }
            : { kind: "flat", value: amount };
        out.push({ dmg, category: sd.category, damageType: sd.damageType, source: eff.slug, label: sd.label ?? eff.slug });
    }
    return out;
}

//Collect always-on Strike augments from the feature's autoRiders, gated by an actor or target
//condition (target-gated riders only apply to single-target Strikes - check the sole target).
function autoRiderAugments(activeActor, targetCharacters, dbAction) {
    const out = [];
    const firstAttack = (activeActor?.mapAttacks ?? 0) === 0;
    for (const rider of getAutoRiders(activeActor?.classOption)) {
        if (!weaponMatchesAugmentFilter(rider.weaponFilter, dbAction)) continue;
        if (rider.onlyFirstAttack && !firstAttack) continue;
        if (rider.requiresCondition && !(activeActor?.effects ?? []).some(e => e.slug === rider.requiresCondition)) continue;
        if (rider.requiresTargetCondition) {
            if ((targetCharacters?.length ?? 0) !== 1) continue;
            if (!(targetCharacters[0].effects ?? []).some(e => e.slug === rider.requiresTargetCondition)) continue;
        }
        const dmg = resolveRiderDamage(activeActor.classOption, rider, null);
        if (!dmg) continue;
        out.push({ dmg, category: rider.category ?? "precision", damageType: rider.damageType, source: rider.requiresTargetCondition ?? rider.requiresCondition ?? rider.id, label: rider.label ?? rider.id });
    }
    return out;
}

//Strike-augment pipeline: append always-on bonus damage from the actor's conditions and the feature's
//autoRiders to a weapon Strike. Runs after injectStrikeRider so a chosen rider and passive augments
//stack. No-op for non-weapon actions.
export function injectStrikeAugments(dbAction, activeActor, targetCharacters) {
    if (dbAction?.category !== "weapon") return dbAction;
    const augments = [
        ...conditionStrikeAugments(activeActor, dbAction),
        ...autoRiderAugments(activeActor, targetCharacters, dbAction),
    ];
    if (augments.length === 0) return dbAction;
    const physicalType = dbAction.outcomes?.success?.effects?.find(e => e.type === "damage")?.damageType ?? "untyped";
    let outcomes = { ...dbAction.outcomes };
    for (const aug of augments) {
        const number = augmentNumber(aug.dmg);
        if (!number) continue;
        const damageType = (!aug.damageType || aug.damageType === "same") ? physicalType : aug.damageType;
        outcomes = pushAugment(outcomes, number, { category: aug.category, damageType, source: aug.source, label: aug.label });
    }
    return { ...dbAction, outcomes };
}
