/**
 * 5ive Trackr Fixture Controller
 * 
 * Handles all fixture management functionality within a league
 * 
 * @copyright 5ive Trackr 2025
 */

class FixtureController {
    /**
     * Initialize the fixture controller
     * @param {Object} options - Configuration options
     * @param {DataManager} options.dataManager - Data manager instance
     * @param {DashboardLayout} options.layout - Dashboard layout instance
     * @param {String} options.leagueId - Current league ID
     */
    constructor(options) {
        this.dataManager = options.dataManager;
        this.layout = options.layout;
        this.leagueId = options.leagueId;
        this.currentLeague = null;
        
        // DOM elements
        this.fixturesList = document.getElementById('fixtures-list');
        this.fixturesContainer = document.getElementById('fixtures-container');
        this.generateFixturesBtn = document.getElementById('generate-fixtures-btn');
        this.addFixtureBtn = document.getElementById('add-fixture-btn');
        this.fixtureFilterSelect = document.getElementById('fixture-filter');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize controller
     */
    async init() {
        try {
            // Load current league
            this.currentLeague = await this.dataManager.getLeague(this.leagueId);
            if (!this.currentLeague) {
                this.layout.showNotification('League not found', 'error');
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load fixtures
            this.loadFixtures();
            
        } catch (error) {
            console.error('Error initializing fixture controller:', error);
            this.layout.showNotification('Failed to initialize fixture management', 'error');
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Generate fixtures button
        if (this.generateFixturesBtn) {
            this.generateFixturesBtn.addEventListener('click', () => {
                this.showGenerateFixturesModal();
            });
        }
        
        // Add fixture button
        if (this.addFixtureBtn) {
            this.addFixtureBtn.addEventListener('click', () => {
                this.showAddFixtureModal();
            });
        }
        
        // Fixture filter
        if (this.fixtureFilterSelect) {
            this.fixtureFilterSelect.addEventListener('change', () => {
                this.loadFixtures();
            });
        }
    }
    
    /**
     * Load fixtures for the current league
     */
    async loadFixtures() {
        try {
            if (!this.fixturesContainer) return;
            
            const fixtures = await this.dataManager.getFixturesByLeague(this.leagueId);
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            // Clear fixtures container
            this.fixturesContainer.innerHTML = '';
            
            if (fixtures.length === 0) {
                this.fixturesContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No fixtures have been created for this league yet.</p>
                        <div class="buttons">
                            <button class="btn btn-primary" id="empty-state-generate-fixtures">
                                <i class="fas fa-calendar-alt"></i> Generate Fixtures
                            </button>
                            <button class="btn btn-outline" id="empty-state-add-fixture">
                                <i class="fas fa-plus-circle"></i> Add Single Fixture
                            </button>
                        </div>
                    </div>
                `;
                
                document.getElementById('empty-state-generate-fixtures').addEventListener('click', () => {
                    this.showGenerateFixturesModal();
                });
                
                document.getElementById('empty-state-add-fixture').addEventListener('click', () => {
                    this.showAddFixtureModal();
                });
                
                return;
            }
            
            // Get filter value
            const filterValue = this.fixtureFilterSelect ? this.fixtureFilterSelect.value : 'all';
            
            // Filter fixtures
            let filteredFixtures = [...fixtures];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch(filterValue) {
                case 'upcoming':
                    filteredFixtures = fixtures.filter(fixture => {
                        const fixtureDate = new Date(fixture.date);
                        return fixtureDate >= today && !fixture.isCompleted;
                    });
                    break;
                case 'completed':
                    filteredFixtures = fixtures.filter(fixture => fixture.isCompleted);
                    break;
                case 'past':
                    filteredFixtures = fixtures.filter(fixture => {
                        const fixtureDate = new Date(fixture.date);
                        return fixtureDate < today;
                    });
                    break;
            }
            
            if (filteredFixtures.length === 0) {
                this.fixturesContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No ${filterValue} fixtures found.</p>
                        <button class="btn btn-outline" id="show-all-fixtures">
                            Show All Fixtures
                        </button>
                    </div>
                `;
                
                document.getElementById('show-all-fixtures').addEventListener('click', () => {
                    if (this.fixtureFilterSelect) {
                        this.fixtureFilterSelect.value = 'all';
                        this.loadFixtures();
                    }
                });
                
                return;
            }
            
            // Group fixtures by matchday
            const fixturesByMatchday = {};
            filteredFixtures.forEach(fixture => {
                const matchday = fixture.matchday || 'Unscheduled';
                if (!fixturesByMatchday[matchday]) {
                    fixturesByMatchday[matchday] = [];
                }
                fixturesByMatchday[matchday].push(fixture);
            });
            
            // Sort matchdays
            const sortedMatchdays = Object.keys(fixturesByMatchday).sort((a, b) => {
                if (a === 'Unscheduled') return 1;
                if (b === 'Unscheduled') return -1;
                return parseInt(a) - parseInt(b);
            });
            
            // Render fixtures by matchday
            sortedMatchdays.forEach(matchday => {
                const matchdayFixtures = fixturesByMatchday[matchday];
                
                // Create matchday section
                const matchdaySection = document.createElement('div');
                matchdaySection.classList.add('matchday-section');
                
                // Create matchday header
                const matchdayHeader = document.createElement('div');
                matchdayHeader.classList.add('matchday-header');
                matchdayHeader.innerHTML = `<h3>Matchday ${matchday}</h3>`;
                matchdaySection.appendChild(matchdayHeader);
                
                // Create fixtures container
                const fixturesGrid = document.createElement('div');
                fixturesGrid.classList.add('fixtures-grid');
                
                // Add fixtures to grid
                matchdayFixtures.forEach(fixture => {
                    const homeTeam = teams.find(team => team.id === fixture.homeTeamId) || { name: 'Unknown Team', color: '#3498db' };
                    const awayTeam = teams.find(team => team.id === fixture.awayTeamId) || { name: 'Unknown Team', color: '#3498db' };
                    
                    const fixtureCard = document.createElement('div');
                    fixtureCard.classList.add('fixture-card');
                    fixtureCard.dataset.fixtureId = fixture.id;
                    
                    if (fixture.isCompleted) {
                        fixtureCard.classList.add('completed');
                    }
                    
                    // Format date
                    const fixtureDate = fixture.date ? new Date(fixture.date) : null;
                    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
                    const formattedDate = fixtureDate ? fixtureDate.toLocaleDateString(undefined, dateOptions) : 'Date not set';
                    const formattedTime = fixtureDate ? fixtureDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                    
                    fixtureCard.innerHTML = `
                        <div class="fixture-header">
                            <div class="fixture-date">${formattedDate}</div>
                            <div class="fixture-time">${formattedTime}</div>
                            ${fixture.venue ? `<div class="fixture-venue">${fixture.venue}</div>` : ''}
                        </div>
                        <div class="fixture-teams">
                            <div class="team home-team">
                                <div class="team-logo" style="background-color: ${homeTeam.color}">
                                    ${homeTeam.name.charAt(0)}
                                </div>
                                <div class="team-name">${homeTeam.name}</div>
                            </div>
                            <div class="fixture-score">
                                ${fixture.isCompleted ? 
                                    `<span class="score">${fixture.homeScore || 0} - ${fixture.awayScore || 0}</span>` : 
                                    '<span class="vs">vs</span>'
                                }
                            </div>
                            <div class="team away-team">
                                <div class="team-logo" style="background-color: ${awayTeam.color}">
                                    ${awayTeam.name.charAt(0)}
                                </div>
                                <div class="team-name">${awayTeam.name}</div>
                            </div>
                        </div>
                        <div class="fixture-footer">
                            ${fixture.referee ? `<div class="fixture-referee">Ref: ${fixture.referee}</div>` : ''}
                            <div class="fixture-actions">
                                ${fixture.isCompleted ? 
                                    `<button class="btn btn-sm btn-outline view-result" data-fixture-id="${fixture.id}">
                                        <i class="fas fa-eye"></i> Details
                                    </button>` : 
                                    `<button class="btn btn-sm btn-primary record-result" data-fixture-id="${fixture.id}">
                                        <i class="fas fa-clipboard-check"></i> Record
                                    </button>`
                                }
                                <button class="btn btn-sm btn-outline edit-fixture" data-fixture-id="${fixture.id}">
                                    <i class="fas fa-pencil-alt"></i> Edit
                                </button>
                            </div>
                        </div>
                    `;
                    
                    fixturesGrid.appendChild(fixtureCard);
                });
                
                matchdaySection.appendChild(fixturesGrid);
                this.fixturesContainer.appendChild(matchdaySection);
            });
            
            // Add event listeners to fixture actions
            this.addFixtureActionListeners();
            
        } catch (error) {
            console.error('Error loading fixtures:', error);
            this.layout.showNotification('Failed to load fixtures', 'error');
        }
    }
    
    /**
     * Add event listeners to fixture action buttons
     */
    addFixtureActionListeners() {
        // Edit fixture buttons
        const editButtons = document.querySelectorAll('.edit-fixture');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const fixtureId = e.currentTarget.dataset.fixtureId;
                this.showEditFixtureModal(fixtureId);
            });
        });
        
        // Record result buttons
        const recordButtons = document.querySelectorAll('.record-result');
        recordButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const fixtureId = e.currentTarget.dataset.fixtureId;
                this.showRecordResultModal(fixtureId);
            });
        });
        
        // View result buttons
        const viewButtons = document.querySelectorAll('.view-result');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const fixtureId = e.currentTarget.dataset.fixtureId;
                this.showFixtureDetailsModal(fixtureId);
            });
        });
    }
    
    /**
     * Show generate fixtures modal
     */
    async showGenerateFixturesModal() {
        try {
            // Get teams
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            if (teams.length < 2) {
                this.layout.showNotification('Need at least 2 teams to generate fixtures', 'error');
                return;
            }
            
            // Create modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Generate Fixtures</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Generate a complete fixture list for all teams in this league.</p>
                    
                    <div class="form-group">
                        <label for="fixture-format">Format</label>
                        <select id="fixture-format" class="form-control">
                            <option value="single">Single Round (each team plays once)</option>
                            <option value="double" selected>Double Round (home and away)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="start-date">Start Date</label>
                        <input type="date" id="start-date" class="form-control">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="match-day">Match Day</label>
                            <select id="match-day" class="form-control">
                                <option value="0">Sunday</option>
                                <option value="1">Monday</option>
                                <option value="2">Tuesday</option>
                                <option value="3">Wednesday</option>
                                <option value="4">Thursday</option>
                                <option value="5">Friday</option>
                                <option value="6" selected>Saturday</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="match-time">Default Time</label>
                            <input type="time" id="match-time" class="form-control" value="15:00">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="venue-assignment">Venue Assignment</label>
                        <select id="venue-assignment" class="form-control">
                            <option value="none">None (set manually later)</option>
                            <option value="home">Use home team venue</option>
                        </select>
                    </div>
                    
                    <div class="warning-box">
                        <p><i class="fas fa-exclamation-triangle"></i> <strong>Warning:</strong> This will replace any existing fixtures. Match results will be lost.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                    <button type="button" class="btn btn-primary" id="generate-fixtures-confirm">Generate Fixtures</button>
                </div>
            `;
            
            // Show modal
            this.layout.showModal(modalContent);
            
            // Set default start date to next Saturday
            const today = new Date();
            const nextSaturday = new Date(today);
            nextSaturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
            
            // Format date for input
            const year = nextSaturday.getFullYear();
            const month = String(nextSaturday.getMonth() + 1).padStart(2, '0');
            const day = String(nextSaturday.getDate()).padStart(2, '0');
            document.getElementById('start-date').value = `${year}-${month}-${day}`;
            
            // Add event listeners
            document.querySelector('.modal-close').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.querySelector('.modal-cancel').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.getElementById('generate-fixtures-confirm').addEventListener('click', () => {
                this.generateFixtures();
            });
            
        } catch (error) {
            console.error('Error showing generate fixtures modal:', error);
            this.layout.showNotification('Failed to show generate fixtures modal', 'error');
        }
    }
    
    /**
     * Generate fixtures
     */
    async generateFixtures() {
        try {
            // Get teams
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            if (teams.length < 2) {
                this.layout.showNotification('Need at least 2 teams to generate fixtures', 'error');
                return;
            }
            
            // Get form data
            const format = document.getElementById('fixture-format').value;
            const startDateStr = document.getElementById('start-date').value;
            const matchDay = parseInt(document.getElementById('match-day').value);
            const matchTimeStr = document.getElementById('match-time').value;
            const venueAssignment = document.getElementById('venue-assignment').value;
            
            if (!startDateStr) {
                this.layout.showNotification('Start date is required', 'error');
                return;
            }
            
            // Parse date and time
            const startDate = new Date(startDateStr);
            const [hours, minutes] = matchTimeStr.split(':').map(num => parseInt(num));
            
            // Adjust start date to match the selected match day
            const dayDiff = (matchDay - startDate.getDay() + 7) % 7;
            startDate.setDate(startDate.getDate() + dayDiff);
            startDate.setHours(hours, minutes, 0, 0);
            
            // Generate fixtures
            const fixtures = this.createFixtureSchedule(teams, format === 'double', startDate, venueAssignment);
            
            // Save fixtures
            await Promise.all(fixtures.map(fixture => this.dataManager.createFixture(fixture)));
            
            // Close modal
            this.layout.closeModal();
            
            // Reload fixtures
            this.loadFixtures();
            
            // Show success notification
            this.layout.showNotification(`${fixtures.length} fixtures generated successfully`, 'success');
            
        } catch (error) {
            console.error('Error generating fixtures:', error);
            this.layout.showNotification('Failed to generate fixtures', 'error');
        }
    }
    
    /**
     * Create fixture schedule using round-robin algorithm
     * @param {Array} teams - List of teams
     * @param {Boolean} doubleRound - Whether to generate double round (home and away)
     * @param {Date} startDate - Start date for fixtures
     * @param {String} venueAssignment - How to assign venues
     * @returns {Array} List of fixtures
     */
    createFixtureSchedule(teams, doubleRound, startDate, venueAssignment) {
        const fixtures = [];
        const teamCount = teams.length;
        
        // If odd number of teams, add a dummy team
        const actualTeams = [...teams];
        if (teamCount % 2 === 1) {
            actualTeams.push({ id: 'bye', name: 'BYE', color: '#cccccc' });
        }
        
        const n = actualTeams.length;
        const matchesPerRound = n / 2;
        const totalRounds = n - 1;
        
        // Create array of team indices for round-robin algorithm
        const indices = Array.from({ length: n }, (_, i) => i);
        
        // For each round
        for (let round = 0; round < totalRounds; round++) {
            // Calculate the date for this round (7 days between rounds)
            const roundDate = new Date(startDate);
            roundDate.setDate(startDate.getDate() + (round * 7));
            
            // Generate matches for this round
            for (let match = 0; match < matchesPerRound; match++) {
                const home = indices[match];
                const away = indices[n - 1 - match];
                
                // Skip if one team is the dummy "bye" team
                if (actualTeams[home].id === 'bye' || actualTeams[away].id === 'bye') {
                    continue;
                }
                
                // Create fixture
                const fixture = {
                    id: this.dataManager.generateId(),
                    leagueId: this.leagueId,
                    matchday: round + 1,
                    homeTeamId: actualTeams[home].id,
                    awayTeamId: actualTeams[away].id,
                    date: new Date(roundDate).toISOString(),
                    isCompleted: false,
                    homeScore: null,
                    awayScore: null,
                    venue: venueAssignment === 'home' && actualTeams[home].venue ? actualTeams[home].venue : null
                };
                
                fixtures.push(fixture);
            }
            
            // Rotate teams for next round (first team stays fixed, others rotate)
            const lastIndex = indices.pop();
            indices.splice(1, 0, lastIndex);
        }
        
        // Generate return fixtures for double round
        if (doubleRound) {
            const firstRoundFixtures = [...fixtures];
            
            firstRoundFixtures.forEach(firstLegFixture => {
                // Calculate the date for return fixture (add total rounds * 7 days)
                const returnDate = new Date(new Date(firstLegFixture.date));
                returnDate.setDate(returnDate.getDate() + (totalRounds * 7));
                
                // Create return fixture (swap home and away)
                const returnFixture = {
                    id: this.dataManager.generateId(),
                    leagueId: this.leagueId,
                    matchday: totalRounds + parseInt(firstLegFixture.matchday),
                    homeTeamId: firstLegFixture.awayTeamId,
                    awayTeamId: firstLegFixture.homeTeamId,
                    date: returnDate.toISOString(),
                    isCompleted: false,
                    homeScore: null,
                    awayScore: null,
                    venue: venueAssignment === 'home' ? 
                        (teams.find(team => team.id === firstLegFixture.awayTeamId)?.venue || null) : 
                        null
                };
                
                fixtures.push(returnFixture);
            });
        }
        
        return fixtures;
    }
    
    /**
     * Show add fixture modal
     */
    async showAddFixtureModal() {
        try {
            // Get teams
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            if (teams.length < 2) {
                this.layout.showNotification('Need at least 2 teams to create a fixture', 'error');
                return;
            }
            
            // Create modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Add New Fixture</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="fixture-form" class="fixture-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fixture-home-team">Home Team <span class="required">*</span></label>
                                <select id="fixture-home-team" name="homeTeamId" required>
                                    <option value="">Select Home Team</option>
                                    ${teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="fixture-away-team">Away Team <span class="required">*</span></label>
                                <select id="fixture-away-team" name="awayTeamId" required>
                                    <option value="">Select Away Team</option>
                                    ${teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fixture-date">Date</label>
                                <input type="date" id="fixture-date" name="date">
                            </div>
                            
                            <div class="form-group">
                                <label for="fixture-time">Time</label>
                                <input type="time" id="fixture-time" name="time" value="15:00">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fixture-matchday">Matchday</label>
                                <input type="number" id="fixture-matchday" name="matchday" min="1" value="1">
                            </div>
                            
                            <div class="form-group">
                                <label for="fixture-venue">Venue</label>
                                <input type="text" id="fixture-venue" name="venue">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="fixture-referee">Referee</label>
                            <input type="text" id="fixture-referee" name="referee">
                        </div>
                        
                        <input type="hidden" id="fixture-id" name="id" value="">
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Fixture</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Show modal
            this.layout.showModal(modalContent);
            
            // Add event listeners
            document.getElementById('fixture-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFixture();
            });
            
            document.querySelector('.modal-close').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.querySelector('.modal-cancel').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            // Set default date to today
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            document.getElementById('fixture-date').value = `${year}-${month}-${day}`;
            
        } catch (error) {
            console.error('Error showing add fixture modal:', error);
            this.layout.showNotification('Failed to show add fixture modal', 'error');
        }
    }
    
    /**
     * Show edit fixture modal
     * @param {String} fixtureId - Fixture ID to edit
     */
    async showEditFixtureModal(fixtureId) {
        try {
            // Get teams
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            // Get fixture data
            const fixture = await this.dataManager.getFixture(fixtureId);
            if (!fixture) {
                this.layout.showNotification('Fixture not found', 'error');
                return;
            }
            
            // Show add fixture modal (reuse the form)
            this.showAddFixtureModal();
            
            // Need to wait for the modal to be created
            setTimeout(() => {
                // Fill form with fixture data
                document.getElementById('fixture-id').value = fixture.id;
                document.getElementById('fixture-home-team').value = fixture.homeTeamId;
                document.getElementById('fixture-away-team').value = fixture.awayTeamId;
                document.getElementById('fixture-matchday').value = fixture.matchday || 1;
                document.getElementById('fixture-venue').value = fixture.venue || '';
                document.getElementById('fixture-referee').value = fixture.referee || '';
                
                // Handle date and time
                if (fixture.date) {
                    const fixtureDate = new Date(fixture.date);
                    const year = fixtureDate.getFullYear();
                    const month = String(fixtureDate.getMonth() + 1).padStart(2, '0');
                    const day = String(fixtureDate.getDate()).padStart(2, '0');
                    document.getElementById('fixture-date').value = `${year}-${month}-${day}`;
                    
                    const hours = String(fixtureDate.getHours()).padStart(2, '0');
                    const minutes = String(fixtureDate.getMinutes()).padStart(2, '0');
                    document.getElementById('fixture-time').value = `${hours}:${minutes}`;
                }
                
                // Update modal title
                document.querySelector('.modal-header h3').textContent = 'Edit Fixture';
            }, 100);
            
        } catch (error) {
            console.error('Error loading fixture data:', error);
            this.layout.showNotification('Failed to load fixture data', 'error');
        }
    }
    
    /**
     * Save fixture
     */
    async saveFixture() {
        try {
            // Get form data
            const fixtureForm = document.getElementById('fixture-form');
            const formData = new FormData(fixtureForm);
            
            const homeTeamId = formData.get('homeTeamId');
            const awayTeamId = formData.get('awayTeamId');
            const dateStr = formData.get('date');
            const timeStr = formData.get('time');
            
            if (!homeTeamId || !awayTeamId) {
                this.layout.showNotification('Home and away teams are required', 'error');
                return;
            }
            
            if (homeTeamId === awayTeamId) {
                this.layout.showNotification('Home and away teams must be different', 'error');
                return;
            }
            
            // Combine date and time
            let fixtureDate = null;
            if (dateStr) {
                fixtureDate = new Date(dateStr);
                
                if (timeStr) {
                    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
                    fixtureDate.setHours(hours, minutes, 0, 0);
                }
            }
            
            const fixtureData = {
                homeTeamId,
                awayTeamId,
                date: fixtureDate ? fixtureDate.toISOString() : null,
                matchday: formData.get('matchday') ? parseInt(formData.get('matchday')) : 1,
                venue: formData.get('venue'),
                referee: formData.get('referee'),
                leagueId: this.leagueId,
                isCompleted: false,
                homeScore: null,
                awayScore: null
            };
            
            const fixtureId = formData.get('id');
            
            if (fixtureId) {
                // Update existing fixture
                fixtureData.id = fixtureId;
                await this.dataManager.updateFixture(fixtureData);
                this.layout.showNotification('Fixture updated successfully', 'success');
            } else {
                // Create new fixture
                fixtureData.id = this.dataManager.generateId();
                await this.dataManager.createFixture(fixtureData);
                this.layout.showNotification('Fixture created successfully', 'success');
            }
            
            // Close modal
            this.layout.closeModal();
            
            // Refresh fixtures list
            this.loadFixtures();
            
        } catch (error) {
            console.error('Error saving fixture:', error);
            this.layout.showNotification('Failed to save fixture', 'error');
        }
    }
    
    /**
     * Show record result modal
     * @param {String} fixtureId - Fixture ID
     */
    async showRecordResultModal(fixtureId) {
        try {
            // Get fixture data
            const fixture = await this.dataManager.getFixture(fixtureId);
            if (!fixture) {
                this.layout.showNotification('Fixture not found', 'error');
                return;
            }
            
            // Get teams
            const homeTeam = await this.dataManager.getTeam(fixture.homeTeamId);
            const awayTeam = await this.dataManager.getTeam(fixture.awayTeamId);
            
            if (!homeTeam || !awayTeam) {
                this.layout.showNotification('Team information not found', 'error');
                return;
            }
            
            // Create modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Record Match Result</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="match-teams">
                        <div class="team home-team">
                            <div class="team-logo" style="background-color: ${homeTeam.color || '#3498db'}">
                                ${homeTeam.name.charAt(0)}
                            </div>
                            <div class="team-name">${homeTeam.name}</div>
                        </div>
                        <div class="vs">vs</div>
                        <div class="team away-team">
                            <div class="team-logo" style="background-color: ${awayTeam.color || '#3498db'}">
                                ${awayTeam.name.charAt(0)}
                            </div>
                            <div class="team-name">${awayTeam.name}</div>
                        </div>
                    </div>
                    
                    <form id="result-form" class="result-form">
                        <div class="score-inputs">
                            <div class="form-group">
                                <label for="home-score">Home Score</label>
                                <input type="number" id="home-score" name="homeScore" min="0" value="0" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="away-score">Away Score</label>
                                <input type="number" id="away-score" name="awayScore" min="0" value="0" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="match-notes">Match Notes</label>
                            <textarea id="match-notes" name="notes"></textarea>
                        </div>
                        
                        <input type="hidden" name="fixtureId" value="${fixtureId}">
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Result</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Show modal
            this.layout.showModal(modalContent);
            
            // Add event listeners
            document.getElementById('result-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMatchResult(fixtureId);
            });
            
            document.querySelector('.modal-close').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.querySelector('.modal-cancel').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
        } catch (error) {
            console.error('Error showing record result modal:', error);
            this.layout.showNotification('Failed to show record result modal', 'error');
        }
    }
    
    /**
     * Save match result
     * @param {String} fixtureId - Fixture ID
     */
    async saveMatchResult(fixtureId) {
        try {
            // Get fixture data
            const fixture = await this.dataManager.getFixture(fixtureId);
            if (!fixture) {
                this.layout.showNotification('Fixture not found', 'error');
                return;
            }
            
            // Get form data
            const homeScore = parseInt(document.getElementById('home-score').value);
            const awayScore = parseInt(document.getElementById('away-score').value);
            const notes = document.getElementById('match-notes').value;
            
            // Update fixture
            fixture.homeScore = homeScore;
            fixture.awayScore = awayScore;
            fixture.notes = notes;
            fixture.isCompleted = true;
            fixture.completedDate = new Date().toISOString();
            
            // Save fixture
            await this.dataManager.updateFixture(fixture);
            
            // Update league standings
            await this.updateLeagueStandings(fixture);
            
            // Close modal
            this.layout.closeModal();
            
            // Refresh fixtures
            this.loadFixtures();
            
            // Show success notification
            this.layout.showNotification('Match result recorded successfully', 'success');
            
        } catch (error) {
            console.error('Error saving match result:', error);
            this.layout.showNotification('Failed to save match result', 'error');
        }
    }
    
    /**
     * Show fixture details modal
     * @param {String} fixtureId - Fixture ID
     */
    async showFixtureDetailsModal(fixtureId) {
        try {
            // Get fixture data
            const fixture = await this.dataManager.getFixture(fixtureId);
            if (!fixture) {
                this.layout.showNotification('Fixture not found', 'error');
                return;
            }
            
            // Get teams
            const homeTeam = await this.dataManager.getTeam(fixture.homeTeamId);
            const awayTeam = await this.dataManager.getTeam(fixture.awayTeamId);
            
            if (!homeTeam || !awayTeam) {
                this.layout.showNotification('Team information not found', 'error');
                return;
            }
            
            // Format date
            const fixtureDate = fixture.date ? new Date(fixture.date) : null;
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = fixtureDate ? fixtureDate.toLocaleDateString(undefined, dateOptions) : 'Date not set';
            const formattedTime = fixtureDate ? fixtureDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
            
            // Create modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Match Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="match-header">
                        <div class="match-info">
                            <div class="match-date">${formattedDate}</div>
                            <div class="match-time">${formattedTime}</div>
                            ${fixture.venue ? `<div class="match-venue">Venue: ${fixture.venue}</div>` : ''}
                            ${fixture.referee ? `<div class="match-referee">Referee: ${fixture.referee}</div>` : ''}
                        </div>
                        <div class="match-status">
                            <span class="badge ${fixture.isCompleted ? 'badge-success' : 'badge-primary'}">
                                ${fixture.isCompleted ? 'Completed' : 'Scheduled'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="match-result">
                        <div class="team home-team">
                            <div class="team-logo" style="background-color: ${homeTeam.color || '#3498db'}">
                                ${homeTeam.name.charAt(0)}
                            </div>
                            <div class="team-name">${homeTeam.name}</div>
                        </div>
                        
                        <div class="score-display">
                            ${fixture.isCompleted ? 
                                `<div class="score">${fixture.homeScore} - ${fixture.awayScore}</div>` : 
                                '<div class="vs">vs</div>'
                            }
                        </div>
                        
                        <div class="team away-team">
                            <div class="team-logo" style="background-color: ${awayTeam.color || '#3498db'}">
                                ${awayTeam.name.charAt(0)}
                            </div>
                            <div class="team-name">${awayTeam.name}</div>
                        </div>
                    </div>
                    
                    ${fixture.notes ? `
                        <div class="match-notes">
                            <h4>Match Notes</h4>
                            <p>${fixture.notes}</p>
                        </div>
                    ` : ''}
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="edit-fixture-btn">
                            <i class="fas fa-pencil-alt"></i> Edit Fixture
                        </button>
                        ${fixture.isCompleted ? `
                            <button type="button" class="btn btn-primary" id="edit-result-btn">
                                <i class="fas fa-clipboard-check"></i> Edit Result
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // Show modal
            this.layout.showModal(modalContent);
            
            // Add event listeners
            document.querySelector('.modal-close').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.getElementById('edit-fixture-btn').addEventListener('click', () => {
                this.layout.closeModal();
                this.showEditFixtureModal(fixtureId);
            });
            
            if (fixture.isCompleted) {
                document.getElementById('edit-result-btn').addEventListener('click', () => {
                    this.layout.closeModal();
                    this.showRecordResultModal(fixtureId);
                });
            }
            
        } catch (error) {
            console.error('Error showing fixture details:', error);
            this.layout.showNotification('Failed to show fixture details', 'error');
        }
    }
    
    /**
     * Update league standings after a match result
     * @param {Object} fixture - Fixture with result
     */
    async updateLeagueStandings(fixture) {
        try {
            // Get league
            const league = await this.dataManager.getLeague(this.leagueId);
            if (!league) {
                console.error('League not found');
                return;
            }
            
            // Initialize standings if not exists
            if (!league.standings) {
                league.standings = [];
            }
            
            // Get or create home team standing
            let homeStanding = league.standings.find(s => s.teamId === fixture.homeTeamId);
            if (!homeStanding) {
                const homeTeam = await this.dataManager.getTeam(fixture.homeTeamId);
                homeStanding = {
                    teamId: fixture.homeTeamId,
                    teamName: homeTeam ? homeTeam.name : 'Unknown Team',
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0
                };
                league.standings.push(homeStanding);
            }
            
            // Get or create away team standing
            let awayStanding = league.standings.find(s => s.teamId === fixture.awayTeamId);
            if (!awayStanding) {
                const awayTeam = await this.dataManager.getTeam(fixture.awayTeamId);
                awayStanding = {
                    teamId: fixture.awayTeamId,
                    teamName: awayTeam ? awayTeam.name : 'Unknown Team',
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0
                };
                league.standings.push(awayStanding);
            }
            
            // Update standings based on result
            homeStanding.played++;
            awayStanding.played++;
            
            homeStanding.goalsFor += fixture.homeScore;
            homeStanding.goalsAgainst += fixture.awayScore;
            
            awayStanding.goalsFor += fixture.awayScore;
            awayStanding.goalsAgainst += fixture.homeScore;
            
            if (fixture.homeScore > fixture.awayScore) {
                homeStanding.won++;
                awayStanding.lost++;
                homeStanding.points += 3;
            } else if (fixture.homeScore < fixture.awayScore) {
                homeStanding.lost++;
                awayStanding.won++;
                awayStanding.points += 3;
            } else {
                homeStanding.drawn++;
                awayStanding.drawn++;
                homeStanding.points += 1;
                awayStanding.points += 1;
            }
            
            // Sort standings by points, then goal difference, then goals scored
            league.standings.sort((a, b) => {
                // Points
                if (b.points !== a.points) {
                    return b.points - a.points;
                }
                
                // Goal difference
                const aGoalDiff = a.goalsFor - a.goalsAgainst;
                const bGoalDiff = b.goalsFor - b.goalsAgainst;
                if (bGoalDiff !== aGoalDiff) {
                    return bGoalDiff - aGoalDiff;
                }
                
                // Goals scored
                if (b.goalsFor !== a.goalsFor) {
                    return b.goalsFor - a.goalsFor;
                }
                
                // Alphabetical by team name
                return a.teamName.localeCompare(b.teamName);
            });
            
            // Save updated league
            await this.dataManager.updateLeague(league);
            
        } catch (error) {
            console.error('Error updating league standings:', error);
        }
    }
}

// Export controller
window.FixtureController = FixtureController;
