/**
 * File-Based Data Manager for 5ive Trackr
 * Handles persistent data storage using JSON files in the workspace
 * © 2025 5ive Trackr. All rights reserved.
 */

// Global auto-refresh interval to prevent multiple instances
window.FileDataManager_refreshInterval = window.FileDataManager_refreshInterval || null;

const FileDataManager = (function() {
    'use strict';

    // Production server configuration
    const PRODUCTION_SERVER = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8080'  // Local proxy server
        : 'https://five-trackr-yq6ly.ondigitalocean.app';  // Production Python server
    const API_BASE_URL = PRODUCTION_SERVER + '/api';
    
    // API endpoints
    const ENDPOINTS = {
        USERS: '/data/users',
        USER_DATA: '/data/user',
        HEALTH: '/test'
    };

    // Cache for loaded data
    let dataCache = {};
    let usersCache = null;
    let lastFileModified = {};

    // Use global refresh interval
    let refreshInterval = () => window.FileDataManager_refreshInterval;
    let setRefreshInterval = (val) => { window.FileDataManager_refreshInterval = val; };

    // Data type constants
    const DATA_TYPES = {
        PITCHES: 'pitches',
        TEAMS: 'teams',
        LEAGUES: 'leagues',
        FIXTURES: 'fixtures',
        REFEREES: 'referees',
        SETTINGS: 'settings',
        BOOKINGS: 'bookings'
    };

    // Check server health and connectivity
    async function checkServerHealth() {
        try {
            const response = await fetch(API_BASE_URL + ENDPOINTS.HEALTH);
            const data = await response.json();
            return response.ok && data.status === 'healthy';
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }

    // Refresh data from server periodically
    async function refreshDataFromServer() {
        try {
            // Check if server is healthy
            const isHealthy = await checkServerHealth();
            if (!isHealthy) {
                console.warn('Server health check failed, skipping refresh');
                return;
            }

            // Refresh user data cache
            console.log('Refreshing data from production server...');
            const userData = await loadUserDataFromServer();
            if (userData) {
                dataCache = userData;
                
                // Dispatch event to notify UI
                document.dispatchEvent(new CustomEvent('fileDataRefreshed', {
                    detail: { type: 'userData', data: dataCache }
                }));
            }

            // Refresh users cache
            const users = await loadUsersFromServer();
            if (users) {
                usersCache = users;
                
                // Dispatch event to notify UI
                document.dispatchEvent(new CustomEvent('fileDataRefreshed', {
                    detail: { type: 'users', data: usersCache }
                }));
            }
        } catch (error) {
            console.error('Error refreshing data from server:', error);
        }
    }

    // Start auto-refresh to sync with server
    function startAutoRefresh(intervalMs = 10000) {
        if (refreshInterval()) {
            clearInterval(refreshInterval());
        }
        
        const newInterval = setInterval(refreshDataFromServer, intervalMs);
        setRefreshInterval(newInterval);
        console.log(`Auto-refresh started with ${intervalMs}ms interval (production server)`);
    }

    // Stop auto-refresh
    function stopAutoRefresh() {
        if (refreshInterval()) {
            clearInterval(refreshInterval());
            setRefreshInterval(null);
            console.log('Auto-refresh stopped');
        }
    }

    // Load users from production server
    async function loadUsers() {
        if (usersCache) {
            return usersCache;
        }
        return await loadUsersFromServer();
    }

    // Load users from production server
    async function loadUsersFromServer() {
        try {
            const response = await fetch(API_BASE_URL + ENDPOINTS.USERS);
            if (!response.ok) {
                throw new Error(`Failed to load users from server: ${response.status}`);
            }
            const data = await response.json();
            usersCache = data.users || [];
            console.log('Users loaded successfully from production server');
            return usersCache;
        } catch (error) {
            console.error('Error loading users from server:', error);
            return [];
        }
    }

    // Save users to production server
    async function saveUsers(users) {
        try {
            const response = await fetch(API_BASE_URL + ENDPOINTS.USERS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ users: users })
            });

            if (!response.ok) {
                throw new Error(`Failed to save users to server: ${response.status}`);
            }

            usersCache = users;
            console.log('Users saved successfully to production server');
            return true;
        } catch (error) {
            console.error('Error saving users to server:', error);
            return false;
        }
    }

    // Load all user data from production server
    async function loadUserData() {
        return await loadUserDataFromServer();
    }

    // Load user data from production server
    async function loadUserDataFromServer() {
        try {
            const response = await fetch(API_BASE_URL + ENDPOINTS.USER_DATA);
            if (!response.ok) {
                throw new Error(`Failed to load user data from server: ${response.status}`);
            }
            const data = await response.json();
            dataCache = data.userData || {};
            console.log('User data loaded successfully from production server');
            return dataCache;
        } catch (error) {
            console.error('Error loading user data from server:', error);
            return {};
        }
    }

    // Save all user data to production server
    async function saveUserData(data) {
        try {
            const response = await fetch(API_BASE_URL + ENDPOINTS.USER_DATA, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userData: data })
            });

            if (!response.ok) {
                throw new Error(`Failed to save user data to server: ${response.status}`);
            }

            dataCache = data;
            console.log('User data saved successfully to production server');
            return true;
        } catch (error) {
            console.error('Error saving user data to server:', error);
            return false;
        }
    }

    // Public API
    return {
        // Data type constants
        TYPES: DATA_TYPES,

        // Initialize - load data into cache
        initialize: async function() {
            try {
                await Promise.all([
                    loadUsers(),
                    loadUserData()
                ]);
                
                // Auto-refresh disabled to prevent UI jitter
                // if (!refreshInterval()) {
                //     startAutoRefresh(10000); // 10 seconds for production server
                // }
                
                console.log('FileDataManager initialized successfully with production server (auto-refresh disabled)');
                return true;
            } catch (error) {
                console.error('Failed to initialize FileDataManager:', error);
                return false;
            }
        },

        // Save data for a specific user and type
        save: async function(userId, dataType, data) {
            try {
                console.log(`Saving data to production server - User: ${userId}, Type: ${dataType}`);
                
                // Load current data if not cached
                if (!Object.keys(dataCache).length) {
                    await loadUserDataFromServer();
                }

                // Ensure user exists in data structure
                if (!dataCache[userId]) {
                    dataCache[userId] = {};
                }

                // Save the data with metadata
                dataCache[userId][dataType] = {
                    data: data,
                    lastModified: new Date().toISOString(),
                    version: (dataCache[userId][dataType]?.version || 0) + 1
                };

                // Save to file
                const success = await saveUserData(dataCache);
                if (success) {
                    console.log(`Data saved successfully to production server: ${dataType}`);
                    
                    // Dispatch custom event for data save
                    document.dispatchEvent(new CustomEvent('fileDataSaved', {
                        detail: { userId, dataType, data }
                    }));
                }
                return success;
            } catch (error) {
                console.error(`Error saving data (${dataType}):`, error);
                return false;
            }
        },

        // Load data for a specific user and type
        load: async function(userId, dataType) {
            try {
                console.log(`Loading data from production server - User: ${userId}, Type: ${dataType}`);
                
                // Only refresh cache if it's empty or we're debugging
                if (!Object.keys(dataCache).length) {
                    console.log('Cache empty, loading user data from server...');
                    await loadUserDataFromServer();
                }

                if (dataCache[userId] && dataCache[userId][dataType]) {
                    const data = dataCache[userId][dataType].data;
                    console.log(`Data loaded successfully from production server: ${dataType}`);
                    return data;
                }

                console.log(`No saved data found on production server for type: ${dataType}`);
                return null;
                return null;
            } catch (error) {
                console.error(`Error loading data (${dataType}):`, error);
                return null;
            }
        },

        // Get all data for a user
        getAllData: async function(userId) {
            try {
                // Load current data if not cached
                if (!Object.keys(dataCache).length) {
                    await loadUserDataFromServer();
                }

                return dataCache[userId] || {};
            } catch (error) {
                console.error('Error getting all user data:', error);
                return {};
            }
        },

        // User management
        getUsers: async function() {
            return await loadUsers();
        },

        // Update user info
        updateUser: async function(userId, userData) {
            try {
                const users = await loadUsers();
                const userIndex = users.findIndex(user => user.id === userId);
                
                if (userIndex !== -1) {
                    users[userIndex] = { ...users[userIndex], ...userData };
                    return await saveUsers(users);
                }
                
                return false;
            } catch (error) {
                console.error('Error updating user:', error);
                return false;
            }
        },

        // Clear cache (useful for testing)
        clearCache: function() {
            dataCache = {};
            usersCache = null;
            lastFileModified = {};
            console.log('FileDataManager cache cleared');
        },

        // Auto-refresh controls
        startAutoRefresh: function(intervalMs = 3000) {
            startAutoRefresh(intervalMs);
        },

        stopAutoRefresh: function() {
            stopAutoRefresh();
        },

        // Force refresh cache from production server
        forceRefresh: async function() {
            console.log('Force refreshing FileDataManager cache from production server...');
            dataCache = {};
            usersCache = null;
            lastFileModified = {};
            await Promise.all([
                loadUsersFromServer(),
                loadUserDataFromServer()
            ]);
            console.log('Cache force refreshed from production server');
        },

        // Force load data for a specific user and type (bypasses cache)
        forceLoad: async function(userId, dataType) {
            try {
                console.log(`Force loading data from production server - User: ${userId}, Type: ${dataType}`);
                
                // Always fetch fresh data when forced
                await loadUserDataFromServer();

                if (dataCache[userId] && dataCache[userId][dataType]) {
                    const data = dataCache[userId][dataType].data;
                    console.log(`Data force loaded successfully from production server: ${dataType}`);
                    return data;
                }

                console.log(`No saved data found on production server for type: ${dataType}`);
                return null;
            } catch (error) {
                console.error(`Error force loading data (${dataType}):`, error);
                return null;
            }
        },

        // Export data (backup)
        exportData: async function() {
            try {
                // Load current data if not cached
                if (!Object.keys(dataCache).length) {
                    await loadUserDataFromServer();
                }

                const exportData = {
                    userData: dataCache,
                    users: usersCache || await loadUsersFromServer(),
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    source: 'production-server'
                };

                return exportData;
            } catch (error) {
                console.error('Error exporting data:', error);
                return null;
            }
        },

        // Get server status
        getServerStatus: async function() {
            try {
                const isHealthy = await checkServerHealth();
                return {
                    connected: isHealthy,
                    server: PRODUCTION_SERVER,
                    lastChecked: new Date().toISOString()
                };
            } catch (error) {
                console.error('Error checking server status:', error);
                return {
                    connected: false,
                    server: PRODUCTION_SERVER,
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        },

        // Check for data conflicts before saving
        checkForConflicts: async function(userId, dataType) {
            try {
                // Get fresh data from server
                const freshData = await loadUserDataFromServer();
                const serverData = freshData[userId] && freshData[userId][dataType] ? freshData[userId][dataType] : null;
                
                // Get cached data
                const cachedData = dataCache[userId] && dataCache[userId][dataType] ? dataCache[userId][dataType] : null;
                
                // If we have both server and cached data, compare versions/timestamps
                if (serverData && cachedData) {
                    const serverVersion = serverData.version || 0;
                    const cachedVersion = cachedData.version || 0;
                    const serverModified = new Date(serverData.lastModified || 0);
                    const cachedModified = new Date(cachedData.lastModified || 0);
                    
                    // Conflict if server has newer data
                    if (serverVersion > cachedVersion || serverModified > cachedModified) {
                        return {
                            hasConflict: true,
                            serverData: serverData,
                            cachedData: cachedData,
                            message: 'Data has been modified by another user or session. Your local changes may conflict with recent updates.'
                        };
                    }
                }
                
                return { hasConflict: false };
            } catch (error) {
                console.error('Error checking for conflicts:', error);
                return { hasConflict: false, error: error.message };
            }
        },

        // Save with conflict detection
        saveWithConflictCheck: async function(userId, dataType, data, forceOverwrite = false) {
            try {
                if (!forceOverwrite) {
                    const conflictCheck = await this.checkForConflicts(userId, dataType);
                    if (conflictCheck.hasConflict) {
                        return {
                            success: false,
                            conflict: true,
                            conflictInfo: conflictCheck,
                            message: conflictCheck.message
                        };
                    }
                }
                
                // No conflict or force overwrite, proceed with save
                const success = await this.save(userId, dataType, data);
                return {
                    success: success,
                    conflict: false,
                    message: success ? 'Data saved successfully' : 'Failed to save data'
                };
            } catch (error) {
                console.error('Error in saveWithConflictCheck:', error);
                return {
                    success: false,
                    conflict: false,
                    error: error.message,
                    message: 'Error occurred while saving data'
                };
            }
        }
    };
})();

// Make FileDataManager globally available
window.FileDataManager = FileDataManager;
