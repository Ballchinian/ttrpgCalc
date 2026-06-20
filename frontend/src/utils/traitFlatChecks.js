//Computes the trait-gated flat checks a condition forces on the actor's action (e.g. grabbed forces a
//DC 5 flat check on manipulate actions, or the action is lost). The interaction is declared on the
//condition module (traitFlatCheck, surfaced via globalEffects) and matched against the action's traits.
//Spells are treated as manipulate actions (casting is manipulate) in addition to any explicit traits.
export function getGatingFlatChecks(actor, selectedType, actionTraitNames, effectDefs) {
    if (!actor?.effects?.length) return [];
    const defBySlug = {};
    (effectDefs ?? []).forEach(e => { if (e.traitFlatCheck) defBySlug[e.name.toLowerCase()] = e.traitFlatCheck; });

    const traits = new Set(actionTraitNames ?? []);
    if (selectedType === "spell") traits.add("manipulate");

    const checks = [];
    actor.effects.forEach(e => {
        const fc = defBySlug[e.slug];
        if (fc && traits.has(fc.trait)) checks.push({ source: e.slug, dc: fc.dc, trait: fc.trait });
    });
    return checks;
}
