const wordIndex = {};

// Build the search index
function buildIndex(element, parentElement = null) {
    element.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            buildIndex(node, parentElement || element);
        } else if (node.nodeType === Node.TEXT_NODE) {
            const words = node.textContent
                .trim()
                .toLowerCase()
                .split(/\W+/)
                .filter(Boolean);

            words.forEach(word => {
                if (!wordIndex[word]) {
                    wordIndex[word] = [];
                }
                if (!wordIndex[word].includes(parentElement || element)) {
                    wordIndex[word].push(parentElement || element);
                }
            });
        }
    });
}

// Initialize the search functionality
function initializeSearch() {
    const entries = Array.from(document.querySelectorAll('#dict > .entry'));
    const searchInput = document.getElementById('search');
    const noMatchMessage = document.getElementById('no-match');
    const columns = document.querySelector('.columns');
    const compoundWordsSection = document.querySelector('.compound-words');
    const toggleCompoundWords = document.getElementById('toggle-compound-words'); // Toggle switch

    // Build the index for dictionary entries
    entries.forEach(entry => buildIndex(entry));

    // Handle input events on the search field
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) { // Show all entries if no query
            noMatchMessage.style.display = 'none';
            if (columns) columns.style.display = 'grid';
            if (compoundWordsSection && toggleCompoundWords.checked) compoundWordsSection.style.display = 'block';
            entries.forEach(entry => entry.style.display = 'grid');
            return;
        }

        const regex = new RegExp(`^${query.replace(/\*/g, '.*')}`);
        const matchingWords = Object.keys(wordIndex).filter(word => regex.test(word));

        if (matchingWords.length === 0) { // No matches found
            noMatchMessage.style.display = 'block';
            if (columns) columns.style.display = 'none';
            if (compoundWordsSection && toggleCompoundWords.checked) compoundWordsSection.style.display = 'none';
            entries.forEach(entry => entry.style.display = 'none');
            return;
        }

        // Show matching entries
        noMatchMessage.style.display = 'none';
        if (columns) columns.style.display = 'grid';
        if (compoundWordsSection && toggleCompoundWords.checked) compoundWordsSection.style.display = 'grid';
        entries.forEach(entry => entry.style.display = 'none');
        matchingWords.forEach(word => {
            wordIndex[word].forEach(entry => entry.style.display = 'grid');
        });
    });

    // Toggle compound-words visibility based on the switch state
    toggleCompoundWords.addEventListener('change', () => {
        if (compoundWordsSection) {
            if (toggleCompoundWords.checked) {
                compoundWordsSection.style.display = 'grid';
            } else {
                compoundWordsSection.style.display = 'none';
            }
        }
    });
}

// Wait for the DOM to load before initializing the search
document.addEventListener('DOMContentLoaded', initializeSearch);
