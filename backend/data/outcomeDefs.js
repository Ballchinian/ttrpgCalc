export const OUTCOME_KEYS = Object.freeze(["critSuccess", "success", "failure", "critFailure"]);
export const OUTCOME_KEYS_INDEXED = Object.freeze(["critFailure", "failure", "success", "critSuccess"]);
export const OUTCOME_LABELS = Object.freeze({ critSuccess: "Critical Success", success: "Success", failure: "Failure", critFailure: "Critical Failure" });
export const FLIP_OUTCOME = Object.freeze({ critSuccess: "critFailure", success: "failure", failure: "success", critFailure: "critSuccess" });
export const MULTIPLIER_TABLE = Object.freeze({ critSuccess: 2, success: 1, failure: 0, critFailure: 0 });
//PF2e saves (target's POV): critFailure = target failed badly = double, critSuccess = target resisted fully = no damage
export const BASIC_SAVE_MULTIPLIER_TABLE = Object.freeze({ critSuccess: 0, success: 0.5, failure: 1, critFailure: 2 });
