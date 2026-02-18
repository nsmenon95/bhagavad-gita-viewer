/* ============================================================
   STATE MANAGEMENT
   ============================================================ */
const state = {
    currentChapter: 1,
    currentVerse: 1,
    totalVerses: 0,
    verses: [],   // Cache verses for the current chapter
    isLoading: false
};


/* ============================================================
   DOM ELEMENTS
   Make sure your HTML IDs match these!
   ============================================================ */
const el = {
    // Chapter Info
    chapterName:    document.getElementById('chapter-name'),
    chapterNumber:  document.getElementById('chapter-number'),
    verseCount:     document.getElementById('verse-count'),
    sanskritName:   document.getElementById('sanskrit-name'),
    chapterSummary: document.getElementById('chapter-summary'),

    // Verse Display
    verseContainer: document.getElementById('verse-container'),
    verseNumber:    document.getElementById('verse-number'),
    verseText:      document.getElementById('verse-text'),
    verseTranslit:  document.getElementById('verse-translit'),
    verseMeaning:   document.getElementById('verse-meaning'),

    // Navigation & Inputs
    chapterSelect:  document.getElementById('chapter-select'),
    verseSelect:    document.getElementById('verse-select'),
    prevChapterBtn: document.getElementById('prev-chapter-btn'),
    nextChapterBtn: document.getElementById('next-chapter-btn'),
    prevVerseBtn:   document.getElementById('prev-verse-btn'),
    nextVerseBtn:   document.getElementById('next-verse-btn'),

    // System
    loader:         document.getElementById('loader'),
    errorMessage:   document.getElementById('error-message')
};


/* ============================================================
   NETWORK HELPERS
   ============================================================ */
async function safeFetch(endpoint) {
    try {
        const res = await fetch(`/api${endpoint}`, {
            method: 'GET',
            cache: "no-store"
        });

        if (!res.ok) {
            let msg = `Server error: ${res.status}`;
            try {
                const j = await res.json();
                if (j.error) msg = j.error;
            } catch {}
            throw new Error(msg);
        }

        return await res.json();

    } catch (err) {
        throw err;
    }
}




/* ============================================================
   UI UPDATES
   ============================================================ */
function setLoading(active) {
    state.isLoading = active;
    if(el.loader) el.loader.style.display = active ? 'block' : 'none';
    
    // Disable buttons while loading
    const buttons = [el.prevChapterBtn, el.nextChapterBtn, el.prevVerseBtn, el.nextVerseBtn];
    buttons.forEach(btn => { if(btn) btn.disabled = active; });
}

function showError(msg) {
    if(el.errorMessage) {
        el.errorMessage.style.display = 'block';
        el.errorMessage.textContent = `❌ ${msg}`;
    }
    console.error(msg);
}

function clearError() {
    if(el.errorMessage) el.errorMessage.style.display = 'none';
}

function renderChapterInfo(data) {
    if(el.chapterName) el.chapterName.textContent = data.name_translated;
    if(el.chapterNumber) el.chapterNumber.textContent = `Chapter ${data.chapter_number}`;
    if(el.verseCount) el.verseCount.textContent = `${data.verses_count} Verses`;
    if(el.sanskritName) el.sanskritName.textContent = `${data.name_transliterated} (${data.name})`;
    if(el.chapterSummary) el.chapterSummary.textContent = data.chapter_summary;

    // Update Dropdown
    if(el.chapterSelect) el.chapterSelect.value = data.chapter_number;
}

function renderVerse(verse) {
    if(!verse) return;

    if(el.verseContainer) el.verseContainer.style.display = 'block';
    
    if(el.verseNumber) el.verseNumber.textContent = `Verse ${verse.chapter_number}.${verse.verse_number}`;
    if(el.verseText) el.verseText.textContent = verse.text;
    if(el.verseTranslit) el.verseTranslit.textContent = verse.transliteration;
    if(el.verseMeaning) el.verseMeaning.textContent = verse.word_meanings;

    // Update Dropdown
    if(el.verseSelect) el.verseSelect.value = verse.verse_number;
}

function populateChapterDropdown(chapters) {
    if(!el.chapterSelect) return;
    el.chapterSelect.innerHTML = '';
    
    chapters.forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.chapter_number;
        opt.textContent = `Ch ${ch.chapter_number}: ${ch.name_translated}`;
        el.chapterSelect.appendChild(opt);
    });
}

function populateVerseDropdown(count) {
    if(!el.verseSelect) return;
    el.verseSelect.innerHTML = '';
    
    for(let i=1; i<=count; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Verse ${i}`;
        el.verseSelect.appendChild(opt);
    }
}


/* ============================================================
   CORE LOGIC
   ============================================================ */
async function loadChapter(chapterId) {
    if (state.isLoading) return;
    setLoading(true);
    clearError();

    try {
        // Parallel Fetch: Get Chapter Details AND All Verses
        const [chapterData, versesData] = await Promise.all([
            safeFetch(`/chapter/${chapterId}`),
            safeFetch(`/chapter/${chapterId}/verses`)
        ]);

        // Update State
        state.currentChapter = chapterId;
        state.currentVerse = 1;
        state.verses = versesData; 
        state.totalVerses = chapterData.verses_count;

        // Render
        renderChapterInfo(chapterData);
        populateVerseDropdown(state.totalVerses);
        
        // Show first verse immediately from the list
        if(state.verses.length > 0) {
            renderVerse(state.verses[0]);
        }

    } catch (err) {
        showError(err.message);
    } finally {
        setLoading(false);
    }
}

async function loadVerse(verseId) {
    // 1. Try to find in local state first (Instant load)
    const cachedVerse = state.verses.find(v => v.verse_number === verseId);
    
    if (cachedVerse) {
        state.currentVerse = verseId;
        renderVerse(cachedVerse);
        return;
    }

    // 2. Fallback: Fetch from API if not in list (Rare case)
    setLoading(true);
    try {
        const data = await safeFetch(`/chapter/${state.currentChapter}/verse/${verseId}`);
        state.currentVerse = verseId;
        renderVerse(data);
    } catch (err) {
        showError(err.message);
    } finally {
        setLoading(false);
    }
}

async function init() {
    try {
        // Load list of chapters for dropdown
        const chapters = await safeFetch('/chapters');
        populateChapterDropdown(chapters);

        // Load Chapter 1
        await loadChapter(1);
    } catch (err) {
        showError("Failed to connect to backend. Please check connection.");
    }
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

// Chapter Navigation
el.prevChapterBtn?.addEventListener('click', () => {
    if(state.currentChapter > 1) loadChapter(state.currentChapter - 1);
});
el.nextChapterBtn?.addEventListener('click', () => {
    if(state.currentChapter < 18) loadChapter(state.currentChapter + 1);
});
el.chapterSelect?.addEventListener('change', (e) => {
    loadChapter(parseInt(e.target.value));
});

// Verse Navigation
el.prevVerseBtn?.addEventListener('click', () => {
    if(state.currentVerse > 1) loadVerse(state.currentVerse - 1);
});
el.nextVerseBtn?.addEventListener('click', () => {
    if(state.currentVerse < state.totalVerses) loadVerse(state.currentVerse + 1);
});
el.verseSelect?.addEventListener('change', (e) => {
    loadVerse(parseInt(e.target.value));
});


// Start App
window.addEventListener('load', init);