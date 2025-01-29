import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with multiple fallback paths
dotenv.config();
dotenv.config({ path: '.env' });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Updated CORS configuration
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://localhost:5500',
    'https://127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.get('/chapter/:id', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.id);
        
        // Validate chapter ID
        if (isNaN(chapterId) || chapterId < 1 || chapterId > 18) {
            return res.status(400).json({ 
                error: 'Invalid chapter ID. Must be between 1 and 18.' 
            });
        }

        const response = await fetch(
            `https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapterId}/`,
            {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com',
                    'x-rapidapi-key': process.env.API_KEY,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ error: 'Failed to fetch chapter data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
});