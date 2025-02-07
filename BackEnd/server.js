import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY; // Ensure API Key is set

if (!API_KEY) {
    console.error("❌ ERROR: API_KEY is missing in .env file");
    process.exit(1); // Stop server if API_KEY is missing
}

// ✅ CORS Configuration
app.use(cors({
    origin: '*', // Allow all origins temporarily (Can be restricted to a specific domain)
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Pre-flight requests (OPTIONS) for all routes
app.options('*', cors());

// ✅ Custom Headers (Fixes 'interest-cohort' issue)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // ✅ Fix: Prevent browser warnings for 'interest-cohort'
    res.setHeader("Permissions-Policy", ""); 
    
    next();
});

// ✅ Fetch Bhagavad Gita Chapter
app.get('/chapter/:id', async (req, res) => {
    try {
        const chapterId = parseInt(req.params.id);
        
        if (isNaN(chapterId) || chapterId < 1 || chapterId > 18) {
            return res.status(400).json({ 
                error: 'Invalid chapter ID. Must be between 1 and 18.' 
            });
        }

        console.log(`📖 Fetching Chapter ${chapterId}...`); // Debug log

        const response = await fetch(
            `https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapterId}/`,
            {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com',
                    'x-rapidapi-key': API_KEY,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error(`❌ API Error (Status: ${response.status})`);
            return res.status(response.status).json({ 
                error: `Failed to fetch chapter. Status: ${response.status}` 
            });
        }

        const data = await response.json();
        console.log(`✅ Successfully fetched Chapter ${chapterId}`); // Debug log
        res.json(data);

    } catch (error) {
        console.error('❌ Error fetching chapter:', error);
        res.status(500).json({ 
            error: 'Failed to fetch chapter data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ✅ Start the Server
app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
});
