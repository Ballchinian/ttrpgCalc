//PF2e condition priority: keys cover (supersede) the listed conditions
//e.g. restrained overrides grabbed and immobilized; grabbed overrides immobilized
export const CONDITION_COVERS = {
    restrained: ["grabbed", "immobilized"],
    grabbed: ["immobilized"],
};

//True if a more-severe condition already makes `name` redundant
export const isCoveredByHigher = (name, effects) =>
    Object.entries(CONDITION_COVERS).some(
        ([superior, covered]) => covered.includes(name) && effects.some(e => e.slug === superior)
    );

//Names of conditions superseded (and removed) when `name` is applied
export const supersededBy = name => CONDITION_COVERS[name] ?? [];
