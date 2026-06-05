import { useState, useEffect } from "react";
import { apiFetch } from '../../../auth';
import { BACKEND_BASE_URL } from "../../../config";
import { useBattleStore } from '../../../store/battleStore';
import { useGameDataStore } from '../../../store/gameDataStore';

const sessionKey = (category) => category === "weapon" ? "selectedWeapons" : "selectedSpells";

function readSession() {
    try { return JSON.parse(localStorage.getItem("battleSession") || "{}"); }
    catch { return {}; }
}

//Removes a deleted action from all characters' arsenals and clears it from the live store
function cleanupBattleSession(actionName, category) {
    const session = readSession();
    const key = sessionKey(category);
    let changed = false;
    for (const charID in session) {
        const list = session[charID]?.[key];
        if (Array.isArray(list) && list.includes(actionName)) {
            session[charID][key] = list.filter(n => n !== actionName);
            changed = true;
        }
    }
    if (changed) localStorage.setItem("battleSession", JSON.stringify(session));
    const { action, setSelectedAction } = useBattleStore.getState();
    if (action.selected === actionName) setSelectedAction("", "", "");
}

//Renames an action across all characters' arsenals and updates the live store if it is selected
function renameBattleSession(oldName, newName, category) {
    const session = readSession();
    const key = sessionKey(category);
    let changed = false;
    for (const charID in session) {
        const list = session[charID]?.[key];
        if (Array.isArray(list) && list.includes(oldName)) {
            session[charID][key] = list.map(n => n === oldName ? newName : n);
            changed = true;
        }
    }
    if (changed) localStorage.setItem("battleSession", JSON.stringify(session));
    const state = useBattleStore.getState();
    if (state.action.selected === oldName) {
        useBattleStore.setState({ action: { ...state.action, selected: newName } });
    }
}

export default function useActionBuilder({ initialData, category }) {
    const fetchKey = `${category}s`;
    const [actionData, setActionData] = useState(initialData);
    const [choices, setChoices] = useState([]);
    const [errors, setErrors] = useState({});
    const [selectedID, setSelectedID] = useState(null);
    //Controls if edit or create UI is shown, also resets values on swap
    const [divVisibility, setDivVisibility] = useState(false);
    const [saveError, setSaveError] = useState("");

    async function fetchActions() {
        try {
            const res = await apiFetch(`${BACKEND_BASE_URL}/actions`);
            if (!res?.ok) { console.error("FailedToFetchActions: bad response"); return; }
            const data = await res.json();
            setChoices(data[fetchKey] || []);
        } catch (err) { console.error("FailedToFetchActions:", err); }
    }

    useEffect(() => { fetchActions(); }, []);

    function resetValues() {
        setActionData(initialData);
        setSelectedID(null);
        setErrors({});
        setSaveError("");
    }

    function handleSwapUI() {
        setDivVisibility(prev => !prev);
        resetValues();
    }

    async function handleDelete(id) {
        try {
            const res = await apiFetch(`${BACKEND_BASE_URL}/actions/${id}`, { method: "DELETE" });
            if (!res?.ok) { setSaveError("Failed to delete. Please try again."); return; }
            //Only clean up after the DELETE is confirmed to prevent stale localStorage on failure
            const action = choices.find(c => c._id === id);
            if (action) cleanupBattleSession(action.name, category);
            await fetchActions();
            resetValues();
            setSaveError("");
        } catch (err) {
            console.error("FailedToDelete:", err);
            setSaveError("Failed to delete. Please try again.");
        }
    }

    async function handleSave(payload) {
        try {
            const oldAction = selectedID ? choices.find(c => c._id === selectedID) : null;
            const url = selectedID ? `${BACKEND_BASE_URL}/actions/${selectedID}` : `${BACKEND_BASE_URL}/actions`;
            const res = await apiFetch(url, {
                method: selectedID ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res?.ok) { setSaveError("Failed to save. Please try again."); return; }
            //Only rename after PUT is confirmed to prevent stale localStorage on failure
            if (oldAction && oldAction.name !== payload.name) {
                renameBattleSession(oldAction.name, payload.name, category);
            }
            await fetchActions();
            await useGameDataStore.getState().refreshItems();
            resetValues();
            setSaveError("");
        } catch (err) {
            console.error("FailedToSave:", err);
            setSaveError("Failed to save. Please try again.");
        }
    }

    return {
        actionData, setActionData,
        choices,
        errors, setErrors,
        saveError,
        selectedID, setSelectedID,
        divVisibility,
        resetValues,
        handleSwapUI,
        handleDelete,
        handleSave
    };
}
