import { effectModules } from "../modules/effects/effectModules/effectModules.js";

export const fetchAllEffects = (req, res) => {
    //Creates readable format for frontend on inbuilt effects
    const effectsForFrontend = Object.values(effectModules).map((effect) => ({
        name: effect.name,
        maxLevel: effect.maxLevel ?? null,
        defaultDuration: effect.defaultDuration ?? { type: "manual" },
        offGuard: effect.offGuard ?? false,
        //"condition" = formal PF2e condition; "effect"/"stance" = class state (UI badge distinction)
        category: effect.category ?? "condition",
        //trait-gated flat check this condition imposes on the afflicted creature's actions (e.g. grabbed -> manipulate DC 5)
        traitFlatCheck: effect.traitFlatCheck ?? null,
        description: effect.description ?? "",
    }));
    res.json(effectsForFrontend);
};
