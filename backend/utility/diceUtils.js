export const sumOfDice = ({ numRolled, diceRolled, modifier, bonusDice }, multiplier = 1) => {
    if (!Number.isFinite(numRolled) || !Number.isFinite(diceRolled) || !Number.isFinite(modifier)) {
        throw new RangeError(`sumOfDice received non-finite inputs: ${numRolled}d${diceRolled}+${modifier}`);
    }
    if (numRolled < 0) throw new RangeError(`sumOfDice: numRolled must be >= 0, got ${numRolled}`);
    if (diceRolled < 1) throw new RangeError(`sumOfDice: diceRolled must be >= 1, got ${diceRolled}`);
    let total = 0;
    for (let i = 0; i < numRolled; i++) {
        total += Math.floor(Math.random() * diceRolled) + 1; //+1 shifts 0-based floor to 1-based die face
    }
    if (bonusDice) {
        if (!Number.isFinite(bonusDice.numRolled) || !Number.isFinite(bonusDice.diceRolled)) {
            throw new RangeError(`sumOfDice received non-finite bonusDice: ${bonusDice.numRolled}d${bonusDice.diceRolled}`);
        }
        if (bonusDice.numRolled < 0) throw new RangeError(`sumOfDice: bonusDice.numRolled must be >= 0, got ${bonusDice.numRolled}`);
        if (bonusDice.diceRolled < 1) throw new RangeError(`sumOfDice: bonusDice.diceRolled must be >= 1, got ${bonusDice.diceRolled}`);
        for (let i = 0; i < bonusDice.numRolled; i++) {
            total += Math.floor(Math.random() * bonusDice.diceRolled) + 1;
        }
    }
    //PF2e rule: roll normally (dice + modifier), then double/halve the total; floor and clamp to 0
    return Math.max(0, Math.floor((total + modifier) * multiplier));
};

//Same as sumOfDice but also returns individual die results for display
export const sumOfDiceDetailed = ({ numRolled, diceRolled, modifier, bonusDice }, multiplier = 1) => {
    if (!Number.isFinite(numRolled) || !Number.isFinite(diceRolled) || !Number.isFinite(modifier)) {
        throw new RangeError(`sumOfDiceDetailed received non-finite inputs: ${numRolled}d${diceRolled}+${modifier}`);
    }
    if (numRolled < 0) throw new RangeError(`sumOfDiceDetailed: numRolled must be >= 0, got ${numRolled}`);
    if (diceRolled < 1) throw new RangeError(`sumOfDiceDetailed: diceRolled must be >= 1, got ${diceRolled}`);
    const rolls = [];
    for (let i = 0; i < numRolled; i++) {
        rolls.push(Math.floor(Math.random() * diceRolled) + 1); //+1 shifts 0-based floor to 1-based die face
    }
    const bonusRolls = [];
    if (bonusDice) {
        if (!Number.isFinite(bonusDice.numRolled) || !Number.isFinite(bonusDice.diceRolled)) {
            throw new RangeError(`sumOfDiceDetailed received non-finite bonusDice: ${bonusDice.numRolled}d${bonusDice.diceRolled}`);
        }
        if (bonusDice.numRolled < 0) throw new RangeError(`sumOfDiceDetailed: bonusDice.numRolled must be >= 0, got ${bonusDice.numRolled}`);
        if (bonusDice.diceRolled < 1) throw new RangeError(`sumOfDiceDetailed: bonusDice.diceRolled must be >= 1, got ${bonusDice.diceRolled}`);
        for (let i = 0; i < bonusDice.numRolled; i++) {
            bonusRolls.push(Math.floor(Math.random() * bonusDice.diceRolled) + 1);
        }
    }
    const allSum = rolls.reduce((s, r) => s + r, 0) + bonusRolls.reduce((s, r) => s + r, 0);
    const total = Math.max(0, Math.floor((allSum + modifier) * multiplier));
    return { total, rolls, bonusRolls, modifier, multiplier };
};

export const avgOfDice = ({ numRolled, diceRolled, modifier, bonusDice }, multiplier = 1) => {
    if (!Number.isFinite(numRolled) || !Number.isFinite(diceRolled) || !Number.isFinite(modifier) || !Number.isFinite(multiplier)) {
        throw new RangeError(`avgOfDice received non-finite inputs: ${numRolled}d${diceRolled}+${modifier} x${multiplier}`);
    }
    if (numRolled < 0) throw new RangeError(`avgOfDice: numRolled must be >= 0, got ${numRolled}`);
    if (diceRolled < 1) throw new RangeError(`avgOfDice: diceRolled must be >= 1, got ${diceRolled}`);
    //(faces + 1) / 2 = mean of uniform distribution over 1..faces (e.g. d6 avg = 3.5)
    const bonusAvg = bonusDice && Number.isFinite(bonusDice.numRolled) && Number.isFinite(bonusDice.diceRolled)
        ? bonusDice.numRolled * (bonusDice.diceRolled + 1) / 2
        : 0;
    return Math.max(0, Math.floor((numRolled * (diceRolled + 1) / 2 + bonusAvg + modifier) * multiplier));
};

export const diceFormat = ({ numRolled, diceRolled, modifier, bonusDice }) => {
    const bonusStr = bonusDice ? `+${bonusDice.numRolled}d${bonusDice.diceRolled}` : "";
    //undefined/null modifier treated as 0 so the display string is never "undefined"
    const safeMod = Number.isFinite(modifier) ? modifier : 0;
    const mod = safeMod > 0 ? `+${safeMod}` : safeMod < 0 ? `${safeMod}` : "";
    return `${numRolled}d${diceRolled}${bonusStr}${mod}`;
};
