/**
 * Teams Management Module - 5ive Trackr
 * © 2025 5ive Trackr. All rights reserved.
 * This code is protected by copyright and is the intellectual property of 5ive Trackr.
 * Unauthorized use, reproduction, modification, distribution, or disclosure is prohibited.
 */

// Self-invoking function to create a module pattern with private scope
(function() {
    // First check if user is logged in
    if (!SessionManager.isLoggedIn()) {
        window.location.href = 'home.html';
        return;
    }
    
    // References to DOM elements
    const teamsList = document.getElementById('teams-list');
    const registerTeamBtn = document.getElementById('register-team-btn');
    const registerTeamModal = document.getElementById('register-team-modal');
    const teamDetailsModal = document.getElementById('team-details-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const cancelButtons = document.querySelectorAll('.cancel-button');
    const registerTeamForm = document.getElementById('register-team-form');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerList = document.getElementById('player-list');
    const searchTeamsInput = document.getElementById('search-teams');
    const leagueFilter = document.getElementById('league-filter');
    
    // Counter for player numbers
    let playerCounter = 6; // Start from 6 as we already have 5 players in the form
    
    /**
     * Team Manager Module - Handles team data operations
     */
    const TeamManager = (function() {
        // Private storage for team data
        let teams = getTeamsFromStorage() || [];
        
        // Validates team data before saving
        function validateTeamData(teamData) {
            if (!teamData.name || teamData.name.trim() === '') {
                return { valid: false, message: 'Team name is required' };
            }
            
            if (!teamData.leagueId || teamData.leagueId.trim() === '') {
                return { valid: false, message: 'League selection is required' };
            }
            
            if (!teamData.captain.name || teamData.captain.name.trim() === '') {
                return { valid: false, message: 'Captain name is required' };
            }
            
            if (!teamData.captain.email || !isValidEmail(teamData.captain.email)) {
                return { valid: false, message: 'Valid captain email is required' };
            }
            
            if (!teamData.captain.phone || !isValidPhone(teamData.captain.phone)) {
                return { valid: false, message: 'Valid captain phone number is required' };
            }
            
            if (teamData.players.length < 5) {
                return { valid: false, message: 'At least 5 players are required' };
            }
            
            return { valid: true };
        }
        
        // Email validation helper
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
        
        // Phone validation helper
        function isValidPhone(phone) {
            const phoneRegex = /^[0-9]{11}$/;
            return phoneRegex.test(phone);
        }
        
        // Generate unique ID for team
        function generateUniqueId() {
            return 'team-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }
        
        // Get teams from local storage
        function getTeamsFromStorage() {
            const teamsData = sessionStorage.getItem('5iveTrackr_teams');
            return teamsData ? JSON.parse(teamsData) : null;
        }
        
        // Save teams to local storage
        function saveTeamsToStorage() {
            sessionStorage.setItem('5iveTrackr_teams', JSON.stringify(teams));
        }
        
        // Get league name from league ID
        function getLeagueName(leagueId) {
            const leagues = {
                'league-001': 'Monday Night Premier',
                'league-002': 'Wednesday Champions League',
                'league-003': 'Thursday Night Division',
                'league-004': 'Weekend Warriors Cup'
            };
            
            return leagues[leagueId] || 'Unknown League';
        }
        
        // Initialize with some sample teams if none exist
        function initializeWithSampleTeams() {
            if (teams.length === 0) {
                teams = [
                    {
                        id: 'team-001',
                        name: 'Real Madridles',
                        leagueId: 'league-001',
                        leagueName: 'Monday Night Premier',
                        primaryColor: '#FFFFFF',
                        secondaryColor: '#FFC107',
                        captain: {
                            name: 'John Smith',
                            phone: '07700900123',
                            email: 'john.smith@example.com'
                        },
                        players: [
                            'John Smith',
                            'Mike Johnson',
                            'David Lee',
                            'Robert Brown',
                            'Chris Wilson',
                            'Paul Thompson'
                        ],
                        notes: 'Defending champions from last season',
                        stats: {
                            played: 4,
                            won: 3,
                            drawn: 1,
                            lost: 0,
                            goalsFor: 15,
                            goalsAgainst: 5,
                            points: 10,
                            position: 1
                        },
                        topScorers: [
                            { name: 'Mike Johnson', goals: 7 },
                            { name: 'David Lee', goals: 5 },
                            { name: 'John Smith', goals: 3 }
                        ]
                    },
                    {
                        id: 'team-002',
                        name: 'Barca Loungers',
                        leagueId: 'league-001',
                        leagueName: 'Monday Night Premier',
                        primaryColor: '#004D98',
                        secondaryColor: '#A50044',
                        captain: {
                            name: 'Alex Williams',
                            phone: '07700900124',
                            email: 'alex.williams@example.com'
                        },
                        players: [
                            'Alex Williams',
                            'Sam Taylor',
                            'Jamie Anderson',
                            'Pat Robinson',
                            'Jordan Clark',
                            'Casey White'
                        ],
                        notes: 'New team this season',
                        stats: {
                            played: 4,
                            won: 2,
                            drawn: 1,
                            lost: 1,
                            goalsFor: 10,
                            goalsAgainst: 7,
                            points: 7,
                            position: 2
                        },
                        topScorers: [
                            { name: 'Sam Taylor', goals: 5 },
                            { name: 'Jamie Anderson', goals: 3 },
                            { name: 'Casey White', goals: 2 }
                        ]
                    },
                    {
                        id: 'team-003',
                        name: 'Inter Your Nan',
                        leagueId: 'league-002',
                        leagueName: 'Wednesday Champions League',
                        primaryColor: '#0A1647',
                        secondaryColor: '#00B1FC',
                        captain: {
                            name: 'Tony Martin',
                            phone: '07700900125',
                            email: 'tony.martin@example.com'
                        },
                        players: [
                            'Tony Martin',
                            'Gary Evans',
                            'Steve Davis',
                            'Phil Mitchell',
                            'Andy Murray',
                            'Kevin Lewis'
                        ],
                        notes: 'Team with strong defensive record',
                        stats: {
                            played: 3,
                            won: 2,
                            drawn: 0,
                            lost: 1,
                            goalsFor: 8,
                            goalsAgainst: 4,
                            points: 6,
                            position: 1
                        },
                        topScorers: [
                            { name: 'Phil Mitchell', goals: 4 },
                            { name: 'Kevin Lewis', goals: 2 },
                            { name: 'Gary Evans', goals: 2 }
                        ]
                    }
                ];
                
                saveTeamsToStorage();
            }
        }
        
        // Public API
        return {
            // Initialize team manager
            init: function() {
                initializeWithSampleTeams();
                return this;
            },
            
            // Get all teams
            getAllTeams: function() {
                return teams;
            },
            
            // Get teams by league
            getTeamsByLeague: function(leagueId) {
                if (leagueId === 'all') {
                    return teams;
                }
                return teams.filter(team => team.leagueId === leagueId);
            },
            
            // Get team by ID
            getTeamById: function(teamId) {
                return teams.find(team => team.id === teamId);
            },
            
            // Create a new team
            createTeam: function(teamData) {
                // Validate team data
                const validation = validateTeamData(teamData);
                if (!validation.valid) {
                    return { success: false, message: validation.message };
                }
                
                // Create team object
                const newTeam = {
                    id: generateUniqueId(),
                    name: teamData.name,
                    leagueId: teamData.leagueId,
                    leagueName: getLeagueName(teamData.leagueId),
                    primaryColor: teamData.primaryColor,
                    secondaryColor: teamData.secondaryColor,
                    captain: {
                        name: teamData.captain.name,
                        phone: teamData.captain.phone,
                        email: teamData.captain.email
                    },
                    players: teamData.players,
                    notes: teamData.notes || '',
                    stats: {
                        played: 0,
                        won: 0,
                        drawn: 0,
                        lost: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        points: 0,
                        position: '-'
                    },
                    topScorers: []
                };
                
                // Add to teams array
                teams.push(newTeam);
                
                // Save to storage
                saveTeamsToStorage();
                
                return { success: true, teamId: newTeam.id };
            },
            
            // Update an existing team
            updateTeam: function(teamId, updatedData) {
                const teamIndex = teams.findIndex(team => team.id === teamId);
                if (teamIndex === -1) {
                    return { success: false, message: 'Team not found' };
                }
                
                // Update team data
                teams[teamIndex] = {
                    ...teams[teamIndex],
                    ...updatedData
                };
                
                // Save to storage
                saveTeamsToStorage();
                
                return { success: true };
            },
            
            // Delete a team
            deleteTeam: function(teamId) {
                const teamIndex = teams.findIndex(team => team.id === teamId);
                if (teamIndex === -1) {
                    return { success: false, message: 'Team not found' };
                }
                
                // Remove team from array
                teams.splice(teamIndex, 1);
                
                // Save to storage
                saveTeamsToStorage();
                
                return { success: true };
            },
            
            // Search teams by name
            searchTeams: function(query, leagueId = 'all') {
                let filteredTeams = teams;
                
                // Filter by league if specified
                if (leagueId !== 'all') {
                    filteredTeams = filteredTeams.filter(team => team.leagueId === leagueId);
                }
                
                // Filter by search query if specified
                if (query && query.trim() !== '') {
                    const searchTerm = query.toLowerCase().trim();
                    filteredTeams = filteredTeams.filter(team => 
                        team.name.toLowerCase().includes(searchTerm) ||
                        team.leagueName.toLowerCase().includes(searchTerm) ||
                        team.players.some(player => player.toLowerCase().includes(searchTerm))
                    );
                }
                
                return filteredTeams;
            }
        };
    })();
    
    /**
     * UI Manager Module - Handles the user interface interactions
     */
    const UIManager = (function() {
        // Generate team card HTML
        function generateTeamCardHTML(team) {
            const initials = team.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
            
            return `
                <div class="team-card" data-team-id="${team.id}">
                    <div class="team-card-header">
                        <div class="team-logo" style="background-color: ${team.primaryColor}; color: ${team.secondaryColor}">${initials}</div>
                        <div class="team-details">
                            <div class="team-name">${team.name}</div>
                            <div class="team-league">${team.leagueName}</div>
                        </div>
                    </div>
                    <div class="team-card-content">
                        <div class="team-stats">
                            <div class="team-stat">
                                <div class="stat-value">${team.stats.played}</div>
                                <div class="stat-label">Played</div>
                            </div>
                            <div class="team-stat">
                                <div class="stat-value">${team.stats.won}</div>
                                <div class="stat-label">Won</div>
                            </div>
                            <div class="team-stat">
                                <div class="stat-value">${team.stats.drawn}</div>
                                <div class="stat-label">Drawn</div>
                            </div>
                            <div class="team-stat">
                                <div class="stat-value">${team.stats.lost}</div>
                                <div class="stat-label">Lost</div>
                            </div>
                        </div>
                        <div class="team-players">
                            <div class="team-players-title">
                                Squad <span class="player-count">${team.players.length}</span>
                            </div>
                            <div class="player-list">
                                ${team.players.slice(0, 3).map((player, index) => `
                                    <div class="player-item">
                                        <div class="player-number">${index + 1}</div>
                                        ${player}
                                    </div>
                                `).join('')}
                                ${team.players.length > 3 ? `
                                    <div class="player-item">
                                        <div class="player-number">+${team.players.length - 3}</div>
                                        more players
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Generate team details HTML for modal
        function generateTeamDetailsHTML(team) {
            const initials = team.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
            
            // Update the title
            document.getElementById('team-details-title').textContent = team.name;
            
            // Update the team header
            document.getElementById('team-logo').style.backgroundColor = team.primaryColor;
            document.getElementById('team-logo').style.color = team.secondaryColor;
            document.getElementById('team-logo').textContent = initials;
            document.getElementById('team-detail-name').textContent = team.name;
            document.getElementById('team-league-name').textContent = team.leagueName;
            
            // Update squad list
            const squadList = document.getElementById('squad-list');
            squadList.innerHTML = team.players.map((player, index) => `
                <div class="player-item">
                    <div class="player-number">${index + 1}</div>
                    <div class="player-name">${player}</div>
                </div>
            `).join('');
            
            // Update captain details
            const captainInfo = document.getElementById('captain-info');
            captainInfo.innerHTML = `
                <div class="captain-detail">
                    <div class="captain-detail-label">Name:</div>
                    <div>${team.captain.name}</div>
                </div>
                <div class="captain-detail">
                    <div class="captain-detail-label">Phone:</div>
                    <div>${team.captain.phone}</div>
                </div>
                <div class="captain-detail">
                    <div class="captain-detail-label">Email:</div>
                    <div>${team.captain.email}</div>
                </div>
            `;
            
            // Update statistics
            document.getElementById('stat-played').textContent = team.stats.played;
            document.getElementById('stat-won').textContent = team.stats.won;
            document.getElementById('stat-drawn').textContent = team.stats.drawn;
            document.getElementById('stat-lost').textContent = team.stats.lost;
            document.getElementById('stat-goals-for').textContent = team.stats.goalsFor;
            document.getElementById('stat-goals-against').textContent = team.stats.goalsAgainst;
            document.getElementById('stat-points').textContent = team.stats.points;
            document.getElementById('stat-position').textContent = team.stats.position;
            
            // Update top scorers
            const topScorers = document.getElementById('top-scorers');
            if (team.topScorers && team.topScorers.length > 0) {
                topScorers.innerHTML = team.topScorers.map(scorer => `
                    <div class="scorer-item">
                        <div class="scorer-name">${scorer.name}</div>
                        <div class="scorer-goals">${scorer.goals}</div>
                    </div>
                `).join('');
            } else {
                topScorers.innerHTML = '<p>No goal statistics available yet.</p>';
            }
            
            // Update fixtures (placeholder data)
            const upcomingFixtures = document.getElementById('upcoming-fixtures');
            upcomingFixtures.innerHTML = `
                <div class="fixture-item">
                    <div class="fixture-date">Monday, 15 June 2025 - 19:00</div>
                    <div class="fixture-teams">
                        <div class="fixture-team home">
                            <div class="fixture-team-name">${team.name}</div>
                            <div class="team-logo" style="background-color: ${team.primaryColor}; color: ${team.secondaryColor}; width: 30px; height: 30px; font-size: 14px;">${initials}</div>
                        </div>
                        <div class="fixture-score">
                            <div class="fixture-vs">vs</div>
                        </div>
                        <div class="fixture-team away">
                            <div class="team-logo" style="background-color: #004D98; color: #A50044; width: 30px; height: 30px; font-size: 14px;">BL</div>
                            <div class="fixture-team-name">Barca Loungers</div>
                        </div>
                    </div>
                </div>
                <div class="fixture-item">
                    <div class="fixture-date">Monday, 22 June 2025 - 20:00</div>
                    <div class="fixture-teams">
                        <div class="fixture-team home">
                            <div class="fixture-team-name">Inter Your Nan</div>
                            <div class="team-logo" style="background-color: #0A1647; color: #00B1FC; width: 30px; height: 30px; font-size: 14px;">IY</div>
                        </div>
                        <div class="fixture-score">
                            <div class="fixture-vs">vs</div>
                        </div>
                        <div class="fixture-team away">
                            <div class="team-logo" style="background-color: ${team.primaryColor}; color: ${team.secondaryColor}; width: 30px; height: 30px; font-size: 14px;">${initials}</div>
                            <div class="fixture-team-name">${team.name}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Update recent results (placeholder data)
            const recentResults = document.getElementById('recent-results');
            recentResults.innerHTML = `
                <div class="fixture-item">
                    <div class="fixture-date">Monday, 1 June 2025 - 19:00</div>
                    <div class="fixture-teams">
                        <div class="fixture-team home ${team.stats.won > 0 ? 'result-winner' : ''}">
                            <div class="fixture-team-name">${team.name}</div>
                            <div class="team-logo" style="background-color: ${team.primaryColor}; color: ${team.secondaryColor}; width: 30px; height: 30px; font-size: 14px;">${initials}</div>
                        </div>
                        <div class="fixture-score">
                            <div class="result-score">3 - 1</div>
                        </div>
                        <div class="fixture-team away result-loser">
                            <div class="team-logo" style="background-color: #FF5733; color: #000000; width: 30px; height: 30px; font-size: 14px;">AC</div>
                            <div class="fixture-team-name">Athletic Bilbao</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Update settings form fields
            document.getElementById('edit-team-name').value = team.name;
            document.getElementById('edit-primary-color').value = team.primaryColor;
            document.getElementById('edit-secondary-color').value = team.secondaryColor;
            document.getElementById('edit-captain-name').value = team.captain.name;
            document.getElementById('edit-captain-phone').value = team.captain.phone;
            document.getElementById('edit-captain-email').value = team.captain.email;
            
            // Store team ID in form for later use
            document.getElementById('team-settings-form').dataset.teamId = team.id;
        }
        
        // Public API
        return {
            // Display teams in the UI
            displayTeams: function(teams) {
                if (teamsList) {
                    teamsList.innerHTML = '';
                    
                    if (teams.length === 0) {
                        teamsList.innerHTML = `
                            <div class="empty-state">
                                <p>No teams found. Click "Register New Team" to add a team.</p>
                            </div>
                        `;
                        return;
                    }
                    
                    teams.forEach(team => {
                        teamsList.innerHTML += generateTeamCardHTML(team);
                    });
                }
            },
            
            // Show team details in modal
            showTeamDetails: function(team) {
                generateTeamDetailsHTML(team);
                teamDetailsModal.classList.add('active');
            },
            
            // Show register team modal
            showRegisterTeamModal: function() {
                registerTeamModal.classList.add('active');
            },
            
            // Hide modals
            hideModals: function() {
                registerTeamModal.classList.remove('active');
                teamDetailsModal.classList.remove('active');
            },
            
            // Add a new player field to the form
            addPlayerField: function() {
                const playerItem = document.createElement('div');
                playerItem.className = 'player-item';
                playerItem.innerHTML = `
                    <div class="player-number">${playerCounter}</div>
                    <input type="text" name="player-${playerCounter}" placeholder="Player name">
                    <button type="button" class="remove-player-btn">&times;</button>
                `;
                
                const removeButton = playerItem.querySelector('.remove-player-btn');
                removeButton.addEventListener('click', function() {
                    playerItem.remove();
                });
                
                playerList.appendChild(playerItem);
                playerCounter++;
            },
            
            // Get team data from form
            getTeamFormData: function() {
                const teamName = document.getElementById('team-name').value;
                const leagueId = document.getElementById('team-league').value;
                const primaryColor = document.getElementById('primary-color').value;
                const secondaryColor = document.getElementById('secondary-color').value;
                const captainName = document.getElementById('captain-name').value;
                const captainPhone = document.getElementById('captain-phone').value;
                const captainEmail = document.getElementById('captain-email').value;
                const teamNotes = document.getElementById('team-notes').value;
                
                // Get all players
                const players = [];
                const playerInputs = document.querySelectorAll('#player-list input[type="text"]');
                playerInputs.forEach(input => {
                    if (input.value && input.value.trim() !== '') {
                        players.push(input.value.trim());
                    }
                });
                
                return {
                    name: teamName,
                    leagueId: leagueId,
                    primaryColor: primaryColor,
                    secondaryColor: secondaryColor,
                    captain: {
                        name: captainName,
                        phone: captainPhone,
                        email: captainEmail
                    },
                    players: players,
                    notes: teamNotes
                };
            },
            
            // Reset register team form
            resetTeamForm: function() {
                registerTeamForm.reset();
                
                // Reset player list to 5 default players
                playerList.innerHTML = '';
                for (let i = 1; i <= 5; i++) {
                    playerList.innerHTML += `
                        <div class="player-item">
                            <div class="player-number">${i}</div>
                            <input type="text" name="player-${i}" placeholder="Player name" required>
                        </div>
                    `;
                }
                
                playerCounter = 6; // Reset counter
            },
            
            // Show notification
            showNotification: function(message, type = 'success') {
                alert(message); // Simple alert for now, can be replaced with a custom notification
            }
        };
    })();
    
    /**
     * Tab Manager - Handles tab switching in modals
     */
    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and tab panes
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding tab pane
                const tabId = this.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    /**
     * Event handlers
     */
    function setupEventListeners() {
        // Show register team modal
        if (registerTeamBtn) {
            registerTeamBtn.addEventListener('click', function() {
                UIManager.showRegisterTeamModal();
            });
        }
        
        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                UIManager.hideModals();
            });
        });
        
        cancelButtons.forEach(button => {
            button.addEventListener('click', function() {
                UIManager.hideModals();
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === registerTeamModal || event.target === teamDetailsModal) {
                UIManager.hideModals();
            }
        });
        
        // Add player field
        if (addPlayerBtn) {
            addPlayerBtn.addEventListener('click', function() {
                UIManager.addPlayerField();
            });
        }
        
        // Register team form submission
        if (registerTeamForm) {
            registerTeamForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const teamData = UIManager.getTeamFormData();
                const result = TeamManager.createTeam(teamData);
                
                if (result.success) {
                    UIManager.showNotification('Team registered successfully');
                    UIManager.resetTeamForm();
                    UIManager.hideModals();
                    
                    // Refresh teams list
                    UIManager.displayTeams(TeamManager.getAllTeams());
                } else {
                    UIManager.showNotification(result.message, 'error');
                }
            });
        }
        
        // Team card click
        if (teamsList) {
            teamsList.addEventListener('click', function(event) {
                const teamCard = event.target.closest('.team-card');
                if (teamCard) {
                    const teamId = teamCard.dataset.teamId;
                    const team = TeamManager.getTeamById(teamId);
                    
                    if (team) {
                        UIManager.showTeamDetails(team);
                    }
                }
            });
        }
        
        // Search teams
        if (searchTeamsInput) {
            searchTeamsInput.addEventListener('input', function() {
                const query = this.value;
                const leagueId = leagueFilter.value;
                
                const filteredTeams = TeamManager.searchTeams(query, leagueId);
                UIManager.displayTeams(filteredTeams);
            });
        }
        
        // Filter teams by league
        if (leagueFilter) {
            leagueFilter.addEventListener('change', function() {
                const leagueId = this.value;
                const query = searchTeamsInput.value;
                
                const filteredTeams = TeamManager.searchTeams(query, leagueId);
                UIManager.displayTeams(filteredTeams);
            });
        }
        
        // Team settings form submission
        const teamSettingsForm = document.getElementById('team-settings-form');
        if (teamSettingsForm) {
            teamSettingsForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const teamId = this.dataset.teamId;
                const updatedData = {
                    name: document.getElementById('edit-team-name').value,
                    primaryColor: document.getElementById('edit-primary-color').value,
                    secondaryColor: document.getElementById('edit-secondary-color').value,
                    captain: {
                        name: document.getElementById('edit-captain-name').value,
                        phone: document.getElementById('edit-captain-phone').value,
                        email: document.getElementById('edit-captain-email').value
                    }
                };
                
                const result = TeamManager.updateTeam(teamId, updatedData);
                
                if (result.success) {
                    UIManager.showNotification('Team updated successfully');
                    UIManager.hideModals();
                    
                    // Refresh teams list
                    UIManager.displayTeams(TeamManager.getAllTeams());
                } else {
                    UIManager.showNotification(result.message, 'error');
                }
            });
        }
    }
    
    /**
     * Initialize the application
     */
    function init() {
        // Initialize team manager
        TeamManager.init();
        
        // Display teams
        UIManager.displayTeams(TeamManager.getAllTeams());
        
        // Setup tab switching
        setupTabSwitching();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    // Initialize when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Update username from session
    const currentUser = SessionManager.getCurrentUser();
    if (currentUser && document.getElementById('user-name')) {
        document.getElementById('user-name').textContent = SessionManager.getDisplayName();
    }
})();
