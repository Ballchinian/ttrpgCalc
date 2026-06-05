import { useGameDataStore } from "../../store/gameDataStore";
import BattleSimulator from "./BattleUI";

const loadingStyle = { padding: "20px", color: "white" };
const errorStyle = { padding: "20px", color: "#e05555" };
const retryStyle = { marginLeft: "10px" };

//Layout parent fetches game data; this component guards rendering until it's ready.
function BattleManager() {
    const fetchGameData = useGameDataStore(state => state.fetchGameData);
    const fetchError = useGameDataStore(state => state.fetchError);
    const loading = useGameDataStore(state => state.loading);

    if (loading) return <div style={loadingStyle}>Loading game data...</div>;
    if (fetchError) return (
        <div style={errorStyle}>
            {fetchError}
            <button onClick={fetchGameData} style={retryStyle}>Retry</button>
        </div>
    );

    return <BattleSimulator />;
}

export default BattleManager;
