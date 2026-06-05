import { CardBody, Card, Button, Row, Col, OverlayTrigger, Tooltip } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useState, useEffect } from "react";
import "./CharacterDesign.css";
import CharacterSkills from "./CharacterSkills/CharacterSkills";
import { DamageModifiers } from "./DamageModifiers";
import { useParams, useNavigate } from "react-router-dom";
import newCharacterPicture from "../../images/characterImages/blank character.png";
import { apiFetch } from '../../auth';
import { BACKEND_BASE_URL } from "../../config";
import { useGameDataStore } from '../../store/gameDataStore';
import { useBattleStore } from '../../store/battleStore';

//Human-readable overrides for stats whose names don't read well from camelCase
const STAT_LABELS = {
    ac: "AC", dc: "Spell DC", health: "Health",
    str: "STR Mod", strHit: "STR Hit", dexHit: "DEX Hit",
};

const STAT_TOOLTIPS = {
    str: "Your Strength modifier (e.g. enter 3 for +3). Automatically added to melee weapon damage rolls. Does not affect attack rolls, enter your full melee attack bonus in STR Hit.",
    strHit: "Your total melee attack bonus, compared against the target's AC. Enter the final value already including proficiency, level, and your STR modifier. This simulator does not compute it for you.",
    dexHit: "Your total ranged attack bonus, compared against the target's AC. Also used for finesse weapons when higher than STR Hit. Enter the final value including all bonuses.",
};

function CharacterDesign() {
    const navigate = useNavigate();
    
    //From url
    const { characterID } = useParams();
    const isNew = characterID === "newCharacterIdentifier";

    //Confirmation States
    const [editNameVis, setEditNameVis] = useState(!isNew); //If new character, show form immediately
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const [editingSkills, setEditingSkills] = useState(false);

    //Show preview of image before upload
    const [previewUrl, setPreviewUrl] = useState("");
    //Revoke the previous blob URL when previewUrl changes or on unmount
    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
    const [characterStorage, setCharacterStorage] = useState([]);

    //Damage modifiers
    const [resistances, setResistances] = useState([]);
    const [weaknesses, setWeaknesses] = useState([]);
    const [immunities, setImmunities] = useState([]);
    const damageTypes = useGameDataStore(state => state.damageTypes);

    //Info that will be essential for character
    const [characterName, setCharacterName] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [characterStats, setCharacterStats] = useState({
        ac: 0,
        dc: 0,
        str: 0,
        strHit: 0,
        dexHit: 0,
        health: 0,
        reflex: 0,
        fortitude: 0,
        will: 0,
        skills: {
            perception: 0,
            acrobatics: 0,
            athletics: 0,
            arcana: 0,
            crafting: 0,
            deception: 0,
            diplomacy: 0,
            intimidation: 0,
            medicine: 0,
            nature: 0,
            occultism: 0,
            performance: 0,
            religion: 0,
            society: 0,
            stealth: 0,
            survival: 0,
            thievery: 0
        }
    });

    //Initialises characterStorage to find existing characters for duplication reasons
    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const res = await apiFetch(`${BACKEND_BASE_URL}/characters`, { method: "GET" });
                if (!res) return;
                const data = await res.json();
                setCharacterStorage(data);
                //If its an existing character
                if (!isNew) {
                    //Finds the character from the backend and sets the stats and image
                    const char = data.find(c => c._id === characterID);
                    if (char) {
                        setCharacterName(char.characterName);
                        setCharacterStats(prev => ({
                            ...prev,
                            ...char.stats,
                            skills: { ...prev.skills, ...(char.stats?.skills ?? {}) },
                        }));
                        setImgUrl(char.image);
                        setResistances(char.resistances ?? []);
                        setWeaknesses(char.weaknesses ?? []);
                        setImmunities(char.immunities ?? []);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCharacters();
    }, [characterID, isNew]);


    //For all the different fields not including characterName or skills
    function handleStatChange(e) {
        const { name, value } = e.target;
        setCharacterStats(prev => ({ ...prev, [name]: Number(value) }));
    }

    async function handleChangeCharacter() {
        if (uploading) {
            alert("Please wait, image is still uploading...");
            return;
        }

        const newErrors = {};

        //For stats not including skills
        Object.entries(characterStats).forEach(([key, value]) => {
            if (value === "" || isNaN(value)) {
                //skills is included in characterStats, must be iterated through separately
                if (key !== "skills") {
                    newErrors[key] = `${key} must be a number!`;
                }
            }
        });

        //For skills under skills
        Object.entries(characterStats.skills).forEach(([key, value]) => {
            if (value === "" || isNaN(value)) {
                newErrors[key] = `${key} must be a number!`;
            }
        });

        if (!characterName || characterName.trim() === "") {
            newErrors.characterName = "Character name is required.";
        }
        if (characterStorage.length > 0) {
            const isDuplicate = characterStorage.some(
                c =>
                    c &&
                    c.characterName.toLowerCase() === characterName.trim().toLowerCase() &&
                    c._id !== characterID
            );
            if (isDuplicate) newErrors.duplicate = "A character with this name already exists.";
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        //Create the character object to send to backend
        const characterData = {
            characterName,
            stats: characterStats,
            image: imgUrl,
            resistances,
            weaknesses,
            immunities,
        };
        try {
            //Decides to make a character if new, if not then edit it
            if (isNew) {
                const res = await apiFetch(`${BACKEND_BASE_URL}/characters`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(characterData)
                });
                if (!res.ok) { setErrors({ server: "Failed to save character. Please try again." }); return; }
                const saved = await res.json();
                setCharacterStorage(prev => [...prev, saved]);
            } else {
                const res = await apiFetch(`${BACKEND_BASE_URL}/characters/${characterID}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(characterData)
                });
                if (!res.ok) { setErrors({ server: "Failed to update character. Please try again." }); return; }
                const updated = await res.json();

                //Update local storage array by matching the old name
                setCharacterStorage(prev =>
                    prev.map(c => c._id === characterID ? updated : c)
                );

                //Sync the fresh stats into gameDataStore and any existing battle snapshot immediately
                useGameDataStore.getState().upsertCharacter(updated);
                useBattleStore.getState().syncPartyStats([updated]);

                //Edited stats invalidate any saved battle bonuses for this character
                try {
                    const battleSession = JSON.parse(localStorage.getItem("battleSession") || "{}");
                    delete battleSession[characterID];
                    localStorage.setItem("battleSession", JSON.stringify(battleSession));
                } catch { /* corrupt session data, leave as-is */ }
            }
            navigate("/character-selection");
        } catch (err) {
            console.error(err);
            setErrors({ server: "An unexpected error occurred." });
        }
    };

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        //Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        //Start loading
        setUploading(true);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await apiFetch(`${BACKEND_BASE_URL}/characters/upload`, {
                method: "POST",
                body: formData,
            });
            if (!res) { setErrors({ server: "Session expired. Please refresh." }); return; }
            if (!res.ok) { setErrors({ server: "Image upload failed. Please try again." }); return; }
            const data = await res.json();

            setImgUrl(data.url);
            //Remove preview once we have a hosted URL
            setPreviewUrl("");
        } catch (err) {
            console.error("Error uploading image:", err);
            setErrors(prev => ({ ...prev, server: "Image upload failed. Please try again." }));
            setPreviewUrl("");
        } finally {
            setUploading(false);
        }
    }
    
    //For loading html forms
    const renderStatForms = stat => {
        const label = STAT_LABELS[stat] ?? stat.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
        const tooltip = STAT_TOOLTIPS[stat];
        const labelEl = tooltip ? (
            <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
                <span style={{ borderBottom: "1px dotted currentColor", cursor: "help" }}>{label}</span>
            </OverlayTrigger>
        ) : label;
        return (
            <div>
                <p style={{ marginBottom: "4px" }}>{labelEl}</p>
                <Form.Control
                    type="number"
                    name={stat}
                    value={characterStats[stat] ?? 0}
                    onChange={handleStatChange}
                />
                {errors[stat] && (<div className="text-danger">{errors[stat]}</div>)}
            </div>
        );
    };

    return (
        <div className="d-flex flex-column align-items-center" style={{ marginTop:"8vh", width: "100%", paddingTop: "40px", paddingBottom: "40px" }}>
            
            {!editingSkills && (
            <Row className="align-items-start w-100 gx-3 mb-4">

                {/* Left — lg=5: three damage modifier columns */}
                <Col lg={5} className="mb-4">
                    <DamageModifiers
                        damageTypes={damageTypes}
                        resistances={resistances}
                        setResistances={setResistances}
                        weaknesses={weaknesses}
                        setWeaknesses={setWeaknesses}
                        immunities={immunities}
                        setImmunities={setImmunities}
                    />
                </Col>

                {/* Center — lg=2: character image and name */}
                <Col lg={2} className="d-flex justify-content-center mb-4">
                    <div className="text-center w-100">

                        {editNameVis ? (
                        <h1
                            style={{ cursor: "pointer" }}
                            onClick={() => setEditNameVis(false)}
                        >
                            {characterName}
                        </h1>
                        ) : (
                        <Form.Control
                            type="text"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            onBlur={() => {
                            if (characterName.trim() !== "") setEditNameVis(true);
                            }}
                            onKeyDown={(e) => {
                            if (e.key === "Enter" && characterName.trim() !== "")
                                setEditNameVis(true);
                            }}
                            autoFocus
                        />
                        )}

                        {errors.characterName && (
                        <div className="text-danger">{errors.characterName}</div>
                        )}
                        {errors.duplicate && (
                        <div className="text-danger">{errors.duplicate}</div>
                        )}
                        {errors.server && (
                        <div className="text-danger mt-2">{errors.server}</div>
                        )}

                        <img
                        style={{ width: "100%", maxWidth: "200px", height: "auto", aspectRatio: "1", marginTop: "20px", objectFit: "cover" }}
                        src={previewUrl || imgUrl || newCharacterPicture}
                        alt="Character"
                        />

                        {uploading && (
                        <div className="text-warning mt-2">Uploading image...</div>
                        )}

                        <div className="mt-3">
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        </div>
                    </div>
                </Col>

                {/* Right — lg=5: Stats and Defenses side by side */}
                <Col lg={5} className="mb-4">
                    <Row className="gx-3 justify-content-center">
                        <Col xs={5}>
                            <Card style={{ maxWidth: "200px" }}>
                                <CardBody>
                                <h3>Stats</h3>
                                {renderStatForms("str")}
                                {renderStatForms("strHit")}
                                {renderStatForms("dexHit")}
                                {renderStatForms("dc")}
                                </CardBody>
                            </Card>
                        </Col>
                        <Col xs={5}>
                            <Card style={{ maxWidth: "200px" }}>
                                <CardBody>
                                <h3>Defenses</h3>
                                {renderStatForms("ac")}
                                {renderStatForms("health")}
                                {renderStatForms("fortitude")}
                                {renderStatForms("reflex")}
                                {renderStatForms("will")}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Col>

            </Row>
            )}

            {/*Skills section*/}
            <div style={{width:"100%"}}>
                {/*Shows upon edit skills being pressed*/}
                {editingSkills && (
                    <CharacterSkills
                        
                        skills={characterStats.skills}
                        setSkills={(newSkills) => setCharacterStats((prev) => ({ ...prev, skills: newSkills }))}
                        setEditingSkills={setEditingSkills}
                    />
                )}
            </div>

            {/*Edit skills button*/}
            {!editingSkills && (
            <div className="d-flex justify-content-center"> 
                <Button 
                    variant="success" 
                    className="mt-5 justify-content-center d-flex" 
                    onClick={() => setEditingSkills(prev => !prev)}>
                    Edit Skills 
                </Button>
            </div>
            )}
            
            {/*Edit/new character button*/}
            <Button 
                style={{ width: "200px", marginTop: "40px", marginBottom: "40px" }} 
                variant="dark" 
                onClick={handleChangeCharacter} > 
                {isNew ? 'New Character' : 'Edit Character'} 
            </Button>
                
            
        </div>
    );
}

export default CharacterDesign;
