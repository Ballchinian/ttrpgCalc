import { useState, useMemo } from "react";
import { Modal, Button, Accordion, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useRecapStore } from "../../../store/recapStore";
import { useBattleStore } from "../../../store/battleStore";
import { RoundSummary } from "./RoundSummary";

const badgeStyle = { cursor: "pointer", userSelect: "none" };

const TOGGLE_DEFS = [
    {
        key: "buffs",
        label: "Buffs",
        desc: "Show how much damage conditions (buffs and debuffs) added or removed compared to a clean baseline.",
    },
    {
        key: "successRate",
        label: "Success Rate",
        desc: "How much the combined success + crit success rate changed compared to without conditions. Above 1 = hitting more often. Not applicable in lucky die mode.",
    },
    {
        key: "offGuard",
        label: "If Off-Guard",
        desc: "Hypothetical: how each attack would improve if the target had off-guard (−2 to AC).",
    },
    {
        key: "thresholds",
        label: "Thresholds",
        desc: "Show the minimum die roll needed for each outcome tier [cf: x, f: y, s: z, cs: w].",
    },
    {
        key: "map",
        label: "MAP",
        desc: "Show the Multiple Attack Penalty applied to each attack roll.",
    },
    {
        key: "luck",
        label: "Luck",
        desc: "Lucky die mode only: how much damage each actor dealt above or below the statistical average. Positive = lucky, negative = unlucky.",
    },
    {
        key: "actions",
        label: "Actions",
        desc: "Show a per-action summary: total damage dealt and conditions applied by each action this round.",
    },
    {
        key: "critSpec",
        label: "Crit Spec",
        desc: "Show what each weapon's critical specialization did after a critical hit — extra damage, conditions, or save results.",
    },
];

function RecapPanel() {
    const [show, setShow] = useState(false);
    const [toggles, setToggles] = useState({ buffs: true, successRate: true, offGuard: false, thresholds: false, map: false, luck: false, actions: false, critSpec: true });

    const recapHistory = useRecapStore(state => state.recapHistory);
    const clearRecap = useRecapStore(state => state.clearRecap);
    const resetRound = useBattleStore(state => state.resetRound);
    const resetBattle = useBattleStore(state => state.resetBattle);
    const showDamageModifiers = useBattleStore(state => state.settings.showDamageModifiers ?? true);
    const updateSetting = useBattleStore(state => state.updateSetting);

    const rounds = useMemo(() => Object.keys(recapHistory).map(Number).sort((a, b) => b - a), [recapHistory]);
    const toggleStat = key => setToggles(t => ({ ...t, [key]: !t[key] }));

    const sessionLuckDelta = useMemo(() => {
        let total = 0, hasAny = false;
        rounds.forEach(r => {
            (recapHistory[r] ?? []).forEach(entry => {
                if (entry.totalLuckDelta !== null && entry.totalLuckDelta !== undefined) {
                    total += entry.totalLuckDelta;
                    hasAny = true;
                }
            });
        });
        return hasAny ? total : null;
    }, [recapHistory, rounds]);

    const sessionOffGuardGain = useMemo(() => {
        let total = 0, hasAny = false;
        rounds.forEach(r => {
            (recapHistory[r] ?? []).forEach(entry => {
                if (entry.totalOffGuardGain !== null && entry.totalOffGuardGain !== undefined) {
                    total += entry.totalOffGuardGain;
                    hasAny = true;
                }
            });
        });
        return hasAny ? total : null;
    }, [recapHistory, rounds]);

    const sessionTotalDamage = useMemo(() => {
        let total = 0;
        rounds.forEach(r => {
            (recapHistory[r] ?? []).forEach(entry => { total += entry.totalDamage ?? 0; });
        });
        return total;
    }, [recapHistory, rounds]);

    //Aggregate per-condition impacts across session, sorted by absolute gain descending
    const sessionConditionBreakdown = useMemo(() => {
        const map = {};
        rounds.forEach(r => {
            (recapHistory[r] ?? []).forEach(entry => {
                Object.entries(entry.conditionBreakdown ?? {}).forEach(([name, gain]) => {
                    map[name] = (map[name] ?? 0) + gain;
                });
            });
        });
        return Object.entries(map).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    }, [recapHistory, rounds]);

    const handleClearRecap = () => { clearRecap(); resetRound(); setShow(false); };
    const handleResetBattle = () => { clearRecap(); resetBattle(); setShow(false); };

    return (
        <>
            <Button variant="outline-info" className="mb-2 w-100" onClick={() => setShow(true)}>
                Recap
            </Button>

            <Modal show={show} onHide={() => setShow(false)} size="lg" scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Battle Recap</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex gap-1 flex-wrap mb-3 align-items-center">
                        <small className="text-muted me-3">Show:</small>
                        {TOGGLE_DEFS.map(def => (
                            <OverlayTrigger key={def.key} placement="top" overlay={<Tooltip id={`tt-${def.key}`}>{def.desc}</Tooltip>}>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className={`badge rounded-pill ${toggles[def.key] ? "bg-secondary" : "bg-light text-secondary border"}`}
                                    style={badgeStyle}
                                    onClick={() => toggleStat(def.key)}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggleStat(def.key); }}
                                >
                                    {def.label}
                                </span>
                            </OverlayTrigger>
                        ))}
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tt-dmg-mod">Show resistance, weakness, and immunity sub-rows for each attack that had damage modified by the target's traits.</Tooltip>}>
                            <span
                                role="button"
                                tabIndex={0}
                                className={`badge rounded-pill ${showDamageModifiers ? "bg-secondary" : "bg-light text-secondary border"}`}
                                style={badgeStyle}
                                onClick={() => updateSetting("showDamageModifiers", !showDamageModifiers)}
                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") updateSetting("showDamageModifiers", !showDamageModifiers); }}
                            >
                                Resistance/Weakness
                            </span>
                        </OverlayTrigger>
                    </div>

                    {rounds.length === 0
                        ? <p className="text-muted">No actions resolved yet.</p>
                        : <>
                            <Accordion defaultActiveKey={String(rounds[0])}>
                                {rounds.map(r => <RoundSummary key={r} round={r} actions={recapHistory[r]} toggles={{ ...toggles, dmgModifiers: showDamageModifiers }} />)}
                            </Accordion>
                            {toggles.luck && sessionLuckDelta !== null && (
                                <div className={`mt-3 text-center fw-semibold ${sessionLuckDelta >= 0 ? "text-success" : "text-danger"}`}>
                                    Session Luck: {sessionLuckDelta >= 0 ? "+" : ""}{sessionLuckDelta} dmg vs expected
                                </div>
                            )}
                            {toggles.offGuard && sessionOffGuardGain !== null && (
                                <div className="mt-2 text-center fw-semibold text-muted">
                                    off-guard: +{sessionOffGuardGain} dmg{sessionTotalDamage > 0 ? ` (+${Math.round((sessionOffGuardGain / sessionTotalDamage) * 100)}%)` : ""}
                                </div>
                            )}
                            {toggles.buffs && sessionConditionBreakdown.length > 0 && (
                                <div className="mt-2 text-center text-muted" style={{ fontSize: "0.85em" }}>
                                    {sessionConditionBreakdown.map(([name, gain], i) => {
                                        const pct = sessionTotalDamage > 0 ? Math.round((gain / sessionTotalDamage) * 100) : null;
                                        return (
                                            <span key={name} className={gain > 0 ? "text-success" : "text-danger"}>
                                                {i > 0 && ", "}{name}: {gain > 0 ? "+" : ""}{gain} dmg{pct !== null ? ` (${pct > 0 ? "+" : ""}${pct}%)` : ""}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                          </>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleClearRecap}>Clear Recap</Button>
                    <Button variant="danger" onClick={handleResetBattle}>Reset Battle</Button>
                    <Button variant="secondary" onClick={() => setShow(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default RecapPanel;
