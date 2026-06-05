import { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import parseDmgDie from "../utill/parseDmgDie";

function AddHealing({ onConfirm, onCancel }) {
    const [diceInput, setDiceInput] = useState("");
    const [errors, setErrors] = useState({});

    const handleConfirm = () => {
        const healingDie = parseDmgDie(diceInput);
        if (healingDie.errors) {
            setErrors({ dmgDieNumbers: healingDie.errors.dmgDieNumbers });
            return;
        }
        onConfirm({ type: "healing", number: healingDie });
    };
    return (
        <div style={{ border: "1px solid #ccc", padding: "8px", marginTop: "4px" }}>
            <Form.Group className="mb-2">
                <Form.Label>Healing Amount (XdY + c)</Form.Label>
                <Form.Control
                    type="text"
                    value={diceInput}
                    onChange={(e) => { setDiceInput(e.target.value); if (errors.dmgDieNumbers) setErrors({}); }}
                    placeholder="e.g. 2d6"
                    isInvalid={!!errors.dmgDieNumbers}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                />
                <Form.Control.Feedback type="invalid">{errors.dmgDieNumbers}</Form.Control.Feedback>
            </Form.Group>
            <Row>
                <Col><Button variant="primary" onClick={handleConfirm}>Confirm</Button></Col>
                <Col><Button variant="secondary" onClick={onCancel}>Cancel</Button></Col>
            </Row>
        </div>
    );
}

export default AddHealing;