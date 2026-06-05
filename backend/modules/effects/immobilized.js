export default {
    name: "immobilized",
    maxLevel: 1,
    //defaultDuration: no auto-decrement; typically cleared when the parent condition (grabbed/restrained) ends
    defaultDuration: { type: "manual" },
    description: `You can't use any action with the move trait. If you're immobilized by something holding you in place and an external force would move you, that force must succeed at a check against the relevant DC to do so.`
};
