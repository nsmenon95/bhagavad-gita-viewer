let currentChapter = 1;

async function getChapter() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    try {
        // Call your own backend instead of RapidAPI
        const response = await fetch(`http://localhost:5000/chapter/${currentChapter}`);

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        // Update the content if data is available
        if (data && data.name_translated) {
            document.getElementById('chapter-name').textContent = data.name_translated;
            document.getElementById('chapter-number').textContent = `Chapter ${data.chapter_number}`;
            document.getElementById('verse-count').textContent = `${data.verses_count} Verses`;
            document.getElementById('sanskrit-name').textContent = `${data.name_transliterated} (${data.name})`;
            document.getElementById('chapter-summary').textContent = data.chapter_summary;
        } else {
            document.getElementById('chapter-summary').textContent = 'No data available for this chapter.';
        }

        // Increment chapter number (loop back to 1 if we reach 18)
        currentChapter = currentChapter % 18 + 1;
        loader.style.display = 'none';

    } catch (error) {
        console.error('Error details:', error);
        document.getElementById('chapter-summary').textContent = 
            `Error: ${error.message}. Please check if your API key or backend is running.`;
        loader.style.display = 'none';
    }
}

// Load the first chapter on page load
window.onload = getChapter;
