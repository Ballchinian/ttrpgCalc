import { useEffect } from 'react';
import Navbar from './Navbar';
import { useGameDataStore } from '../../store/gameDataStore';
import { useBattleStore } from '../../store/battleStore';

function Layout({ children, onLogout }) {
    const fetchGameData = useGameDataStore(state => state.fetchGameData);
    const fetchError = useGameDataStore(state => state.fetchError);

    //Fetch once; skip if a fetch is already in flight or data is already loaded
    //After fetch, sync persisted party snapshots with fresh DB stats (picks up CharacterDesign edits)
    useEffect(() => {
        const { loading: isLoading, damageTypes } = useGameDataStore.getState();
        if (!isLoading && damageTypes.length === 0) {
            fetchGameData().then(() => {
                const { characterList } = useGameDataStore.getState();
                useBattleStore.getState().syncPartyStats(characterList);
            });
        }
    }, []);

    return (
        <>
            <Navbar onLogout={onLogout} />
            {fetchError && <div className="alert alert-danger m-2">{fetchError}</div>}
            <div style={{ padding: "20px" }}>
                {children}
            </div>
        </>
    );
}

export default Layout;
