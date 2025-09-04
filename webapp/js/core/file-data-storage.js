/**
 * File-based Data Storage Client for 5ive Trackr
 * Provides persistent data storage using file system instead of localStorage
 * © 2025 5ive Trackr. All rights reserved.
 */

const FileDataStorage = (function() {
    'use strict';
    
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8080/api'  // Local proxy server
        : 'https://five-trackr-yq6ly.ondigitalocean.app/api';  // Production Python server
    
    // Helper function to make HTTP requests
    async function makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    return {
        // Save data to file
        saveData: async function(userId, dataType, data) {
            try {
                const result = await makeRequest(`${API_BASE_URL}/save-data`, {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: userId,
                        dataType: dataType,
                        data: data
                    })
                });
                
                console.log(`File storage: Data saved successfully - ${dataType}`, data);
                return result.success;
            } catch (error) {
                console.error('Failed to save data to file:', error);
                return false;
            }
        },
        
        // Load data from file
        loadData: async function(userId, dataType) {
            try {
                const url = `${API_BASE_URL}/load-data?userId=${encodeURIComponent(userId)}&dataType=${encodeURIComponent(dataType)}`;
                const result = await makeRequest(url);
                
                if (result.success) {
                    console.log(`File storage: Data loaded successfully - ${dataType}`, result.data);
                    return result.data;
                }
                return null;
            } catch (error) {
                console.error('Failed to load data from file:', error);
                return null;
            }
        },
        
        // Load all data types for a user
        loadAllData: async function(userId) {
            try {
                const url = `${API_BASE_URL}/load-all-data?userId=${encodeURIComponent(userId)}`;
                const result = await makeRequest(url);
                
                if (result.success) {
                    console.log('File storage: All data loaded successfully', result.data);
                    return result.data;
                }
                return {};
            } catch (error) {
                console.error('Failed to load all data from file:', error);
                return {};
            }
        },
        
        // Check if API server is available
        isAvailable: async function() {
            try {
                const url = `${API_BASE_URL}/load-data?userId=test&dataType=test`;
                await makeRequest(url);
                return true;
            } catch (error) {
                return false;
            }
        }
    };
})();

// Make globally available
window.FileDataStorage = FileDataStorage;
