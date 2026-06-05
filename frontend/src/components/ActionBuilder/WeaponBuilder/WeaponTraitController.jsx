import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import PopoutOverlay from '../utill/popoutOverlay';
import AddWeaponTrait from './AddWeaponTrait';


export default function WeaponTraitDetails({ weaponData, setWeaponData, traitDefs }) {
    const { traits } = weaponData;
    const [open, setOpen] = useState(false);

    function addTrait(traitToAdd) {
        if (traits.some(t => t.name === traitToAdd.name)) return;
        setWeaponData(prev => ({
            ...prev,
            traits: [...prev.traits, traitToAdd]
        }));
        setOpen(false);
    }

    function removeTrait(traitToRemove) {
        if (traitToRemove.name === "attack") {
            alert("The Attack trait is inherent to all weapons and cannot be removed.");
            return;
        }
        setWeaponData(prev => ({
            ...prev,
            traits: prev.traits.filter(t => t.name !== traitToRemove.name)
        }));
    }

    function stringifyTraits(traits=[]) {
        return traits.map(trait => {
            if (trait.data == null) return trait.label;
            //New format: keyed object { damageType: "Fire" } or { element: "Fire", diceRolled: "1d6" }
            if (typeof trait.data === "object" && !Array.isArray(trait.data))
                return `${trait.label} (${Object.values(trait.data).join(" ")})`;
            //Legacy scalar/array formats
            if (Array.isArray(trait.data)) return `${trait.label} (${trait.data.join(" ")})`;
            return `${trait.label} (${trait.data})`;
        });
    }

    return (
        <li style={{ display: "flex", gap: "6px" }}>
            <PopoutOverlay
                label="Traits"
                list={stringifyTraits(traits)}
                onRemove={idx => removeTrait(traits[idx])}
                effectOrTrait="trait"
            />

            <Button variant="outline-light " size="sm" onClick={() => setOpen(true)}>
                Add
            </Button>

            <Modal show={open} onHide={() => setOpen(false)}>
                <Modal.Body>
                <AddWeaponTrait
                    traitDefs={traitDefs}
                    existingTraits={traits}
                    onConfirm={addTrait}
                    onCancel={() => setOpen(false)}
                />
                </Modal.Body>
            </Modal>
        </li>
    );
}