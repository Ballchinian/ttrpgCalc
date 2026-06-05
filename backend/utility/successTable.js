import { OUTCOME_KEYS_INDEXED } from "../data/outcomeDefs.js";

//PF2e: beating or missing the DC by this margin upgrades/downgrades outcome by one degree
const CRIT_MARGIN = 10;

export default function successTable(targetDC, rollModifier, diceResult, critThreshold = 20) {
    //critThreshold = 20: the die-face value (nat-20 by default) that upgrades the degree of success
    if (!Number.isFinite(targetDC) || !Number.isFinite(rollModifier) || !Number.isFinite(diceResult)) {
        throw new RangeError(`successTable received non-finite inputs: DC=${targetDC} mod=${rollModifier} roll=${diceResult}`);
    }
    const total = diceResult + rollModifier;
    //PF2e: nat-20 is not always a crit; critThreshold roll upgrades degree, nat-1 downgrades it
    let outcomeIndex;
    let degreeOfSuccess = 0;
    //Need a nat 1 or >= critThreshold to go up or down a degree of success (if/else prevents double-apply at threshold=1)
    if (diceResult >= critThreshold) degreeOfSuccess++;
    else if (diceResult === 1) degreeOfSuccess--;

    //Crit Failure
    if (total <= targetDC - CRIT_MARGIN) {
        if (degreeOfSuccess === -1) degreeOfSuccess = 0; //Cant have a value worse than crit failure
        outcomeIndex = 0;
    }
    //Failure: strictly below DC, meeting the DC exactly is a success
    else if (total < targetDC) {
        outcomeIndex = 1;
    }
    //Crit Success
    else if (total >= targetDC + CRIT_MARGIN) {
        if (degreeOfSuccess === 1) degreeOfSuccess = 0; //Cant have a value better than crit success
        outcomeIndex = 3;
    }
    //Success
    else {
        outcomeIndex = 2;
    }

    //Clamp to valid index range to prevent undefined on edge cases
    const clampedIndex = Math.max(0, Math.min(3, outcomeIndex + degreeOfSuccess));
    //Always return the roller's POV: for saves the roller is the target, key = target's outcome
    return OUTCOME_KEYS_INDEXED[clampedIndex];
}