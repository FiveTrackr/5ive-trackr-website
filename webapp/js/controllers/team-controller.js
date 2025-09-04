/**
 * 5ive Trackr Team Controller
 * 
 * Handles all team management functionality within a league
 * 
 * @copyright 5ive Trackr 2025
 */

class TeamController {
    /**
     * Initialize the team controller
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
        this.teamsList = document.getElementById('teams-list');
        this.teamForm = document.getElementById('team-form');
        this.addTeamBtn = document.getElementById('add-team-btn');
        this.teamSearchInput = document.getElementById('team-search');
        
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
                window.location.href = '/webapp/src/pages/dashboard.html';
                return;
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load teams
            this.loadTeams();
            
        } catch (error) {
            console.error('Error initializing team controller:', error);
            this.layout.showNotification('Failed to initialize team management', 'error');
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add team button
        if (this.addTeamBtn) {
            this.addTeamBtn.addEventListener('click', () => {
                this.showAddTeamModal();
            });
        }
        
        // Team form submit
        if (this.teamForm) {
            this.teamForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTeam();
            });
        }
        
        // Team search
        if (this.teamSearchInput) {
            this.teamSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterTeams(searchTerm);
            });
        }
    }
    
    /**
     * Load teams for the current league
     */
    async loadTeams() {
        try {
            if (!this.teamsList) return;
            
            const teams = await this.dataManager.getTeamsByLeague(this.leagueId);
            
            // Clear teams list
            this.teamsList.innerHTML = '';
            
            if (teams.length === 0) {
                this.teamsList.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            <div>
                                <p>No teams have been added to this league yet.</p>
                                <button class="btn btn-primary" id="empty-state-add-team">
                                    <i class="fas fa-plus-circle"></i> Add Team
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                
                document.getElementById('empty-state-add-team').addEventListener('click', () => {
                    this.showAddTeamModal();
                });
                
                return;
            }
            
            // Render teams
            teams.forEach((team, index) => {
                const teamRow = document.createElement('tr');
                teamRow.dataset.teamId = team.id;
                
                teamRow.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${team.logo ? 
                                `<div class="team-logo" style="width: 30px; height: 30px; background-color: ${team.color || '#3498db'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                    ${team.name.charAt(0)}
                                </div>` : 
                                `<div class="team-logo" style="width: 30px; height: 30px; background-color: ${team.color || '#3498db'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                    ${team.name.charAt(0)}
                                </div>`
                            }
                            <span>${team.name}</span>
                        </div>
                    </td>
                    <td>${team.captain || 'Not set'}</td>
                    <td>${team.players ? team.players.length : 0}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-outline edit-team" data-team-id="${team.id}">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline view-team" data-team-id="${team.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-team" data-team-id="${team.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                
                this.teamsList.appendChild(teamRow);
            });
            
            // Add event listeners to action buttons
            this.addTeamActionListeners();
            
        } catch (error) {
            console.error('Error loading teams:', error);
            this.layout.showNotification('Failed to load teams', 'error');
        }
    }
    
    /**
     * Add event listeners to team action buttons
     */
    addTeamActionListeners() {
        // Edit team buttons
        const editButtons = document.querySelectorAll('.edit-team');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.showEditTeamModal(teamId);
            });
        });
        
        // View team buttons
        const viewButtons = document.querySelectorAll('.view-team');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.showTeamDetailsModal(teamId);
            });
        });
        
        // Delete team buttons
        const deleteButtons = document.querySelectorAll('.delete-team');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.confirmDeleteTeam(teamId);
            });
        });
    }
    
    /**
     * Filter teams by search term
     * @param {String} searchTerm - Search term
     */
    filterTeams(searchTerm) {
        const rows = this.teamsList.querySelectorAll('tr[data-team-id]');
        
        rows.forEach(row => {
            const teamName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const captainName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            
            if (teamName.includes(searchTerm) || captainName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    /**
     * Show add team modal
     */
    showAddTeamModal() {
        // Create modal content
        const modalContent = `
            <div class="modal-header">
                <h3>Add New Team</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="team-form" class="team-form">
                    <div class="form-group">
                        <label for="team-name">Team Name <span class="required">*</span></label>
                        <input type="text" id="team-name" name="name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="team-color">Team Color</label>
                            <input type="color" id="team-color" name="color" value="#3498db">
                        </div>
                        <div class="form-group">
                            <label for="team-captain">Team Captain</label>
                            <input type="text" id="team-captain" name="captain">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="team-phone">Contact Phone</label>
                        <input type="tel" id="team-phone" name="phone">
                    </div>
                    <div class="form-group">
                        <label for="team-email">Contact Email</label>
                        <input type="email" id="team-email" name="email">
                    </div>
                    <div class="form-group">
                        <label for="team-notes">Notes</label>
                        <textarea id="team-notes" name="notes"></textarea>
                    </div>
                    <input type="hidden" id="team-id" name="id" value="">
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Team</button>
                    </div>
                </form>
            </div>
        `;
        
        // Show modal
        this.layout.showModal(modalContent);
        
        // Add event listeners
        document.querySelector('#team-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTeam();
        });
        
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.layout.closeModal();
        });
        
        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.layout.closeModal();
        });
    }
    
    /**
     * Show edit team modal
     * @param {String} teamId - Team ID to edit
     */
    async showEditTeamModal(teamId) {
        try {
            // Get team data
            const team = await this.dataManager.getTeam(teamId);
            if (!team) {
                this.layout.showNotification('Team not found', 'error');
                return;
            }
            
            // Show modal with the same form but prefilled
            this.showAddTeamModal();
            
            // Fill form with team data
            document.getElementById('team-id').value = team.id;
            document.getElementById('team-name').value = team.name || '';
            document.getElementById('team-color').value = team.color || '#3498db';
            document.getElementById('team-captain').value = team.captain || '';
            document.getElementById('team-phone').value = team.phone || '';
            document.getElementById('team-email').value = team.email || '';
            document.getElementById('team-notes').value = team.notes || '';
            
            // Update modal title
            document.querySelector('.modal-header h3').textContent = 'Edit Team';
            
        } catch (error) {
            console.error('Error loading team data:', error);
            this.layout.showNotification('Failed to load team data', 'error');
        }
    }
    
    /**
     * Show team details modal
     * @param {String} teamId - Team ID to view
     */
    async showTeamDetailsModal(teamId) {
        try {
            // Get team data
            const team = await this.dataManager.getTeam(teamId);
            if (!team) {
                this.layout.showNotification('Team not found', 'error');
                return;
            }
            
            // Get team players
            const players = team.players || [];
            
            // Create modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Team Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="team-details">
                        <div class="team-header">
                            <div class="team-logo" style="width: 60px; height: 60px; background-color: ${team.color || '#3498db'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
                                ${team.name.charAt(0)}
                            </div>
                            <div class="team-info">
                                <h2>${team.name}</h2>
                                <p>${team.captain ? `Captain: ${team.captain}` : ''}</p>
                            </div>
                        </div>
                        
                        <div class="team-contact">
                            <h4>Contact Information</h4>
                            <p>${team.phone ? `Phone: ${team.phone}` : 'No phone number'}</p>
                            <p>${team.email ? `Email: ${team.email}` : 'No email address'}</p>
                        </div>
                        
                        ${team.notes ? `
                            <div class="team-notes">
                                <h4>Notes</h4>
                                <p>${team.notes}</p>
                            </div>
                        ` : ''}
                        
                        <div class="team-players">
                            <h4>Players (${players.length})</h4>
                            ${players.length > 0 ? `
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Position</th>
                                            <th>Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${players.map((player, index) => `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${player.name}</td>
                                                <td>${player.position || 'N/A'}</td>
                                                <td>${player.number || 'N/A'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p>No players added yet.</p>'}
                            <div class="form-actions">
                                <button type="button" class="btn btn-primary" id="manage-players-btn">
                                    <i class="fas fa-user-plus"></i> Manage Players
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Show modal
            this.layout.showModal(modalContent);
            
            // Add event listeners
            document.querySelector('.modal-close').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.getElementById('manage-players-btn').addEventListener('click', () => {
                this.layout.closeModal();
                this.showPlayersManagementModal(teamId);
            });
            
        } catch (error) {
            console.error('Error loading team details:', error);
            this.layout.showNotification('Failed to load team details', 'error');
        }
    }
    
    /**
     * Show players management modal
     * @param {String} teamId - Team ID
     */
    async showPlayersManagementModal(teamId) {
        try {
            // Get team data
            const team = await this.dataManager.getTeam(teamId);
            if (!team) {
                this.layout.showNotification('Team not found', 'error');
                return;
            }
            
            // Get team players
            const players = team.players || [];
            
            // Create modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Manage Players - ${team.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="player-management">
                        <div class="player-form-container">
                            <h4>Add Player</h4>
                            <form id="player-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="player-name">Name <span class="required">*</span></label>
                                        <input type="text" id="player-name" name="name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="player-number">Number</label>
                                        <input type="number" id="player-number" name="number" min="1" max="99">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="player-position">Position</label>
                                    <select id="player-position" name="position">
                                        <option value="">Select position</option>
                                        <option value="Goalkeeper">Goalkeeper</option>
                                        <option value="Defender">Defender</option>
                                        <option value="Midfielder">Midfielder</option>
                                        <option value="Forward">Forward</option>
                                    </select>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Add Player</button>
                                </div>
                            </form>
                        </div>
                        
                        <div class="player-list-container">
                            <h4>Players (${players.length})</h4>
                            <div class="player-list">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Position</th>
                                            <th>Number</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="players-list">
                                        ${players.length > 0 ? 
                                            players.map((player, index) => `
                                                <tr data-player-index="${index}">
                                                    <td>${index + 1}</td>
                                                    <td>${player.name}</td>
                                                    <td>${player.position || 'N/A'}</td>
                                                    <td>${player.number || 'N/A'}</td>
                                                    <td class="actions">
                                                        <button class="btn btn-sm btn-danger delete-player" data-index="${index}">
                                                            <i class="fas fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('') : 
                                            `<tr>
                                                <td colspan="5" class="empty-state">No players added yet.</td>
                                            </tr>`
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary modal-save">Save Changes</button>
                </div>
            `;
            
            // Show modal
            this.layout.showModal(modalContent, 'wide-modal');
            
            // Add event listeners
            document.querySelector('.modal-close').addEventListener('click', () => {
                this.layout.closeModal();
            });
            
            document.getElementById('player-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPlayerToTeam(teamId);
            });
            
            document.querySelectorAll('.delete-player').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    this.removePlayerFromTeam(teamId, index);
                });
            });
            
            document.querySelector('.modal-save').addEventListener('click', () => {
                this.layout.closeModal();
                this.layout.showNotification('Players updated successfully', 'success');
                this.loadTeams();
            });
            
        } catch (error) {
            console.error('Error loading players management:', error);
            this.layout.showNotification('Failed to load players management', 'error');
        }
    }
    
    /**
     * Add player to team
     * @param {String} teamId - Team ID
     */
    async addPlayerToTeam(teamId) {
        try {
            // Get form data
            const name = document.getElementById('player-name').value;
            const number = document.getElementById('player-number').value;
            const position = document.getElementById('player-position').value;
            
            if (!name) {
                this.layout.showNotification('Player name is required', 'error');
                return;
            }
            
            // Get team
            const team = await this.dataManager.getTeam(teamId);
            if (!team) {
                this.layout.showNotification('Team not found', 'error');
                return;
            }
            
            // Initialize players array if it doesn't exist
            if (!team.players) {
                team.players = [];
            }
            
            // Add player
            team.players.push({
                id: this.dataManager.generateId(),
                name,
                number: number || null,
                position: position || null,
                teamId
            });
            
            // Update team
            await this.dataManager.updateTeam(team);
            
            // Clear form
            document.getElementById('player-name').value = '';
            document.getElementById('player-number').value = '';
            document.getElementById('player-position').value = '';
            
            // Refresh players list
            this.showPlayersManagementModal(teamId);
            
            // Show success notification
            this.layout.showNotification('Player added successfully', 'success');
            
        } catch (error) {
            console.error('Error adding player:', error);
            this.layout.showNotification('Failed to add player', 'error');
        }
    }
    
    /**
     * Remove player from team
     * @param {String} teamId - Team ID
     * @param {Number} index - Player index in the array
     */
    async removePlayerFromTeam(teamId, index) {
        try {
            // Get team
            const team = await this.dataManager.getTeam(teamId);
            if (!team || !team.players) {
                this.layout.showNotification('Team or players not found', 'error');
                return;
            }
            
            // Remove player
            team.players.splice(index, 1);
            
            // Update team
            await this.dataManager.updateTeam(team);
            
            // Refresh players list
            this.showPlayersManagementModal(teamId);
            
            // Show success notification
            this.layout.showNotification('Player removed successfully', 'success');
            
        } catch (error) {
            console.error('Error removing player:', error);
            this.layout.showNotification('Failed to remove player', 'error');
        }
    }
    
    /**
     * Confirm delete team
     * @param {String} teamId - Team ID to delete
     */
    confirmDeleteTeam(teamId) {
        const modalContent = `
            <div class="modal-header">
                <h3>Delete Team</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this team? This action cannot be undone.</p>
                <p><strong>Warning:</strong> Deleting a team will also remove all related players and match data.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete Team</button>
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
            this.deleteTeam(teamId);
            this.layout.closeModal();
        });
    }
    
    /**
     * Delete team
     * @param {String} teamId - Team ID to delete
     */
    async deleteTeam(teamId) {
        try {
            // Delete team
            await this.dataManager.deleteTeam(teamId);
            
            // Refresh teams list
            this.loadTeams();
            
            // Show success notification
            this.layout.showNotification('Team deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting team:', error);
            this.layout.showNotification('Failed to delete team', 'error');
        }
    }
    
    /**
     * Save team data
     */
    async saveTeam() {
        try {
            // Get form data
            const teamForm = document.getElementById('team-form');
            const formData = new FormData(teamForm);
            
            const teamData = {
                name: formData.get('name'),
                color: formData.get('color'),
                captain: formData.get('captain'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                notes: formData.get('notes'),
                leagueId: this.leagueId
            };
            
            const teamId = formData.get('id');
            
            if (!teamData.name) {
                this.layout.showNotification('Team name is required', 'error');
                return;
            }
            
            if (teamId) {
                // Update existing team
                teamData.id = teamId;
                await this.dataManager.updateTeam(teamData);
                this.layout.showNotification('Team updated successfully', 'success');
            } else {
                // Create new team
                teamData.id = this.dataManager.generateId();
                teamData.players = [];
                await this.dataManager.createTeam(teamData);
                this.layout.showNotification('Team created successfully', 'success');
            }
            
            // Close modal
            this.layout.closeModal();
            
            // Refresh teams list
            this.loadTeams();
            
        } catch (error) {
            console.error('Error saving team:', error);
            this.layout.showNotification('Failed to save team', 'error');
        }
    }
}

// Export controller
window.TeamController = TeamController;
