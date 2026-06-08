export default {
    name: "stunned",
    maxLevel: "infinite",
    defaultDuration: { type: "manual" },
    description: `You've become incapacitated, at least partially. You lose actions at the start of your turn equal to the stunned value, then reduce stunned by the number of actions lost. Stunned can be reduced by the slowed condition (the two don't stack—use the higher value).`,
};
