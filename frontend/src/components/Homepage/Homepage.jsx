import calculator from '../../images/homepageImages/calculator.png';
import sword from '../../images/homepageImages/sword.png';
import shield from '../../images/homepageImages/shield.png';
import Card from 'react-bootstrap/Card';
import { NavLink } from 'react-router-dom';

import './Homepage.css';

function Homepage() {
    return <div>
        <div className="d-flex justify-content-center align-items-center">
            <h1 className="text-center mt-5">Welcome to the Pathfinder 2e Calculator</h1>
        </div>
        
        <p className="text-center mt-5">This is a simple calculator for tabletop players using pathfinder as a basis</p>

  
        <div id="mainLinks" style={{margin:"8vh 80px"}} className="justify-content-around d-flex">
            <NavLink to="/action-builder">
                <Card>
                    <Card.Img variant="top" src={sword} />
                    <Card.Body>
                        <Card.Title>Action Builder</Card.Title>
                        <Card.Text>
                            Build and customize your own weapons/spells for your characters.
                        </Card.Text>
                    </Card.Body>
                </Card>
            </NavLink>

            <NavLink to="/battle-calculator">
                <Card>
                    <Card.Img variant="top" src={calculator} />
                    <Card.Body>   
                        <Card.Title>Battle Calculator</Card.Title>
                        <Card.Text>Calculate your attack rolls, damage rolls, and more.</Card.Text>
                    </Card.Body>
                </Card>
            </NavLink>

            <NavLink to="/character-selection">
                <Card>
                    <Card.Img className="w-10 h-10"variant="top" src={shield} />
                    <Card.Body>
                        <Card.Title>Character Builder</Card.Title>
                        <Card.Text>Build and customize your own characters for your campaigns.</Card.Text>
                    </Card.Body>
                </Card>
            </NavLink>
        </div>
    </div>
}

export default Homepage;