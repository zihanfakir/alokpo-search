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
            if (mainLogo) mainLogo.src = 'Dark%20mod.svg';
        } else {
            themeIconSun.classList.remove('hidden');
            themeIconMoon.classList.add('hidden');
            if (mainLogo) mainLogo.src = 'Ligth%20mod.svg';
        }
    }

    // IMPORTANT: Replace 'YOUR-APP-NAME' with your actual Render backend URL
    const SEARXNG_RENDER_URL = 'https://YOUR-APP-NAME.onrender.com';
    const BACKEND_URL = `https://corsproxy.io/?${encodeURIComponent(SEARXNG_RENDER_URL)}`;

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = searchInput.value.trim();
        if (!query) return;

        // Adjust UI state
        header.classList.add('searched');
        resultsContainer.innerHTML = '';
        loader.classList.remove('hidden');

        try {
            // MOCK DATA: If the user hasn't set their backend URL yet, show a preview of the UI!
            if (BACKEND_URL.includes('your-searxng-backend')) {
                // Simulate network delay for the spinner
                await new Promise(resolve => setTimeout(resolve, 800));
                
                const mockData = {
                    results: [
                        {
                            title: "Meta Search Engine UI Preview",
                            url: "https://github.com/yourusername/my-meta-search",
                            content: "This is a preview of how your search results will look! It features a clean, minimalist design with premium dark mode aesthetics and glassmorphism."
                        },
                        {
                            title: "Render - Cloud Hosting for Developers",
                            url: "https://render.com",
                            content: "Deploy your SearXNG backend here for free. Render is a unified cloud to build and run all your apps and websites with free TLS certificates."
                        },
                        {
                            title: "SearXNG: Privacy-respecting metasearch engine",
                            url: "https://docs.searxng.org",
                            content: "SearXNG is a free internet metasearch engine which aggregates results from various search services and databases. Users are neither tracked nor profiled."
                        }
                    ]
                };
                
                loader.classList.add('hidden');
                renderResults(mockData.results);
                return;
            }

            // Fetch results from SearXNG backend
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
                    <p>${error.message}</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem;">Did you configure <strong>SEARXNG_URL</strong> and <strong>CORS</strong> correctly on your Render backend?</p>
                </div>
            `;
        }
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
