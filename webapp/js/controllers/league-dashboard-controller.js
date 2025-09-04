/**
 * 5ive Trackr League Dashboard Controller
 * 
 * Main controller for the league dashboard that integrates all individual controllers
 * 
 * @copyright 5ive Trackr 2025
 */

class LeagueDashboardController {
    /**
     * Initialize the league dashboard controller
     */
    constructor() {
        // Get league ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.leagueId = urlParams.get('id');
        
        // Initialize dependencies
        this.dataManager = new DataManager();
        this.layout = new DashboardLayout();
        
        // DOM elements
        this.leagueNameElement = document.getElementById('league-name');
        this.leagueDescriptionElement = document.getElementById('league-description');
        this.tabs = document.querySelectorAll('.tab');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Initialize controllers
        this.teamController = null;
        this.fixtureController = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize controller
     */
    async init() {
        try {
            // Load current league if ID is provided
            if (this.leagueId) {
                const league = await this.dataManager.getLeague(this.leagueId);
                if (!league) {
                    this.layout.showNotification('League not found', 'error');
                    this.loadDefaultView();
                    return;
                }
                
                // Set league name and description
                if (this.leagueNameElement) {
                    this.leagueNameElement.textContent = league.name;
                }
                
                if (this.leagueDescriptionElement) {
                    this.leagueDescriptionElement.textContent = league.description || '';
                }
            }
            
            // Set up tab navigation
            this.setupTabNavigation();
            
            // Initialize controllers based on active tab
            this.initControllerForActiveTab();
            
        } catch (error) {
            console.error('Error initializing league dashboard:', error);
            this.layout.showNotification('Failed to initialize league dashboard', 'error');
        }
    }
    
    /**
     * Load league by ID
     */
    async loadLeague(leagueId) {
        this.leagueId = leagueId;
        await this.init();
    }
    
    /**
     * Load default view when no league ID is provided
     */
    loadDefaultView() {
        try {
            // Initialize dependencies if not already initialized
            if (!this.dataManager) this.dataManager = new DataManager();
            if (!this.layout) this.layout = new DashboardLayout();
            
            // Update UI to show league list view
            if (this.leagueNameElement) {
                this.leagueNameElement.textContent = 'All Leagues';
            }
            
            if (this.leagueDescriptionElement) {
                this.leagueDescriptionElement.textContent = 'Select a league to view details or create a new one';
            }
            
            // Set up tab navigation
            this.setupTabNavigation();
            
            // Load all leagues into the teams tab for now
            this.loadAllLeagues();
        } catch (error) {
            console.error('Error loading default view:', error);
            if (this.layout) {
                this.layout.showNotification('Failed to load leagues view', 'error');
            }
        }
    }
    
    /**
     * Load all leagues
     */
    async loadAllLeagues() {
        try {
            // Get leagues content area
            const teamsContent = document.getElementById('teams-tab');
            
            if (teamsContent) {
                // Replace content with league list
                teamsContent.innerHTML = `
                    <div class="tab-header">
                        <h3>Your Leagues</h3>
                        <div class="tab-actions">
                            <button class="btn btn-primary" id="create-league-btn">
                                <span class="icon icon-plus"></span> Create New League
                            </button>
                        </div>
                    </div>
                    
                    <div class="tab-content-body">
                        <div class="card">
                            <div class="card-body" id="leagues-list">
                                <p>Loading leagues...</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Load leagues
                const leagues = await this.dataManager.getLeagues();
                const leaguesList = document.getElementById('leagues-list');
                
                if (leagues && leagues.length > 0) {
                    // Create table for leagues
                    let tableHTML = `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>League Name</th>
                                    <th>Teams</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    leagues.forEach(league => {
                        tableHTML += `
                            <tr>
                                <td>${league.name}</td>
                                <td>${league.teams ? league.teams.length : 0}</td>
                                <td>${league.active ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <a href="pages/league-manager/dashboard.html?id=${league.id}" class="btn btn-sm btn-primary">View</a>
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableHTML += `
                            </tbody>
                        </table>
                    `;
                    
                    leaguesList.innerHTML = tableHTML;
                } else {
                    leaguesList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">🏆</div>
                            <h3>No Leagues Found</h3>
                            <p>Create your first league to get started</p>
                            <button class="btn btn-primary" id="empty-create-league-btn">
                                <span class="icon icon-plus"></span> Create League
                            </button>
                        </div>
                    `;
                }
                
                // Add event listeners
                const createLeagueBtn = document.getElementById('create-league-btn');
                const emptyCreateLeagueBtn = document.getElementById('empty-create-league-btn');
                
                if (createLeagueBtn) {
                    createLeagueBtn.addEventListener('click', () => this.showCreateLeagueModal());
                }
                
                if (emptyCreateLeagueBtn) {
                    emptyCreateLeagueBtn.addEventListener('click', () => this.showCreateLeagueModal());
                }
            }
        } catch (error) {
            console.error('Error loading leagues:', error);
            this.layout.showNotification('Failed to load leagues', 'error');
        }
    }
    
    /**
     * Show create league modal
     */
    showCreateLeagueModal() {
        // Implementation will depend on your modal system
        console.log('Show create league modal');
        this.layout.showNotification('Create League feature is coming soon', 'info');
    }
    
    /**
     * Set up tab navigation
     */
    setupTabNavigation() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                this.tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Hide all tab contents
                this.tabContents.forEach(content => content.classList.remove('active'));
                
                // Show corresponding tab content
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Initialize controller for the active tab
                this.initControllerForActiveTab();
                
                // Save active tab in URL
                const url = new URL(window.location);
                url.searchParams.set('tab', tabId);
                window.history.pushState({}, '', url);
            });
        });
        
        // Set active tab from URL or default to the first tab
        const urlParams = new URLSearchParams(window.location.search);
        const activeTabId = urlParams.get('tab') || this.tabs[0]?.getAttribute('data-tab');
        
        if (activeTabId) {
            const activeTab = document.querySelector(`.tab[data-tab="${activeTabId}"]`);
            if (activeTab) {
                activeTab.click();
            } else {
                // Default to first tab if specified tab doesn't exist
                this.tabs[0]?.click();
            }
        }
    }
    
    /**
     * Initialize controller for active tab
     */
    initControllerForActiveTab() {
        const activeTab = document.querySelector('.tab.active');
        if (!activeTab) return;
        
        const tabId = activeTab.getAttribute('data-tab');
        
        switch (tabId) {
            case 'teams-tab':
                this.initTeamController();
                break;
            case 'fixtures-tab':
                this.initFixtureController();
                break;
            case 'standings-tab':
                this.loadStandings();
                break;
            case 'stats-tab':
                this.loadStats();
                break;
            case 'settings-tab':
                this.loadSettings();
                break;
        }
    }
    
    /**
     * Initialize team controller
     */
    initTeamController() {
        // Only initialize if not already initialized
        if (!this.teamController) {
            this.teamController = new TeamController({
                dataManager: this.dataManager,
                layout: this.layout,
                leagueId: this.leagueId
            });
        }
    }
    
    /**
     * Initialize fixture controller
     */
    initFixtureController() {
        // Only initialize if not already initialized
        if (!this.fixtureController) {
            this.fixtureController = new FixtureController({
                dataManager: this.dataManager,
                layout: this.layout,
                leagueId: this.leagueId
            });
        }
    }
    
    /**
     * Load standings data
     */
    async loadStandings() {
        try {
            const standingsTable = document.getElementById('standings-table');
            if (!standingsTable) return;
            
            // Get league
            const league = await this.dataManager.getLeague(this.leagueId);
            if (!league) {
                this.layout.showNotification('League not found', 'error');
                return;
            }
            
            // Get standings
            const standings = league.standings || [];
            
            // Clear standings table
            standingsTable.innerHTML = '';
            
            if (standings.length === 0) {
                standingsTable.innerHTML = `
                    <tr>
                        <td colspan="9" class="empty-state">
                            <p>No standings data available yet. Play some matches to generate standings.</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Get teams for colors
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            const teamColors = {};
            teams.forEach(team => {
                teamColors[team.id] = team.color || '#3498db';
            });
            
            // Render standings
            standings.forEach((standing, index) => {
                const teamColor = teamColors[standing.teamId] || '#3498db';
                const goalDiff = standing.goalsFor - standing.goalsAgainst;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <div class="team-cell">
                            <div class="team-logo" style="background-color: ${teamColor}">
                                ${standing.teamName.charAt(0)}
                            </div>
                            <span>${standing.teamName}</span>
                        </div>
                    </td>
                    <td>${standing.played}</td>
                    <td>${standing.won}</td>
                    <td>${standing.drawn}</td>
                    <td>${standing.lost}</td>
                    <td>${standing.goalsFor}</td>
                    <td>${standing.goalsAgainst}</td>
                    <td>${goalDiff >= 0 ? '+' + goalDiff : goalDiff}</td>
                    <td><strong>${standing.points}</strong></td>
                `;
                
                standingsTable.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading standings:', error);
            this.layout.showNotification('Failed to load standings', 'error');
        }
    }
    
    /**
     * Load league statistics
     */
    async loadStats() {
        try {
            const statsContainer = document.getElementById('stats-container');
            if (!statsContainer) return;
            
            // Get league fixtures
            const fixtures = await this.dataManager.getFixturesByLeague(this.leagueId);
            
            // Get completed fixtures
            const completedFixtures = fixtures.filter(fixture => fixture.isCompleted);
            
            if (completedFixtures.length === 0) {
                statsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No match data available yet. Complete some matches to view statistics.</p>
                    </div>
                `;
                return;
            }
            
            // Calculate stats
            let totalGoals = 0;
            let totalMatches = completedFixtures.length;
            let homeWins = 0;
            let awayWins = 0;
            let draws = 0;
            
            completedFixtures.forEach(fixture => {
                totalGoals += fixture.homeScore + fixture.awayScore;
                
                if (fixture.homeScore > fixture.awayScore) {
                    homeWins++;
                } else if (fixture.homeScore < fixture.awayScore) {
                    awayWins++;
                } else {
                    draws++;
                }
            });
            
            const avgGoalsPerMatch = (totalGoals / totalMatches).toFixed(2);
            
            // Get all teams
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            // Calculate team stats
            const teamStats = {};
            
            teams.forEach(team => {
                teamStats[team.id] = {
                    id: team.id,
                    name: team.name,
                    color: team.color || '#3498db',
                    goalsFor: 0,
                    goalsAgainst: 0,
                    played: 0
                };
            });
            
            completedFixtures.forEach(fixture => {
                // Home team stats
                if (teamStats[fixture.homeTeamId]) {
                    teamStats[fixture.homeTeamId].goalsFor += fixture.homeScore;
                    teamStats[fixture.homeTeamId].goalsAgainst += fixture.awayScore;
                    teamStats[fixture.homeTeamId].played += 1;
                }
                
                // Away team stats
                if (teamStats[fixture.awayTeamId]) {
                    teamStats[fixture.awayTeamId].goalsFor += fixture.awayScore;
                    teamStats[fixture.awayTeamId].goalsAgainst += fixture.homeScore;
                    teamStats[fixture.awayTeamId].played += 1;
                }
            });
            
            // Find top scoring team
            let topScoringTeam = null;
            let mostGoals = -1;
            
            Object.values(teamStats).forEach(team => {
                if (team.goalsFor > mostGoals) {
                    mostGoals = team.goalsFor;
                    topScoringTeam = team;
                }
            });
            
            // Find best defensive team
            let bestDefensiveTeam = null;
            let leastGoalsConceded = Number.MAX_SAFE_INTEGER;
            
            Object.values(teamStats).forEach(team => {
                if (team.played > 0) {
                    const avgConceded = team.goalsAgainst / team.played;
                    if (avgConceded < leastGoalsConceded) {
                        leastGoalsConceded = avgConceded;
                        bestDefensiveTeam = team;
                    }
                }
            });
            
            // Render stats
            statsContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">Total Matches</div>
                        <div class="stat-value">${totalMatches}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">Total Goals</div>
                        <div class="stat-value">${totalGoals}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">Avg. Goals per Match</div>
                        <div class="stat-value">${avgGoalsPerMatch}</div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">Home Wins</div>
                        <div class="stat-value">${homeWins} <span class="text-small">(${Math.round((homeWins / totalMatches) * 100)}%)</span></div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">Away Wins</div>
                        <div class="stat-value">${awayWins} <span class="text-small">(${Math.round((awayWins / totalMatches) * 100)}%)</span></div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">Draws</div>
                        <div class="stat-value">${draws} <span class="text-small">(${Math.round((draws / totalMatches) * 100)}%)</span></div>
                    </div>
                </div>
                
                ${topScoringTeam ? `
                    <div class="stats-header">Top Scoring Team</div>
                    <div class="team-stat-card">
                        <div class="team-stat-logo" style="background-color: ${topScoringTeam.color}">
                            ${topScoringTeam.name.charAt(0)}
                        </div>
                        <div class="team-stat-info">
                            <div class="team-stat-name">${topScoringTeam.name}</div>
                            <div class="team-stat-value">${topScoringTeam.goalsFor} goals in ${topScoringTeam.played} matches</div>
                            <div class="team-stat-avg">${(topScoringTeam.goalsFor / topScoringTeam.played).toFixed(2)} goals per match</div>
                        </div>
                    </div>
                ` : ''}
                
                ${bestDefensiveTeam ? `
                    <div class="stats-header">Best Defensive Team</div>
                    <div class="team-stat-card">
                        <div class="team-stat-logo" style="background-color: ${bestDefensiveTeam.color}">
                            ${bestDefensiveTeam.name.charAt(0)}
                        </div>
                        <div class="team-stat-info">
                            <div class="team-stat-name">${bestDefensiveTeam.name}</div>
                            <div class="team-stat-value">${bestDefensiveTeam.goalsAgainst} goals conceded in ${bestDefensiveTeam.played} matches</div>
                            <div class="team-stat-avg">${(bestDefensiveTeam.goalsAgainst / bestDefensiveTeam.played).toFixed(2)} goals conceded per match</div>
                        </div>
                    </div>
                ` : ''}
            `;
            
        } catch (error) {
            console.error('Error loading stats:', error);
            this.layout.showNotification('Failed to load stats', 'error');
        }
    }
    
    /**
     * Load league settings
     */
    async loadSettings() {
        try {
            const settingsForm = document.getElementById('league-settings-form');
            if (!settingsForm) return;
            
            // Get league
            const league = await this.dataManager.getLeague(this.leagueId);
            if (!league) {
                this.layout.showNotification('League not found', 'error');
                return;
            }
            
            // Fill form with league data
            document.getElementById('league-name-input').value = league.name || '';
            document.getElementById('league-description-input').value = league.description || '';
            document.getElementById('league-start-date-input').value = league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '';
            document.getElementById('league-end-date-input').value = league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '';
            document.getElementById('league-location-input').value = league.location || '';
            
            // Add form submit event listener
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveLeagueSettings();
            });
            
            // Add delete league button event listener
            const deleteBtn = document.getElementById('delete-league-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.confirmDeleteLeague();
                });
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.layout.showNotification('Failed to load settings', 'error');
        }
    }
    
    /**
     * Save league settings
     */
    async saveLeagueSettings() {
        try {
            // Get league
            const league = await this.dataManager.getLeague(this.leagueId);
            if (!league) {
                this.layout.showNotification('League not found', 'error');
                return;
            }
            
            // Get form data
            const name = document.getElementById('league-name-input').value;
            const description = document.getElementById('league-description-input').value;
            const startDate = document.getElementById('league-start-date-input').value;
            const endDate = document.getElementById('league-end-date-input').value;
            const location = document.getElementById('league-location-input').value;
            
            if (!name) {
                this.layout.showNotification('League name is required', 'error');
                return;
            }
            
            // Update league data
            league.name = name;
            league.description = description;
            league.startDate = startDate || null;
            league.endDate = endDate || null;
            league.location = location;
            
            // Save league
            await this.dataManager.updateLeague(league);
            
            // Update league name in header
            if (this.leagueNameElement) {
                this.leagueNameElement.textContent = league.name;
            }
            
            if (this.leagueDescriptionElement) {
                this.leagueDescriptionElement.textContent = league.description || '';
            }
            
            // Show success notification
            this.layout.showNotification('League settings saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving league settings:', error);
            this.layout.showNotification('Failed to save league settings', 'error');
        }
    }
    
    /**
     * Confirm delete league
     */
    confirmDeleteLeague() {
        const modalContent = `
            <div class="modal-header">
                <h3>Delete League</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this league? This action cannot be undone.</p>
                <p><strong>Warning:</strong> Deleting a league will also remove all related teams, fixtures, and match data.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete League</button>
            </div>
        `;
        
        // Show modal
        this.layout.showModal(modalContent);
        
        // Add event listeners
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.layout.closeModal();
        });
        
        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.layout.closeModal();
        });
        
        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            this.deleteLeague();
            this.layout.closeModal();
        });
    }
    
    /**
     * Delete league
     */
    async deleteLeague() {
        try {
            // Delete league
            await this.dataManager.deleteLeague(this.leagueId);
            
            // Show success notification
            this.layout.showNotification('League deleted successfully', 'success');
            
            // Reload the page without league ID to show all leagues
            setTimeout(() => {
                window.location.href = '/webapp/src/pages/league-manager/dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error deleting league:', error);
            this.layout.showNotification('Failed to delete league', 'error');
        }
    }
}

// Initialize controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in, but allow local testing without login
    const sessionManager = new SessionManager();
    const isLocalTesting = window.location.protocol === 'file:';
    
    if (!sessionManager.isLoggedIn() && !isLocalTesting) {
        window.location.href = '/webapp/src/pages/home.html';
        return;
    }
    
    // Initialize league dashboard controller
    window.leagueDashboardController = new LeagueDashboardController();
});
