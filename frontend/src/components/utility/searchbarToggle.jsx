import { useState } from "react";
import { Form } from "react-bootstrap";

function SearchbarToggle({
    placeholder = "Search...",
    list = [],
    onSelect = () => {},
    onBlur = () => {},
    getLabel = (item) => item, //custom accessor to extract display label from item
    getImage = () => null, //custom accessor to extract image src from item (null = no image)
}) {
    const [query, setQuery] = useState("");

    const filtered = list.filter((item) => {
        const label = getLabel(item);
        return label?.toLowerCase().includes(query.toLowerCase());
    });

    return (
        <div className="mb-3">
            <Form.Control
                type="text"
                placeholder={placeholder}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => {
                    setQuery("");
                    onBlur();
                }}
            />

            {query && (
                <div
                    style={{
                        background: "white",
                        color: "black",
                        marginTop: "2px",
                        maxHeight: "120px",
                        overflowY: "auto",
                    }}
                >
                    {filtered.length > 0 ? (
                        filtered.map((item) => {
                            const label = getLabel(item);
                            const img = getImage(item);
                            return (
                                <div
                                    key={label}
                                    style={{
                                        padding: "4px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); //prevent onBlur from firing before click registers
                                        onSelect(item);
                                        setQuery("");
                                    }}
                                >
                                    {img && (
                                        <img
                                            alt={label}
                                            src={img}
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                                    <span>{label}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: "4px 8px" }}>No matches</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchbarToggle;
