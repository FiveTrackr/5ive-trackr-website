/**
 * 5ive Trackr Authentication Module
 * © 2025 5ive Trackr. All rights reserved.
 * This code is protected by copyright and is the intellectual property of 5ive Trackr.
 * Unauthorized use, reproduction, modification, distribution, or disclosure is prohibited.
 */

// API Configuration
const API_CONFIG = {
    // Use local development server when running locally, production server when deployed
    base: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8080/api'  // Local server with production database
        : 'https://five-trackr-yq6ly.ondigitalocean.app/api',  // Production server
    isLocalDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    // When local, we're using production database through local Python API
    usingProductionDB: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// Helper function to get API URL
function getApiUrl(endpoint) {
    return `${API_CONFIG.base}${endpoint}`;
}

// Self-invoking function to create a module pattern with private scope
const SessionManager = (function() {
    // Private storage for user data
    let currentUser = null;
    const sessionKey = 'fivetrackr_session';
    const usersKey = 'fivetrackr_users';
    const activeSessionKey = 'fivetrackr_active_session';
    const sessionLockKey = 'fivetrackr_session_lock';
    
    // All user authentication now handled by server - no local mock data
    
    // Server communication functions
    function saveSessionToServer(sessionData) {
        // Check if we're running on a server (not file:// protocol)
        if (window.location.protocol === 'file:') {
            console.log('Running in file mode, skipping server session save');
            return;
        }
        
        // Check session with new Python server
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch(getApiUrl('/auth/check-session'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json())
            .then(data => {
                if (data.success && data.valid) {
                    // Session validated successfully - no need to log
                } else {
                    // Session validation failed - expected during initial load
                }
            }).catch(error => {
                console.warn('Could not validate session with server:', error);
            });
        }
    }
    
    function loadSessionFromServer() {
        // Check if we're running on a server (not file:// protocol)
        if (window.location.protocol === 'file:') {
            return null;
        }
        
        // Try to validate current session with Python server
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return Promise.resolve(null);
        }
        
        return fetch(getApiUrl('/auth/check-session'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                return response.json().then(data => {
                    if (data.success && data.valid) {
                        return data.user;
                    }
                    return null;
                });
            }
            return null;
        }).catch(error => {
            console.warn('Could not load session from server, using localStorage fallback:', error);
            return null;
        });
    }
    
    function deleteSessionFromServer(sessionId) {
        // Check if we're running on a server (not file:// protocol)
        if (window.location.protocol === 'file:') {
            return;
        }
        
        // Logout from Python server
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch(getApiUrl('/auth/logout'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.warn('Could not logout from server:', error);
            });
        }
    }
    
    // Update user activity timestamp
    function updateActivity() {
        if (currentUser) {
            currentUser.lastActivity = new Date().toISOString();
            localStorage.setItem(sessionKey, JSON.stringify(currentUser));
            
            // Update server session if available
            saveSessionToServer(currentUser);
        }
    }
    
    // Check for session timeout and handle automatic logout
    function checkSessionTimeout() {
        if (!currentUser) {
            // No user session to check
            return true;
        }
        
        // Only check if we're on a page that requires authentication
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('home.html') || currentPath.includes('login.html');
        
        if (isLoginPage) {
            // Don't run timeout checks on login pages
            return true;
        }
        
        const sessionValid = isSessionValid();
        if (!sessionValid) {
            console.warn('🚨 Session timeout detected - logging out user');
            console.log('Session details:', {
                user: currentUser?.username,
                expires: currentUser?.sessionExpires,
                lastActivity: currentUser?.lastActivity,
                currentTime: new Date().toISOString()
            });
            
            // Add a small delay to prevent immediate logout during page transitions
            setTimeout(() => {
                if (!isSessionValid()) {
                    SessionManager.logout();
                }
            }, 1000);
            return false;
        }
        return true;
    }
    
    // Single session management functions
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function getBrowserFingerprint() {
        // Create a simple browser fingerprint for session tracking
        const userAgent = navigator.userAgent || '';
        const language = navigator.language || '';
        const platform = navigator.platform || '';
        const screenRes = screen.width + 'x' + screen.height;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        
        // Create a hash-like string from browser characteristics
        const fingerprint = btoa(userAgent + language + platform + screenRes + timezone)
            .replace(/[^a-zA-Z0-9]/g, '')
            .substr(0, 32);
        
        return 'fp_' + fingerprint;
    }
    
    function checkForActiveSession() {
        // Check server for active sessions first (cross-browser enforcement)
        return checkServerForActiveSession().then(serverSession => {
            if (serverSession) {
                return serverSession;
            }
            
            // Fallback to localStorage check (same browser)
            const activeSession = localStorage.getItem(activeSessionKey);
            if (activeSession) {
                try {
                    const sessionData = JSON.parse(activeSession);
                    const now = Date.now();
                    
                    // Check if active session is still valid (within last 30 minutes)
                    if (now - sessionData.lastActivity < 30 * 60 * 1000) {
                        return sessionData;
                    }
                } catch (e) {
                    // Clear invalid session data
                    localStorage.removeItem(activeSessionKey);
                }
            }
            return null;
        }).catch(error => {
            console.warn('Error checking server for active session:', error);
            // Fallback to localStorage only
            const activeSession = localStorage.getItem(activeSessionKey);
            if (activeSession) {
                try {
                    const sessionData = JSON.parse(activeSession);
                    const now = Date.now();
                    if (now - sessionData.lastActivity < 30 * 60 * 1000) {
                        return sessionData;
                    }
                } catch (e) {
                    localStorage.removeItem(activeSessionKey);
                }
            }
            return null;
        });
    }
    
    // Check server for active sessions (cross-browser)
    function checkServerForActiveSession() {
        if (window.location.protocol === 'file:') {
            return Promise.resolve(null);
        }
        
        return fetch(getApiUrl('/auth/active-session'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => {
            if (response.ok) {
                return response.json().then(data => data.activeSession);
            }
            // Don't log 401 errors as they're expected when no session exists
            if (response.status === 401) {
                return null;
            }
            return null;
        }).catch(error => {
            // Only log unexpected errors, not authentication failures
            if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
                console.warn('Could not check server for active session:', error);
            }
            return null;
        });
    }
    
    function setActiveSession(sessionId, userId, userInfo) {
        const activeSessionData = {
            sessionId: sessionId,
            userId: userId,
            userData: userInfo,
            timestamp: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            browserFingerprint: getBrowserFingerprint()
        };
        
        // Save to localStorage for local reference
        localStorage.setItem(activeSessionKey, JSON.stringify(activeSessionData));
        
        // Save to server for cross-browser enforcement
        if (window.location.protocol !== 'file:') {
            fetch(getApiUrl('/auth/active-session'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeSessionData.sessionId,
                    userId: activeSessionData.userId,
                    email: userInfo.email,
                    userData: userInfo,
                    browserFingerprint: activeSessionData.browserFingerprint
                })
            }).catch(error => {
                // Only log unexpected errors, not authentication failures
                if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
                    console.warn('Failed to save active session to server:', error);
                }
            });
        }
        
        return activeSessionData;
    }
    
    // Save active session to server
    function saveActiveSessionToServer(sessionData) {
        return fetch(getApiUrl('/auth/active-sessions'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionData.sessionId,
                userId: sessionData.userId,
                userData: sessionData.userData,
                loginTime: sessionData.loginTime,
                lastActivity: sessionData.lastActivity,
                browserFingerprint: sessionData.browserFingerprint
            })
        });
    }
    
    function clearActiveSession() {
        // Get current session ID before clearing
        const activeSession = localStorage.getItem(activeSessionKey);
        let sessionId = null;
        
        if (activeSession) {
            try {
                const sessionData = JSON.parse(activeSession);
                sessionId = sessionData.sessionId;
            } catch (e) {
                // Ignore parsing errors
            }
        }
        
        // Clear localStorage
        localStorage.removeItem(activeSessionKey);
        localStorage.removeItem(sessionLockKey);
        
        // Clear from server
        if (sessionId) {
            clearActiveSessionFromServer(sessionId).catch(error => {
                console.warn('Failed to clear active session from server:', error);
            });
        }
    }
    
    // Clear active session from server
    function clearActiveSessionFromServer(sessionId) {
        if (window.location.protocol === 'file:') {
            return Promise.resolve();
        }
        
        return fetch(getApiUrl('/auth/active-session'), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionId })
        }).catch(error => {
            console.warn('Could not clear active session from server:', error);
        });
    }
    
    function updateActiveSessionActivity() {
        const activeSession = localStorage.getItem(activeSessionKey);
        if (activeSession) {
            try {
                const sessionData = JSON.parse(activeSession);
                sessionData.lastActivity = Date.now();
                localStorage.setItem(activeSessionKey, JSON.stringify(sessionData));
            } catch (e) {
                console.warn('Failed to update active session activity:', e);
            }
        }
    }
    
    // Initialize activity tracking
    function initializeActivityTracking() {
        // Track user activity with mouse and keyboard events
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        let lastActivityUpdate = 0;
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                const now = Date.now();
                // Throttle activity updates to once per minute to reduce server calls
                if (now - lastActivityUpdate > 60000) {
                    updateActivity();
                    lastActivityUpdate = now;
                }
            }, true);
        });
        
        // Check session timeout every 2 minutes (less aggressive)
        setInterval(checkSessionTimeout, 120000);
    }

    // Load current session if it exists
    function loadSession() {
        // If we already have a current user, return true
        if (currentUser) {
            return true;
        }
        
        // Always load from localStorage first for immediate availability
        const sessionLoaded = loadSessionFromLocalStorage();
        
        // If we're not on file protocol, also try to sync with server in background
        if (window.location.protocol !== 'file:' && sessionLoaded) {
            loadSessionFromServer().then(serverSession => {
                if (serverSession && serverSession.sessionData) {
                    currentUser = serverSession.sessionData;
                    localStorage.setItem(sessionKey, JSON.stringify(currentUser));
                }
            }).catch(error => {
                console.log('Could not load session from server, using localStorage:', error);
            });
        }
        
        return sessionLoaded;
    }
    
    function loadSessionFromLocalStorage() {
        const sessionData = localStorage.getItem(sessionKey);
        if (sessionData) {
            try {
                const parsedSession = JSON.parse(sessionData);
                // Check if session is still valid
                if (isSessionValidForData(parsedSession)) {
                    currentUser = parsedSession;
                    console.log('Session loaded from localStorage:', currentUser);
                    return true;
                } else {
                    // Session expired, clean up
                    console.log('Session expired, cleaning up');
                    localStorage.removeItem(sessionKey);
                    if (parsedSession.id) {
                        deleteSessionFromServer(parsedSession.id);
                    }
                }
            } catch (e) {
                console.log('Error parsing session data, clearing:', e);
                localStorage.removeItem(sessionKey);
            }
        }
        return false;
    }
    
    // Helper function to check session validity for loaded data
    function isSessionValidForData(sessionData) {
        if (!sessionData || !sessionData.sessionExpires || !sessionData.lastActivity) {
            return false;
        }
        
        const now = new Date();
        const expires = new Date(sessionData.sessionExpires);
        const lastActivity = new Date(sessionData.lastActivity);
        const inactivityTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        return now < expires && (now - lastActivity) <= inactivityTimeout;
    }
    
    // Save session to local storage and server
    function saveSession(userData) {
        // Generate unique session ID
        const sessionId = generateSessionId();
        
        // Add timestamp for session with 15-minute activity tracking
        const now = new Date();
        const sessionData = {
            ...userData,
            // Normalize role field: API returns user_role, but frontend expects role
            role: userData.role || userData.user_role,
            sessionId: sessionId,
            sessionStart: now.toISOString(),
            sessionExpires: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            lastActivity: now.toISOString() // Track last activity for 15-minute timeout
        };
        
        // Session saved successfully - removed verbose logging
        
        // Update last login time for user
        const users = JSON.parse(localStorage.getItem(usersKey));
        const userIndex = users.findIndex(user => user.id === userData.id);
        if (userIndex !== -1) {
            users[userIndex].lastLogin = now.toISOString();
            localStorage.setItem(usersKey, JSON.stringify(users));
        }
        
        // Save to localStorage as fallback
        localStorage.setItem(sessionKey, JSON.stringify(sessionData));
        currentUser = sessionData;
        
        // Set active session (this will override any existing session)
        setActiveSession(sessionId, userData.id, {
            fullName: userData.fullName,
            role: userData.role,
            email: userData.email
        });
        
        // Save to server if available
        saveSessionToServer(sessionData);
        
        // Immediately update activity to ensure session is fresh
        updateActivity();
    }
    
    // Validate credentials against stored users
    async function validateCredentials(email, password, formRole) {
        try {
            // Hash password client-side for security (as per AUTHENTICATION-SYSTEM-STAGE1.md)
            const hashedPassword = await hashPassword(password);
            
            // Try Python server authentication first
            const response = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: hashedPassword  // Send hashed password
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Store JWT token
                if (result.token) {
                    localStorage.setItem('auth_token', result.token);
                }
                if (result.refresh_token) {
                    localStorage.setItem('refresh_token', result.refresh_token);
                }
                return result.user;
            } else {
                console.error('Login failed:', result.error || 'Unknown error');
                return null;
            }
        } catch (error) {
            console.error('Network error during login, falling back to local validation:', error);
            
            // Fallback to local validation for development/testing
            // initializeUsers(); // Removed - all user data comes from live API
            const storedUsers = JSON.parse(localStorage.getItem(usersKey) || '[]');
            
            // Find user by email or username
            const user = storedUsers.find(u => 
                (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
                (u.username && u.username.toLowerCase() === email.toLowerCase())
            );
            
            if (user && user.password === password) {
                console.log('Local validation successful for:', user.email);
                // Create session-like object
                return {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    fullName: user.fullName,
                    role: user.role,
                    lastLogin: new Date().toISOString()
                };
            } else {
                console.log('Local validation failed for:', email);
                return null;
            }
        }
    }
    
    // Check if session is valid and not expired (simplified for testing)
    function isSessionValid() {
        if (!currentUser || !currentUser.sessionExpires) {
            // Session validation failed: missing data - expected during initial load
            return false;
        }
        
        const now = new Date();
        const expires = new Date(currentUser.sessionExpires);
        const isExpired = now > expires;
        
        console.log('Session validation (simplified):', {
            now: now.toISOString(),
            expires: expires.toISOString(),
            isExpired,
            valid: !isExpired
        });
        
        // Only check if session expired (24 hour window), no activity timeout
        if (isExpired) {
            return false;
        }
        
        return true;
    }

    // Save user-specific data to localStorage
    function saveUserData(dataType, data) {
        if (!currentUser) {
            console.warn('Cannot save data: no current user');
            return false;
        }
        
        console.log('Saving data for user:', currentUser.email, 'type:', dataType, 'data:', data);
        
        const userDataKey = `fivetrackr_userdata_${currentUser.id}`;
        let userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        
        userData[dataType] = {
            data: data,
            lastModified: new Date().toISOString(),
            version: (userData[dataType]?.version || 0) + 1
        };
        
        localStorage.setItem(userDataKey, JSON.stringify(userData));
        console.log('Data saved successfully to localStorage with key:', userDataKey);
        return true;
    }

    // Load user-specific data from localStorage
    function loadUserData(dataType) {
        if (!currentUser) {
            console.warn('Cannot load data: no current user');
            return null;
        }
        
        console.log('Loading data for user:', currentUser.email, 'type:', dataType);
        
        const userDataKey = `fivetrackr_userdata_${currentUser.id}`;
        const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        
        if (userData[dataType]) {
            console.log('Data loaded successfully:', userData[dataType].data);
            return userData[dataType].data;
        }
        
        console.log('No saved data found for type:', dataType);
        return null;
    }

    // Get all user data types
    function getAllUserData() {
        if (!currentUser) {
            return {};
        }
        
        const userDataKey = `fivetrackr_userdata_${currentUser.id}`;
        return JSON.parse(localStorage.getItem(userDataKey) || '{}');
    }

    // Clear all user data (for logout)
    function clearUserData() {
        if (!currentUser) {
            return;
        }
        
        const userDataKey = `fivetrackr_userdata_${currentUser.id}`;
        localStorage.removeItem(userDataKey);
    }
    
    // Force reset users (temporary for development)
    function resetUsers() {
        localStorage.removeItem(usersKey);
        localStorage.setItem(usersKey, JSON.stringify(defaultUsers));
    }
    
    // Initialize the module - Live API only
    // initializeUsers(); // Removed - all user data comes from live API
    // resetUsers(); // Removed - all user data comes from live API
    loadSession();
    
    // Initialize activity tracking after DOM is loaded
    // Commented out for testing - no session timeout or back button protection
    /*
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeActivityTracking);
    } else {
        initializeActivityTracking();
    }
    */
    
    // Public API
    return {
        // Login with email and password
        login: async function(email, password, formRole, forceLogin = false) {
            try {
                // Check for existing active session unless forcing login
                if (!forceLogin) {
                    const existingSession = await checkForActiveSession();
                    if (existingSession) {
                        // If it's the same user trying to login, allow it and update the session
                        if (existingSession.userData && existingSession.userData.email === email) {
                            console.log('Same user logging in again, updating session');
                            // Clear the old session and continue with login
                            clearActiveSession();
                        } else {
                            // Different user - show existing session warning
                            return {
                                success: false,
                                error: 'EXISTING_SESSION',
                                message: 'Someone else is already logged in from another session. Please logout or force login.',
                                existingUser: existingSession.userData ? existingSession.userData.fullName : 'Unknown User',
                                existingSession: existingSession
                            };
                        }
                    }
                }
                
                const result = await validateCredentials(email, password, formRole);
                
                // Check for error object
                if (result && result.error) {
                    return { success: false, message: result.message };
                }
                
                if (result) {
                    // If forcing login, clear any existing session first
                    if (forceLogin) {
                        clearActiveSession();
                    }
                    
                    saveSession(result);
                    return { success: true, user: result };
                }
                return { success: false, message: 'Invalid username or password' };
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, error: 'Login failed' };
            }
        },
        
        // Logout current user
        logout: function() {
            // Debug logging to track where logout is being called from
            console.error('🚨 LOGOUT CALLED FROM:', new Error().stack);
            const sessionId = currentUser ? currentUser.id : null;
            
            // Clear server session
            if (sessionId) {
                deleteSessionFromServer(sessionId);
            }
            
            // Clear local storage completely
            console.error('🗑️ CLEARING SESSION DATA:', sessionKey);
            localStorage.removeItem(sessionKey);
            
            // Clear active session tracking
            clearActiveSession();
            
            // Clear all user-specific data
            if (currentUser) {
                const userDataKey = `fivetrackr_userdata_${currentUser.id}`;
                localStorage.removeItem(userDataKey);
            }
            
            // Clear current user
            currentUser = null;
            
            // Clear any auto-save intervals
            if (window.autoSaveIntervals) {
                window.autoSaveIntervals.forEach(interval => clearInterval(interval));
                window.autoSaveIntervals = [];
            }
            
            // Clear browser cache if possible
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    names.forEach(function(name) {
                        caches.delete(name);
                    });
                });
            }
            
            // Clear session storage as well
            try {
                sessionStorage.clear();
            } catch (e) {
                console.warn('Could not clear session storage:', e);
            }
            
            // Trigger logout event for other components
            try {
                window.dispatchEvent(new CustomEvent('userLoggedOut', {
                    detail: { timestamp: new Date().toISOString() }
                }));
            } catch (e) {
                console.warn('Could not dispatch logout event:', e);
            }
            
            // Determine the path to home.html based on current location
            const currentPath = window.location.pathname;
            let pathToHome = '/webapp/home.html'; // Updated for proxy server
            
            // If in a subdirectory, adjust the path
            if (currentPath.includes('/pages/')) {
                if (currentPath.includes('/pages/league-manager/') || currentPath.includes('/pages/referee/')) {
                    pathToHome = '../../home.html';
                } else {
                    pathToHome = '../home.html';
                }
            }
            
            // Simple redirect without history manipulation (for testing)
            window.location.href = pathToHome;
            
            return true;
        },
        
        // Check if user is logged in
        isLoggedIn: function() {
            const sessionLoaded = loadSession();
            const sessionValid = isSessionValid();
            // Removed verbose logging for cleaner console output
            return sessionLoaded && sessionValid;
        },
        
        // Get current user data
        getCurrentUser: function() {
            if (this.isLoggedIn()) {
                return currentUser;
            }
            return null;
        },
        
        // Get user role
        getUserRole: function() {
            if (this.isLoggedIn() && currentUser.role) {
                return currentUser.role;
            }
            return null;
        },
        
        // Get user display name
        getDisplayName: function() {
            if (this.isLoggedIn()) {
                return currentUser.fullName || currentUser.username;
            }
            return 'Guest';
        },

        // Data persistence methods - now using FileDataManager
        saveData: function(dataType, data) {
            if (!currentUser) {
                console.warn('Cannot save data: no current user');
                return false;
            }
            
            // Use FileDataManager for persistent storage
            if (window.FileDataManager) {
                return FileDataManager.save(currentUser.id, dataType, data);
            } else {
                // Fallback to localStorage for development
                return saveUserData(dataType, data);
            }
        },

        loadData: function(dataType) {
            if (!currentUser) {
                console.warn('Cannot load data: no current user');
                return null;
            }
            
            // Use FileDataManager for persistent storage
            if (window.FileDataManager) {
                return FileDataManager.load(currentUser.id, dataType);
            } else {
                // Fallback to localStorage for development
                return loadUserData(dataType);
            }
        },

        getAllData: function() {
            if (!currentUser) {
                return {};
            }
            
            // Use FileDataManager for persistent storage
            if (window.FileDataManager) {
                return FileDataManager.getAllData(currentUser.id);
            } else {
                // Fallback to localStorage for development
                return getAllUserData();
            }
        },

        // Auto-save functionality for forms
        autoSave: function(formId, interval = 5000) {
            if (!this.isLoggedIn()) {
                return null;
            }

            const form = document.getElementById(formId);
            if (!form) {
                console.warn(`Form with ID '${formId}' not found`);
                return null;
            }

            // Load existing data
            const savedData = this.loadData(`form_${formId}`);
            if (savedData) {
                this.restoreFormData(formId, savedData);
            }

            // Set up auto-save interval
            const autoSaveInterval = setInterval(() => {
                if (this.isLoggedIn()) {
                    const formData = this.getFormData(formId);
                    this.saveData(`form_${formId}`, formData);
                } else {
                    clearInterval(autoSaveInterval);
                }
            }, interval);

            return autoSaveInterval;
        },

        // Get form data as object
        getFormData: function(formId) {
            const form = document.getElementById(formId);
            if (!form) return {};

            const formData = new FormData(form);
            const data = {};

            for (let [key, value] of formData.entries()) {
                if (data[key]) {
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [data[key], value];
                    }
                } else {
                    data[key] = value;
                }
            }

            return data;
        },

        // Restore form data from object
        restoreFormData: function(formId, data) {
            const form = document.getElementById(formId);
            if (!form || !data) return;

            Object.keys(data).forEach(name => {
                const field = form.querySelector(`[name="${name}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = field.value === data[name];
                    } else {
                        field.value = data[name];
                    }
                }
            });
        },

        // Check for active session (async)
        checkForActiveSession: function() {
            return checkForActiveSession();
        }
    };
})();

// Password hashing function for client-side security
async function hashPassword(password) {
    try {
        // Use Web Crypto API for secure hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error hashing password:', error);
        // Fallback to simple hash if Web Crypto API is not available
        return btoa(password); // Basic fallback - not recommended for production
    }
}

// Make SessionManager globally available
window.SessionManager = SessionManager;
