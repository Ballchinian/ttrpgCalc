import { useState } from "react";
import { useGameDataStore } from "../../../store/gameDataStore";
import parseDmgDie from "../utill/parseDmgDie";
import WeaponForm from './WeaponForm';
import useActionBuilder from '../shared/useActionBuilder';
import ActionBuilderShell from '../shared/actionBuilderShell';
import { RANGED_GROUPS } from "../../../data/weaponGroups";

const initialWeaponData = {
    name: "",
    group: "",
    damage: { damageType: "", dmgDieNumbers: "" },
    traits: [{ name: "attack", label: "Attack", data: undefined }],
    targetType: "single",
    actionCost: 1
};

function WeaponBuilder() {
    //gameDataStore already fetches these on app mount, no redundant network requests needed
    const traitDefs = useGameDataStore(state => state.traitDefs);
    const damageTypes = useGameDataStore(state => state.damageTypes ?? []);

    const {
        actionData: weaponData, setActionData: setWeaponData,
        choices: weaponChoices,
        errors, setErrors,
        saveError,
        selectedID, setSelectedID,
        divVisibility,
        handleSwapUI,
        handleDelete,
        handleSave
    } = useActionBuilder({ initialData: initialWeaponData, category: "weapon" });

    function convertDmgDieToString(dmgDie) {
        if (!dmgDie) return "";
        const { numRolled, diceRolled, modifier, bonusDice } = dmgDie;
        const bonusStr = bonusDice ? `+${bonusDice.numRolled}d${bonusDice.diceRolled}` : "";
        const mod = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : "";
        return `${numRolled}d${diceRolled}${bonusStr}${mod}`;
    }

    //Handles changes to damage inputs, updates weaponData.damage
    function handleDamageChange(e) {
        const { name, value } = e.target;
        setWeaponData(prev => ({ ...prev, damage: { ...prev.damage, [name]: value } }));
    }

    //Handles changes to all non-damage inputs, updates weaponData
    function handleWeaponChange(e) {
        const { name, value } = e.target;
        setWeaponData(prev => ({ ...prev, [name]: value }));
    }

    async function handleSaveWeapon() {
        const newErrors = {};
        const result = parseDmgDie(weaponData.damage.dmgDieNumbers);

        if (!weaponData.name.trim()) newErrors.name = "Name is required";
        else if (weaponChoices.some(w =>
            w.name.toLowerCase() === weaponData.name.trim().toLowerCase() &&
            w._id !== selectedID
        )) newErrors.duplicate = "A Weapon With This Name Already Exists.";
        if (!weaponData.damage.damageType) newErrors.damageType = "Damage type is required";
        if (result.errors) Object.assign(newErrors, result.errors);
        if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
        setErrors({});

        const { numRolled, diceRolled, modifier, bonusDice } = result;
        const numberObj = bonusDice ? { numRolled, diceRolled, modifier, bonusDice } : { numRolled, diceRolled, modifier };
        //Ranged groups use dexterity-based dexHit; everything else uses strHit
        const actorStat = RANGED_GROUPS.has(weaponData.group) ? "dexHit" : "strHit";
        await handleSave({
            name: weaponData.name,
            type: "roll",
            category: "weapon",
            group: weaponData.group || undefined,
            traits: weaponData.traits,
            targetType: weaponData.targetType,
            actionCost: weaponData.actionCost,
            check: { targetStat: "ac", actorStat },
            outcomes: {
                critSuccess: { effects: [{ type: "damage", damageType: weaponData.damage.damageType, number: numberObj, multiplier: 2 }] },
                success: { effects: [{ type: "damage", damageType: weaponData.damage.damageType, number: numberObj }] },
                failure: { effects: [] },
                critFailure: { effects: [] }
            }
        });
    }

    return (
        <ActionBuilderShell
            title="Weapon"
            choices={weaponChoices}
            nameValue={weaponData.name}
            onNameChange={handleWeaponChange}
            onSelect={weapon => {
                setSelectedID(weapon._id);
                setErrors({});
                setWeaponData({
                    name: weapon.name,
                    group: weapon.group ?? "",
                    traits: weapon.traits ?? [],
                    targetType: weapon.targetType ?? "single",
                    actionCost: weapon.actionCost ?? 1,
                    damage: {
                        damageType: weapon.outcomes?.success?.effects?.[0]?.damageType ?? "",
                        dmgDieNumbers: convertDmgDieToString(weapon.outcomes?.success?.effects?.[0]?.number)
                    }
                });
            }}
            onSave={handleSaveWeapon}
            onDelete={handleDelete}
            selectedID={selectedID}
            divVisibility={divVisibility}
            onSwap={handleSwapUI}
            errors={errors}
            saveError={saveError}
        >
            <WeaponForm
                handleWeaponChange={handleWeaponChange}
                handleDamageChange={handleDamageChange}
                setWeaponData={setWeaponData}
                weaponData={weaponData}
                errors={errors}
                damageTypes={damageTypes}
                traitDefs={traitDefs}
            />
        </ActionBuilderShell>
    );
}

export default WeaponBuilder;
