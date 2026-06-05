export function resolveItemBonus(bonusGroup = {}) {
    //Number(value || 0): coerces string form values (e.g. "3") to numbers; null/undefined/NaN/0 all safely produce 0
    return Object.values(bonusGroup).reduce(
        (sum, value) => sum + Number(value || 0),
        0
    );
}
