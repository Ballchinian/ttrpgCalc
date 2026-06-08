import { create } from 'zustand';
import { persist } from 'zustand/middleware';

//Persisted separately from battleData so recap survives round resets and page refreshes.
//Cleared explicitly via clearRecap (the "New Encounter" button).
export const useRecapStore = create(
    persist(
        (set) => ({
            recapHistory: {},

            addEntry: (round, entry) => set(state => {
                const updated = {
                    ...state.recapHistory,
                    [round]: [...(state.recapHistory[round] ?? []), entry],
                };
                //Cap at 20 rounds to keep localStorage usage bounded
                const keys = Object.keys(updated).map(Number).sort((a, b) => a - b);
                if (keys.length > 20) delete updated[keys[0]];
                return { recapHistory: updated };
            }),

            //Attach a crit spec result to the most recent entry of a round. Crit spec prompts resolve
            //right after their action (the "Turn Commence" button is disabled until they're cleared),
            //so the last entry of that round is always the action that triggered them.
            appendCritSpec: (round, impact) => set(state => {
                const entries = state.recapHistory[round];
                if (!entries?.length) return state;
                const lastIdx = entries.length - 1;
                const last = entries[lastIdx];
                const updatedEntry = { ...last, critSpecImpacts: [...(last.critSpecImpacts ?? []), impact] };
                const updatedEntries = entries.map((e, i) => i === lastIdx ? updatedEntry : e);
                return { recapHistory: { ...state.recapHistory, [round]: updatedEntries } };
            }),

            clearRecap: () => set({ recapHistory: {} }),
        }),
        { name: 'battleRecap_v2' } //_v2: stored recap shape changed (see battleData_v2)
    )
);
