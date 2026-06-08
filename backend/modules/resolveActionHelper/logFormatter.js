import { avgOfDice, diceFormat } from "../../utility/diceUtils.js";
import { effectModules } from "../effects/effectModules/effectModules.js";
import { OUTCOME_KEYS, OUTCOME_LABELS } from "../../data/outcomeDefs.js";

//Returns structured parts: text parts are plain strings, condition parts carry description for popover
const effectsParts = (effects, diceMode, isAttack = true) => {
    if (!effects?.length) return [{ type: "text", text: isAttack ? "Missed" : "No effect" }];
    return effects.map(e => {
        if (e.type === "damage") {
            const mult = e.multiplier && e.multiplier !== 1 ? ` ×${e.multiplier}` : "";
            if (diceMode === "avg") {
                //Use _rawDamage (resistance/weakness-adjusted) when available, fall back to raw avg
                const val = e._rawDamage ?? Math.round(avgOfDice(e.number, e.avgMultiplier ?? 1));
                if (e.damageType) {
                    return { type: "typedDamage", text: `~${val} (${e.damageType}) dmg`, value: `~${val}`, damageType: e.damageType, persistent: e.category === "persistent", suffix: " dmg", modifiers: e._damageModifiers ?? [] };
                }
                return { type: "text", text: `~${val} dmg` };
            }
            if (e._diceRolls) {
                const rollSum = e._diceRolls.reduce((s, r) => s + r, 0);
                const bonusSum = (e._bonusRolls ?? []).reduce((s, r) => s + r, 0);
                const mod = e._diceModifier ?? 0;
                const mul = e._diceMultiplier ?? 1;
                const total = Math.max(0, Math.floor((rollSum + bonusSum + mod) * mul));
                const rollStr = `[${e._diceRolls.join(", ")}]`;
                const bonusStr = e._bonusRolls?.length ? ` + [${e._bonusRolls.join(", ")}]` : "";
                const modStr = mod !== 0 ? ` ${mod >= 0 ? "+" : ""}${mod}` : "";
                const mulStr = mul !== 1 ? ` ×${mul}` : "";
                const tooltip = `${rollStr}${bonusStr}${modStr}${mulStr} = ${total}`;
                if (e.damageType) {
                    return { type: "typedDamage", text: `${diceFormat(e.number)}${mult} (${e.damageType}) dmg`, value: `${diceFormat(e.number)}${mult}`, damageType: e.damageType, persistent: e.category === "persistent", suffix: " dmg", modifiers: e._damageModifiers ?? [], tooltip };
                }
                return { type: "damage", text: `${diceFormat(e.number)}${mult} dmg`, tooltip };
            }
            if (e.damageType) {
                return { type: "typedDamage", text: `${diceFormat(e.number)}${mult} (${e.damageType}) dmg`, value: `${diceFormat(e.number)}${mult}`, damageType: e.damageType, persistent: e.category === "persistent", suffix: " dmg", modifiers: e._damageModifiers ?? [] };
            }
            return { type: "text", text: `${diceFormat(e.number)}${mult} dmg` };
        }
        if (e.type === "healing") {
            if (diceMode === "avg") return { type: "text", text: `~${avgOfDice(e.number, e.avgMultiplier)} heal` };
            const mult = e.multiplier && e.multiplier !== 1 ? ` ×${e.multiplier}` : "";
            if (e._diceRolls) {
                const rollSum = e._diceRolls.reduce((s, r) => s + r, 0);
                const bonusSum = (e._bonusRolls ?? []).reduce((s, r) => s + r, 0);
                const mod = e._diceModifier ?? 0;
                const mul = e._diceMultiplier ?? 1;
                const total = Math.max(0, Math.floor((rollSum + bonusSum + mod) * mul));
                const rollStr = `[${e._diceRolls.join(", ")}]`;
                const bonusStr = e._bonusRolls?.length ? ` + [${e._bonusRolls.join(", ")}]` : "";
                const modStr = mod !== 0 ? ` ${mod >= 0 ? "+" : ""}${mod}` : "";
                const mulStr = mul !== 1 ? ` ×${mul}` : "";
                const tooltip = `${rollStr}${bonusStr}${modStr}${mulStr} = ${total}`;
                return { type: "healing", text: `${diceFormat(e.number)}${mult} heal`, tooltip };
            }
            return { type: "text", text: `${diceFormat(e.number)}${mult} heal` };
        }
        if (e.type === "addCondition") {
            const suffix = e.adjustBy > 0 ? ` (${e.adjustBy}) applied` : ` applied`;
            return { type: "condition", name: e.condition, suffix, description: effectModules[e.condition.toLowerCase()]?.description ?? `${e.condition} condition` };
        }
        if (e.type === "removeCondition") {
            return { type: "condition", name: e.condition, suffix: " removed", description: effectModules[e.condition.toLowerCase()]?.description ?? `${e.condition} condition` };
        }
        return null;
    }).filter(Boolean);
};

const effectsSummary = (effects, diceMode, isAttack = true) => {
    const parts = effectsParts(effects, diceMode, isAttack);
    return parts.map(p => p.text ?? `${p.name}${p.suffix}`).join(", ") || (isAttack ? "Missed" : "No effect");
};

//Per-outcome summary for the popout: groups conditions, damage, healing in readable form
const outcomeSummary = (effects) => {
    if (!effects?.length) return "—";
    const adds = [], removes = [], damages = [], heals = [];
    effects.forEach(e => {
        if (e.type === "addCondition") {
            adds.push(e.adjustBy > 0 ? `${e.condition} (${e.adjustBy})` : e.condition);
        } else if (e.type === "removeCondition") {
            removes.push(e.condition);
        } else if (e.type === "damage") {
            const avg = e._rawDamage ?? avgOfDice(e.number, e.multiplier ?? 1);
            const typeLabel = e.damageType ? ` (${e.damageType})` : "";
            damages.push(`~${Math.round(avg)}${typeLabel} dmg`);
        } else if (e.type === "healing") {
            const avg = avgOfDice(e.number, e.multiplier ?? 1);
            heals.push(`~${avg} heal`);
        }
    });
    const parts = [];
    if (adds.length || removes.length) {
        const cp = [];
        if (adds.length) cp.push(`applies ${adds.join(", ")}`);
        if (removes.length) cp.push(`removes ${removes.join(", ")}`);
        parts.push(`Condition: ${cp.join(", ")}`);
    }
    if (damages.length) parts.push(`Damage: ${damages.join(", ")}`);
    if (heals.length) parts.push(`Heal: ${heals.join(", ")}`);
    return parts.join(". ") || "—";
};

const sign = v => v >= 0 ? `+${v}` : `${v}`;
const prettyName = n => n === "toHit" ? "to hit" : n.charAt(0).toUpperCase() + n.slice(1);

//Builds the left/right roll header for display
//reverseOutcome=false: actor rolls modifier vs target's DC (attacks, grapple, trip, etc.)
//reverseOutcome=true: target rolls their modifier vs actor's DC (spell saves)
const buildRollHeader = (entry) => {
    const { name: targetName, targetDC, rollModifier } = entry;

    if (!entry.reverseOutcome) {
        //Actor rolls; show actor's modifier on left, target's DC on right
        const dcLabel = targetDC.name === "ac"
            ? `AC: ${targetDC.value}`
            : `${prettyName(targetDC.name)} DC: ${targetDC.value}`;
        return {
            left: { label: `${entry.activeActorName}\n${prettyName(rollModifier.name)}: ${sign(rollModifier.value)}`, breakdown: rollModifier.breakdown ?? [] },
            right: { label: `${targetName}\n${dcLabel}`, breakdown: targetDC.breakdown ?? [] },
        };
    } else {
        //Target rolls; show actor's DC on left, target's modifier on right
        return {
            left: { label: `${entry.activeActorName}\nDC: ${targetDC.value}`, breakdown: targetDC.breakdown ?? [] },
            right: { label: `${targetName}\n${prettyName(rollModifier.name)}: ${sign(rollModifier.value)}`, breakdown: rollModifier.breakdown ?? [] },
        };
    }
};

//Interleaves ", " text parts between effect parts so BodyParts renders them separated
const withSeparators = parts => parts.flatMap((p, i) => i > 0 ? [{ type: "text", text: ", " }, p] : [p]);

//Flat structured parts for a single outcome's effects — used in the choose mode outcome tree
//Shows avg damage estimates and hoverable condition names with descriptions
const outcomeEffectParts = (effects) => {
    if (!effects?.length) return [{ type: "text", text: "—" }];
    const parts = effects.map(e => {
        if (e.type === "damage") {
            const val = e._rawDamage ?? avgOfDice(e.number, e.multiplier ?? 1);
            if (e.damageType) {
                return { type: "typedDamage", text: `~${Math.round(val)} (${e.damageType}) dmg`, value: `~${Math.round(val)}`, damageType: e.damageType, persistent: e.category === "persistent", suffix: " dmg", modifiers: e._damageModifiers ?? [] };
            }
            return { type: "text", text: `~${Math.round(val)} dmg` };
        }
        if (e.type === "healing") return { type: "text", text: `~${avgOfDice(e.number, e.multiplier ?? 1)} heal` };
        if (e.type === "addCondition") {
            const suffix = e.adjustBy > 0 ? ` (${e.adjustBy}) applied` : ` applied`;
            return { type: "condition", name: e.condition, suffix, description: effectModules[e.condition.toLowerCase()]?.description ?? `${e.condition} condition` };
        }
        if (e.type === "removeCondition") {
            return { type: "condition", name: e.condition, suffix: " removed", description: effectModules[e.condition.toLowerCase()]?.description ?? `${e.condition} condition` };
        }
        return null;
    }).filter(Boolean);
    return parts.length > 0 ? withSeparators(parts) : [{ type: "text", text: "—" }];
};

export const logFormatter = (actionInfo, diceMode) => {
    const lines = [];

    for (const entry of actionInfo) {
        if (entry.actionType === "automatic") {
            const displayName = entry.activeActorName ? `${entry.activeActorName} → ${entry.name}` : entry.name;
            lines.push({ name: displayName, body: effectsSummary(entry.effects, diceMode, false), bodyParts: withSeparators(effectsParts(entry.effects, diceMode, false)) });
            continue;
        }

        if (entry.actionType === "roll") {
            const roll = buildRollHeader(entry);
            //outcomeKey is from the active actor's POV, flip for saves so the log reads
            //from the defender's POV ("Goblin: Critical Failure" = goblin failed, not attacker crit succeeded)
            //reverseOutcome=true means target rolls (spell saves); fall back to DC name check for legacy entries
            const isSave = entry.reverseOutcome ?? (entry.targetDC?.name !== "ac");

            //Always build the full outcomes breakdown so the log can show all possibilities regardless of mode
            const c = entry.chanceOfOutcome ?? {};
            //Saves: show highest damage first (criticalFailure=max → criticalSuccess=none); attacks: criticalSuccess first
            const orderedKeys = isSave ? [...OUTCOME_KEYS].reverse() : OUTCOME_KEYS;
            //Keys are already roller's POV so labels need no flip; applyKey is used to look up resolvedOutcomes
            const outcomes = orderedKeys.map(key => ({
                label: OUTCOME_LABELS[key] ?? key,
                chance: Math.round((c[key] ?? 0) * 100),
                summary: outcomeSummary(entry.outcomeEffects?.[key]?.effects ?? []),
                summaryParts: outcomeEffectParts(entry.outcomeEffects?.[key]?.effects ?? []),
                applyKey: key,
            }));

            //For saves the target rolls their own save, for attacks the active actor rolls
            const roller = isSave ? entry.name : entry.activeActorName;

            let body, bodyParts;
            if (entry.isChooseMode) {
                body = "Choose your outcome";
            } else if (diceMode === "luck") {
                //outcomeKey is roller's POV — for saves that's target's POV, labels are correct as-is
                const label = OUTCOME_LABELS[entry.outcomeKey] ?? entry.outcomeKey;
                const prefix = `${roller} rolled ${entry.diceResult} (${label}). `;
                body = `${prefix}${effectsSummary(entry.effects, diceMode, !isSave)}`;
                bodyParts = [{ type: "text", text: prefix }, ...withSeparators(effectsParts(entry.effects, diceMode, !isSave))];
            } else {
                const label = OUTCOME_LABELS[entry.mostLikelyKey] ?? null;
                const prefix = label ? `(${label}). ` : "";
                body = `${prefix}${effectsSummary(entry.effects, diceMode, !isSave)}`;
                const parts = withSeparators(effectsParts(entry.effects, diceMode, !isSave));
                bodyParts = prefix ? [{ type: "text", text: prefix }, ...parts] : parts;
            }

            //Format: "Leon → Sam" so actor and target are both visible on the log line
            lines.push({ name: `${entry.activeActorName} → ${entry.name}`, roll, body, ...(bodyParts && { bodyParts }), outcomes, ...(entry.isChooseMode && { isChoosePending: true, targetId: entry.id }) });
        }
    }

    return {
        lines,
        mainLine: lines.map(l => `${l.name}: ${l.body}`).join("\n"),
    };
};
