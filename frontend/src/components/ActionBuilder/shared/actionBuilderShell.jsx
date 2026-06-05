import { Button, Card, Form, Row, Col, ButtonGroup, Dropdown } from 'react-bootstrap';
import { FaTrashAlt } from "react-icons/fa";

function ActionBuilderShell({ title, choices, nameValue, onNameChange, onSelect, onSave, onDelete, selectedID, divVisibility, onSwap, errors, saveError, children }) {
    const nameError = errors.name || errors.duplicate;

    return (
        <div className="mt-5" style={{ display: "flex", justifyContent: "center", maxWidth: "600px", margin: "0 auto" }}>
            {/* Add */}
            <Card className="flex-column" style={{ display: divVisibility ? "none" : "flex" }}>
                <h2 className="text-center">Add {title}</h2>
                <Form>
                    <Form.Group as={Row} className="mb-4">
                        <Col>
                            <Form.Label column>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={nameValue}
                                onChange={onNameChange}
                                isInvalid={!!nameError}
                            />
                            <Form.Control.Feedback type="invalid">{nameError}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    {children}
                    {saveError && <div className="text-danger mb-2" style={{ fontSize: "13px" }}>{saveError}</div>}
                    <Button as={Col} className="mb-3" onClick={onSave}>Add {title}</Button>
                    <Button as={Col} onClick={onSwap}>Edit Previous {title}s</Button>
                </Form>
            </Card>

            {/* Edit */}
            <Card className="flex-column" style={{ display: divVisibility ? "flex" : "none" }}>
                <h2 className="text-center">Change {title}</h2>
                <Form>
                    <ButtonGroup className="d-flex align-items-end mb-3">
                        <Form.Control
                            placeholder={`Select ${title.toLowerCase()} to change`}
                            name="name"
                            type="text"
                            value={nameValue}
                            onChange={onNameChange}
                            disabled={!selectedID}
                        />
                        <Dropdown as={ButtonGroup} onSelect={idx => onSelect(choices[Number(idx)])}>
                            <Dropdown.Toggle split />
                            <Dropdown.Menu>
                                {choices.map((action, i) => (
                                    <Dropdown.Item key={i} eventKey={i}>{action.name}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </ButtonGroup>
                    {children}
                    {saveError && <div className="text-danger mb-2" style={{ fontSize: "13px" }}>{saveError}</div>}
                    <div className="d-flex gap-2">
                        <Button as={Col} className="flex-grow-1" onClick={onSave}>Change {title}</Button>
                        {selectedID && (
                            <Button variant="danger" onClick={() => onDelete(selectedID)}>
                                <FaTrashAlt /> Delete
                            </Button>
                        )}
                    </div>
                    <Button as={Col} className="mt-3" onClick={onSwap}>Add New {title}s</Button>
                </Form>
            </Card>
        </div>
    );
}

export default ActionBuilderShell;
