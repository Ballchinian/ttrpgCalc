//PF2e temporary Hit Points: damage depletes temp HP before real HP, and temp HP from a new
//source doesn't stack - you keep the higher pool. These helpers are pure (no mutation) and are
//mirrored on the backend in backend/utility/hpPools.js - keep the two in sync.

//Applies `amount` of damage to a stats object's pools (temp HP first, then currentHealth).
//Returns the post-damage { tempHP, currentHealth } (currentHealth floored at 0); does not mutate.
export function applyDamageToPools(stats, amount) {
    const dmg = Math.max(0, amount ?? 0);
    const startTemp = Math.max(0, stats?.tempHP ?? 0);
    const absorbed = Math.min(startTemp, dmg);
    const tempHP = startTemp - absorbed;
    const currentHealth = Math.max(0, (stats?.currentHealth ?? 0) - (dmg - absorbed));
    return { tempHP, currentHealth };
}

//Grants `value` temp HP, keeping the higher of the existing pool and the new value (PF2e: no stack).
//Returns a new stats object.
export function grantTempHP(stats, value) {
    return { ...stats, tempHP: Math.max(stats?.tempHP ?? 0, Math.max(0, value ?? 0)) };
}
