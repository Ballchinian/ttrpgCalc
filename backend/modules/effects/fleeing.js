export default {
    name: "fleeing",
    maxLevel: 1,
    //endOfNextTurn: fleeing typically lasts until the end of your next turn per PF2e rules
    defaultDuration: { type: "endOfNextTurn" },
    //no statModifier: fleeing is a movement compulsion, not a numeric penalty to any roll
    description: `You're forced to run away due to fear or a similar compulsion. On your turn you must spend each of your actions to move away from whatever is causing the fleeing condition as expediently as possible.`
};
