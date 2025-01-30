let currentChapter = 1;
const BACKEND_URL = 'https://bhagavad-gita-viewer.onrender.com';

async function getChapter() {
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    
    loader.style.display = 'block';
    errorMessage.style.display = 'none';

    try {
        const response = await fetch(`${BACKEND_URL}/chapter/${currentChapter}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors' // Explicitly set CORS mode
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Failed to fetch chapter (Status: ${response.status})`);
        }

        const data = await response.json();
        
        if (!data || !data.name_translated) {
            throw new Error('Invalid data received from server');
        }

        updateChapterContent(data);
        currentChapter = currentChapter % 18 + 1;

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        loader.style.display = 'none';
    }
}

// Rest of your functions remain the same...