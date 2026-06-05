import { Modal, Button, Form } from "react-bootstrap";
import { useState, useMemo } from "react";

//Generic picker modal used for both weapons (tag=group) and spells (tag=tradition)
function ItemPickerModal({ show, onHide, title, items, selectedItems, onToggle }) {
    const [activeTag, setActiveTag] = useState(null);
    const [searchText, setSearchText] = useState("");

    //Derive unique tags across all items (each item has a tags array)
    const tags = useMemo(() => {
        const seen = new Set();
        items.forEach(item => item.tags?.forEach(t => seen.add(t)));
        return [...seen].sort();
    }, [items]);

    const filtered = useMemo(() => items.filter(item => {
        const tagMatch = !activeTag || item.tags?.includes(activeTag);
        const searchMatch = !searchText || item.name.toLowerCase().includes(searchText.toLowerCase());
        return tagMatch && searchMatch;
    }), [items, activeTag, searchText]);

    return (
        <Modal show={show} onHide={() => { setActiveTag(null); setSearchText(""); onHide(); }} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-wrap gap-2 mb-3">
                    <Button
                        size="sm"
                        variant={activeTag === null ? "success" : "outline-secondary"}
                        onClick={() => setActiveTag(null)}
                    >
                        All
                    </Button>
                    {tags.map(t => (
                        <Button
                            key={t}
                            size="sm"
                            variant={activeTag === t ? "success" : "outline-secondary"}
                            onClick={() => setActiveTag(prev => prev === t ? null : t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Button>
                    ))}
                </div>
                <Form.Control
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}s...`}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="mb-3"
                />
                <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {filtered.length === 0 && <p className="text-muted">No items found.</p>}
                    {filtered.map(item => {
                        const isSelected = selectedItems.includes(item.name);
                        return (
                            <div
                                key={item.name}
                                onClick={() => onToggle(item.name)}
                                style={{
                                    cursor: "pointer",
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    marginBottom: "4px",
                                    backgroundColor: isSelected ? "#1a3a2a" : "transparent",
                                    color: isSelected ? "#28a745" : "#a6c0b7",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "#1a2a1a"; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                                <span>{item.name}</span>
                                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                                    {item.tags?.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" / ")}
                                    {isSelected ? " ✓" : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setActiveTag(null); setSearchText(""); onHide(); }}>Done</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ItemPickerModal;
