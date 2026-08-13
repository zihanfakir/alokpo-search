document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const loader = document.getElementById('loader');
    const header = document.querySelector('.header');
    
    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    const themeIconSun = document.getElementById('themeIconSun');
    const themeIconMoon = document.getElementById('themeIconMoon');
    const mainLogo = document.getElementById('mainLogo');
    
    // Check local storage for theme, default to dark
    let currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        if (!document.startViewTransition) {
            switchTheme();
            return;
        }

        document.documentElement.classList.add('transition-theme');
        const transition = document.startViewTransition(switchTheme);
        
        transition.finished.finally(() => {
            document.documentElement.classList.remove('transition-theme');
        });
    });

    function switchTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateTheme(currentTheme);
    }

    function updateTheme(theme) {
        if (theme === 'dark') {
            themeIconSun.classList.add('hidden');
            themeIconMoon.classList.remove('hidden');
            if (mainLogo) mainLogo.src = '2.svg';
        } else {
            themeIconSun.classList.remove('hidden');
            themeIconMoon.classList.add('hidden');
            if (mainLogo) mainLogo.src = '1.svg';
        }
    }

    const BACKEND_URL = 'https://alokpo-backend.onrender.com';
    
    // Suggestions Logic
    const suggestionsBox = document.getElementById('suggestionsBox');
    let debounceTimer;
    let currentSuggestionIndex = -1;
    let currentSuggestions = [];
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);
        
        if (query.length === 0) {
            hideSuggestions();
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/autocompleter?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                
                let suggestions = [];
                if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                    suggestions = data[1];
                } else if (Array.isArray(data)) {
                    suggestions = data;
                }
                
                if (suggestions.length > 0) {
                    renderSuggestions(suggestions);
                } else {
                    hideSuggestions();
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
                hideSuggestions();
            }
        }, 300);
    });

    // Keyboard navigation for suggestions
    searchInput.addEventListener('keydown', (e) => {
        if (suggestionsBox.classList.contains('hidden') || currentSuggestions.length === 0) return;

        const items = suggestionsBox.querySelectorAll('.suggestion-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentSuggestionIndex = (currentSuggestionIndex + 1) % items.length;
            updateSuggestionHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentSuggestionIndex = (currentSuggestionIndex - 1 + items.length) % items.length;
            updateSuggestionHighlight(items);
        } else if (e.key === 'Enter' && currentSuggestionIndex >= 0) {
            e.preventDefault();
            const selectedText = currentSuggestions[currentSuggestionIndex];
            searchInput.value = selectedText;
            hideSuggestions();
            performSearch(selectedText);
        }
    });

    function updateSuggestionHighlight(items) {
        items.forEach((item, index) => {
            if (index === currentSuggestionIndex) {
                item.style.background = 'rgba(100, 100, 100, 0.2)'; // highlight color
                // ensure it's scrolled into view
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.style.background = 'transparent';
            }
        });
    }

    function renderSuggestions(suggestions) {
        currentSuggestions = suggestions;
        currentSuggestionIndex = -1;
        suggestionsBox.innerHTML = '';
        
        suggestions.forEach((sug, index) => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.innerHTML = `
                <svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>${escapeHTML(sug)}</span>
            `;
            
            li.addEventListener('mouseenter', () => {
                currentSuggestionIndex = index;
                updateSuggestionHighlight(suggestionsBox.querySelectorAll('.suggestion-item'));
            });
            
            li.addEventListener('click', () => {
                searchInput.value = sug;
                hideSuggestions();
                performSearch(sug);
            });
            suggestionsBox.appendChild(li);
        });
        suggestionsBox.classList.remove('hidden');
    }

    function hideSuggestions() {
        suggestionsBox.classList.add('hidden');
        currentSuggestions = [];
        currentSuggestionIndex = -1;
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target) && e.target !== suggestionsBox) {
            hideSuggestions();
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) performSearch(query);
    });

    async function performSearch(query) {
        // Adjust UI state for full-page layout
        document.body.classList.add('searched');
        resultsContainer.innerHTML = '';
        loader.classList.remove('hidden');

        try {
            const response = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}&format=json`);
            
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}. Please check CORS settings on your Render backend.`);
            }

            const data = await response.json();
            loader.classList.add('hidden');
            renderResults(data.results);

        } catch (error) {
            loader.classList.add('hidden');
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Oops! Something went wrong.</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
        }
    }

    function renderResults(results) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="result-card">
                    <p style="text-align: center; color: var(--text-muted);">No results found for your query.</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        results.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.animationDelay = `${index * 0.05}s`;

            try {
                const parsedUrl = new URL(result.url);
                const displayUrl = `${parsedUrl.hostname}${parsedUrl.pathname !== '/' ? parsedUrl.pathname : ''}`;
                const domain = parsedUrl.hostname;
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                card.innerHTML = `
                    <div class="result-header">
                        <img src="${faviconUrl}" alt="${escapeHTML(domain)} favicon" class="result-favicon" onerror="this.style.display='none'">
                        <span class="result-url">${escapeHTML(displayUrl)}</span>
                    </div>
                    <h3 class="result-title"><a href="${escapeHTML(result.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(result.title)}</a></h3>
                    <p class="result-snippet">${escapeHTML(result.content || result.snippet || '')}</p>
                `;

                fragment.appendChild(card);
            } catch (e) {
                console.warn('Invalid URL skipped:', result.url);
            }
        });

        resultsContainer.appendChild(fragment);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
