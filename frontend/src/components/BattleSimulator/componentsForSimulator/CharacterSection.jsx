import { useState, useCallback } from "react";
import { Button } from "react-bootstrap";
import SearchbarToggle from "../../utility/searchbarToggle";

const sectionStyle = { width: "100%", textAlign: "center" };

function CharacterSection({
    label,
    buttonLabel,
    color,
    characterList,
    onAdd
}) {
    const [adding, setAdding] = useState(false);

    const handleSelect = useCallback((char) => {
        onAdd(char);
        setAdding(false);
    }, [onAdd]);

    return (
        <div style={sectionStyle}>
            <div className="d-flex justify-content-center align-items-center mb-4">
                <h2 className="text-light m-4">{label}</h2>

                {!adding ? (
                    <Button
                        variant={`outline-${color}`}
                        onClick={() => setAdding(true)}
                    >
                        {buttonLabel}
                    </Button>
                ) : (
                    <SearchbarToggle
                        placeholder={`Search ${label.toLowerCase()}...`}
                        list={characterList}
                        getLabel={(item) => item.characterName}
                        getImage={(c) => c.image}
                        onSelect={handleSelect}
                        onBlur={() => setAdding(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default CharacterSection;
