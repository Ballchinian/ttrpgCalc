import './CharacterSelection.css';
import { useNavigate } from "react-router-dom";
import { Card, Button, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import characterImageTemplate from "../../images/characterImages/blank character.png";
import { apiFetch } from '../../auth';
import { BACKEND_BASE_URL } from "../../config";
import ImportCharacterModal from './ImportCharacterModal';

function CharacterSelection() {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState([]); //All characters from backend
    const [filteredCharacters, setFilteredCharacters] = useState([]); //Characters filtered by search bar
    const [index, setIndex] = useState(0); //Current carousel index
    const [searchTerm, setSearchTerm] = useState(""); //Current search query
    const [showImport, setShowImport] = useState(false); //Pathbuilder import modal visibility

    //Fetch all characters on first render
    useEffect(() => {
        async function fetchCharacters() {
            try {
                const res = await apiFetch(`${BACKEND_BASE_URL}/characters`, { method: "GET" });
                if (!res) return;
                const data = await res.json();
                const transformed = data.map(char => ({
                    id: char._id,
                    name: char.characterName,
                    stats: char.stats,
                    image: char.image || characterImageTemplate,
                }));
                setCharacters(transformed);
                setFilteredCharacters(transformed);
            } catch (err) {
                console.error("Error fetching characters:", err);
            }
        }
        fetchCharacters();
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        const filtered = characters.filter(c =>
            c.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCharacters(filtered);
        setIndex(0);
    };

    const handleDeleteCharacter = async (characterID, characterName) => {
        if (!window.confirm(`Are you sure you want to delete "${characterName}"?`)) return;

        try {
            const res = await apiFetch(`${BACKEND_BASE_URL}/characters/${characterID}`, { method: "DELETE" });

            if (res.ok) {
                //Remove character from frontend lists
                setCharacters(prev => prev.filter(c => c.id !== characterID));
                setFilteredCharacters(prev => prev.filter(c => c.id !== characterID));

                //Delete from battle session storage, keyed by MongoDB _id, not name
                try {
                    const battleSession = JSON.parse(localStorage.getItem("battleSession") || "{}");
                    const updatedSessions = Object.fromEntries(
                        Object.entries(battleSession).filter(([key]) => key !== characterID)
                    );
                    localStorage.setItem("battleSession", JSON.stringify(updatedSessions));
                } catch { /* corrupt session data, leave as-is */ }
                setIndex(0);
            } else {
                console.error("Failed to delete character");
            }
        } catch (err) {
            console.error("Error deleting character:", err);
        }
    };

    const handleCharacterSelect = (characterID) => {
        navigate(`/character-selection/character-design/${characterID}`);
    };

    //Carousel geometry - derived from the card size so the slide step, viewport width and the
    //prev/next visibility all stay in sync if the card dimensions change.
    const CARD_W = 180;   //card width (matches .character-card in the CSS)
    const CARD_GAP = 12;  //horizontal space between cards
    const STEP = CARD_W + CARD_GAP;
    const VISIBLE = 4;    //cards shown at once

    const prev = () => {
        if (index > 0) setIndex(index - 1);
    };
    const next = () => {
        if (filteredCharacters.length - index > VISIBLE) setIndex(index + 1);
    };

    return (
        <div
            className="d-flex flex-column align-items-center"
            style={{
                minHeight: "100vh",
                padding: "20px",
                gap: "100px"
            }}
        >
            {/*search bar*/}
            <div style={{ width: "300px" }}>
                <Form.Control
                    type="text"
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
            {/*character carousel*/}
            <div className="d-flex justify-content-center align-items-center">
                <div className="d-flex">

                    {filteredCharacters.length > VISIBLE && (
                        <Button variant="secondary" onClick={prev}>Prev</Button>
                    )}

                    <div className="carousel-wrapper" style={{ width: `${STEP * VISIBLE}px`, overflow: "hidden" }}>
                        <div
                            className="d-flex"
                            style={{ transform: `translateX(-${index * STEP}px)`, transition: "transform 0.3s ease" }}
                        >
                            {filteredCharacters.map((character) => (
                                //Whole card opens the sheet; Delete stops propagation so it doesn't also navigate.
                                <Card
                                    className="character-card d-flex flex-column align-items-center"
                                    key={character.id}
                                    role="button"
                                    onClick={() => handleCharacterSelect(character.id)}
                                    style={{ width: `${CARD_W}px`, flex: `0 0 ${CARD_W}px`, marginRight: `${CARD_GAP}px`, paddingBottom: "14px" }}
                                >
                                    <Card.Header className="w-100 text-center text-truncate">{character.name}</Card.Header>
                                    {/* Real portraits are 4:5 (cropped on upload), so `cover` fills the frame.
                                        The blank-character placeholder isn't 4:5 - show it whole with `contain`
                                        on a framed background so it's melded to fit rather than cropped. */}
                                    <Card.Img
                                        variant="top"
                                        style={{
                                            width: "160px", height: "200px", marginBottom: "16px",
                                            objectFit: character.image === characterImageTemplate ? "contain" : "cover",
                                            background: "#0d2547",
                                        }}
                                        src={character.image}
                                        alt={character.name}
                                    />
                                    <Button
                                        variant="danger"
                                        className="d-flex justify-content-center align-items-center mt-auto"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(character.id, character.name); }}
                                    >
                                        <FaTrash style={{ marginRight: "8px" }} />
                                        Delete
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                    {filteredCharacters.length > VISIBLE && (
                        <Button variant="secondary" onClick={next}>Next</Button>
                    )}
                </div>
            </div>
            {/*bottom buttons*/}
            <div className="d-flex gap-3">
                <Button
                    onClick={() => handleCharacterSelect("newCharacterIdentifier")}
                    variant="secondary"
                >
                    ↪ Create a new character
                </Button>
                <Button variant="outline-secondary" onClick={() => setShowImport(true)}>
                    Import character
                </Button>
            </div>

            <ImportCharacterModal show={showImport} onHide={() => setShowImport(false)} />

        </div>
    );
}

export default CharacterSelection;
