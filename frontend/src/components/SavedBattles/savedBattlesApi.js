import { apiFetch } from "../../auth";
import { BACKEND_BASE_URL } from "../../config";

const BASE = `${BACKEND_BASE_URL}/saved-battles`;

async function parseError(res, fallback) {
    const body = await res.json().catch(() => ({}));
    return new Error(body.message || fallback);
}

export async function listSavedBattles() {
    const res = await apiFetch(BASE);
    if (!res) throw new Error("Session expired - please refresh the page.");
    if (!res.ok) throw await parseError(res, "Failed to load saved battles.");
    return res.json();
}

export async function getSavedBattle(id) {
    const res = await apiFetch(`${BASE}/${id}`);
    if (!res) throw new Error("Session expired - please refresh the page.");
    if (!res.ok) throw await parseError(res, "Failed to load that battle.");
    return res.json();
}

export async function createSavedBattle(name, data) {
    const res = await apiFetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data }),
    });
    if (!res) throw new Error("Session expired - please refresh the page.");
    if (!res.ok) throw await parseError(res, "Failed to save the battle.");
    return res.json();
}

export async function updateSavedBattle(id, { name, data }) {
    const res = await apiFetch(`${BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data }),
    });
    if (!res) throw new Error("Session expired - please refresh the page.");
    if (!res.ok) throw await parseError(res, "Failed to update the battle.");
    return res.json();
}

export async function deleteSavedBattle(id) {
    const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
    if (!res) throw new Error("Session expired - please refresh the page.");
    if (!res.ok) throw await parseError(res, "Failed to delete the battle.");
    return res.json();
}
