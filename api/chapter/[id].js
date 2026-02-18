export default async function handler(req, res) {
  const { id } = req.query;

  const r = await fetch(`https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${id}/`, {
    headers: {
      "x-rapidapi-host": "bhagavad-gita3.p.rapidapi.com",
      "x-rapidapi-key": process.env.API_KEY
    }
  });

  const data = await r.json();
  res.status(200).json(data);
}
