export default {
    name: "restrained",
    maxLevel: 1,
    //defaultDuration: no auto-decrement; persists until escaped or bonds are broken (manual removal)
    defaultDuration: { type: "manual" },
    offGuard: true,
    //AC penalty owned by off-guard: adding it here would double-count the circumstance penalty
    description: `You're tied up and can barely move, or a creature has you pinned. You have the off-guard and immobilized conditions, and you can't use any attack or manipulate actions except to attempt to Escape or Force Open your bonds. Restrained overrides grabbed.`
};
