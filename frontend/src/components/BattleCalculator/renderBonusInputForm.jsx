import Form from "react-bootstrap/Form";
//Shared bonus input renderer
//type: weapon|dc
//category: attack|damage (offensive only)
//bonusType: circumstance|item|status
//mode: offensive|defensive

function handleOffensiveChange(type, category, bonusType, value, setOffensiveBonuses) {
    setOffensiveBonuses(prev => ({
        ...prev,
        [type]: {
            ...prev[type],
            [category]: {
                ...prev[type][category],
                [bonusType]: Number(value)
            }
        }
    }));
}

function handleDefensiveChange(type, bonusType, value, setDefensiveBonuses) {
    setDefensiveBonuses(prev => ({
        ...prev,
        [type]: {
            ...prev[type],
            [bonusType]: Number(value)
        }
    }));
}

const renderBonusInput = (type, category, bonusType, mode, bonusController) => {
    const { offensiveBonuses, setOffensiveBonuses, defensiveBonuses, setDefensiveBonuses } = bonusController;
    //Resolve the current bonus value based on the actual state shape
    const value =
        mode === "offensive"
            //Offensive shape: type -> category -> bonusType
            ? offensiveBonuses?.[type]?.[category]?.[bonusType] ?? 0
            //Defensive shape: type -> bonusType
            : defensiveBonuses?.[type]?.[bonusType] ?? 0;

    return (
        <li key={bonusType}>
            {`${bonusType} Bonuses:`}
            <Form.Control
                type="number"
                value={value}
                onChange={(e) => {
                    const newValue = e.target.value;
                    //Delegate updates to the appropriate handler
                    if (mode === "offensive") {
                        handleOffensiveChange(type, category, bonusType, newValue, setOffensiveBonuses);
                    } else {
                        handleDefensiveChange(type, bonusType, newValue, setDefensiveBonuses);
                    }
                }}
            />
        </li>
    );
};

export const OffensiveInputForm = ({ selectedCondition, bonusController }) => {
    if (selectedCondition === "Select attack type") return null;

    return (
        <>
            {["attack", "damage"].map(category => (
                <div key={category}>
                    <h3>{category === "attack" ? "Attack" : "Damage"}</h3>
                    {category === "attack" && selectedCondition === "weapon" && (
                        <small className="text-muted d-block mb-1">Applies to both STR and DEX attack rolls.</small>
                    )}
                    <ol>
                        {["circumstance", "item", "status"].map(bonusType =>
                            renderBonusInput(
                                selectedCondition,
                                category,
                                bonusType,
                                "offensive",
                                bonusController
                            )
                        )}
                    </ol>
                </div>
            ))}
        </>
    );
};

export const DefensiveInputForm = ({ selectedCondition, bonusController }) => {
    if (selectedCondition === "Select defence type") return null;

    return (
        <ol>
            {["circumstance", "item", "status"].map(bonusType =>
                renderBonusInput(
                    selectedCondition,
                    null,
                    bonusType,
                    "defensive",
                    bonusController
                )
            )}
        </ol>
    );
};