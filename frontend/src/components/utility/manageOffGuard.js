import { OFF_GUARD } from "../../data/effectNames.js";

//PF2e: off-guard always gives a fixed -2 circumstance penalty to AC
const OFF_GUARD_PENALTY = 2;

export const manageOffGuardFrontend = (target, sourceCondition, action = "add") => {
    const offGuardSources = target.offGuardSources || [];
    const effects = target.effects || [];

    if (action === "add") {
        const newSources = offGuardSources.includes(sourceCondition)
            ? offGuardSources
            : [...offGuardSources, sourceCondition];
        const newEffects = effects.some(e => e.slug === OFF_GUARD)
            ? effects
            : [...effects, { slug: OFF_GUARD, value: 1, description: `You're distracted or otherwise unable to focus your full attention on defense. You take a –2 circumstance penalty to AC.` }];
        return { ...target, offGuardSources: newSources, effects: newEffects };
    }

    if (action === "remove") {
        const newSources = offGuardSources.filter(src => src !== sourceCondition);
        const newEffects = newSources.length === 0
            ? effects.filter(e => e.slug !== OFF_GUARD)
            : effects;
        return { ...target, offGuardSources: newSources, effects: newEffects };
    }

    return target;
};
