import { useBattleStore } from "../../../store/battleStore";

const containerStyle = {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1051,
    backgroundColor: "#1e1e2e",
    border: "1px solid rgba(200,120,255,0.4)",
    borderRadius: "8px",
    padding: "12px 16px",
    minWidth: "320px",
    maxWidth: "480px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
};
const headerTitleStyle = { color: "rgba(200,120,255,0.9)", fontWeight: "600", fontSize: "14px", marginBottom: "2px" };
const headerSubStyle = { color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "10px" };
const rowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "5px 0", borderTop: "1px solid rgba(255,255,255,0.07)",
};
const nameStyle = { color: "white", fontSize: "13px" };
const detailStyle = { color: "rgba(255,255,255,0.5)", fontSize: "13px" };
const dismissStyle = {
    marginTop: "10px", width: "100%",
    padding: "4px 0", fontSize: "12px",
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "white", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "4px", cursor: "pointer",
};

function PersistentCheckNotification() {
    const results = useBattleStore(state => state.persistCheckResults);
    const clear   = useBattleStore(state => state.clearPersistChecks);

    if (!results?.length) return null;

    return (
        <div style={containerStyle}>
            <div style={headerTitleStyle}>DC 15 Flat Check — Persistent Damage</div>
            <div style={headerSubStyle}>Each persistent condition rolled to recover.</div>

            {results.map((r, i) => (
                <div key={i} style={rowStyle}>
                    <div>
                        <span style={nameStyle}>{r.charName}</span>
                        <span style={detailStyle}>{": "}{r.effectName} ({r.amount} {r.damageType})</span>
                    </div>
                    <span style={{ fontWeight: "600", color: r.recovered ? "#28a745" : "#dc3545", fontSize: "13px", marginLeft: "12px" }}>
                        {r.roll} — {r.recovered ? "Recovered" : "Failed"}
                    </span>
                </div>
            ))}

            <button style={dismissStyle} onClick={clear}>Dismiss</button>
        </div>
    );
}

export default PersistentCheckNotification;
