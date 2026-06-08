//Character stats are namespaced (Foundry-aligned): { attributes, saves, perception, skills }.
//Resolution code refers to stats by flat NAME (e.g. "ac", "fortitude", "athletics"), so these
//helpers map a name to its group. Names are unique across groups, so a search is unambiguous.
//Runtime HP (currentHealth/maxHealth) and perception live at the top level.

const STAT_GROUPS = ["attributes", "saves", "skills"];

//Reads a stat by flat name from any namespace (or the top level).
export function getStat(stats, name) {
    if (!stats) return undefined;
    for (const group of STAT_GROUPS) {
        if (stats[group] && name in stats[group]) return stats[group][name];
    }
    return stats[name];
}

//Adds delta to a stat in place, in whichever namespace holds it. No-op if the stat doesn't exist.
export function addToStat(stats, name, delta) {
    for (const group of STAT_GROUPS) {
        if (stats[group] && name in stats[group]) {
            stats[group][name] = (stats[group][name] ?? 0) + delta;
            return;
        }
    }
    if (name in stats) stats[name] = (stats[name] ?? 0) + delta;
}
