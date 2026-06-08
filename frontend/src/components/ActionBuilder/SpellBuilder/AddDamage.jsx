import { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useGameDataStore } from "../../../store/gameDataStore";
import parseDmgDie from "../utill/parseDmgDie";

function AddDamage({ onConfirm, onCancel }) {
    const [diceInput, setDiceInput] = useState("");
    const [damageType, setDamageType] = useState(null);
    const [persistent, setPersistent] = useState(false);
    const [errors, setErrors] = useState({});

    //Read from store, gameDataStore fetches damageTypes on app mount, no per-modal request needed
    const damageTypes = useGameDataStore(state => state.damageTypes ?? []);

    const handleConfirm = () => {
        const newErrors = {};
        const damageNumber = parseDmgDie(diceInput);

        if (damageNumber.errors) newErrors.dmgDieNumbers = damageNumber.errors.dmgDieNumbers;
        if (!damageType) newErrors.damageType = "Select a damage type";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        //category mirrors Foundry's damage-instance categories; only "persistent" is modelled for now
        onConfirm({ type: "damage", number: damageNumber, damageType, multiplier: 1, ...(persistent && { category: "persistent" }) });
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "8px", marginTop: "4px" }}>
            <Form.Group className="mb-2">
                <Form.Label>Damage (XdY + c)</Form.Label>
                <Form.Control
                    type="text"
                    value={diceInput}
                    onChange={(e) => { setDiceInput(e.target.value); if (errors.dmgDieNumbers) setErrors(prev => ({ ...prev, dmgDieNumbers: undefined })); }}
                    placeholder="e.g. 2d6"
                    isInvalid={!!errors.dmgDieNumbers}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                />
                <Form.Control.Feedback type="invalid">{errors.dmgDieNumbers}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-2">
                <Form.Label>Damage Type</Form.Label>
                <Form.Control
                    as="select"
                    value={damageType || ""}
                    onChange={(e) => { setDamageType(e.target.value); if (errors.damageType) setErrors(prev => ({ ...prev, damageType: undefined })); }}
                    isInvalid={!!errors.damageType}
                >
                    <option value="" disabled>Select damage type...</option>
                    {damageTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </Form.Control>
                <Form.Control.Feedback type="invalid">{errors.damageType}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-2">
                <Form.Check
                    type="radio"
                    label="Persistent: True"
                    name="persistent"
                    checked={persistent === true}
                    onChange={() => setPersistent(true)}
                />
                <Form.Check
                    type="radio"
                    label="Persistent: False"
                    name="persistent"
                    checked={persistent === false}
                    onChange={() => setPersistent(false)}
                />
            </Form.Group>

            <Row className="justify-content-center mt-3">
                <Col xs="5">
                    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
                </Col>
                <Col xs="3">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                </Col>
            </Row>
        </div>
    );
}

export default AddDamage;
