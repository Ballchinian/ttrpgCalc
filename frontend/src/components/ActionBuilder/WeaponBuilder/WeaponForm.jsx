import { Form, Row, Col } from "react-bootstrap";
import WeaponTraitController from './WeaponTraitController';
import { WEAPON_GROUPS } from "../../../data/weaponGroups";

function WeaponForm({ handleDamageChange, handleWeaponChange, weaponData, setWeaponData, errors, damageTypes, traitDefs }) {
    const { damage, group, potency = 0, striking = 0 } = weaponData;
    const { dmgDieNumbers, damageType } = damage;
    return (
        <div>
            <Form.Group as={Row} className="mb-4">
                <Col>
                    <Form.Label column>Damage Die (XdY + c)</Form.Label>
                    <Form.Control
                        type="text"
                        name="dmgDieNumbers"
                        value={dmgDieNumbers}
                        onChange={handleDamageChange}
                        placeholder="e.g. 2d6"
                        isInvalid={!!errors.dmgDieNumbers}
                    />
                    <Form.Control.Feedback type="invalid">{errors.dmgDieNumbers}</Form.Control.Feedback>
                </Col>
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label>Damage Type</Form.Label>
                <Form.Control
                    as="select"
                    name="damageType"
                    value={damageType}
                    onChange={handleDamageChange}
                    isInvalid={!!errors.damageType}
                >
                    <option value="" disabled>Select damage type...</option>
                    {damageTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </Form.Control>
                <Form.Control.Feedback type="invalid">{errors.damageType}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label>Weapon Group</Form.Label>
                <Form.Control
                    as="select"
                    name="group"
                    value={group}
                    onChange={handleWeaponChange}
                >
                    <option value="">-- None --</option>
                    {WEAPON_GROUPS.map(g => (
                        <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                </Form.Control>
            </Form.Group>

            <Form.Group as={Row} className="mb-4">
                <Col>
                    <Form.Label>Potency Rune</Form.Label>
                    <Form.Control as="select" name="potency" value={potency} onChange={handleWeaponChange}>
                        <option value={0}>None</option>
                        <option value={1}>+1 to hit</option>
                        <option value={2}>+2 to hit</option>
                        <option value={3}>+3 to hit</option>
                    </Form.Control>
                </Col>
                <Col>
                    <Form.Label>Striking Rune</Form.Label>
                    <Form.Control as="select" name="striking" value={striking} onChange={handleWeaponChange}>
                        <option value={0}>None</option>
                        <option value={1}>Striking (+1 die)</option>
                        <option value={2}>Greater (+2 dice)</option>
                        <option value={3}>Major (+3 dice)</option>
                    </Form.Control>
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-4">
                <Col>
                    <WeaponTraitController weaponData={weaponData} setWeaponData={setWeaponData} traitDefs={traitDefs} />
                </Col>
            </Form.Group>
        </div>
    );
}

export default WeaponForm;