import { BACKEND_BASE_URL } from './config';

let accessToken = null;
//Deduplicates concurrent 401 refresh attempts, only one in-flight refresh at a time
let refreshPromise = null;

export function setToken(token) {
    accessToken = token;
}

export function getToken() {
    return accessToken;
}

export async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include"
            });
            if (!res.ok) return null;
            const data = await res.json();
            accessToken = data.accessToken;
            return accessToken;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}

export async function apiFetch(url, options = {}) {
    const makeRequest = (token) => fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
        credentials: "include"
    });

    let res = await makeRequest(accessToken);

    if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            window.location.href = "/";
            return;
        }
        res = await makeRequest(newToken);
        if (res.status === 401) {
            window.location.href = "/";
            return;
        }
    }

    return res;
}

export async function logout() {
    try {
        await fetch(`${BACKEND_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch { /* server-side failure; proceed with local cleanup */ }
    accessToken = null;
}
