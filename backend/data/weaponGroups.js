export const WEAPON_GROUPS = Object.freeze([
    "axe", "bomb", "bow", "brawling", "club", "crossbow", "dart",
    "firearm", "flail", "hammer", "knife", "pick",
    "polearm", "shield", "sling", "spear", "sword"
]);

//Bomb, bow, crossbow, dart, firearm, sling use Dexterity (dexHit) - bombs are thrown
export const RANGED_GROUPS = Object.freeze(new Set(["bomb", "bow", "crossbow", "dart", "firearm", "sling"]));
