export default {
    name: "devised",
    //value holds the number of Strategic Strike dice (1d6 at low levels, scaling up) - no level cap
    maxLevel: "infinite",
    category: "effect",
    defaultDuration: { type: "manual" },
    //Strategic Strike: this many d6 of precision damage on your next Strike against the devised target.
    //(Auto-consume after the Strike is wired with the Investigator action - for now remove manually.)
    strikeDamage: { kind: "dice", fromValue: true, diceFaces: 6, category: "precision", damageType: "same", filter: "allStrikes", label: "Strategic Strike" },
    description: `You've devised a stratagem: your next Strike gains this many d6 of precision damage. Remove after the Strike.`,
};
