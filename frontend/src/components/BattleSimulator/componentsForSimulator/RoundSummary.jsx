import { useMemo } from "react";
import { Accordion, OverlayTrigger, Tooltip } from "react-bootstrap";
import { OUTCOME_LABELS } from "../../../data/outcomeDefs";

//Static style for the inline condition-impact tooltip underline
const dottedUnderline = { borderBottom: "1px dotted rgba(200,200,255,0.6)", cursor: "help" };
//Row-level static styles
const condImpactRowStyle = { fontSize: "0.8em", opacity: 0.75 };
const offGuardRowStyle = { fontSize: "0.8em", opacity: 0.6 };
//Action row within actor summary
const actionRowStyle = { fontSize: "0.85em" };
//Recap damage tooltip underline
const recapDmgUnderlineStyle = { borderBottom: "1px dotted rgba(255,150,100,0.6)", cursor: "help" };
//Recap healing tooltip underline
const recapHealUnderlineStyle = { borderBottom: "1px dotted rgba(100,220,130,0.6)", cursor: "help" };
//Actor summary footer border
const actorFooterStyle = { borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.8em" };

function bracketStr(parts) {
    return parts.length > 0 ? " " + parts.map(p => `[${p}]`).join(" ") : "";
}

const dmgModColor = (mods) => {
    if (mods.some(m => m.kind === "immunity")) return "rgba(160,160,160,0.9)";
    const net = mods.reduce((s, m) => s + m.delta, 0);
    if (net > 0) return "rgba(255,120,80,0.9)";
    if (net < 0) return "rgba(100,160,255,0.9)";
    return "rgba(220,180,100,0.9)";
};

function DamageModifierRow({ dmgModifierInfo }) {
    if (!dmgModifierInfo?.length) return null;
    const parts = dmgModifierInfo.map(({ damageType, mods }) => {
        const color = dmgModColor(mods);
        const isImmune = mods.some(m => m.kind === "immunity");
        const modStr = isImmune
            ? "immune"
            : mods.map(m => m.kind === "resistance" ? `res ${m.delta}` : `wk +${m.delta}`).join(", ");
        return <span key={damageType} style={{ color, marginRight: "8px" }}>{damageType}: {modStr}</span>;
    });
    return (
        <div className="ps-5" style={condImpactRowStyle}>
            ↳ {parts}
        </div>
    );
}

function ConditionImpactRow({ impact, toggles }) {
    const totalGain = impact.damageGain ?? 0;
    const isLuck = impact.from !== undefined;

    const condParts = [];
    if (impact.actorConditions?.length > 0)
        condParts.push(`${impact.actorArrow} ${impact.actorConditions.join(", ")} on ${impact.actorName}`);
    if (impact.targetConditions?.length > 0)
        condParts.push(`${impact.targetArrow} ${impact.targetConditions.join(", ")} on ${impact.targetName}`);

    const brackets = [];

    if (toggles.successRate && !isLuck && impact.hitMultiplier !== null && impact.hitMultiplier !== undefined && impact.hitMultiplier !== 1)
        brackets.push(`${impact.hitMultiplier}× success rate`);

    if (!isLuck && totalGain !== 0)
        brackets.push(`~${totalGain} exp dmg`);
    if (isLuck) {
        brackets.push(`${OUTCOME_LABELS[impact.from]} → ${OUTCOME_LABELS[impact.to]}`);
        if (totalGain !== 0) brackets.push(`${totalGain} dmg`);
    }

    const gain = impact.damageGain ?? 0;
    const gainCls = gain > 0 ? "text-success" : gain < 0 ? "text-danger" : "text-muted";
    return (
        <div className={`ps-5 ${gainCls}`} style={condImpactRowStyle}>
            ↳ {condParts.join(", ")}{bracketStr(brackets)}
        </div>
    );
}

function OffGuardRow({ impact, toggles }) {
    const isLuck = impact.from !== undefined;
    const brackets = [];

    if (toggles.successRate && !isLuck && impact.hitMultiplier !== null && impact.hitMultiplier !== undefined && impact.hitMultiplier !== 1)
        brackets.push(`${impact.hitMultiplier}× success rate`);

    if (!isLuck)
        brackets.push(`~${impact.damageGain} exp dmg`);

    const luckTransition = isLuck ? `${OUTCOME_LABELS[impact.from]} → ${OUTCOME_LABELS[impact.to]}` : null;
    const luckDamage = isLuck && impact.damageGain !== 0 ? impact.damageGain : null;

    return (
        <div className="ps-5 text-muted" style={offGuardRowStyle}>
            ↳ ? if off-guard{bracketStr(brackets)}
            {luckTransition && ` [${luckTransition}]`}
            {luckDamage !== null && (
                impact.damageGainTooltip
                    ? <> [<OverlayTrigger trigger={["hover", "focus"]} placement="top"
                            overlay={<Tooltip>{impact.damageGainTooltip}</Tooltip>}>
                            <span style={dottedUnderline}>
                                {luckDamage} dmg
                            </span>
                          </OverlayTrigger>]</>
                    : ` [${luckDamage} dmg]`
            )}
        </div>
    );
}

//Build action summary: group by action name, show total damage + conditions applied
function ActionSummary({ actions }) {
    const byAction = useMemo(() => {
        const map = {};
        actions.forEach(entry => {
            const key = entry.actionName;
            if (!map[key]) map[key] = { totalDamage: 0, conditionsApplied: [] };
            map[key].totalDamage += entry.totalDamage ?? 0;
            (entry.conditionsApplied ?? []).forEach(c => map[key].conditionsApplied.push(c));
        });
        return Object.entries(map);
    }, [actions]);

    return (
        <div className="mb-3">
            <p className="fw-bold mb-1">Action Summary</p>
            {byAction.map(([actionName, data]) => {
                //Count condition applications: { "frightened:2": { label: "frightened 2", count: 3 } }
                const condCounts = {};
                data.conditionsApplied.forEach(({ conditionName, level }) => {
                    const key = `${conditionName}:${level}`;
                    if (!condCounts[key]) condCounts[key] = { label: level > 1 ? `${conditionName} ${level}` : conditionName, count: 0 };
                    condCounts[key].count++;
                });
                const condParts = Object.values(condCounts).map(({ label, count }) => count > 1 ? `${count}× ${label}` : label);

                return (
                    <div key={actionName} className="d-flex justify-content-between ps-3 text-muted" style={actionRowStyle}>
                        <span>
                            ↳ {actionName}
                            {condParts.length > 0 && <span className="text-warning-emphasis ms-2">→ {condParts.join(", ")}</span>}
                        </span>
                        {data.totalDamage > 0 && <span>{data.totalDamage} dmg</span>}
                    </div>
                );
            })}
        </div>
    );
}

export function RoundSummary({ round, actions, toggles }) {
    const byActor = useMemo(() => {
        const result = {};
        actions.forEach(entry => {
            if (!result[entry.actorName]) result[entry.actorName] = { total: 0, luckDelta: null, healingLuckDelta: null, rows: [], critSpecImpacts: [] };
            result[entry.actorName].total += entry.totalDamage;
            result[entry.actorName].critSpecImpacts.push(...(entry.critSpecImpacts ?? []));
            if (entry.totalLuckDelta !== null && entry.totalLuckDelta !== undefined) {
                result[entry.actorName].luckDelta = (result[entry.actorName].luckDelta ?? 0) + entry.totalLuckDelta;
            }
            const entryHealingDelta = entry.targets?.reduce((sum, t) => t.healingLuckDelta !== null ? sum + (t.healingLuckDelta ?? 0) : sum, null);
            if (entryHealingDelta !== null) {
                result[entry.actorName].healingLuckDelta = (result[entry.actorName].healingLuckDelta ?? 0) + entryHealingDelta;
            }
            entry.targets.forEach(t => {
                result[entry.actorName].rows.push({
                    action: entry.actionName,
                    target: t.name,
                    damage: t.damageTaken,
                    healing: t.healingReceived,
                    conditionImpacts: t.conditionImpacts ?? [],
                    offGuardImpacts: t.offGuardImpacts ?? [],
                    outcomeKey: t.outcomeKey,
                    diceResult: t.diceResult,
                    avgOutcomeKey: t.avgOutcomeKey,
                    thresholds: t.thresholds ?? null,
                    offGuardBenefit: t.offGuardBenefit ?? 0,
                    mapPenalty: t.mapPenalty ?? 0,
                    diceTooltip: t.diceTooltip ?? null,
                    healingTooltip: t.healingTooltip ?? null,
                    healingLuckDelta: t.healingLuckDelta ?? null,
                    dmgModifierInfo: t.dmgModifierInfo ?? [],
                    wasKilled: t.wasKilled ?? false,
                });
            });
        });
        return result;
    }, [actions]);

    return (
        <Accordion.Item eventKey={String(round)}>
            <Accordion.Header>Round {round}</Accordion.Header>
            <Accordion.Body>

                {toggles.actions && <ActionSummary actions={actions} />}
                <p className="fw-bold mb-1">Damage Dealt</p>
                {Object.entries(byActor).map(([actor, data]) => {
                    const conditionGain = data.rows.reduce((sum, row) =>
                        sum + row.conditionImpacts.reduce((s, imp) => s + (imp.damageGain ?? 0), 0), 0
                    );
                    const offGuardGain = data.rows.reduce((sum, row) =>
                        sum + row.offGuardImpacts.reduce((s, imp) => s + (imp.damageGain ?? 0), 0), 0
                    );
                    const buffGain = data.rows.reduce((sum, row) => sum + row.conditionImpacts.reduce((s, i) => s + Math.max(0, i.damageGain ?? 0), 0), 0);
                    const debuffGain = data.rows.reduce((sum, row) => sum + row.conditionImpacts.reduce((s, i) => s + Math.min(0, i.damageGain ?? 0), 0), 0);
                    //Percentages are only meaningful in avg mode (expected-value units): suppress in luck/choose
                    const isAvgMode = data.rows.every(r => !r.outcomeKey);
                    const baseline = data.total - conditionGain;
                    const ogPct = isAvgMode && data.total > 0 ? Math.round((offGuardGain / data.total) * 100) : null;

                    return (
                    <div key={actor} className="mb-2">
                        <div className="d-flex justify-content-between fw-semibold">
                            <span>{actor}</span><span>{data.total} dmg</span>
                        </div>
                        {data.rows.map((row, i) => {
                            let brackets = "";
                            if (row.outcomeKey) {
                                const label = OUTCOME_LABELS[row.outcomeKey] ?? row.outcomeKey;
                                brackets = row.diceResult !== undefined
                                    ? ` [lucky - ${row.diceResult} | ${label}]`
                                    : ` [choose | ${label}]`;
                            } else if (row.avgOutcomeKey) {
                                brackets = ` [avg | ~${OUTCOME_LABELS[row.avgOutcomeKey] ?? row.avgOutcomeKey}]`;
                            }
                            if (toggles.thresholds && row.thresholds) {
                                const clamp = v => Math.min(20, Math.max(1, v));
                                const { cf, f, s, cs } = row.thresholds;
                                brackets += ` [cf: ≤${clamp(cf)}, f: ≤${clamp(f)}, s: ≥${clamp(s)}, cs: ≥${clamp(cs)}]`;
                            }
                            if (toggles.map && row.mapPenalty > 0) {
                                brackets += ` [MAP: -${row.mapPenalty}]`;
                            }
                            return (
                            <div key={i}>
                                <div className="d-flex justify-content-between ps-3 text-muted" style={actionRowStyle}>
                                    <span>↳ {row.action} → {row.target}{brackets}</span>
                                    <span>
                                        {row.damage > 0 && (row.diceTooltip
                                            ? <OverlayTrigger trigger={["hover", "focus"]} placement="top"
                                                overlay={<Tooltip id={`recap-dmg-${i}`}>{row.diceTooltip}</Tooltip>}>
                                                <span style={recapDmgUnderlineStyle}>
                                                    {row.damage} dmg
                                                </span>
                                              </OverlayTrigger>
                                            : `${row.damage} dmg`
                                        )}
                                        {row.damage > 0 && row.wasKilled && (
                                            <OverlayTrigger trigger={["hover", "focus"]} placement="top"
                                                overlay={<Tooltip id={`recap-killed-${i}`}>Damage limited — {row.target} was killed by this attack</Tooltip>}>
                                                <span className="text-danger ms-1" style={{ cursor: "help" }}>💀</span>
                                            </OverlayTrigger>
                                        )}
                                        {row.healing > 0 && (row.healingTooltip
                                            ? <OverlayTrigger trigger={["hover", "focus"]} placement="top"
                                                overlay={<Tooltip id={`recap-heal-${i}`}>{row.healingTooltip}</Tooltip>}>
                                                <span style={recapHealUnderlineStyle}>
                                                    {row.healing} heal
                                                </span>
                                              </OverlayTrigger>
                                            : ` ${row.healing} heal`
                                        )}
                                        {row.damage === 0 && row.healing === 0 && "—"}
                                    </span>
                                </div>
                                {toggles.buffs && row.conditionImpacts.map((impact, j) => (
                                    <ConditionImpactRow key={j} impact={impact} toggles={toggles} />
                                ))}
                                {toggles.offGuard && row.offGuardImpacts.map((impact, j) => (
                                    <OffGuardRow key={j} impact={impact} toggles={toggles} />
                                ))}
                                {toggles.dmgModifiers && <DamageModifierRow dmgModifierInfo={row.dmgModifierInfo} />}
                            </div>
                            );
                        })}
                        {toggles.critSpec && data.critSpecImpacts.map((imp, k) => (
                            <div key={`cs-${k}`} className={`ps-3 ${imp.kind === "applied" ? "text-info" : "text-muted"}`} style={actionRowStyle}>
                                ↳ {imp.text}
                            </div>
                        ))}
                        {((toggles.buffs && (buffGain > 0 || debuffGain < 0)) || (toggles.offGuard && offGuardGain > 0) || (toggles.luck && data.luckDelta !== null)) && (
                            <div className="mt-1 pt-1" style={actorFooterStyle}>
                                {toggles.buffs && buffGain > 0 && (
                                    <div className="text-success ps-2">
                                        buffs: +{buffGain} dmg{isAvgMode && baseline > 0 ? ` (+${Math.round((buffGain / baseline) * 100)}%)` : ""}
                                    </div>
                                )}
                                {toggles.buffs && debuffGain < 0 && (
                                    <div className="text-danger ps-2">
                                        debuffs: {debuffGain} dmg{isAvgMode && baseline > 0 ? ` (${Math.round((debuffGain / baseline) * 100)}%)` : ""}
                                    </div>
                                )}
                                {toggles.offGuard && offGuardGain > 0 && (
                                    <div className="text-muted ps-2">
                                        off-guard: +{offGuardGain} dmg{ogPct !== null ? ` (+${ogPct}%)` : ""}
                                    </div>
                                )}
                                {toggles.luck && data.luckDelta !== null && (
                                    <div className={`ps-2 ${data.luckDelta >= 0 ? "text-success" : "text-danger"}`}>
                                        Luck (dmg): {data.luckDelta >= 0 ? "+" : ""}{data.luckDelta} vs expected
                                    </div>
                                )}
                                {toggles.luck && data.healingLuckDelta !== null && (
                                    <div className={`ps-2 ${data.healingLuckDelta >= 0 ? "text-success" : "text-danger"}`}>
                                        Luck (heal): {data.healingLuckDelta >= 0 ? "+" : ""}{data.healingLuckDelta} vs expected
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    );
                })}

            </Accordion.Body>
        </Accordion.Item>
    );
}
