import { useState, useMemo } from "react";
import { useBattleStore } from "../../../store/battleStore";
import { useGameDataStore } from "../../../store/gameDataStore";
import { manageOffGuardFrontend } from "../../utility/manageOffGuard";
import { OFF_GUARD } from "../../../data/effectNames";
import { isCoveredByHigher, supersededBy } from "../../../data/conditionHierarchy";

const MAX_STACK = 99;

export function useCharacterCardActions(character) {
    const [addingEffect, setAddingEffect] = useState(false);
    const [pendingEffect, setPendingEffect] = useState(null);
    const [stackEdit, setStackEdit] = useState(null); //{ effect, inputValue }|null

    const updateCharacterInList = useBattleStore(state => state.updateCharacterInList);
    const deleteCharacterFromList = useBattleStore(state => state.deleteCharacterFromList);
    const selectTarget = useBattleStore(state => state.selectTarget);
    const setError = useBattleStore(state => state.setError);
    const target = useBattleStore(state => state.target);
    const round = useBattleStore(state => state.round);
    const globalEffects = useGameDataStore(state => state.globalEffects);
    const offGuardActions = useGameDataStore(state => state.offGuardActions);

    const filteredEffects = useMemo(
        () => Array.isArray(globalEffects) ? globalEffects.map(e => e.name) : [],
        [globalEffects]
    );

    const getEffectInfo = (name) =>
        globalEffects?.find(e => e.name.toLowerCase() === name.toLowerCase()) ?? null;

    const syncOffGuard = (c, effectName, op) => {
        if (!offGuardActions.includes(effectName)) return c;
        return manageOffGuardFrontend({ ...c, offGuardSources: [...(c.offGuardSources || [])] }, effectName, op);
    };

    const handleSelectEffect = (name) => {
        const nameLower = name.toLowerCase();
        if (nameLower === "persistent") {
            setPendingEffect({ name: "persistent", durationType: "manual", remaining: 1, damageType: "", damageAmount: 1 });
            return;
        }
        const def = getEffectInfo(name)?.defaultDuration;
        setPendingEffect({ name, durationType: def?.type ?? "manual", remaining: 1 });
    };

    const handleConfirmEffect = () => {
        if (!pendingEffect) return;
        const { name, durationType, remaining } = pendingEffect;
        const needsActor = durationType === "endOfNextTurn" || durationType === "currentTurn";
        if (needsActor && !target.activeActor) {
            setError("Select an active actor before using this duration type.");
            return;
        }
        const duration =
            durationType === "rounds" ? { type: "rounds", remaining } :
            durationType === "endOfNextTurn" ? { type: "endOfNextTurn", actorId: target.activeActor.id, actorName: target.activeActor.name, appliedRound: round ?? 1 } :
            durationType === "currentTurn" ? { type: "currentTurn", actorId: target.activeActor.id } :
            { type: durationType };

        if (name.toLowerCase() === "persistent") {
            const { damageType, damageAmount } = pendingEffect;
            if (!damageType?.trim()) { setError("Select a damage type for persistent damage."); return; }
            if (!damageAmount || damageAmount < 1) { setError("Damage amount must be at least 1."); return; }
            const fullName = `persistent ${damageType.toLowerCase().trim()}`;
            updateCharacterInList(character.side, character.id, c => ({
                ...c,
                effects: [
                    ...(c.effects || []).filter(e => e.name !== fullName),
                    { name: fullName, number: damageAmount, damageType: damageType.toLowerCase().trim(), duration },
                ],
            }));
            setPendingEffect(null);
            setAddingEffect(false);
            return;
        }

        const nameLower = name.toLowerCase();
        if (!character.effects?.some(e => e.name === nameLower) && !isCoveredByHigher(nameLower, character.effects || [])) {
            const toRemove = new Set(supersededBy(nameLower));
            updateCharacterInList(character.side, character.id, c => {
                const filtered = toRemove.size ? (c.effects || []).filter(e => !toRemove.has(e.name)) : (c.effects || []);
                const next = { ...c, effects: [...filtered, { name: nameLower, number: 1, description: getEffectInfo(name)?.description, duration }] };
                return syncOffGuard(next, nameLower, "add");
            });
        }
        setPendingEffect(null);
        setAddingEffect(false);
    };

    const handleChangedEffect = (effect) => {
        const name = effect.name.toLowerCase();
        if (name === OFF_GUARD) { setError("Off-Guard is managed automatically and cannot be edited directly."); return; }
        if (name.startsWith("persistent ")) {
            setStackEdit({
                effect,
                inputValue: String(effect.number),
                durationType: effect.duration?.type ?? "manual",
                remaining: effect.duration?.remaining ?? 1,
                isPersistent: true,
                damageType: effect.damageType ?? name.replace("persistent ", ""),
            });
            return;
        }
        setStackEdit({
            effect,
            inputValue: String(effect.number),
            durationType: effect.duration?.type ?? "manual",
            remaining: effect.duration?.remaining ?? 1,
        });
    };

    const handleConfirmStackEdit = () => {
        if (!stackEdit) return;
        const { effect, inputValue, durationType, remaining, isPersistent, damageType } = stackEdit;
        const parsed = Number(inputValue);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_STACK) return;
        const name = effect.name.toLowerCase();
        const needsActor = durationType === "endOfNextTurn" || durationType === "currentTurn";
        if (needsActor && !target.activeActor) {
            setError("Select an active actor before using this duration type.");
            return;
        }
        const duration =
            durationType === "rounds" ? { type: "rounds", remaining } :
            durationType === "endOfNextTurn" ? { type: "endOfNextTurn", actorId: target.activeActor?.id, actorName: target.activeActor?.name, appliedRound: round ?? 1 } :
            durationType === "currentTurn" ? { type: "currentTurn", actorId: target.activeActor?.id } :
            { type: durationType };

        if (isPersistent) {
            const newType = (damageType ?? "").toLowerCase().trim();
            const newName = newType ? `persistent ${newType}` : name;
            updateCharacterInList(character.side, character.id, c => {
                if (parsed === 0) return { ...c, effects: (c.effects || []).filter(e => e.name !== name) };
                //Remove old entry and any collision with the new name, then insert updated
                const filtered = (c.effects || []).filter(e => e.name !== name && e.name !== newName);
                return { ...c, effects: [...filtered, { name: newName, number: parsed, damageType: newType, duration }] };
            });
            setStackEdit(null);
            return;
        }

        updateCharacterInList(character.side, character.id, c => {
            if (parsed === 0) {
                const next = { ...c, effects: (c.effects || []).filter(e => e.name !== name) };
                return syncOffGuard(next, name, "remove");
            }
            //When upgrading level: also remove conditions now covered by this one
            const toRemove = new Set(supersededBy(name));
            const baseEffects = toRemove.size ? (c.effects || []).filter(e => !toRemove.has(e.name)) : (c.effects || []);
            const next = { ...c, effects: baseEffects.map(e => e.name === name ? { ...e, number: parsed, duration } : e) };
            return next;
        });
        setStackEdit(null);
    };

    const handleHealthChange = (rawValue) => {
        const parsed = parseInt(rawValue, 10);
        if (Number.isNaN(parsed)) return;
        const clamped = Math.min(character.stats?.maxHealth ?? 0, Math.max(0, parsed));
        updateCharacterInList(character.side, character.id, c => ({ ...c, stats: { ...c.stats, currentHealth: clamped } }));
    };

    const handleOffGuardToggle = (e) => {
        e.stopPropagation();
        const isOffGuard = (character.effects || []).some(ef => ef.name === OFF_GUARD);
        updateCharacterInList(character.side, character.id, c => {
            const copy = { ...c, effects: [...(c.effects || [])], offGuardSources: [...(c.offGuardSources || [])] };
            return manageOffGuardFrontend(copy, "manual", isOffGuard ? "remove" : "add");
        });
    };

    const handleActionClick = (index) => {
        //Read live state inside updater to avoid stale closure from rapid clicks
        updateCharacterInList(character.side, character.id, c => {
            const current = c.actionsRemaining || [true, true, true];
            const next = [...current];
            next[index] = !next[index];
            return { ...c, actionsRemaining: next };
        });
    };

    return {
        //UI state
        addingEffect, setAddingEffect,
        pendingEffect, setPendingEffect,
        stackEdit, setStackEdit,
        MAX_STACK,
        //Derived
        isActiveActor: target.activeActor?.id === character.id,
        isTargetCharacters: target.selectedTargetCharacters?.some(t => t.id === character.id) ?? false,
        isOffGuard: (character.effects || []).some(e => e.name === OFF_GUARD),
        hasActiveActor: !!target.activeActor,
        filteredEffects,
        //Store actions exposed for JSX use
        selectTarget, deleteCharacterFromList,
        //Handlers
        handleSelectEffect, handleConfirmEffect, handleChangedEffect,
        handleConfirmStackEdit, handleHealthChange, handleOffGuardToggle, handleActionClick,
    };
}
