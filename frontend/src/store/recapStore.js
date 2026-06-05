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

            clearRecap: () => set({ recapHistory: {} }),
        }),
        { name: 'battleRecap' }
    )
);
