/**
 * 5ive Trackr Leagues
 * This file contains JavaScript functionality for the leagues page.
 */

// League Management System
const LeagueManager = (function() {
    // Private variables
    let leagues = [];
    let filteredLeagues = [];
    
    // Mock data for development
    const mockLeagues = [
        {
            id: 'league-001',
            name: 'Monday Night Premier',
            season: 'Summer 2025',
            status: 'active',
            startDate: '2025-06-01',
            endDate: '2025-08-31',
            venue: {
                id: 'venue-1',
                name: 'SportCity Indoor'
            },
            teams: 10,
            matchesPlayed: 24,
            matchesRemaining: 21,
            settings: {
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                maxTeams: 10,
                matchDuration: 40,
                registrationOpen: true,
                automaticScheduling: true,
                publishResults: true
            },
            standings: [
                { position: 1, teamId: 'team-1', teamName: 'FC United', played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 17, goalsAgainst: 7, goalDifference: 10, points: 13 },
                { position: 2, teamId: 'team-2', teamName: 'Real Sociable', played: 5, won: 3, drawn: 2, lost: 0, goalsFor: 12, goalsAgainst: 6, goalDifference: 6, points: 11 },
                { position: 3, teamId: 'team-3', teamName: 'Spartak Mossley', played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 14, goalsAgainst: 8, goalDifference: 6, points: 10 },
                { position: 4, teamId: 'team-4', teamName: 'AC Milanchester', played: 4, won: 3, drawn: 0, lost: 1, goalsFor: 10, goalsAgainst: 5, goalDifference: 5, points: 9 },
                { position: 5, teamId: 'team-5', teamName: 'Inter The Valley', played: 5, won: 2, drawn: 1, lost: 2, goalsFor: 11, goalsAgainst: 9, goalDifference: 2, points: 7 },
                { position: 6, teamId: 'team-6', teamName: 'Borussia Toxteth', played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 7, goalsAgainst: 9, goalDifference: -2, points: 5 },
                { position: 7, teamId: 'team-7', teamName: 'Bayer Neverlusen', played: 5, won: 1, drawn: 1, lost: 3, goalsFor: 6, goalsAgainst: 12, goalDifference: -6, points: 4 },
                { position: 8, teamId: 'team-8', teamName: 'Sporting Denton', played: 5, won: 1, drawn: 0, lost: 4, goalsFor: 5, goalsAgainst: 13, goalDifference: -8, points: 3 },
                { position: 9, teamId: 'team-9', teamName: 'Athletico Bilstow', played: 4, won: 0, drawn: 2, lost: 2, goalsFor: 5, goalsAgainst: 10, goalDifference: -5, points: 2 },
                { position: 10, teamId: 'team-10', teamName: 'FC Barca-lona', played: 5, won: 0, drawn: 0, lost: 5, goalsFor: 4, goalsAgainst: 12, goalDifference: -8, points: 0 }
            ]
        },
        {
            id: 'league-002',
            name: 'Wednesday Champions League',
            season: 'Summer 2025',
            status: 'active',
            startDate: '2025-06-03',
            endDate: '2025-08-26',
            venue: {
                id: 'venue-2',
                name: 'Riverside Courts'
            },
            teams: 8,
            matchesPlayed: 10,
            matchesRemaining: 18,
            settings: {
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                maxTeams: 8,
                matchDuration: 40,
                registrationOpen: false,
                automaticScheduling: true,
                publishResults: true
            }
        },
        {
            id: 'league-003',
            name: 'Thursday Night Division',
            season: 'Summer 2025',
            status: 'active',
            startDate: '2025-06-04',
            endDate: '2025-08-27',
            venue: {
                id: 'venue-1',
                name: 'SportCity Indoor'
            },
            teams: 12,
            matchesPlayed: 15,
            matchesRemaining: 51,
            settings: {
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                maxTeams: 12,
                matchDuration: 30,
                registrationOpen: false,
                automaticScheduling: true,
                publishResults: true
            }
        },
        {
            id: 'league-004',
            name: 'Weekend Warriors Cup',
            season: 'Summer 2025',
            status: 'upcoming',
            startDate: '2025-07-05',
            endDate: '2025-09-28',
            venue: {
                id: 'venue-3',
                name: 'Central Pitches'
            },
            teams: 6,
            matchesPlayed: 0,
            matchesRemaining: 30,
            settings: {
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                maxTeams: 8,
                matchDuration: 40,
                registrationOpen: true,
                automaticScheduling: true,
                publishResults: true
            }
        },
        {
            id: 'league-005',
            name: 'Spring Invitational',
            season: 'Spring 2025',
            status: 'completed',
            startDate: '2025-03-01',
            endDate: '2025-05-30',
            venue: {
                id: 'venue-1',
                name: 'SportCity Indoor'
            },
            teams: 10,
            matchesPlayed: 45,
            matchesRemaining: 0,
            settings: {
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                maxTeams: 10,
                matchDuration: 40,
                registrationOpen: false,
                automaticScheduling: true,
                publishResults: true
            }
        },
        {
            id: 'league-006',
            name: 'Winter Championship',
            season: 'Winter 2024',
            status: 'archived',
            startDate: '2024-12-01',
            endDate: '2025-02-28',
            venue: {
                id: 'venue-2',
                name: 'Riverside Courts'
            },
            teams: 8,
            matchesPlayed: 28,
            matchesRemaining: 0,
            settings: {
                pointsForWin: 3,
                pointsForDraw: 1,
                pointsForLoss: 0,
                maxTeams: 8,
                matchDuration: 40,
                registrationOpen: false,
                automaticScheduling: true,
                publishResults: true
            }
        }
    ];
    
    // DOM Elements
    let leaguesGrid;
    let createLeagueModal;
    let leagueDetailsModal;
    let createLeagueForm;
    let searchInput;
    let statusFilter;
    let seasonFilter;
    
    // Initialize the module
    function init() {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            window.location.href = 'home.html';
            return;
        }
        
        // Get DOM elements
        leaguesGrid = document.getElementById('leagues-grid');
        createLeagueModal = document.getElementById('create-league-modal');
        leagueDetailsModal = document.getElementById('league-details-modal');
        createLeagueForm = document.getElementById('create-league-form');
        searchInput = document.getElementById('search-leagues');
        statusFilter = document.getElementById('league-status-filter');
        seasonFilter = document.getElementById('league-season-filter');
        
        // Load leagues data
        loadLeagues();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    // Check if user is logged in
    function isUserLoggedIn() {
        // Use the SessionManager from auth.js
        return SessionManager.isLoggedIn();
    }
    
    // Load leagues data
    function loadLeagues() {
        // In a real app, this would fetch from a server
        // For now, use mock data
        leagues = mockLeagues;
        filteredLeagues = [...leagues];
        
        // Render leagues
        renderLeagues();
    }
    
    // Render leagues
    function renderLeagues() {
        if (!leaguesGrid) return;
        
        // Clear the grid
        leaguesGrid.innerHTML = '';
        
        if (filteredLeagues.length === 0) {
            leaguesGrid.innerHTML = '<div class="no-results">No leagues found matching your criteria.</div>';
            return;
        }
        
        // Create league cards
        filteredLeagues.forEach(league => {
            const leagueCard = createLeagueCard(league);
            leaguesGrid.appendChild(leagueCard);
        });
    }
    
    // Create a league card element
    function createLeagueCard(league) {
        const card = document.createElement('div');
        card.className = 'league-card';
        card.dataset.leagueId = league.id;
        
        // Format dates
        const startDate = new Date(league.startDate);
        const endDate = new Date(league.endDate);
        const formattedStartDate = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedEndDate = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        
        card.innerHTML = `
            <div class="league-card-header ${league.status}">
                <div class="league-status ${league.status}">${capitalizeFirstLetter(league.status)}</div>
                <h3 class="league-name">${league.name}</h3>
                <div class="league-season">${league.season}</div>
            </div>
            <div class="league-card-body">
                <div class="league-stats">
                    <div class="league-stat">
                        <div class="league-stat-value">${league.teams}</div>
                        <div class="league-stat-label">Teams</div>
                    </div>
                    <div class="league-stat">
                        <div class="league-stat-value">${league.matchesPlayed}</div>
                        <div class="league-stat-label">Played</div>
                    </div>
                    <div class="league-stat">
                        <div class="league-stat-value">${league.matchesRemaining}</div>
                        <div class="league-stat-label">Remaining</div>
                    </div>
                </div>
                <div class="league-dates">
                    <div>${formattedStartDate}</div>
                    <div>to</div>
                    <div>${formattedEndDate}</div>
                </div>
            </div>
        `;
        
        // Add click event to show league details
        card.addEventListener('click', () => {
            showLeagueDetails(league.id);
        });
        
        return card;
    }
    
    // Show league details modal
    function showLeagueDetails(leagueId) {
        // Find the league
        const league = leagues.find(l => l.id === leagueId);
        if (!league) return;
        
        // Update modal title
        const titleElement = document.getElementById('league-details-title');
        if (titleElement) {
            titleElement.textContent = `${league.name} - ${league.season}`;
        }
        
        // Populate standings if available
        if (league.standings) {
            const standingsTableBody = document.getElementById('standings-table-body');
            if (standingsTableBody) {
                standingsTableBody.innerHTML = '';
                
                league.standings.forEach(team => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${team.position}</td>
                        <td>${team.teamName}</td>
                        <td>${team.played}</td>
                        <td>${team.won}</td>
                        <td>${team.drawn}</td>
                        <td>${team.lost}</td>
                        <td>${team.goalsFor}</td>
                        <td>${team.goalsAgainst}</td>
                        <td>${team.goalDifference}</td>
                        <td><strong>${team.points}</strong></td>
                    `;
                    standingsTableBody.appendChild(row);
                });
            }
        }
        
        // Show the modal
        leagueDetailsModal.classList.add('active');
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Create league button
        const createLeagueBtn = document.getElementById('create-league-btn');
        if (createLeagueBtn) {
            createLeagueBtn.addEventListener('click', () => {
                createLeagueModal.classList.add('active');
            });
        }
        
        // Close modal buttons
        const closeButtons = document.querySelectorAll('.close-button, .cancel-button');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                createLeagueModal.classList.remove('active');
                leagueDetailsModal.classList.remove('active');
            });
        });
        
        // Create league form submission
        if (createLeagueForm) {
            createLeagueForm.addEventListener('submit', (e) => {
                e.preventDefault();
                createNewLeague();
            });
        }
        
        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', filterLeagues);
        }
        
        // Filters
        if (statusFilter) {
            statusFilter.addEventListener('change', filterLeagues);
        }
        
        if (seasonFilter) {
            seasonFilter.addEventListener('change', filterLeagues);
        }
        
        // Tab navigation
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding tab pane
                const tabPanes = document.querySelectorAll('.tab-pane');
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                const tabId = tab.getAttribute('data-tab');
                const targetPane = document.getElementById(`${tabId}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }
    
    // Create a new league
    function createNewLeague() {
        // Get form data
        const formData = new FormData(createLeagueForm);
        
        // Create league object
        const newLeague = {
            id: 'league-' + (leagues.length + 1).toString().padStart(3, '0'),
            name: formData.get('league-name'),
            season: formData.get('league-season'),
            status: 'upcoming',
            startDate: formData.get('start-date'),
            endDate: formData.get('end-date'),
            venue: {
                id: formData.get('league-venue'),
                name: document.querySelector(`#league-venue option[value="${formData.get('league-venue')}"]`).textContent
            },
            teams: 0,
            matchesPlayed: 0,
            matchesRemaining: 0,
            settings: {
                pointsForWin: parseInt(formData.get('points-win')),
                pointsForDraw: parseInt(formData.get('points-draw')),
                pointsForLoss: parseInt(formData.get('points-loss')),
                maxTeams: parseInt(formData.get('max-teams')),
                matchDuration: parseInt(formData.get('match-duration')),
                registrationOpen: formData.getAll('settings').includes('registration-open'),
                automaticScheduling: formData.getAll('settings').includes('automatic-scheduling'),
                publishResults: formData.getAll('settings').includes('publish-results')
            }
        };
        
        // Add to leagues array
        leagues.unshift(newLeague);
        
        // Update filtered leagues
        filterLeagues();
        
        // Hide modal
        createLeagueModal.classList.remove('active');
        
        // Reset form
        createLeagueForm.reset();
        
        // Show success message
        alert('League created successfully!');
    }
    
    // Filter leagues based on search and filters
    function filterLeagues() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const seasonValue = seasonFilter.value;
        
        filteredLeagues = leagues.filter(league => {
            // Search term filter
            const matchesSearch = 
                league.name.toLowerCase().includes(searchTerm) || 
                league.season.toLowerCase().includes(searchTerm);
            
            // Status filter
            const matchesStatus = statusValue === 'all' || league.status === statusValue;
            
            // Season filter (simplified for demo)
            const matchesSeason = seasonValue === 'all' || 
                                 league.season.toLowerCase().replace(' ', '-') === seasonValue;
            
            return matchesSearch && matchesStatus && matchesSeason;
        });
        
        renderLeagues();
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Public API
    return {
        init: init
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    LeagueManager.init();
});
