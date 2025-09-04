/**
 * Production Data Manager for 5ive Trackr
 * Handles data storage using production server API
 * © 2025 5ive Trackr. All rights reserved.
 */

const ProductionDataManager = (function() {
    'use strict';

    // Production server configuration
    const PRODUCTION_SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8080'  // Local proxy server
        : 'https://five-trackr-yq6ly.ondigitalocean.app';  // Production Python server
    const API_BASE_URL = PRODUCTION_SERVER_URL + '/api';

    // Cache for loaded data
    let dataCache = {};
    let usersCache = null;
    let currentUser = null;

    // Data type constants
    const DATA_TYPES = {
        PITCHES: 'pitches',
        TEAMS: 'teams',
        LEAGUES: 'leagues',
        MATCHES: 'matches',
        REFEREES: 'referees',
        SETTINGS: 'settings',
        BOOKINGS: 'bookings'
    };

    // Make HTTP requests to production server
    async function makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(API_BASE_URL + endpoint, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Server request failed');
            }

            return result;
        } catch (error) {
            console.error('Production server request failed:', error);
            throw error;
        }
    }

    // Authentication functions
    async function authenticateUser(email, password) {
        try {
            const result = await makeRequest('/login', 'POST', { email, password });
            if (result.success) {
                currentUser = result.user;
                console.log('User authenticated successfully:', currentUser.email);
                return result.user;
            }
            return null;
        } catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
    }

    // Data operations
    async function loadUserData(userId, dataType) {
        try {
            const result = await makeRequest(`/data/${userId}/${dataType}`, 'GET');
            if (result.success && result.data) {
                return result.data.data; // Extract the actual data from the wrapper
            }
            return null;
        } catch (error) {
            console.error(`Failed to load ${dataType} data:`, error);
            return null;
        }
    }

    async function saveUserData(userId, dataType, data) {
        try {
            const result = await makeRequest(`/data/${userId}/${dataType}`, 'POST', data);
            if (result.success) {
                console.log(`${dataType} data saved successfully to production server`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to save ${dataType} data:`, error);
            return false;
        }
    }

    // Public API
    return {
        // Initialize connection to production server
        initialize: async function() {
            try {
                // Test server connection
                const health = await makeRequest('/health', 'GET');
                if (health.status === 'ok') {
                    console.log('ProductionDataManager connected to server successfully');
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Failed to connect to production server:', error);
                return false;
            }
        },

        // Authentication
        authenticate: async function(email, password) {
            return await authenticateUser(email, password);
        },

        getCurrentUser: function() {
            return currentUser;
        },

        // Save data for a specific user and type
        save: async function(userId, dataType, data) {
            try {
                console.log(`Saving data to production server - User: ${userId}, Type: ${dataType}`);
                return await saveUserData(userId, dataType, data);
            } catch (error) {
                console.error(`Error saving data (${dataType}):`, error);
                return false;
            }
        },

        // Load data for a specific user and type
        load: async function(userId, dataType) {
            try {
                console.log(`Loading data from production server - User: ${userId}, Type: ${dataType}`);
                return await loadUserData(userId, dataType);
            } catch (error) {
                console.error(`Error loading data (${dataType}):`, error);
                return null;
            }
        },

        // Get all data for a user
        getAllData: async function(userId) {
            try {
                const allData = {};
                for (const dataType of Object.values(DATA_TYPES)) {
                    const data = await this.load(userId, dataType);
                    if (data) {
                        allData[dataType] = data;
                    }
                }
                return allData;
            } catch (error) {
                console.error('Error getting all user data:', error);
                return {};
            }
        },

        // Check server health
        checkHealth: async function() {
            try {
                const health = await makeRequest('/health', 'GET');
                return health.status === 'ok';
            } catch (error) {
                console.error('Server health check failed:', error);
                return false;
            }
        },

        // Get server info
        getServerInfo: function() {
            return {
                serverUrl: PRODUCTION_SERVER_URL,
                apiUrl: API_BASE_URL,
                connected: currentUser !== null
            };
        },

        // Data type constants
        DATA_TYPES: DATA_TYPES
    };
})();

// Make ProductionDataManager globally available
window.ProductionDataManager = ProductionDataManager;
