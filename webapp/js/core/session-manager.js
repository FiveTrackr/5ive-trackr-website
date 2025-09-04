/**
 * 5ive Trackr Session Manager
 * Handles authentication state and user data across all webapp pages
 * � 2025 5ive Trackr. All rights reserved.
 */

// Session Manager - handles authentication across all pages
window.FiveTrackrSession = (function() {
    let currentUser = null;
    let sessionCheckInterval = null;
    const SESSION_CHECK_INTERVAL = 300000; // Check every 5 minutes
    
    // API Configuration
    const API_CONFIG = {
        base: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8080/api'
            : 'https://five-trackr-yq6ly.ondigitalocean.app/api'
    };
    
    function getApiUrl(endpoint) {
        return `${API_CONFIG.base}${endpoint}`;
    }
    
    // Check if user is authenticated
    async function checkAuthentication() {
        // Skip server validation in file:// mode - use mock user for development
        if (window.location.protocol === 'file:') {
            console.log('Running in file:// mode, using mock authentication');
            if (!currentUser) {
                currentUser = {
                    id: 36,
                    username: 'contact@5ivetrackr.com',
                    email: 'contact@5ivetrackr.com',
                    full_name: 'Michael Bateson',
                    fullName: 'Michael Bateson',
                    role: 'league_manager',
                    user_role: 'league_manager'
                };
            }
            return currentUser;
        }
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return null;
        }
        
        try {
            const response = await fetch(getApiUrl('/auth/active-session'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.active) {
                    currentUser = result.user;
                    return result.user;
                }
            }
            
            // Token is invalid, clear it
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            return null;
        } catch (error) {
            console.error('Session check failed:', error);
            return null;
        }
    }
    
    // Redirect to login if not authenticated
    function redirectToLogin() {
        // Clear any existing session data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        currentUser = null;
        
        // Redirect to login page
        const currentPath = window.location.pathname;
        const isInPagesFolder = currentPath.includes('/pages/');
        const loginPath = isInPagesFolder ? '../../home.html' : './home.html';
        window.location.href = loginPath;
    }
    
    // Initialize session checking
    function initializeSessionChecking() {
        // Skip session checking in file:// mode
        if (window.location.protocol === 'file:') {
            console.log('Running in file:// mode, skipping periodic session validation');
            return;
        }
        
        // Clear any existing interval
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
        }
        
        // Set up periodic session validation
        sessionCheckInterval = setInterval(async () => {
            const user = await checkAuthentication();
            if (!user) {
                redirectToLogin();
            }
        }, SESSION_CHECK_INTERVAL);
    }
    
    // Get current user data
    function getCurrentUser() {
        return currentUser;
    }
    
    // Update user info displays on the page
    function updateUserInfoDisplays(user) {
        if (!user) return;
        
        // Update user name displays
        const userNameElements = document.querySelectorAll('.user-name, .username, .user-full-name, [data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = user.full_name || user.fullName || user.username;
        });
        
        // Update user email displays
        const userEmailElements = document.querySelectorAll('.user-email, [data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });
        
        // Update user role displays
        const userRoleElements = document.querySelectorAll('.user-role, [data-user-role]');
        userRoleElements.forEach(el => {
            const roleDisplayName = getRoleDisplayName(user.user_role || user.role);
            el.textContent = roleDisplayName;
        });
        
        // Update user ID displays
        const userIdElements = document.querySelectorAll('.user-id, [data-user-id]');
        userIdElements.forEach(el => {
            el.textContent = user.user_id || user.id;
        });
        
        // Update tenant information if applicable
        if (user.user_role === 'tenant_manager' || user.user_role === 'league_manager') {
            const tenantElements = document.querySelectorAll('.tenant-info, [data-tenant-info]');
            tenantElements.forEach(el => {
                el.textContent = `Tenant ID: ${user.user_id || user.id}`;
            });
        }
    }
    
    // Get user-friendly role display name
    function getRoleDisplayName(role) {
        const roleMap = {
            'admin': 'Administrator',
            'league_manager': 'League Manager',
            'tenant_manager': 'Tenant Manager',
            'assistant_manager': 'Assistant Manager',
            'referee': 'Referee',
            'team_manager': 'Team Manager',
            'team_captain': 'Team Captain',
            'venue_manager': 'Venue Manager',
            'user': 'User'
        };
        return roleMap[role] || role;
    }
    
    // Logout function
    async function logout() {
        const token = localStorage.getItem('auth_token');
        
        // Attempt to logout on server
        if (token) {
            try {
                await fetch(getApiUrl('/auth/logout'), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Server logout failed:', error);
            }
        }
        
        // Clear local session
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        currentUser = null;
        
        // Clear session checking
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
        }
        
        // Redirect to login
        redirectToLogin();
    }
    
    // Initialize session for current page
    async function initializeSession() {
        try {
            // Check if user is authenticated
            const user = await checkAuthentication();
            
            if (!user) {
                redirectToLogin();
                return false;
            }
            
            // Update user info displays
            updateUserInfoDisplays(user);
            
            // Start session checking
            initializeSessionChecking();
            
            console.log('Session initialized for user:', user.full_name || user.fullName);
            return true;
        } catch (error) {
            console.error('Session initialization failed:', error);
            redirectToLogin();
            return false;
        }
    }
    
    // Public API
    return {
        initialize: initializeSession,
        getCurrentUser: getCurrentUser,
        checkAuth: checkAuthentication,
        logout: logout,
        updateUserInfo: updateUserInfoDisplays,
        redirectToLogin: redirectToLogin,
        getApiUrl: getApiUrl
    };
})();

// Auto-initialize session when script loads (unless on login/home page)
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('home.html') || currentPath.includes('login.html') || currentPath.includes('index.html');
    
    if (!isLoginPage) {
        FiveTrackrSession.initialize();
    }
});