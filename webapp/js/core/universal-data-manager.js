/**
 * Universal Data Manager for 5ive Trackr
 * Provides centralized data management across all pages
 * Original code only - no third-party dependencies
 */

class UniversalDataManager {
    constructor() {
        // Use shared API configuration if available, otherwise fall back to manual detection
        if (window.sharedApiConfig) {
            this.apiBase = window.sharedApiConfig.getBaseUrl();
            console.log('📡 Using SharedApiConfig for UniversalDataManager:', this.apiBase);
        } else {
            // Fallback method if shared config not loaded
            this.apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:8080/api'  // Local proxy server
                : 'https://five-trackr-yq6ly.ondigitalocean.app/api';  // Production Python server
            console.log('⚠️ Fallback API detection for UniversalDataManager:', this.apiBase);
        }
        this.cache = new Map();
        this.currentUser = null;
        this.isInitialized = false;
    }
    
    // === INITIALIZATION ===
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.getCurrentUser();
            this.isInitialized = true;
            console.log('UniversalDataManager initialized');
        } catch (error) {
            console.warn('Failed to initialize UniversalDataManager:', error);
        }
    }
    
    // === USER AUTHENTICATION ===
    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        try {
            // Use JWT token from localStorage
            const token = localStorage.getItem('auth_token');
            if (!token) return null;
            
            const response = await fetch(`${this.apiBase}/auth/check-session`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.valid) {
                    this.currentUser = result.user;
                    return this.currentUser;
                }
            }
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
        return null;
    }
    
    async setCurrentUser(user) {
        this.currentUser = user;
        this.clearCache();
    }
    
    // === UNIVERSAL DATA OPERATIONS ===
    async getUserData(userId = null) {
        if (!userId) {
            const user = await this.getCurrentUser();
            userId = user?.id;
        }
        
        if (!userId) throw new Error('No user ID available');
        
        // Check cache first
        const cacheKey = `user_${userId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`${this.apiBase}/data/user/${userId}`);
            if (response.ok) {
                const result = await response.json();
                const userData = result.userData || result.data;
                this.cache.set(cacheKey, userData);
                return userData;
            }
            throw new Error('Failed to fetch user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }
    
    async updateUserData(dataType, data, action = 'replace', userId = null) {
        if (!userId) {
            const user = await this.getCurrentUser();
            userId = user?.id;
        }
        
        if (!userId) throw new Error('No user ID available');
        
        try {
            const response = await fetch(`${this.apiBase}/data/user/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataType, data, action })
            });
            
            if (response.ok) {
                const result = await response.json();
                const userData = result.userData;
                this.cache.set(`user_${userId}`, userData);
                
                // Dispatch custom event for UI updates
                this.dispatchDataUpdateEvent(userId, dataType, action, data);
                
                return userData;
            }
            throw new Error('Failed to update user data');
        } catch (error) {
            console.error('Error updating user data:', error);
            throw error;
        }
    }
    
    // === SPECIFIC DATA TYPE METHODS ===
    
    // Pitches Management
    async getPitches(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.pitches || [];
    }
    
    async addPitch(pitchData, userId = null) {
        // Ensure pitch has required fields
        const pitch = {
            id: pitchData.id || 'pitch_' + Date.now(),
            name: pitchData.name || 'New Pitch',
            location: pitchData.location || '',
            surface: pitchData.surface || 'Grass',
            capacity: pitchData.capacity || 0,
            facilities: pitchData.facilities || [],
            createdAt: new Date().toISOString(),
            ...pitchData
        };
        
        return await this.updateUserData('pitches', pitch, 'append', userId);
    }
    
    async updatePitch(pitchData, userId = null) {
        return await this.updateUserData('pitches', pitchData, 'update', userId);
    }
    
    async deletePitch(pitchId, userId = null) {
        return await this.updateUserData('pitches', { id: pitchId }, 'delete', userId);
    }
    
    // Teams Management
    async getTeams(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.teams || [];
    }
    
    async addTeam(teamData, userId = null) {
        const team = {
            id: teamData.id || 'team_' + Date.now(),
            name: teamData.name || 'New Team',
            league: teamData.league || '',
            manager: teamData.manager || '',
            players: teamData.players || [],
            homeGround: teamData.homeGround || '',
            createdAt: new Date().toISOString(),
            ...teamData
        };
        
        return await this.updateUserData('teams', team, 'append', userId);
    }
    
    async updateTeam(teamData, userId = null) {
        return await this.updateUserData('teams', teamData, 'update', userId);
    }
    
    async deleteTeam(teamId, userId = null) {
        return await this.updateUserData('teams', { id: teamId }, 'delete', userId);
    }
    
    // Leagues Management
    async getLeagues(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.leagues || [];
    }
    
    async addLeague(leagueData, userId = null) {
        const league = {
            id: leagueData.id || 'league_' + Date.now(),
            name: leagueData.name || 'New League',
            season: leagueData.season || new Date().getFullYear(),
            division: leagueData.division || 'Open',
            teams: leagueData.teams || [],
            fixtures: leagueData.fixtures || [],
            standings: leagueData.standings || [],
            createdAt: new Date().toISOString(),
            ...leagueData
        };
        
        return await this.updateUserData('leagues', league, 'append', userId);
    }
    
    async updateLeague(leagueData, userId = null) {
        return await this.updateUserData('leagues', leagueData, 'update', userId);
    }
    
    async deleteLeague(leagueId, userId = null) {
        return await this.updateUserData('leagues', { id: leagueId }, 'delete', userId);
    }
    
    // Fixtures Management
    async getFixtures(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.fixtures || [];
    }
    
    async addFixture(fixtureData, userId = null) {
        const fixture = {
            id: fixtureData.id || 'fixture_' + Date.now(),
            homeTeam: fixtureData.homeTeam || '',
            awayTeam: fixtureData.awayTeam || '',
            date: fixtureData.date || new Date().toISOString(),
            time: fixtureData.time || '15:00',
            venue: fixtureData.venue || '',
            league: fixtureData.league || '',
            referee: fixtureData.referee || '',
            status: fixtureData.status || 'scheduled',
            result: fixtureData.result || null,
            createdAt: new Date().toISOString(),
            ...fixtureData
        };
        
        return await this.updateUserData('fixtures', fixture, 'append', userId);
    }
    
    async updateFixture(fixtureData, userId = null) {
        return await this.updateUserData('fixtures', fixtureData, 'update', userId);
    }
    
    async deleteFixture(fixtureId, userId = null) {
        return await this.updateUserData('fixtures', { id: fixtureId }, 'delete', userId);
    }
    
    // Referees Management
    async getReferees(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.referees || [];
    }
    
    async addReferee(refereeData, userId = null) {
        const referee = {
            id: refereeData.id || 'referee_' + Date.now(),
            name: refereeData.name || 'New Referee',
            email: refereeData.email || '',
            phone: refereeData.phone || '',
            qualification: refereeData.qualification || '',
            availability: refereeData.availability || [],
            assignedMatches: refereeData.assignedMatches || [],
            createdAt: new Date().toISOString(),
            ...refereeData
        };
        
        return await this.updateUserData('referees', referee, 'append', userId);
    }
    
    async updateReferee(refereeData, userId = null) {
        return await this.updateUserData('referees', refereeData, 'update', userId);
    }
    
    async deleteReferee(refereeId, userId = null) {
        return await this.updateUserData('referees', { id: refereeId }, 'delete', userId);
    }
    
    // Results Management
    async getResults(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.results || [];
    }
    
    async addResult(resultData, userId = null) {
        const result = {
            id: resultData.id || 'result_' + Date.now(),
            fixtureId: resultData.fixtureId || '',
            homeScore: resultData.homeScore || 0,
            awayScore: resultData.awayScore || 0,
            events: resultData.events || [],
            referee: resultData.referee || '',
            date: resultData.date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            ...resultData
        };
        
        return await this.updateUserData('results', result, 'append', userId);
    }
    
    // Bookings Management
    async getBookings(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.bookings || [];
    }
    
    async addBooking(bookingData, userId = null) {
        const booking = {
            id: bookingData.id || 'booking_' + Date.now(),
            pitchId: bookingData.pitchId || '',
            date: bookingData.date || new Date().toISOString(),
            startTime: bookingData.startTime || '09:00',
            endTime: bookingData.endTime || '10:00',
            bookedBy: bookingData.bookedBy || '',
            purpose: bookingData.purpose || 'Match',
            status: bookingData.status || 'confirmed',
            createdAt: new Date().toISOString(),
            ...bookingData
        };
        
        return await this.updateUserData('bookings', booking, 'append', userId);
    }
    
    // Reports Management
    async getReports(userId = null) {
        const userData = await this.getUserData(userId);
        return userData.applicationData?.reports || [];
    }
    
    async addReport(reportData, userId = null) {
        const report = {
            id: reportData.id || 'report_' + Date.now(),
            type: reportData.type || 'match',
            title: reportData.title || 'New Report',
            content: reportData.content || '',
            author: reportData.author || '',
            date: reportData.date || new Date().toISOString(),
            relatedIds: reportData.relatedIds || [],
            status: reportData.status || 'draft',
            createdAt: new Date().toISOString(),
            ...reportData
        };
        
        return await this.updateUserData('reports', report, 'append', userId);
    }
    
    // === ADMIN FUNCTIONS ===
    async getAllUsers() {
        try {
            const response = await fetch(`${this.apiBase}/data/users`);
            if (response.ok) {
                const result = await response.json();
                return result.users || result;
            }
            throw new Error('Failed to fetch all users');
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }
    
    async bulkUpdate(operations) {
        try {
            const response = await fetch(`${this.apiBase}/data/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operations })
            });
            
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Bulk update failed');
        } catch (error) {
            console.error('Error in bulk update:', error);
            throw error;
        }
    }
    
    // === UTILITY METHODS ===
    clearCache() {
        this.cache.clear();
        console.log('Data cache cleared');
    }
    
    getCachedData(key) {
        return this.cache.get(key);
    }
    
    // Event system for UI updates
    dispatchDataUpdateEvent(userId, dataType, action, data) {
        const event = new CustomEvent('dataManagerUpdate', {
            detail: {
                userId,
                dataType,
                action,
                data,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }
    
    // Listen for data updates
    onDataUpdate(callback) {
        window.addEventListener('dataManagerUpdate', callback);
    }
    
    // Statistics and insights
    async getDataStatistics(userId = null) {
        try {
            const userData = await this.getUserData(userId);
            const appData = userData.applicationData || {};
            
            return {
                pitches: (appData.pitches || []).length,
                teams: (appData.teams || []).length,
                leagues: (appData.leagues || []).length,
                fixtures: (appData.fixtures || []).length,
                referees: (appData.referees || []).length,
                results: (appData.results || []).length,
                bookings: (appData.bookings || []).length,
                reports: (appData.reports || []).length,
                totalDataSize: this.calculateDataSize(userData),
                lastSync: userData.statistics?.lastSync || null
            };
        } catch (error) {
            console.error('Error getting data statistics:', error);
            return {};
        }
    }
    
    calculateDataSize(data) {
        try {
            const jsonString = JSON.stringify(data);
            return Math.round(jsonString.length / 1024 * 100) / 100; // KB
        } catch (e) {
            return 0;
        }
    }
    
    // Data validation helpers
    validatePitchData(pitchData) {
        const required = ['name'];
        return required.every(field => pitchData[field] && pitchData[field].trim());
    }
    
    validateTeamData(teamData) {
        const required = ['name'];
        return required.every(field => teamData[field] && teamData[field].trim());
    }
    
    validateLeagueData(leagueData) {
        const required = ['name'];
        return required.every(field => leagueData[field] && leagueData[field].trim());
    }
    
    validateFixtureData(fixtureData) {
        const required = ['homeTeam', 'awayTeam', 'date'];
        return required.every(field => fixtureData[field] && fixtureData[field].toString().trim());
    }
    
    validateRefereeData(refereeData) {
        const required = ['name'];
        return required.every(field => refereeData[field] && refereeData[field].trim());
    }
}

// Global instance - automatically initialize when available
let dataManagerInstance = null;

function getDataManager() {
    if (!dataManagerInstance) {
        dataManagerInstance = new UniversalDataManager();
        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                dataManagerInstance.initialize();
            });
        } else {
            dataManagerInstance.initialize();
        }
    }
    return dataManagerInstance;
}

// Create global instance
window.DataManager = getDataManager();

// Also export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalDataManager;
}

console.log('Universal Data Manager loaded successfully');
