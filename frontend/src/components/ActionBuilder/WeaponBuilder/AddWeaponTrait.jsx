import { useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import TraitFieldRenderer from "./WeaponTraitComponents";
import parseDmgDie from "../utill/parseDmgDie";

export default function AddWeaponTrait({ traitDefs, existingTraits, onConfirm, onCancel }) {
    const [selectedTrait, setSelectedTrait] = useState(null);
    const [configValue, setConfigValue] = useState({});
    const [errors, setErrors] = useState({});

    const traitDef = selectedTrait ? traitDefs[selectedTrait] : null;
    const fields = traitDef?.render?.fields ?? [];

    function handleConfirm() {
        if (!traitDef) return;

        const newErrors = {};
        fields.forEach(field => {
            const val = configValue[field.key];
            if (val == null || val === "") newErrors[field.key] = "Required";
            if (field.validateAs === "dmgDie" && val) {
                const parsed = parseDmgDie(val);
                if (parsed.errors) newErrors[field.key] = parsed.errors.dmgDieNumbers;
            }
        });
        if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

        onConfirm({
            name: selectedTrait,
            label: traitDef.label,
            data: fields.length > 0 ? configValue : undefined
        });
    }

    return (
        <div style={{ border: "1px solid #ccc", padding: "8px", marginTop: "4px" }}>
            <Form.Group className="mb-2">
                <Form.Label>Trait</Form.Label>
                <Form.Control
                    as="select"
                    value={selectedTrait ?? ""}
                    onChange={e => {
                        setSelectedTrait(e.target.value);
                        setConfigValue({});
                        setErrors({});
                    }}
                >
                    <option value="" disabled>Select trait...</option>
                    {Object.entries(traitDefs ?? {}).map(([key, def]) => (
                        <option
                            key={key}
                            value={key}
                            disabled={existingTraits.some(t => t.name === key)}
                        >
                            {def.label}
                        </option>
                    ))}
                </Form.Control>
            </Form.Group>

            {fields.length > 0 && (
                <TraitFieldRenderer
                    fields={fields}
                    value={configValue}
                    setValue={setConfigValue}
                    errors={errors}
                />
            )}

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
