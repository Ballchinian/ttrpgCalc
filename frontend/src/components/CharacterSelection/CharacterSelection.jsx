import './CharacterSelection.css';
import { useNavigate } from "react-router-dom";
import { Card, Button, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import characterImageTemplate from "../../images/characterImages/blank character.png";
import { apiFetch } from '../../auth';
import { BACKEND_BASE_URL } from "../../config";

function CharacterSelection() {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState([]); //All characters from backend
    const [filteredCharacters, setFilteredCharacters] = useState([]); //Characters filtered by search bar
    const [index, setIndex] = useState(0); //Current carousel index
    const [searchTerm, setSearchTerm] = useState(""); //Current search query

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
    const prev = () => {
        if (index > 0) setIndex(index - 1);
    };
    const next = () => {
        if (filteredCharacters.length - index > 3) setIndex(index + 1);
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

                    {filteredCharacters.length >= 4 && (
                        <Button variant="secondary" onClick={prev}>Prev</Button>
                    )}

                    <div className="carousel-wrapper" style={{ width: "900px", overflow: "hidden" }}>
                        <div
                            className="d-flex "
                            style={{ transform: `translateX(-${index * 300}px)`, transition: "transform 0.3s ease"}}
                        >
                            {filteredCharacters.map((character) => (
                                <Card
                                    className="d-flex align-items-center"
                                    key={character.id}
                                    style={{
                                        height: "35vh",
                                        width: "300px",
                                        flex: "0 0 300px",
                                        margin: "0"
                                    }}
                                >
                                    <Card.Header>{character.name}</Card.Header>
                                    <Card.Img
                                        style={{ width: "225px", height: "180px", objectFit: "contain", cursor: "pointer", transition: "transform 0.15s ease" }}
                                        src={character.image}
                                        onClick={() => handleCharacterSelect(character.id)}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    />
                                    <Button
                                        variant="danger"
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            marginTop: "auto"
                                        }}
                                        onClick={() => handleDeleteCharacter(character.id, character.name)}
                                    >
                                        <FaTrash style={{ marginRight: "8px" }} />
                                        Delete
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                    {filteredCharacters.length >= 4 && (
                        <Button variant="secondary" onClick={next}>Next</Button>
                    )}
                </div>
            </div>
            {/*bottom button*/}
            <Button
                onClick={() => handleCharacterSelect("newCharacterIdentifier")}
                variant="dark"
            >
                Create a new character
            </Button>

        </div>
    );
}

export default CharacterSelection;
