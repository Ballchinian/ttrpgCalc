 
function EffectLine({ effect }) {
    switch (effect.type) {
        case "damage":
            if (!effect.number) return <span>Damage: (invalid)</span>;
            return (
                <span>
                    Damage: {effect.number.numRolled}d
                    {effect.number.diceRolled}
                    {effect.number.modifier > 0 && `+${effect.number.modifier}`}
                    {effect.number.modifier < 0 && `${effect.number.modifier}`}{" "}
                    ({effect.damageType ?? "unknown"})
                    {effect.category === "persistent" && " (Persistent)"}
                    {effect.multiplier != null && effect.multiplier !== 1 && ` *${effect.multiplier}`}
                </span>
            );
        case "healing":
            if (!effect.number) return <span>Healing: (invalid)</span>;
            return (
                <span>
                    Healing: {effect.number.numRolled}d
                    {effect.number.diceRolled}
                    {effect.number.modifier > 0 && `+${effect.number.modifier}`}
                    {effect.number.modifier < 0 && `${effect.number.modifier}`}
                </span>
            );
        case "addCondition":
            return <span>Apply Condition: {effect.condition} {effect.adjustBy !==1 && `(${effect.adjustBy})`}</span>;
        case "removeCondition":
            return <span>Remove Condition: {effect.condition} {effect.adjustBy !==1 && `(${effect.adjustBy})`}</span>;
        default:
            return <span>Unknown Effect</span>;
    }
}

export default EffectLine;

