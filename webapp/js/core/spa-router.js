/**
 * 5ive Trackr SPA Router
 * Handles client-side routing for single page application
 * © 2025 5ive Trackr. All rights reserved.
 */

window.SPARouter = (function() {
    let currentRoute = null;
    let routes = {};
    let contentContainer = null;
    let loadingStates = new Set();

    // Route configuration
    const ROUTE_CONFIG = {
        'dashboard': {
            title: 'Dashboard',
            subtitle: 'Overview of league activities and pending actions',
            module: 'dashboard',
            icon: '📊',
            default: true
        },
        'fixtures': {
            title: 'Fixtures',
            subtitle: 'Manage match schedules and fixture assignments',
            module: 'fixtures',
            icon: '📅'
        },
        'referees': {
            title: 'Referees',
            subtitle: 'Manage referee assignments and availability',
            module: 'referees',
            icon: '🥅'
        },
        'divisions': {
            title: 'Divisions',
            subtitle: 'Organize leagues into divisions',
            module: 'divisions',
            icon: '📋'
        },
        'leagues': {
            title: 'Leagues',
            subtitle: 'Manage league structure and standings',
            module: 'leagues',
            icon: '🏆'
        },
        'teams': {
            title: 'Teams',
            subtitle: 'Manage team registrations and information',
            module: 'teams',
            icon: '👕'
        },
        'pitches': {
            title: 'Pitches',
            subtitle: 'Manage your football pitches, availability and kick-off times',
            module: 'pitches',
            icon: '⚽'
        },
        'venues': {
            title: 'Venues',
            subtitle: 'Manage your venues & subscription packages',
            module: 'venues',
            icon: '🏟️'
        },
        'team-payments': {
            title: 'Team Payments',
            subtitle: 'Track and manage team payment status',
            module: 'team-payments',
            icon: '💳'
        },
        'settings': {
            title: 'Settings',
            subtitle: 'Configure league preferences and settings',
            module: 'settings',
            icon: '⚙️'
        }
    };

    // Initialize router
    function init(containerSelector = '#app-content') {
        contentContainer = document.querySelector(containerSelector);
        if (!contentContainer) {
            console.error('SPA Router: Content container not found:', containerSelector);
            return false;
        }

        // Set up event listeners
        window.addEventListener('hashchange', handleRouteChange);
        window.addEventListener('popstate', handleRouteChange);

        // Load initial route
        handleRouteChange();
        
        // Set up periodic header title check (in case DOM updates after initialization)
        setInterval(() => {
            if (currentRoute && document.querySelector('[data-page-title]')) {
                // Ensure subtitle element exists
                if (!document.querySelector('[data-page-subtitle]')) {
                    const headerLeft = document.querySelector('.header-left');
                    if (headerLeft) {
                        const subtitle = document.createElement('span');
                        subtitle.className = 'page-subtitle-header';
                        subtitle.setAttribute('data-page-subtitle', '');
                        headerLeft.appendChild(subtitle);
                    }
                }
                updatePageTitle(currentRoute);
            }
        }, 2000);
        
        console.log('SPA Router initialized successfully');
        return true;
    }

    // Handle route changes
    function handleRouteChange(event) {
        const hash = window.location.hash.slice(1) || getDefaultRoute();
        console.log('Route change to:', hash);
        
        if (hash !== currentRoute) {
            navigateTo(hash, false); // false = don't update history
        }
    }

    // Get default route
    function getDefaultRoute() {
        for (const [route, config] of Object.entries(ROUTE_CONFIG)) {
            if (config.default) return route;
        }
        return 'dashboard'; // fallback
    }

    // Navigate to a route
    async function navigateTo(route, updateHistory = true) {
        if (!ROUTE_CONFIG[route]) {
            console.error('Unknown route:', route);
            route = getDefaultRoute();
        }

        // Prevent navigation if already loading
        if (loadingStates.has(route)) {
            console.log('Route already loading:', route);
            return;
        }

        // Show loading state
        showLoading();
        loadingStates.add(route);

        try {
            // Update browser history
            if (updateHistory && window.location.hash.slice(1) !== route) {
                window.history.pushState(null, null, `#${route}`);
            }

            // Update current route
            currentRoute = route;
            
            // Update page title
            updatePageTitle(route);
            
            // Update navigation state
            updateNavigationState(route);
            
            // Load content
            await loadRouteContent(route);
            
            console.log('Successfully navigated to:', route);
            
        } catch (error) {
            console.error('Navigation error:', error);
            showError('Failed to load page content');
        } finally {
            loadingStates.delete(route);
            hideLoading();
        }
    }

    // Load route content
    async function loadRouteContent(route) {
        const config = ROUTE_CONFIG[route];
        
        try {
            // Try to load from module first
            if (window.SPAModules && window.SPAModules[config.module]) {
                const moduleContent = await window.SPAModules[config.module].render();
                contentContainer.innerHTML = moduleContent;
                
                // Initialize module if it has init function
                if (window.SPAModules[config.module].init) {
                    await window.SPAModules[config.module].init();
                }
            } else {
                // Fallback: load from existing page file
                await loadFromFile(route);
            }
        } catch (error) {
            console.error('Error loading route content:', error);
            throw error;
        }
    }

    // Load content from existing file (fallback)
    async function loadFromFile(route) {
        const filePath = `pages/league-manager/${route}.html`;
        
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Extract main content (excluding head, scripts, etc.)
            const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
            if (contentMatch) {
                contentContainer.innerHTML = contentMatch[1];
            } else {
                // Fallback: try to extract content area
                const contentAreaMatch = html.match(/<div[^>]*class="content-area"[^>]*>([\s\S]*?)<\/div>/i);
                if (contentAreaMatch) {
                    contentContainer.innerHTML = `<div class="content-area">${contentAreaMatch[1]}</div>`;
                } else {
                    // Last resort: use full body content
                    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    if (bodyMatch) {
                        // Extract just the main content, skip scripts and headers
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = bodyMatch[1];
                        const mainContent = tempDiv.querySelector('main') || tempDiv.querySelector('.content-area');
                        contentContainer.innerHTML = mainContent ? mainContent.innerHTML : bodyMatch[1];
                    } else {
                        throw new Error('Could not extract content from file');
                    }
                }
            }
            
        } catch (error) {
            console.error('Error loading from file:', error);
            contentContainer.innerHTML = `
                <div class="error-state">
                    <h2>Error Loading Content</h2>
                    <p>Failed to load ${route} content. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    // Update page title
    function updatePageTitle(route) {
        const config = ROUTE_CONFIG[route];
        document.title = `${config.title} - League Manager - 5ive Trackr`;
        
        // Update header title if present - try multiple selectors
        const headerTitleSelectors = [
            '[data-page-title]',
            '.page-title',
            '.main-header .page-title',
            '#header-container .page-title'
        ];
        
        for (const selector of headerTitleSelectors) {
            const headerTitle = document.querySelector(selector);
            if (headerTitle) {
                headerTitle.textContent = config.title;
                break;
            }
        }
        
        // Update header subtitle if present
        const headerSubtitle = document.querySelector('[data-page-subtitle]');
        if (headerSubtitle) {
            if (config.subtitle) {
                headerSubtitle.textContent = config.subtitle;
                headerSubtitle.style.display = 'block';
            } else {
                headerSubtitle.textContent = '';
                headerSubtitle.style.display = 'none';
            }
        }
        
        // Also update any content titles that might exist in the loaded module
        // This will be updated when the module renders, so we don't need to force it here
        // But we'll keep this for any static titles that might exist
        setTimeout(() => {
            const contentTitleElements = document.querySelectorAll('.content-title, .page-title-section h1');
            contentTitleElements.forEach(element => {
                if (element && (element.textContent.includes('Dashboard') || element.textContent.includes('League Manager'))) {
                    element.textContent = config.title;
                }
            });
        }, 100);
    }

    // Update navigation state
    function updateNavigationState(route) {
        // Update sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            const page = item.dataset.page;
            if (page === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update navigation links to use SPA routing
        document.querySelectorAll('.nav-link').forEach(link => {
            const page = link.closest('.nav-item')?.dataset.page;
            if (page && ROUTE_CONFIG[page]) {
                link.href = `#${page}`;
                link.onclick = (e) => {
                    e.preventDefault();
                    navigateTo(page);
                    return false;
                };
            }
        });
    }

    // Show loading state
    function showLoading() {
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
    }

    // Hide loading state
    function hideLoading() {
        // Loading state will be replaced by actual content
    }

    // Show error state
    function showError(message) {
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="error-state">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }

    // Get current route
    function getCurrentRoute() {
        return currentRoute;
    }

    // Get route config
    function getRouteConfig(route) {
        return ROUTE_CONFIG[route] || null;
    }

    // Get all routes
    function getAllRoutes() {
        return { ...ROUTE_CONFIG };
    }

    // Force header title update (public method)
    function forceHeaderUpdate() {
        if (currentRoute) {
            updatePageTitle(currentRoute);
            updateNavigationState(currentRoute);
        }
    }

    // Public API
    return {
        init,
        navigateTo,
        getCurrentRoute,
        getRouteConfig,
        getAllRoutes,
        forceHeaderUpdate,
        ROUTE_CONFIG
    };
})();