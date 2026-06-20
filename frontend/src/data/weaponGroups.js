export const WEAPON_GROUPS = Object.freeze([
    "axe", "bomb", "bow", "brawling", "club", "crossbow", "dart",
    "firearm", "flail", "hammer", "knife", "pick",
    "polearm", "shield", "sling", "spear", "sword"
]);

//"thrown" and "unarmed" are not PF2e weapon groups - thrown is a trait, and unarmed attacks
//use the brawling group. Both are intentionally excluded.
//Bomb, bow, crossbow, dart, firearm, sling use Dexterity (dexHit) - bombs are thrown
export const RANGED_GROUPS = Object.freeze(new Set(["bomb", "bow", "crossbow", "dart", "firearm", "sling"]));
