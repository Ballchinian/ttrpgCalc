import { useBattleStore } from '../store/battleStore';
import { useRecapStore } from '../store/recapStore';
import { useGameDataStore } from '../store/gameDataStore';
import { manageOffGuardFrontend } from '../components/utility/manageOffGuard';
import { buildRecapEntry } from './buildRecapEntry';
import { isCoveredByHigher, supersededBy } from '../data/conditionHierarchy';

//Stamps actor context onto an endOfNextTurn duration that hasn't been hydrated yet
function hydrateDuration(duration, recapContext) {
    if (duration?.type !== "endOfNextTurn" || duration.actorId) return duration ?? { type: "manual" };
    if (!recapContext) return duration;
    return { type: "endOfNextTurn", actorId: recapContext.actorId, actorName: recapContext.actorName, appliedRound: recapContext.round };
}

//Hydrates all endOfNextTurn conditions in an effects array
function hydrateEffects(effects, recapContext) {
    return effects.map(e => e.duration ? { ...e, duration: hydrateDuration(e.duration, recapContext) } : e);
}

//Applies the current pendingAction to characters and recap.
//applyKey: outcome key string for choose mode, null for auto modes (luck/avg)
//targetId: specific target to resolve in choose mode, each target picks independently
export function applyPendingAction(applyKey = null, targetId = null) {
    const { pendingAction, updateCharacterInList, clearPendingAction, setPendingAction, log, setLog } = useBattleStore.getState();
    const { addEntry } = useRecapStore.getState();

    if (!pendingAction) return;

    const { mode, recapContext } = pendingAction;

    if (mode === "auto") {
        //Luck/avg: backend already resolved everything, apply updated targets directly
        //Also hydrate endOfNextTurn conditions, backend doesn't know actorId or round
        const { offGuardActions } = useGameDataStore.getState();
        pendingAction.updatedTargets.forEach(updated => {
            updateCharacterInList(updated.side, updated.id, c => {
                let merged = {
                    ...c,
                    ...updated,
                    stats: pendingAction.ignoreHP
                        ? { ...updated.stats, currentHealth: c.stats.currentHealth }
                        : updated.stats,
                    actionsRemaining: c.actionsRemaining,
                };
                merged.effects = hydrateEffects(merged.effects || [], recapContext);
                //Sync off-guard for conditions added or removed by the backend result
                const prevNames = new Set((c.effects || []).map(e => e.name));
                const newNames = new Set(merged.effects.map(e => e.name));
                offGuardActions.forEach(condName => {
                    const was = prevNames.has(condName);
                    const is  = newNames.has(condName);
                    if (!was && is)  merged = manageOffGuardFrontend(merged, condName, "add");
                    if (was  && !is) merged = manageOffGuardFrontend(merged, condName, "remove");
                });
                return merged;
            });
        });

        //When ignoreHP=true, backend HP is capped by floor/ceiling but we want uncapped totals in the recap.
        //Let theoreticalHP go below 0 or above maxHealth — buildRecapEntry's Math.max(0, ...) handles display clamping.
        const recapTargets = pendingAction.ignoreHP
            ? pendingAction.updatedTargets.map(updated => {
                const before = recapContext.targetsBefore.find(t => t.id === updated.id);
                const stats = (recapContext.actionStats ?? {})[updated.id] ?? {};
                if (!before || (stats.rawDamage === undefined && stats.rawHealing === undefined)) return updated;
                const theoreticalHP = before.stats.currentHealth - (stats.rawDamage ?? 0) + (stats.rawHealing ?? 0);
                return { ...updated, stats: { ...updated.stats, currentHealth: theoreticalHP } };
            })
            : pendingAction.updatedTargets;

        const entry = buildRecapEntry(
            recapContext.actorName,
            recapContext.actionName,
            recapContext.actorEffects,
            recapContext.targetsBefore,
            recapTargets,
            recapContext.actionStats ?? {},
        );
        addEntry(recapContext.round, entry);
        clearPendingAction();

    } else {
        //Choose mode: apply pre-resolved effects for the chosen outcome to a specific target
        const target = pendingAction.perTarget.find(t => t.id === targetId);
        if (!target) return;

        const effects = target.resolvedOutcomes?.[applyKey];
        if (!effects) {
            console.warn("applyPendingAction: unknown applyKey", applyKey);
            return;
        }

        //When ignoreHP is on, HP won't change in the store, but we still want the recap to show damage.
        //Compute what HP would be and carry it forward in theoreticalHPs so buildRecapEntry can use it.
        let theoreticalHPs = pendingAction.theoreticalHPs ?? {};
        if (pendingAction.ignoreHP) {
            const { parties: currentParties } = useBattleStore.getState();
            const charList = target.side === "hero" ? currentParties.heroes : currentParties.foes;
            const char = charList.find(c => c.id === targetId);
            if (char) {
                theoreticalHPs = { ...theoreticalHPs, [targetId]: computeTheoreticalHP(char, effects) };
            }
        }

        updateCharacterInList(target.side, target.id, c => applyEffectsToChar(c, effects, recapContext, pendingAction.ignoreHP));

        //Update that target's log line to show the chosen outcome
        const updatedLines = (log.lines || []).map(line => {
            if (!line.isChoosePending || line.targetId !== targetId) return line;
            const chosen = line.outcomes?.find(o => o.applyKey === applyKey);
            const resolvedLabel = chosen?.label ?? applyKey;
            const resolvedPrefix = `(${resolvedLabel}). `;
            const resolvedParts = chosen?.summaryParts;
            return {
                ...line,
                isChoosePending: false,
                body: `${resolvedPrefix}${chosen?.summary ?? "—"}`,
                ...(resolvedParts?.length > 0 && { bodyParts: [{ type: "text", text: resolvedPrefix }, ...resolvedParts] }),
            };
        });
        setLog({ ...log, lines: updatedLines });

        const remaining = pendingAction.perTarget.filter(t => t.id !== targetId);
        const updatedChosenOutcomes = { ...pendingAction.chosenOutcomes, [targetId]: applyKey };

        if (remaining.length > 0) {
            //Other targets still need choices, keep pendingAction alive with remaining list + accumulated theoreticalHPs
            setPendingAction({ ...pendingAction, perTarget: remaining, chosenOutcomes: updatedChosenOutcomes, theoreticalHPs });
            return;
        }

        //All targets resolved, read updated states from store and build recap
        const { parties } = useBattleStore.getState();
        const updatedTargets = recapContext.targetsBefore.map(snap => {
            if (snap.side !== "hero" && snap.side !== "foe") {
                console.warn("applyPendingAction: unknown side", snap.side, snap.id);
                return snap;
            }
            const list = snap.side === "hero" ? parties.heroes : parties.foes;
            let found = list.find(c => c.id === snap.id);
            if (!found) {
                console.warn("applyPendingAction: target not found after resolution", snap.id);
                return snap;
            }
            //When ignoreHP is on, substitute theoretical HP so recap shows meaningful damage instead of 0
            if (pendingAction.ignoreHP && theoreticalHPs[snap.id] !== undefined) {
                found = { ...found, stats: { ...found.stats, currentHealth: theoreticalHPs[snap.id] } };
            }
            return found;
        });

        const entry = buildRecapEntry(
            recapContext.actorName,
            recapContext.actionName,
            recapContext.actorEffects,
            recapContext.targetsBefore,
            updatedTargets,
            recapContext.actionStats ?? {},
            updatedChosenOutcomes,
        );
        addEntry(recapContext.round, entry);
        clearPendingAction();
    }
}

//Returns what HP a character would have after applying effects, without writing to the store.
//Intentionally uncapped: let HP go negative (overkill) or above max (overheal) so
//buildRecapEntry's Math.max(0, prevHP - newHP) sees the full damage, not just remaining HP.
function computeTheoreticalHP(char, effects) {
    let hp = char.stats.currentHealth;
    effects.forEach(effect => {
        if (effect.type === "damage" && effect.resolvedValue !== undefined) {
            hp -= effect.resolvedValue;
        } else if (effect.type === "healing" && effect.resolvedValue !== undefined) {
            hp += effect.resolvedValue;
        }
    });
    return hp;
}

//Applies a list of pre-resolved effects to a character and returns the updated character
function applyEffectsToChar(char, effects, recapContext, ignoreHP = false) {
    const { offGuardActions } = useGameDataStore.getState();
    let updated = { ...char, stats: { ...char.stats }, effects: [...(char.effects || [])] };

    effects.forEach(effect => {
        if (effect.type === "damage") {
            if (ignoreHP) return;
            if (effect.resolvedValue !== undefined) {
                updated = { ...updated, stats: { ...updated.stats, currentHealth: Math.max(0, updated.stats.currentHealth - effect.resolvedValue) } };
            } else {
                console.warn("applyEffectsToChar: damage effect missing resolvedValue", effect);
            }

        } else if (effect.type === "healing") {
            if (ignoreHP) return;
            if (effect.resolvedValue !== undefined) {
                //Fall back to currentHealth (no-op) rather than Infinity to prevent HP becoming unbounded
                const maxHealth = updated.stats.maxHealth ?? updated.stats.currentHealth ?? 0;
                updated = { ...updated, stats: { ...updated.stats, currentHealth: Math.min(maxHealth, updated.stats.currentHealth + effect.resolvedValue) } };
            } else {
                console.warn("applyEffectsToChar: healing effect missing resolvedValue", effect);
            }

        } else if (effect.type === "addCondition") {
            const condName = effect.condition.toLowerCase();
            //Persistent damage conditions: immunity blocks application; damageType stored for endRound
            if (condName.startsWith("persistent ") && effect.damageType) {
                const type = effect.damageType.toLowerCase();
                if ((updated.immunities ?? []).some(i => i.toLowerCase() === type)) return;
                const duration = hydrateDuration(effect.duration, recapContext);
                const existing = updated.effects.find(e => e.name === condName);
                if (existing) {
                    //PF2e: same damage type doesn't stack — keep the higher amount
                    const newNumber = Math.max(existing.number, effect.adjustBy ?? 1);
                    if (newNumber > existing.number) {
                        updated.effects = updated.effects.map(e =>
                            e.name === condName ? { ...e, number: newNumber, duration } : e
                        );
                    }
                } else {
                    updated.effects = [...updated.effects, {
                        name: condName, number: effect.adjustBy || 1,
                        damageType: type, duration,
                    }];
                }
                return;
            }
            //Skip if a more severe condition already makes this one redundant (e.g. grabbed when restrained is present)
            if (isCoveredByHigher(condName, updated.effects)) return;
            const duration = hydrateDuration(effect.duration, recapContext);
            const existing = updated.effects.find(e => e.name === condName);
            if (existing) {
                //Apply highest level; always refresh duration (PF2e: reapplication refreshes duration)
                const newNumber = Math.max(existing.number, effect.adjustBy ?? 1);
                updated.effects = updated.effects.map(e =>
                    e.name === condName ? { ...e, number: newNumber, duration } : e
                );
            } else {
                //Remove less-severe conditions this one supersedes (e.g. remove grabbed when applying restrained)
                const toRemove = new Set(supersededBy(condName));
                if (toRemove.size) updated.effects = updated.effects.filter(e => !toRemove.has(e.name));
                updated.effects = [...updated.effects, { name: condName, number: effect.adjustBy || 1, duration }];
                //Sync off-guard sources when conditions that grant off-guard are applied (e.g. prone, grabbed)
                if (offGuardActions.includes(condName)) {
                    updated = manageOffGuardFrontend(updated, condName, "add");
                }
            }

        } else if (effect.type === "removeCondition") {
            const condName = effect.condition.toLowerCase();
            updated.effects = updated.effects.filter(e => e.name !== condName);
            //Sync off-guard sources on removal too
            if (offGuardActions.includes(condName)) {
                updated = manageOffGuardFrontend(updated, condName, "remove");
            }
        }
    });

    return updated;
}
