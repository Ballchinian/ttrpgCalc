import { resolveActionHelper } from "../modules/resolveActionHelper/resolveActionHelper.js";
import { actionModules } from "../modules/actions/actionModules/actionModules.js";
import Action from "../models/actionModel.js";

const BONUS_MAX = 200;

//Recursively sanitizes bonus objects of any depth, clamping all leaf numbers to ±BONUS_MAX
//Handles both flat { bonusType: number } and nested { statName: { bonusType: number } } shapes
function sanitizeBonuses(raw) {
    if (!raw || typeof raw !== "object") return {};
    const result = {};
    for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "number" && Number.isFinite(v)) {
            result[k] = Math.max(-BONUS_MAX, Math.min(BONUS_MAX, v));
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
            const nested = sanitizeBonuses(v);
            if (Object.keys(nested).length) result[k] = nested;
        }
    }
    return result;
}

export const resolveAction = async (req, res) => {
    try {
        const { activeActor, targetCharacters, action, diceMode, offensiveBonuses, characterDefensiveBonuses } = req.body;

        if (!activeActor || !action || !Array.isArray(targetCharacters)) {
            return res.status(400).json({ message: "Missing required fields: activeActor, action, targetCharacters" });
        }
        if (targetCharacters.length > 20) {
            return res.status(400).json({ message: "Too many targets" });
        }

        //Validate action: actionData must be a known global key or a DB ObjectId (fetched server-side)
        //This prevents clients from injecting arbitrary action objects that could cause unbounded computation
        const { actionData, actionType } = action;
        let resolvedAction = action;
        if (actionType === "global_action") {
            if (typeof actionData !== "string" || !actionModules[actionData]) {
                return res.status(400).json({ message: "Unknown global action" });
            }
        } else if (actionType === "weapon" || actionType === "spell") {
            if (!actionData || typeof actionData !== "object" || typeof actionData._id !== "string") {
                return res.status(400).json({ message: "Invalid action data" });
            }
            //Re-fetch from DB to prevent client-supplied action payloads from reaching the resolver
            const dbAction = await Action.findOne({ _id: actionData._id, playerID: req.userID }).lean();
            if (!dbAction) return res.status(404).json({ message: "Action not found" });
            resolvedAction = { ...action, actionData: dbAction };
        } else {
            return res.status(400).json({ message: "Unknown action type" });
        }

        const safeOffensiveBonuses = sanitizeBonuses(offensiveBonuses);
        const safeDefensiveBonuses = characterDefensiveBonuses && typeof characterDefensiveBonuses === "object" && !Array.isArray(characterDefensiveBonuses)
            ? Object.fromEntries(Object.entries(characterDefensiveBonuses).map(([k, v]) => [k, sanitizeBonuses(v)]))
            : {};

        //Save stat snapshots before resolution mutates them
        const activeActorStats = structuredClone(activeActor.stats);
        const targetStats = targetCharacters.map(char => structuredClone(char.stats));

        const { updatedActiveActor, updatedTargetCharacters, log, pendingOutcomes, actionStats } = resolveActionHelper(activeActor, targetCharacters, resolvedAction, diceMode, safeOffensiveBonuses, safeDefensiveBonuses);

        //Restore base stats: only currentHealth persists, strip _breakdown so client doesn't see stale bonuses
        updatedActiveActor.stats = { ...activeActorStats, currentHealth: updatedActiveActor.stats.currentHealth };
        delete updatedActiveActor._breakdown;
        updatedTargetCharacters.forEach((updated, i) => {
            updated.stats = { ...targetStats[i], currentHealth: updated.stats.currentHealth };
            delete updated._breakdown;
        });

        return res.json({
            updatedActiveActor,
            updatedTargetCharacters,
            log,
            actionStats,
            ...(pendingOutcomes && { pendingOutcomes }),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to resolve action" });
    }
};
