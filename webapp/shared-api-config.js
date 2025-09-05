/**
 * 5ive Trackr - Shared API Configuration Module
 * 
 * This module provides a centralized API configuration for all platforms:
 * - Web Application (webapp/)
 * - Admin Panel (webpage/)
 * - Android Mobile App
 * - iOS Mobile App
 * 
 * All platforms MUST use this configuration to ensure data consistency
 * across the entire 5ive Trackr ecosystem.
 */

// === PRODUCTION API CONFIGURATION ===
const PRODUCTION_API = {
    base: 'https://five-trackr-yq6ly.ondigitalocean.app/api', // DigitalOcean API backend
    endpoints: {
        // User Management
        users: '/admin/users',
        user: '/admin/user',
        userCreate: '/data/users',
        userUpdate: '/data/users', 
        userDelete: '/data/users',
        userAuth: '/auth/login',
        
        // Data Management
        data: '/data',
        userData: '/data/user',
        userDataAdmin: '/admin/user',
        
        // League Management
        leagues: '/data/leagues',
        teams: '/data/teams',
        fixtures: '/data/fixtures',
        pitches: '/data/pitches',
        referees: '/data/referees',
        
        // System
        health: '/health',
        sync: '/sync/users'
    }
};

// === DEVELOPMENT API CONFIGURATION ===
const DEVELOPMENT_API = {
    base: 'http://localhost:8080/api',
    endpoints: PRODUCTION_API.endpoints // Same endpoints structure
};

// === UNIFIED API CONFIGURATION CLASS ===
class SharedApiConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.environment === 'development' ? DEVELOPMENT_API : PRODUCTION_API;
        this.initialized = true;
        
        console.log(`🔗 SharedApiConfig initialized for ${this.environment}`);
        console.log(`📡 API Base URL: ${this.config.base}`);
    }
    
    /**
     * Detect the current environment based on hostname and domain
     * @returns {string} 'development' or 'production'
     */
    detectEnvironment() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const isDevelopment = hostname === 'localhost' || 
                                 hostname === '127.0.0.1' || 
                                 hostname.includes('localhost');
            return isDevelopment ? 'development' : 'production';
        }
        
        // For Node.js/server environments
        return process.env.NODE_ENV === 'development' ? 'development' : 'production';
    }
    
    /**
     * Get the base API URL
     * @returns {string} The base API URL for current environment
     */
    getBaseUrl() {
        return this.config.base;
    }
    
    /**
     * Get a complete endpoint URL
     * @param {string} endpoint - The endpoint key from the configuration
     * @param {string|number} [id] - Optional ID to append to the endpoint
     * @returns {string} Complete endpoint URL
     */
    getEndpoint(endpoint, id = null) {
        const endpointPath = this.config.endpoints[endpoint];
        if (!endpointPath) {
            console.error(`❌ Unknown endpoint: ${endpoint}`);
            return this.config.base;
        }
        
        const url = this.config.base + endpointPath;
        return id ? `${url}/${id}` : url;
    }
    
    /**
     * Get all available endpoints
     * @returns {object} Object containing all endpoint paths
     */
    getEndpoints() {
        return { ...this.config.endpoints };
    }
    
    /**
     * Check if currently in development mode
     * @returns {boolean} True if in development environment
     */
    isDevelopment() {
        return this.environment === 'development';
    }
    
    /**
     * Check if currently in production mode
     * @returns {boolean} True if in production environment
     */
    isProduction() {
        return this.environment === 'production';
    }
    
    /**
     * Get environment-specific headers for API requests
     * @returns {object} Headers object for fetch requests
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Client': '5ive-trackr-shared-config',
            'X-Environment': this.environment
        };
    }
    
    /**
     * Create a fetch request with standardized configuration
     * @param {string} endpoint - The endpoint key
     * @param {object} options - Fetch options (method, body, etc.)
     * @param {string|number} [id] - Optional ID for the endpoint
     * @returns {Promise} Fetch promise
     */
    async request(endpoint, options = {}, id = null) {
        const url = this.getEndpoint(endpoint, id);
        const defaultHeaders = this.getHeaders();
        
        const requestOptions = {
            method: 'GET',
            headers: defaultHeaders,
            ...options
        };
        
        // Merge headers if provided in options
        if (options.headers) {
            requestOptions.headers = { ...defaultHeaders, ...options.headers };
        }
        
        console.log(`🌐 API Request: ${requestOptions.method} ${url}`);
        
        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                console.error(`❌ API Error: ${response.status} ${response.statusText}`);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            console.error(`❌ Network Error:`, error);
            throw error;
        }
    }
    
    /**
     * Convenience method for GET requests
     * @param {string} endpoint - The endpoint key
     * @param {string|number} [id] - Optional ID for the endpoint
     * @returns {Promise} Fetch promise
     */
    async get(endpoint, id = null) {
        return this.request(endpoint, { method: 'GET' }, id);
    }
    
    /**
     * Convenience method for POST requests
     * @param {string} endpoint - The endpoint key
     * @param {object} data - Data to send in request body
     * @param {string|number} [id] - Optional ID for the endpoint
     * @returns {Promise} Fetch promise
     */
    async post(endpoint, data, id = null) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }, id);
    }
    
    /**
     * Convenience method for PUT requests
     * @param {string} endpoint - The endpoint key
     * @param {object} data - Data to send in request body
     * @param {string|number} [id] - Optional ID for the endpoint
     * @returns {Promise} Fetch promise
     */
    async put(endpoint, data, id = null) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, id);
    }
    
    /**
     * Convenience method for DELETE requests
     * @param {string} endpoint - The endpoint key
     * @param {string|number} [id] - Optional ID for the endpoint
     * @returns {Promise} Fetch promise
     */
    async delete(endpoint, id = null) {
        return this.request(endpoint, { method: 'DELETE' }, id);
    }
}

// === EXPORT FOR DIFFERENT ENVIRONMENTS ===

// Browser environment
if (typeof window !== 'undefined') {
    window.SharedApiConfig = SharedApiConfig;
    window.sharedApiConfig = new SharedApiConfig();
    
    // Make it globally available for backward compatibility
    window.API_BASE = window.sharedApiConfig.getBaseUrl();
    
    console.log('🌐 Shared API Config loaded for browser environment');
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SharedApiConfig, PRODUCTION_API, DEVELOPMENT_API };
    console.log('📦 Shared API Config exported for Node.js environment');
}

// === CONFIGURATION CONSTANTS FOR DIRECT USE ===
const SHARED_API_CONFIG = {
    PRODUCTION_URL: PRODUCTION_API.base,
    DEVELOPMENT_URL: DEVELOPMENT_API.base,
    ENDPOINTS: PRODUCTION_API.endpoints,
    
    /**
     * Get the appropriate API URL for current environment
     * @returns {string} API base URL
     */
    getApiUrl() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
            // All production domains (including custom domain) use the same DigitalOcean API
            return isDevelopment ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
        }
        return this.PRODUCTION_URL; // Points to app.5ivetrackr.com for production launch
    }
};

// Make configuration available globally
if (typeof window !== 'undefined') {
    window.SHARED_API_CONFIG = SHARED_API_CONFIG;
}