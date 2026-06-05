//Keep in sync with backend/data/outcomeDefs.js, cannot share directly since frontend can't import backend files
export const OUTCOME_LABELS = { critSuccess: "Critical Success", success: "Success", failure: "Failure", critFailure: "Critical Failure" };
export const FLIP_OUTCOME = { critSuccess: "critFailure", success: "failure", failure: "success", critFailure: "critSuccess" };
