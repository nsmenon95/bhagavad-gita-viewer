export default async function handler(req, res) {
    try {
        const r = await fetch("https://bhagavad-gita3.p.rapidapi.com/v2/chapters/?skip=0&limit=18", {
            headers: {
                "x-rapidapi-host": "bhagavad-gita3.p.rapidapi.com",
                "x-rapidapi-key": process.env.API_KEY
            }
        });

        if (!r.ok) {
            return res.status(r.status).json({ error: `Upstream API error: ${r.status}` });
        }

        const data = await r.json();
        res.status(200).json(data);

    } catch (err) {
        console.error("[/api/chapters]", err);
        res.status(500).json({ error: "Failed to fetch chapters." });
    }
}
