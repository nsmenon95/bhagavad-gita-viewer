import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import serverless from "serverless-http";

const app = express();

/* =========================
   SIMPLE CORS
   (frontend + backend same domain on Vercel)
   ========================= */
app.use(cors());

/* =========================
   CACHE (per instance)
   ========================= */
const cache = {};

/* =========================
   RAPIDAPI FETCH
   ========================= */
async function rapidApiFetch(path) {

    if (!process.env.API_KEY)
        throw new Error("API_KEY not configured in Vercel");

    if (cache[path]) return cache[path];

    const res = await fetch(
        `https://bhagavad-gita3.p.rapidapi.com/v2${path}`,
        {
            headers: {
                "x-rapidapi-host": "bhagavad-gita3.p.rapidapi.com",
                "x-rapidapi-key": process.env.API_KEY,
                "Accept": "application/json",
            }
        }
    );

    if (!res.ok)
        throw new Error(`RapidAPI error ${res.status}`);

    const data = await res.json();
    cache[path] = data;
    return data;
}

/* =========================
   VALIDATORS
   ========================= */
const validChapter = id => {
    const n = parseInt(id);
    return n >= 1 && n <= 18 ? n : null;
};

const validVerse = id => {
    const n = parseInt(id);
    return n >= 1 ? n : null;
};

/* =========================
   ROUTES
   ========================= */

app.get("/chapters", async (req, res) => {
    try {
        res.json(await rapidApiFetch("/chapters/?skip=0&limit=18"));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/chapter/:id", async (req, res) => {
    const id = validChapter(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid chapter" });

    try {
        res.json(await rapidApiFetch(`/chapters/${id}/`));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/chapter/:id/verses", async (req, res) => {
    const id = validChapter(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid chapter" });

    try {
        res.json(await rapidApiFetch(`/chapters/${id}/verses/?skip=0&limit=100`));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/chapter/:id/verse/:verseId", async (req, res) => {
    const c = validChapter(req.params.id);
    const v = validVerse(req.params.verseId);
    if (!c || !v) return res.status(400).json({ error: "Invalid verse" });

    try {
        res.json(await rapidApiFetch(`/chapters/${c}/verses/${v}/`));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "ok", platform: "vercel" });
});

/* =========================
   EXPORT HANDLER (IMPORTANT)
   ========================= */
export default serverless(app);
