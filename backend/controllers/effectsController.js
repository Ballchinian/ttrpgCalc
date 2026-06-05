import { effectModules } from "../modules/effects/effectModules/effectModules.js";

export const fetchAllEffects = (req, res) => {
    //Creates readable format for frontend on inbuilt effects
    const effectsForFrontend = Object.values(effectModules).map((effect) => ({
        name: effect.name,
        maxLevel: effect.maxLevel ?? null,
        defaultDuration: effect.defaultDuration ?? { type: "manual" },
        offGuard: effect.offGuard ?? false,
        description: effect.description ?? "",
    }));
    res.json(effectsForFrontend);
};
