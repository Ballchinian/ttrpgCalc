//Builds a single recap entry from a pre-action snapshot, the updated targets, and backend stats.
//Called after every resolved turn to feed into recapStore.
//actionStats is keyed by targetId: { [id]: { conditionImpacts, offGuardImpacts, rollOutcome } }

export function buildRecapEntry(actorName, actionName, actorEffects, targetsBefore, updatedTargets, actionStats = {}, chosenOutcomes = {}) {
    //Track which conditions were newly applied this action for the action recap
    const conditionsApplied = updatedTargets.flatMap(updated => {
        const before = targetsBefore.find(t => t.id === updated.id);
        const beforeKeys = new Set((before?.effects ?? []).map(e => `${e.name}:${e.number ?? 0}`));
        return (updated.effects ?? [])
            .filter(e => !beforeKeys.has(`${e.name}:${e.number ?? 0}`))
            .map(e => ({ targetName: updated.name, conditionName: e.name, level: e.number ?? 1 }));
    });

    const targets = updatedTargets.map(updated => {
        const before = targetsBefore.find(t => t.id === updated.id);
        const prevHealth = before?.stats?.currentHealth ?? 0;
        const newHealth = updated.stats?.currentHealth ?? 0;
        const stats = actionStats[updated.id] ?? {};
        const rollOutcome = stats.rollOutcome ?? {};

        //chosenOutcomes and rollOutcome.outcomeKey are both in roller's POV (target's POV for saves)
        //Labels in OUTCOME_LABELS match roller's POV directly — no flip needed
        const chosenKey = chosenOutcomes[updated.id];
        const displayOutcomeKey = chosenKey ?? rollOutcome.outcomeKey;

        const damageTaken = Math.max(0, prevHealth - newHealth);
        const healingReceived = Math.max(0, newHealth - prevHealth);
        //luckDelta: how far above/below expected this roll landed (luck mode only)
        const luckDelta = rollOutcome.avgDamage !== undefined ? damageTaken - rollOutcome.avgDamage : null;
        const healingLuckDelta = rollOutcome.avgHealing !== undefined ? healingReceived - rollOutcome.avgHealing : null;

        return {
            name: updated.name,
            damageTaken,
            healingReceived,
            conditionImpacts: stats.conditionImpacts ?? [],
            offGuardImpacts: stats.offGuardImpacts ?? [],
            perConditionImpacts: stats.perConditionImpacts ?? [],
            outcomeKey: displayOutcomeKey,
            diceResult: rollOutcome.diceResult,
            avgOutcomeKey: rollOutcome.avgOutcomeKey,
            thresholds: rollOutcome.thresholds ?? null,
            offGuardBenefit: rollOutcome.offGuardBenefit ?? 0,
            mapPenalty: rollOutcome.mapPenalty ?? 0,
            diceTooltip: rollOutcome.diceTooltip ?? stats.diceTooltip ?? null,
            healingTooltip: rollOutcome.healingTooltip ?? stats.healingTooltip ?? null,
            dmgModifierInfo: stats.dmgModifierInfo ?? [],
            luckDelta,
            healingLuckDelta,
        };
    });

    const hasLuckDelta = targets.some(t => t.luckDelta !== null);
    const totalLuckDelta = hasLuckDelta ? targets.reduce((sum, t) => sum + (t.luckDelta ?? 0), 0) : null;

    const offGuardGainSum = targets.reduce((sum, t) =>
        sum + t.offGuardImpacts.reduce((s, imp) => s + (imp.damageGain ?? 0), 0), 0
    );
    const totalOffGuardGain = offGuardGainSum > 0 ? offGuardGainSum : null;

    //Aggregate per-condition impacts by condition name for session-level breakdown display
    const conditionBreakdown = {};
    targets.forEach(t => {
        (t.perConditionImpacts ?? []).forEach(({ conditionName, damageGain }) => {
            conditionBreakdown[conditionName] = (conditionBreakdown[conditionName] ?? 0) + damageGain;
        });
    });

    return {
        actorName,
        actionName,
        actorEffects,
        targets,
        totalDamage:    targets.reduce((sum, t) => sum + t.damageTaken, 0),
        totalLuckDelta,
        totalOffGuardGain,
        conditionBreakdown,
        conditionsApplied,
    };
}
