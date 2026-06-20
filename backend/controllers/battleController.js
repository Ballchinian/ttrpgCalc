import { resolveActionHelper } from "../modules/resolveActionHelper/resolveActionHelper.js";
import { actionModules } from "../modules/actions/actionModules/actionModules.js";
import Action from "../models/actionModel.js";
import { getCritSpecEffect } from "../data/critSpecDefs.js";
import { injectGrants, injectStrikeRider, injectStrikeAugments, hydrateFeatureAction } from "../modules/classFeatures/classFeatureResolution.js";
import { featureActions } from "../modules/classFeatures/featureActions/featureActions.js";
import { actorHasFeatureAction } from "../data/classFeatures.js";
import { applyVersatileDamageType } from "../modules/actions/versatileDamage.js";

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
        const { activeActor, targetCharacters, action, diceMode, offensiveBonuses, characterDefensiveBonuses, critSpecGroup, strikeRider, versatileDamageType } = req.body;

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
            if (typeof actionData !== "string") {
                return res.status(400).json({ message: "Unknown global action" });
            }
            const globalModule = actionModules[actionData];
            if (globalModule) {
                //Bravado actions grant a resource (e.g. panache) on success - inject if actor/action qualify.
                //If unchanged, keep the string actionData so formatAction resolves it via actionModules.
                const granted = injectGrants(globalModule, actionData, activeActor);
                if (granted !== globalModule) resolvedAction = { ...action, actionData: granted };
            } else if (featureActions[actionData]) {
                //Feature/style action (Rage, Dirty Trick, ...): only usable if the actor's class grants it
                if (!actorHasFeatureAction(activeActor.classOption, actionData)) {
                    return res.status(403).json({ message: "Action not available to this character" });
                }
                //Fill $config tokens (e.g. Rage's damage/temp HP) then inject panache for bravado styles
                const hydrated = hydrateFeatureAction(featureActions[actionData], activeActor.classOption);
                resolvedAction = { ...action, actionData: injectGrants(hydrated, actionData, activeActor) };
            } else {
                return res.status(400).json({ message: "Unknown global action" });
            }
        } else if (actionType === "weapon" || actionType === "spell") {
            if (!actionData || typeof actionData !== "object" || typeof actionData._id !== "string") {
                return res.status(400).json({ message: "Invalid action data" });
            }
            //Refetch from DB to prevent client-supplied action payloads from reaching the resolver
            const dbAction = await Action.findOne({ _id: actionData._id, playerID: req.userID }).lean();
            if (!dbAction) return res.status(404).json({ message: "Action not found" });

            //If the player has crit spec enabled for this weapon group, inject the effect into criticalSuccess
            const critSpecEffect = critSpecGroup && typeof critSpecGroup === "string"
                ? getCritSpecEffect(critSpecGroup, dbAction)
                : null;
            const actionDataWithCritSpec = critSpecEffect
                ? {
                    ...dbAction,
                    outcomes: {
                        ...dbAction.outcomes,
                        criticalSuccess: {
                            ...dbAction.outcomes?.criticalSuccess,
                            effects: [...(dbAction.outcomes?.criticalSuccess?.effects ?? []), critSpecEffect],
                        },
                    },
                }
                : dbAction;

            //Versatile damage-type choice first (so any precision rider inherits the chosen type),
            //then the strike rider, then grants. injectGrants is a no-op for weapons but kept for generality.
            const withVersatile = applyVersatileDamageType(actionDataWithCritSpec, versatileDamageType);
            const withRider = injectStrikeRider(withVersatile, activeActor, strikeRider);
            //Always-on Strike augments from the actor's conditions + feature autoRiders (Rage, Sneak Attack, ...)
            const withAugments = injectStrikeAugments(withRider, activeActor, targetCharacters);
            const finalActionData = injectGrants(withAugments, dbAction.name, activeActor);
            resolvedAction = { ...action, actionData: finalActionData };
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

        //Restore base stats: currentHealth and tempHP persist (Rage etc. may have changed temp HP),
        //strip _breakdown so client doesn't see stale bonuses
        updatedActiveActor.stats = { ...activeActorStats, currentHealth: updatedActiveActor.stats.currentHealth, tempHP: updatedActiveActor.stats.tempHP ?? activeActorStats.tempHP };
        delete updatedActiveActor._breakdown;
        updatedTargetCharacters.forEach((updated, i) => {
            updated.stats = { ...targetStats[i], currentHealth: updated.stats.currentHealth, tempHP: updated.stats.tempHP ?? targetStats[i].tempHP };
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
