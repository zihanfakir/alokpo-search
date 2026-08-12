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
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateTheme(currentTheme);
    });

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

    // IMPORTANT: Replace 'YOUR-APP-NAME' with your actual Render backend URL
    const SEARXNG_RENDER_URL = 'https://YOUR-APP-NAME.onrender.com';
    const BACKEND_URL = `https://corsproxy.io/?${encodeURIComponent(SEARXNG_RENDER_URL)}`;
    
    // Suggestions Logic
    const suggestionsBox = document.getElementById('suggestionsBox');
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);
        
        if (query.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                // Fetching from Google Suggest API via corsproxy for accurate Google autocomplete
                const res = await fetch(`https://corsproxy.io/?https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                const suggestions = data[1];
                
                if (suggestions.length > 0) {
                    renderSuggestions(suggestions);
                } else {
                    suggestionsBox.classList.add('hidden');
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
                // Fallback mock suggestions for demo purposes
                if (query.toLowerCase() === 'apple') {
                     renderSuggestions(["apple", "apple gadgets", "apple id", "apple coverage", "apple id create", "apple account", "apple id login", "apple gadget bd"]);
                } else {
                     suggestionsBox.classList.add('hidden');
                }
            }
        }, 300);
    });

    function renderSuggestions(suggestions) {
        suggestionsBox.innerHTML = '';
        suggestions.forEach(sug => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.innerHTML = `
                <svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>${sug}</span>
            `;
            li.addEventListener('click', () => {
                searchInput.value = sug;
                suggestionsBox.classList.add('hidden');
                searchForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            });
            suggestionsBox.appendChild(li);
        });
        suggestionsBox.classList.remove('hidden');
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target) && e.target !== suggestionsBox) {
            suggestionsBox.classList.add('hidden');
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const query = searchInput.value.trim();
        if (!query) return;

        // Redirect directly to Google
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    });

    function renderResults(results) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="result-card">
                    <p style="text-align: center; color: var(--text-muted);">No results found for your query.</p>
                </div>
            `;
            return;
        }

        // Build HTML for results
        const fragment = document.createDocumentFragment();

        results.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            // Stagger animations
            card.style.animationDelay = `${index * 0.05}s`;

            const parsedUrl = new URL(result.url);
            const displayUrl = `${parsedUrl.hostname}${parsedUrl.pathname !== '/' ? parsedUrl.pathname : ''}`;

            card.innerHTML = `
                <span class="result-url">${escapeHTML(displayUrl)}</span>
                <h3 class="result-title"><a href="${escapeHTML(result.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(result.title)}</a></h3>
                <p class="result-snippet">${escapeHTML(result.content || result.snippet || '')}</p>
            `;

            fragment.appendChild(card);
        });

        resultsContainer.appendChild(fragment);
    }

    // Basic HTML escaping to prevent XSS
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
