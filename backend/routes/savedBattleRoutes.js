import express from "express";
import {
    listSavedBattles,
    getSavedBattle,
    createSavedBattle,
    updateSavedBattle,
    deleteSavedBattle,
} from "../controllers/savedBattleController.js";

const router = express.Router();

router.get("/", listSavedBattles);
router.post("/", createSavedBattle);
router.get("/:id", getSavedBattle);
router.put("/:id", updateSavedBattle);
router.delete("/:id", deleteSavedBattle);

export default router;
