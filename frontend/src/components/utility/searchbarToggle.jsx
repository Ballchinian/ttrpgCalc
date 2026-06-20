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
                /* Dark to match the app theme (every usage sits on a dark/navy surface) */
                style={{ background: "#222", color: "white", border: "1px solid #555" }}
            />

            {query && (
                <div
                    style={{
                        background: "var(--app-panel)",
                        color: "#dfe6e2",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "4px",
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
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                        <div style={{ padding: "4px 8px", color: "#8aa39a" }}>No matches</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchbarToggle;
