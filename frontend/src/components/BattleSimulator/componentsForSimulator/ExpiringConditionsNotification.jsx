import { useBattleStore } from "../../../store/battleStore";

const containerStyle = {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1050,
    backgroundColor: "#1e1e2e",
    border: "1px solid rgba(255,200,50,0.5)",
    borderRadius: "8px",
    padding: "12px 16px",
    minWidth: "320px",
    maxWidth: "480px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
};
const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 0",
    borderTop: "1px solid rgba(255,255,255,0.07)",
};
const btnGroupStyle = { display: "flex", gap: "6px", marginLeft: "12px" };
const removeButtonStyle = {
    padding: "2px 10px",
    fontSize: "12px",
    backgroundColor: "rgba(220,53,69,0.8)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
};
const removeButtonBlockedStyle = {
    padding: "2px 10px",
    fontSize: "12px",
    backgroundColor: "rgba(120,120,120,0.4)",
    color: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    cursor: "not-allowed",
};
const keepButtonStyle = {
    padding: "2px 10px",
    fontSize: "12px",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "4px",
    cursor: "pointer",
};
const headerTitleStyle = { color: "rgba(255,200,50,0.9)", fontWeight: "600", fontSize: "14px", marginBottom: "2px" };
const headerSubStyle = { color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "10px" };
const entryNameStyle = { color: "white", fontSize: "13px" };
const entryEffectStyle = { color: "rgba(255,255,255,0.55)", fontSize: "13px" };
const blockedHintStyle = { fontSize: "11px", color: "rgba(255,200,50,0.55)", marginTop: "2px", textAlign: "right" };

function ExpiringConditionsNotification() {
    const expiringConditions = useBattleStore(state => state.expiringConditions);
    const dismissExpiringCondition = useBattleStore(state => state.dismissExpiringCondition);
    const parties = useBattleStore(state => state.parties);

    if (!expiringConditions?.length) return null;

    const actorName = expiringConditions[0]?.actorName ?? "This actor";
    const allChars = [...(parties?.heroes ?? []), ...(parties?.foes ?? [])];

    return (
        <div style={containerStyle}>
            <div style={headerTitleStyle}>
                {actorName}'s turn has begun
            </div>
            <div style={headerSubStyle}>
                The following conditions were set to expire at the end of {actorName}'s next turn.
            </div>

            {expiringConditions.map((entry) => {
                //Off-guard can only be removed if no other conditions are granting it (e.g. prone, grabbed)
                let blockingSources = [];
                if (entry.effectName === "off-guard") {
                    const char = allChars.find(c => c.id === entry.charId);
                    blockingSources = (char?.offGuardSources ?? []).filter(src => src !== "off-guard");
                }
                const isBlocked = blockingSources.length > 0;

                return (
                    <div key={`${entry.charId}-${entry.effectName}`} style={rowStyle}>
                        <div>
                            <span style={entryNameStyle}>
                                {entry.charName}
                            </span>
                            <span style={entryEffectStyle}>
                                {": "}{entry.effectName}{entry.effectNumber > 1 ? ` (${entry.effectNumber})` : ""}
                            </span>
                        </div>
                        <div>
                            <div style={btnGroupStyle}>
                                <button
                                    onClick={isBlocked ? undefined : () => dismissExpiringCondition(entry.charId, entry.effectName, "remove")}
                                    disabled={isBlocked}
                                    style={isBlocked ? removeButtonBlockedStyle : removeButtonStyle}
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() => dismissExpiringCondition(entry.charId, entry.effectName, "keep")}
                                    style={keepButtonStyle}
                                >
                                    Keep
                                </button>
                            </div>
                            {isBlocked && (
                                <div style={blockedHintStyle}>
                                    Remove {blockingSources.join(", ")} first
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ExpiringConditionsNotification;
