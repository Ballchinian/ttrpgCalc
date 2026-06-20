export default {
    name: "panache",
    maxLevel: 1,
    //Class state, not a formal PF2e condition (drives the UI badge distinction)
    category: "effect",
    //Manual by default: gained from bravado actions or added by hand, removed manually or spent by a finisher
    defaultDuration: { type: "manual" },
    //Marker condition only (no statModifier): it gates the Swashbuckler's Precise Strike rider.
    description: `You're filled with daring flair. While you have panache, qualifying weapons can use Precise Strike (and Finishers) - see your class option.`,
};
