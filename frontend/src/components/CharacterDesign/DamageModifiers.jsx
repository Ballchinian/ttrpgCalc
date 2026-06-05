import { useState, useMemo } from "react";
import { Button, Card, CardBody, Modal, Form, Row, Col } from "react-bootstrap";

const MODAL_CONFIG = {
    resistances: { title: "Add Resistance", needsValue: true },
    weaknesses:  { title: "Add Weakness",   needsValue: true },
    immunities:  { title: "Add Immunity",   needsValue: false },
};

const itemRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
    fontSize: "13px",
    color: "#a6c0b7",
};

const itemHoverStyle = { cursor: "pointer" };

export function DamageModifiers({ damageTypes, resistances, setResistances, weaknesses, setWeaknesses, immunities, setImmunities }) {
    const [modalType, setModalType] = useState(null);
    const [search, setSearch] = useState("");
    const [addValue, setAddValue] = useState(5);

    const filtered = useMemo(() =>
        damageTypes.filter(t => !search || t.toLowerCase().includes(search.toLowerCase()))
    , [damageTypes, search]);

    const config = MODAL_CONFIG[modalType] ?? {};

    const handleClose = () => { setModalType(null); setSearch(""); setAddValue(5); };

    const handleAdd = (type) => {
        if (modalType === "resistances")
            setResistances(prev => [...prev.filter(r => r.damageType !== type), { damageType: type, value: addValue }]);
        else if (modalType === "weaknesses")
            setWeaknesses(prev => [...prev.filter(w => w.damageType !== type), { damageType: type, value: addValue }]);
        else if (modalType === "immunities")
            setImmunities(prev => prev.includes(type) ? prev : [...prev, type]);
    };

    return (
        <>
            <Row className="gx-3">
                {/* Resistances */}
                <Col xs={4}>
                    <Card style={{ maxWidth: "215px" }}>
                        <CardBody>
                            <h4>Resistances</h4>
                            {resistances.map((r, i) => (
                                <div key={i} style={{ ...itemRowStyle, ...itemHoverStyle }}
                                    onClick={() => setResistances(prev => prev.filter((_, j) => j !== i))}
                                    onMouseEnter={e => e.currentTarget.style.color = "#28a745"}
                                    onMouseLeave={e => e.currentTarget.style.color = "#a6c0b7"}
                                >
                                    <span className="text-capitalize text-truncate">{r.damageType} ({r.value})</span>
                                </div>
                            ))}
                            <Button size="sm" variant="outline-success" className="w-100 mt-1" onClick={() => setModalType("resistances")}>
                                + Add
                            </Button>
                        </CardBody>
                    </Card>
                </Col>

                {/* Weaknesses */}
                <Col xs={4}>
                    <Card style={{ maxWidth: "215px" }}>
                        <CardBody>
                            <h4>Weaknesses</h4>
                            {weaknesses.map((w, i) => (
                                <div key={i} style={{ ...itemRowStyle, ...itemHoverStyle }}
                                    onClick={() => setWeaknesses(prev => prev.filter((_, j) => j !== i))}
                                    onMouseEnter={e => e.currentTarget.style.color = "#28a745"}
                                    onMouseLeave={e => e.currentTarget.style.color = "#a6c0b7"}
                                >
                                    <span className="text-capitalize text-truncate">{w.damageType} ({w.value})</span>
                                </div>
                            ))}
                            <Button size="sm" variant="outline-success" className="w-100 mt-1" onClick={() => setModalType("weaknesses")}>
                                + Add
                            </Button>
                        </CardBody>
                    </Card>
                </Col>

                {/* Immunities */}
                <Col xs={4}>
                    <Card style={{ maxWidth: "215px" }}>
                        <CardBody>
                            <h4>Immunities</h4>
                            {immunities.map((imm, i) => (
                                <div key={i} style={{ ...itemRowStyle, ...itemHoverStyle }}
                                    onClick={() => setImmunities(prev => prev.filter((_, j) => j !== i))}
                                    onMouseEnter={e => e.currentTarget.style.color = "#28a745"}
                                    onMouseLeave={e => e.currentTarget.style.color = "#a6c0b7"}
                                >
                                    <span className="text-capitalize text-truncate">{imm}</span>
                                </div>
                            ))}
                            <Button size="sm" variant="outline-success" className="w-100 mt-1" onClick={() => setModalType("immunities")}>
                                + Add
                            </Button>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Modal show={!!modalType} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{config.title ?? ""}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {config.needsValue && (
                        <div className="d-flex align-items-center gap-4 mb-3">
                            <span>Value</span>
                            <Form.Control
                                type="number" min="0" value={addValue}
                                style={{ width: "80px" }}
                                onChange={e => setAddValue(Number(e.target.value))}
                            />
                        </div>
                    )}
                    <Form.Control
                        type="text" placeholder="Search damage types..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="mb-3" autoFocus
                    />
                    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                        {(() => {
                            const available = filtered.filter(type =>
                                modalType === "resistances" ? !resistances.some(r => r.damageType === type) :
                                modalType === "weaknesses"  ? !weaknesses.some(w => w.damageType === type) :
                                modalType === "immunities"  ? !immunities.includes(type) : true
                            );
                            return <>
                                {available.length === 0 && <p className="text-muted">No damage types found.</p>}
                                {available.map(type => (
                                    <div
                                        key={type} onClick={() => handleAdd(type)}
                                        style={{ cursor: "pointer", marginBottom: "4px", fontSize: "13px", color: "#a6c0b7" }}
                                        onMouseEnter={e => e.currentTarget.style.color = "#28a745"}
                                        onMouseLeave={e => e.currentTarget.style.color = "#a6c0b7"}
                                    >
                                        {type}
                                    </div>
                                ))}
                            </>;
                        })()}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Done</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
