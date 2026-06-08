import { useBattleStore } from '../store/battleStore';
import { useRecapStore } from '../store/recapStore';
import { applyEffectsToChar } from './applyPendingAction';
import { CRIT_SPEC_DEFS } from '../data/critSpecDefs';

//Builds and queues the NichePrompts for crit specs that can't be auto-applied:
//"save" specs (target saves vs the attacker's class DC) and "adjacentDamage" (axe).
//Shared by both call sites — luck/avg from useResolveTurn, choose from applyPendingAction.

const d20 = () => Math.floor(Math.random() * 20) + 1;

const rollDice = (dice) => {
    const { numRolled = 0, diceRolled = 1 } = dice ?? {};
    let sum = 0;
    for (let i = 0; i < numRolled; i++) sum += Math.floor(Math.random() * diceRolled) + 1;
    return sum;
};
const avgDice = (dice) => {
    const { numRolled = 0, diceRolled = 1 } = dice ?? {};
    return Math.round(numRolled * (diceRolled + 1) / 2);
};

//Chance a d20 + saveMod meets classDC. Nat 1 always fails, nat 20 always succeeds,
//so passing faces are clamped to [1, 19].
const saveSuccessChance = (saveMod, classDC) => {
    const need = classDC - saveMod;                       //roll needed to succeed
    const faces = Math.min(Math.max(21 - need, 1), 19);   //count of d20 faces that pass
    return faces / 20;
};

const findChar = (id) => {
    const { parties } = useBattleStore.getState();
    return [...parties.heroes, ...parties.foes].find(c => c.id === id) ?? null;
};

const dealDamageToChar = (charId, amount) => {
    const c = findChar(charId);
    if (!c || amount <= 0) return;
    useBattleStore.getState().updateCharacterInList(c.side, c.id, ch => ({
        ...ch, stats: { ...ch.stats, currentHealth: Math.max(0, ch.stats.currentHealth - amount) },
    }));
};

const applyConditionToChar = (charId, effect, recapContext) => {
    const c = findChar(charId);
    if (!c) return;
    useBattleStore.getState().updateCharacterInList(c.side, c.id, ch => applyEffectsToChar(ch, [effect], recapContext));
};

//Records what the crit spec did so the recap can show it (gated by the "Crit Spec" toggle).
//kind: "applied" (something happened) | "none" (saved/skipped, no effect)
const recordCritSpec = (round, text, kind) => useRecapStore.getState().appendCritSpec(round, { text, kind });

//crittedIds: ids of targets that took a critical hit
//actor: the attacking character (for its class DC); weaponDice: { numRolled, diceRolled } for axe
export function queueCritSpecPrompts({ group, crittedIds, diceMode, actor, weaponDice, recapContext }) {
    const def = CRIT_SPEC_DEFS[group];
    if (!def || !crittedIds?.length) return;
    if (def.kind !== "save" && def.kind !== "adjacentDamage") return; //auto/info specs need no prompt

    const { parties, addNichePrompt } = useBattleStore.getState();
    const allChars = [...parties.heroes, ...parties.foes];
    const classDC = Number(actor?.stats?.attributes?.dc) || 0;
    const round = recapContext?.round;
    const groupLabel = `${group.charAt(0).toUpperCase()}${group.slice(1)} crit spec`;

    crittedIds.forEach(crittedId => {
        const crittedName = allChars.find(c => c.id === crittedId)?.name ?? crittedId;

        if (def.kind === "adjacentDamage") {
            const amount = diceMode === "luck" ? rollDice(weaponDice) : avgDice(weaponDice);
            const avgNote = diceMode === "luck" ? "" : "(avg) ";
            addNichePrompt({
                id: `${group}-${crittedId}`,
                title: "Axe Crit Spec",
                description: `${crittedName} was critically hit. Choose an adjacent creature whose AC is lower than your attack roll — it takes ${amount} ${avgNote}damage. Skip if none qualify.`,
                type: "characterSelect",
                characters: allChars.filter(c => c.id !== crittedId).map(c => ({ id: c.id, name: c.name })),
                onResolve: (charId) => {
                    if (charId) {
                        dealDamageToChar(charId, amount);
                        recordCritSpec(round, `${groupLabel}: ${findChar(charId)?.name ?? "creature"} took ${amount} damage`, "applied");
                    } else {
                        recordCritSpec(round, `${groupLabel}: no creature targeted`, "none");
                    }
                },
            });
            return;
        }

        //kind === "save": fail the save → apply the condition to the critted target itself
        const saveMod = Number(findChar(crittedId)?.stats?.saves?.[def.save]) || 0;
        const saveLabel = def.save.charAt(0).toUpperCase() + def.save.slice(1);
        const effect = { type: "addCondition", condition: def.condition, duration: def.duration, ...(def.value ? { adjustBy: def.value } : {}) };
        const onResolve = (outcome) => {
            if (outcome === "failed") {
                applyConditionToChar(crittedId, effect, recapContext);
                recordCritSpec(round, `${groupLabel}: ${crittedName} failed its ${saveLabel} save → ${def.conditionLabel}`, "applied");
            } else {
                recordCritSpec(round, `${groupLabel}: ${crittedName} made its ${saveLabel} save (no effect)`, "none");
            }
        };
        const base = { id: `${group}-${crittedId}`, title: "Crit Spec Save", type: "saveCondition", conditionLabel: def.conditionLabel, onResolve };

        if (diceMode === "choose") {
            addNichePrompt({ ...base, mode: "choose",
                description: `${crittedName} attempts a ${saveLabel} save vs your class DC. On a failure it is ${def.conditionLabel}.` });
        } else if (diceMode === "luck") {
            const roll = d20();
            const total = roll + saveMod;
            const passed = roll === 20 || (roll !== 1 && total >= classDC);
            addNichePrompt({ ...base, mode: "luck", predetermined: passed ? "passed" : "failed",
                rollDisplay: { roll, total, dc: classDC, outcome: passed ? "passed" : "failed", label: `${saveLabel} save` },
                description: passed
                    ? `${crittedName} succeeds at its ${saveLabel} save — no effect.`
                    : `${crittedName} fails its ${saveLabel} save and is ${def.conditionLabel}.` });
        } else {
            const passed = saveSuccessChance(saveMod, classDC) >= 0.5;
            addNichePrompt({ ...base, mode: "avg", predetermined: passed ? "passed" : "failed",
                probability: saveSuccessChance(saveMod, classDC),
                description: passed
                    ? `${crittedName}'s ${saveLabel} save vs your class DC is most likely to succeed — no effect.`
                    : `${crittedName}'s ${saveLabel} save vs your class DC is most likely to fail, leaving it ${def.conditionLabel}.` });
        }
    });
}
