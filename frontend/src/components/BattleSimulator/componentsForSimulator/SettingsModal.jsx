import { Modal, Form, Button } from "react-bootstrap";
import { useBattleStore } from "../../../store/battleStore";

//Only needs show/onHide, reads settings and updateSetting from the store.
function SettingsModal({ show, onHide }) {
    const settings = useBattleStore(state => state.settings);
    const updateSetting = useBattleStore(state => state.updateSetting);
    const pendingAction = useBattleStore(state => state.pendingAction);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Battle Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">

                <p className="text-muted small mb-2">Damage Calculation</p>
                {pendingAction && (
                    <p className="text-warning small mb-2">Resolve the pending outcome before changing dice mode.</p>
                )}
                <Form.Check
                    type="radio"
                    id="dice-avg"
                    label="Avg Die"
                    checked={settings.diceMode === "avg"}
                    onChange={() => updateSetting("diceMode", "avg")}
                    disabled={!!pendingAction}
                    className="mb-1"
                />
                <Form.Check
                    type="radio"
                    id="dice-luck"
                    label="Lucky Rolls (real dice)"
                    checked={settings.diceMode === "luck"}
                    onChange={() => updateSetting("diceMode", "luck")}
                    disabled={!!pendingAction}
                    className="mb-1"
                />
                <Form.Check
                    type="radio"
                    id="dice-choose"
                    label="Choose Outcome"
                    checked={settings.diceMode === "choose"}
                    onChange={() => updateSetting("diceMode", "choose")}
                    disabled={!!pendingAction}
                    className="mb-3"
                />

                <hr className="border-secondary" />
                <p className="text-muted small mb-2">Automation</p>
                <Form.Check
                    type="switch"
                    id="auto-actions"
                    label="Ignore Action Points"
                    checked={settings.autoActions}
                    onChange={e => updateSetting("autoActions", e.target.checked)}
                    className="mb-2"
                />
                <Form.Check
                    type="switch"
                    id="auto-map"
                    label="Auto increment MAP"
                    checked={settings.autoMAP}
                    onChange={e => updateSetting("autoMAP", e.target.checked)}
                    className="mb-2"
                />
                <Form.Check
                    type="switch"
                    id="auto-decrement"
                    label="Auto resolve Conditions"
                    checked={settings.autoDecrementConditions}
                    onChange={e => updateSetting("autoDecrementConditions", e.target.checked)}
                    className="mb-2"
                />
                <Form.Check
                    type="switch"
                    id="ignore-hp"
                    label="Ignore HP Changes"
                    checked={settings.ignoreHP}
                    onChange={e => updateSetting("ignoreHP", e.target.checked)}
                />

            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="outline-light" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SettingsModal;
