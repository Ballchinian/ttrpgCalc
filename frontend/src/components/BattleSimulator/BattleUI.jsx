import { useBattleStore } from "../../store/battleStore";
import { useGameDataStore } from "../../store/gameDataStore";
import LeftPanel from "./componentsForSimulator/LeftPanel";
import CharacterSection from "./componentsForSimulator/CharacterSection";
import CharacterGrid from "./componentsForSimulator/CharacterGrid";
import ExpiringConditionsNotification from "./componentsForSimulator/ExpiringConditionsNotification";
import PersistentCheckNotification from "./componentsForSimulator/PersistentCheckNotification";

const rightPanelStyle = { paddingTop: "40px" };

function BattleSimulator() {
    const addHero = useBattleStore(state => state.addHero);
    const addFoe = useBattleStore(state => state.addFoe);
    const characterList = useGameDataStore(state => state.characterList);

    return (
        <div className="d-flex flex-row w-100 p-4">
            <ExpiringConditionsNotification />
            <PersistentCheckNotification />

            {/* Sticky left panel: round control, action selection, combat log */}
            <LeftPanel />

            {/* Right side: character grids */}
            <div className="flex-grow-1 d-flex flex-column align-items-center" style={rightPanelStyle}>

                <CharacterSection label="Heroes" buttonLabel="Add Hero" color="success" characterList={characterList} onAdd={addHero} />
                <CharacterGrid side="hero" />

                <CharacterSection label="Foes" buttonLabel="Add Foe" color="danger" characterList={characterList} onAdd={addFoe} />
                <CharacterGrid side="foe" />

            </div>
        </div>
    );
}

export default BattleSimulator;
