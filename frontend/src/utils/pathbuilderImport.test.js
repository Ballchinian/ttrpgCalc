import { test, expect } from "vitest";
import { parsePathbuilder } from "./pathbuilderImport";

//A minimal but representative Pathbuilder "build" object covering the fields the parser reads.
const sampleBuild = {
    name: "Test Hero",
    class: "Swashbuckler",
    level: 5,
    keyability: "dex",
    abilities: { str: 14, dex: 18, con: 12, int: 10, wis: 10, cha: 16 },
    proficiencies: { fortitude: 4, reflex: 6, will: 4, perception: 4, athletics: 4, acrobatics: 6, classDC: 6 },
    attributes: { ancestryhp: 8, classhp: 10, bonushp: 0, bonushpPerLevel: 0 },
    armor: [{ worn: true, res: "resilient" }],
    spellCasters: [],
    specials: ["Braggart"],
    acTotal: { acTotal: 22 },
    weapons: [
        { name: "rapier", attack: 13, die: "d6", str: "striking", damageType: "p", pot: 1, damageBonus: 5 },
    ],
};

test("parsePathbuilder: maps top-level identity and final totals", () => {
    const { characterName, flatStats, classOption } = parsePathbuilder(sampleBuild);
    expect(characterName).toBe("Test Hero");
    expect(flatStats.ac).toBe(22);              //taken verbatim from Pathbuilder
    expect(classOption.feature).toBe("swashbuckler");
});

test("parsePathbuilder: derives HP from its components (ancestry + class*level + con*level)", () => {
    //8 + 10*5 + 0 + 0 + con(+1)*5 = 63
    expect(parsePathbuilder(sampleBuild).flatStats.health).toBe(63);
});

test("parsePathbuilder: computes saves/perception by the PF2e trained formula (level + prof + ability)", () => {
    const { flatStats } = parsePathbuilder(sampleBuild);
    expect(flatStats.reflex).toBe(15);              //5 + 6 + dex(+4)
    expect(flatStats.fortitude).toBe(10);           //5 + 4 + con(+1)
    expect(flatStats.skills.perception).toBe(9);    //5 + 4 + wis(0)
});

test("parsePathbuilder: falls back to the martial class DC when there is no spellcaster", () => {
    //10 + level(5) + classDC prof(6) + key ability dex(+4) = 25
    expect(parsePathbuilder(sampleBuild).flatStats.dc).toBe(25);
});

test("parsePathbuilder: reads the resilient rune rank off worn armour", () => {
    expect(parsePathbuilder(sampleBuild).flatStats.resilient).toBe(1);
});

test("parsePathbuilder: splits the potency rune out of the imported attack bonus", () => {
    //attack 13 includes a +1 potency rune; strHit stores the bonus without it so the rune stays visible
    expect(parsePathbuilder(sampleBuild).flatStats.strHit).toBe(12);
});

test("parsePathbuilder: builds weapon descriptors (group guess, damage type, striking dice)", () => {
    const [weapon] = parsePathbuilder(sampleBuild).weapons;
    expect(weapon.group).toBe("sword");        //rapier guessed as a sword
    expect(weapon.damageType).toBe("Piercing"); //"p" code
    expect(weapon.diceRolled).toBe(6);          //d6
    expect(weapon.striking).toBe(1);            //striking rune = 2 dice total = +1 extra die
    expect(weapon.potency).toBe(1);
});

test("parsePathbuilder: accepts the full { success, build } API wrapper", () => {
    const wrapped = parsePathbuilder({ success: true, build: sampleBuild });
    expect(wrapped.characterName).toBe("Test Hero");
});

test("parsePathbuilder: rejects payloads that aren't a Pathbuilder export", () => {
    expect(() => parsePathbuilder({})).toThrow(/Pathbuilder export/);
    expect(() => parsePathbuilder(null)).toThrow();
});
