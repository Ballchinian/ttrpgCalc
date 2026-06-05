import express from "express";
import { actionModules } from "../modules/actions/actionModules/actionModules.js";
import { fetchAllEffects } from "../controllers/effectsController.js";
import { offGuardEffects } from "../modules/effects/effectModules/effectModules.js";
import { fetchActions, addAction, updateAction, deleteAction } from "../controllers/actionController.js";
import { traitModules } from "../modules/actions/traitModules/traitModules.js";
import { DAMAGE_TYPES } from "../data/damageTypes.js";

const router = express.Router();

//Static routes declared before /:id to prevent shadowing
router.get("/globalActions", (_req, res) => res.json(actionModules));
router.get("/globalOffGuardEffects", (_req, res) => res.json(offGuardEffects));
router.get("/effects", fetchAllEffects);

//Trait definitions: omit resolve (function, not JSON-serializable); render is a plain data object or null
router.get("/traitModules", (_req, res) => {
    const serializable = Object.fromEntries(
        Object.entries(traitModules).map(([key, { label, render, effects }]) => [key, { label, render, effects }])
    );
    res.json(serializable);
});
router.get("/damageTypes", (_req, res) => res.json(DAMAGE_TYPES));

//Spells and weapons CRUD
router.get("/", fetchActions);
router.post("/", addAction);
router.put("/:id", updateAction);
router.delete("/:id", deleteAction);

export default router;
