//A broad list of PF2e traits offered in the trait editors, beyond the mechanically-active ones in the
//backend traitModules. These are inert markers: stored on the action so that current/future condition
//and effect interactions can match on them (e.g. a future "stupefied -> flat check on concentrate", or
//an effect that only hits emotion/mental actions). Not exhaustive - the editor also allows a free-form
//custom trait, so anything missing here can still be added to an action or spell.
export const TRAIT_CATALOG = [
    // weapon / attack
    "attack", "agile", "finesse", "reach", "ranged", "thrown", "melee", "unarmed", "versatile",
    "forceful", "sweep", "trip", "shove", "disarm", "grapple", "nonlethal", "deadly", "fatal",
    "backstabber", "brutal", "parry", "twin", "two-hand", "volley", "propulsive", "modular",
    // action gating / movement / mental
    "manipulate", "concentrate", "move", "flourish", "stance", "press", "open", "rage", "emotion",
    "mental", "auditory", "visual", "linguistic", "fear", "death", "incapacitation", "fortune",
    "misfortune", "secret",
    // magic / spell
    "magical", "arcane", "divine", "occult", "primal", "cantrip", "focus", "spellshape", "subtle",
    "hex", "curse", "polymorph", "healing", "vitality", "void", "spirit", "summon", "teleportation",
    // damage / element
    "fire", "cold", "electricity", "acid", "sonic", "force", "poison", "bleed", "light", "darkness",
    "holy", "unholy",
    // class
    "alchemist", "barbarian", "bard", "champion", "cleric", "druid", "fighter", "gunslinger",
    "investigator", "inventor", "kineticist", "magus", "monk", "oracle", "psychic", "ranger", "rogue",
    "sorcerer", "summoner", "swashbuckler", "thaumaturge", "witch", "wizard",
    // thaumaturge / misc combat-relevant
    "esoterica", "tattoo", "instrument", "critical-fusion", "precious", "sneak",
];

//Weapon/attack-specific traits (both inert catalog names and config-bearing traitModules like keen,
//deadly, fatal, two-hand). Used by the trait picker to sort these to the top in the weapon editor and
//to the bottom in the spell editor - a weapon's relevant traits should be the easiest to reach.
export const WEAPON_TRAITS = new Set([
    "attack", "agile", "finesse", "reach", "ranged", "thrown", "melee", "unarmed", "versatile",
    "forceful", "sweep", "trip", "shove", "disarm", "grapple", "nonlethal", "deadly", "fatal",
    "fatal-aim", "backstabber", "brutal", "parry", "twin", "two-hand", "volley", "propulsive",
    "modular", "jousting", "heavy", "light", "keen", "critical-fusion", "sneak",
]);
