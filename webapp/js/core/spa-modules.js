/**
 * 5ive Trackr SPA Modules
 * Module system for organizing page content in SPA
 * © 2025 5ive Trackr. All rights reserved.
 */

window.SPAModules = (function() {
    const modules = {};

    // Dashboard Module
    modules.dashboard = {
        async render() {
            return `
                <div class="content-area">
                    <!-- Page Header -->
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">League Manager Dashboard</h1>
                            <p class="page-subtitle">Overview of league activities and pending actions</p>
                        </div>
                    </div>
                    
                    <!-- Action Cards Row -->
                    <div class="action-cards-grid">
                        <!-- Team Attendance Card -->
                        <div class="action-card" id="attendance-card">
                            <div class="action-card-header" data-count="3">
                                <span class="icon icon-calendar-check"></span>
                                <h4>Team Attendances</h4>
                            </div>
                            <div class="action-card-body">
                                <div class="action-count">3</div>
                                <div class="action-label">Teams pending</div>
                            </div>
                            <div class="action-card-footer">
                                <div class="action-description">Next three matches requiring team attendance confirmation</div>
                            </div>
                        </div>
                        
                        <!-- Referee Allocations Card -->
                        <div class="action-card" id="referee-card">
                            <div class="action-card-header" data-count="2">
                                <span class="icon icon-whistle"></span>
                                <h4>Referee Allocation</h4>
                            </div>
                            <div class="action-card-body">
                                <div class="action-count">2</div>
                                <div class="action-label">Fixtures pending</div>
                            </div>
                            <div class="action-card-footer">
                                <div class="action-description">Upcoming matches requiring referee allocation</div>
                            </div>
                        </div>
                        
                        <!-- Team Payments Card -->
                        <div class="action-card" id="payments-card">
                            <div class="action-card-header" data-count="4">
                                <span class="icon icon-credit-card"></span>
                                <h4>Payments Due</h4>
                            </div>
                            <div class="action-card-body">
                                <div class="action-count">4</div>
                                <div class="action-label">Teams overdue</div>
                            </div>
                            <div class="action-card-footer">
                                <div class="action-description">Teams with outstanding payment obligations</div>
                            </div>
                        </div>
                        
                        <!-- Today's Fixtures Card -->
                        <div class="action-card" id="fixtures-card">
                            <div class="action-card-header" data-count="0">
                                <span class="icon icon-flag"></span>
                                <h4>Today's Fixtures</h4>
                            </div>
                            <div class="action-card-body">
                                <div class="action-count">0</div>
                                <div class="action-label">Fixtures today</div>
                            </div>
                            <div class="action-card-footer">
                                <div class="action-description">Today's scheduled matches with confirmation status</div>
                            </div>
                        </div>
                        
                        <!-- Actions Required Card -->
                        <div class="action-card" id="actions-card">
                            <div class="action-card-header" data-count="9">
                                <span class="icon icon-tasks"></span>
                                <h4>Actions Required</h4>
                            </div>
                            <div class="action-card-body">
                                <div class="action-count">9</div>
                                <div class="action-label">Items pending</div>
                            </div>
                            <div class="action-card-footer">
                                <div class="action-description">Outstanding administrative tasks requiring attention</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Dashboard module initialized');
            // Initialize dashboard-specific functionality
        }
    };

    // Fixtures Module
    modules.fixtures = {
        async render() {
            return `
                <div class="content-area">
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Fixtures</h1>
                            <p class="page-subtitle">Manage match schedules and fixture assignments</p>
                        </div>
                    </div>
                    
                    <div class="fixtures-content">
                        <div class="fixtures-toolbar">
                            <div class="module-toolbar-left">
                                <button class="btn btn-primary" onclick="SPAModules.fixtures.createFixture()">
                                    <span class="btn-icon">➕</span>
                                    Create Fixture
                                </button>
                                <button class="btn btn-outline" onclick="SPAModules.fixtures.importFixtures()">
                                    <span class="btn-icon">📥</span>
                                    Import
                                </button>
                            </div>
                            <div class="module-toolbar-right">
                                <select class="form-select" id="league-filter" onchange="SPAModules.fixtures.filterFixtures()">
                                    <option value="">All Leagues</option>
                                    <option value="premier">Premier League</option>
                                    <option value="championship">Championship</option>
                                </select>
                                <select class="form-select" id="status-filter" onchange="SPAModules.fixtures.filterFixtures()">
                                    <option value="">All Status</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="fixtures-grid" id="fixtures-grid">
                            <div class="loading-message">Loading fixtures...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Fixtures module initialized');
            await this.loadFixtures();
        },

        async loadFixtures() {
            const grid = document.getElementById('fixtures-grid');
            if (!grid) return;

            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Sample fixtures data
            const fixtures = [
                {
                    id: 1,
                    date: '2025-08-15',
                    time: '19:00',
                    homeTeam: 'Arsenal FC',
                    awayTeam: 'Chelsea FC',
                    venue: 'Emirates Stadium',
                    league: 'Premier League',
                    status: 'scheduled',
                    referee: null
                },
                {
                    id: 2,
                    date: '2025-08-16',
                    time: '15:00',
                    homeTeam: 'Manchester United',
                    awayTeam: 'Liverpool FC',
                    venue: 'Old Trafford',
                    league: 'Premier League',
                    status: 'scheduled',
                    referee: 'Michael Oliver'
                },
                {
                    id: 3,
                    date: '2025-08-10',
                    time: '16:00',
                    homeTeam: 'Brighton FC',
                    awayTeam: 'Tottenham',
                    venue: 'Amex Stadium',
                    league: 'Premier League',
                    status: 'completed',
                    referee: 'Anthony Taylor'
                }
            ];

            this.renderFixturesTable(fixtures);
        },

        renderFixturesTable(fixtures) {
            const grid = document.getElementById('fixtures-grid');
            if (!grid) return;

            if (fixtures.length === 0) {
                grid.innerHTML = '<div class="no-data">No fixtures found matching your criteria</div>';
                return;
            }

            grid.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Fixture</th>
                            <th>Venue</th>
                            <th>League</th>
                            <th>Referee</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fixtures.map(fixture => `
                            <tr data-fixture-id="${fixture.id}">
                                <td>
                                    <div style="font-weight: 600;">${new Date(fixture.date).toLocaleDateString()}</div>
                                    <div style="color: #666; font-size: 12px;">${fixture.time}</div>
                                </td>
                                <td>
                                    <div style="font-weight: 600; margin-bottom: 4px;">
                                        ${fixture.homeTeam} vs ${fixture.awayTeam}
                                    </div>
                                </td>
                                <td>${fixture.venue}</td>
                                <td>${fixture.league}</td>
                                <td>${fixture.referee || '<span style="color: #dc2626;">Not Assigned</span>'}</td>
                                <td>
                                    <span class="status-badge status-${fixture.status}">
                                        ${fixture.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-sm" onclick="SPAModules.fixtures.editFixture(${fixture.id})">Edit</button>
                                        ${!fixture.referee ? '<button class="btn btn-sm btn-outline" onclick="SPAModules.fixtures.assignReferee(' + fixture.id + ')">Assign Referee</button>' : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        },

        filterFixtures() {
            console.log('Filtering fixtures...');
            this.loadFixtures(); // Reload with filters
        },

        createFixture() {
            alert('Create Fixture: This would open a modal/form to create a new fixture');
        },

        importFixtures() {
            alert('Import Fixtures: This would open a file upload dialog');
        },

        editFixture(id) {
            alert(`Edit Fixture ${id}: This would open an edit form`);
        },

        assignReferee(id) {
            alert(`Assign Referee to Fixture ${id}: This would open referee selection`);
        }
    };

    // Teams Module
    modules.teams = {
        async render() {
            return `
                <div class="content-area">
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Teams</h1>
                            <p class="page-subtitle">Manage team registrations and information</p>
                        </div>
                    </div>
                    
                    <div class="teams-content">
                        <div class="teams-toolbar">
                            <div class="module-toolbar-left">
                                <button class="btn btn-primary" onclick="SPAModules.teams.addTeam()">
                                    <span class="btn-icon">➕</span>
                                    Add Team
                                </button>
                                <button class="btn btn-outline" onclick="SPAModules.teams.importTeams()">
                                    <span class="btn-icon">📥</span>
                                    Import
                                </button>
                            </div>
                            <div class="module-toolbar-right">
                                <input type="text" class="form-input" placeholder="Search teams..." id="team-search" oninput="SPAModules.teams.searchTeams()">
                                <select class="form-select" id="league-filter" onchange="SPAModules.teams.filterTeams()">
                                    <option value="">All Leagues</option>
                                    <option value="premier">Premier League</option>
                                    <option value="championship">Championship</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="teams-grid" id="teams-grid">
                            <div class="loading-message">Loading teams...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Teams module initialized');
            await this.loadTeams();
        },

        async loadTeams() {
            const grid = document.getElementById('teams-grid');
            if (!grid) return;

            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Sample teams data
            const teams = [
                {
                    id: 1,
                    name: 'Arsenal FC',
                    manager: 'Mikel Arteta',
                    league: 'Premier League',
                    players: 25,
                    status: 'active',
                    founded: 1886,
                    homeVenue: 'Emirates Stadium'
                },
                {
                    id: 2,
                    name: 'Chelsea FC',
                    manager: 'Mauricio Pochettino',
                    league: 'Premier League',
                    players: 28,
                    status: 'active',
                    founded: 1905,
                    homeVenue: 'Stamford Bridge'
                },
                {
                    id: 3,
                    name: 'Manchester United',
                    manager: 'Erik ten Hag',
                    league: 'Premier League',
                    players: 26,
                    status: 'active',
                    founded: 1878,
                    homeVenue: 'Old Trafford'
                },
                {
                    id: 4,
                    name: 'Brighton FC',
                    manager: 'Roberto De Zerbi',
                    league: 'Premier League',
                    players: 24,
                    status: 'active',
                    founded: 1901,
                    homeVenue: 'Amex Stadium'
                }
            ];

            this.renderTeamsGrid(teams);
        },

        renderTeamsGrid(teams) {
            const grid = document.getElementById('teams-grid');
            if (!grid) return;

            if (teams.length === 0) {
                grid.innerHTML = '<div class="no-data">No teams found matching your criteria</div>';
                return;
            }

            grid.innerHTML = `
                <div class="teams-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${teams.map(team => `
                        <div class="content-card team-card" data-team-id="${team.id}">
                            <div class="content-card-header">
                                <div class="content-card-title">${team.name}</div>
                                <span class="status-badge status-${team.status}">
                                    ${team.status}
                                </span>
                            </div>
                            <div class="content-card-body">
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #666;">Manager:</span>
                                        <span style="font-weight: 500;">${team.manager}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #666;">League:</span>
                                        <span>${team.league}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #666;">Players:</span>
                                        <span>${team.players}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #666;">Home Venue:</span>
                                        <span>${team.homeVenue}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #666;">Founded:</span>
                                        <span>${team.founded}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e9ecef;">
                                    <button class="btn btn-sm" onclick="SPAModules.teams.editTeam(${team.id})">Edit</button>
                                    <button class="btn btn-sm btn-outline" onclick="SPAModules.teams.viewPlayers(${team.id})">Players</button>
                                    <button class="btn btn-sm btn-outline" onclick="SPAModules.teams.viewStats(${team.id})">Stats</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        searchTeams() {
            console.log('Searching teams...');
            this.loadTeams(); // Reload with search
        },

        filterTeams() {
            console.log('Filtering teams...');
            this.loadTeams(); // Reload with filters
        },

        addTeam() {
            alert('Add Team: This would open a modal/form to add a new team');
        },

        importTeams() {
            alert('Import Teams: This would open a file upload dialog');
        },

        editTeam(id) {
            alert(`Edit Team ${id}: This would open an edit form`);
        },

        viewPlayers(id) {
            alert(`View Players for Team ${id}: This would show team roster`);
        },

        viewStats(id) {
            alert(`View Stats for Team ${id}: This would show team statistics`);
        }
    };

    // Placeholder modules for other sections
    ['referees', 'divisions', 'leagues', 'pitches', 'venues', 'team-payments', 'settings'].forEach(moduleName => {
        modules[moduleName] = {
            async render() {
                const title = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace('-', ' ');
                return `
                    <div class="content-area">
                        <div class="page-header">
                            <div class="page-title-section">
                                <h1 class="content-title">${title}</h1>
                                <p class="page-subtitle">Manage ${title.toLowerCase()} information and settings</p>
                            </div>
                        </div>
                        
                        <div class="module-content">
                            <div class="placeholder-content">
                                <h3>Coming Soon</h3>
                                <p>The ${title} module is being converted to the new SPA architecture.</p>
                                <p>This section will be available shortly with enhanced functionality.</p>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init() {
                console.log(`${moduleName} module initialized`);
            }
        };
    });

    // Helper function to register custom modules
    function registerModule(name, moduleDefinition) {
        modules[name] = moduleDefinition;
        console.log(`Module '${name}' registered successfully`);
    }

    // Helper function to get a module
    function getModule(name) {
        return modules[name] || null;
    }

    // Helper function to list all modules
    function getAllModules() {
        return Object.keys(modules);
    }

    // Return public API and modules
    return {
        ...modules,
        registerModule,
        getModule,
        getAllModules
    };
})();