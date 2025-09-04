/**
 * 5ive Trackr Session Protection
 * Prevents access to protected pages when user is not logged in
 * Automatically redirects to login page if session is invalid
 */

(function() {
    'use strict';
    
    // Check if this page requires authentication
    function requiresAuthentication() {
        const path = window.location.pathname;
        const protectedPaths = [
            '/pages/league-manager/',
            '/pages/referee/',
            '/pages/team-captain/',
            '/pages/admin/'
        ];
        
        return protectedPaths.some(protectedPath => path.includes(protectedPath));
    }
    
    // Get required role for current page
    function getRequiredRole() {
        const path = window.location.pathname;
        
        if (path.includes('/pages/league-manager/')) {
            return 'league_manager';
        } else if (path.includes('/pages/referee/')) {
            return 'referee';
        } else if (path.includes('/pages/team-captain/')) {
            return 'team_captain';
        } else if (path.includes('/pages/admin/')) {
            return 'admin';
        }
        
        return null;
    }
    
    // Redirect to appropriate login page
    function redirectToLogin() {
        const currentPath = window.location.pathname;
        let loginPath = '/home.html';
        
        // Adjust path based on current location
        if (currentPath.includes('/pages/')) {
            if (currentPath.includes('/pages/league-manager/') || 
                currentPath.includes('/pages/referee/') || 
                currentPath.includes('/pages/admin/')) {
                loginPath = '../../home.html';
            } else {
                loginPath = '../home.html';
            }
        }
        
        // Use replace to prevent back button access
        window.location.replace(loginPath);
    }
    
    // Check session and redirect if necessary
    function checkSessionProtection() {
        if (!requiresAuthentication()) {
            console.log('Session protection: Page does not require authentication');
            return; // Page doesn't require authentication
        }
        
        // Wait for SessionManager to be available
        if (typeof SessionManager === 'undefined') {
            console.log('Session protection: Waiting for SessionManager...');
            setTimeout(checkSessionProtection, 100);
            return;
        }
        
        // Check if user is logged in
        const isLoggedIn = SessionManager.isLoggedIn();
        console.log('Session protection: User logged in?', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('User not logged in, redirecting to login page');
            redirectToLogin();
            return;
        }
        
        // Check if user has required role
        const requiredRole = getRequiredRole();
        const userRole = SessionManager.getUserRole();
        console.log('Session protection: Required role:', requiredRole, 'User role:', userRole);
        
        if (requiredRole && userRole !== requiredRole) {
            console.log(`User role '${userRole}' does not match required role '${requiredRole}'`);
            redirectToLogin();
            return;
        }
        
        console.log('Session protection passed');
    }
    
    // Prevent back button access after logout
    function preventBackButtonAccess() {
        // Add a state to history when page loads
        history.pushState(null, null, window.location.pathname);
        
        // Listen for popstate events (back button)
        window.addEventListener('popstate', function(event) {
            console.log('Back button pressed, checking session...');
            
            // Always push current state back to prevent actual navigation
            history.pushState(null, null, window.location.pathname);
            
            // Check if this page requires authentication
            if (requiresAuthentication()) {
                // Check if user is still logged in
                if (!SessionManager || !SessionManager.isLoggedIn()) {
                    console.log('Session invalid, redirecting to home...');
                    redirectToLogin();
                    return;
                }
                
                // Check if user has required role
                const requiredRole = getRequiredRole();
                const userRole = SessionManager.getUserRole();
                
                if (requiredRole && userRole !== requiredRole) {
                    console.log(`User role '${userRole}' does not match required role '${requiredRole}'`);
                    redirectToLogin();
                    return;
                }
            }
        });
        
        // Also listen for beforeunload to handle edge cases
        window.addEventListener('beforeunload', function(event) {
            // Clear any cached page data when leaving
            if (requiresAuthentication() && (!SessionManager || !SessionManager.isLoggedIn())) {
                // Clear browser cache for this page
                if ('caches' in window) {
                    caches.keys().then(function(names) {
                        names.forEach(function(name) {
                            caches.delete(name);
                        });
                    });
                }
            }
        });
    }
    
    // Initialize session protection
    function initializeSessionProtection() {
        checkSessionProtection();
        preventBackButtonAccess();
        setupHistoryProtection();
        
        // Recheck session every 30 seconds
        setInterval(checkSessionProtection, 30000);
    }
    
    // Setup comprehensive history protection
    function setupHistoryProtection() {
        // Create a secure history state
        const secureState = {
            secure: true,
            timestamp: Date.now(),
            page: window.location.pathname
        };
        
        // Replace current state with secure state
        history.replaceState(secureState, document.title, window.location.pathname);
        
        // Override history methods to maintain security
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(state, title, url) {
            // Always include security info in state
            const secureState = {
                ...state,
                secure: true,
                timestamp: Date.now(),
                sessionValid: SessionManager && SessionManager.isLoggedIn()
            };
            return originalPushState.call(this, secureState, title, url);
        };
        
        history.replaceState = function(state, title, url) {
            // Always include security info in state
            const secureState = {
                ...state,
                secure: true,
                timestamp: Date.now(),
                sessionValid: SessionManager && SessionManager.isLoggedIn()
            };
            return originalReplaceState.call(this, secureState, title, url);
        };
        
        // Monitor page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && requiresAuthentication()) {
                // Page became visible, recheck session
                setTimeout(checkSessionProtection, 100);
            }
        });
        
        // Monitor focus changes
        window.addEventListener('focus', function() {
            if (requiresAuthentication()) {
                // Window gained focus, recheck session
                setTimeout(checkSessionProtection, 100);
            }
        });
    }
    
    // Start protection when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSessionProtection);
    } else {
        initializeSessionProtection();
    }
    
    // Global logout event handler
    window.addEventListener('storage', function(e) {
        // Listen for session removal across tabs
        if (e.key === 'fivetrackr_session' && e.newValue === null) {
            console.log('Session removed in another tab, redirecting...');
            if (requiresAuthentication()) {
                redirectToLogin();
            }
        }
    });
    
    // Custom logout event for same-tab logout
    window.addEventListener('userLoggedOut', function() {
        console.log('User logged out event received');
        if (requiresAuthentication()) {
            redirectToLogin();
        }
    });
    
    // Make functions globally available for debugging
    window.SessionProtection = {
        checkSession: checkSessionProtection,
        redirectToLogin: redirectToLogin,
        requiresAuth: requiresAuthentication,
        getRequiredRole: getRequiredRole,
        setupHistoryProtection: setupHistoryProtection
    };
    
})();
