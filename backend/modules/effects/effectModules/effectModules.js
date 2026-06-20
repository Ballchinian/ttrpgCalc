import frightened from "../frightened.js";
import grabbed from "../grabbed.js";
import immobilized from "../immobilized.js";
import offGuard from "../offGuard.js";
import prone from "../prone.js";
import restrained from "../restrained.js";
import clumsy from "../clumsy.js";
import fleeing from "../fleeing.js";
import persistent from "../persistent.js";
import stunned from "../stunned.js";
import slowed from "../slowed.js";
import panache from "../panache.js";
import rage from "../rage.js";
import inspiredCourage from "../inspiredCourage.js";
import arcaneCascade from "../arcaneCascade.js";
import overdrive from "../overdrive.js";
import devised from "../devised.js";
import huntedPrey from "../huntedPrey.js";
import exploitedVulnerability from "../exploitedVulnerability.js";

//All registered effect definitions keyed by condition name
export const effectModules = {
    frightened,
    grabbed,
    immobilized,
    "off-guard": offGuard,
    prone,
    restrained,
    clumsy,
    fleeing,
    persistent,
    stunned,
    slowed,
    panache,
    //Class effects/stances (category: "effect"/"stance") - drive Strike augments via injectStrikeAugments
    rage,
    "inspired-courage": inspiredCourage,
    "arcane-cascade": arcaneCascade,
    overdrive,
    devised,
    "hunted-prey": huntedPrey,
    "exploited-vulnerability": exploitedVulnerability,
};

export const offGuardEffects = Object.values(effectModules)
    .filter(e => e.offGuard === true)
    .map(e => e.name.toLowerCase());