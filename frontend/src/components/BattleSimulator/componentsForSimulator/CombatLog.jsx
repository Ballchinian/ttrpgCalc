import { useState, useRef } from "react";
import { Card, OverlayTrigger, Tooltip, Popover } from "react-bootstrap";
import { useBattleStore } from "../../../store/battleStore";
import { applyPendingAction } from "../../../utils/applyPendingAction";

const HOVER_FOCUS = ["hover", "focus"];
const cardStyle = {
    width: "100%",
    marginTop: "15px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
};
//Sub-component static styles
const popoverBodyStyle = { backgroundColor: "#1e1e2e", color: "white", fontSize: "12px", maxWidth: "260px" };
const conditionUnderlineStyle = { borderBottom: "1px dotted rgba(255,255,255,0.7)", cursor: "help" };
const damageUnderlineStyle = { borderBottom: "1px dotted rgba(255,150,100,0.8)", cursor: "help" };
const healingUnderlineStyle = { borderBottom: "1px dotted rgba(100,220,130,0.8)", cursor: "help" };
const breakdownUnderlineStyle = { cursor: "help", borderBottom: "1px dotted rgba(255,255,255,0.6)" };
const logHeaderStyle = { color: "white", marginBottom: "12px" };
const emptyLogStyle = { color: "rgba(255,255,255,0.4)", textAlign: "center", fontSize: "14px" };
const outcomesIndentStyle = { marginTop: "5px", paddingLeft: "8px", borderLeft: "1px solid rgba(255,255,255,0.1)" };
const outcomeEffectLineStyle = { fontSize: "12px", color: "rgba(255,255,255,0.4)", paddingLeft: "6px" };

const ConditionPopover = ({ description, ...props }) => (
    <Popover {...props}>
        <Popover.Body style={popoverBodyStyle}>
            {description || "No description available."}
        </Popover.Body>
    </Popover>
);

const modChipColor = (modifiers) => {
    if (!modifiers?.length) return null;
    if (modifiers.some(m => m.kind === "immunity")) return "rgba(160,160,160,0.9)";
    const net = modifiers.reduce((s, m) => s + m.delta, 0);
    if (net > 0) return "rgba(255,120,80,0.9)";
    if (net < 0) return "rgba(100,160,255,0.9)";
    return "rgba(220,180,100,0.9)";
};

const modChipDesc = (modifiers) => modifiers.map(m => {
    if (m.kind === "immunity") return "Immune";
    if (m.kind === "resistance") return `Resistance ${m.value} (${m.delta})`;
    if (m.kind === "weakness") return `Weakness ${m.value} (+${m.delta})`;
    return null;
}).filter(Boolean).join(" · ");

const BodyParts = ({ parts, showDamageModifiers }) => (
    <>
        {parts.map((part, i) => {
            if (part.type === "condition") {
                return (
                    <span key={i}>
                        <OverlayTrigger
                            trigger={HOVER_FOCUS}
                            placement="top"
                            overlay={<ConditionPopover description={part.description} id={`cond-${i}`} />}
                        >
                            <span style={conditionUnderlineStyle}>
                                {part.name}
                            </span>
                        </OverlayTrigger>
                        {part.suffix}
                    </span>
                );
            }
            if (part.type === "typedDamage") {
                const hasModifiers = showDamageModifiers && part.modifiers?.length > 0;
                const chipColor = hasModifiers ? modChipColor(part.modifiers) : null;
                const chipStyle = chipColor ? { color: chipColor, borderBottom: `1px dotted ${chipColor}`, cursor: "help" } : {};
                const valueEl = part.tooltip
                    ? (
                        <OverlayTrigger trigger={HOVER_FOCUS} placement="top" overlay={<Tooltip id={`dmg-${i}`}>{part.tooltip}</Tooltip>}>
                            <span style={damageUnderlineStyle}>{part.value}</span>
                        </OverlayTrigger>
                    )
                    : <span>{part.value}</span>;
                const chipEl = hasModifiers
                    ? (
                        <OverlayTrigger trigger={HOVER_FOCUS} placement="top" overlay={<ConditionPopover description={modChipDesc(part.modifiers)} id={`mod-${i}`} />}>
                            <span style={chipStyle}>({part.damageType})</span>
                        </OverlayTrigger>
                    )
                    : <span>({part.damageType})</span>;
                return <span key={i}>{valueEl} {chipEl}{part.suffix}</span>;
            }
            if (part.type === "damage") {
                return (
                    <span key={i}>
                        <OverlayTrigger
                            trigger={HOVER_FOCUS}
                            placement="top"
                            overlay={<Tooltip id={`dmg-${i}`}>{part.tooltip}</Tooltip>}
                        >
                            <span style={damageUnderlineStyle}>
                                {part.text}
                            </span>
                        </OverlayTrigger>
                    </span>
                );
            }
            if (part.type === "healing") {
                return (
                    <span key={i}>
                        <OverlayTrigger
                            trigger={HOVER_FOCUS}
                            placement="top"
                            overlay={<Tooltip id={`heal-${i}`}>{part.tooltip}</Tooltip>}
                        >
                            <span style={healingUnderlineStyle}>
                                {part.text}
                            </span>
                        </OverlayTrigger>
                    </span>
                );
            }
            return <span key={i}>{part.text}</span>;
        })}
    </>
);

const BreakdownChain = ({ label, breakdown }) => {
    const lastColon = label.lastIndexOf(": ");
    const prefix = lastColon >= 0 ? label.slice(0, lastColon + 2) : label;
    const value = lastColon >= 0 ? label.slice(lastColon + 2) : "";

    const prefixLines = prefix.split("\n");
    const renderedPrefix = prefixLines.map((line, i) => (
        <span key={i}>{line}{i < prefixLines.length - 1 && <br />}</span>
    ));

    if (!breakdown?.length) return <span>{renderedPrefix}{value}</span>;

    //Build tooltip: statName base -> source: valueChange -> ... -> statName: final
    const statName = prefixLines[prefixLines.length - 1].replace(":", "").trim();
    const finalNum = parseFloat(value);
    const baseNum = finalNum - breakdown.reduce((sum, b) => sum + b.valueChange, 0);
    const mods = breakdown.map(b => `${b.source}: ${b.valueChange >= 0 ? `+${b.valueChange}` : b.valueChange}`).join(" → ");
    const tipContent = `${statName}: ${baseNum} → ${mods} → ${statName}: ${finalNum}`;

    return (
        <span>
            {renderedPrefix}
            <OverlayTrigger placement="top" overlay={<Tooltip>{tipContent}</Tooltip>}>
                <span style={breakdownUnderlineStyle}>
                    {value}
                </span>
            </OverlayTrigger>
        </span>
    );
};

const bodyStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.05)",
    whiteSpace: "pre-line",
    color: "white",
    fontSize: "13px",
    textAlign: "center",
};

//Zero props: reads log and pendingAction from the store.
function CombatLog() {
    const log = useBattleStore(state => state.log);
    const pendingAction = useBattleStore(state => state.pendingAction);
    const lines = log?.lines ?? [];

    const applyingRef = useRef(false);

    const [expandedOutcomes, setExpandedOutcomes] = useState(new Set());
    const toggleOutcomes = (i) => setExpandedOutcomes(prev => {
        const next = new Set(prev);
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
    });

    return (
        <Card style={cardStyle}>
            <Card.Body>
                <h5 className="text-center" style={logHeaderStyle}>
                    Combat Log
                </h5>

                {lines.length === 0 && (
                    <div style={emptyLogStyle}>—</div>
                )}

                {lines.map((line, i) => (
                    <div key={i} style={{ marginBottom: i < lines.length - 1 ? "10px" : 0 }}>

                        {/* Roll header: left = attacker value/DC, right = target name + defence value */}
                        {line.roll && (
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.65)",
                                padding: "0 2px",
                            }}>
                                <BreakdownChain label={line.roll.left.label} breakdown={line.roll.left.breakdown} />
                                <BreakdownChain label={line.roll.right.label} breakdown={line.roll.right.breakdown} />
                            </div>
                        )}

                        {/* Body line: always shown */}
                        <div style={bodyStyle}>
                            {line.name}:{" "}
                            {line.bodyParts ? <BodyParts parts={line.bodyParts} showDamageModifiers={true} /> : line.body}
                        </div>

                        {/* Outcomes toggle + collapsible section */}
                        {line.outcomes && (() => {
                            const isChoosable = line.isChoosePending && pendingAction?.mode === "choose";
                            //Auto-open for choose mode; otherwise respect manual toggle
                            const isOpen = isChoosable || expandedOutcomes.has(i);
                            return (
                                <>
                                    <div
                                        onClick={() => !isChoosable && toggleOutcomes(i)}
                                        style={{
                                            marginTop: "6px",
                                            fontSize: "13px",
                                            color: isChoosable ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
                                            cursor: isChoosable ? "default" : "pointer",
                                            userSelect: "none",
                                        }}
                                    >
                                        {isOpen ? "▾" : "▸"} Outcomes
                                    </div>

                                    {isOpen && (
                                        <div style={outcomesIndentStyle}>
                                            {line.outcomes.map((o, oi) => (
                                                    <div
                                                        key={oi}
                                                        onClick={isChoosable ? () => {
                                                            if (applyingRef.current) return;
                                                            applyingRef.current = true;
                                                            applyPendingAction(o.applyKey, line.targetId);
                                                            applyingRef.current = false;
                                                        } : undefined}
                                                        style={{
                                                            cursor: isChoosable ? "pointer" : "default",
                                                            padding: "4px 6px",
                                                            borderRadius: "4px",
                                                            marginBottom: oi < line.outcomes.length - 1 ? "4px" : 0,
                                                        }}
                                                        onMouseEnter={isChoosable ? e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)" : undefined}
                                                        onMouseLeave={isChoosable ? e => e.currentTarget.style.backgroundColor = "transparent" : undefined}
                                                    >
                                                        <div style={{ fontSize: "13px", color: isChoosable ? "white" : "rgba(255,255,255,0.6)" }}>
                                                            {o.label} ({o.chance}%)
                                                        </div>
                                                        <div style={outcomeEffectLineStyle}>
                                                            {o.summaryParts
                                                                ? <BodyParts parts={o.summaryParts} showDamageModifiers={true} />
                                                                : o.summary
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                ))}
            </Card.Body>
        </Card>
    );
}

export default CombatLog;
