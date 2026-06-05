import { Card, Form, Button } from "react-bootstrap";

//For displaying of all the skills to edit e.g. athletics, deception... in pathfinder
function CharacterSkills({ skills, setSkills, setEditingSkills }) {
    function handleSkillChange(e) {
        const { name, value } = e.target;
        //Use functional update to avoid stale closure over skills prop
        setSkills(prev => ({ ...prev, [name]: Number(value) }));
    }

    return (
        <Card style={{ display: "flex", width: "90%", margin: "20px auto" }}>
            <Card.Body>

                <h3>Skills</h3>
                <Button
                    variant="success"
                    className="mt-4"
                    onClick={() => setEditingSkills(prev => !prev)}
                >
                    Hide Skills
                </Button>

                {/*Displays skills across more than one column*/}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "16px",
                        marginTop: "20px",
                    }}
                >
                    {/*Sets all the skills up given at the top of the function (athletics, intimidation etc...)*/}
                    {Object.entries(skills || {}).map(([skillName, skillValue]) => (
                        <div key={skillName} style={{ marginBottom: "10px" }}>
                            <p>{skillName.charAt(0).toUpperCase() + skillName.slice(1)}</p>
                            <Form.Control
                                type="number"
                                name={skillName}
                                value={skillValue}
                                onChange={handleSkillChange}
                            />
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
}

export default CharacterSkills;
