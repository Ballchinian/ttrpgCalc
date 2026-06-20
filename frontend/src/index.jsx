import React from 'react';
import ReactDOM from 'react-dom/client';
//Bootstrap 5 CSS (matches the installed bootstrap dep and react-bootstrap v2's markup). Imported
//before index.css so our body/background overrides win. Replaces the old Bootstrap 4 CDN link.
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </GoogleOAuthProvider>
);

