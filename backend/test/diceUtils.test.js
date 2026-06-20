import { test } from "node:test";
import assert from "node:assert/strict";
import { sumOfDice, avgOfDice, diceFormat } from "../utility/diceUtils.js";

test("avgOfDice: deterministic mean of the dice plus modifier", () => {
    //2d6 averages 7, +3 modifier = 10
    assert.equal(avgOfDice({ numRolled: 2, diceRolled: 6, modifier: 3 }), 10);
    //1d8 averages 4.5, floored to 4
    assert.equal(avgOfDice({ numRolled: 1, diceRolled: 8, modifier: 0 }), 4);
});

test("avgOfDice: multiplier applies to the whole total (PF2e double-after-roll)", () => {
    //(2d6 avg 7 + 3) * 2 = 20
    assert.equal(avgOfDice({ numRolled: 2, diceRolled: 6, modifier: 3 }, 2), 20);
});

test("avgOfDice: bonusDice are folded into the average", () => {
    //1d6 (3.5) + 1d4 bonus (2.5) = 6, floored to 6
    assert.equal(avgOfDice({ numRolled: 1, diceRolled: 6, modifier: 0, bonusDice: { numRolled: 1, diceRolled: 4 } }), 6);
});

test("avgOfDice: never returns below 0", () => {
    assert.equal(avgOfDice({ numRolled: 0, diceRolled: 6, modifier: -5 }), 0);
});

test("sumOfDice: flat modifier only (numRolled 0) is deterministic", () => {
    assert.equal(sumOfDice({ numRolled: 0, diceRolled: 6, modifier: 5 }), 5);
    assert.equal(sumOfDice({ numRolled: 0, diceRolled: 6, modifier: 5 }, 2), 10);
});

test("sumOfDice: rolled total stays within the possible min/max bounds", () => {
    for (let i = 0; i < 500; i++) {
        const v = sumOfDice({ numRolled: 3, diceRolled: 6, modifier: 2 });
        assert.ok(v >= 3 + 2 && v <= 18 + 2, `roll ${v} out of bounds`);
    }
});

test("sumOfDice: clamps a net-negative result to 0", () => {
    for (let i = 0; i < 200; i++) {
        assert.ok(sumOfDice({ numRolled: 1, diceRolled: 4, modifier: -10 }) >= 0);
    }
});

test("sumOfDice: rejects non-finite and out-of-range inputs", () => {
    assert.throws(() => sumOfDice({ numRolled: NaN, diceRolled: 6, modifier: 0 }), RangeError);
    assert.throws(() => sumOfDice({ numRolled: -1, diceRolled: 6, modifier: 0 }), RangeError);
    assert.throws(() => sumOfDice({ numRolled: 1, diceRolled: 0, modifier: 0 }), RangeError);
});

test("diceFormat: renders dice + signed modifier", () => {
    assert.equal(diceFormat({ numRolled: 2, diceRolled: 6, modifier: 3 }), "2d6+3");
    assert.equal(diceFormat({ numRolled: 2, diceRolled: 6, modifier: -1 }), "2d6-1");
    assert.equal(diceFormat({ numRolled: 2, diceRolled: 6, modifier: 0 }), "2d6");
});

test("diceFormat: numRolled 0 renders the flat modifier alone, plus any bonus dice", () => {
    assert.equal(diceFormat({ numRolled: 0, diceRolled: 6, modifier: 5 }), "5");
    assert.equal(diceFormat({ numRolled: 1, diceRolled: 6, modifier: 2, bonusDice: { numRolled: 1, diceRolled: 4 } }), "1d6+1d4+2");
});
