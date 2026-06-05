import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth';
import { Navbar as BsNavbar, Container, Nav } from 'react-bootstrap';
import { useBattleStore } from '../../store/battleStore';
import { useRecapStore } from '../../store/recapStore';

function Navbar({ onLogout }) {
    const navigate = useNavigate();

    return (
        <BsNavbar 
            bg="dark" 
            variant="dark" 
            expand="md"
            style={{
                padding: "10px 20px",
                marginBottom: "20px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
            }}
        >
            <Container className="d-flex justify-content-between align-items-center">
                
                {/*Brand / Title*/}
                <h4 
                    style={{
                        color: "white",
                        margin: 0,
                        fontWeight: "500",
                        letterSpacing: "0.5px",
                        cursor: "pointer"
                    }}
                    onClick={() => navigate("/home")}
                >
                    Pathfinder Calculator
                </h4>

                {/*Nav Links*/}
                <Nav className="ms-auto">
                    <Nav.Link 
                        onClick={() => navigate("/home")} 
                        style={linkStyle}
                    >
                        Home
                    </Nav.Link>
                    <Nav.Link 
                        onClick={() => navigate("/action-builder")} 
                        style={linkStyle}
                    >
                        Weapon/Spell Builder
                    </Nav.Link>

                    <Nav.Link 
                        onClick={() => navigate("/battle-calculator")} 
                        style={linkStyle}
                    >
                        Calculator
                    </Nav.Link>

                    <Nav.Link 
                        onClick={() => navigate("/character-selection")} 
                        style={linkStyle}
                    >
                        Character Select
                    </Nav.Link>
                    
                    <Nav.Link className="text-warning"
                        onClick={async () => {
                            useBattleStore.getState().resetBattle();
                            useRecapStore.getState().clearRecap();
                            await logout();
                            onLogout?.();
                            navigate("/");
                        }}
                        style={linkStyle}
                    >
                        Log Out
                    </Nav.Link>
                </Nav>
            </Container>
        </BsNavbar>
    );
}

//Shared link styling
const linkStyle = {
    color: "white",
    margin: "0 10px",
    fontWeight: "400",
    textDecoration: "none",
    transition: "color 0.2s ease",
    cursor: "pointer"
};

export default Navbar;
