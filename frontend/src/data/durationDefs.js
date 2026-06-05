export const DURATION_DEFS = [
    { type: "manual", label: "Manual", desc: "Stays until you remove it manually." },
    { type: "flatCheck", label: "DC 15", desc: "Persistent: applies damage each round, then rolls a d20 flat check — removed on 15+." },
    { type: "currentTurn", label: "This Turn", desc: "Expires when the current actor's turn ends (a different actor takes a turn, or at end of round)." },
    { type: "rounds", label: "Rounds", desc: "Expires after a set number of rounds." },
    { type: "endOfRound", label: "End of Round", desc: "Expires automatically at the end of the current round." },
    { type: "decrement", label: "Decrement", desc: "Reduces the condition level by 1 each round rather than removing it entirely." },
    { type: "endOfNextTurn", label: "End of Next Turn", desc: "Expires at the end of the caster's next turn. Tracks the actor who applied it." },
];
