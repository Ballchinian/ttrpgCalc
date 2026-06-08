//Keep in sync with backend/data/outcomeDefs.js, cannot share directly since frontend can't import backend files
export const OUTCOME_LABELS = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
export const FLIP_OUTCOME = { criticalSuccess: "criticalFailure", success: "failure", failure: "success", criticalFailure: "criticalSuccess" };
