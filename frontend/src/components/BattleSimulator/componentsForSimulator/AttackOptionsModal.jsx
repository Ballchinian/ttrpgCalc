import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

//Consolidates all confirm-time attack choices into one non-assuming modal, so multiple options that
//line up at once (versatile damage type + a class strike rider like Precise Strike) don't stack up as
//separate popups. Each section only renders when it applies; Confirm resolves the turn with both.
//The rider only reaches here when at least two of its options are actually available to the actor
//(see getEligibleStrikeRider), so every option shown is a real, pickable choice.
function AttackOptionsModal({ versatile, rider, onConfirm, onCancel }) {
    const options = rider?.options ?? [];
    const defaultOption = options.find(o => o.default) ?? options[0];

    const [damageType, setDamageType] = useState(versatile?.default ?? null);
    const [riderOptionId, setRiderOptionId] = useState(defaultOption?.id ?? null);
    if (!versatile && !rider) return null;

    const confirm = () => onConfirm({
        damageType: versatile ? damageType : null,
        riderOption: rider?.options.find(o => o.id === riderOptionId) ?? null,
    });

    return (
        <Modal show onHide={onCancel} centered>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Attack Options</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                {versatile && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small text-muted">Damage type (versatile)</Form.Label>
                        <div className="d-flex gap-2 flex-wrap">
                            {versatile.damageTypes.map(dt => (
                                <Button key={dt} size="sm" variant={damageType === dt ? "warning" : "outline-light"} onClick={() => setDamageType(dt)}>
                                    {dt}
                                </Button>
                            ))}
                        </div>
                    </Form.Group>
                )}
                {rider && (
                    <Form.Group className="mb-1">
                        <Form.Label className="small text-muted">Precise Strike</Form.Label>
                        <div className="d-flex flex-column gap-2">
                            {options.map(opt => (
                                <Button
                                    key={opt.id}
                                    size="sm"
                                    variant={riderOptionId === opt.id ? "warning" : "outline-light"}
                                    onClick={() => setRiderOptionId(opt.id)}
                                >
                                    {opt.label}{opt.default ? " (default)" : ""}
                                </Button>
                            ))}
                        </div>
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-dark border-secondary">
                <Button variant="outline-light" onClick={onCancel}>Cancel</Button>
                <Button variant="warning" onClick={confirm}>Confirm Attack</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AttackOptionsModal;
