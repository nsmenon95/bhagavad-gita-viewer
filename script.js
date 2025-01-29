let currentChapter = 1;

async function getChapter() {
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    
    // Show loader and hide any previous error
    loader.style.display = 'block';
    errorMessage.style.display = 'none';

    try {
        const response = await fetch(`https://bhagavad-gita-viewer.onrender.com/chapter/${currentChapter}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch chapter (Status: ${response.status})`);
        }

        const data = await response.json();
        
        if (!data || !data.name_translated) {
            throw new Error('Invalid data received from server');
        }

        // Update DOM elements with chapter data
        updateChapterContent(data);

        // Increment chapter number (loop back to 1 if we reach 18)
        currentChapter = currentChapter % 18 + 1;

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        loader.style.display = 'none';
    }
}

function updateChapterContent(data) {
    const elements = {
        'chapter-name': data.name_translated,
        'chapter-number': `Chapter ${data.chapter_number}`,
        'verse-count': `${data.verses_count} Verses`,
        'sanskrit-name': `${data.name_transliterated} (${data.name})`,
        'chapter-summary': data.chapter_summary || 'No summary available'
    };

    for (const [id, content] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = `Error: ${message}. Please try again.`;
    errorMessage.style.display = 'block';
    
    // Clear chapter content
    document.getElementById('chapter-name').textContent = 'Error Loading Chapter';
    document.getElementById('chapter-number').textContent = '';
    document.getElementById('verse-count').textContent = '';
    document.getElementById('sanskrit-name').textContent = '';
    document.getElementById('chapter-summary').textContent = 'Failed to load chapter content.';
}

// Load the first chapter when the page loads
document.addEventListener('DOMContentLoaded', getChapter);

// Add error handler for the loader
const loader = document.getElementById('loader');
if (loader) {
    loader.onerror = function() {
        this.style.display = 'none';
        showError('Failed to load spinner image');
    };
}