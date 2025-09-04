/**
 * User Data Manager for 5ive Trackr
 * Handles persistent data storage for authenticated users
 * © 2025 5ive Trackr. All rights reserved.
 */

const UserDataManager = (function() {
    'use strict';

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

    // Auto-save intervals
    const autoSaveIntervals = new Map();

    return {
        // Data type constants for external use
        TYPES: DATA_TYPES,

        // Save data for a specific type
        save: function(dataType, data) {
            if (!window.SessionManager) {
                console.warn('Cannot save data: SessionManager not available');
                return false;
            }

            // Check if we have a current user for saving
            const currentUser = SessionManager.getCurrentUser();
            if (!currentUser || !currentUser.email) {
                console.warn('Cannot save data: no current user found');
                return false;
            }

            try {
                const success = SessionManager.saveData(dataType, data);
                if (success) {
                    console.log(`Data saved successfully: ${dataType}`);
                    
                    // Dispatch custom event for data save
                    document.dispatchEvent(new CustomEvent('userDataSaved', {
                        detail: { dataType, data }
                    }));
                }
                return success;
            } catch (error) {
                console.error(`Error saving data (${dataType}):`, error);
                return false;
            }
        },

        // Save with conflict detection
        saveWithConflictCheck: async function(dataType, data, forceOverwrite = false) {
            if (!window.SessionManager) {
                console.warn('Cannot save data: SessionManager not available');
                return { success: false, message: 'SessionManager not available' };
            }

            // Check if we have a current user for saving
            const currentUser = SessionManager.getCurrentUser();
            if (!currentUser || !currentUser.email) {
                console.warn('Cannot save data: no current user found');
                return { success: false, message: 'No current user found' };
            }

            try {
                // Use FileDataManager for conflict detection if available
                if (window.FileDataManager && typeof FileDataManager.saveWithConflictCheck === 'function') {
                    // Get user ID - for now hardcode to user-005 as that's what the current user should be
                    // TODO: This should be improved to dynamically get the correct user ID
                    const userId = 'user-005'; // currentUser.email === 'mb@5ivetrackr.com' ? 'user-005' : 'user-001';
                    console.log('Using userId for save:', userId);
                    
                    const result = await FileDataManager.saveWithConflictCheck(userId, dataType, data, forceOverwrite);
                    
                    if (result.success) {
                        // Dispatch custom event for data save
                        document.dispatchEvent(new CustomEvent('userDataSaved', {
                            detail: { dataType, data }
                        }));
                    }
                    
                    return result;
                } else {
                    // Fallback to regular save without conflict detection
                    const success = this.save(dataType, data);
                    return {
                        success: success,
                        conflict: false,
                        message: success ? 'Data saved successfully' : 'Failed to save data'
                    };
                }
            } catch (error) {
                console.error(`Error saving data with conflict check (${dataType}):`, error);
                return {
                    success: false,
                    conflict: false,
                    error: error.message,
                    message: 'Error occurred while saving data'
                };
            }
        },

        // Load data for a specific type
        load: function(dataType) {
            if (!window.SessionManager) {
                console.warn('Cannot load data: SessionManager not available');
                return null;
            }

            // For loading, we'll be more lenient - check if SessionManager exists and has current user
            const currentUser = SessionManager.getCurrentUser();
            if (!currentUser || !currentUser.email) {
                console.warn('Cannot load data: no current user found');
                return null;
            }

            try {
                const data = SessionManager.loadData(dataType);
                if (data) {
                    console.log(`Data loaded successfully: ${dataType}`);
                }
                return data;
            } catch (error) {
                console.error(`Error loading data (${dataType}):`, error);
                return null;
            }
        },

        // Get all user data
        getAllData: function() {
            if (!window.SessionManager || !SessionManager.isLoggedIn()) {
                return {};
            }

            return SessionManager.getAllData();
        },

        // Save pitches data
        savePitches: function(pitches) {
            return this.save(DATA_TYPES.PITCHES, pitches);
        },

        // Load pitches data
        loadPitches: function() {
            return this.load(DATA_TYPES.PITCHES) || [];
        },

        // Save teams data
        saveTeams: function(teams) {
            return this.save(DATA_TYPES.TEAMS, teams);
        },

        // Load teams data
        loadTeams: function() {
            return this.load(DATA_TYPES.TEAMS) || [];
        },

        // Save leagues data
        saveLeagues: function(leagues) {
            return this.save(DATA_TYPES.LEAGUES, leagues);
        },

        // Load leagues data
        loadLeagues: function() {
            return this.load(DATA_TYPES.LEAGUES) || [];
        },

        // Save fixtures data
        saveFixtures: function(fixtures) {
            return this.save(DATA_TYPES.FIXTURES, fixtures);
        },

        // Load fixtures data
        loadFixtures: function() {
            return this.load(DATA_TYPES.FIXTURES) || [];
        },

        // Save referees data
        saveReferees: function(referees) {
            return this.save(DATA_TYPES.REFEREES, referees);
        },

        // Load referees data
        loadReferees: function() {
            return this.load(DATA_TYPES.REFEREES) || [];
        },

        // Save settings data
        saveSettings: function(settings) {
            return this.save(DATA_TYPES.SETTINGS, settings);
        },

        // Load settings data
        loadSettings: function() {
            return this.load(DATA_TYPES.SETTINGS) || {};
        },

        // Save bookings data
        saveBookings: function(bookings) {
            return this.save(DATA_TYPES.BOOKINGS, bookings);
        },

        // Load bookings data
        loadBookings: function() {
            return this.load(DATA_TYPES.BOOKINGS) || {};
        },

        // Enable auto-save for a data type
        enableAutoSave: function(dataType, getData, interval = 10000) {
            if (autoSaveIntervals.has(dataType)) {
                this.disableAutoSave(dataType);
            }

            const intervalId = setInterval(() => {
                if (window.SessionManager && SessionManager.isLoggedIn()) {
                    try {
                        const data = getData();
                        if (data) {
                            this.save(dataType, data);
                        }
                    } catch (error) {
                        console.error(`Auto-save error for ${dataType}:`, error);
                    }
                } else {
                    this.disableAutoSave(dataType);
                }
            }, interval);

            autoSaveIntervals.set(dataType, intervalId);
            console.log(`Auto-save enabled for ${dataType} (${interval}ms interval)`);
        },

        // Disable auto-save for a data type
        disableAutoSave: function(dataType) {
            if (autoSaveIntervals.has(dataType)) {
                clearInterval(autoSaveIntervals.get(dataType));
                autoSaveIntervals.delete(dataType);
                console.log(`Auto-save disabled for ${dataType}`);
            }
        },

        // Disable all auto-save intervals
        disableAllAutoSave: function() {
            autoSaveIntervals.forEach((intervalId, dataType) => {
                clearInterval(intervalId);
                console.log(`Auto-save disabled for ${dataType}`);
            });
            autoSaveIntervals.clear();
        },

        // Initialize data manager
        init: function() {
            // Set up event listeners for authentication changes
            document.addEventListener('userLoggedOut', () => {
                this.disableAllAutoSave();
            });

            // Auto-save form data for common forms
            document.addEventListener('DOMContentLoaded', () => {
                // Wait for SessionManager to be available
                setTimeout(() => {
                    if (window.SessionManager && SessionManager.isLoggedIn()) {
                        this.setupFormAutoSave();
                    }
                }, 1000);
            });

            console.log('UserDataManager initialized');
        },

        // Set up auto-save for common forms
        setupFormAutoSave: function() {
            // Auto-save for pitch form
            const pitchForm = document.getElementById('pitchForm');
            if (pitchForm) {
                SessionManager.autoSave('pitchForm', 5000);
            }

            // Auto-save for team form
            const teamForm = document.getElementById('teamForm');
            if (teamForm) {
                SessionManager.autoSave('teamForm', 5000);
            }

            // Auto-save for league form
            const leagueForm = document.getElementById('leagueForm');
            if (leagueForm) {
                SessionManager.autoSave('leagueForm', 5000);
            }
        },

        // Export data for backup
        exportData: function() {
            const allData = this.getAllData();
            const exportData = {
                user: SessionManager.getCurrentUser()?.email || 'unknown',
                exportDate: new Date().toISOString(),
                data: allData
            };

            return JSON.stringify(exportData, null, 2);
        },

        // Import data from backup
        importData: function(jsonData) {
            try {
                const importData = JSON.parse(jsonData);
                
                if (!importData.data) {
                    throw new Error('Invalid import data format');
                }

                let importCount = 0;
                Object.keys(importData.data).forEach(dataType => {
                    if (importData.data[dataType] && importData.data[dataType].data) {
                        this.save(dataType, importData.data[dataType].data);
                        importCount++;
                    }
                });

                console.log(`Imported ${importCount} data types successfully`);
                return true;
            } catch (error) {
                console.error('Error importing data:', error);
                return false;
            }
        }
    };
})();

// Initialize when the script loads
UserDataManager.init();

// Make it globally available
window.UserDataManager = UserDataManager;
