import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { refreshAccessToken } from './auth';
import { useBattleStore } from './store/battleStore';
import { useRecapStore } from './store/recapStore';
import ErrorBoundary from './components/utility/ErrorBoundary.jsx';
import Layout from './components/Navbar/Layout';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage.jsx';
import ResetPassword from './components/ResetPassword/ResetPassword.jsx';
import Homepage from './components/Homepage/Homepage';
import ActionBuilder from './components/ActionBuilder/actionBuilder';
import SpellBuilder from './components/ActionBuilder/SpellBuilder/SpellBuilder.jsx';
import WeaponBuilder from './components/ActionBuilder/WeaponBuilder/WeaponBuilder.jsx';
import CharacterSelection from './components/CharacterSelection/CharacterSelection';
import CharacterDesign from './components/CharacterDesign/CharacterDesign';
import BattleCalculator from './components/BattleCalculator/BattleCalculator';
import BattleManager from './components/BattleSimulator/BattleManager';

//Redirects unauthenticated users to login instead of showing a broken UI
function ProtectedRoute({ authed, children }) {
    if (!authed) return <Navigate to="/" replace />;
    return children;
}

function App() {
    //ready: blocks render until the initial token check resolves
    const [ready, setReady] = useState(false);
    //authed: set true when a valid refresh token is found or the user logs in
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        refreshAccessToken()
            .then(token => setAuthed(!!token))
            .catch(() => {})
            .finally(() => setReady(true));
    }, []);

    if (!ready) return null;

    const handleLogin = () => {
        useBattleStore.getState().resetBattle();
        useRecapStore.getState().clearRecap();
        setAuthed(true);
    };
    const handleLogout = () => setAuthed(false);
    const protect = (children) => <ProtectedRoute authed={authed}>{children}</ProtectedRoute>;
    const wrap = (page) => protect(<Layout onLogout={handleLogout}>{page}</Layout>);

    return (
        <BrowserRouter>
        <ErrorBoundary>
        <Routes>
            <Route path="/" element={authed ? <Navigate to="/home" replace /> : <LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={authed ? <Navigate to="/home" replace /> : <RegisterPage />} />
            <Route path="/reset-password/:token" element={authed ? <Navigate to="/home" replace /> : <ResetPassword />} />
            <Route path="/home" element={wrap(<Homepage />)} />
            <Route path="/action-builder" element={wrap(<ActionBuilder />)} />
            <Route path="/action-builder/weapon" element={wrap(<WeaponBuilder />)} />
            <Route path="/action-builder/spell" element={wrap(<SpellBuilder />)} />
            <Route path="/character-selection" element={wrap(<CharacterSelection />)} />
            <Route path="/character-selection/character-design/:characterID" element={wrap(<CharacterDesign />)} />
            <Route path="/battle-calculator" element={wrap(<BattleCalculator />)} />
            <Route path="/battle-calculator/battle-simulator" element={wrap(<BattleManager />)} />
            <Route path="*" element={<div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}><h2>404: Page not found</h2></div>} />
        </Routes>
        </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
