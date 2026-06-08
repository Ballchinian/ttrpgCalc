import { useState, useMemo, useCallback } from "react";
import { Card, Button, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useBattleStore } from "../../../store/battleStore";
import { useGameDataStore } from "../../../store/gameDataStore";
import { resolveTurn } from "../../../hooks/useResolveTurn";
import SearchbarToggle from "../../utility/searchbarToggle";
import { CRIT_SPEC_DEFS } from "../../../data/critSpecDefs";

const cardStyle = { width: "100%", padding: "10px", marginBottom: "20px", height: "auto" };
const disabledMapStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "6px 12px", borderRadius: "999px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
    color: "#888", fontSize: "13px", userSelect: "none", cursor: "default",
};
const getActionLabel = (item) => item;

//Fully self-contained: reads from stores and resolves turns without any props.
function ActionPanel() {
    const [resolving, setResolving] = useState(false);

    const action = useBattleStore(state => state.action);
    const target = useBattleStore(state => state.target);
    const parties = useBattleStore(state => state.parties);
    const error = useBattleStore(state => state.error);
    const setSelectedAction = useBattleStore(state => state.setSelectedAction);
    const setChoosingAction = useBattleStore(state => state.setChoosingAction);
    const setCritSpec = useBattleStore(state => state.setCritSpec);
    const updateCharacterInList = useBattleStore(state => state.updateCharacterInList);
    const setError = useBattleStore(state => state.setError);
    const resetTargetMode = useBattleStore(state => state.resetTargetMode);
    const pendingNichePrompts = useBattleStore(state => state.pendingNichePrompts);
    const getLocalActionNames = useBattleStore(state => state.getLocalActionNames);

    const globalActionNames = useGameDataStore(state => state.globalActionNames);
    const getActionTraits = useGameDataStore(state => state.getActionTraits);
    const spellData = useGameDataStore(state => state.spellData);
    const globalActions = useGameDataStore(state => state.globalActions);
    const allItems = useGameDataStore(state => state.allItems);

    const { selected: selectedAction, targetType, choosing: choosingAction } = action;
    //allItems in deps: getActionTraits reads allItems internally; if it refreshes (e.g. after a rename) the result must update
    const traitProfile = useMemo(() => getActionTraits(selectedAction), [selectedAction, getActionTraits, allItems]);
    const { mapPenalty } = traitProfile;
    //Weapons always count as attacks (attack trait is required/unremovable): use selectedType as a direct fallback
    //instead of relying on allItems being fresh enough to resolve the weapon by name
    const countsAsAttack = action.selectedType === "weapon" || traitProfile.countsAsAttack;

    const selectedWeaponGroup = action.selectedType === "weapon"
        ? (allItems.weapons?.find(w => w.name === action.selected)?.group ?? null)
        : null;
    const critSpecDef = selectedWeaponGroup ? (CRIT_SPEC_DEFS[selectedWeaponGroup] ?? null) : null;
    const showCritSpec = action.selectedType === "weapon";

    //Memoize localStorage read: getLocalActionNames re-parses JSON on every call
    //Use actor id as dep, not the object reference (new object every render)
    //Deletion cleanup is handled by cleanupBattleSession in useActionBuilder, no need to filter here
    const { selectedWeapons, selectedSpells } = useMemo(() => {
        return getLocalActionNames();
    }, [getLocalActionNames, target.activeActor?.id]);
    //Memoize merged list: avoids a new array reference on every render
    const allActionNames = useMemo(
        () => [...selectedWeapons, ...selectedSpells, ...globalActionNames],
        [selectedWeapons, selectedSpells, globalActionNames]
    );

    //Derive MAP from the currently active actor
    const activeActorLive = target.activeActor
        ? (target.activeActor.side === "hero" ? parties.heroes : parties.foes).find(c => c.id === target.activeActor.id)
        : null;
    const activeActorMap = activeActorLive?.mapAttacks ?? 0;
    const setActiveActorMap = useCallback((value) => {
        if (!target.activeActor) return;
        updateCharacterInList(target.activeActor.side, target.activeActor.id, c => ({ ...c, mapAttacks: value }));
    }, [target.activeActor, updateCharacterInList]);

    //Compute targetType and selectedType from game data and call the store setter
    const handleSelectAction = useCallback((actionName) => {
        const selectedType = selectedWeapons.includes(actionName) ? "weapon"
            : selectedSpells.includes(actionName) ? "spell"
            : "global_action";
        const resolvedTargetType =
            globalActions[actionName]?.targetType ||
            spellData.find(s => s.name === actionName)?.targetType ||
            "single";
        setSelectedAction(actionName, resolvedTargetType, selectedType);
        setChoosingAction(false);
    }, [selectedWeapons, selectedSpells, globalActions, spellData, setSelectedAction, setChoosingAction]);

    const handleTurnCommence = useCallback(async () => {
        const requiresTargets = targetType === "single" || targetType === "aoe";
        if (requiresTargets && target.selectedTargetCharacters.length === 0) {
            setError("Please select targets for this action.");
            return;
        }
        resetTargetMode();
        setResolving(true);
        try { await resolveTurn(); }
        finally { setResolving(false); }
    }, [targetType, target.selectedTargetCharacters, setError, resetTargetMode]);

    const mapPenalties = [0, mapPenalty, mapPenalty * 2];
    const fmtPenalty = (p) => p === 0 ? "+0" : `-${p}`;
    const handleDropdownSelect = useCallback((val) => setActiveActorMap(Number(val)), [setActiveActorMap]);

    return (
        <Card style={cardStyle}>
            <Card.Body className="text-center">
                <h4>Actions</h4>

                {selectedAction && (
                    <p style={{ fontSize: "22px", color: "white" }}>{selectedAction}</p>
                )}

                {!choosingAction ? (
                    <Button variant="outline-info" className="w-100 mb-3" onClick={() => setChoosingAction(true)}>
                        Select Action
                    </Button>
                ) : (
                    <SearchbarToggle
                        placeholder="Search actions..."
                        list={allActionNames}
                        getLabel={getActionLabel}
                        onSelect={handleSelectAction}
                        onBlur={() => setChoosingAction(false)}
                    />
                )}

                <div className="d-flex align-items-center gap-2 mb-3">
                    {countsAsAttack ? (
                        <Dropdown className="flex-grow-1" onSelect={handleDropdownSelect}>
                            <Dropdown.Toggle variant="outline-warning" className="w-100" bsPrefix="btn">
                                MAP: {fmtPenalty(mapPenalties[activeActorMap])}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {mapPenalties.map((penalty, idx) => (
                                    <Dropdown.Item key={idx} eventKey={String(idx)}>{fmtPenalty(penalty)}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    ) : (
                        <OverlayTrigger overlay={<Tooltip>MAP doesn't apply to this action</Tooltip>}>
                            <span style={disabledMapStyle}>
                                MAP: {fmtPenalty(mapPenalties[activeActorMap])}
                            </span>
                        </OverlayTrigger>
                    )}
                </div>

                {showCritSpec && (
                    <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                        <OverlayTrigger
                            trigger={["hover", "focus"]}
                            placement="top"
                            overlay={
                                <Tooltip id="crit-spec-tooltip">
                                    {critSpecDef
                                        ? <><strong>{selectedWeaponGroup} crit spec:</strong><br />{critSpecDef.description}</>
                                        : "No weapon group set — crit spec effect must be applied manually."
                                    }
                                </Tooltip>
                            }
                        >
                            <span style={{ cursor: "help" }}>Crit Spec</span>
                        </OverlayTrigger>
                        <input
                            type="checkbox"
                            id="crit-spec-toggle"
                            checked={action.critSpec ?? false}
                            onChange={e => setCritSpec(e.target.checked)}
                            style={{ width: "16px", height: "16px", cursor: "pointer", flexShrink: 0, display: "block" }}
                        />
                    </div>
                )}

                <Button variant="success" className="w-100" onClick={handleTurnCommence} disabled={resolving || !target.activeActor || !selectedAction || pendingNichePrompts.length > 0}>
                    {resolving ? "Resolving..." : "Turn Commence!"}
                </Button>

                {error && <p className="text-danger mt-2">{error}</p>}
            </Card.Body>
        </Card>
    );
}

export default ActionPanel;
