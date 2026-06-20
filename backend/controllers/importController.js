//Thin proxy: fetches a Pathbuilder 2e character export by its reference code and returns the JSON.
//Needed because pathbuilder2e.com/json.php sends no CORS headers (the browser can't fetch it
//directly) and may apply bot protection. SSRF-safe: the host is fixed and the only user-supplied
//input is a numeric code. If this is ever blocked upstream, the frontend falls back to pasting JSON.

const PATHBUILDER_URL = "https://pathbuilder2e.com/json.php";
const FETCH_TIMEOUT_MS = 8000;

export const importPathbuilder = async (req, res) => {
    const { code } = req.params;
    if (!/^\d{4,8}$/.test(code)) {
        return res.status(400).json({ message: "Invalid Pathbuilder code - it should be the number shown after exporting." });
    }
    if (typeof fetch !== "function") {
        return res.status(500).json({ message: "Server import is unavailable. Please paste the exported JSON instead." });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const upstream = await fetch(`${PATHBUILDER_URL}?id=${code}`, {
            signal: controller.signal,
            headers: {
                //A browser-like UA reduces the chance of bot protection blocking the request
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                "Accept": "application/json,text/plain,*/*",
            },
        });
        if (!upstream.ok) {
            return res.status(502).json({ message: `Pathbuilder returned ${upstream.status}. Try pasting the exported JSON instead.` });
        }
        const data = await upstream.json().catch(() => null);
        if (!data || data.success !== true || !data.build) {
            return res.status(404).json({ message: "No character found for that code. Double-check it, or paste the exported JSON instead." });
        }
        return res.json(data);
    } catch (err) {
        const aborted = err?.name === "AbortError";
        console.error("Pathbuilder import failed:", err?.message || err);
        return res.status(502).json({
            message: aborted
                ? "Pathbuilder timed out. Try pasting the exported JSON instead."
                : "Couldn't reach Pathbuilder. Try pasting the exported JSON instead.",
        });
    } finally {
        clearTimeout(timer);
    }
};
