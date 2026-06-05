import { useBattleStore } from '../store/battleStore';
import { useGameDataStore } from '../store/gameDataStore';
import { apiFetch } from '../auth';
import { BACKEND_BASE_URL } from '../config';
import { applyPendingAction } from '../utils/applyPendingAction';

//Encapsulates the full async turn-resolution pipeline.
//Uses getState() so it always reads the latest values, not stale closure values.
//Plain function (not a hook): no React hooks used internally.
export async function resolveTurn() {
    const {
        target, action, settings, round, parties,
        updateCharacterInList, setLog, setError,
        canSpendActions, spendActions, getCharByRef, setPendingAction,
    } = useBattleStore.getState();
    const { allItems, spellData } = useGameDataStore.getState();

    setError("");

    //Validation
    const activeActor = getCharByRef(target.activeActor);
    //Always read fresh character data from parties, selectedTargetCharacters are
    //selection-state snapshots and go stale after endRound or other store updates
    const targetCharacters = (target.selectedTargetCharacters || []).map(t => {
        const list = t.side === "hero" ? parties.heroes : parties.foes;
        return list.find(c => c.id === t.id) || t;
    });

    if (!activeActor)                                              { setError("Please select an active actor");   return; }
    if (!targetCharacters.length && action.targetType !== "self") { setError("Please select target characters"); return; }
    if (!action.selected)                                         { setError("No action selected");              return; }

    //Action economy: compute cost here for the gate check; actual spend happens after API confirms
    const actionCost = !settings.autoActions
        ? (allItems.weapons?.find(w => w.name === action.selected)?.actionCost ??
           spellData.find(s => s.name === action.selected)?.actionCost ??
           (action.selectedType === "global_action" || !action.selectedType ? 1 : 0))
        : 0;

    if (!settings.autoActions && !canSpendActions(target.activeActor, actionCost)) {
        setError("No actions left to spend");
        return;
    }

    //Build action payload
    let actionData = null;
    let actionType = action.selectedType || null;
    if (actionType === "weapon") {
        actionData = allItems.weapons?.find(w => w.name === action.selected) ?? null;
    } else if (actionType === "spell") {
        actionData = allItems.spells?.find(s => s.name === action.selected) ?? null;
    }
    //Weapon/spell must resolve to an object; if not found, refresh allItems once before giving up
    if ((actionType === "weapon" || actionType === "spell") && !actionData) {
        await useGameDataStore.getState().refreshItems();
        const { allItems: fresh } = useGameDataStore.getState();
        actionData = actionType === "weapon"
            ? (fresh.weapons?.find(w => w.name === action.selected) ?? null)
            : (fresh.spells?.find(s => s.name === action.selected) ?? null);
    }
    if ((actionType === "weapon" || actionType === "spell") && !actionData) {
        setError(`Could not find action data for "${action.selected}". Try re-selecting the action.`);
        return;
    }
    if (!actionData) { actionData = action.selected; }
    if (!actionType) { actionType = "global_action"; }

    const battleSession = (() => {
        try { return JSON.parse(localStorage.getItem("battleSession") || "{}"); }
        catch (err) { console.warn("Failed to parse battleSession:", err); return {}; }
    })();
    const offensiveBonuses = battleSession?.[activeActor.sourceID]?.offensiveBonuses ?? {};
    const characterDefensiveBonuses = targetCharacters.reduce((acc, t) => {
        acc[t.sourceID] = battleSession?.[t.sourceID]?.defensiveBonuses ?? {};
        return acc;
    }, {});

    //Capture pre-action snapshot for recap
    const targetsBefore = targetCharacters.map(t => ({
        id: t.id,
        name: t.name,
        side: t.side,
        stats: { currentHealth: t.stats?.currentHealth ?? 0 },
        effects: (t.effects ?? []).map(e => ({ name: e.name, number: e.number })),
    }));
    const actorEffectsBefore = (activeActor.effects ?? []).map(e => ({ name: e.name, number: e.number }));
    const currentRound = round ?? 1;

    //Resolve with backend
    try {
        const res = await apiFetch(`${BACKEND_BASE_URL}/battles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                activeActor,
                targetCharacters,
                action: { actionData, actionType },
                diceMode: settings.diceMode,
                offensiveBonuses,
                characterDefensiveBonuses,
            }),
        });

        //apiFetch returns undefined when the session expires and redirects to login
        if (!res) { setError("Session expired. Please refresh the page."); return; }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Failed to resolve action");
            return;
        }

        const data = await res.json();

        if (!data?.updatedActiveActor || !Array.isArray(data?.updatedTargetCharacters)) {
            setError("Invalid response from server");
            return;
        }

        //Restore base stats but keep the updated currentHealth
        const preserveHP = (updated, c) => settings.ignoreHP
            ? { ...updated.stats, currentHealth: c.stats.currentHealth }
            : updated.stats;

        //Spend actions only after the API confirms the turn resolved successfully.
        //Re-read activeActor ref from store: the user could have changed it during the await.
        const freshActorRef = useBattleStore.getState().target.activeActor;
        if (!settings.autoActions) spendActions(freshActorRef ?? target.activeActor, actionCost);

        //Active actor always updates, MAP may have changed even in choose mode
        updateCharacterInList(data.updatedActiveActor.side, data.updatedActiveActor.id, c => ({
            ...c,
            ...data.updatedActiveActor,
            stats: preserveHP(data.updatedActiveActor, c),
            actionsRemaining: c.actionsRemaining,
            mapAttacks: settings.autoMAP ? data.updatedActiveActor.mapAttacks : c.mapAttacks,
        }));

        const recapContext = {
            actorName: activeActor.name,
            actorId: activeActor.id,
            actionName: action.selected,
            actorEffects: actorEffectsBefore,
            targetsBefore,
            round: currentRound,
            actionStats: data.actionStats ?? {},
        };

        //All modes route through pendingAction: auto modes apply immediately, choose waits for user
        if (data.pendingOutcomes) {
            setPendingAction({ mode: "choose", perTarget: data.pendingOutcomes, recapContext, chosenOutcomes: {}, ignoreHP: settings.ignoreHP });
        } else {
            setPendingAction({ mode: "auto", updatedTargets: data.updatedTargetCharacters, ignoreHP: settings.ignoreHP, recapContext });
            applyPendingAction();
        }

        setLog(data.log || {});

    } catch (err) {
        console.error("Turn resolution failed:", err);
        setError("An unexpected error occurred while resolving the action");
    }
}
