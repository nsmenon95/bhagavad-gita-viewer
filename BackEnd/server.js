import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Updated CORS configuration for GitHub Pages
app.use(cors({
    origin: '*', // Allow all origins temporarily for debugging
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable pre-flight requests for all routes
app.options('*', cors());

// Add custom headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.get('/chapter/:id', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.id);
        
        if (isNaN(chapterId) || chapterId < 1 || chapterId > 18) {
            return res.status(400).json({ 
                error: 'Invalid chapter ID. Must be between 1 and 18.' 
            });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch(
            `https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapterId}/`,
            {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com',
                    'x-rapidapi-key': apiKey,
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
        res.status(500).json({ 
            error: 'Failed to fetch chapter data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
});