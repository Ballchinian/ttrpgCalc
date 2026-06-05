import { OUTCOME_KEYS_INDEXED } from "../data/outcomeDefs.js";

//PF2e: beating or missing the DC by this margin upgrades/downgrades outcome by one degree
const CRIT_MARGIN = 10;
//d20 face count used to convert raw iteration counts to probabilities
const D20_FACES = 20;

//multiplierTable: an object keyed by outcome (e.g. MULTIPLIER_TABLE or BASIC_SAVE_MULTIPLIER_TABLE)
export default function likelihoodTable(targetDC, rollModifier, multiplierTable, critThreshold = 20) {
    const chanceOfOutcome = { critSuccess: 0, success: 0, failure: 0, critFailure: 0 };
    let totalAvgMultiplier = 0;

    //This is the number we need to meet on a d20, negative means better chance to hit
    const targetNumber = targetDC - rollModifier;
    for (let roll = 1; roll <= D20_FACES; roll++) {
        let degreeOfSuccess = 0;
        if (roll >= critThreshold) degreeOfSuccess++;
        else if (roll === 1) degreeOfSuccess--;
        let outcomeIndex = 0;
        //critFailure
        if (targetNumber - roll >= CRIT_MARGIN) {
            //nat-20 still upgrades from crit failure to failure; nat-1 cannot go below crit failure
            if (degreeOfSuccess === -1) degreeOfSuccess = 0;
            outcomeIndex = 0;
        //Failure
        } else if (targetNumber - roll > 0) {
            outcomeIndex = 1;
        //Crit Success
        } else if (targetNumber - roll <= -CRIT_MARGIN) {
            //nat-1 still degrades from crit success to success; nat-20 cannot go above crit success
            if (degreeOfSuccess === 1) degreeOfSuccess = 0;
            outcomeIndex = 3;
        //Success
        } else {
            outcomeIndex = 2;
        }
        //Clamp to valid index range to match successTable behaviour
        const clampedIndex = Math.max(0, Math.min(3, outcomeIndex + degreeOfSuccess));
        //rollerKey is always in roller's POV; multiplierTable must also be in roller's POV
        //(attacks: actor's POV via MULTIPLIER_TABLE, saves: target's POV via BASIC_SAVE_MULTIPLIER_TABLE)
        const rollerKey = OUTCOME_KEYS_INDEXED[clampedIndex];
        chanceOfOutcome[rollerKey]++;
        totalAvgMultiplier += multiplierTable[rollerKey] ?? 0;
    }
    //Divide by D20_FACES to convert raw counts into probabilities (0.0 to 1.0)
    totalAvgMultiplier /= D20_FACES;
    //chanceOfOutcome stays in roller's POV (actor's POV for attacks, target's POV for saves)
    return {
        totalAvgMultiplier,
        chanceOfOutcome: Object.fromEntries(
            Object.entries(chanceOfOutcome).map(([k, v]) => [k, v / D20_FACES])
        )
    };
}
