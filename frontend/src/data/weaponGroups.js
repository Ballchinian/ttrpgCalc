export const WEAPON_GROUPS = Object.freeze([
    "axe", "bow", "brawling", "club", "crossbow", "dart",
    "firearm", "flail", "hammer", "knife", "pick",
    "polearm", "shield", "sling", "spear", "sword", "thrown", "unarmed"
]);

//Bow, crossbow, dart, firearm, sling use Dexterity (dexHit)
//Thrown uses Strength (strHit), thrown weapons still use STR in PF2e
export const RANGED_GROUPS = Object.freeze(new Set(["bow", "crossbow", "dart", "firearm", "sling"]));
