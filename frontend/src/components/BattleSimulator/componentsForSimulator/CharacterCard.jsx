import { useState } from "react";
import { Button, Card, ProgressBar, OverlayTrigger, Tooltip } from "react-bootstrap";
import blankPicture from ".././../../images/characterImages/blank character.png";
import SearchbarToggle from "../../utility/searchbarToggle";
import { DURATION_DEFS } from "../../../data/durationDefs";
import { useCharacterCardActions } from "./useCharacterCardActions";
import { OFF_GUARD } from "../../../data/effectNames";
import { useGameDataStore } from "../../../store/gameDataStore";

//Static card dimensions; shadow is reactive and added inline
const cardBaseStyle = { width: "230px", padding: "0", margin: "0 20px 30px 20px", height: "fit-content" };
//Tiny duration badge next to effect name
const durationLabelStyle = { fontSize: "11px", opacity: 0.6 };
//Delete button position
const deleteBtnStyle = { position: "absolute", top: "4px", right: "4px", padding: "0px 6px" };
//Effect list container
const effectListStyle = {
    maxHeight: "100px", overflowY: "auto", padding: "5px",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
    display: "flex", flexWrap: "wrap", justifyContent: "center",
    gap: "6px", backgroundColor: "rgba(0,0,0,0.2)",
};
//Individual effect badge (static portion; hover colour applied via onMouseEnter/Leave)
const effectBadgeStyle = { padding: "5px 8px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" };
//Health edit input
const healthInputStyle = { width: "70px", background: "#222", color: "white", border: "1px solid #555", borderRadius: "4px", padding: "2px 4px" };
//Stack-edit input
const stackInputStyle = { width: "55px", background: "#222", color: "white", border: "1px solid #555", borderRadius: "4px", padding: "2px 4px" };
//Rounds-remaining input
const roundsInputStyle = { width: "100%", marginBottom: "4px", background: "#222", color: "white", border: "1px solid #555", borderRadius: "4px", padding: "2px" };
//Duration pill row (used in both stackEdit and pendingEffect)
const durPillRowStyle = { display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "4px" };
//Confirm/cancel button row
const confirmRowStyle = { display: "flex", gap: "4px" };
//Progress bar clickable cursor
const progressBarStyle = { cursor: "pointer" };
//Character name heading
const charNameStyle = { fontSize: "20px", color: "white", textAlign: "center", marginBottom: "8px" };
//Skull icon margin
const skullStyle = { marginRight: "4px" };
//Stack-edit section labels
const stackLevelLabelStyle = { marginBottom: "4px", color: "white", fontSize: "13px" };
const stackDurLabelStyle = { fontSize: "12px", color: "#ccc", marginBottom: "4px" };
//Pending-effect section labels
const pendingDurLabelStyle = { marginBottom: "4px", color: "white" };
const pendingDurSectionStyle = { fontSize: "13px" };

function CharacterCard({ character }) {
    const [healthInput, setHealthInput] = useState("");
    const [editingHealth, setEditingHealth] = useState(false);

    const card = useCharacterCardActions(character);
    const globalEffects = useGameDataStore(state => state.globalEffects);
    const damageTypes = useGameDataStore(state => state.damageTypes);

    const getEffectDescription = (effect) => {
        if (effect.slug.startsWith("persistent ")) {
            const type = effect.damageType ?? effect.slug.replace("persistent ", "");
            return `At the end of each round, you take ${effect.value} ${type} damage. Attempt a DC 15 flat check to end this condition.`;
        }
        const info = globalEffects?.find(e => e.name.toLowerCase() === effect.slug.toLowerCase());
        return info?.description || effect.description || effect.slug;
    };

    const maxHealth = character?.stats?.maxHealth ?? 0;
    const currentHealth = character?.stats?.currentHealth ?? 0;
    const hpPercent = maxHealth ? (currentHealth / maxHealth) * 100 : 100;

    const handleHealthBarClick = (e) => {
        e.stopPropagation();
        if (!character.name) return;
        setHealthInput(String(currentHealth));
        setEditingHealth(true);
    };

    const commitHealthEdit = () => {
        card.handleHealthChange(healthInput);
        setEditingHealth(false);
    };

    return (
        <Card
            style={{ ...cardBaseStyle, boxShadow: card.isActiveActor ? "0 0 10px 3px" : "none" }}
            onClick={() => card.selectTarget(character.side, character.id, character.sourceID)}
        >
            {card.isTargetCharacters && <div>🛡️ TARGET</div>}

            <Button
                variant="outline-danger" size="sm"
                style={deleteBtnStyle}
                onClick={e => { e.stopPropagation(); card.deleteCharacterFromList(character.side, character.id); }}
            >
                X
            </Button>

            <Card.Body>
                {character?.name && (
                    <h5 style={charNameStyle}>
                        {currentHealth <= 0 && <span title="Dead / 0 HP" style={skullStyle}>💀</span>}
                        {character.name}
                    </h5>
                )}

                <img src={character?.image || blankPicture} alt="Character" className="w-100 mb-2" />

                {editingHealth ? (
                    <div className="d-flex gap-1 mb-2" onClick={e => e.stopPropagation()}>
                        <input
                            type="number" value={healthInput} min={0} max={maxHealth} autoFocus
                            onChange={e => setHealthInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") commitHealthEdit(); if (e.key === "Escape") setEditingHealth(false); }}
                            style={healthInputStyle}
                        />
                        <Button size="sm" variant="success" onClick={commitHealthEdit}>✓</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingHealth(false)}>✕</Button>
                    </div>
                ) : (
                    <ProgressBar
                        variant="success" now={hpPercent} label={`${currentHealth}/${maxHealth}`}
                        className="mb-2" onClick={handleHealthBarClick} style={progressBarStyle}
                    />
                )}

                <div className="d-flex justify-content-center mb-3">
                    {(character.actionsRemaining || [true, true, true]).map((active, i) => (
                        <div
                            key={i}
                            onClick={e => { e.stopPropagation(); card.handleActionClick(i); }}
                            style={{
                                width: "20px", height: "20px", margin: "5px",
                                backgroundColor: active ? "limegreen" : "gray", cursor: "pointer",
                            }}
                        />
                    ))}
                </div>

                {character.effects && character.effects.length > 0 && (
                    <div className="mt-2">
                        <div style={effectListStyle}>
                            {character.effects.map((effect) => (
                                <OverlayTrigger key={effect.slug} placement="top" overlay={<Tooltip>{getEffectDescription(effect)}</Tooltip>}>
                                    <div
                                        onClick={e => { e.stopPropagation(); card.handleChangedEffect(effect); }}
                                        style={effectBadgeStyle}
                                        onMouseEnter={e => { e.currentTarget.style.color = "#28a745"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = ""; e.currentTarget.style.transform = "scale(1)"; }}
                                    >
                                        {effect.slug}{(effect.value > 1 || effect.slug.startsWith("persistent ")) && effect.slug !== OFF_GUARD ? ` (${effect.value})` : ""}
                                        {effect.duration?.type === "rounds"       && <span style={durationLabelStyle}> [{effect.duration.remaining}r]</span>}
                                        {effect.duration?.type === "endOfRound"   && <span style={durationLabelStyle}> [eor]</span>}
                                        {effect.duration?.type === "currentTurn"  && <span style={durationLabelStyle}> [this turn]</span>}
                                        {effect.duration?.type === "endOfNextTurn" && <span style={durationLabelStyle}> [eont]</span>}
                                    </div>
                                </OverlayTrigger>
                            ))}
                        </div>
                    </div>
                )}

                {card.stackEdit && (
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                        {card.stackEdit.isPersistent ? (
                            <>
                                <div style={stackLevelLabelStyle}>{card.stackEdit.effect.slug}: Amount (0 = delete)</div>
                                <div className="d-flex gap-1 align-items-center mb-2">
                                    <input
                                        type="number" value={card.stackEdit.inputValue} min={0} max={card.MAX_STACK} autoFocus
                                        onChange={e => card.setStackEdit(s => ({ ...s, inputValue: e.target.value }))}
                                        onKeyDown={e => { if (e.key === "Enter") card.handleConfirmStackEdit(); if (e.key === "Escape") card.setStackEdit(null); }}
                                        style={stackInputStyle}
                                    />
                                    <Button size="sm" variant="success" onClick={card.handleConfirmStackEdit}>✓</Button>
                                    <Button size="sm" variant="secondary" onClick={() => card.setStackEdit(null)}>✕</Button>
                                </div>
                                <div style={stackDurLabelStyle}>Damage Type:</div>
                                <select
                                    value={card.stackEdit.damageType ?? ""}
                                    onChange={e => card.setStackEdit(s => ({ ...s, damageType: e.target.value }))}
                                    style={{ width: "100%", marginBottom: "4px", background: "#222", color: "white", border: "1px solid #555", borderRadius: "4px", padding: "2px" }}
                                >
                                    {(damageTypes ?? []).map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                                </select>
                            </>
                        ) : (
                            <>
                                <div style={stackLevelLabelStyle}>{card.stackEdit.effect.slug}: Level (0 = delete)</div>
                                <div className="d-flex gap-1 align-items-center mb-2">
                                    <input
                                        type="number" value={card.stackEdit.inputValue} min={0} max={card.MAX_STACK} autoFocus
                                        onChange={e => card.setStackEdit(s => ({ ...s, inputValue: e.target.value }))}
                                        onKeyDown={e => { if (e.key === "Enter") card.handleConfirmStackEdit(); if (e.key === "Escape") card.setStackEdit(null); }}
                                        style={stackInputStyle}
                                    />
                                    <Button size="sm" variant="success" onClick={card.handleConfirmStackEdit}>✓</Button>
                                    <Button size="sm" variant="secondary" onClick={() => card.setStackEdit(null)}>✕</Button>
                                </div>
                            </>
                        )}
                        <div style={stackDurLabelStyle}>Duration:</div>
                        <div style={durPillRowStyle}>
                            {DURATION_DEFS.map(def => {
                                const needsActor = (def.type === "endOfNextTurn" || def.type === "currentTurn") && !card.hasActiveActor;
                                const isSelected = card.stackEdit.durationType === def.type;
                                return (
                                    <OverlayTrigger key={def.type} placement="top" popperConfig={{ strategy: "fixed" }} overlay={<Tooltip id={`tt-dur-se-${def.type}`}>{needsActor ? "Requires an active actor to be selected" : def.desc}</Tooltip>}>
                                        <span
                                            role="button"
                                            tabIndex={needsActor ? -1 : 0}
                                            onClick={() => { if (!needsActor) card.setStackEdit(s => ({ ...s, durationType: def.type })); }}
                                            onKeyDown={e => { if (!needsActor && (e.key === "Enter" || e.key === " ")) card.setStackEdit(s => ({ ...s, durationType: def.type })); }}
                                            style={{
                                                cursor: needsActor ? "not-allowed" : "pointer",
                                                userSelect: "none", fontSize: "11px",
                                                padding: "2px 7px", borderRadius: "999px",
                                                opacity: needsActor ? 0.35 : 1,
                                                background: isSelected ? "#6c757d" : "#333",
                                                color:      isSelected ? "white"   : "#aaa",
                                                border: `1px solid ${isSelected ? "#6c757d" : "#555"}`,
                                            }}
                                        >
                                            {def.label}
                                        </span>
                                    </OverlayTrigger>
                                );
                            })}
                        </div>
                        {card.stackEdit.durationType === "rounds" && (
                            <input
                                type="number" min={1} value={card.stackEdit.remaining}
                                onChange={e => card.setStackEdit(s => ({ ...s, remaining: Math.max(1, parseInt(e.target.value) || 1) }))}
                                onWheel={e => e.preventDefault()}
                                style={roundsInputStyle}
                            />
                        )}
                    </div>
                )}

                <div
                    onClick={card.handleOffGuardToggle}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        marginTop: "10px", cursor: "pointer", userSelect: "none",
                        padding: "4px 6px", borderRadius: "6px",
                        background: card.isOffGuard ? "rgba(255,100,100,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${card.isOffGuard ? "rgba(255,100,100,0.4)" : "rgba(255,255,255,0.1)"}`,
                    }}
                >
                    <div style={{
                        width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0,
                        background: card.isOffGuard ? "#e05555" : "transparent",
                        border: `2px solid ${card.isOffGuard ? "#e05555" : "#888"}`,
                    }} />
                    <span style={{ fontSize: "12px", color: card.isOffGuard ? "#e05555" : "#aaa" }}>Off-Guard</span>
                </div>

                {!card.addingEffect ? (
                    <Button
                        variant="outline-info" className="w-100 mt-3"
                        onClick={e => { e.stopPropagation(); if (character.name) card.setAddingEffect(true); }}
                    >
                        Add Effect
                    </Button>
                ) : (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                        {!card.pendingEffect ? (
                            <SearchbarToggle
                                placeholder="Search effects..."
                                list={card.filteredEffects}
                                getLabel={item => item}
                                onSelect={card.handleSelectEffect}
                                onBlur={() => card.setAddingEffect(false)}
                            />
                        ) : (
                            <div style={pendingDurSectionStyle}>
                                <div style={pendingDurLabelStyle}>
                                    {card.pendingEffect.name === "persistent" ? "Persistent Damage" : `${card.pendingEffect.name}: Duration`}
                                </div>
                                {card.pendingEffect.name === "persistent" && (
                                    <>
                                        <select
                                            value={card.pendingEffect.damageType ?? ""}
                                            onChange={e => card.setPendingEffect(p => ({ ...p, damageType: e.target.value }))}
                                            style={{ width: "100%", marginBottom: "4px", background: "#222", color: "white", border: "1px solid #555", borderRadius: "4px", padding: "2px" }}
                                        >
                                            <option value="">-- Damage type --</option>
                                            {(damageTypes ?? []).map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                                        </select>
                                        <input
                                            type="number" min={1} placeholder="Amount"
                                            value={card.pendingEffect.damageAmount ?? 1}
                                            onChange={e => card.setPendingEffect(p => ({ ...p, damageAmount: Math.max(1, parseInt(e.target.value) || 1) }))}
                                            onWheel={e => e.preventDefault()}
                                            style={{ ...roundsInputStyle, marginBottom: "4px" }}
                                        />
                                    </>
                                )}
                                <div style={durPillRowStyle}>
                                    {DURATION_DEFS.map(def => {
                                        const needsActor = (def.type === "endOfNextTurn" || def.type === "currentTurn") && !card.hasActiveActor;
                                        const isSelected = card.pendingEffect.durationType === def.type;
                                        return (
                                            <OverlayTrigger key={def.type} placement="top" popperConfig={{ strategy: "fixed" }} overlay={<Tooltip id={`tt-dur-cc-${def.type}`}>{needsActor ? "Requires an active actor to be selected" : def.desc}</Tooltip>}>
                                                <span
                                                    role="button"
                                                    tabIndex={needsActor ? -1 : 0}
                                                    onClick={() => { if (!needsActor) card.setPendingEffect(p => ({ ...p, durationType: def.type })); }}
                                                    onKeyDown={e => { if (!needsActor && (e.key === "Enter" || e.key === " ")) card.setPendingEffect(p => ({ ...p, durationType: def.type })); }}
                                                    style={{
                                                        cursor: needsActor ? "not-allowed" : "pointer",
                                                        userSelect: "none", fontSize: "11px",
                                                        padding: "2px 7px", borderRadius: "999px",
                                                        opacity: needsActor ? 0.35 : 1,
                                                        background: isSelected ? "#6c757d" : "#333",
                                                        color:      isSelected ? "white"   : "#aaa",
                                                        border: `1px solid ${isSelected ? "#6c757d" : "#555"}`,
                                                    }}
                                                >
                                                    {def.label}
                                                </span>
                                            </OverlayTrigger>
                                        );
                                    })}
                                </div>
                                {card.pendingEffect.durationType === "rounds" && (
                                    <input
                                        type="number" min={1} value={card.pendingEffect.remaining}
                                        onChange={e => card.setPendingEffect(p => ({ ...p, remaining: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        onWheel={e => e.preventDefault()}
                                        style={roundsInputStyle}
                                    />
                                )}
                                <div style={confirmRowStyle}>
                                    <Button size="sm" variant="success" className="w-100" onClick={card.handleConfirmEffect}>Add</Button>
                                    <Button size="sm" variant="secondary" className="w-100" onClick={() => { card.setPendingEffect(null); card.setAddingEffect(false); }}>Cancel</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default CharacterCard;
