import { useBattleStore } from "../../store/battleStore";
import { useRecapStore } from "../../store/recapStore";

//Captures the current battle (the persisted battleStore shape) + recap history into a plain object
//suitable for the backend. Transient UI state (mode, pendingAction, logs) is intentionally dropped.
export function serializeCurrentBattle() {
    const b = useBattleStore.getState();
    return {
        battle: {
            parties: b.parties,
            target: {
                activeActor: b.target.activeActor,
                selectedTargetCharacters: b.target.selectedTargetCharacters,
            },
            action: {
                selected: b.action.selected,
                selectedType: b.action.selectedType,
                targetType: b.action.targetType,
            },
            settings: b.settings,
            round: b.round,
            initiative: b.initiative,
        },
        recap: useRecapStore.getState().recapHistory,
    };
}

//Restores a serialized battle into the live stores, resetting transient state so the simulator
//opens cleanly. Defensive against older/partial snapshots. `loaded` ({ id, name }) tags which saved
//slot this battle came from so the Save dialog can default to updating it; null for a fresh battle.
export function restoreBattle(data, loaded = null) {
    const battle = data?.battle ?? {};
    const current = useBattleStore.getState();
    useBattleStore.setState({
        parties: battle.parties ?? { heroes: [], foes: [] },
        target: {
            mode: null,
            activeActor: battle.target?.activeActor ?? null,
            selectedTargetCharacters: battle.target?.selectedTargetCharacters ?? [],
        },
        action: {
            selected: battle.action?.selected ?? "",
            selectedType: battle.action?.selectedType ?? "",
            targetType: battle.action?.targetType ?? "",
            choosing: false,
        },
        settings: battle.settings ?? current.settings,
        round: battle.round ?? 1,
        initiative: battle.initiative ?? { order: [], turnIndex: 0 },
        log: {},
        error: "",
        pendingAction: null,
        pendingNichePrompts: [],
        expiringConditions: [],
        persistCheckResults: [],
        loadedBattle: loaded,
    });
    useRecapStore.setState({ recapHistory: data?.recap ?? {} });
}

//True when there's something worth saving (at least one combatant on either side).
export function currentBattleHasContent() {
    const { parties } = useBattleStore.getState();
    return (parties.heroes?.length ?? 0) + (parties.foes?.length ?? 0) > 0;
}

//Aggregates a recap history ({ [round]: [entries] }) into comparison metrics. Damage figures come
//straight from the recap entries the simulator already computes, so this never re-resolves anything.
export function summarizeRecap(recap = {}) {
    const summary = {
        rounds: Object.keys(recap).length,
        actions: 0,
        totalDamage: 0,
        conditionDamage: 0,   //extra damage attributed to conditions (frightened, enfeebled, ...) via per-condition impacts
        offGuardDamage: 0,    //"if off-guard" damage gain the recap tracks separately from conditionBreakdown
        critSpecDamage: 0,
        kills: 0,
        byActor: {},          //actorName -> total damage dealt
        byCondition: {},      //conditionName -> total damage added
    };

    Object.values(recap).forEach(entries => {
        (entries ?? []).forEach(e => {
            summary.actions += 1;
            summary.totalDamage += e.totalDamage ?? 0;
            summary.offGuardDamage += e.totalOffGuardGain ?? 0;
            summary.byActor[e.actorName] = (summary.byActor[e.actorName] ?? 0) + (e.totalDamage ?? 0);
            (e.critSpecImpacts ?? []).forEach(c => { summary.critSpecDamage += c.damage ?? c.damageGain ?? 0; });
            Object.entries(e.conditionBreakdown ?? {}).forEach(([name, dmg]) => {
                summary.conditionDamage += dmg;
                summary.byCondition[name] = (summary.byCondition[name] ?? 0) + dmg;
            });
            (e.targets ?? []).forEach(t => { if (t.wasKilled) summary.kills += 1; });
        });
    });

    return summary;
}
