import { Button, Modal, Carousel } from "react-bootstrap";
import { useState } from "react";
import AddDamage from "./AddDamage";
import AddOrRemoveCondition from "./AddOrRemoveCondition";
import AddHealing from "./AddHealing";
import PopoutOverlay from "../utill/popoutOverlay";
import EffectLine from "./EffectLine";

const EFFECT_SLIDES = [
    { key: "damage", label: "Damage" },
    { key: "healing", label: "Healing" },
    { key: "addCondition", label: "+Condition" },
    { key: "removeCondition", label: "-Condition" }
];

const VARIANT_MAP = {
    healing: "success",
    damage: "danger",
    addCondition: "primary",
    removeCondition: "warning"
};

function SpellActionTypeController({ identity, label, setEffectsByTier, effectsByTier}) {
    const closeModal = () => setOpen(false);
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(false);

    function onRemoveEffect(idx) {
        setEffectsByTier(prev => ({
            ...prev,
            [identity]: prev[identity].filter((_, i) => i !== idx)
        }));
    }

    const current = EFFECT_SLIDES[index];

    function onConfirm(data) {
        setEffectsByTier(prev => ({
            ...prev,
            [identity]: [...prev[identity], data]
        }))
        closeModal();
    }

    return (
        <li style={{ display: "flex", alignItems: "center" }}>
            <PopoutOverlay
                label={label}
                list={effectsByTier[identity]}
                onRemove={onRemoveEffect}
                effectOrTrait="effect"
                EffectLine={EffectLine}
            />

            {/* Compact carousel selector */}
            <Carousel
                activeIndex={index}
                onSelect={setIndex}
                style={{ marginLeft: "20px" }}
                indicators={false}
                prevLabel=""
                nextLabel=""
                slide={false}
                interval={null}
            >
                {EFFECT_SLIDES.map((slide) => (
                    <Carousel.Item style={{ width: "140px" }} key={slide.key}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <Button
                                style={{ width: "120px", fontSize: "0.8rem" }}
                                variant={VARIANT_MAP[slide.key]}
                                onClick={() => setOpen(true)}>{slide.label}</Button>
                        </div>
                    </Carousel.Item>
                ))}
            </Carousel>

            <Modal show={open} onHide={() => setOpen(false)}>
                <Modal.Body>
                    {current.key === "damage" && (
                        <AddDamage
                            onConfirm={onConfirm}
                            onCancel={closeModal}
                        />
                    )}

                    {current.key === "healing" && (
                        <AddHealing
                            onConfirm={onConfirm}
                            onCancel={closeModal}
                        />
                    )}

                    {(current.key === "addCondition" ||
                        current.key === "removeCondition") && (
                        <AddOrRemoveCondition
                            isAdding={current.key === "addCondition"}
                            onConfirm={onConfirm}
                            onCancel={closeModal}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </li>
    );
}

export default SpellActionTypeController;