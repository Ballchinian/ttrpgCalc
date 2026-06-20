import { useState, useMemo } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import TraitFieldRenderer from "./WeaponTraitComponents";
import parseDmgDie from "../utill/parseDmgDie";
import { TRAIT_CATALOG, WEAPON_TRAITS } from "../../../data/traitCatalog";

//Generic, searchable trait picker shared by the weapon and spell editors. It merges the config-bearing
//traitModules (versatile/keen/deadly/...) with the broader inert TRAIT_CATALOG into one searchable list,
//plus a free-form custom trait. Weapon-specific traits sort to the top in the weapon editor and to the
//bottom in the spell editor (the `context` prop) so the relevant traits are always easiest to reach.
const CUSTOM = "__custom__";
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function AddWeaponTrait({ traitDefs, existingTraits, onConfirm, onCancel, context = "weapon" }) {
    const [selectedTrait, setSelectedTrait] = useState("");
    const [configValue, setConfigValue] = useState({});
    const [custom, setCustom] = useState("");
    const [search, setSearch] = useState("");
    const [errors, setErrors] = useState({});

    const has = (name) => existingTraits.some((t) => t.name === name);

    //One unified, ordered option list: every config-bearing trait (from traitDefs) plus every catalog-only
    //marker. Weapon traits are pulled to one end depending on context, then sorted alphabetically by label.
    const options = useMemo(() => {
        const knownKeys = Object.keys(traitDefs ?? {});
        const known = knownKeys.map((name) => ({
            name,
            label: traitDefs[name].label ?? cap(name),
            fields: traitDefs[name].render?.fields ?? [],
        }));
        const catalogOnly = TRAIT_CATALOG
            .filter((n) => !knownKeys.includes(n))
            .map((name) => ({ name, label: cap(name), fields: [] }));
        const weaponFirst = context === "weapon";
        return [...known, ...catalogOnly].sort((a, b) => {
            const aw = WEAPON_TRAITS.has(a.name);
            const bw = WEAPON_TRAITS.has(b.name);
            if (aw !== bw) return weaponFirst ? (aw ? -1 : 1) : (aw ? 1 : -1);
            return a.label.localeCompare(b.label);
        });
    }, [traitDefs, context]);

    const term = search.trim().toLowerCase();
    const visible = term
        ? options.filter((o) => o.label.toLowerCase().includes(term) || o.name.toLowerCase().includes(term))
        : options;

    const isCustom = selectedTrait === CUSTOM;
    const selectedOption = options.find((o) => o.name === selectedTrait) ?? null;
    const fields = selectedOption?.fields ?? [];

    function selectTrait(name) {
        setSelectedTrait(name);
        setConfigValue({});
        setCustom("");
        setErrors({});
    }

    function handleConfirm() {
        if (isCustom) {
            const name = custom.trim().toLowerCase();
            if (!name) return setErrors({ custom: "Enter a trait name" });
            if (has(name)) return setErrors({ custom: "That trait is already added" });
            return onConfirm({ name, label: custom.trim() });
        }
        if (!selectedOption) return;
        if (fields.length > 0) {
            const newErrors = {};
            fields.forEach((field) => {
                const val = configValue[field.key];
                if (val == null || val === "") newErrors[field.key] = "Required";
                if (field.validateAs === "dmgDie" && val) {
                    const parsed = parseDmgDie(val);
                    if (parsed.errors) newErrors[field.key] = parsed.errors.dmgDieNumbers;
                }
            });
            if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
            return onConfirm({ name: selectedOption.name, label: selectedOption.label, data: configValue });
        }
        //Inert marker - no config to collect
        onConfirm({ name: selectedOption.name, label: selectedOption.label });
    }

    return (
        <div style={{ border: "1px solid #ccc", padding: "8px", marginTop: "4px" }}>
            <Form.Group className="mb-2">
                <Form.Label>Trait</Form.Label>
                <Form.Control
                    type="search"
                    autoFocus
                    placeholder="Search traits..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </Form.Group>

            {/* Scrollable list - clicking a row selects it; traits already on the action are disabled */}
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #444", borderRadius: "4px", marginBottom: "8px" }}>
                {visible.length === 0 && (
                    <div className="text-body-secondary small p-2">No traits match that search.</div>
                )}
                {visible.map((o) => {
                    const added = has(o.name);
                    const active = o.name === selectedTrait;
                    return (
                        <div
                            key={o.name}
                            role="button"
                            aria-disabled={added}
                            onClick={() => { if (!added) selectTrait(o.name); }}
                            className={`px-2 py-1${active ? " bg-primary text-white" : ""}`}
                            style={{ cursor: added ? "not-allowed" : "pointer", opacity: added ? 0.45 : 1 }}
                        >
                            {o.label}
                        </div>
                    );
                })}
            </div>

            <Button
                variant={isCustom ? "primary" : "outline-secondary"}
                size="sm"
                className="mb-2"
                onClick={() => selectTrait(CUSTOM)}
            >
                Custom trait...
            </Button>

            {isCustom && (
                <Form.Group className="mb-2">
                    <Form.Label>Custom trait name</Form.Label>
                    <Form.Control
                        type="text"
                        value={custom}
                        placeholder="e.g. tengu"
                        onChange={(e) => { setCustom(e.target.value); setErrors({}); }}
                        isInvalid={!!errors.custom}
                    />
                    <Form.Control.Feedback type="invalid">{errors.custom}</Form.Control.Feedback>
                </Form.Group>
            )}

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
                    <Button variant="success" onClick={handleConfirm} disabled={!isCustom && !selectedOption}>Confirm</Button>
                </Col>
                <Col xs="3">
                    <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
                </Col>
            </Row>
        </div>
    );
}
