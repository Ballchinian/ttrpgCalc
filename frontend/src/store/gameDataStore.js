import { create } from 'zustand';
import { apiFetch } from '../auth';
import { BACKEND_BASE_URL } from '../config';

//Non persisted store for data fetched from the backend on mount.
//Separated from battleStore so static reference data doesn't bloat the persisted key.
const toSpellData = (items) =>
    (items.spells || []).map(s => ({ name: s.name, targetType: s.targetType, actionCost: s.actionCost }));

export const useGameDataStore = create((set, get) => ({
    characterList: [],
    globalActionNames: [],
    globalActions: {},
    globalEffects: [],
    offGuardActions: [],
    spellData: [],
    allItems: {},
    traitDefs: {},
    damageTypes: [],
    fetchError: "",
    loading: false,

    //Fetches all static game data in parallel on mount
    fetchGameData: async () => {
        if (get().loading) return;
        set({ loading: true, fetchError: "" });
        try {
            //Tag each fetch with its endpoint name so errors identify which source failed
            const safeJson = async (res, endpoint) => {
                if (!res) throw new Error(`Auth redirect on ${endpoint}`);
                if (!res.ok) throw new Error(`Server error ${res.status} on ${endpoint}`);
                return res.json();
            };

            const [characters, globalActionsJson, effects, offGuard, allItemsJson, traitData, damageTypesData] = await Promise.all([
                apiFetch(`${BACKEND_BASE_URL}/characters`).then(r => safeJson(r, "characters")),
                apiFetch(`${BACKEND_BASE_URL}/actions/globalActions`).then(r => safeJson(r, "globalActions")),
                apiFetch(`${BACKEND_BASE_URL}/actions/effects`).then(r => safeJson(r, "effects")),
                apiFetch(`${BACKEND_BASE_URL}/actions/globalOffGuardEffects`).then(r => safeJson(r, "offGuard")),
                apiFetch(`${BACKEND_BASE_URL}/actions`).then(r => safeJson(r, "actions")),
                apiFetch(`${BACKEND_BASE_URL}/actions/traitModules`).then(r => safeJson(r, "traitModules")),
                apiFetch(`${BACKEND_BASE_URL}/actions/damageTypes`).then(r => safeJson(r, "damageTypes")),
            ]);

            set({
                loading: false,
                characterList: Array.isArray(characters) ? characters : Object.values(characters),
                globalActions: globalActionsJson,
                globalActionNames: Object.keys(globalActionsJson),
                globalEffects: effects,
                offGuardActions: offGuard,
                allItems: allItemsJson,
                traitDefs: traitData,
                damageTypes: damageTypesData,
                spellData: toSpellData(allItemsJson),
            });
        } catch (err) {
            console.error("Failed to load game data:", err);
            set({ loading: false, fetchError: "Failed to load game data. Please refresh." });
        }
    },

    //Updates or inserts a single character in the list after a CharacterDesign save
    upsertCharacter: (char) => set(state => ({
        characterList: state.characterList.some(c => c._id === char._id)
            ? state.characterList.map(c => c._id === char._id ? char : c)
            : [...state.characterList, char],
    })),

    //Re-fetches only /actions to keep allItems and spellData in sync after creates/edits/renames in the builder
    refreshItems: async () => {
        try {
            const res = await apiFetch(`${BACKEND_BASE_URL}/actions`);
            if (!res?.ok) return;
            const allItemsJson = await res.json();
            set({ allItems: allItemsJson, spellData: toSpellData(allItemsJson) });
        } catch { /* ignore, stale cache is non-fatal */ }
    },

    //Returns the MAP penalty and whether the action counts as an attack, based on its traits
    getActionTraits: (actionName) => {
        const { globalActions, allItems, traitDefs } = get();
        const defaults = { mapPenalty: 5, countsAsAttack: false };
        if (!actionName) return defaults;

        const traits = (
            globalActions[actionName]?.traits ??
            allItems.weapons?.find(w => w.name === actionName)?.traits ??
            allItems.spells?.find(s => s.name === actionName)?.traits ??
            []
        );

        const profile = { ...defaults };
        traits.forEach(t => {
            const effects = traitDefs[t.name ?? t]?.effects;
            if (effects) Object.assign(profile, effects);
        });
        return profile;
    },
}));
