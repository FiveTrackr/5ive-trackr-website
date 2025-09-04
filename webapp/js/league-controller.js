/**
 * 5ive Trackr League Controller
 * 
 * Handles the league dashboard interface for managing teams, fixtures,
 * standings, and other league-specific functionality
 * 
 * @copyright 5ive Trackr 2025
 */

// League Controller
class LeagueController {
    /**
     * Initialize the league controller
     */
    constructor() {
        // Store references to key elements
        this.elements = {
            leagueHeader: document.getElementById('leagueHeader'),
            leagueInfo: document.getElementById('leagueInfo'),
            teamsTableBody: document.getElementById('teamsTableBody'),
            teamsCount: document.getElementById('teamsCount'),
            playersCount: document.getElementById('playersCount'),
            matchesCount: document.getElementById('matchesCount'),
            goalsCount: document.getElementById('goalsCount'),
            fixturesList: document.getElementById('fixturesList'),
            standingsTableBody: document.getElementById('standingsTableBody'),
            addTeamBtn: document.getElementById('addTeamBtn'),
            addTeamBtnTab: document.getElementById('addTeamBtnTab'),
            addTeamModal: document.getElementById('addTeamModal'),
            addTeamForm: document.getElementById('addTeamForm'),
            saveTeamBtn: document.getElementById('saveTeamBtn'),
            addFixtureBtn: document.getElementById('addFixtureBtn'),
            createFixturesBtn: document.getElementById('createFixturesBtn'),
            createFixturesBtn2: document.getElementById('createFixturesBtn2'),
            addMatchModal: document.getElementById('addMatchModal'),
            addMatchForm: document.getElementById('addMatchForm'),
            saveMatchBtn: document.getElementById('saveMatchBtn'),
            modalContainer: document.getElementById('modalContainer'),
            upcomingMatches: document.getElementById('upcomingMatches'),
            topTeams: document.getElementById('topTeams')
        };
        
        // Initialize the data manager
        this.dataManager = new DataManager();
        
        // Current user from session
        this.currentUser = null;
        
        // Current league ID and data
        this.leagueId = this.getLeagueIdFromUrl();
        this.leagueData = null;
        
        // Check authentication
        this.checkAuthentication();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load league data
        this.loadLeagueData();
    }
    
    /**
     * Get league ID from URL query parameter
     * @returns {string} League ID or null if not found
     */
    getLeagueIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
    
    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        // Check for SessionManager
        if (window.SessionManager && typeof SessionManager.isLoggedIn === 'function') {
            if (!SessionManager.isLoggedIn()) {
                // Not logged in, redirect to login
                window.location.href = 'home.html';
                return;
            }
            
            this.currentUser = SessionManager.getCurrentUser();
            console.log('User authenticated:', this.currentUser);
            
            // Update last activity
            if (typeof SessionManager.updateActivity === 'function') {
                SessionManager.updateActivity();
            }
        } else {
            console.warn('SessionManager not found, authentication check skipped');
            // For development, create a mock user if no SessionManager
            this.currentUser = {
                id: 'dev_user',
                username: 'developer',
                role: 'admin',
                name: 'Developer User'
            };
        }
        
        // Update UI with user info
        this.updateUserInfo();
    }
    
    /**
     * Update UI with user information
     */
    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Update user name
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.name || this.currentUser.username;
        });
        
        // Update user role badge if exists
        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            userRoleElement.textContent = this.formatRole(this.currentUser.role);
        }
        
        // Update user menu email if exists
        const userEmailElement = document.querySelector('.user-menu-header .text-small');
        if (userEmailElement && this.currentUser.email) {
            userEmailElement.textContent = this.currentUser.email;
        }
    }
    
    /**
     * Format role name for display
     * @param {string} role - Role name
     * @returns {string} Formatted role name
     */
    formatRole(role) {
        if (!role) return '';
        return role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Modal close buttons
        const modalCloseButtons = document.querySelectorAll('.modal-close, [data-action="close"]');
        modalCloseButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });
        
        // Add team buttons
        if (this.elements.addTeamBtn) {
            this.elements.addTeamBtn.addEventListener('click', () => this.openAddTeamModal());
        }
        
        if (this.elements.addTeamBtnTab) {
            this.elements.addTeamBtnTab.addEventListener('click', () => this.openAddTeamModal());
        }
        
        // Save team button
        if (this.elements.saveTeamBtn) {
            this.elements.saveTeamBtn.addEventListener('click', () => this.addTeam());
        }
        
        // Add fixture button
        if (this.elements.addFixtureBtn) {
            this.elements.addFixtureBtn.addEventListener('click', () => this.openAddMatchModal());
        }
        
        // Create fixtures buttons
        if (this.elements.createFixturesBtn) {
            this.elements.createFixturesBtn.addEventListener('click', () => this.generateFixtures());
        }
        
        if (this.elements.createFixturesBtn2) {
            this.elements.createFixturesBtn2.addEventListener('click', () => this.generateFixtures());
        }
        
        // Save match button
        if (this.elements.saveMatchBtn) {
            this.elements.saveMatchBtn.addEventListener('click', () => this.addMatch());
        }
        
        // Handle modal container click (close when clicking outside)
        if (this.elements.modalContainer) {
            this.elements.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.elements.modalContainer) {
                    this.closeModal();
                }
            });
        }
        
        // Logout button
        const logoutButton = document.querySelector('.logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }
    }
    
    /**
     * Handle user logout
     */
    handleLogout() {
        // Use SessionManager if available
        if (window.SessionManager && typeof SessionManager.logout === 'function') {
            SessionManager.logout();
        } else {
            // Fallback logout logic - account for subdirectory path
            localStorage.removeItem('fivetrackr_session');
            window.location.href = '../../home.html';
        }
    }
    
    /**
     * Load league data
     */
    async loadLeagueData() {
        try {
            if (!this.leagueId) {
                this.showError('League ID is missing. Please go back to the dashboard.');
                return;
            }
            
            // Get league data
            const result = await this.dataManager.findById('league', this.leagueId);
            
            if (!result.data) {
                this.showError('League not found. Please go back to the dashboard.');
                return;
            }
            
            this.leagueData = result.data;
            
            // Update UI
            this.updateLeagueHeader();
            this.updateLeagueInfo();
            
            // Load related data
            await Promise.all([
                this.loadTeams(),
                this.loadFixtures()
            ]);
            
            // Calculate and update standings
            this.calculateStandings();
            
        } catch (error) {
            console.error('Error loading league data:', error);
            this.showError(`Failed to load league data: ${error.message || 'Unknown error'}`);
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (window.DashboardLayout) {
            DashboardLayout.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
    
    /**
     * Update league header with league name
     */
    updateLeagueHeader() {
        if (!this.leagueData) return;
        
        // Update page title
        document.title = `${this.leagueData.name} - 5ive Trackr`;
        
        // Update breadcrumb league name
        const leagueName = document.getElementById('leagueName');
        if (leagueName) {
            leagueName.textContent = this.leagueData.name;
        }
        
        // Update league header
        if (this.elements.leagueHeader) {
            this.elements.leagueHeader.innerHTML = `
                <h1>${this.leagueData.name}</h1>
                ${this.leagueData.description ? `<p>${this.leagueData.description}</p>` : ''}
            `;
        }
    }
    
    /**
     * Update league information
     */
    updateLeagueInfo() {
        if (!this.leagueData || !this.elements.leagueInfo) return;
        
        // Calculate league status
        const now = new Date();
        const seasonStart = new Date(this.leagueData.seasonStart);
        const seasonEnd = new Date(this.leagueData.seasonEnd);
        
        let status = '';
        if (now < seasonStart) {
            status = `<span class="badge badge-info">Upcoming</span>`;
        } else if (now > seasonEnd) {
            status = `<span class="badge badge-secondary">Completed</span>`;
        } else {
            status = `<span class="badge badge-success">Active</span>`;
        }
        
        // Format season dates
        const seasonDates = `${this.formatDate(seasonStart)} - ${this.formatDate(seasonEnd)}`;
        
        // Create league info HTML
        this.elements.leagueInfo.innerHTML = `
            <div class="info-list">
                <div class="info-item">
                    <div class="info-label">Season</div>
                    <div class="info-value">${seasonDates}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">${status}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Format</div>
                    <div class="info-value">${this.leagueData.playersPerTeam}-a-side</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Teams</div>
                    <div class="info-value">${this.leagueData.maxTeams} max</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Match Duration</div>
                    <div class="info-value">${this.leagueData.matchDuration} minutes</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Half-Time</div>
                    <div class="info-value">${this.leagueData.halfTimeDuration} minutes</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Substitutes</div>
                    <div class="info-value">${this.leagueData.substitutesAllowed ? 'Allowed' : 'Not Allowed'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Points System</div>
                    <div class="info-value">${this.leagueData.pointsForWin}-${this.leagueData.pointsForDraw}-${this.leagueData.pointsForLoss}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }
    
    /**
     * Load teams for this league
     */
    async loadTeams() {
        try {
            // Get teams for this league
            const result = await this.dataManager.read('team', { leagueId: this.leagueId });
            
            // Update counts
            if (this.elements.teamsCount) {
                this.elements.teamsCount.textContent = result.data.length;
            }
            
            // Render teams
            this.renderTeams(result.data);
            
            // Calculate total players
            const totalPlayers = result.data.reduce((sum, team) => {
                return sum + (team.players ? team.players.length : 0);
            }, 0);
            
            // Update players count
            if (this.elements.playersCount) {
                this.elements.playersCount.textContent = totalPlayers;
            }
            
            // Populate teams in match form
            this.populateTeamsInMatchForm(result.data);
            
            return result.data;
        } catch (error) {
            console.error('Error loading teams:', error);
            throw error;
        }
    }
    
    /**
     * Render teams in the table
     * @param {Array} teams - Array of team objects
     */
    renderTeams(teams) {
        // Check if the teams table body exists
        if (!this.elements.teamsTableBody) return;
        
        // Clear existing content
        this.elements.teamsTableBody.innerHTML = '';
        
        if (teams.length === 0) {
            // No teams found
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="empty-state">
                    <div>No teams added to this league yet.</div>
                </td>
            `;
            this.elements.teamsTableBody.appendChild(emptyRow);
            return;
        }
        
        // Add each team to the table
        teams.forEach(team => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <div class="team-name" style="border-left-color: ${team.color || '#3498db'}">
                        <strong>${team.name}</strong>
                    </div>
                </td>
                <td>${team.players ? team.players.length : 0}</td>
                <td>${team.captain || '-'}</td>
                <td>${team.played || 0}</td>
                <td>${team.points || 0}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary view-team" data-id="${team.id}">View</button>
                    <button class="btn btn-sm btn-secondary edit-team" data-id="${team.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-team" data-id="${team.id}">Delete</button>
                </td>
            `;
            
            this.elements.teamsTableBody.appendChild(row);
            
            // Add event listeners to buttons
            const viewButton = row.querySelector('.view-team');
            if (viewButton) {
                viewButton.addEventListener('click', () => this.viewTeam(team.id));
            }
            
            const editButton = row.querySelector('.edit-team');
            if (editButton) {
                editButton.addEventListener('click', () => this.editTeam(team.id));
            }
            
            const deleteButton = row.querySelector('.delete-team');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => this.confirmDeleteTeam(team.id, team.name));
            }
        });
        
        // Update top teams in overview
        this.updateTopTeams(teams);
    }
    
    /**
     * Update top teams section in overview
     * @param {Array} teams - Array of team objects
     */
    updateTopTeams(teams) {
        if (!this.elements.topTeams || teams.length === 0) return;
        
        // Sort teams by points
        const sortedTeams = [...teams].sort((a, b) => {
            // Sort by points, then by goal difference
            if ((b.points || 0) !== (a.points || 0)) {
                return (b.points || 0) - (a.points || 0);
            }
            
            const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
            const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
            
            return bGD - aGD;
        });
        
        // Take top 5 teams
        const topTeams = sortedTeams.slice(0, 5);
        
        // Create HTML
        let html = '';
        
        if (teams.length === 0) {
            html = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No Teams Added</h3>
                    <p>Add teams to the league to see standings.</p>
                    <button class="btn btn-primary mt-3" id="addTeamBtnEmpty">Add Team</button>
                </div>
            `;
        } else {
            html = `
                <table class="table standings-table mini">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>P</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topTeams.map((team, index) => `
                            <tr>
                                <td>
                                    <div class="team-name" style="border-left-color: ${team.color || '#3498db'}">
                                        ${index + 1}. ${team.name}
                                    </div>
                                </td>
                                <td>${team.played || 0}</td>
                                <td>${team.won || 0}</td>
                                <td>${team.drawn || 0}</td>
                                <td>${team.lost || 0}</td>
                                <td><strong>${team.points || 0}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="text-center mt-3">
                    <a href="#standings" class="btn btn-text" data-tab="standings">View Full Table</a>
                </div>
            `;
        }
        
        this.elements.topTeams.innerHTML = html;
        
        // Add event listener to empty state button
        const emptyStateBtn = document.getElementById('addTeamBtnEmpty');
        if (emptyStateBtn) {
            emptyStateBtn.addEventListener('click', () => this.openAddTeamModal());
        }
        
        // Add event listener to tab link
        const tabLink = this.elements.topTeams.querySelector('[data-tab]');
        if (tabLink) {
            tabLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                const tabId = tabLink.getAttribute('data-tab');
                const tab = document.querySelector(`.league-nav a[data-tab="${tabId}"]`);
                
                if (tab) {
                    tab.click();
                }
            });
        }
    }
    
    /**
     * Load fixtures for this league
     */
    async loadFixtures() {
        try {
            // Get fixtures for this league
            const result = await this.dataManager.read('match', { leagueId: this.leagueId });
            
            // Update counts
            if (this.elements.matchesCount) {
                this.elements.matchesCount.textContent = result.data.length;
            }
            
            // Count goals
            let totalGoals = 0;
            result.data.forEach(match => {
                if (match.homeGoals !== undefined && match.homeGoals !== null) {
                    totalGoals += match.homeGoals;
                }
                
                if (match.awayGoals !== undefined && match.awayGoals !== null) {
                    totalGoals += match.awayGoals;
                }
            });
            
            // Update goals count
            if (this.elements.goalsCount) {
                this.elements.goalsCount.textContent = totalGoals;
            }
            
            // Render fixtures
            this.renderFixtures(result.data);
            
            // Render upcoming matches
            this.renderUpcomingMatches(result.data);
            
            return result.data;
        } catch (error) {
            console.error('Error loading fixtures:', error);
            throw error;
        }
    }
    
    /**
     * Render fixtures in the list
     * @param {Array} fixtures - Array of match objects
     */
    renderFixtures(fixtures) {
        // Check if the fixtures list exists
        if (!this.elements.fixturesList) return;
        
        // Clear existing content
        this.elements.fixturesList.innerHTML = '';
        
        if (fixtures.length === 0) {
            // No fixtures found
            this.elements.fixturesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <h3>No Fixtures Added</h3>
                    <p>Add teams to the league and generate fixtures.</p>
                </div>
            `;
            return;
        }
        
        // Sort fixtures by date
        const sortedFixtures = [...fixtures].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
        
        // Group fixtures by date
        const fixturesByDate = sortedFixtures.reduce((groups, match) => {
            const dateKey = new Date(match.date).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(match);
            return groups;
        }, {});
        
        // Create HTML for each date group
        Object.entries(fixturesByDate).forEach(([dateKey, matches]) => {
            const dateHeading = document.createElement('div');
            dateHeading.className = 'fixture-date';
            dateHeading.textContent = this.formatFixtureDate(new Date(dateKey));
            
            this.elements.fixturesList.appendChild(dateHeading);
            
            // Create fixtures list for this date
            const fixturesGroup = document.createElement('div');
            fixturesGroup.className = 'fixtures-group';
            
            matches.forEach(match => {
                const fixture = document.createElement('div');
                fixture.className = 'fixture-item';
                
                let resultClass = '';
                let resultText = '';
                
                if (match.completed) {
                    resultClass = 'completed';
                    resultText = `${match.homeGoals} - ${match.awayGoals}`;
                } else {
                    const matchTime = new Date(match.date);
                    resultText = matchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                
                fixture.innerHTML = `
                    <div class="fixture-teams">
                        <div class="fixture-team home">${match.homeTeamName}</div>
                        <div class="fixture-result ${resultClass}">${resultText}</div>
                        <div class="fixture-team away">${match.awayTeamName}</div>
                    </div>
                    <div class="fixture-venue">${match.venue || 'TBD'}</div>
                    <div class="fixture-actions">
                        <button class="btn btn-sm btn-primary record-result" data-id="${match.id}">
                            ${match.completed ? 'Edit Result' : 'Record Result'}
                        </button>
                    </div>
                `;
                
                fixturesGroup.appendChild(fixture);
                
                // Add event listener to record result button
                const recordButton = fixture.querySelector('.record-result');
                if (recordButton) {
                    recordButton.addEventListener('click', () => this.recordResult(match.id));
                }
            });
            
            this.elements.fixturesList.appendChild(fixturesGroup);
        });
    }
    
    /**
     * Render upcoming matches in the overview section
     * @param {Array} fixtures - Array of match objects
     */
    renderUpcomingMatches(fixtures) {
        if (!this.elements.upcomingMatches) return;
        
        // Get current date
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // Filter upcoming matches
        const upcomingMatches = fixtures.filter(match => {
            const matchDate = new Date(match.date);
            matchDate.setHours(0, 0, 0, 0);
            
            return !match.completed && matchDate >= now;
        });
        
        // Sort by date (closest first)
        upcomingMatches.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Take only next 3 matches
        const nextMatches = upcomingMatches.slice(0, 3);
        
        // Create HTML
        if (nextMatches.length === 0) {
            this.elements.upcomingMatches.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <h3>No Upcoming Matches</h3>
                    <p>Add teams to the league to generate fixtures.</p>
                    <button class="btn btn-primary mt-3" id="createFixturesBtnEmpty">Create Fixtures</button>
                </div>
            `;
            
            // Add event listener to empty state button
            const emptyStateBtn = document.getElementById('createFixturesBtnEmpty');
            if (emptyStateBtn) {
                emptyStateBtn.addEventListener('click', () => this.generateFixtures());
            }
        } else {
            let html = `<div class="upcoming-matches-list">`;
            
            nextMatches.forEach(match => {
                const matchDate = new Date(match.date);
                const dateString = this.formatFixtureDate(matchDate);
                const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                html += `
                    <div class="upcoming-match">
                        <div class="match-date">${dateString} - ${timeString}</div>
                        <div class="match-teams">
                            <span class="team home">${match.homeTeamName}</span>
                            <span class="vs">vs</span>
                            <span class="team away">${match.awayTeamName}</span>
                        </div>
                        <div class="match-venue">${match.venue || 'TBD'}</div>
                    </div>
                `;
            });
            
            html += `
                </div>
                <div class="text-center mt-3">
                    <a href="#fixtures" class="btn btn-text" data-tab="fixtures">View All Fixtures</a>
                </div>
            `;
            
            this.elements.upcomingMatches.innerHTML = html;
            
            // Add event listener to tab link
            const tabLink = this.elements.upcomingMatches.querySelector('[data-tab]');
            if (tabLink) {
                tabLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const tabId = tabLink.getAttribute('data-tab');
                    const tab = document.querySelector(`.league-nav a[data-tab="${tabId}"]`);
                    
                    if (tab) {
                        tab.click();
                    }
                });
            }
        }
    }
    
    /**
     * Format fixture date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatFixtureDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        // Get today and tomorrow for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format date based on whether it's today, tomorrow, or another day
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            const options = { weekday: 'long', month: 'short', day: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    }
    
    /**
     * Calculate and update standings
     */
    calculateStandings() {
        // TODO: Implement standings calculation based on matches
        console.log('Standings calculation to be implemented');
    }
    
    /**
     * Open add team modal
     */
    openAddTeamModal() {
        // Show the modal
        this.openModal(this.elements.addTeamModal);
    }
    
    /**
     * Add a new team to the league
     */
    async addTeam() {
        try {
            // Get form data
            const formData = new FormData(this.elements.addTeamForm);
            
            // Create team object
            const team = {
                name: formData.get('teamName'),
                color: formData.get('teamColor'),
                captain: formData.get('captainName'),
                captainContact: formData.get('captainContact'),
                leagueId: this.leagueId,
                players: [],
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
                createdBy: this.currentUser.id
            };
            
            // Validate form data
            if (!team.name) {
                throw new Error('Team name is required');
            }
            
            // Save team
            const result = await this.dataManager.create('team', team);
            
            // Show success notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Team "${team.name}" added to the league!`,
                    'success'
                );
            }
            
            // Close modal
            this.closeModal();
            
            // Reset form
            this.elements.addTeamForm.reset();
            
            // Refresh teams list
            await this.loadTeams();
        } catch (error) {
            console.error('Error adding team:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to add team: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * View team details
     * @param {string} teamId - ID of the team to view
     */
    viewTeam(teamId) {
        // TODO: Implement team details view
        console.log('View team:', teamId);
        
        // For now, show a notification
        if (window.DashboardLayout) {
            DashboardLayout.showNotification(
                'Team details view will be implemented in the next phase.',
                'info'
            );
        }
    }
    
    /**
     * Edit team
     * @param {string} teamId - ID of the team to edit
     */
    editTeam(teamId) {
        // TODO: Implement edit team functionality
        console.log('Edit team:', teamId);
        
        // For now, show a notification
        if (window.DashboardLayout) {
            DashboardLayout.showNotification(
                'Team edit functionality will be implemented in the next phase.',
                'info'
            );
        }
    }
    
    /**
     * Confirm team deletion
     * @param {string} teamId - ID of the team to delete
     * @param {string} teamName - Name of the team for confirmation message
     */
    confirmDeleteTeam(teamId, teamName) {
        // For now, just confirm with a browser dialog
        const confirmDelete = confirm(`Are you sure you want to delete the team "${teamName}"?`);
        
        if (confirmDelete) {
            this.deleteTeam(teamId);
        }
    }
    
    /**
     * Delete a team
     * @param {string} teamId - ID of the team to delete
     */
    async deleteTeam(teamId) {
        try {
            // Delete team
            const result = await this.dataManager.delete('team', teamId);
            
            // Show success notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Team deleted successfully!`,
                    'success'
                );
            }
            
            // Refresh teams list
            await this.loadTeams();
        } catch (error) {
            console.error('Error deleting team:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to delete team: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * Open add match modal
     */
    openAddMatchModal() {
        // Reset form
        if (this.elements.addMatchForm) {
            this.elements.addMatchForm.reset();
        }
        
        // Set default date to today
        const dateInput = document.getElementById('matchDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
        
        // Show the modal
        this.openModal(this.elements.addMatchModal);
    }
    
    /**
     * Populate teams in match form select elements
     * @param {Array} teams - Array of team objects
     */
    populateTeamsInMatchForm(teams) {
        const homeTeamSelect = document.getElementById('homeTeam');
        const awayTeamSelect = document.getElementById('awayTeam');
        
        if (!homeTeamSelect || !awayTeamSelect) return;
        
        // Clear existing options (except the placeholder)
        while (homeTeamSelect.options.length > 1) {
            homeTeamSelect.options.remove(1);
        }
        
        while (awayTeamSelect.options.length > 1) {
            awayTeamSelect.options.remove(1);
        }
        
        // Add team options
        teams.forEach(team => {
            const homeOption = document.createElement('option');
            homeOption.value = team.id;
            homeOption.textContent = team.name;
            homeTeamSelect.appendChild(homeOption);
            
            const awayOption = document.createElement('option');
            awayOption.value = team.id;
            awayOption.textContent = team.name;
            awayTeamSelect.appendChild(awayOption);
        });
    }
    
    /**
     * Add a new match to the league
     */
    async addMatch() {
        try {
            // Get form data
            const formData = new FormData(this.elements.addMatchForm);
            
            const homeTeamId = formData.get('homeTeam');
            const awayTeamId = formData.get('awayTeam');
            const matchDate = formData.get('matchDate');
            const matchTime = formData.get('matchTime');
            
            // Validate form data
            if (!homeTeamId || !awayTeamId) {
                throw new Error('Please select both teams');
            }
            
            if (homeTeamId === awayTeamId) {
                throw new Error('Home and away teams must be different');
            }
            
            if (!matchDate || !matchTime) {
                throw new Error('Please set match date and time');
            }
            
            // Find team names
            const homeTeam = await this.dataManager.findById('team', homeTeamId);
            const awayTeam = await this.dataManager.findById('team', awayTeamId);
            
            if (!homeTeam.data || !awayTeam.data) {
                throw new Error('Teams not found');
            }
            
            // Combine date and time
            const dateTimeString = `${matchDate}T${matchTime}:00`;
            
            // Create match object
            const match = {
                leagueId: this.leagueId,
                homeTeamId: homeTeamId,
                homeTeamName: homeTeam.data.name,
                awayTeamId: awayTeamId,
                awayTeamName: awayTeam.data.name,
                date: dateTimeString,
                venue: formData.get('venue') || 'TBD',
                referee: formData.get('referee') || 'TBD',
                completed: false,
                createdBy: this.currentUser.id
            };
            
            // Save match
            const result = await this.dataManager.create('match', match);
            
            // Show success notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Match added to the league!`,
                    'success'
                );
            }
            
            // Close modal
            this.closeModal();
            
            // Refresh fixtures list
            await this.loadFixtures();
        } catch (error) {
            console.error('Error adding match:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to add match: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * Generate fixtures for the league
     */
    async generateFixtures() {
        try {
            // Get teams for this league
            const teamsResult = await this.dataManager.read('team', { leagueId: this.leagueId });
            const teams = teamsResult.data;
            
            if (teams.length < 2) {
                throw new Error('Need at least 2 teams to generate fixtures');
            }
            
            // For now, just show a notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    'Fixture generation will be implemented in the next phase.',
                    'info'
                );
            }
        } catch (error) {
            console.error('Error generating fixtures:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to generate fixtures: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * Record result for a match
     * @param {string} matchId - ID of the match to record result for
     */
    async recordResult(matchId) {
        try {
            // For now, just show a notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    'Match result recording will be implemented in the next phase.',
                    'info'
                );
            }
        } catch (error) {
            console.error('Error recording result:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to record result: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * Open a modal
     * @param {HTMLElement} modal - The modal element to open
     */
    openModal(modal) {
        if (!modal || !this.elements.modalContainer) return;
        
        // Hide all other modals
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(m => {
            m.style.display = 'none';
        });
        
        // Show this modal
        modal.style.display = 'flex';
        
        // Show the container
        this.elements.modalContainer.classList.remove('hidden');
    }
    
    /**
     * Close the active modal
     */
    closeModal() {
        if (!this.elements.modalContainer) return;
        this.elements.modalContainer.classList.add('hidden');
    }
}

// Initialize the league controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const leagueController = new LeagueController();
});

// Export controller as global
window.LeagueController = LeagueController;
