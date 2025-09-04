/**
 * 5ive Trackr SPA Redirect Handler
 * Handles redirects from old pages to new SPA structure
 * © 2025 5ive Trackr. All rights reserved.
 */

(function() {
    // Mapping of old page files to new SPA routes
    const PAGE_REDIRECTS = {
        'dashboard.html': 'dashboard',
        'fixtures.html': 'fixtures',
        'referees.html': 'referees',
        'divisions.html': 'divisions',
        'leagues.html': 'leagues',
        'teams.html': 'teams',
        'pitches.html': 'pitches',
        'venues.html': 'venues',
        'team-payments.html': 'team-payments',
        'settings.html': 'settings'
    };

    // Get current page filename
    function getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename;
    }

    // Check if current page should be redirected
    function shouldRedirect() {
        const currentPage = getCurrentPageName();
        return PAGE_REDIRECTS.hasOwnProperty(currentPage);
    }

    // Get redirect route for current page
    function getRedirectRoute() {
        const currentPage = getCurrentPageName();
        return PAGE_REDIRECTS[currentPage] || 'dashboard';
    }

    // Perform redirect without loading message
    function redirectToSPA() {
        const route = getRedirectRoute();
        const currentPage = getCurrentPageName();
        
        console.log(`Redirecting from ${currentPage} to SPA route: ${route}`);
        
        // Perform immediate redirect without showing second loading screen
        window.location.href = `league-manager.html#${route}`;
    }

    // Removed showRedirectMessage function - no longer needed for instant redirects

    // Check for redirect on page load
    function checkAndRedirect() {
        // Don't redirect if already on SPA page
        if (getCurrentPageName() === 'league-manager.html') {
            return;
        }
        
        // Don't redirect if already redirecting
        if (window.location.search.includes('spa-redirect=false')) {
            return;
        }
        
        // Perform redirect if needed
        if (shouldRedirect()) {
            redirectToSPA();
        }
    }

    // Initialize redirect check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndRedirect);
    } else {
        checkAndRedirect();
    }

    // Export functions for manual use
    window.SPARedirect = {
        redirectToSPA,
        shouldRedirect,
        getRedirectRoute,
        PAGE_REDIRECTS
    };
})();