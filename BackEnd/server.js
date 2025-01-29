import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config({ path: './backend/.env' }); // Ensure correct path

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/chapter/:id', async (req, res) => {
    try {
        const chapterId = req.params.id;
        const response = await fetch(`https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapterId}/`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com',
                'x-rapidapi-key': process.env.API_KEY,  // Securely use API key
                'Accept': 'application/json',
            },
        });
        

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data); // Send the response back to the frontend

    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
