import { useMemo } from "react";
import { Modal, Button } from "react-bootstrap";

//Pre-action flat check a condition forces on a manipulate action (e.g. grabbed -> DC 5). On a failure
//the action is lost. Auto-rolls a d20 as a suggestion; the user confirms the outcome (consistent with
//the sim's choose-mode philosophy).
function ManipulateCheckModal({ checks, onPass, onFail }) {
    const roll = useMemo(() => Math.floor(Math.random() * 20) + 1, []);
    const dc = Math.max(...checks.map(c => c.dc));
    const passed = roll >= dc;
    const sources = checks.map(c => c.source).join(", ");
    return (
        <Modal show centered onHide={onFail}>
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title>Flat Check - Manipulate</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-dark text-white">
                <p className="small text-muted mb-2">
                    {sources} forces a DC {dc} flat check on this manipulate action - on a failure it's lost.
                </p>
                <div className="text-center mb-3" style={{ fontSize: "28px", fontWeight: 700, color: passed ? "var(--app-success)" : "var(--app-danger)" }}>
                    {roll}{" "}
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>vs DC {dc} - {passed ? "Pass" : "Fail"}</span>
                </div>
                <div className="d-flex gap-2 justify-content-center">
                    <Button variant="success" onClick={onPass}>Keep action (passed)</Button>
                    <Button variant="danger" onClick={onFail}>Lose action (failed)</Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default ManipulateCheckModal;
