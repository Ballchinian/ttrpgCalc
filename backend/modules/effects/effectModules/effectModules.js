import frightened from "../frightened.js";
import grabbed from "../grabbed.js";
import immobilized from "../immobilized.js";
import offGuard from "../offGuard.js";
import prone from "../prone.js";
import restrained from "../restrained.js";
import clumsy from "../clumsy.js";
import fleeing from "../fleeing.js";
import persistent from "../persistent.js";

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
};

export const offGuardEffects = Object.values(effectModules)
    .filter(e => e.offGuard === true)
    .map(e => e.name.toLowerCase());