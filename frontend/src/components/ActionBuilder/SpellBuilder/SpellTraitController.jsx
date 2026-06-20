import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import PopoutOverlay from '../utill/popoutOverlay';
import AddWeaponTrait from '../WeaponBuilder/AddWeaponTrait';

//Spell trait editor - mirrors the weapon one but writes to spellData.traits. Lets a spell carry any
//trait that could affect it in PF2e (manipulate/concentrate/emotion/mental/element/...), so condition
//gates and future interactions fire on spells too.
export default function SpellTraitController({ spellData, setSpellData, traitDefs }) {
    const traits = spellData.traits ?? [];
    const [open, setOpen] = useState(false);

    function addTrait(traitToAdd) {
        if (traits.some(t => t.name === traitToAdd.name)) return;
        setSpellData(prev => ({ ...prev, traits: [...(prev.traits ?? []), traitToAdd] }));
        setOpen(false);
    }

    function removeTrait(traitToRemove) {
        //The Attack trait is auto-managed by the save type (vs AC); block manual removal while it applies
        if (traitToRemove.name === "attack" && spellData.check?.targetStat === "ac") {
            alert("The Attack trait comes from the spell-attack save type and can't be removed here.");
            return;
        }
        setSpellData(prev => ({ ...prev, traits: (prev.traits ?? []).filter(t => t.name !== traitToRemove.name) }));
    }

    function stringifyTraits(list = []) {
        return list.map(trait => {
            if (trait.data == null) return trait.label;
            if (typeof trait.data === "object" && !Array.isArray(trait.data))
                return `${trait.label} (${Object.values(trait.data).join(" ")})`;
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

            <Button variant="outline-primary" size="sm" onClick={() => setOpen(true)}>
                Add
            </Button>

            <Modal show={open} onHide={() => setOpen(false)}>
                <Modal.Body>
                    <AddWeaponTrait
                        traitDefs={traitDefs}
                        existingTraits={traits}
                        onConfirm={addTrait}
                        onCancel={() => setOpen(false)}
                        context="spell"
                    />
                </Modal.Body>
            </Modal>
        </li>
    );
}
