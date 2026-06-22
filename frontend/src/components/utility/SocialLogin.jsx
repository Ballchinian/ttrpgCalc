import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { FaFacebookF, FaGoogle } from 'react-icons/fa';
import { BACKEND_BASE_URL } from '../../config.js';
import { setToken } from '../../auth';

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

//Matching full-width brand buttons. Colours stay on-brand (FB blue, Google red) for recognition; the
//shared shape keeps them consistent with each other.
const socialBtnBase = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '10px 12px', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600,
    fontSize: '15px', cursor: 'pointer', marginBottom: '10px',
};
const facebookStyle = { ...socialBtnBase, background: '#1877F2' };
const googleStyle = { ...socialBtnBase, background: '#DB4437' };

/*
    Custom "Login with X" buttons that drive the OAuth flows and hand the resulting token to the backend,
    which verifies it, finds-or-creates the user, and returns our own access token + refresh cookie - the
    same shape as a password login. Shared by the Login and Register pages. onLogin is the app's auth
    handler; onError surfaces a message string.
*/
function SocialLogin({ onLogin, onError }) {
    const navigate = useNavigate();

    //POSTs the provider token to our backend and, on success, completes login like a password sign-in
    const exchange = async (path, body) => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setToken(data.accessToken);
                onLogin?.();
                navigate('/home');
            } else {
                onError?.(data.message || 'Sign-in failed.');
            }
        } catch (err) {
            console.error('OAuth exchange error:', err);
            onError?.('Server error, try again later');
        }
    };

    //Google: custom button -> access-token (implicit) flow. The backend verifies the token's audience.
    const googleLogin = useGoogleLogin({
        scope: 'email profile',
        onSuccess: (tokenResponse) => exchange('/auth/google', { access_token: tokenResponse.access_token }),
        onError: () => onError?.('Google sign-in was cancelled or failed.'),
    });

    //Facebook: load the JS SDK on demand (only initialised once an App ID is configured), then FB.login.
    const loadFacebookSdk = () => new Promise((resolve, reject) => {
        if (window.FB) return resolve(window.FB);
        if (!FACEBOOK_APP_ID) return reject(new Error('Facebook sign-in is not configured yet.'));
        window.fbAsyncInit = () => {
            window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v21.0' });
            resolve(window.FB);
        };
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error('Failed to load the Facebook SDK.'));
        document.body.appendChild(script);
    });

    const handleFacebook = async () => {
        try {
            const FB = await loadFacebookSdk();
            FB.login((response) => {
                const token = response?.authResponse?.accessToken;
                if (token) exchange('/auth/facebook', { access_token: token });
                else onError?.('Facebook sign-in was cancelled.');
            }, { scope: 'public_profile,email' });
        } catch (err) {
            onError?.(err.message);
        }
    };

    return (
        <div>
            <button type="button" style={facebookStyle} onClick={handleFacebook}>
                <FaFacebookF /> Login with Facebook
            </button>
            <button type="button" style={googleStyle} onClick={() => googleLogin()}>
                <FaGoogle /> Login with Google
            </button>
        </div>
    );
}

export default SocialLogin;
