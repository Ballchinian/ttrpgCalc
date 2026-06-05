import './actionBuilder.css';
import { useNavigate } from 'react-router-dom';

const CONTAINER_STYLE = { marginTop: "8vh" };
const BTN_STYLE = { width: "200px" };

function ActionBuilder() {
    const navigate = useNavigate();
    return (
        <div className="container d-flex align-items-center justify-content-center" style={CONTAINER_STYLE}>
            <div className="row w-100">
                <div className="col text-center">
                    <h4>Please choose below what you would like to make</h4>

                    <div className="mt-4">
                        <button onClick={() => navigate('/action-builder/weapon')} className="btn btn-success m-2" style={BTN_STYLE}>Weapon</button>
                        <button onClick={() => navigate('/action-builder/spell')} className="btn btn-success m-2" style={BTN_STYLE}>Spell</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActionBuilder;
