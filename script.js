/* ============================================================
   VERSE COUNTS PER CHAPTER (used for date-seeded random pick)
   ============================================================ */
const CHAPTER_VERSE_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];

/* ============================================================
   STATE MANAGEMENT
   ============================================================ */
const state = {
    // Browse tab
    currentChapter: 1,
    currentVerse: 1,
    totalVerses: 0,
    verses: [],
    isLoading: false,

    // Daily tab
    dailyVerse: null,
    randomOffset: 0      // extra offset when user clicks "give me another"
};


/* ============================================================
   DOM ELEMENTS
   ============================================================ */
const el = {
    // Chapter Info
    chapterName: document.getElementById('chapter-name'),
    chapterNumber: document.getElementById('chapter-number'),
    verseCount: document.getElementById('verse-count'),
    sanskritName: document.getElementById('sanskrit-name'),
    chapterSummary: document.getElementById('chapter-summary'),

    // Verse Display
    verseContainer: document.getElementById('verse-container'),
    verseNumber: document.getElementById('verse-number'),
    verseText: document.getElementById('verse-text'),
    verseTranslit: document.getElementById('verse-translit'),
    verseMeaning: document.getElementById('verse-meaning'),

    // Navigation & Inputs
    chapterSelect: document.getElementById('chapter-select'),
    verseSelect: document.getElementById('verse-select'),
    prevChapterBtn: document.getElementById('prev-chapter-btn'),
    nextChapterBtn: document.getElementById('next-chapter-btn'),
    prevVerseBtn: document.getElementById('prev-verse-btn'),
    nextVerseBtn: document.getElementById('next-verse-btn'),

    // System (Browse)
    loader: document.getElementById('loader'),
    errorMessage: document.getElementById('error-message'),

    // Daily tab elements
    dailyDate: document.getElementById('daily-date'),
    dailyLoader: document.getElementById('daily-loader'),
    dailyError: document.getElementById('daily-error'),
    dailyCard: document.getElementById('daily-card'),
    dailyChapterBadge: document.getElementById('daily-chapter-badge'),
    dailyVerseBadge: document.getElementById('daily-verse-badge'),
    dailyChapterName: document.getElementById('daily-chapter-name'),
    dailyVerseText: document.getElementById('daily-verse-text'),
    dailyVerseTranslit: document.getElementById('daily-verse-translit'),
    dailyVerseMeaning: document.getElementById('daily-verse-meaning'),
    // Add this inside the const el object, near the other daily tab elements
    dailyVerseFullMeaning: document.getElementById('daily-full-translation'),
    verseTranslation: document.getElementById('verse-translation'),

};


/* ============================================================
   TAB SWITCHING
   ============================================================ */
function switchTab(tab) {
    const browsePanel = document.getElementById('panel-browse');
    const dailyPanel = document.getElementById('panel-daily');
    const browseBtn = document.getElementById('tab-browse');
    const dailyBtn = document.getElementById('tab-daily');

    if (tab === 'browse') {
        browsePanel.style.display = 'flex';
        dailyPanel.style.display = 'none';
        browseBtn.classList.add('active');
        dailyBtn.classList.remove('active');
        browseBtn.setAttribute('aria-selected', 'true');
        dailyBtn.setAttribute('aria-selected', 'false');
    } else {
        browsePanel.style.display = 'none';
        dailyPanel.style.display = 'flex';
        browseBtn.classList.remove('active');
        dailyBtn.classList.add('active');
        browseBtn.setAttribute('aria-selected', 'false');
        dailyBtn.setAttribute('aria-selected', 'true');

        // Load daily verse lazily (only on first visit)
        if (!state.dailyVerse) {
            loadDailyVerse();
        }
    }
}


/* ============================================================
   NETWORK HELPERS
   ============================================================ */
async function safeFetch(endpoint) {
    const res = await fetch(`/api${endpoint}`, {
        method: 'GET',
        cache: 'no-store'
    });

    if (!res.ok) {
        let msg = `Server error: ${res.status}`;
        try {
            const j = await res.json();
            if (j.error) msg = j.error;
        } catch { }
        throw new Error(msg);
    }

    return await res.json();
}


/* ============================================================
   UI HELPERS — BROWSE TAB
   ============================================================ */
function setLoading(active) {
    state.isLoading = active;
    if (el.loader) el.loader.style.display = active ? 'block' : 'none';
    [el.prevChapterBtn, el.nextChapterBtn, el.prevVerseBtn, el.nextVerseBtn]
        .forEach(btn => { if (btn) btn.disabled = active; });
}

function showError(msg) {
    if (el.errorMessage) {
        el.errorMessage.style.display = 'block';
        el.errorMessage.textContent = `❌ ${msg}`;
    }
    console.error(msg);
}

function clearError() {
    if (el.errorMessage) el.errorMessage.style.display = 'none';
}

function renderChapterInfo(data) {
    if (el.chapterName) el.chapterName.textContent = data.name_translated;
    if (el.chapterNumber) el.chapterNumber.textContent = `Chapter ${data.chapter_number}`;
    if (el.verseCount) el.verseCount.textContent = `${data.verses_count} Verses`;
    if (el.sanskritName) el.sanskritName.textContent = `${data.name_transliterated} (${data.name})`;
    if (el.chapterSummary) el.chapterSummary.textContent = data.chapter_summary;
    if (el.chapterSelect) el.chapterSelect.value = data.chapter_number;
}

function renderVerse(verse) {
    if (!verse) return;

    if (el.verseContainer) el.verseContainer.style.display = 'flex';

    // Verse
    if (el.verseNumber) el.verseNumber.textContent = `Verse ${verse.chapter_number}.${verse.verse_number}`;
    if (el.verseText) el.verseText.textContent = verse.text;
    if (el.verseTranslit) el.verseTranslit.textContent = verse.transliteration;

    // Word meanings
    if (el.verseMeaning) el.verseMeaning.textContent = verse.word_meanings || "—";

    // Full translation (NEW)
    let englishMeaning = "Translation not available.";

    if (Array.isArray(verse.translations)) {
        // Find the best English translation (often author 'Swami Sivananda' or similar is good)
        const eng = verse.translations.find(t =>
            t.language && t.language.toLowerCase() === "english"
        );
        if (eng && eng.description) englishMeaning = eng.description;
    }

    if (el.verseTranslation) {
        el.verseTranslation.textContent = englishMeaning;
    }


    // dropdown sync
    if (el.verseSelect) el.verseSelect.value = verse.verse_number;
}


function populateChapterDropdown(chapters) {
    if (!el.chapterSelect) return;
    el.chapterSelect.innerHTML = '';
    chapters.forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.chapter_number;
        opt.textContent = `Ch ${ch.chapter_number}: ${ch.name_translated}`;
        el.chapterSelect.appendChild(opt);
    });
}

function populateVerseDropdown(count) {
    if (!el.verseSelect) return;
    el.verseSelect.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Verse ${i}`;
        el.verseSelect.appendChild(opt);
    }
}


/* ============================================================
   CORE LOGIC — BROWSE TAB
   ============================================================ */
async function loadChapter(chapterId) {
    if (state.isLoading) return;
    setLoading(true);
    clearError();

    try {
        const [chapterData, versesData] = await Promise.all([
            safeFetch(`/chapter/${chapterId}`),
            safeFetch(`/chapter/${chapterId}/verses`)
        ]);

        state.currentChapter = chapterId;
        state.currentVerse = 1;
        state.verses = versesData;
        state.totalVerses = chapterData.verses_count;

        renderChapterInfo(chapterData);
        populateVerseDropdown(state.totalVerses);

        const firstVerse = state.verses.find(v => v.verse_number === 1);
        if (firstVerse) renderVerse(firstVerse);

    } catch (err) {
        showError(err.message);
    } finally {
        setLoading(false);
    }

    if (el.prevVerseBtn) el.prevVerseBtn.disabled = true;
    if (el.nextVerseBtn) el.nextVerseBtn.disabled = state.totalVerses <= 1;
}

async function loadVerse(verseId) {
    // Instant load from cache
    const cached = state.verses.find(v => Number(v.verse_number) === Number(verseId));
    if (cached) {
        state.currentVerse = verseId;
        renderVerse(cached);
        updateVerseNavButtons();
        return;
    }

    // Fallback: fetch individually
    setLoading(true);
    try {
        const data = await safeFetch(`/chapter/${state.currentChapter}/verse/${verseId}`);
        state.currentVerse = verseId;
        renderVerse(data);
        updateVerseNavButtons();
    } catch (err) {
        showError(err.message);
    } finally {
        setLoading(false);
    }
}

function updateVerseNavButtons() {
    if (el.prevVerseBtn) el.prevVerseBtn.disabled = state.currentVerse <= 1;
    if (el.nextVerseBtn) el.nextVerseBtn.disabled = state.currentVerse >= state.totalVerses;
}


/* ============================================================
   VERSE OF THE DAY LOGIC
   ============================================================ */

/**
 * Creates a deterministic seed from today's date (YYYYMMDD).
 * Adding randomOffset lets "give me another" shift the result.
 */
function getDailyPick(offset = 0) {
    const now = new Date();
    const seed = parseInt(
        `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    ) + offset;

    // Total verses across all chapters = sum of CHAPTER_VERSE_COUNTS
    const totalVerses = CHAPTER_VERSE_COUNTS.reduce((a, b) => a + b, 0);
    const pick = seed % totalVerses;   // 0-based global verse index

    // Map global index back to (chapter, verse)
    let cumulative = 0;
    for (let c = 0; c < CHAPTER_VERSE_COUNTS.length; c++) {
        if (pick < cumulative + CHAPTER_VERSE_COUNTS[c]) {
            return { chapter: c + 1, verse: pick - cumulative + 1 };
        }
        cumulative += CHAPTER_VERSE_COUNTS[c];
    }
    return { chapter: 1, verse: 1 };
}

function formatDateDisplay() {
    return new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function setDailyLoading(active) {
    if (el.dailyLoader) el.dailyLoader.style.display = active ? 'block' : 'none';
    if (el.dailyCard) el.dailyCard.style.display = active ? 'none' : 'flex';
}

function showDailyError(msg) {
    if (el.dailyError) {
        el.dailyError.style.display = 'block';
        el.dailyError.textContent = `❌ ${msg}`;
    }
}

function clearDailyError() {
    if (el.dailyError) el.dailyError.style.display = 'none';
}

async function loadDailyVerse(offset = 0) {
    clearDailyError();
    setDailyLoading(true);

    if (el.dailyDate) el.dailyDate.textContent = formatDateDisplay();

    const { chapter, verse } = getDailyPick(offset);

    try {
        const [chapterData, verseData] = await Promise.all([
            safeFetch(`/chapter/${chapter}`),
            safeFetch(`/chapter/${chapter}/verse/${verse}`)
        ]);

        state.dailyVerse = { chapter, verse, chapterData, verseData };

        // Render
        if (el.dailyChapterBadge) el.dailyChapterBadge.textContent = `Chapter ${chapter}`;
        if (el.dailyVerseBadge) el.dailyVerseBadge.textContent = `Verse ${verse}`;
        if (el.dailyChapterName) el.dailyChapterName.textContent =
            `${chapterData.name_translated} · ${chapterData.name_transliterated}`;
        if (el.dailyVerseText) el.dailyVerseText.textContent = verseData.text;
        if (el.dailyVerseTranslit) el.dailyVerseTranslit.textContent = verseData.transliteration;
        // Render Full Meaning
        let englishMeaning = "Translation currently unavailable.";
        if (Array.isArray(verseData.translations)) {
            const eng = verseData.translations.find(t =>
                t.language && t.language.toLowerCase() === "english"
            );
            if (eng && eng.description) englishMeaning = eng.description;
        }

        if (el.dailyVerseFullMeaning) el.dailyVerseFullMeaning.textContent = englishMeaning;
        if (el.dailyVerseMeaning) el.dailyVerseMeaning.textContent = verseData.word_meanings || "—";
        if (el.dailyCard) el.dailyCard.style.display = 'flex';

    } catch (err) {
        showDailyError("Could not load today's verse. Please try again.");
        console.error(err);
    } finally {
        setDailyLoading(false);
    }
}

/** Called by "Give me another verse" button */
function loadNewRandomVerse() {
    state.dailyVerse = null;                   // force re-render
    state.randomOffset += 1000;                // shift the day's pick
    loadDailyVerse(state.randomOffset);
}

/** Called by "Share this verse" button */
function shareVerse() {
    if (!state.dailyVerse) return;

    const { chapter, verse } = state.dailyVerse;
    const text = `📖 Bhagavad Gita ${chapter}.${verse}\n\n`
        + `${state.dailyVerse.verseData.text}\n\n`
        + `— Read it at ${window.location.href}`;

    if (navigator.share) {
        navigator.share({ title: 'Bhagavad Gita Verse of the Day', text }).catch(() => { });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('share-btn');
            if (btn) {
                btn.textContent = '✅ Copied!';
                setTimeout(() => { btn.textContent = '🔗 Share this verse'; }, 2000);
            }
        });
    }
}


/* ============================================================
   BROWSE TAB — INIT
   ============================================================ */
async function init() {
    try {
        const chapters = await safeFetch('/chapters');
        populateChapterDropdown(chapters);
        await loadChapter(1);
    } catch (err) {
        showError('Failed to connect to backend. Please check your connection.');
    }
}


/* ============================================================
   EVENT LISTENERS — BROWSE TAB
   ============================================================ */
el.prevChapterBtn?.addEventListener('click', () => {
    if (state.currentChapter > 1) loadChapter(state.currentChapter - 1);
});
el.nextChapterBtn?.addEventListener('click', () => {
    if (state.currentChapter < 18) loadChapter(state.currentChapter + 1);
});
el.chapterSelect?.addEventListener('change', e => {
    loadChapter(parseInt(e.target.value));
});

el.prevVerseBtn?.addEventListener('click', () => {
    if (state.currentVerse > 1) loadVerse(state.currentVerse - 1);
});
el.nextVerseBtn?.addEventListener('click', () => {
    if (state.currentVerse < state.totalVerses) loadVerse(state.currentVerse + 1);
});
el.verseSelect?.addEventListener('change', e => {
    loadVerse(parseInt(e.target.value));
});


/* ============================================================
   START
   ============================================================ */
window.addEventListener('load', init);