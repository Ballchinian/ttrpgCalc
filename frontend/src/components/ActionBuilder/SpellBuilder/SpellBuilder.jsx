import SpellForm from "./SpellForm";
import useActionBuilder from '../shared/useActionBuilder';
import ActionBuilderShell from '../shared/actionBuilderShell';

const initialSpellData = {
    name: "",
    category: "spell",
    tradition: [],
    traits: [],
    targetType: "single",
    actionCost: 1,
    basicSave: false,
    check: {
        targetStat: "will",
        actorStat: "dc"
    },
    outcomes: {
        critSuccess: [],
        success: [],
        failure: [],
        critFailure: []
    }
};

function SpellBuilder() {
    const {
        actionData: spellData, setActionData: setSpellData,
        choices: spellChoices,
        errors, setErrors,
        saveError,
        selectedID, setSelectedID,
        divVisibility,
        handleSwapUI,
        handleDelete,
        handleSave
    } = useActionBuilder({ initialData: initialSpellData, category: "spell" });

    //Action cost toggle: each click moves the boundary up or down by one
    function handleActionClick(index) {
        setSpellData(prev => {
            const cost = prev.actionCost;
            let newCost = cost;
            if (index < cost && cost > 0) newCost -= 1;
            else if (index >= cost && cost < 3) newCost += 1;
            return { ...prev, actionCost: newCost };
        });
    }

    function handleTraditionToggle(t) {
        setSpellData(prev => ({
            ...prev,
            tradition: prev.tradition.includes(t)
                ? prev.tradition.filter(x => x !== t)
                : [...prev.tradition, t]
        }));
    }

    //For all changes to spell data minus save type
    function handleSpellChange(e) {
        const { name, value, type, checked } = e.target;
        //When basicSave is toggled off, reset outcomes so stale 0.5x/2x multipliers don't persist
        if (name === "basicSave" && !checked) {
            setSpellData(prev => ({ ...prev, basicSave: false, outcomes: { critSuccess: [], success: [], failure: [], critFailure: [] } }));
            return;
        }
        setSpellData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    //For changes to save type, derives actorStat immediately so backend needs no special casing
    function handleSaveTypeChange(e) {
        const { value } = e.target;
        setSpellData(prev => {
            const traits = value === "ac" && !prev.traits.some(t => t.name === "attack")
                ? [...prev.traits, { name: "attack", label: "Attack", data: undefined }]
                : value !== "ac"
                    ? prev.traits.filter(t => t.name !== "attack")
                    : prev.traits;
            const actorStat = ["will", "reflex", "fortitude"].includes(value) ? "dc" : value === "ac" ? "toHit" : "none";
            return { ...prev, traits, check: { targetStat: value, actorStat } };
        });
    }

    //For changing outcomes, needs function check to handle onRemoveEffect from SpellActionTypeController
    function setEffectsByTier(update) {
        setSpellData(prev => ({
            ...prev,
            outcomes: typeof update === "function" ? update(prev.outcomes) : update
        }));
    }

    async function handleSaveSpell() {
        const newErrors = {};
        const isAutomatic = spellData.check.targetStat === "none";
        const hasAnyEffects = Object.values(spellData.outcomes).some(arr => arr.length > 0);

        if (!spellData.name.trim()) newErrors.name = "Name is required";
        else if (spellChoices.some(s =>
            s.name.toLowerCase() === spellData.name.trim().toLowerCase() &&
            s._id !== selectedID
        )) newErrors.duplicate = "A Spell With This Name Already Exists.";
        if (isAutomatic && spellData.outcomes.success.length === 0) newErrors.effects = "Automatic spells need at least one effect in the Effects (Success) tier.";
        else if (!hasAnyEffects) newErrors.effects = "At least one effect is required.";
        if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
        setErrors({});
        await handleSave({
            name: spellData.name,
            type: isAutomatic ? "automatic" : "roll",
            category: "spell",
            tradition: spellData.tradition,
            traits: spellData.traits,
            basicSave: spellData.basicSave,
            ...(isAutomatic ? {} : { check: spellData.check }),
            targetType: spellData.targetType,
            actionCost: spellData.actionCost,
            outcomes: {
                critSuccess: { effects: spellData.outcomes.critSuccess },
                success: { effects: spellData.outcomes.success },
                failure: { effects: spellData.outcomes.failure },
                critFailure: { effects: spellData.outcomes.critFailure }
            }
        });
    }

    return (
        <ActionBuilderShell
            title="Spell"
            choices={spellChoices}
            nameValue={spellData.name}
            onNameChange={handleSpellChange}
            saveError={saveError}
            onSelect={spell => {
                setSelectedID(spell._id);
                setErrors({});
                //Automatic spells have no check stored, force "none" so the UI shows correctly
                const check = spell.type === "automatic"
                    ? { targetStat: "none", actorStat: "none" }
                    : spell.check ?? initialSpellData.check;
                setSpellData({
                    ...initialSpellData,
                    name: spell.name,
                    tradition: spell.tradition ?? [],
                    traits: spell.traits ?? [],
                    basicSave: spell.basicSave ?? false,
                    check,
                    targetType: spell.targetType ?? "single",
                    actionCost: spell.actionCost ?? 1,
                    outcomes: {
                        critSuccess: spell.outcomes?.critSuccess?.effects ?? [],
                        success: spell.outcomes?.success?.effects ?? [],
                        failure: spell.outcomes?.failure?.effects ?? [],
                        critFailure: spell.outcomes?.critFailure?.effects ?? []
                    }
                });
            }}
            onSave={handleSaveSpell}
            onDelete={handleDelete}
            selectedID={selectedID}
            divVisibility={divVisibility}
            onSwap={handleSwapUI}
            errors={errors}
        >
            <SpellForm
                spellData={spellData}
                handleSpellChange={handleSpellChange}
                handleTraditionToggle={handleTraditionToggle}
                handleSaveTypeChange={handleSaveTypeChange}
                handleActionClick={handleActionClick}
                setEffectsByTier={setEffectsByTier}
                errors={errors}
            />
        </ActionBuilderShell>
    );
}

export default SpellBuilder;
