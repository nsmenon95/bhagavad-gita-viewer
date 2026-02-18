export default async function handler(req, res) {
  const r = await fetch("https://bhagavad-gita3.p.rapidapi.com/v2/chapters/?skip=0&limit=18", {
    headers: {
      "x-rapidapi-host": "bhagavad-gita3.p.rapidapi.com",
      "x-rapidapi-key": process.env.API_KEY
    }
  });

  const data = await r.json();
  res.status(200).json(data);
}
