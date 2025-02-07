let currentChapter = 1;
const BACKEND_URL = 'https://bhagavad-gita-viewer.onrender.com';

async function getChapter() {
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const nextButton = document.getElementById('next-btn'); // Select button

    // Show loader & disable button
    loader.style.display = 'block';
    errorMessage.style.display = 'none';
    nextButton.disabled = true;

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
        nextButton.disabled = false; // Re-enable button
    }
}

// Function to update chapter content on the webpage
function updateChapterContent(data) {
    document.getElementById('chapter-name').textContent = data.name_translated;
    document.getElementById('chapter-number').textContent = `Chapter ${data.chapter_number}`;
    document.getElementById('verse-count').textContent = `${data.verses_count} Verses`;
    document.getElementById('sanskrit-name').textContent = `${data.name_transliterated} (${data.name})`;
    document.getElementById('chapter-summary').textContent = data.chapter_summary;
}

// Function to display error messages on the webpage
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = `❌ Error: ${message}`;
    errorMessage.style.display = 'block';
}

// Load the first chapter when the page loads
window.onload = getChapter;
