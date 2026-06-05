import { Component } from "react";
import { useBattleStore } from "../../store/battleStore";
import { useRecapStore } from "../../store/recapStore";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh", padding: "2rem" }}>
                    <h2 className="text-danger mb-3">Something went wrong</h2>
                    <p className="text-muted mb-4">{this.state.error?.message ?? "An unexpected error occurred."}</p>
                    <button className="btn btn-outline-secondary" onClick={() => {
                        useBattleStore.getState().resetBattle();
                        useRecapStore.getState().clearRecap();
                        this.setState({ hasError: false, error: null });
                    }}>
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
