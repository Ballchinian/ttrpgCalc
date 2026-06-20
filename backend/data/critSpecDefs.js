
//Returns the primary damage effect from a weapon's success outcome
function primaryDmgEffect(dbAction) {
    return dbAction.outcomes?.success?.effects?.find(e => e.type === "damage") ?? null;
}

//Persistent bleed effect builder, returned as a factory so it can read the weapon.
//PF2e: "You gain an item bonus to this bleed damage equal to the weapon's item bonus to attack
//rolls" - i.e. the potency rune. Item bonuses don't stack, so this is the bleed's only item bonus.
const persistentBleed = (diceRolled) => (dbAction) => ({
    type: "damage", number: { numRolled: 1, diceRolled, modifier: dbAction?.potency || 0 },
    damageType: "bleed", category: "persistent", multiplier: 1, _critSpec: true, target: "targetCharacters",
});

//Critical specialization effects the backend can auto-apply on a critical hit.
//A value is a static effect object, a factory (dbAction) => effect, or null.
//null means the spec is resolved by the frontend NichePrompt system (saves, adjacent damage)
//or is narrative-only forced movement (club, polearm, shield) shown via the tooltip.
//_critSpec:true marks damage effects exempt from STR injection in formatAction.
//multiplier:1 prevents the criticalSuccess 2x multiplier from doubling these bonus effects.
const CRIT_SPEC_DEFS = {
    axe: null, //adjacent-creature damage, frontend prompt
    bomb: null, //splash damage to the target - narrative/manual (splash isn't auto-modelled)
    bow: { type: "addCondition", condition: "immobilized", duration: { type: "manual" }, _critSpec: true, target: "targetCharacters" },
    brawling: null, //Fort save or slowed 1 - frontend prompt
    club: null, //forced movement (knockback) - narrative only
    crossbow: persistentBleed(8),
    dart: persistentBleed(6),
    firearm: null, //Fort save or stunned 1 - frontend prompt
    flail: null, //Reflex save or prone - frontend prompt
    hammer: null, //Fort save or prone - frontend prompt
    knife: persistentBleed(6),
    pick: (dbAction) => {
        //+2 damage per weapon damage die; multiplier:1 because this IS the crit bonus, not doubled again
        const primary = primaryDmgEffect(dbAction);
        const numRolled = primary?.number?.numRolled ?? 1;
        const damageType = primary?.damageType ?? "piercing";
        return { type: "damage", number: { numRolled: 0, diceRolled: 1, modifier: numRolled * 2 }, multiplier: 1, damageType, _critSpec: true, target: "targetCharacters" };
    },
    polearm: null, //forced movement - narrative only
    shield: null, //forced movement (knockback) - narrative only
    sling: null, //Fort save or stunned 1 - frontend prompt
    spear: { type: "addCondition", condition: "clumsy", adjustBy: 1, duration: { type: "endOfNextTurn" }, _critSpec: true, target: "targetCharacters" },
    sword: { type: "addCondition", condition: "off-guard", duration: { type: "endOfNextTurn" }, _critSpec: true, target: "targetCharacters" },
};

//Resolves a crit spec entry: handles both static objects and factory functions
export function getCritSpecEffect(group, dbAction) {
    const def = CRIT_SPEC_DEFS[group];
    if (def == null) return null;
    return typeof def === "function" ? def(dbAction) : def;
}
