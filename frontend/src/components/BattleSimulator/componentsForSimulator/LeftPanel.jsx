import { useState } from "react";
import { Button, OverlayTrigger, Tooltip, Row, Col } from "react-bootstrap";
import { useBattleStore } from "../../../store/battleStore";
import ActionPanel from "./ActionPanel";
import CombatLog from "./CombatLog";
import SettingsModal from "./SettingsModal";
import RecapPanel from "./RecapPanel";

const panelStyle = {
    width: "260px",
    paddingRight: "20px",
    position: "sticky",
    top: "20px",
    alignSelf: "flex-start",
    height: "fit-content",
    zIndex: 1000,
};

function LeftPanel() {
    const [showSettings, setShowSettings] = useState(false);

    const round = useBattleStore(state => state.round);
    const endRound = useBattleStore(state => state.endRound);
    const pendingAction = useBattleStore(state => state.pendingAction);
    const target = useBattleStore(state => state.target);
    const action = useBattleStore(state => state.action);
    const toggleTargetActiveActor = useBattleStore(state => state.toggleTargetActiveActor);
    const toggleTargetCharacters = useBattleStore(state => state.toggleTargetCharacters);

    const { mode: targetMode } = target;
    const { targetType } = action;
    const showTargetButton = targetType === "single" || targetType === "aoe";

    return (
        <div style={panelStyle}>
            <SettingsModal show={showSettings} onHide={() => setShowSettings(false)} />

            <div className="d-flex flex-column mb-4">

                <Button variant="outline-light" className="mb-2" onClick={endRound} disabled={!!pendingAction}>
                    Round {round ?? 1}: End Round
                </Button>

                <Button variant="outline-light" className="mb-2" onClick={() => setShowSettings(true)}>
                    ⚙ Settings
                </Button>

                <Row className="mb-2">
                    <Col md={showTargetButton ? 6 : 12} className="d-flex">
                        <OverlayTrigger overlay={<Tooltip>Click a card to choose the active character.</Tooltip>}>
                            <Button
                                variant={targetMode === "activeActor" ? "danger" : "outline-info"}
                                onClick={toggleTargetActiveActor}
                                className="w-100"
                            >
                                {targetMode === "activeActor" ? "Exit Target Mode" : "Select Active Character"}
                            </Button>
                        </OverlayTrigger>
                    </Col>

                    {showTargetButton && (
                        <Col md={6} className="d-flex">
                            <OverlayTrigger overlay={<Tooltip>Click cards to choose targets.</Tooltip>}>
                                <Button
                                    variant={targetMode === "targetCharacters" ? "danger" : "outline-warning"}
                                    onClick={toggleTargetCharacters}
                                >
                                    {targetMode === "targetCharacters" ? "Exit Select Targets" : "Select Targets"}
                                </Button>
                            </OverlayTrigger>
                        </Col>
                    )}
                </Row>
                <RecapPanel />
            </div>

            <ActionPanel />
            <CombatLog />
        </div>
    );
}

export default LeftPanel;
