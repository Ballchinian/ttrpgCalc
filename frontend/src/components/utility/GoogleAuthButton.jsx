import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { BACKEND_BASE_URL } from '../../config.js';
import { setToken } from '../../auth';

/*
    Renders Google's sign-in button. On success it sends the Google ID token (credentialResponse.credential)
    to POST /auth/google, which verifies it, finds-or-creates the user, and returns our own access token plus
    the refresh cookie - the same shape as a password login, so the rest of the app is unaffected.
    Shared by the Login and Register pages; onLogin is the app's auth handler, onError surfaces a message.
*/
function GoogleAuthButton({ onLogin, onError }) {
    const navigate = useNavigate();

    const handleCredential = async (credentialResponse) => {
        const idToken = credentialResponse?.credential;
        if (!idToken) { onError?.('Google sign-in returned no credential.'); return; }
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ credential: idToken }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setToken(data.accessToken);
                onLogin?.();
                navigate('/home');
            } else {
                onError?.(data.message || 'Google sign-in failed.');
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            onError?.('Server error, try again later');
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleCredential}
            onError={() => onError?.('Google sign-in was cancelled or failed.')}
            theme="filled_black"
            shape="pill"
            text="continue_with"
        />
    );
}

export default GoogleAuthButton;
