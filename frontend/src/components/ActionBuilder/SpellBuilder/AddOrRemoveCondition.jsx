import { useState, useEffect } from "react";
import { apiFetch } from '../../../auth';
import { BACKEND_BASE_URL } from "../../../config";
import { DURATION_DEFS } from "../../../data/durationDefs";
import { Form, Row, Col, Button, OverlayTrigger, Tooltip } from "react-bootstrap";

function AddOrRemoveCondition({ onConfirm, onCancel, isAdding }) {
    const [effects, setEffects] = useState([]);
    const [fetchError, setFetchError] = useState(false);
    const [selectedEffect, setSelectedEffect] = useState(null);
    const [adjustByNumber, setAdjustByNumber] = useState(1);
    const [durationType, setDurationType] = useState("manual");
    const [remaining, setRemaining] = useState(1);
    const [errors, setErrors] = useState({});
    const [maxLevel, setMaxLevel] = useState(Infinity);

    useEffect(() => {
        const controller = new AbortController();
        apiFetch(`${BACKEND_BASE_URL}/actions/effects`, { signal: controller.signal })
            .then(r => { if (!r) throw new Error("No response"); return r.json(); })
            .then(data => setEffects(data))
            .catch(err => { if (err.name !== "AbortError") setFetchError(true); });
        return () => controller.abort();
    }, []);

    function handleEffectSelect(e) {
        const effect = effects.find(ef => ef.name === e.target.value);
        setAdjustByNumber(1); //always reset so stale value from prior effect can't exceed new maxLevel
        setMaxLevel(effect?.maxLevel || Infinity);
        setSelectedEffect(e.target.value);
        //Clear validation error when user makes a selection
        if (errors.selectedEffect) setErrors({});
        const def = effect?.defaultDuration;
        setDurationType(def?.type ?? "manual");
        setRemaining(def?.remaining ?? 1);
    }

    function handleUpdatedCondition() {
        if (!selectedEffect) {
            setErrors({ selectedEffect: "Select an effect" });
            return;
        }
        const duration = buildDuration(durationType, remaining);
        onConfirm({ type: isAdding ? "addCondition" : "removeCondition", condition: selectedEffect, adjustBy: adjustByNumber, ...(isAdding && { duration }) });
    }

    return (
        <div style={{ border: "1px solid #ccc", padding: "8px", marginTop: "4px" }}>
            {fetchError && <p className="text-danger small">Failed to load effects. Please try again.</p>}

            <Form.Group className="mb-2">
                <Form.Label>{isAdding ? "Effect to Add" : "Effect to Remove"}</Form.Label>
                <Form.Control
                    as="select"
                    value={selectedEffect || ""}
                    onChange={handleEffectSelect}
                    isInvalid={!!errors.selectedEffect}
                    disabled={fetchError}
                >
                    <option key="placeholder" value="" disabled>Select effect...</option>
                    {effects.map((effect) => (
                        <option key={effect.name} value={effect.name}>{effect.name}</option>
                    ))}
                </Form.Control>
                <Form.Control.Feedback type="invalid">{errors.selectedEffect}</Form.Control.Feedback>
            </Form.Group>

            {selectedEffect && maxLevel !== 1 && (
                <Form.Group className="mb-2">
                    <Form.Label>Adjust By</Form.Label>
                    <Form.Control
                        type="number"
                        value={adjustByNumber}
                        min={1}
                        max={maxLevel === Infinity ? undefined : maxLevel}
                        onChange={(e) => setAdjustByNumber(Math.min(maxLevel === Infinity ? Infinity : maxLevel, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    />
                </Form.Group>
            )}

            {isAdding && selectedEffect && (
                <Form.Group className="mb-2">
                    <Form.Label>Duration</Form.Label>
                    <div className="d-flex gap-1 flex-wrap">
                        {DURATION_DEFS.map(def => (
                            <OverlayTrigger key={def.type} placement="top" popperConfig={{ strategy: "fixed" }} overlay={<Tooltip id={`tt-dur-${def.type}`}>{def.desc}</Tooltip>}>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className={`badge rounded-pill ${durationType === def.type ? "bg-secondary" : "bg-light text-secondary border"}`}
                                    style={{ cursor: "pointer", userSelect: "none" }}
                                    onClick={() => setDurationType(def.type)}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setDurationType(def.type); }}
                                >
                                    {def.label}
                                </span>
                            </OverlayTrigger>
                        ))}
                    </div>
                    {durationType === "rounds" && (
                        <Form.Control
                            type="number" className="mt-1" placeholder="Rounds remaining"
                            value={remaining}
                            onChange={e => setRemaining(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                    )}
                </Form.Group>
            )}

            <Row>
                <Col><Button variant="primary" onClick={handleUpdatedCondition} disabled={fetchError}>Confirm</Button></Col>
                <Col><Button variant="secondary" onClick={onCancel}>Cancel</Button></Col>
            </Row>
        </div>
    );
}

function buildDuration(type, remaining) {
    if (type === "rounds") return { type: "rounds", remaining };
    return { type };
}

export default AddOrRemoveCondition;
