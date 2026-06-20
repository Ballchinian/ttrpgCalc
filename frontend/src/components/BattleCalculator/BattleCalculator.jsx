import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Dropdown } from "react-bootstrap";
import { useBattleStore } from "../../store/battleStore";
import { apiFetch } from "../../auth";
import { BACKEND_BASE_URL } from "../../config";
import ItemPickerModal from "./ItemPickerModal";
import { OffensiveInputForm, DefensiveInputForm } from "./renderBonusInputForm";

const dropdownWrapStyle = { marginTop: "100px" };
const dropdownToggleStyle = { fontSize: "40px" };
/* padding is set explicitly: these cards place content directly in <Card> (no Card.Body), so they
   need their own inner spacing now that the old app-wide `.card { padding:20px }` leak is scoped away */
const cardStyle = { margin: "20px", padding: "20px" };
const dropdownInnerStyle = { marginBottom: "20px" };
/* listStylePosition:inside keeps the bullet within the card's padding (a bare <li> with no <ul>
   otherwise hangs its marker off the left edge); paddingLeft adds breathing room from the side. */
const arsenalItemStyle = { cursor: "pointer", marginBottom: "8px", listStylePosition: "inside", paddingLeft: "0.75rem" };

function readBattleSession() {
    try { return JSON.parse(localStorage.getItem("battleSession") || "{}"); }
    catch { return {}; }
}

function writeBattleSession(session) {
    try { localStorage.setItem("battleSession", JSON.stringify(session)); }
    catch { /* ignore */ }
}

//Default values for all offensive bonuses
//weapon.attack applies to both strHit and dexHit; dc.attack applies to the spell DC stat
const INITIAL_OFFENSIVE_BONUSES = {
    weapon: {
        attack: { circumstance: 0, item: 0, status: 0 },
        damage: { circumstance: 0, item: 0, status: 0 },
    },
    dc: {
        attack: { circumstance: 0, item: 0, status: 0 },
        damage: { circumstance: 0, item: 0, status: 0 },
    },
};

//Default values for all defensive bonuses
const INITIAL_DEFENSIVE_BONUSES = {
    ac: { circumstance: 0, item: 0, status: 0 },
    fortitude: { circumstance: 0, item: 0, status: 0 },
    reflex: { circumstance: 0, item: 0, status: 0 },
    will: { circumstance: 0, item: 0, status: 0 },
};

function BattleCalculator() {
    const navigate = useNavigate();

    const [selectedPlayerID, setSelectedPlayerID] = useState(null);
    const [selectedPlayerName, setSelectedPlayerName] = useState("Choose Player");
    //Weapon, DC
    const [selectedConditionAttack, setSelectedConditionAttack] = useState("Select attack type");
    //AC, Fortitude, Reflex, Will
    const [selectedConditionDefence, setSelectedConditionDefence] = useState("Select defence type");
    const [selectedSpells, setSelectedSpells] = useState([]);
    const [selectedWeapons, setSelectedWeapons] = useState([]);
    const [offensiveBonuses, setOffensiveBonuses] = useState(INITIAL_OFFENSIVE_BONUSES);
    const [defensiveBonuses, setDefensiveBonuses] = useState(INITIAL_DEFENSIVE_BONUSES);
    const bonusController = { offensiveBonuses, setOffensiveBonuses, defensiveBonuses, setDefensiveBonuses };
    const [showWeaponModal, setShowWeaponModal] = useState(false);
    const [showSpellModal, setShowSpellModal] = useState(false);
    const [databaseCharacters, setDatabaseCharacters] = useState([]);
    //Each entry: { name: string, group: string|null }
    const [databaseWeapons, setDatabaseWeapons] = useState([]);
    const [databaseSpells, setDatabaseSpells] = useState([]);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        async function fetchCharacters() {
            try {
                const res = await apiFetch(`${BACKEND_BASE_URL}/characters`);
                if (!res) return;
                if (!res.ok) { setFetchError(true); return; }
                const data = await res.json();
                const charInfo = data.map(char => ({ charID: char._id, charName: char.characterName }));
                setDatabaseCharacters(charInfo);

                //Prune battleSession entries for characters no longer in the DB
                const session = readBattleSession();
                const validIds = new Set(charInfo.map(c => String(c.charID)));
                const cleaned = Object.fromEntries(Object.entries(session).filter(([id]) => validIds.has(id)));
                if (Object.keys(cleaned).length !== Object.keys(session).length) {
                    writeBattleSession(cleaned);
                }
            } catch {
                setFetchError(true);
            }
        }

        async function fetchItems() {
            try {
                const res = await apiFetch(`${BACKEND_BASE_URL}/actions`);
                if (!res) return;
                if (!res.ok) { setFetchError(true); return; }
                const data = await res.json();
                setDatabaseWeapons((data.weapons || []).map(w => ({ name: w.name, tags: w.group ? [w.group] : [] })));
                setDatabaseSpells((data.spells || []).map(s => ({ name: s.name, tags: s.tradition ?? [] })));
            } catch {
                setFetchError(true);
            }
        }

        fetchCharacters();
        fetchItems();
    }, []);

    //Auto-save current player's arsenal and bonuses to localStorage whenever they change
    useEffect(() => {
        if (!selectedPlayerID) return;
        const session = readBattleSession();
        session[selectedPlayerID] = { selectedWeapons, selectedSpells, offensiveBonuses, defensiveBonuses };
        writeBattleSession(session);
    }, [selectedPlayerID, selectedWeapons, selectedSpells, offensiveBonuses, defensiveBonuses]);

    //Auto-restore last selected player once character list loads
    useEffect(() => {
        if (databaseCharacters.length === 0 || selectedPlayerID) return;
        try {
            const ui = JSON.parse(localStorage.getItem("battleCalculatorUI") || "{}");
            const lastID = ui.lastPlayerID;
            if (!lastID) return;
            const char = databaseCharacters.find(c => String(c.charID) === String(lastID));
            if (!char) return;
            const session = readBattleSession();
            setSelectedPlayerID(lastID);
            setSelectedPlayerName(char.charName);
            if (session[lastID]) {
                setSelectedWeapons(session[lastID].selectedWeapons ?? []);
                setSelectedSpells(session[lastID].selectedSpells ?? []);
                setOffensiveBonuses(session[lastID].offensiveBonuses ?? INITIAL_OFFENSIVE_BONUSES);
                setDefensiveBonuses(session[lastID].defensiveBonuses ?? INITIAL_DEFENSIVE_BONUSES);
            }
        } catch { /* ignore */ }
    }, [databaseCharacters]);

    function handleGoToSimulator() {
        //Clear previous battle log via the store action
        useBattleStore.getState().setLog({});
        navigate("/battle-calculator/battle-simulator");
    }

    const action = useBattleStore(s => s.action);
    const setSelectedAction = useBattleStore(s => s.setSelectedAction);

    function toggleWeapon(name) {
        const removing = selectedWeapons.includes(name);
        setSelectedWeapons(prev => removing ? prev.filter(n => n !== name) : [...prev, name]);
        if (removing && action.selected === name) setSelectedAction("", "", "");
    }

    function toggleSpell(name) {
        const removing = selectedSpells.includes(name);
        setSelectedSpells(prev => removing ? prev.filter(n => n !== name) : [...prev, name]);
        if (removing && action.selected === name) setSelectedAction("", "", "");
    }

    //Reset just the weapons (independent from spells) - clears state + the persisted session slice
    function handleResetWeapons() {
        setSelectedWeapons([]);
        if (action.selected && selectedWeapons.includes(action.selected)) setSelectedAction("", "", "");
        if (!selectedPlayerID) return;
        const session = readBattleSession();
        if (session[selectedPlayerID]) {
            session[selectedPlayerID] = { ...session[selectedPlayerID], selectedWeapons: [] };
            writeBattleSession(session);
        }
    }

    //Reset just the spells (independent from weapons)
    function handleResetSpells() {
        setSelectedSpells([]);
        if (action.selected && selectedSpells.includes(action.selected)) setSelectedAction("", "", "");
        if (!selectedPlayerID) return;
        const session = readBattleSession();
        if (session[selectedPlayerID]) {
            session[selectedPlayerID] = { ...session[selectedPlayerID], selectedSpells: [] };
            writeBattleSession(session);
        }
    }

    //Reset offensive bonuses to zero AND collapse the picker back to "Select attack type" so the
    //attack/damage inputs minimise (mirrors the arsenal reset for state + session)
    function handleResetOffensive() {
        setOffensiveBonuses(INITIAL_OFFENSIVE_BONUSES);
        setSelectedConditionAttack("Select attack type");
        if (!selectedPlayerID) return;
        const session = readBattleSession();
        if (session[selectedPlayerID]) {
            session[selectedPlayerID] = { ...session[selectedPlayerID], offensiveBonuses: INITIAL_OFFENSIVE_BONUSES };
            writeBattleSession(session);
        }
    }

    //Reset defensive bonuses to zero AND collapse the picker back to "Select defence type"
    function handleResetDefensive() {
        setDefensiveBonuses(INITIAL_DEFENSIVE_BONUSES);
        setSelectedConditionDefence("Select defence type");
        if (!selectedPlayerID) return;
        const session = readBattleSession();
        if (session[selectedPlayerID]) {
            session[selectedPlayerID] = { ...session[selectedPlayerID], defensiveBonuses: INITIAL_DEFENSIVE_BONUSES };
            writeBattleSession(session);
        }
    }

    return (
        <div className="d-flex flex-column align-items-center">
            {fetchError && <p className="text-danger">Failed to load characters or actions. Please refresh the page.</p>}
            {/* Player dropdown: always visible */}
            <Dropdown
                onSelect={(nextPlayer) => {
                    //Save current player before switching
                    if (selectedPlayerID) {
                        const session = readBattleSession();
                        session[selectedPlayerID] = { selectedWeapons, selectedSpells, offensiveBonuses, defensiveBonuses };
                        writeBattleSession(session);
                    }

                    //Persist last player so auto-restore can pick it up on next mount
                    try { localStorage.setItem("battleCalculatorUI", JSON.stringify({ lastPlayerID: nextPlayer })); }
                    catch { /* ignore */ }

                    setSelectedPlayerID(nextPlayer);
                    const char = databaseCharacters.find(c => String(c.charID) === String(nextPlayer));
                    setSelectedPlayerName(char ? char.charName : "Choose Player");

                    //Load the new player's saved data
                    const session = readBattleSession();
                    if (session[nextPlayer]) {
                        setSelectedWeapons(session[nextPlayer].selectedWeapons ?? []);
                        setSelectedSpells(session[nextPlayer].selectedSpells ?? []);
                        setOffensiveBonuses(session[nextPlayer].offensiveBonuses ?? INITIAL_OFFENSIVE_BONUSES);
                        setDefensiveBonuses(session[nextPlayer].defensiveBonuses ?? INITIAL_DEFENSIVE_BONUSES);
                    } else {
                        setSelectedWeapons([]);
                        setSelectedSpells([]);
                        setOffensiveBonuses(INITIAL_OFFENSIVE_BONUSES);
                        setDefensiveBonuses(INITIAL_DEFENSIVE_BONUSES);
                    }
                }}

                style={dropdownWrapStyle}
            >
                <Dropdown.Toggle variant="primary" style={dropdownToggleStyle}>
                    {selectedPlayerName}
                </Dropdown.Toggle>
                {/*Lists all characters to select from*/}
                <Dropdown.Menu>
                    {databaseCharacters.map(({ charID, charName }) =>(
                        <Dropdown.Item eventKey={charID} key={charID}>{charName}</Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
            <Button
                variant="secondary"
                className="m-4"
                onClick={handleGoToSimulator}
            >
                ↪ Go to fight!
            </Button>
            {/* Only show the rest once a player is chosen */}
            {selectedPlayerID && (
                <div className="d-flex flex-column align-items-center w-100">
                    <div className="d-flex justify-content-center w-100">
                        {/* Left column: attack */}
                        <Card style={cardStyle}>
                            <h2 className="text-center mb-4">Offensive Stats</h2>
                            {/*Select the offensive stat, with Reset pushed to the far right of the same row.
                               gap-3 guarantees space between the picker and Reset on narrow cards.*/}
                            <div className="d-flex justify-content-between align-items-center gap-3" style={dropdownInnerStyle}>
                                <Dropdown onSelect={(key) => setSelectedConditionAttack(key)}>
                                    <Dropdown.Toggle variant="primary">
                                        {selectedConditionAttack}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item eventKey="weapon">Weapon</Dropdown.Item>
                                        <Dropdown.Item eventKey="dc">DC</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                <Button size="sm" variant="outline-danger" onClick={handleResetOffensive}>
                                    Reset
                                </Button>
                            </div>
                            <OffensiveInputForm
                                selectedCondition={selectedConditionAttack}
                                bonusController={bonusController}
                            />
                        </Card>

                        {/* Middle column: arsenal */}
                        <Card style={cardStyle}>
                            <h2 className="text-center mb-4">Select Arsenal</h2>

                            {/*Weapons: heading + own Reset, selected list, then modal picker*/}
                            <div className="d-flex justify-content-between align-items-center gap-3 mb-1">
                                <p className="mb-0">Weapons</p>
                                <Button size="sm" variant="outline-danger" onClick={handleResetWeapons}>
                                    Reset
                                </Button>
                            </div>
                            {selectedWeapons.map(name => (
                                <li
                                    key={name}
                                    onClick={() => toggleWeapon(name)}
                                    style={arsenalItemStyle}
                                    onMouseEnter={e => (e.target.style.color = "var(--app-success)")}
                                    onMouseLeave={e => (e.target.style.color = "var(--app-text)")}
                                >
                                    {name}
                                </li>
                            ))}
                            <Button size="sm" variant="outline-primary" className="mt-2 mb-4" onClick={() => setShowWeaponModal(true)}>
                                + Add Weapon
                            </Button>

                            {/*Spells: heading + own Reset, selected list, then modal picker*/}
                            <div className="d-flex justify-content-between align-items-center gap-3 mb-1">
                                <p className="mb-0">Spells</p>
                                <Button size="sm" variant="outline-danger" onClick={handleResetSpells}>
                                    Reset
                                </Button>
                            </div>
                            {selectedSpells.map(name => (
                                <li
                                    key={name}
                                    onClick={() => toggleSpell(name)}
                                    style={arsenalItemStyle}
                                    onMouseEnter={e => (e.target.style.color = "var(--app-success)")}
                                    onMouseLeave={e => (e.target.style.color = "var(--app-text)")}
                                >
                                    {name}
                                </li>
                            ))}
                            <Button size="sm" variant="outline-primary" className="mt-2" onClick={() => setShowSpellModal(true)}>
                                + Add Spell
                            </Button>

                            <ItemPickerModal
                                show={showWeaponModal}
                                onHide={() => setShowWeaponModal(false)}
                                title="Add Weapon"
                                items={databaseWeapons}
                                selectedItems={selectedWeapons}
                                onToggle={toggleWeapon}
                            />
                            <ItemPickerModal
                                show={showSpellModal}
                                onHide={() => setShowSpellModal(false)}
                                title="Add Spell"
                                items={databaseSpells}
                                selectedItems={selectedSpells}
                                onToggle={toggleSpell}
                            />
                        </Card>

                        {/* Right column: defence */}
                        <Card style={cardStyle}>
                            <h2 className="text-center mb-4">Defensive Stats</h2>
                            {/*Select the defensive stat, with Reset pushed to the far right of the same row.
                               gap-3 guarantees space between the picker and Reset on narrow cards.*/}
                            <div className="d-flex justify-content-between align-items-center gap-3" style={dropdownInnerStyle}>
                                <Dropdown onSelect={(key) => setSelectedConditionDefence(key)}>
                                    <Dropdown.Toggle variant="primary">
                                        {selectedConditionDefence}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item eventKey="ac">AC</Dropdown.Item>
                                        <Dropdown.Item eventKey="fortitude">Fortitude</Dropdown.Item>
                                        <Dropdown.Item eventKey="reflex">Reflex</Dropdown.Item>
                                        <Dropdown.Item eventKey="will">Will</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                <Button size="sm" variant="outline-danger" onClick={handleResetDefensive}>
                                    Reset
                                </Button>
                            </div>
                            <DefensiveInputForm
                                selectedCondition={selectedConditionDefence}
                                bonusController={bonusController}
                            />
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BattleCalculator
