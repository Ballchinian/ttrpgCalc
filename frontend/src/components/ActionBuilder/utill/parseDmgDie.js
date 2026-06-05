//Parses a dice string in the form XdY, XdY+Z, XdY-Z, XdY+AdB, or XdY+AdB+/-V
//into { numRolled, diceRolled, modifier, bonusDice? }
function parseDmgDie(dmgDieNumbers) {
    const str = (dmgDieNumbers || "").trim();
    const VALID_DICE = new Set([4, 6, 8, 10, 12, 20]);

    //XdY+AdB or XdY+AdB+/-V: bonus die with optional flat modifier (e.g. 2d6+1d4, 2d6+1d4+3)
    const bonusMatch = str.match(/^(\d+)d(\d+)\+(\d+)d(\d+)(?:([+-])(\d+))?$/i);
    if (bonusMatch) {
        const numRolled  = parseInt(bonusMatch[1], 10);
        const diceRolled = parseInt(bonusMatch[2], 10);
        const bonusNum   = parseInt(bonusMatch[3], 10);
        const bonusDie   = parseInt(bonusMatch[4], 10);
        const modifier   = bonusMatch[5] ? parseInt(bonusMatch[6], 10) * (bonusMatch[5] === "-" ? -1 : 1) : 0;
        if (numRolled === 0 || !VALID_DICE.has(diceRolled) || bonusNum === 0 || !VALID_DICE.has(bonusDie)) {
            return { errors: { dmgDieNumbers: "Use valid dice: d4, d6, d8, d10, d12, or d20" } };
        }
        return { numRolled, diceRolled, modifier, bonusDice: { numRolled: bonusNum, diceRolled: bonusDie } };
    }

    //XdY or XdY+/-Z: standard flat modifier
    const match = str.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
    if (!match) {
        return { errors: { dmgDieNumbers: "Invalid format. Use XdY, XdY+Z, XdY+AdB, or XdY+AdB+Z (e.g. 2d6+1d4+3)" } };
    }

    const numRolled  = parseInt(match[1], 10);
    const diceRolled = parseInt(match[2], 10);
    const modifier   = match[3] ? parseInt(match[4], 10) * (match[3] === "-" ? -1 : 1) : 0;

    if (numRolled === 0 || !VALID_DICE.has(diceRolled)) {
        return { errors: { dmgDieNumbers: "Use a valid die: d4, d6, d8, d10, d12, or d20" } };
    }

    return { numRolled, diceRolled, modifier };
}

export default parseDmgDie;
