import { DAMAGE_TYPES } from "../../data/damageTypes.js";

//Versatile weapons let the attacker pick the damage type at attack time. Overrides the weapon's base
//physical damage effects to the chosen type, leaving crit-spec / precision-rider / persistent effects
//(e.g. bleed) alone. Returns the action unchanged for a missing or unrecognised type.
export function applyVersatileDamageType(dbAction, chosenType) {
    if (!chosenType || dbAction?.category !== "weapon" || !dbAction.outcomes) return dbAction;
    if (!DAMAGE_TYPES.includes(chosenType)) return dbAction;
    const patch = effects => effects.map(e =>
        (e.type === "damage" && !e._critSpec && !e._classRider && e.category !== "persistent")
            ? { ...e, damageType: chosenType }
            : e
    );
    return {
        ...dbAction,
        outcomes: Object.fromEntries(
            Object.entries(dbAction.outcomes).map(([k, o]) => [k, { ...o, effects: patch(o?.effects ?? []) }])
        ),
    };
}
