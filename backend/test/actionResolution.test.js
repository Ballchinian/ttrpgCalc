import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDamageModifiers, getDamageModInfo, conditionResolution } from "../modules/resolveActionHelper/actionResolution.js";

//--- applyDamageModifiers: PF2e resistance / weakness / immunity ---

test("applyDamageModifiers: passes damage through untouched with no modifiers", () => {
    assert.equal(applyDamageModifiers(10, "fire", {}), 10);
});

test("applyDamageModifiers: resistance subtracts, weakness adds (case-insensitive type match)", () => {
    assert.equal(applyDamageModifiers(10, "fire", { resistances: [{ damageType: "Fire", value: 3 }] }), 7);
    assert.equal(applyDamageModifiers(10, "fire", { weaknesses: [{ damageType: "fire", value: 5 }] }), 15);
});

test("applyDamageModifiers: weakness is applied before resistance, then clamped at 0", () => {
    //10 + 5 weakness - 3 resistance = 12
    assert.equal(applyDamageModifiers(10, "fire", {
        weaknesses: [{ damageType: "fire", value: 5 }],
        resistances: [{ damageType: "fire", value: 3 }],
    }), 12);
    //resistance exceeding damage clamps to 0, never negative
    assert.equal(applyDamageModifiers(2, "fire", { resistances: [{ damageType: "fire", value: 5 }] }), 0);
});

test("applyDamageModifiers: immunity zeroes the damage and beats resistance/weakness", () => {
    assert.equal(applyDamageModifiers(50, "fire", { immunities: ["fire"], weaknesses: [{ damageType: "fire", value: 10 }] }), 0);
});

test("applyDamageModifiers: no-op for zero/negative input or missing damage type", () => {
    assert.equal(applyDamageModifiers(0, "fire", { weaknesses: [{ damageType: "fire", value: 5 }] }), 0);
    assert.equal(applyDamageModifiers(10, undefined, { resistances: [{ damageType: "fire", value: 5 }] }), 10);
});

test("getDamageModInfo: reports the modifier entries that were applied", () => {
    assert.deepEqual(getDamageModInfo(50, "fire", { immunities: ["fire"] }), [{ kind: "immunity", delta: -50 }]);
    const info = getDamageModInfo(10, "fire", { resistances: [{ damageType: "fire", value: 3 }] });
    assert.deepEqual(info, [{ kind: "resistance", value: 3, delta: -3 }]);
    //resistance delta never exceeds the incoming damage
    assert.deepEqual(getDamageModInfo(2, "fire", { resistances: [{ damageType: "fire", value: 5 }] }), [{ kind: "resistance", value: 5, delta: -2 }]);
});

//--- conditionResolution: add/remove, stacking, hierarchy, immunity ---

const charWith = (effects = []) => ({ id: 1, effects, immunities: [], stats: { currentHealth: 50 } });

test("conditionResolution: adds a new condition with its level", () => {
    const [out] = conditionResolution([charWith()], { type: "addCondition", condition: "frightened", adjustBy: 2 });
    const eff = out.effects.find(e => e.slug === "frightened");
    assert.ok(eff, "frightened should be added");
    assert.equal(eff.value, 2);
});

test("conditionResolution: reapplying a condition keeps the higher level", () => {
    const start = charWith([{ slug: "frightened", value: 3, duration: { type: "decrement" } }]);
    const [out] = conditionResolution([start], { type: "addCondition", condition: "frightened", adjustBy: 1 });
    assert.equal(out.effects.find(e => e.slug === "frightened").value, 3);
});

test("conditionResolution: restrained supersedes and removes grabbed", () => {
    const start = charWith([{ slug: "grabbed", value: 1, duration: { type: "manual" } }]);
    const [out] = conditionResolution([start], { type: "addCondition", condition: "restrained", adjustBy: 1 });
    assert.ok(out.effects.some(e => e.slug === "restrained"));
    assert.ok(!out.effects.some(e => e.slug === "grabbed"), "grabbed should be cleared by restrained");
});

test("conditionResolution: a condition covered by a more severe one is not added", () => {
    const start = charWith([{ slug: "restrained", value: 1, duration: { type: "manual" } }]);
    const [out] = conditionResolution([start], { type: "addCondition", condition: "grabbed", adjustBy: 1 });
    assert.ok(!out.effects.some(e => e.slug === "grabbed"), "grabbed is redundant while restrained");
});

test("conditionResolution: trait immunity (fear) blocks frightened", () => {
    const start = { ...charWith(), immunities: ["fear"] };
    const [out] = conditionResolution([start], { type: "addCondition", condition: "frightened", adjustBy: 2 });
    assert.ok(!out.effects.some(e => e.slug === "frightened"), "fear immunity should block frightened");
});

test("conditionResolution: removeCondition strips the effect", () => {
    const start = charWith([{ slug: "frightened", value: 2, duration: { type: "decrement" } }]);
    const [out] = conditionResolution([start], { type: "removeCondition", condition: "frightened" });
    assert.ok(!out.effects.some(e => e.slug === "frightened"));
});
