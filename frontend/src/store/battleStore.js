import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBattleCharacter, applyRenames, resolveDisplayName } from './battleStoreUtils';
import { OFF_GUARD } from '../data/effectNames';

const defaultState = {
    parties: { heroes: [], foes: [] },
    target: { mode: null, activeActor: null, selectedTargetCharacters: [] },
    action: { selected: "", selectedType: "", targetType: "", choosing: false },
    settings: {
        diceMode: "avg",
        autoActions: true,
        autoMAP: true,
        autoDecrementConditions: true,
        ignoreHP: false,
        showDamageModifiers: true,
    },
    round: 1,
    log: {},
    error: "",
    pendingAction: null,
    expiringConditions: [],
    persistCheckResults: [],
};


export const useBattleStore = create(
    persist(
        (set, get) => ({
            ...defaultState,

            //Character management

            addHero: (char) => set(state => {
                const { displayName, renames } = resolveDisplayName(char.characterName, state.parties.heroes, state.parties.foes);
                const { heroes, foes } = applyRenames(state.parties, renames);
                return { parties: { ...state.parties, heroes: [...heroes, createBattleCharacter(char, "hero", displayName)], foes } };
            }),

            addFoe: (char) => set(state => {
                const { displayName, renames } = resolveDisplayName(char.characterName, state.parties.heroes, state.parties.foes);
                const { heroes, foes } = applyRenames(state.parties, renames);
                return { parties: { ...state.parties, foes: [...foes, createBattleCharacter(char, "foe", displayName)], heroes } };
            }),

            //Applies an updater function to a specific character; also keeps selectedTargetCharacters in sync
            updateCharacterInList: (side, id, updater) => set(state => {
                const key = side === "hero" ? "heroes" : "foes";
                const updatedList = state.parties[key].map(c => c.id === id ? updater(c) : c);
                const syncedTargets = state.target.selectedTargetCharacters.map(t =>
                    t.id === id && t.side === side ? (updatedList.find(c => c.id === id) || t) : t
                );
                return {
                    parties: { ...state.parties, [key]: updatedList },
                    target: { ...state.target, selectedTargetCharacters: syncedTargets },
                };
            }),

            deleteCharacterFromList: (side, id) => set(state => {
                const key = side === "hero" ? "heroes" : "foes";
                const nextTarget = { ...state.target };
                if (nextTarget.activeActor?.id === id) nextTarget.activeActor = null;
                nextTarget.selectedTargetCharacters = (nextTarget.selectedTargetCharacters || []).filter(t => t.id !== id);
                return {
                    parties: { ...state.parties, [key]: state.parties[key].filter(c => c.id !== id) },
                    target: nextTarget,
                };
            }),

            //Round management

            endRound: () => set(state => {
                //Apply resistance/weakness/immunity to a raw damage value (mirrors backend actionResolution)
                const applyMods = (raw, damageType, char) => {
                    if (!damageType || raw <= 0) return raw;
                    const t = damageType.toLowerCase();
                    if ((char.immunities ?? []).some(i => i.toLowerCase() === t)) return 0;
                    const res = (char.resistances ?? []).find(r => r.damageType.toLowerCase() === t);
                    const wk  = (char.weaknesses  ?? []).find(w => w.damageType.toLowerCase() === t);
                    let dmg = res ? Math.max(0, raw - res.value) : raw;
                    if (wk) dmg += wk.value;
                    return dmg;
                };

                //Collected across all characters; accessible by processChar via closure
                const allFlatCheckResults = [];

                const processChar = (char) => {
                    //Apply persistent damage first, then handle flat checks and effect cleanup
                    let workChar = char;
                    if (state.settings.autoDecrementConditions) {
                        const persistEffects = (char.effects || []).filter(e => e.name.startsWith("persistent ") && e.number > 0);
                        if (persistEffects.length > 0) {
                            const persistTotal = persistEffects.reduce((sum, e) => {
                                const type = e.damageType ?? e.name.replace("persistent ", "");
                                return sum + applyMods(e.number, type, char);
                            }, 0);
                            if (persistTotal > 0) {
                                workChar = { ...char, stats: { ...char.stats, currentHealth: Math.max(0, (char.stats?.currentHealth ?? 0) - persistTotal) } };
                            }

                            //Roll DC 15 flat check for effects using the flatCheck duration
                            const toRemove = new Set();
                            persistEffects
                                .filter(e => e.duration?.type === "flatCheck")
                                .forEach(e => {
                                    const roll = Math.floor(Math.random() * 20) + 1;
                                    const recovered = roll >= 15;
                                    allFlatCheckResults.push({
                                        charName: char.name,
                                        effectName: e.name,
                                        amount: e.number,
                                        damageType: e.damageType ?? e.name.replace("persistent ", ""),
                                        roll,
                                        recovered,
                                    });
                                    if (recovered) toRemove.add(e.name);
                                });
                            if (toRemove.size > 0) {
                                workChar = { ...workChar, effects: (workChar.effects || []).filter(ef => !toRemove.has(ef.name)) };
                            }
                        }
                    }

                    const filteredEffects = state.settings.autoDecrementConditions
                        ? workChar.effects
                            .map(e => {
                                if (e.duration?.type === "decrement") return { ...e, number: e.number - 1 };
                                if (e.duration?.type === "rounds") return { ...e, duration: { ...e.duration, remaining: (e.duration.remaining ?? 1) - 1 } };
                                return e;
                            })
                            .filter(e => {
                                if (e.duration?.type === "endOfRound")    return false;
                                if (e.duration?.type === "currentTurn")   return false; //also clears at round end
                                if (e.duration?.type === "decrement")     return e.number > 0;
                                if (e.duration?.type === "rounds")        return (e.duration.remaining ?? 0) > 0;
                                if (e.duration?.type === "endOfNextTurn") return true;
                                if (e.duration?.type === "manual")        return true;
                                if (e.duration?.type === "flatCheck")     return true; //stays until flat check succeeds
                                return false; //unknown type, drop rather than accumulate forever
                            })
                        : workChar.effects;

                    //Sync offGuardSources: remove any source whose condition was dropped by the filter
                    const keptNames = new Set(filteredEffects.map(e => e.name));
                    const newSources = (workChar.offGuardSources || []).filter(src => keptNames.has(src));
                    const finalEffects = newSources.length === 0
                        ? filteredEffects.filter(e => e.name !== OFF_GUARD)
                        : filteredEffects;

                    return {
                        ...workChar,
                        actionsRemaining: [true, true, true],
                        mapAttacks: 0,
                        effects: finalEffects,
                        offGuardSources: newSources,
                    };
                };
                return {
                    round: (state.round ?? 1) + 1,
                    log: {},
                    error: "",
                    pendingAction: null,
                    parties: {
                        heroes: state.parties.heroes.map(processChar),
                        foes: state.parties.foes.map(processChar),
                    },
                    persistCheckResults: allFlatCheckResults,
                };
            }),

            clearPersistChecks: () => set({ persistCheckResults: [] }),

            //Settings

            updateSetting: (key, value) => set(state => ({
                settings: { ...state.settings, [key]: value },
                //Switching dice mode clears the log since results are mode-specific
                ...(key === "diceMode" && { log: {} }),
            })),

            //Target and action selection

            toggleTargetActiveActor: () => set(state => ({
                //MAP is NOT reset here, it persists across re-selections of the same actor
                //within a round, only resetting when a DIFFERENT actor takes a turn or at endRound
                action: { selected: "", selectedType: "", targetType: "", choosing: false },
                target: {
                    mode: state.target.mode === "activeActor" ? null : "activeActor",
                    activeActor: null,
                    selectedTargetCharacters: [],
                },
            })),

            toggleTargetCharacters: () => set(state => ({
                target: {
                    ...state.target,
                    mode: state.target.mode === "targetCharacters" ? null : "targetCharacters",
                    //Intentionally do NOT clear selectedTargetCharacters, exiting select mode keeps your picks
                },
            })),

            //Handles clicks on character cards for both activeActor and target selection modes
            selectTarget: (side, id, sourceID) => set(state => {
                const { selectedTargetCharacters, mode } = state.target;
                if (!mode) return {};

                const charList = side === "hero" ? state.parties.heroes : state.parties.foes;
                const selectedChar = charList.find(c => c.id === id);

                if (mode === "activeActor") {
                    const prev = state.target.activeActor;
                    const isSameActor = prev && prev.id === id;
                    let updatedParties = state.parties;

                    if (!isSameActor) {
                        //Reset MAP on the previous actor when switching to a DIFFERENT actor
                        if (prev) {
                            const key = prev.side === "hero" ? "heroes" : "foes";
                            updatedParties = {
                                ...updatedParties,
                                [key]: updatedParties[key].map(c => c.id === prev.id ? { ...c, mapAttacks: 0 } : c),
                            };
                        }
                        //Clear "currentTurn" conditions from all characters, they belong to the previous actor's turn
                        const clearCurrent = char => ({
                            ...char,
                            effects: (char.effects || []).filter(e => e.duration?.type !== "currentTurn"),
                        });
                        updatedParties = {
                            heroes: updatedParties.heroes.map(clearCurrent),
                            foes: updatedParties.foes.map(clearCurrent),
                        };
                    }

                    //Check for endOfNextTurn conditions, only when auto condition tracking is on
                    //Only triggers on a subsequent round (appliedRound < currentRound)
                    const newActorId = selectedChar?.id || id;
                    const expiringConditions = [];
                    if (state.settings.autoDecrementConditions) {
                        ["heroes", "foes"].forEach(k => {
                            updatedParties[k].forEach(char => {
                                (char.effects || []).forEach(effect => {
                                    if (effect.duration?.type === "endOfNextTurn" &&
                                        effect.duration.actorId === newActorId &&
                                        effect.duration.appliedRound < state.round) {
                                        expiringConditions.push({ charId: char.id, charName: char.name, charSide: char.side, effectName: effect.name, effectNumber: effect.number, actorName: effect.duration.actorName });
                                    }
                                });
                            });
                        });
                    }
                    return {
                        parties: updatedParties,
                        target: { ...state.target, activeActor: selectedChar || { side, id, sourceID }, mode: null },
                        expiringConditions,
                    };
                }

                if (mode === "targetCharacters") {
                    const alreadySelected = selectedTargetCharacters.find(c => c.side === side && c.id === id);
                    if (alreadySelected) {
                        return { target: { ...state.target, selectedTargetCharacters: selectedTargetCharacters.filter(c => !(c.side === side && c.id === id)) } };
                    }
                    //Single target: always replace rather than append so re-entering mode cant stack targets
                    const base = state.action.targetType === "single" ? [] : selectedTargetCharacters;
                    const newTargets = [...base, selectedChar || { side, id, sourceID }];
                    const exitMode = state.action.targetType === "single";
                    return { target: { ...state.target, selectedTargetCharacters: newTargets, mode: exitMode ? null : state.target.mode } };
                }

                return {};
            }),

            //actionName: selected name; targetType: precomputed by caller; selectedType: "weapon"|"spell"|"global_action"
            setSelectedAction: (selected, targetType, selectedType = "") => set(state => {
                const prevTargetType = state.action.targetType;
                //Clear targets when: going to self (auto-targets actor), or downgrading aoe→single
                //(aoe may have multiple targets selected; single only allows one)
                //Upgrading single→aoe or keeping the same type preserves the existing selection.
                const clearTargets =
                    targetType === "self" ||
                    (prevTargetType === "aoe" && targetType === "single");
                return {
                    action: { ...state.action, selected, selectedType, targetType },
                    target: {
                        ...state.target,
                        mode: null,
                        selectedTargetCharacters: clearTargets ? [] : state.target.selectedTargetCharacters,
                    },
                };
            }),

            setChoosingAction: (choosing) => set(state => ({ action: { ...state.action, choosing } })),

            //Log & error

            setLog: (log) => set({ log }),
            setError: (error) => set({ error }),
            setPendingAction: (data) => set({ pendingAction: data }),
            clearPendingAction: () => set({ pendingAction: null }),

            //Remove one entry from the expiring notification; if action is "remove" also strips the condition from the character
            dismissExpiringCondition: (charId, effectName, action) => set(state => {
                const remaining = state.expiringConditions.filter(e => !(e.charId === charId && e.effectName === effectName));
                if (action !== "remove") return { expiringConditions: remaining };
                const entry = state.expiringConditions.find(e => e.charId === charId && e.effectName === effectName);
                if (!entry) return { expiringConditions: remaining };
                const key = entry.charSide === "hero" ? "heroes" : "foes";
                if (!state.parties[key].some(c => c.id === charId)) return { expiringConditions: remaining };
                const updatedList = state.parties[key].map(c =>
                    c.id === charId ? { ...c, effects: (c.effects || []).filter(e => e.name !== effectName) } : c
                );
                const syncedTargets = state.target.selectedTargetCharacters.map(t =>
                    t.id === charId && t.side === entry.charSide ? (updatedList.find(c => c.id === charId) || t) : t
                );
                return {
                    parties: { ...state.parties, [key]: updatedList },
                    target: { ...state.target, selectedTargetCharacters: syncedTargets },
                    expiringConditions: remaining,
                };
            }),

            //Clears error and exits target mode, called just before resolving a turn
            resetTargetMode: () => set(state => ({ target: { ...state.target, mode: null }, error: "" })),

            //Action economy

            canSpendActions: (ref, cost) => {
                const char = get().getCharByRef(ref);
                if (!char) return false;
                return char.actionsRemaining.filter(Boolean).length >= cost;
            },

            spendActions: ({ side, id }, cost) => {
                get().updateCharacterInList(side, id, c => {
                    const next = [...c.actionsRemaining];
                    for (let i = 0; i < cost; i++) {
                        const idx = next.lastIndexOf(true);
                        if (idx !== -1) next[idx] = false;
                    }
                    return { ...c, actionsRemaining: next };
                });
            },

            //Utilities

            getCharByRef: (ref) => {
                if (!ref) return null;
                const { parties } = get();
                const list = ref.side === "hero" ? parties.heroes : parties.foes;
                return list.find(c => c.id === ref.id) || null;
            },

            //Reads weapon/spell selections for the active actor from battleSession localStorage key
            getLocalActionNames: () => {
                const { target, parties } = get();
                const activeActor = target.activeActor
                    ? (target.activeActor.side === "hero" ? parties.heroes : parties.foes)
                        .find(c => c.id === target.activeActor.id)
                    : null;
                try {
                    const session = JSON.parse(localStorage.getItem("battleSession") || "{}");
                    const actorSession = session?.[activeActor?.sourceID];
                    return {
                        selectedWeapons: Array.isArray(actorSession?.selectedWeapons) ? actorSession.selectedWeapons : [],
                        selectedSpells:  Array.isArray(actorSession?.selectedSpells)  ? actorSession.selectedSpells  : [],
                    };
                } catch (err) {
                    console.warn("Failed to parse battleSession:", err);
                    return { selectedWeapons: [], selectedSpells: [] };
                }
            },

            //Updates base stats for all persisted party members from fresh DB data, preserving live battle state
            syncPartyStats: (freshChars) => set(state => {
                const bySourceID = Object.fromEntries(freshChars.map(c => [c._id, c]));
                const syncChar = (char) => {
                    const fresh = bySourceID[char.sourceID];
                    if (!fresh) return char;
                    return {
                        ...char,
                        stats: {
                            ...fresh.stats,
                            maxHealth: fresh.stats.health,
                            currentHealth: char.stats.currentHealth,
                        },
                        resistances: fresh.resistances ?? [],
                        weaknesses: fresh.weaknesses ?? [],
                        immunities: fresh.immunities ?? [],
                    };
                };
                return {
                    parties: {
                        heroes: state.parties.heroes.map(syncChar),
                        foes:   state.parties.foes.map(syncChar),
                    },
                };
            }),

            //Used by "New Encounter", clears recap is handled by recapStore
            resetRound: () => set({ round: 1 }),

            //Resets all battle state except settings; recap clearing is handled by recapStore
            resetBattle: () => set({
                parties: { heroes: [], foes: [] },
                target: { mode: null, activeActor: null, selectedTargetCharacters: [] },
                action: { selected: "", selectedType: "", targetType: "", choosing: false },
                round: 1,
                log: {},
                error: "",
                pendingAction: null,
                expiringConditions: [],
                persistCheckResults: [],
            }),
        }),
        {
            name: 'battleData',
            //Only persist the state shape, not the action functions
            partialize: (state) => ({
                parties: state.parties,
                target: {
                    activeActor: state.target.activeActor,
                    selectedTargetCharacters: state.target.selectedTargetCharacters,
                    //mode excluded: UI selection mode that must reset on reload
                },
                action: {
                    selected: state.action.selected,
                    selectedType: state.action.selectedType,
                    targetType: state.action.targetType,
                    //choosing excluded: transient search-picker visibility flag
                },
                settings: state.settings,
                round: state.round,
                //log, error, pendingAction, expiringConditions, persistCheckResults excluded: transient UI state
            }),
        }
    )
);
