import blankPicture from '../images/characterImages/blank character.png';

export function createBattleCharacter(char, side, displayName) {
    return {
        id: `${char.characterName}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sourceID: char._id,
        baseName: char.characterName,
        name: displayName ?? char.characterName,
        image: char.image || blankPicture,
        side,
        effects: [],
        offGuardSources: [],
        mapAttacks: 0,
        actionsRemaining: [true, true, true],
        stats: {
            ...char.stats,
            maxHealth: char.stats.health,
            currentHealth: char.stats.health,
        },
        resistances: char.resistances ?? [],
        weaknesses: char.weaknesses ?? [],
        immunities: char.immunities ?? [],
    };
}

export function applyRenames(parties, renames) {
    let { heroes, foes } = parties;
    renames.forEach(r => {
        if (r.side === "hero") heroes = heroes.map(c => c.id === r.id ? { ...c, name: r.name } : c);
        else foes = foes.map(c => c.id === r.id ? { ...c, name: r.name } : c);
    });
    return { heroes, foes };
}

export function resolveDisplayName(charName, heroes, foes) {
    const sameBase = [...heroes, ...foes].filter(c => c.baseName === charName);
    if (sameBase.length === 0) return { displayName: charName, renames: [] };

    const highestNum = sameBase.reduce((max, c) => {
        const m = c.name.match(/ (\d+)$/);
        return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);

    if (highestNum === 0) {
        //All existing entries are unnumbered, rename every one of them sequentially
        return {
            displayName: `${charName} ${sameBase.length + 1}`,
            renames: sameBase.map((c, i) => ({ id: c.id, side: c.side, name: `${charName} ${i + 1}` })),
        };
    }
    return { displayName: `${charName} ${highestNum + 1}`, renames: [] };
}
