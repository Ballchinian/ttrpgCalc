export default {
    name: "arcane-cascade",
    //value holds the bonus damage (default 1; some feats raise it) - no level cap
    maxLevel: "infinite",
    //A stance, not a formal PF2e condition (drives the UI badge distinction)
    category: "stance",
    defaultDuration: { type: "manual" },
    //Arcane Cascade adds this much damage to each Strike (approximated as the weapon's damage type;
    //the true type tracks your last spell - refine via the Magus action's config when wired).
    strikeDamage: { kind: "flat", fromValue: true, category: "untyped", damageType: "same", filter: "allStrikes", label: "Arcane Cascade" },
    description: `You're in an arcane cascade stance, dealing this much extra damage on your Strikes (and spells). Remove when you leave the stance.`,
};
