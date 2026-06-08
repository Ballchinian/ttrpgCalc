import { useState } from "react";
import { useBattleStore } from "../../../store/battleStore";

const containerStyle = {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1052,
    backgroundColor: "#1e1e2e",
    border: "1px solid rgba(180,120,60,0.5)",
    borderRadius: "8px",
    padding: "12px 16px",
    minWidth: "320px",
    maxWidth: "480px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
};
const headerTitleStyle = { color: "rgba(220,160,60,0.95)", fontWeight: "600", fontSize: "14px", marginBottom: "2px" };
const headerSubStyle = { color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "10px" };
const rowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "5px 0", borderTop: "1px solid rgba(255,255,255,0.07)",
};
const selectStyle = {
    width: "100%", padding: "4px 8px", fontSize: "13px",
    backgroundColor: "#2a2a3e", color: "white",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px",
    marginBottom: "10px",
};
const btnGroupStyle = { display: "flex", gap: "6px", marginTop: "10px" };
const applyBtnStyle = {
    padding: "4px 14px", fontSize: "12px",
    backgroundColor: "rgba(180,120,40,0.85)", color: "white",
    border: "none", borderRadius: "4px", cursor: "pointer",
};
const applyBtnDisabledStyle = { ...applyBtnStyle, opacity: 0.4, cursor: "default" };
const skipBtnStyle = {
    padding: "4px 14px", fontSize: "12px",
    backgroundColor: "rgba(255,255,255,0.08)", color: "white",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", cursor: "pointer",
};
const optionBtnStyle = (active) => ({
    padding: "3px 12px", fontSize: "12px",
    backgroundColor: active ? "rgba(180,120,40,0.85)" : "rgba(255,255,255,0.08)",
    color: "white",
    border: active ? "none" : "1px solid rgba(255,255,255,0.2)",
    borderRadius: "4px", cursor: "pointer",
});
const queueStyle = { color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "6px", textAlign: "right" };
const probabilityStyle = { color: "rgba(255,255,255,0.55)", fontSize: "12px", textAlign: "center", marginBottom: "10px" };
const rollBoxStyle = {
    textAlign: "center", marginBottom: "10px", padding: "8px 12px",
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.08)",
};
const rollNumberStyle = (outcome) => ({
    display: "block", fontSize: "28px", fontWeight: "700", lineHeight: "1.1",
    color: outcome === "failed" ? "rgba(220,80,60,0.9)" : "rgba(80,200,100,0.9)",
});
const rollLabelStyle = { display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "3px" };

function NichePromptPanel() {
    const pendingNichePrompts = useBattleStore(s => s.pendingNichePrompts);
    const resolveNichePrompt = useBattleStore(s => s.resolveNichePrompt);

    const [selectedChar, setSelectedChar] = useState("");
    const [selectedOption, setSelectedOption] = useState("");

    const prompt = pendingNichePrompts[0];
    if (!prompt) return null;

    const canApply =
        prompt.type === "characterSelect" ? !!selectedChar :
        prompt.type === "saveCondition"
            ? (prompt.mode === "choose"
                ? (selectedOption === "passed" || selectedOption === "failed")
                : prompt.predetermined === "failed")    //luck/avg: only enabled when there's a condition to apply
            : false;

    const applyValue = () => {
        if (prompt.type === "characterSelect") return selectedChar;
        if (prompt.type === "saveCondition") return prompt.mode === "choose" ? selectedOption : prompt.predetermined;
        return null;
    };

    const advance = (value) => {
        if (prompt.onResolve) prompt.onResolve(value ?? null);
        setSelectedChar("");
        setSelectedOption("");
        resolveNichePrompt();
    };

    return (
        <div style={containerStyle}>
            <div style={headerTitleStyle}>{prompt.title}</div>
            <div style={headerSubStyle}>{prompt.description}</div>

            {prompt.rollDisplay && (
                <div style={rollBoxStyle}>
                    <span style={rollNumberStyle(prompt.rollDisplay.outcome)}>{prompt.rollDisplay.roll}</span>
                    <span style={rollLabelStyle}>
                        {prompt.rollDisplay.label ?? "Flat Check"}
                        {prompt.rollDisplay.total != null && ` — ${prompt.rollDisplay.total} vs DC ${prompt.rollDisplay.dc}`}
                        {" — "}{prompt.rollDisplay.outcome === "failed" ? "Failed" : "Passed"}
                    </span>
                </div>
            )}

            {/* Axe: pick an adjacent creature to take the splash damage */}
            {prompt.type === "characterSelect" && prompt.characters?.length > 0 && (
                <select style={selectStyle} value={selectedChar} onChange={e => setSelectedChar(e.target.value)}>
                    <option value="">— Select creature —</option>
                    {prompt.characters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            )}

            {/* Save specs: choose mode lets the user decide pass/fail; luck/avg are pre-resolved above */}
            {prompt.type === "saveCondition" && prompt.mode === "choose" && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                    <button style={optionBtnStyle(selectedOption === "passed")} onClick={() => setSelectedOption("passed")}>Passed</button>
                    <button style={optionBtnStyle(selectedOption === "failed")} onClick={() => setSelectedOption("failed")}>Failed</button>
                </div>
            )}
            {prompt.type === "saveCondition" && prompt.mode === "avg" && prompt.probability != null && (
                <div style={probabilityStyle}>~{Math.round(prompt.probability * 100)}% chance to succeed</div>
            )}

            <div style={btnGroupStyle}>
                <button
                    style={canApply ? applyBtnStyle : applyBtnDisabledStyle}
                    disabled={!canApply}
                    onClick={() => advance(applyValue())}
                >
                    Apply
                </button>
                <button style={skipBtnStyle} onClick={() => advance(null)}>
                    Skip
                </button>
            </div>

            {pendingNichePrompts.length > 1 && (
                <div style={queueStyle}>{pendingNichePrompts.length - 1} more prompt{pendingNichePrompts.length > 2 ? "s" : ""} queued</div>
            )}
        </div>
    );
}

export default NichePromptPanel;
