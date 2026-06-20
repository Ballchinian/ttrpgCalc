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
                    className="mb-0"
                />
                <div className="text-muted small ms-4 mb-2">Expected value - probability-weighted averages. Best for theorycrafting; the condition % breakdowns only appear in this mode.</div>
                <Form.Check
                    type="radio"
                    id="dice-luck"
                    label="Lucky Rolls (real dice)"
                    checked={settings.diceMode === "luck"}
                    onChange={() => updateSetting("diceMode", "luck")}
                    disabled={!!pendingAction}
                    className="mb-0"
                />
                <div className="text-muted small ms-4 mb-2">Rolls real dice once - a single sample, not an average. Shows how lucky/unlucky the roll was vs expected.</div>
                <Form.Check
                    type="radio"
                    id="dice-choose"
                    label="Choose Outcome"
                    checked={settings.diceMode === "choose"}
                    onChange={() => updateSetting("diceMode", "choose")}
                    disabled={!!pendingAction}
                    className="mb-0"
                />
                <div className="text-muted small ms-4 mb-3">You pick each result (crit/hit/miss) per target - for deliberate "what if" scenarios.</div>

                <hr className="border-secondary" />
                <p className="text-muted small mb-2">Automation</p>
                <Form.Check
                    type="switch"
                    id="auto-actions"
                    label="Ignore action cost"
                    checked={settings.autoActions}
                    onChange={e => updateSetting("autoActions", e.target.checked)}
                    className="mb-0"
                />
                <div className="text-muted small ms-5 mb-2">On: actions are free (no 3-action turn limit). Off: each action spends from the 3 action pips.</div>
                <Form.Check
                    type="switch"
                    id="auto-map"
                    label="Auto increment MAP"
                    checked={settings.autoMAP}
                    onChange={e => updateSetting("autoMAP", e.target.checked)}
                    className="mb-0"
                />
                <div className="text-muted small ms-5 mb-2">On: the multiple-attack penalty steps up automatically each attack (and the MAP control becomes read-only).</div>
                <Form.Check
                    type="switch"
                    id="auto-decrement"
                    label="Auto-tick durations &amp; persistent damage"
                    checked={settings.autoDecrementConditions}
                    onChange={e => updateSetting("autoDecrementConditions", e.target.checked)}
                    className="mb-0"
                />
                <div className="text-muted small ms-5 mb-2">At end of round: decrement condition durations and roll persistent-damage flat checks (and apply the damage). Off: nothing ticks.</div>
                <Form.Check
                    type="switch"
                    id="ignore-hp"
                    label="Ignore HP changes"
                    checked={settings.ignoreHP}
                    onChange={e => updateSetting("ignoreHP", e.target.checked)}
                    className="mb-0"
                />
                <div className="text-muted small ms-5 mb-2">On: targets never actually lose HP, but the recap still shows full theoretical damage - good for repeating the same experiment.</div>
                <Form.Check
                    type="switch"
                    id="cap-overkill"
                    label="Cap overkill damage"
                    checked={settings.capOverkill}
                    onChange={e => updateSetting("capOverkill", e.target.checked)}
                    className="mb-0"
                />
                <div className="text-muted small ms-5">On: damage counted against a dying/dead target is capped at its remaining HP, so overkill isn't added to the recap totals.</div>

            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="outline-light" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SettingsModal;
