import { Form } from "react-bootstrap";

/**
 * Renders a single form field from a descriptor:
 *   { key, type, label, options, placeholder, min, max }
 *
 * type "select": options[] required
 * type "text": placeholder optional
 * type "number": min/max optional
 *
 * value/onChange/error work the same way for all types.
 */
export default function FormField({ field, value, onChange, error }) {
    const { key, type, label, options, placeholder, min, max } = field;

    return (
        <Form.Group className="mb-2">
            <Form.Label>{label}</Form.Label>

            {type === "select" && (
                <Form.Control
                    as="select"
                    value={value ?? ""}
                    isInvalid={!!error}
                    onChange={e => onChange(e.target.value)}
                >
                    <option value="" disabled>Select...</option>
                    {(options ?? []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </Form.Control>
            )}

            {type === "text" && (
                <Form.Control
                    type="text"
                    value={value ?? ""}
                    isInvalid={!!error}
                    placeholder={placeholder ?? ""}
                    onChange={e => onChange(e.target.value)}
                />
            )}

            {type === "number" && (
                <Form.Control
                    type="number"
                    value={value ?? min ?? 0}
                    isInvalid={!!error}
                    min={min}
                    max={max}
                    onChange={e => onChange(Number(e.target.value))}
                />
            )}

            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        </Form.Group>
    );
}
