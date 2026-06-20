export default {
    name: "rage",
    //value holds the rage damage bonus (set by the Rage action / config) - no level cap
    maxLevel: "infinite",
    //Class state, not a formal PF2e condition (drives the UI badge distinction)
    category: "effect",
    defaultDuration: { type: "manual" },
    //Rage damage: a flat bonus to melee & unarmed Strikes equal to the stored value, matching the
    //weapon's damage type. Doubles on a crit like the rest of the Strike (see injectStrikeAugments).
    strikeDamage: { kind: "flat", fromValue: true, category: "untyped", damageType: "same", filter: [{ melee: true }], label: "Rage" },
    description: `You're filled with rage. While raging you deal this much additional damage on melee and unarmed Strikes, gain temporary HP, and can't use most concentrate actions. Lasts about a minute (remove when you stop raging).`,
};
