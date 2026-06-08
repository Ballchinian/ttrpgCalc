export const OUTCOME_KEYS = Object.freeze(["criticalSuccess", "success", "failure", "criticalFailure"]);
export const OUTCOME_KEYS_INDEXED = Object.freeze(["criticalFailure", "failure", "success", "criticalSuccess"]);
export const OUTCOME_LABELS = Object.freeze({ criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" });
export const FLIP_OUTCOME = Object.freeze({ criticalSuccess: "criticalFailure", success: "failure", failure: "success", criticalFailure: "criticalSuccess" });
export const MULTIPLIER_TABLE = Object.freeze({ criticalSuccess: 2, success: 1, failure: 0, criticalFailure: 0 });
//PF2e saves (target's POV): criticalFailure = target failed badly = double, criticalSuccess = target resisted fully = no damage
export const BASIC_SAVE_MULTIPLIER_TABLE = Object.freeze({ criticalSuccess: 0, success: 0.5, failure: 1, criticalFailure: 2 });
