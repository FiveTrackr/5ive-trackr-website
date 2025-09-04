/**
 * 5ive Trackr Dashboard Controller
 * 
 * Main dashboard logic for managing leagues, teams, fixtures,
 * referees, and other core functionality
 * 
 * @copyright 5ive Trackr 2025
 */

// Dashboard Controller
class DashboardController {
    /**
     * Initialize the dashboard controller
     */
    constructor() {
        // Store references to key elements
        this.elements = {
            leaguesTableBody: document.getElementById('leaguesTableBody'),
            createLeagueBtn: document.getElementById('createLeagueBtn'),
            createLeagueModal: document.getElementById('createLeagueModal'),
            createLeagueForm: document.getElementById('createLeagueForm'),
            saveLeagueBtn: document.getElementById('saveLeagueBtn'),
            modalContainer: document.getElementById('modalContainer')
        };
        
        // Initialize the data manager
        this.dataManager = new DataManager();
        
        // Current user from session
        this.currentUser = null;
        
        // Check authentication
        this.checkAuthentication();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadDashboardData();
    }
    
    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        // Check for SessionManager
        if (window.SessionManager && typeof SessionManager.isLoggedIn === 'function') {
            if (!SessionManager.isLoggedIn()) {
                // Not logged in, redirect to login
                window.location.href = '/webapp/src/pages/home.html';
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
        
        // Create league button
        if (this.elements.createLeagueBtn) {
            this.elements.createLeagueBtn.addEventListener('click', () => this.openCreateLeagueModal());
        }
        
        // Save league button
        if (this.elements.saveLeagueBtn) {
            this.elements.saveLeagueBtn.addEventListener('click', () => this.createLeague());
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
            window.location.href = '/webapp/src/pages/home.html';
        }
    }
    
    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            await this.loadLeagues();
            // Add more data loading as needed
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show error notification if DashboardLayout is available
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    'Failed to load dashboard data. Please try again.',
                    'error'
                );
            }
        }
    }
    
    /**
     * Load leagues data
     */
    async loadLeagues() {
        try {
            // Get leagues created by current user or all leagues for admin
            const query = this.currentUser.role === 'admin' ? {} : { createdBy: this.currentUser.id };
            const result = await this.dataManager.read('league', query, { sort: { createdAt: -1 } });
            
            // Render leagues
            this.renderLeagues(result.data);
        } catch (error) {
            console.error('Error loading leagues:', error);
            throw error;
        }
    }
    
    /**
     * Render leagues in the table
     * @param {Array} leagues - Array of league objects
     */
    renderLeagues(leagues) {
        // Check if the leagues table body exists
        if (!this.elements.leaguesTableBody) return;
        
        // Clear existing content
        this.elements.leaguesTableBody.innerHTML = '';
        
        if (leagues.length === 0) {
            // No leagues found
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="empty-state">
                    <div>No leagues found.</div>
                    <button class="btn btn-primary mt-3" id="emptyStateCreateLeague">Create Your First League</button>
                </td>
            `;
            this.elements.leaguesTableBody.appendChild(emptyRow);
            
            // Add event listener to empty state button
            const emptyStateBtn = document.getElementById('emptyStateCreateLeague');
            if (emptyStateBtn) {
                emptyStateBtn.addEventListener('click', () => this.openCreateLeagueModal());
            }
            
            return;
        }
        
        // Add each league to the table
        leagues.forEach(league => {
            const row = document.createElement('tr');
            
            // Calculate league status
            const now = new Date();
            const seasonStart = new Date(league.seasonStart);
            const seasonEnd = new Date(league.seasonEnd);
            
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
            
            row.innerHTML = `
                <td>
                    <strong>${league.name}</strong>
                    ${league.description ? `<div class="text-small text-gray-700">${league.description}</div>` : ''}
                </td>
                <td>${league.maxTeams}</td>
                <td>${seasonDates}</td>
                <td>${status}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary view-league" data-id="${league.id}">View</button>
                    <button class="btn btn-sm btn-secondary edit-league" data-id="${league.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-league" data-id="${league.id}">Delete</button>
                </td>
            `;
            
            this.elements.leaguesTableBody.appendChild(row);
            
            // Add event listeners to buttons
            const viewButton = row.querySelector('.view-league');
            if (viewButton) {
                viewButton.addEventListener('click', () => this.viewLeague(league.id));
            }
            
            const editButton = row.querySelector('.edit-league');
            if (editButton) {
                editButton.addEventListener('click', () => this.editLeague(league.id));
            }
            
            const deleteButton = row.querySelector('.delete-league');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => this.confirmDeleteLeague(league.id, league.name));
            }
        });
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
     * Open create league modal
     */
    openCreateLeagueModal() {
        // Set default dates for the form
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);
        
        // Format dates for the form inputs (YYYY-MM-DD)
        const todayFormatted = today.toISOString().split('T')[0];
        const nextYearFormatted = nextYear.toISOString().split('T')[0];
        
        // Set default values in the form
        const seasonStartInput = document.getElementById('seasonStart');
        const seasonEndInput = document.getElementById('seasonEnd');
        
        if (seasonStartInput) seasonStartInput.value = todayFormatted;
        if (seasonEndInput) seasonEndInput.value = nextYearFormatted;
        
        // Show the modal
        this.openModal(this.elements.createLeagueModal);
    }
    
    /**
     * Create a new league
     */
    async createLeague() {
        try {
            // Get form data
            const formData = new FormData(this.elements.createLeagueForm);
            
            // Create league object
            const league = {
                name: formData.get('name'),
                description: formData.get('description'),
                seasonStart: formData.get('seasonStart'),
                seasonEnd: formData.get('seasonEnd'),
                maxTeams: parseInt(formData.get('maxTeams')),
                playersPerTeam: parseInt(formData.get('playersPerTeam')),
                matchDuration: parseInt(formData.get('matchDuration')),
                halfTimeDuration: parseInt(formData.get('halfTimeDuration')),
                substitutesAllowed: formData.get('substitutesAllowed') === 'on',
                pointsForWin: parseInt(formData.get('pointsForWin')),
                pointsForDraw: parseInt(formData.get('pointsForDraw')),
                pointsForLoss: parseInt(formData.get('pointsForLoss')),
                createdBy: this.currentUser.id
            };
            
            // Validate form data
            if (!league.name || !league.seasonStart || !league.seasonEnd) {
                throw new Error('Please fill in all required fields');
            }
            
            // Save league
            const result = await this.dataManager.create('league', league);
            
            // Show success notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `League "${league.name}" created successfully!`,
                    'success'
                );
            }
            
            // Close modal
            this.closeModal();
            
            // Refresh leagues list
            await this.loadLeagues();
        } catch (error) {
            console.error('Error creating league:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to create league: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * View league details
     * @param {string} leagueId - ID of the league to view
     */
    viewLeague(leagueId) {
        // Navigate to league details page
        window.location.href = `pages/league-manager/league-manager.html#dashboard?id=${leagueId}`;
    }
    
    /**
     * Edit league
     * @param {string} leagueId - ID of the league to edit
     */
    async editLeague(leagueId) {
        try {
            // Get league data
            const result = await this.dataManager.findById('league', leagueId);
            
            if (result.data) {
                console.log('Edit league:', result.data);
                // TODO: Implement edit league modal and functionality
                
                // For now, show a notification
                if (window.DashboardLayout) {
                    DashboardLayout.showNotification(
                        'League edit functionality will be implemented in the next phase.',
                        'info'
                    );
                }
            } else {
                throw new Error('League not found');
            }
        } catch (error) {
            console.error('Error loading league for edit:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to load league: ${error.message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    }
    
    /**
     * Confirm league deletion
     * @param {string} leagueId - ID of the league to delete
     * @param {string} leagueName - Name of the league for confirmation message
     */
    confirmDeleteLeague(leagueId, leagueName) {
        // For now, just confirm with a browser dialog
        const confirmDelete = confirm(`Are you sure you want to delete the league "${leagueName}"?`);
        
        if (confirmDelete) {
            this.deleteLeague(leagueId);
        }
    }
    
    /**
     * Delete a league
     * @param {string} leagueId - ID of the league to delete
     */
    async deleteLeague(leagueId) {
        try {
            // Delete league
            const result = await this.dataManager.delete('league', leagueId);
            
            // Show success notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `League deleted successfully!`,
                    'success'
                );
            }
            
            // Refresh leagues list
            await this.loadLeagues();
        } catch (error) {
            console.error('Error deleting league:', error);
            
            // Show error notification
            if (window.DashboardLayout) {
                DashboardLayout.showNotification(
                    `Failed to delete league: ${error.message || 'Unknown error'}`,
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
    
    /**
     * Create sample data for development
     */
    async createSampleData() {
        try {
            // Check if we already have leagues
            const leaguesResult = await this.dataManager.count('league');
            if (leaguesResult.count > 0) {
                console.log('Sample data already exists, skipping creation');
                return;
            }
            
            console.log('Creating sample data...');
            
            // Create sample leagues
            const leagues = [
                {
                    name: 'Premier 5-a-side',
                    description: 'Top division for experienced teams',
                    seasonStart: '2025-07-01',
                    seasonEnd: '2026-06-30',
                    maxTeams: 10,
                    playersPerTeam: 5,
                    matchDuration: 40,
                    halfTimeDuration: 5,
                    substitutesAllowed: true,
                    pointsForWin: 3,
                    pointsForDraw: 1,
                    pointsForLoss: 0,
                    createdBy: this.currentUser.id
                },
                {
                    name: 'Championship',
                    description: 'Second division for intermediate teams',
                    seasonStart: '2025-07-01',
                    seasonEnd: '2026-06-30',
                    maxTeams: 12,
                    playersPerTeam: 5,
                    matchDuration: 40,
                    halfTimeDuration: 5,
                    substitutesAllowed: true,
                    pointsForWin: 3,
                    pointsForDraw: 1,
                    pointsForLoss: 0,
                    createdBy: this.currentUser.id
                },
                {
                    name: 'League One',
                    description: 'Third division for beginner teams',
                    seasonStart: '2025-07-01',
                    seasonEnd: '2026-06-30',
                    maxTeams: 8,
                    playersPerTeam: 5,
                    matchDuration: 30,
                    halfTimeDuration: 5,
                    substitutesAllowed: true,
                    pointsForWin: 3,
                    pointsForDraw: 1,
                    pointsForLoss: 0,
                    createdBy: this.currentUser.id
                }
            ];
            
            // Create leagues
            for (const league of leagues) {
                await this.dataManager.create('league', league);
            }
            
            console.log('Sample data created successfully');
        } catch (error) {
            console.error('Error creating sample data:', error);
        }
    }
}

// Initialize the dashboard controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboardController = new DashboardController();
    
    // No local development data needed - all data comes from live API
    // dashboardController.createSampleData(); // Removed - live API only
});

// Export controller as global
window.DashboardController = DashboardController;
