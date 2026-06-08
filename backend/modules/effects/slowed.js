export default {
    name: "slowed",
    maxLevel: "infinite",
    defaultDuration: { type: "manual" },
    description: `You lose actions at the start of your turn equal to the slowed value. Unlike stunned, slowed doesn't reduce on its own. If you're both slowed and stunned, you lose the higher of the two values, then stunned is reduced by the number of actions you lost.`,
};
