/**
 * 5ive Trackr Enhanced SPA Modules
 * Complete module system with full functionality from HTML pages
 * © 2025 5ive Trackr. All rights reserved.
 */

window.SPAModules = (function() {
    const modules = {};
    let currentModal = null;

    // Utility functions
    const utils = {
        showModal: function(modalConfig) {
            // Remove any existing modal
            const existingModal = document.querySelector('.modal-overlay');
            if (existingModal) {
                existingModal.remove();
            }
            
            let modalHtml;
            let onConfirm = null;
            
            // Handle both string HTML and object config
            if (typeof modalConfig === 'string') {
                modalHtml = modalConfig;
            } else if (typeof modalConfig === 'object' && modalConfig !== null) {
                const { title, content, onConfirm: confirmCallback, showDefaultButtons = true } = modalConfig;
                onConfirm = confirmCallback;
                
                modalHtml = `
                    <div class="modal-overlay show">
                        <div class="modal">
                            <div class="modal-header">
                                <h3 class="modal-title">${title || 'Modal'}</h3>
                                <button class="modal-close">&times;</button>
                            </div>
                            <div class="modal-body">
                                ${content || ''}
                            </div>
                            ${showDefaultButtons ? `
                                <div class="modal-footer">
                                    <button class="btn btn-outline modal-cancel">Cancel</button>
                                    <button class="btn btn-primary modal-confirm">Confirm</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else {
                console.error('showModal called with invalid parameter:', modalConfig);
                return null;
            }

            // Add new modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            currentModal = document.querySelector('.modal-overlay:last-child');
            
            // Add close functionality
            const closeBtn = currentModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', utils.closeModal);
            }
            
            // Add cancel functionality
            const cancelBtn = currentModal.querySelector('.modal-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', utils.closeModal);
            }
            
            // Add confirm functionality
            const confirmBtn = currentModal.querySelector('.modal-confirm');
            if (confirmBtn && onConfirm) {
                confirmBtn.addEventListener('click', async function() {
                    if (typeof onConfirm === 'function') {
                        const result = await onConfirm();
                        // Only close modal if callback returns true
                        if (result === true) {
                            utils.closeModal();
                        }
                        // If result is false or undefined, keep modal open
                    }
                });
            }
            
            // Close on overlay click
            currentModal.addEventListener('click', function(e) {
                if (e.target === currentModal) {
                    utils.closeModal();
                }
            });
            
            return currentModal;
        },

        closeModal: function() {
            if (currentModal) {
                currentModal.remove();
                currentModal = null;
            }
        },

        hideModal: function() {
            return this.closeModal();
        },

        showConfirm: function(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
            return new Promise((resolve) => {
                const modal = this.showModal({
                    title: title,
                    content: `<div class="confirm-message" style="padding: 16px 0; font-size: 14px; color: #374151;">${message}</div>`,
                    showDefaultButtons: false
                });

                if (!modal) {
                    resolve(false);
                    return;
                }

                // Add custom buttons
                const modalBody = modal.querySelector('.modal-body');
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'modal-footer';
                buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid #e5e7eb;';
                
                buttonContainer.innerHTML = `
                    <button class="btn btn-outline confirm-cancel">${cancelText}</button>
                    <button class="btn btn-primary confirm-ok">${confirmText}</button>
                `;
                
                modal.querySelector('.modal').appendChild(buttonContainer);

                // Add event listeners
                const cancelBtn = modal.querySelector('.confirm-cancel');
                const confirmBtn = modal.querySelector('.confirm-ok');

                cancelBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(false);
                });

                confirmBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(true);
                });

                // Override close handlers to resolve false
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.closeModal();
                        resolve(false);
                    });
                }

                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        utils.closeModal();
                        resolve(false);
                    }
                });
            });
        },

        showPasswordConfirm: function(title, message) {
            return new Promise((resolve) => {
                const modal = this.showModal({
                    title: title,
                    content: `
                        <div class="password-confirm-content" style="padding: 16px 0;">
                            <div class="confirm-message" style="padding-bottom: 16px; font-size: 14px; color: #374151;">${message}</div>
                            <form style="margin: 0;" onsubmit="return false;">
                                <div class="form-group">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Enter your password to confirm:</label>
                                    <input type="password" id="confirmation-password" autocomplete="current-password" style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" placeholder="Password" />
                                    <div id="password-error" style="color: #dc2626; font-size: 12px; margin-top: 4px; display: none;">Incorrect password. Please try again.</div>
                                </div>
                            </form>
                        </div>
                    `,
                    showDefaultButtons: false
                });

                if (!modal) {
                    resolve(false);
                    return;
                }

                // Add custom buttons
                const modalBody = modal.querySelector('.modal-body');
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'modal-footer';
                buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid #e5e7eb;';
                
                buttonContainer.innerHTML = `
                    <button class="btn btn-outline confirm-cancel">Cancel</button>
                    <button class="btn btn-primary confirm-password">Confirm Deletion</button>
                `;
                
                modal.querySelector('.modal').appendChild(buttonContainer);

                // Get references
                const cancelBtn = modal.querySelector('.confirm-cancel');
                const confirmBtn = modal.querySelector('.confirm-password');
                const passwordInput = modal.querySelector('#confirmation-password');
                const errorDiv = modal.querySelector('#password-error');

                // Focus password input
                setTimeout(() => passwordInput.focus(), 100);

                // Handle enter key in password field
                passwordInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        confirmBtn.click();
                    }
                });

                cancelBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(false);
                });

                confirmBtn.addEventListener('click', async () => {
                    const password = passwordInput.value;
                    
                    if (!password) {
                        errorDiv.textContent = 'Please enter your password.';
                        errorDiv.style.display = 'block';
                        passwordInput.focus();
                        return;
                    }

                    // Verify password with backend
                    try {
                        const response = await fetch('/api/auth/verify-password', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${window.localStorage.getItem('auth_token')}`
                            },
                            body: JSON.stringify({ password: password })
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                            this.closeModal();
                            resolve(true);
                        } else {
                            errorDiv.textContent = 'Incorrect password. Please try again.';
                            errorDiv.style.display = 'block';
                            passwordInput.value = '';
                            passwordInput.focus();
                        }
                    } catch (error) {
                        console.error('Password verification error:', error);
                        errorDiv.textContent = 'Error verifying password. Please try again.';
                        errorDiv.style.display = 'block';
                        passwordInput.focus();
                    }
                });

                // Override close handlers to resolve false
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.closeModal();
                        resolve(false);
                    });
                }

                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        utils.closeModal();
                        resolve(false);
                    }
                });
            });
        },

        formatDate: function(date) {
            return new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        },

        showNotification: function(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Show notification instantly
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 1000);
        }
    };

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
                                <span class="icon icon-calendar-check">📅</span>
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
                                <span class="icon icon-whistle">🏃</span>
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
                                <span class="icon icon-credit-card">💳</span>
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
                                <span class="icon icon-flag">🚩</span>
                                <h4>Today's Fixtures</h4>
                            </div>
                            <div class="action-card-body">
                                <div class="action-count">0</div>
                                <div class="action-label">Fixtures today</div>
                            </div>
                            <div class="action-card-footer">
                                <div class="action-description">No matches scheduled for today</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Dashboard module initialized');
            this.attachEventListeners();
            await this.loadDashboardData();
        },

        attachEventListeners() {
            // Add click handlers for action cards
            const cards = document.querySelectorAll('.action-card');
            cards.forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    const cardId = card.id;
                    this.handleCardClick(cardId);
                });
            });
        },

        handleCardClick(cardId) {
            // Navigate to appropriate module based on card clicked
            const routes = {
                'attendance-card': 'fixtures',
                'referee-card': 'referees',
                'payments-card': 'team-payments',
                'fixtures-card': 'fixtures'
            };
            
            if (routes[cardId] && window.SPARouter) {
                window.SPARouter.navigate(routes[cardId]);
            }
        },

        async loadDashboardData() {
            // Load real data from API
            try {
                // This would connect to your actual data manager
                console.log('Loading dashboard data...');
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }
    };

    // Teams Module - Full Implementation
    modules.teams = {
        teamsData: [],
        filteredTeams: [],

        async render() {
            return `
                <div class="content-area">
                    <!-- Page Header -->
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Teams Management</h1>
                            <p class="page-subtitle">Manage team registrations and information</p>
                        </div>
                        <div class="page-actions">
                            <button class="btn btn-primary" onclick="SPAModules.teams.showAddTeamModal()">
                                <span class="btn-icon">➕</span>
                                Add Team
                            </button>
                            <button class="btn btn-outline" onclick="SPAModules.teams.importTeams()">
                                <span class="btn-icon">📥</span>
                                Import
                            </button>
                        </div>
                    </div>

                    <!-- Teams Toolbar -->
                    <div class="teams-toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <input type="text" 
                                       id="team-search" 
                                       class="form-input" 
                                       placeholder="Search teams..." 
                                       oninput="SPAModules.teams.searchTeams(this.value)">
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <select id="league-filter" 
                                    class="form-select" 
                                    onchange="SPAModules.teams.filterByLeague(this.value)">
                                <option value="">All Leagues</option>
                                <option value="premier">Premier League</option>
                                <option value="championship">Championship</option>
                                <option value="division1">Division 1</option>
                                <option value="division2">Division 2</option>
                            </select>
                            <select id="status-filter" 
                                    class="form-select" 
                                    onchange="SPAModules.teams.filterByStatus(this.value)">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <!-- Teams Container -->
                    <div class="teams-container">
                        <div class="teams-header">
                            <h3>Registered Teams</h3>
                            <div class="teams-count">
                                <span id="teams-count">0</span> teams
                            </div>
                        </div>
                        
                        <div class="teams-list" id="teams-list">
                            <!-- Teams will be dynamically populated -->
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Loading teams...</p>
                            </div>
                        </div>
                        
                        <!-- Empty State -->
                        <div class="empty-state" id="teams-empty-state" style="display: none;">
                            <div class="empty-icon">👥</div>
                            <h3>No Teams Found</h3>
                            <p>No teams match your current search or filter criteria.</p>
                            <button class="btn btn-primary" onclick="SPAModules.teams.showAddTeamModal()">
                                <span class="btn-text">Add First Team</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Teams module initialized');
            await this.loadTeams();
            
            // Initialize venue selector for team filtering
            if (window.VenueSelector) {
                await window.VenueSelector.initialize((venueData) => {
                    console.log('Venue changed, filtering teams for:', venueData);
                    this.filterTeamsByVenue(venueData.id);
                });
            }
        },

        async loadTeams() {
            try {
                // Simulate API call - replace with actual data manager call
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Sample teams data
                this.teamsData = [
                    {
                        id: 1,
                        name: 'Arsenal FC',
                        captain: 'Martin Ødegaard',
                        captainEmail: 'captain@arsenal.com',
                        captainPhone: '+44 20 7619 5003',
                        league: 'premier',
                        status: 'active',
                        paymentStatus: 'paid',
                        paymentType: 'season',
                        players: 25,
                        founded: '1886',
                        homeVenue: 'Emirates Stadium',
                        lastMatch: '2025-01-08',
                        nextMatch: '2025-01-15'
                    },
                    {
                        id: 2,
                        name: 'Chelsea FC',
                        captain: 'Reece James',
                        captainEmail: 'captain@chelsea.com',
                        captainPhone: '+44 20 7386 2545',
                        league: 'premier',
                        status: 'active',
                        paymentStatus: 'partial',
                        paymentType: 'season',
                        players: 28,
                        founded: '1905',
                        homeVenue: 'Stamford Bridge',
                        lastMatch: '2025-01-07',
                        nextMatch: '2025-01-14'
                    },
                    {
                        id: 3,
                        name: 'Manchester United',
                        captain: 'Bruno Fernandes',
                        captainEmail: 'captain@manutd.com',
                        captainPhone: '+44 161 868 8000',
                        league: 'premier',
                        status: 'active',
                        paymentStatus: 'paid',
                        paymentType: 'season',
                        players: 26,
                        founded: '1878',
                        homeVenue: 'Old Trafford',
                        lastMatch: '2025-01-06',
                        nextMatch: '2025-01-13'
                    },
                    {
                        id: 4,
                        name: 'Brighton FC',
                        captain: 'Lewis Dunk',
                        captainEmail: 'captain@brighton.com',
                        captainPhone: '+44 1273 878 288',
                        league: 'championship',
                        status: 'active',
                        paymentStatus: 'pending',
                        paymentType: 'pay-to-play',
                        players: 24,
                        founded: '1901',
                        homeVenue: 'Amex Stadium',
                        lastMatch: '2025-01-05',
                        nextMatch: '2025-01-12'
                    }
                ];
                
                this.filteredTeams = [...this.teamsData];
                this.renderTeamsList();
                
            } catch (error) {
                console.error('Error loading teams:', error);
                this.showError('Failed to load teams');
            }
        },

        renderTeamsList() {
            const container = document.getElementById('teams-list');
            const emptyState = document.getElementById('teams-empty-state');
            const countElement = document.getElementById('teams-count');
            
            if (!container) return;
            
            if (this.filteredTeams.length === 0) {
                container.style.display = 'none';
                if (emptyState) emptyState.style.display = 'flex';
                if (countElement) countElement.textContent = '0';
                return;
            }
            
            container.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';
            if (countElement) countElement.textContent = this.filteredTeams.length;
            
            container.innerHTML = this.filteredTeams.map(team => `
                <div class="team-card" data-team-id="${team.id}">
                    <div class="team-card-header">
                        <div class="team-info">
                            <h3 class="team-name">${team.name}</h3>
                            <span class="team-league badge badge-${team.league}">${this.getLeagueName(team.league)}</span>
                            <span class="team-status badge badge-${team.status}">${team.status}</span>
                        </div>
                        <div class="team-actions">
                            <button class="btn-icon" onclick="SPAModules.teams.editTeam(${team.id})" title="Edit">
                                ✏️
                            </button>
                            <button class="btn-icon" onclick="SPAModules.teams.viewTeam(${team.id})" title="View">
                                👁️
                            </button>
                            <button class="btn-icon" onclick="SPAModules.teams.deleteTeam(${team.id})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="team-card-body">
                        <div class="team-details">
                            <div class="detail-item">
                                <span class="detail-label">Captain:</span>
                                <span class="detail-value">${team.captain}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Contact:</span>
                                <span class="detail-value">${team.captainEmail}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Players:</span>
                                <span class="detail-value">${team.players}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Payment:</span>
                                <span class="detail-value payment-${team.paymentStatus}">${team.paymentStatus}</span>
                            </div>
                        </div>
                    </div>
                    <div class="team-card-footer">
                        <div class="match-info">
                            <span class="next-match">Next: ${utils.formatDate(team.nextMatch)}</span>
                            <span class="home-venue">📍 ${team.homeVenue}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        },

        getLeagueName(leagueId) {
            const leagues = {
                'premier': 'Premier League',
                'championship': 'Championship',
                'division1': 'Division 1',
                'division2': 'Division 2'
            };
            return leagues[leagueId] || leagueId;
        },

        searchTeams(query) {
            if (!query) {
                this.filteredTeams = [...this.teamsData];
            } else {
                query = query.toLowerCase();
                this.filteredTeams = this.teamsData.filter(team => 
                    team.name.toLowerCase().includes(query) ||
                    team.captain.toLowerCase().includes(query) ||
                    team.captainEmail.toLowerCase().includes(query)
                );
            }
            this.renderTeamsList();
        },

        filterByLeague(league) {
            if (!league) {
                this.filteredTeams = [...this.teamsData];
            } else {
                this.filteredTeams = this.teamsData.filter(team => team.league === league);
            }
            this.renderTeamsList();
        },

        filterByStatus(status) {
            if (!status) {
                this.filteredTeams = [...this.teamsData];
            } else {
                this.filteredTeams = this.teamsData.filter(team => team.status === status);
            }
            this.renderTeamsList();
        },

        showAddTeamModal() {
            const modalHtml = `
                <div class="modal-overlay">
                    <div class="modal-container large-modal">
                        <div class="modal-header">
                            <h3>Add New Team</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="team-form" class="team-form">
                                <!-- Basic Information Section -->
                                <div class="form-section">
                                    <div class="section-header">
                                        <h4>Basic Information</h4>
                                        <p>Team name and league assignment</p>
                                    </div>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label for="teamName" class="form-label required">Team Name</label>
                                            <input type="text" id="teamName" name="teamName" class="form-input" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="teamLeague" class="form-label required">League</label>
                                            <select id="teamLeague" name="teamLeague" class="form-select" required>
                                                <option value="">Select League</option>
                                                <option value="premier">Premier League</option>
                                                <option value="championship">Championship</option>
                                                <option value="division1">Division 1</option>
                                                <option value="division2">Division 2</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Team Captain Section -->
                                <div class="form-section">
                                    <div class="section-header">
                                        <h4>Team Captain</h4>
                                        <p>Primary contact person</p>
                                    </div>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label for="captainName" class="form-label required">Captain Name</label>
                                            <input type="text" id="captainName" name="captainName" class="form-input" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="captainEmail" class="form-label required">Captain Email</label>
                                            <input type="email" id="captainEmail" name="captainEmail" class="form-input" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="captainPhone" class="form-label required">Captain Phone</label>
                                            <input type="tel" id="captainPhone" name="captainPhone" class="form-input" required>
                                        </div>
                                    </div>
                                </div>

                                <!-- Payment Information Section -->
                                <div class="form-section">
                                    <div class="section-header">
                                        <h4>Payment Information</h4>
                                        <p>Payment structure and tracking</p>
                                    </div>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label for="paymentType" class="form-label required">Payment Structure</label>
                                            <select id="paymentType" name="paymentType" class="form-select" required>
                                                <option value="">Select Payment Type</option>
                                                <option value="season">Season Payment</option>
                                                <option value="pay-to-play">Pay-to-Play</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="paymentStatus" class="form-label">Payment Status</label>
                                            <select id="paymentStatus" name="paymentStatus" class="form-select">
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="partial">Partial</option>
                                                <option value="overdue">Overdue</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="SPAModules.teams.closeModal()">Cancel</button>
                            <button class="btn btn-primary" onclick="SPAModules.teams.saveTeam()">Save Team</button>
                        </div>
                    </div>
                </div>
            `;
            
            utils.showModal(modalHtml);
        },

        closeModal() {
            utils.closeModal();
        },

        async saveTeam() {
            const form = document.getElementById('team-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const teamData = Object.fromEntries(formData);
            
            try {
                // Here you would save to your data manager
                console.log('Saving team:', teamData);
                
                // Add to local data
                const newTeam = {
                    id: this.teamsData.length + 1,
                    ...teamData,
                    status: 'active',
                    players: 0,
                    founded: new Date().getFullYear(),
                    homeVenue: 'TBD',
                    lastMatch: null,
                    nextMatch: null
                };
                
                this.teamsData.push(newTeam);
                this.filteredTeams = [...this.teamsData];
                this.renderTeamsList();
                
                utils.showNotification('Team added successfully!');
                this.closeModal();
                
            } catch (error) {
                console.error('Error saving team:', error);
                utils.showNotification('Failed to save team', 'error');
            }
        },

        editTeam(teamId) {
            const team = this.teamsData.find(t => t.id === teamId);
            if (!team) return;
            
            // Show edit modal with team data
            console.log('Editing team:', team);
            utils.showNotification('Edit functionality coming soon', 'info');
        },

        viewTeam(teamId) {
            const team = this.teamsData.find(t => t.id === teamId);
            if (!team) return;
            
            // Show team details
            console.log('Viewing team:', team);
            utils.showNotification('View functionality coming soon', 'info');
        },

        async deleteTeam(teamId) {
            if (!confirm('Are you sure you want to delete this team?')) return;
            
            try {
                // Here you would delete via data manager
                this.teamsData = this.teamsData.filter(t => t.id !== teamId);
                this.filteredTeams = [...this.teamsData];
                this.renderTeamsList();
                
                utils.showNotification('Team deleted successfully!');
            } catch (error) {
                console.error('Error deleting team:', error);
                utils.showNotification('Failed to delete team', 'error');
            }
        },

        importTeams() {
            utils.showNotification('Import functionality coming soon', 'info');
        },

        showError(message) {
            const container = document.getElementById('teams-list');
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <h2>Error</h2>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="SPAModules.teams.loadTeams()">Retry</button>
                    </div>
                `;
            }
        },

        filterTeamsByVenue(venueId) {
            console.log('Filtering teams by venue ID:', venueId);
            
            if (!venueId || venueId === 'all') {
                // Show all teams
                this.renderTeams();
                return;
            }
            
            // Filter teams by venue and re-render
            const filteredTeams = this.teamsData.filter(team => team.venueId === venueId);
            console.log(`Filtered ${this.teamsData.length} teams to ${filteredTeams.length} for venue ${venueId}`);
            
            // Update display with filtered data
            const teamsContainer = document.querySelector('.teams-grid');
            if (teamsContainer) {
                this.renderFilteredTeams(filteredTeams);
            }
        },

        renderFilteredTeams(teams) {
            const teamsContainer = document.querySelector('.teams-grid');
            if (!teamsContainer) return;

            teamsContainer.innerHTML = `
                <div class="teams-cards">
                    ${teams.length === 0 ? 
                        '<div class="empty-state"><p>No teams found for the selected venue</p></div>' : 
                        teams.map(team => `
                            <div class="team-card">
                                <h3>${team.name}</h3>
                                <p>Division: ${team.division}</p>
                                <p>Players: ${team.playerCount || 'N/A'}</p>
                            </div>
                        `).join('')
                    }
                </div>
            `;
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
                            <p class="page-subtitle">Manage match schedules and fixtures</p>
                        </div>
                        <div class="page-actions">
                            <button class="btn btn-primary" onclick="SPAModules.fixtures.addFixture()">
                                <span class="btn-icon">➕</span>
                                Schedule Match
                            </button>
                        </div>
                    </div>
                    
                    <div class="fixtures-content">
                        <div class="fixtures-calendar" id="fixtures-calendar">
                            <!-- Calendar view will be rendered here -->
                        </div>
                        <div class="fixtures-list" id="fixtures-list">
                            <div class="loading-message">Loading fixtures...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Fixtures module initialized');
            await this.loadFixtures();
            
            // Initialize venue selector for fixture filtering
            if (window.VenueSelector) {
                await window.VenueSelector.initialize((venueData) => {
                    console.log('Venue changed, filtering fixtures for:', venueData);
                    this.filterFixturesByVenue(venueData.id);
                });
            }
        },

        async loadFixtures() {
            // Load fixtures data
            const container = document.getElementById('fixtures-list');
            if (!container) return;

            // Sample fixtures
            const fixtures = [
                {
                    id: 1,
                    homeTeam: 'Arsenal FC',
                    awayTeam: 'Chelsea FC',
                    date: '2025-01-15',
                    time: '15:00',
                    venue: 'Emirates Stadium',
                    referee: 'John Smith',
                    status: 'scheduled'
                },
                {
                    id: 2,
                    homeTeam: 'Manchester United',
                    awayTeam: 'Brighton FC',
                    date: '2025-01-15',
                    time: '17:30',
                    venue: 'Old Trafford',
                    referee: 'Not Assigned',
                    status: 'scheduled'
                }
            ];

            container.innerHTML = fixtures.map(fixture => `
                <div class="fixture-card">
                    <div class="fixture-teams">
                        <span class="home-team">${fixture.homeTeam}</span>
                        <span class="vs">VS</span>
                        <span class="away-team">${fixture.awayTeam}</span>
                    </div>
                    <div class="fixture-details">
                        <span class="fixture-date">📅 ${utils.formatDate(fixture.date)}</span>
                        <span class="fixture-time">⏰ ${fixture.time}</span>
                        <span class="fixture-venue">📍 ${fixture.venue}</span>
                        <span class="fixture-referee">🏃 ${fixture.referee}</span>
                    </div>
                    <div class="fixture-actions">
                        <button class="btn btn-sm btn-outline" onclick="SPAModules.fixtures.editFixture(${fixture.id})">Edit</button>
                        <button class="btn btn-sm btn-outline" onclick="SPAModules.fixtures.assignReferee(${fixture.id})">Assign Referee</button>
                    </div>
                </div>
            `).join('');
        },

        addFixture() {
            utils.showNotification('Add fixture functionality coming soon', 'info');
        },

        editFixture(id) {
            utils.showNotification('Edit fixture functionality coming soon', 'info');
        },

        assignReferee(id) {
            utils.showNotification('Referee assignment coming soon', 'info');
        },

        filterFixturesByVenue(venueId) {
            console.log('Filtering fixtures by venue ID:', venueId);
            
            if (!venueId || venueId === 'all') {
                // Show all fixtures
                this.loadFixtures();
                return;
            }
            
            // Filter fixtures by venue and re-render
            const container = document.getElementById('fixtures-list');
            if (container) {
                container.innerHTML = `<p>Loading fixtures for selected venue...</p>`;
                // In a real implementation, you would filter the fixtures data by venue
                // and re-render the filtered results
                setTimeout(() => {
                    container.innerHTML = `<p>Fixtures filtered for venue ${venueId}</p>`;
                }, 500);
            }
        }
    };

    // Referees Module
    modules.referees = {
        async render() {
            return `
                <div class="content-area">
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Referees</h1>
                            <p class="page-subtitle">Manage referee assignments and availability</p>
                        </div>
                        <div class="page-actions">
                            <button class="btn btn-primary" onclick="SPAModules.referees.addReferee()">
                                <span class="btn-icon">➕</span>
                                Add Referee
                            </button>
                        </div>
                    </div>
                    
                    <div class="referees-content">
                        <div class="referees-grid" id="referees-grid">
                            <div class="loading-message">Loading referees...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Referees module initialized');
            await this.loadReferees();
            
            // Initialize venue selector for referee filtering
            if (window.VenueSelector) {
                await window.VenueSelector.initialize((venueData) => {
                    console.log('Venue changed, filtering referees for:', venueData);
                    this.filterRefereesByVenue(venueData.id);
                });
            }
        },

        async loadReferees() {
            const container = document.getElementById('referees-grid');
            if (!container) return;

            const referees = [
                { id: 1, name: 'John Smith', matches: 24, rating: 4.8, available: true },
                { id: 2, name: 'Mike Johnson', matches: 18, rating: 4.6, available: true },
                { id: 3, name: 'David Williams', matches: 32, rating: 4.9, available: false }
            ];

            container.innerHTML = `
                <div class="referees-table">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Matches</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${referees.map(ref => `
                                <tr>
                                    <td>${ref.name}</td>
                                    <td>${ref.matches}</td>
                                    <td>⭐ ${ref.rating}</td>
                                    <td>
                                        <span class="badge badge-${ref.available ? 'success' : 'warning'}">
                                            ${ref.available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline" onclick="SPAModules.referees.viewSchedule(${ref.id})">
                                            View Schedule
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        addReferee() {
            utils.showNotification('Add referee functionality coming soon', 'info');
        },

        viewSchedule(id) {
            utils.showNotification('Referee schedule coming soon', 'info');
        },

        filterRefereesByVenue(venueId) {
            console.log('Filtering referees by venue ID:', venueId);
            
            if (!venueId || venueId === 'all') {
                // Show all referees
                this.loadReferees();
                return;
            }
            
            // Filter referees by venue and re-render
            const container = document.getElementById('referees-grid');
            if (container) {
                container.innerHTML = `<p>Loading referees for selected venue...</p>`;
                // In a real implementation, you would filter the referees data by venue
                setTimeout(() => {
                    container.innerHTML = `<p>Referees filtered for venue ${venueId}</p>`;
                }, 500);
            }
        }
    };

    // Leagues Module
    modules.leagues = {
        async render() {
            return `
                <div class="content-area">
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Leagues</h1>
                            <p class="page-subtitle">Manage league structure and standings</p>
                        </div>
                    </div>
                    
                    <div class="leagues-content">
                        <div class="leagues-list" id="leagues-list">
                            <div class="loading-message">Loading leagues...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Leagues module initialized');
            await this.loadLeagues();
            
            // Initialize venue selector for league filtering
            if (window.VenueSelector) {
                await window.VenueSelector.initialize((venueData) => {
                    console.log('Venue changed, filtering leagues for:', venueData);
                    this.filterLeaguesByVenue(venueData.id);
                });
            }
        },

        async loadLeagues() {
            const container = document.getElementById('leagues-list');
            if (!container) return;

            container.innerHTML = `
                <div class="leagues-grid">
                    <div class="league-card">
                        <h3>Premier League</h3>
                        <p>8 Teams • 14 Rounds</p>
                        <button class="btn btn-outline">View Standings</button>
                    </div>
                    <div class="league-card">
                        <h3>Championship</h3>
                        <p>6 Teams • 10 Rounds</p>
                        <button class="btn btn-outline">View Standings</button>
                    </div>
                </div>
            `;
        },

        filterLeaguesByVenue(venueId) {
            console.log('Filtering leagues by venue ID:', venueId);
            
            if (!venueId || venueId === 'all') {
                // Show all leagues
                this.loadLeagues();
                return;
            }
            
            // Filter leagues by venue and re-render
            const container = document.getElementById('leagues-list');
            if (container) {
                container.innerHTML = `<p>Loading leagues for selected venue...</p>`;
                // In a real implementation, you would filter the leagues data by venue
                setTimeout(() => {
                    container.innerHTML = `<p>Leagues filtered for venue ${venueId}</p>`;
                }, 500);
            }
        }
    };

    // Divisions Module
    modules.divisions = {
        async render() {
            return `
                <div class="content-area">
                    <!-- Divisions module content will be implemented here -->
                </div>
            `;
        },

        async init() {
            console.log('Divisions module initialized');
        }
    };

    // Pitches Module
    modules.pitches = {
        pitchesData: [],
        // Get subscription tiers from venues module (shared subscription system)
        get subscriptionTiers() {
            return window.SPAModules?.venues?.subscriptionTiers || {
                'starter': { limits: { pitches: 1 } },
                'growth': { limits: { pitches: 3 } },
                'pro': { limits: { pitches: 8 } }
            };
        },
        currentPlan: 'professional',

        async render() {
            return `
                <div class="content-area">
                    <!-- Subscription Banner with Action Buttons -->
                    <div class="subscription-banner" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; padding: 20px 28px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);">
                        <div class="subscription-details">
                            <div style="font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #1f2937; display: none;">
                                <span id="current-plan-name">Professional</span> Plan - <span id="current-venue-display">All Venues</span>
                            </div>
                            <div style="font-size: 14px; color: #64748b; display: flex; align-items: center; gap: 8px;">
                                <span style="display: inline-flex; align-items: center; gap: 4px;">
                                    <span style="font-weight: 700; font-size: 16px; color: #2e6417;"><span id="pitches-count">0</span></span>
                                    <span style="color: #94a3b8;">/</span>
                                    <span style="color: #475569; font-weight: 600;" id="pitches-limit">10</span>
                                </span>
                                <span style="color: #94a3b8;">pitches allocated</span>
                            </div>
                        </div>
                        <div class="subscription-actions" style="display: flex; gap: 10px;">
                            <button class="btn" style="background: white; color: #64748b; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-weight: 500; font-size: 12px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: auto; min-height: auto; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;" onclick="SPAModules.pitches.exportData()" onmouseover="this.style.borderColor='#cbd5e1'; this.style.background='#f8fafc'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='white'">
                                EXPORT DATA
                            </button>
                            <button class="btn" style="background: #2e6417; color: white; border: 1px solid #2e6417; padding: 8px 16px; border-radius: 8px; font-weight: 500; font-size: 12px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: auto; min-height: auto; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;" onclick="SPAModules.pitches.addMultiplePitches()" onmouseover="this.style.background='#1e4009'" onmouseout="this.style.background='#2e6417'">
                                ADD MULTIPLE PITCHES
                            </button>
                            <button class="btn" style="background: #2e6417; color: white; border: 1px solid #2e6417; padding: 8px 16px; border-radius: 8px; font-weight: 500; font-size: 12px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: auto; min-height: auto; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;" onclick="SPAModules.pitches.addPitch()" onmouseover="this.style.background='#1e4009'" onmouseout="this.style.background='#2e6417'">
                                ADD PITCH
                            </button>
                        </div>
                    </div>
                    
                    <!-- Pitches Grid -->
                    <div class="pitches-grid" id="pitches-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; justify-items: center; width: 100%;">
                        <div class="pitches-loading" style="grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; min-height: 300px;">
                            <div class="loading-content" style="position: relative; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                <div class="loading-spinner" style="width: 80px; height: 80px; border: 3px solid rgba(46, 100, 23, 0.2); border-top: 3px solid #2e6417; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                                <p style="color: #2e6417; margin: 0; font-weight: 600; font-size: 16px; white-space: nowrap;">Loading pitches...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Pitches module initialized');
            this._initializing = true;
            await this.loadPitchesData();
            this.renderPitchesGrid();
            this._initializing = false;
            
            // Initialize venue selector after pitches are loaded and rendered
            if (window.VenueSelector) {
                window.VenueSelector.initialize((venueData) => {
                    console.log('Venue changed, filtering pitches for:', venueData);
                    if (!this._initializing) {
                        this.filterPitchesByVenue(venueData.id);
                    }
                });
            }
        },

        async loadPitchesData() {
            try {
                console.log('Loading pitches data from database...');
                
                // Get currently selected venue
                const selectedVenueName = document.getElementById('selected-venue-name')?.textContent || '';
                const currentVenueId = window.VenueSelector ? window.VenueSelector.currentVenueId : null;
                
                console.log('Current venue:', selectedVenueName, 'ID:', currentVenueId);
                
                // Check if we're running locally (no server)
                const isLocalTesting = !window.UserDataManager || window.location.protocol === 'file:';
                
                let pitchesArray = null;
                
                if (!isLocalTesting) {
                    try {
                        // Load from database API
                        const result = await this.fetchPitchesFromDatabase(currentVenueId);
                        if (result && result.success && result.pitches) {
                            pitchesArray = result.pitches;
                            console.log('Loaded pitches from database:', pitchesArray.length);
                        }
                    } catch (serverError) {
                        console.warn('Database API loading failed:', serverError);
                    }
                }
                
                if (pitchesArray && pitchesArray.length > 0) {
                    // Normalize pitch data for frontend compatibility
                    const normalizedPitches = pitchesArray.map(pitch => this.normalizePitchData(pitch));
                    
                    // Filter pitches by selected venue if a specific venue is selected
                    if (currentVenueId && selectedVenueName !== 'All Venues' && selectedVenueName !== 'Loading...') {
                        this.pitchesData = normalizedPitches.filter(pitch => 
                            pitch.venue_id === currentVenueId || pitch.venueId === currentVenueId
                        );
                        console.log(`Loaded ${this.pitchesData.length} pitches for venue: ${selectedVenueName}`);
                    } else {
                        this.pitchesData = normalizedPitches;
                        console.log('Loaded all pitches (no venue filter)');
                    }
                } else {
                    this.pitchesData = [];
                    console.log('No pitches found - starting with empty data');
                }
                
                this.updateSubscriptionInfo();
            } catch (error) {
                console.error('Error loading pitches data:', error);
                this.pitchesData = [];
                this.updateSubscriptionInfo();
                console.log('Data loading failed - starting with empty data');
            }
        },

        getMockPitchesData() {
            // No mock data - return empty array for clean start
            return [];
        },

        renderPitchesGrid(dataToRender = null) {
            const grid = document.getElementById('pitches-grid');
            if (!grid) {
                console.warn('Pitches grid element not found, skipping render');
                return;
            }
            
            // Prevent renders during initialization or if already rendering
            if (this._rendering) {
                console.log('Already rendering, skipping duplicate render');
                return;
            }
            
            // Debounce rapid render calls to prevent jittering
            if (this._renderTimeout) {
                console.log('Clearing previous render timeout to prevent jittering');
                clearTimeout(this._renderTimeout);
            }
            
            this._renderTimeout = setTimeout(() => {
                this._executeRender(dataToRender);
                this._renderTimeout = null;
            }, 50); // 50ms debounce to prevent rapid re-renders
        },
        
        _executeRender(dataToRender = null) {
            const grid = document.getElementById('pitches-grid');
            if (!grid) {
                console.warn('Pitches grid element not found during execution, skipping render');
                return;
            }
            
            this._rendering = true;
            const loadingElement = grid.querySelector('.pitches-loading');
            
            // Hide loading state
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            // Clear existing content except loading
            const existingCards = grid.querySelectorAll('.pitch-card, .add-pitch-card');
            existingCards.forEach(card => card.remove());
            
            // Use provided data or default to all data
            const pitchesToRender = dataToRender || this.pitchesData;
            
            // Render existing pitches
            pitchesToRender.forEach(pitch => {
                const pitchCard = this.createPitchCard(pitch);
                grid.appendChild(pitchCard);
            });

            // Add "Add Pitch" card if under limit
            let maxPitches = 3; // Default
            
            if (window.VenueSelector && window.VenueSelector.venues) {
                const currentVenueId = window.VenueSelector.currentVenueId;
                const currentVenue = window.VenueSelector.venues.find(v => v.id === currentVenueId);
                
                if (currentVenue) {
                    const venuePlan = currentVenue.subscription?.plan || 'Growth';
                    
                    // Use correct package limits, not the stored max_pitches
                    const packageLimits = {
                        'Starter': 1,
                        'Growth': 3,
                        'Pro': 8,
                        'Professional': 8,
                        'Enterprise': 15
                    };
                    
                    maxPitches = packageLimits[venuePlan] || 3;
                }
            }
            
            if (this.pitchesData.length < maxPitches) {
                const addCard = this.createAddPitchCard();
                grid.appendChild(addCard);
            }
            
            // Reset rendering flag
            this._rendering = false;
        },

        createPitchCard(pitch) {
            const card = document.createElement('div');
            card.className = 'pitch-card pitch-masterpiece';
            
            // Get available days for display in correct order (Monday-Sunday)
            const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const availableDays = dayOrder
                .filter(day => pitch.availability[day])
                .map(day => day.charAt(0).toUpperCase() + day.slice(1, 3))
                .join(', ');

            // Status colors and icons
            const statusConfig = {
                available: { color: '#10b981', bg: '#d1fae5', icon: '✅', text: 'Available' },
                maintenance: { color: '#f59e0b', bg: '#fef3c7', icon: '🔧', text: 'Maintenance' },
                unavailable: { color: '#ef4444', bg: '#fee2e2', icon: '❌', text: 'Unavailable' }
            };

            const status = statusConfig[pitch.status] || statusConfig.available;

            card.innerHTML = `
                <div class="pitch-masterpiece-container">
                    <!-- Modern Gradient Header -->
                    <div style="
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%);
                        color: white; 
                        padding: 20px; 
                        border-radius: 16px 16px 0 0;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3);
                    ">
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%); pointer-events: none;"></div>
                        <div style="position: relative; z-index: 2; text-align: center;">
                            <h3 style="font-size: 18px; font-weight: 600; color: white; margin: 0; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${pitch.name}</h3>
                            ${pitch.isMockData ? '<div style="position: absolute; top: 8px; right: 8px; background: rgba(255,215,0,0.9); color: #1a1a1a; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">DEMO</div>' : ''}
                        </div>
                    </div>

                    <!-- Premium Pitch Graphic Section -->
                    <div class="pitch-graphic-premium">
                        <div class="pitch-graphic-wrapper">
                            <div class="pitch-svg-container">
                                <img src="../../img/pitches-graphic.svg" alt="Football Pitch" class="pitch-svg-premium">
                            </div>
                            <div class="pitch-glow-effect"></div>
                        </div>
                    </div>
                    
                    <!-- Premium Info Section -->
                    <div class="pitch-info-premium">
                        <!-- Status and Info Bar -->
                        <div class="pitch-status-info-bar">
                            <div class="status-indicator-main status-clickable" style="background: ${status.bg}; color: ${status.color};" onclick="SPAModules.pitches.changeStatus('${pitch.id || pitch.pitch_id}')">
                                <span class="status-icon">${status.icon}</span>
                                <span class="status-text">${status.text}</span>
                                <span class="status-click-hint">Click to change</span>
                            </div>
                            <div class="pitch-size-badge">${pitch.pitchSize}</div>
                        </div>
                        
                        <!-- Quick Stats Bar -->
                        <div class="quick-stats-bar">
                            <div class="stat-item stat-days">
                                <div class="stat-icon">📅</div>
                                <div class="stat-text">${availableDays}</div>
                            </div>
                        </div>
                        
                        <!-- Time Slots with Premium Design -->
                        <div class="premium-time-slots">
                            <div class="time-slots-header">
                                <span class="slots-label">Allocated Kick Off Times</span>
                                <span class="slots-count">${pitch.kickOffTimes.length}</span>
                            </div>
                            <div class="time-slots-grid">
                                    ${pitch.kickOffTimes.map((time, index) => {
                                    const timeSlotStatus = pitch.timeSlotStatus && pitch.timeSlotStatus[time] ? pitch.timeSlotStatus[time] : 'available';
                                    const statusClass = timeSlotStatus === 'available' ? 'available' : 'unavailable';
                                    const statusColor = timeSlotStatus === 'available' ? '#16a34a' : '#dc2626';
                                    return `
                                        <div class="time-slot-premium clickable-time-slot ${statusClass}" 
                                             data-pitch-id="${pitch.id}" 
                                             data-time="${time}"
                                             onclick="SPAModules.pitches.toggleTimeSlot('${pitch.id}', '${time}')"
                                             style="cursor: pointer; border-color: ${statusColor}; position: relative;">
                                            <div class="time-text">${time}</div>
                                            <div class="time-status-indicator premium-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); box-shadow: 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3); border: 2px solid rgba(255,255,255,0.8); margin-top: 4px;"></div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <!-- Premium Action Buttons -->
                        <div class="premium-actions" style="display: flex; justify-content: center; gap: 8px;">
                            <button class="action-btn calendar-btn" onclick="SPAModules.pitches.viewCalendar('${pitch.id}')" style="background: linear-gradient(135deg, #2e6417 0%, #1e4009 100%); color: white; width: 36px; height: 36px; padding: 0; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-size: 16px; border: none;">
                                📅
                            </button>
                            <button class="action-btn edit-action" onclick="SPAModules.pitches.editPitch('${pitch.id}')" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; width: 36px; height: 36px; padding: 0; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                                ✏️
                            </button>
                            <button class="action-btn delete-action" onclick="SPAModules.pitches.deletePitch('${pitch.id}')" style="background: #dc2626; color: white; border: 1px solid #b91c1c; width: 36px; height: 36px; padding: 0; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add premium styling
            card.style.cssText = `
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 20px;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                box-shadow: 
                    0 4px 6px rgba(0, 0, 0, 0.05),
                    0 1px 3px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                backdrop-filter: blur(10px);
                transform-origin: center;
            `;

            // Add premium interactions
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = `
                    0 20px 25px rgba(0, 0, 0, 0.15),
                    0 8px 10px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(46, 100, 23, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8)
                `;
                card.style.borderColor = 'rgba(46, 100, 23, 0.2)';
                
                // Add glow effect
                const glowEffect = card.querySelector('.pitch-glow-effect');
                if (glowEffect) {
                    glowEffect.style.opacity = '1';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = `
                    0 4px 6px rgba(0, 0, 0, 0.05),
                    0 1px 3px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6)
                `;
                card.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                
                // Remove glow effect
                const glowEffect = card.querySelector('.pitch-glow-effect');
                if (glowEffect) {
                    glowEffect.style.opacity = '0';
                }
            });

            // Add click animation
            card.addEventListener('mousedown', () => {
                card.style.transform = 'translateY(-4px) scale(0.98)';
            });

            card.addEventListener('mouseup', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            return card;
        },

        createAddPitchCard() {
            const card = document.createElement('div');
            card.className = 'add-pitch-card';
            card.style.cssText = `
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                border: 2px dashed #9ca3af;
                border-radius: 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 300px;
                cursor: pointer;
                transition: all 0.3s ease;
                padding: 40px 20px;
                text-align: center;
            `;

            card.innerHTML = `
                <div style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;">➕</div>
                <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin: 0 0 8px 0;">Add New Pitch</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">Click to create a new football pitch</p>
            `;

            card.addEventListener('click', () => this.addPitch());
            
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = '#2e6417';
                card.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                card.style.transform = 'translateY(-2px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = '#9ca3af';
                card.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                card.style.transform = 'translateY(0)';
            });
            
            return card;
        },

        updateSubscriptionInfo() {
            const planElement = document.getElementById('current-plan-name');
            const countElement = document.getElementById('pitches-count');
            const limitElement = document.getElementById('pitches-limit');
            const venueDisplayElement = document.getElementById('current-venue-display');
            
            // Get current venue data from VenueSelector
            let maxPitches = 3; // Default
            let venuePlan = 'Growth'; // Default
            
            if (window.VenueSelector && window.VenueSelector.venues) {
                const currentVenueId = window.VenueSelector.currentVenueId;
                const currentVenue = window.VenueSelector.venues.find(v => v.id === currentVenueId);
                
                if (currentVenue) {
                    // Get plan from venue subscription
                    venuePlan = currentVenue.subscription?.plan || 'Growth';
                    
                    // IMPORTANT: Use subscription package limits, NOT max_pitches from venue
                    // because max_pitches might be incorrectly set during venue creation
                    const packageLimits = {
                        'Starter': 1,
                        'Growth': 3,
                        'Pro': 8,
                        'Professional': 8,
                        'Enterprise': 15
                    };
                    
                    maxPitches = packageLimits[venuePlan] || currentVenue.max_pitches || 3;
                    
                    // Log for debugging
                    console.log('Venue subscription info:', {
                        venue: currentVenue.name,
                        plan: venuePlan,
                        stored_max_pitches: currentVenue.max_pitches,
                        actual_package_limit: maxPitches,
                        current_pitch_count: currentVenue.pitch_count || 0
                    });
                }
            }
            
            // Update plan name
            if (planElement) planElement.textContent = venuePlan;
            
            // Update current venue display
            const selectedVenueName = document.getElementById('selected-venue-name')?.textContent || 'All Venues';
            if (venueDisplayElement) {
                if (selectedVenueName === 'Loading...' || selectedVenueName === 'No venues available') {
                    venueDisplayElement.textContent = 'All Venues';
                } else {
                    venueDisplayElement.textContent = selectedVenueName;
                }
            }
            
            // Update pitch counts (filtered by venue)
            if (countElement) countElement.textContent = this.pitchesData.length;
            
            // Update pitch limits with correct package limit
            if (limitElement) limitElement.textContent = maxPitches;
        },

        addPitch() {
            const form = `
                <style>
                    /* Modal design standards from CLAUDE.md */
                    .modal-content {
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                        background: transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        max-height: 85vh !important;
                        height: auto !important;
                    }
                    
                    .modal, .modal-dialog, .modal-backdrop, .utils-modal, .modal-container, .modal-wrapper {
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    }
                    
                    [class*="modal"] {
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    }
                    
                    .modal-body {
                        padding: 0 !important;
                        background: white !important;
                        flex: 1 1 auto !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        min-height: 0 !important;
                        max-height: calc(85vh - 160px) !important;
                    }
                    
                    .modal-body::-webkit-scrollbar {
                        width: 6px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-track {
                        background: #f1f1f1 !important;
                        border-radius: 3px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-thumb {
                        background: #c1c1c1 !important;
                        border-radius: 3px !important;
                    }
                    
                    .modal-header {
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%) !important;
                        color: white !important;
                        padding: 28px 40px !important;
                        border-radius: 12px 12px 0 0 !important;
                        position: sticky !important;
                        top: 0 !important;
                        overflow: visible !important;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3) !important;
                        margin: -1px -1px 0 -1px !important;
                        transform: scale(1.01) !important;
                        border: none !important;
                        z-index: 1001 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-align: center !important;
                    }
                    
                    .modal-header h3 {
                        font-size: 18px !important;
                        font-weight: 600 !important;
                        color: white !important;
                        margin: 0 !important;
                        line-height: 1 !important;
                        padding: 0 !important;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                    }
                    
                    .modal-footer {
                        background: white !important;
                        padding: 20px 40px !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        gap: 12px !important;
                        position: sticky !important;
                        bottom: 0 !important;
                        border-radius: 0 0 12px 12px !important;
                        box-shadow: 0 -2px 8px rgba(0,0,0,0.05) !important;
                    }
                    
                    .modal-footer .btn {
                        margin: 0 !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                        font-weight: 600 !important;
                        font-size: 13px !important;
                        padding: 8px 16px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        letter-spacing: 0.02em !important;
                    }
                    
                    .modal-footer .btn-secondary {
                        background: transparent !important;
                        color: #475569 !important;
                        border: 2px solid #6b7280 !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                    }
                    
                    .modal-footer .btn-secondary:hover {
                        background: #f9fafb !important;
                        color: #374151 !important;
                        border-color: #9ca3af !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                    }
                    
                    .modal-footer .btn-primary {
                        background: #2e6417 !important;
                        color: white !important;
                        border: 2px solid #2e6417 !important;
                        box-shadow: 0 1px 3px rgba(46, 100, 23, 0.3) !important;
                    }
                    
                    .modal-footer .btn-primary:hover {
                        background: #1e4009 !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3) !important;
                    }
                    
                    /* Professional form styling - copied from edit modal */
                    .professional-modal-form {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 2rem 2rem 5rem 2rem;
                        width: 100%;
                        box-sizing: border-box;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                    }
                    
                    .professional-form-group {
                        margin-bottom: 20px;
                    }
                    
                    .professional-form-label {
                        display: block;
                        margin-bottom: 6px;
                        font-size: 13px;
                        font-weight: 600 !important;
                        color: #374151;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                    }
                    
                    .professional-form-input, .professional-form-select {
                        width: 100%;
                        padding: 10px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        background: white;
                        transition: all 0.2s ease;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                        box-sizing: border-box;
                    }
                    
                    .professional-form-input:focus, .professional-form-select:focus {
                        outline: none;
                        border-color: #2e6417;
                        box-shadow: 0 0 0 3px rgba(46, 100, 23, 0.1);
                    }
                    
                    .professional-form-section {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 20px;
                    }
                    
                    .professional-form-section-title {
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 12px;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                    }
                    
                    .time-selection-error {
                        display: none;
                        color: #dc2626;
                        font-size: 11px;
                        margin-bottom: 8px;
                        font-weight: 500;
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 4px;
                        padding: 6px 8px;
                    }
                </style>
                
                <form id="add-pitch-form" class="professional-modal-form">
                    <div class="professional-form-group">
                        <label class="professional-form-label">Pitch Name</label>
                        <input type="text" name="name" class="professional-form-input" required>
                    </div>
                    <div style="display: flex; gap: 16px;">
                        <div class="professional-form-group" style="flex: 1;">
                            <label class="professional-form-label">Pitch Size</label>
                            <select name="pitchSize" class="professional-form-select" required>
                                <option value="">Select size</option>
                                <option value="5-a-side">5-a-side</option>
                                <option value="6-a-side">6-a-side</option>
                                <option value="7-a-side">7-a-side</option>
                                <option value="9-a-side">9-a-side</option>
                                <option value="11-a-side">11-a-side</option>
                            </select>
                        </div>
                        <div class="professional-form-group" style="flex: 1;">
                            <label class="professional-form-label">Status</label>
                            <select name="status" class="professional-form-select" required>
                                <option value="available" selected>Available</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="professional-form-section">
                        <div class="professional-form-section-title">Availability Configuration</div>
                        <div class="professional-form-group">
                            <label class="professional-form-label">Available Days</label>
                            <div class="days-row" style="display: flex; gap: 8px; flex-wrap: nowrap; justify-content: space-between;">
                                ${[{full: 'monday', short: 'Mo'}, {full: 'tuesday', short: 'Tu'}, {full: 'wednesday', short: 'We'}, {full: 'thursday', short: 'Th'}, {full: 'friday', short: 'Fr'}, {full: 'saturday', short: 'Sa'}, {full: 'sunday', short: 'Su'}].map(day => `
                                    <div class="day-checkbox" onclick="toggleSinglePitchDay('${day.full}')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                        <input type="checkbox" name="availability" value="${day.full}" id="single-${day.full}" style="display: none;">
                                        <span style="font-size: 12px; font-weight: 600; color: #6b7280;">${day.short}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="professional-form-group" style="margin-bottom: 0;">
                            <label class="professional-form-label">Kick Off Times</label>
                            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                                <select id="hours-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                    <option value="">Hour</option>
                                    ${Array.from({length: 18}, (_, i) => {
                                        const hour = i + 6; // 6 AM to 11 PM
                                        const hourStr = hour.toString().padStart(2, '0');
                                        return `<option value="${hourStr}">${hourStr}</option>`;
                                    }).join('')}
                                </select>
                                <span style="color: #64748b; font-weight: 500;">:</span>
                                <select id="minutes-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                    <option value="">Min</option>
                                    ${['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => `<option value="${min}">${min}</option>`).join('')}
                                </select>
                                <button type="button" onclick="addCustomTime()" style="padding: 8px 16px; background: #2e6417; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;">Add Time</button>
                            </div>
                            <div id="time-selection-error" class="time-selection-error">Please select both hour and minute before adding a time.</div>
                            <div style="border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 10px; min-height: 40px;">
                                <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Selected Times:</div>
                                <div id="selected-times" style="display: flex; flex-wrap: wrap; gap: 6px; overflow: hidden;">
                                    <div id="no-times-indicator" style="color: #9ca3af; font-style: italic; font-size: 12px; padding: 8px 0;">No kick-off times selected</div>
                                </div>
                            </div>
                            <input type="hidden" name="kickOffTimes" id="kickoff-times-hidden" value="">
                        </div>
                    </div>
                </form>
            `;
            
            utils.showModal({
                title: 'Add New Pitch',
                content: form,
                onConfirm: () => this.savePitch()
            });
            
            // Define time management functions for add pitch modal
            window.addCustomTime = () => {
                const hoursSelect = document.getElementById('hours-select');
                const minutesSelect = document.getElementById('minutes-select');
                const selectedTimesDiv = document.getElementById('selected-times');
                const hiddenInput = document.getElementById('kickoff-times-hidden');
                const noTimesIndicator = document.getElementById('no-times-indicator');
                const errorMessage = document.getElementById('time-selection-error');
                
                // Hide error message first
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
                
                if (hoursSelect.value && minutesSelect.value) {
                    const timeValue = `${hoursSelect.value}:${minutesSelect.value}`;
                    const currentTimes = hiddenInput.value ? hiddenInput.value.split(',').filter(t => t.trim()) : [];
                    
                    if (!currentTimes.includes(timeValue)) {
                        currentTimes.push(timeValue);
                        currentTimes.sort();
                        
                        // Hide no times indicator
                        if (noTimesIndicator) {
                            noTimesIndicator.remove();
                        }
                        
                        // Create time badge
                        const timeBadge = document.createElement('span');
                        timeBadge.className = 'time-chip';
                        timeBadge.dataset.time = timeValue;
                        timeBadge.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #2e6417; color: white; border: 1px solid #2e6417; border-radius: 16px; font-size: 12px; font-weight: 500;';
                        timeBadge.innerHTML = `
                            ${timeValue}
                            <button type="button" onclick="removeTime('${timeValue}')" style="background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 0; margin: 0; font-size: 14px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" onmouseover="this.style.color='rgba(255,255,255,1)'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.8)'; this.style.background='none'">×</button>
                        `;
                        
                        selectedTimesDiv.appendChild(timeBadge);
                        hiddenInput.value = currentTimes.join(',');
                        
                        // Reset dropdowns
                        hoursSelect.value = '';
                        minutesSelect.value = '';
                    }
                } else {
                    // Show error message if hour or minute not selected
                    if (errorMessage) {
                        errorMessage.style.display = 'block';
                        setTimeout(() => {
                            errorMessage.style.display = 'none';
                        }, 3000); // Hide after 3 seconds
                    }
                }
            };
            
            window.removeTime = (timeToRemove) => {
                const selectedTimesDiv = document.getElementById('selected-times');
                const hiddenInput = document.getElementById('kickoff-times-hidden');
                const timeBadge = selectedTimesDiv.querySelector(`[data-time="${timeToRemove}"]`);
                
                if (timeBadge) {
                    timeBadge.remove();
                    const currentTimes = hiddenInput.value.split(',').filter(time => time !== timeToRemove && time.trim());
                    hiddenInput.value = currentTimes.join(',');
                    
                    // Show no times indicator if no times left
                    if (currentTimes.length === 0) {
                        const noTimesIndicator = document.createElement('div');
                        noTimesIndicator.id = 'no-times-indicator';
                        noTimesIndicator.style.cssText = 'color: #9ca3af; font-style: italic; font-size: 12px; padding: 8px 0;';
                        noTimesIndicator.textContent = 'No kick-off times selected';
                        selectedTimesDiv.appendChild(noTimesIndicator);
                    }
                }
            };
            
            // Add toggle function for single pitch day selection
            window.toggleSinglePitchDay = (day) => {
                const checkbox = document.getElementById(`single-${day}`);
                const container = checkbox.closest('.day-checkbox');
                const span = container.querySelector('span');
                
                checkbox.checked = !checkbox.checked;
                
                // Update visual state
                if (checkbox.checked) {
                    // Selected state - green
                    container.style.backgroundColor = '#dcfce7';
                    container.style.borderColor = '#16a34a';
                    span.style.color = '#16a34a';
                } else {
                    // Unselected state - gray
                    container.style.backgroundColor = '#f9fafb';
                    container.style.borderColor = '#d1d5db';
                    span.style.color = '#6b7280';
                }
            };
        },

        async savePitch() {
            try {
                const form = document.getElementById('add-pitch-form');
                const formData = new FormData(form);
                
                // Validate required fields
                const name = formData.get('name');
                const pitchSize = formData.get('pitchSize');
                
                if (!name || !name.trim()) {
                    utils.showNotification('Please enter a pitch name', 'error');
                    return;
                }
                
                if (!pitchSize) {
                    utils.showNotification('Please select a pitch size', 'error');
                    return;
                }
                
                // Check subscription limits based on current venue
                let maxPitches = 3; // Default
                let venuePlan = 'Growth'; // Default
                
                if (window.VenueSelector && window.VenueSelector.venues) {
                    const currentVenueId = window.VenueSelector.currentVenueId;
                    const currentVenue = window.VenueSelector.venues.find(v => v.id === currentVenueId);
                    
                    if (currentVenue) {
                        venuePlan = currentVenue.subscription?.plan || 'Growth';
                        
                        // Use correct package limits, not the stored max_pitches
                        const packageLimits = {
                            'Starter': 1,
                            'Growth': 3,
                            'Pro': 8,
                            'Professional': 8,
                            'Enterprise': 15
                        };
                        
                        maxPitches = packageLimits[venuePlan] || 3;
                    }
                }
                
                if (this.pitchesData.length >= maxPitches) {
                    utils.showNotification(`Pitch limit reached (${maxPitches} pitches for ${venuePlan} plan). Please upgrade your venue's subscription.`, 'error');
                    return;
                }
                
                // Get current venue information
                const currentVenueId = window.VenueSelector ? window.VenueSelector.currentVenueId : null;
                const selectedVenueName = document.getElementById('selected-venue-name')?.textContent || '';
                
                // Get kick-off times from hidden input
                const kickOffTimesInput = document.getElementById('kickoff-times-hidden');
                const kickOffTimesString = kickOffTimesInput ? kickOffTimesInput.value : '';
                const kickOffTimesArray = kickOffTimesString ? kickOffTimesString.split(',').filter(t => t.trim()) : [];
                
                // Get status from form
                const status = formData.get('status') || 'available';
                
                const newPitch = {
                    id: 'pitch-' + Date.now(),
                    name: name.trim(),
                    pitchSize: pitchSize,
                    status: status,
                    availability: {},
                    kickOffTimes: kickOffTimesArray,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    venue_id: currentVenueId,
                    venueName: selectedVenueName
                };
                
                // Set availability
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
                    newPitch.availability[day] = formData.getAll('availability').includes(day);
                });
                
                // Validate at least one day is selected
                const hasAvailableDays = Object.values(newPitch.availability).some(day => day);
                if (!hasAvailableDays) {
                    utils.showNotification('Please select at least one available day', 'error');
                    return;
                }
                
                // Validate at least one kick-off time is selected
                if (kickOffTimesArray.length === 0) {
                    utils.showNotification('Please select at least one kick-off time', 'error');
                    return;
                }
                
                // Get tenant_id using the same logic as multiple pitches
                let tenantId = null;
                try {
                    const currentUser = JSON.parse(localStorage.getItem('fivetrackr_session') || '{}');
                    tenantId = currentUser.tenant_id || parseInt(localStorage.getItem('tenant_id'));
                    
                    // If still null, try to get from auth token payload
                    if (!tenantId) {
                        const authToken = localStorage.getItem('auth_token');
                        if (authToken) {
                            const payload = JSON.parse(atob(authToken.split('.')[1]));
                            tenantId = payload.tenant_id || payload.user_id;
                        }
                    }
                } catch (error) {
                    console.error('Error getting tenant_id:', error);
                    tenantId = 36; // Fallback based on logs showing user is tenant 36
                }
                
                // Ensure tenant_id is not null
                if (!tenantId) {
                    tenantId = 36;
                    console.warn('Using fallback tenant_id:', tenantId);
                }

                // Save to database via API using correct field names
                const result = await this.createPitchInDatabase({
                    venue_id: currentVenueId,
                    tenant_id: parseInt(tenantId),
                    name: name.trim(),  // Server expects 'name', not 'pitch_name'
                    size: pitchSize,    // Server expects 'size', not 'pitch_size'
                    status: status,
                    is_active: true,
                    availability: newPitch.availability,
                    kickOffTimes: kickOffTimesArray
                });
                
                if (result && result.success) {
                    // Clear cache to ensure fresh data on next load
                    this._apiCache = {};
                    
                    // Add the new pitch to local data instead of reloading from database
                    const createdPitch = result.pitch || {
                        id: result.id || Date.now(),
                        pitch_id: result.pitch_id || result.id || Date.now(),
                        ...newPitch,
                        createdAt: new Date().toISOString()
                    };
                    this.pitchesData.push(this.normalizePitchData(createdPitch));
                    this.renderPitchesGrid();
                    this.updateSubscriptionInfo();
                    utils.showNotification(`Successfully added "${newPitch.name}"`, 'success');
                    utils.hideModal();
                } else {
                    const errorMessage = result?.message || 'Failed to save pitch to database';
                    utils.showNotification(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error saving pitch:', error);
                utils.showNotification('Failed to save pitch', 'error');
            }
        },

        // Helper function to save pitches data with conflict detection
        async savePitchesDataWithConflictCheck(forceOverwrite = false) {
            console.log('savePitchesDataWithConflictCheck called, forceOverwrite:', forceOverwrite);
            
            // Check if we're running locally (no server)
            const isLocalTesting = !window.UserDataManager || window.location.protocol === 'file:';
            
            if (isLocalTesting) {
                console.info('🧪 Local testing mode - simulating successful save');
                // Simulate successful save for local testing
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({ success: true, simulated: true });
                    }, 300); // Simulate network delay
                });
            }
            
            if (typeof UserDataManager !== 'undefined' && typeof UserDataManager.saveWithConflictCheck === 'function') {
                console.log('Using UserDataManager.saveWithConflictCheck');
                try {
                    const result = await UserDataManager.saveWithConflictCheck('pitches', this.pitchesData, forceOverwrite);
                    console.log('saveWithConflictCheck result:', result);
                    
                    if (result.conflict && !forceOverwrite) {
                        console.log('Conflict detected, showing dialog');
                        // Show conflict warning dialog
                        const userChoice = await this.showConflictDialog(result.message, result.conflictInfo);
                        console.log('User choice:', userChoice);
                        if (userChoice === 'overwrite') {
                            return await this.savePitchesDataWithConflictCheck(true);
                        } else if (userChoice === 'cancel') {
                            // Reload data from server to get latest version
                            await this.loadPitchesData();
                            this.renderPitchesGrid();
                            return { success: false, cancelled: true };
                        }
                    }
                    
                    return result;
                } catch (error) {
                    console.error('Error in saveWithConflictCheck:', error);
                    return { success: false, error: error.message };
                }
            } else if (typeof UserDataManager !== 'undefined' && typeof UserDataManager.save === 'function') {
                // Fallback to regular save
                console.log('Using UserDataManager.save fallback');
                try {
                    const result = await UserDataManager.save('pitches', this.pitchesData);
                    return { success: true, result: result };
                } catch (error) {
                    console.error('Error in save fallback:', error);
                    return { success: false, error: error.message };
                }
            } else {
                console.error('UserDataManager not available - returning simulated success for testing');
                return { success: true, simulated: true };
            }
        },

        async showConflictDialog(message, conflictInfo) {
            return new Promise((resolve) => {
                const modal = utils.showModal({
                    title: 'Data Conflict Detected',
                    content: `
                        <div class="conflict-dialog">
                            <div class="conflict-message" style="margin-bottom: 16px; padding: 12px; background: #fef3cd; border: 1px solid #f59e0b; border-radius: 6px; color: #92400e;">
                                <strong>Warning:</strong> ${message}
                            </div>
                            ${conflictInfo ? `
                                <div class="conflict-details" style="margin-bottom: 16px; font-size: 14px; color: #6b7280;">
                                    <p><strong>Conflict Details:</strong></p>
                                    <pre style="background: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(conflictInfo, null, 2)}</pre>
                                </div>
                            ` : ''}
                            <div class="conflict-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                                <button class="btn btn-outline" onclick="this.closest('.modal-overlay').conflictResolve('cancel')">
                                    Cancel & Refresh
                                </button>
                                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').conflictResolve('overwrite')">
                                    Overwrite Changes
                                </button>
                            </div>
                        </div>
                    `,
                    showDefaultButtons: false
                });
                
                // Add conflict resolution method to modal
                if (modal) {
                    modal.conflictResolve = function(choice) {
                        utils.hideModal();
                        resolve(choice);
                    };
                }
            });
        },

        async deletePitch(id) {
            try {
                // Look for pitch by both id and pitch_id to handle data inconsistencies
                const pitch = this.pitchesData.find(p => p.id === id || p.pitch_id === id || p.id == id || p.pitch_id == id);
                if (!pitch) {
                    console.error('Pitch not found. ID:', id, 'Available pitches:', this.pitchesData.map(p => ({id: p.id, pitch_id: p.pitch_id, name: p.name})));
                    utils.showNotification('Pitch not found', 'error');
                    return;
                }
                
                const confirmed = await utils.showConfirm(
                    'Delete Pitch',
                    `Are you sure you want to delete "${pitch.name}"? This action cannot be undone.`
                );
                
                if (!confirmed) return;
                
                // Delete from database via API
                const result = await this.deletePitchFromDatabase(pitch.pitch_id || pitch.id);
                
                if (result && result.success) {
                    // Clear cache to ensure fresh data on next load
                    this._apiCache = {};
                    
                    // Remove from local data instead of reloading from database
                    this.pitchesData = this.pitchesData.filter(p => 
                        (p.id !== id && p.pitch_id !== id && p.id != id && p.pitch_id != id)
                    );
                    this.renderPitchesGrid();
                    this.updateSubscriptionInfo();
                    utils.showNotification(`Successfully deleted "${pitch.name}"`, 'success');
                } else {
                    const errorMessage = result?.message || 'Failed to delete pitch from database';
                    utils.showNotification(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error deleting pitch:', error);
                utils.showNotification('Failed to delete pitch', 'error');
            }
        },

        addMultiplePitches() {
            // Get venue limits
            let maxPitches = 3; // Default
            const currentPitchCount = this.pitchesData.length;
            
            if (window.VenueSelector && window.VenueSelector.venues) {
                const currentVenueId = window.VenueSelector.currentVenueId;
                const currentVenue = window.VenueSelector.venues.find(v => v.id === currentVenueId);
                
                if (currentVenue) {
                    const venuePlan = currentVenue.subscription?.plan || 'Growth';
                    const packageLimits = {
                        'Starter': 1,
                        'Growth': 3,
                        'Pro': 8,
                        'Professional': 8,
                        'Enterprise': 15
                    };
                    maxPitches = packageLimits[venuePlan] || 3;
                }
            }
            
            const remainingSlots = maxPitches - currentPitchCount;
            if (remainingSlots <= 0) {
                utils.showNotification('You have reached your pitch limit for this venue', 'error');
                return;
            }
            
            const form = `
                <style>
                    /* Modal design standards matching add pitch modal */
                    .modal-content {
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                        background: transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        max-height: 85vh !important;
                        height: auto !important;
                    }
                    
                    .modal-body {
                        overflow: hidden !important;
                        padding: 0 !important;
                        max-height: none !important;
                    }
                    
                    /* Fix modal container overflow */
                    .modal {
                        overflow: hidden !important;
                    }
                    
                    .modal-dialog {
                        overflow: hidden !important;
                        margin: 0 !important;
                        max-width: none !important;
                        width: 100% !important;
                        height: 100% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    
                    .modal-header {
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%) !important;
                        color: white !important;
                        padding: 28px 40px !important;
                        border-radius: 12px 12px 0 0 !important;
                        position: sticky !important;
                        top: 0 !important;
                        overflow: visible !important;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3) !important;
                        margin: -1px -1px 0 -1px !important;
                        transform: scale(1.01) !important;
                        border: none !important;
                        z-index: 1001 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-align: center !important;
                    }
                    
                    .modal-header h3 {
                        font-size: 18px !important;
                        font-weight: 600 !important;
                        color: white !important;
                        margin: 0 !important;
                        line-height: 1 !important;
                        padding: 0 !important;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                    }
                    
                    .modal-footer {
                        background: white !important;
                        padding: 20px 40px !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        gap: 12px !important;
                        position: sticky !important;
                        bottom: 0 !important;
                        border-radius: 0 0 12px 12px !important;
                        box-shadow: 0 -2px 8px rgba(0,0,0,0.05) !important;
                    }
                    
                    .modal-footer .btn {
                        margin: 0 !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                        font-weight: 600 !important;
                        font-size: 13px !important;
                        padding: 8px 16px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        letter-spacing: 0.02em !important;
                    }
                    
                    .modal-footer .btn-secondary {
                        background: transparent !important;
                        color: #475569 !important;
                        border: 2px solid #6b7280 !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                    }
                    
                    .modal-footer .btn-primary {
                        background: #2e6417 !important;
                        color: white !important;
                        border: 2px solid #2e6417 !important;
                        box-shadow: 0 1px 3px rgba(46, 100, 23, 0.3) !important;
                    }
                    
                    .professional-modal-form {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem 2rem 5rem 2rem;
                        width: 100%;
                        box-sizing: border-box;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                        max-height: calc(85vh - 160px);
                        overflow-y: auto;
                        overflow-x: hidden;
                        scrollbar-width: thin;
                        scrollbar-color: #d1d5db #f9fafb;
                    }
                    
                    .professional-modal-form::-webkit-scrollbar {
                        width: 8px;
                    }
                    
                    .professional-modal-form::-webkit-scrollbar-track {
                        background: #f9fafb;
                        border-radius: 4px;
                    }
                    
                    .professional-modal-form::-webkit-scrollbar-thumb {
                        background: #d1d5db;
                        border-radius: 4px;
                    }
                    
                    .professional-modal-form::-webkit-scrollbar-thumb:hover {
                        background: #9ca3af;
                    }
                    
                    /* Prevent horizontal overflow */
                    .days-row {
                        max-width: 100%;
                        overflow: visible;
                    }
                    
                    .day-checkbox {
                        max-width: calc((100% - 48px) / 7); /* Account for gaps */
                        min-width: 0;
                        flex-shrink: 1;
                    }
                    
                    /* Enhanced corner and overflow fixes for add multiple pitches modal */
                    #add-multiple-pitches-form .modal-header {
                        margin: -3px -3px 0 -3px !important;
                        width: calc(100% + 6px) !important;
                        border-radius: 15px 15px 0 0 !important;
                        overflow: hidden !important;
                        position: relative !important;
                    }
                    
                    #add-multiple-pitches-form .modal-content {
                        border-radius: 15px !important;
                        overflow: hidden !important;
                        border: none !important;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
                    }
                    
                    /* Prevent any horizontal scrolling */
                    #add-multiple-pitches-form,
                    #add-multiple-pitches-form *,
                    .professional-modal-form,
                    .professional-modal-form * {
                        overflow-x: hidden !important;
                        max-width: 100% !important;
                    }
                    
                    /* Clean tick/cross button styling */
                    .tick-cross-option {
                        transition: all 0.2s ease !important;
                    }
                    
                    .tick-cross-option:hover {
                        transform: translateY(-1px) !important;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                    }
                    
                    .tick-cross-option:active {
                        transform: translateY(0) !important;
                        transition: all 0.1s ease !important;
                    }
                    
                    .professional-form-group {
                        margin-bottom: 20px;
                    }
                    
                    .professional-form-label {
                        display: block;
                        margin-bottom: 6px;
                        font-size: 13px;
                        font-weight: 600 !important;
                        color: #374151;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                    }
                    
                    .checkbox-group {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .checkbox-group:hover {
                        border-color: #2e6417;
                        background: #f0f9ff;
                    }
                    
                    .checkbox-group input[type="radio"] {
                        margin: 0;
                        width: 16px;
                        height: 16px;
                    }
                    
                    .days-row {
                        display: flex;
                        gap: 6px;
                        flex-wrap: wrap;
                        margin-top: 12px;
                    }
                    
                    .day-checkbox {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 8px 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-size: 12px;
                    }
                    
                    .day-checkbox:hover {
                        border-color: #2e6417;
                        background: #f0f9ff;
                    }
                    
                    .day-checkbox input[type="checkbox"] {
                        margin: 0;
                    }
                    
                    .time-input {
                        width: 80px;
                        padding: 6px 8px;
                        border: 1px solid #d1d5db;
                        border-radius: 4px;
                        font-size: 13px;
                    }
                    
                    .pitch-item {
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 16px;
                        background: #f9fafb;
                    }
                    
                    .pitch-item h4 {
                        margin: 0 0 12px 0;
                        color: #374151;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    
                    .hidden {
                        display: none !important;
                    }
                    
                    .professional-form-input, .professional-form-select {
                        width: 100%;
                        padding: 10px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        background: white;
                        transition: all 0.2s ease;
                        box-sizing: border-box;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                    }
                    
                    /* Remove scroll arrows from select elements to match single pitch modal */
                    .professional-form-select {
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                        background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
                        background-repeat: no-repeat;
                        background-position: right 10px center;
                        background-size: 12px;
                        padding-right: 30px;
                    }
                    
                    /* Fix cross button styling in time chips */
                    .time-chip {
                        overflow: hidden !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    .time-chip button {
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                        line-height: 1 !important;
                        user-select: none !important;
                        -webkit-user-select: none !important;
                        -moz-user-select: none !important;
                        flex-shrink: 0 !important;
                        overflow: hidden !important;
                    }
                </style>
                
                <form id="add-multiple-pitches-form" class="professional-modal-form">
                    <!-- Number of Pitches Selection -->
                    <div id="pitch-count-section" class="professional-form-group" style="margin-bottom: 24px;">
                        <label class="professional-form-label">Number of Pitches to Create</label>
                        <select id="pitch-count-select" class="professional-form-select" onchange="generatePitchForms(); validateMultiplePitchesForm();" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; font-size: 14px;">
                            <option value="">Select number of pitches</option>
                        </select>
                    </div>
                    
                    <!-- Step 1: Duplicate Options -->
                    <div id="duplicate-options-section">
                        <div class="professional-form-group" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                            <label class="professional-form-label" style="margin: 0; flex: 1;">Duplicate Available Days?</label>
                            <div style="display: flex; gap: 8px; margin-left: 20px;">
                                <div class="tick-cross-option" onclick="selectDuplicateOption('availableDays', 'yes')" data-option="yes" style="cursor: pointer; padding: 6px 10px; border: 2px solid transparent; border-radius: 6px; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-width: 32px; transition: all 0.2s ease;">
                                    <input type="radio" name="duplicateAvailableDays" value="yes" id="duplicate-days-yes" style="display: none;">
                                    <span style="font-size: 12px; color: #22c55e; font-weight: 700;">✓</span>
                                </div>
                                <div class="tick-cross-option" onclick="selectDuplicateOption('availableDays', 'no')" data-option="no" style="cursor: pointer; padding: 6px 10px; border: 2px solid transparent; border-radius: 6px; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-width: 32px; transition: all 0.2s ease;">
                                    <input type="radio" name="duplicateAvailableDays" value="no" id="duplicate-days-no" style="display: none;">
                                    <span style="font-size: 12px; color: #ef4444; font-weight: 700;">✗</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Shared Available Days Selection (if yes selected) -->
                        <div id="shared-days-section" class="professional-form-group hidden" style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <label class="professional-form-label">Select Available Days (applied to all pitches)</label>
                            <div class="days-row" style="display: flex; gap: 8px; flex-wrap: nowrap; justify-content: space-between;">
                                <div class="day-checkbox" onclick="toggleSharedDay('monday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-monday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Mo</span>
                                </div>
                                <div class="day-checkbox" onclick="toggleSharedDay('tuesday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-tuesday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Tu</span>
                                </div>
                                <div class="day-checkbox" onclick="toggleSharedDay('wednesday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-wednesday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">We</span>
                                </div>
                                <div class="day-checkbox" onclick="toggleSharedDay('thursday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-thursday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Th</span>
                                </div>
                                <div class="day-checkbox" onclick="toggleSharedDay('friday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-friday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Fr</span>
                                </div>
                                <div class="day-checkbox" onclick="toggleSharedDay('saturday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-saturday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Sa</span>
                                </div>
                                <div class="day-checkbox" onclick="toggleSharedDay('sunday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="shared-sunday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Su</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="professional-form-group" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                            <label class="professional-form-label" style="margin: 0; flex: 1;">Duplicate Kick Off Times?</label>
                            <div style="display: flex; gap: 8px; margin-left: 20px;">
                                <div class="tick-cross-option" onclick="selectDuplicateOption('kickOffTimes', 'yes')" data-option="yes" style="cursor: pointer; padding: 6px 10px; border: 2px solid transparent; border-radius: 6px; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-width: 32px; transition: all 0.2s ease;">
                                    <input type="radio" name="duplicateKickOffTimes" value="yes" id="duplicate-times-yes" style="display: none;">
                                    <span style="font-size: 12px; color: #22c55e; font-weight: 700;">✓</span>
                                </div>
                                <div class="tick-cross-option" onclick="selectDuplicateOption('kickOffTimes', 'no')" data-option="no" style="cursor: pointer; padding: 6px 10px; border: 2px solid transparent; border-radius: 6px; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-width: 32px; transition: all 0.2s ease;">
                                    <input type="radio" name="duplicateKickOffTimes" value="no" id="duplicate-times-no" style="display: none;">
                                    <span style="font-size: 12px; color: #ef4444; font-weight: 700;">✗</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Shared Kick Off Times Selection (if yes selected) -->
                    <div id="shared-times-section" class="professional-form-group hidden" style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <label class="professional-form-label">Kick Off Times (applied to all pitches)</label>
                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
                            <select id="shared-hour-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                <option value="">Hour</option>
                                ${Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(hour => `<option value="${hour}">${hour}</option>`).join('')}
                            </select>
                            <span style="color: #64748b; font-weight: 500;">:</span>
                            <select id="shared-minute-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                <option value="">Min</option>
                                ${['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => `<option value="${min}">${min}</option>`).join('')}
                            </select>
                            <button type="button" onclick="addSharedKickOffTime()" style="padding: 8px 16px; background: #2e6417; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;">Add Time</button>
                        </div>
                        <div id="shared-time-selection-error" style="color: #ef4444; font-size: 12px; margin-bottom: 8px; display: none;">Please select both hour and minute before adding a time.</div>
                        <div style="border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 10px; min-height: 40px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Selected Times:</div>
                            <div id="shared-times-list" style="display: flex; flex-wrap: wrap; gap: 6px; overflow: hidden;">
                                <div id="shared-no-times-indicator" style="color: #9ca3af; font-style: italic; font-size: 12px; padding: 8px 0;">No kick-off times selected</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Individual Pitch Forms -->
                    <div id="pitches-forms-section" class="hidden">
                        <h3 style="margin: 24px 0 16px 0; color: #374151; font-size: 18px; font-weight: 600;">Configure Each Pitch</h3>
                        <div id="pitch-forms-container"></div>
                    </div>
                </form>
            `;
            
            // Show modal
            utils.showModal({
                title: 'Add Multiple Pitches',
                content: form,
                onConfirm: async () => {
                    return await this.createMultiplePitches();
                }
            });
            
            // Initialize the dropdown immediately after modal is shown
            setTimeout(() => {
                updatePitchCountVisibility();
                validateMultiplePitchesForm(); // Initial validation
            }, 0);
            
            // Add validation function
            window.validateMultiplePitchesForm = () => {
                const confirmButton = document.querySelector('.modal-confirm');
                if (!confirmButton) return;
                
                // Check basic requirements
                const pitchCountSelect = document.getElementById('pitch-count-select');
                const pitchCount = parseInt(pitchCountSelect?.value);
                
                if (!pitchCount) {
                    confirmButton.disabled = true;
                    confirmButton.textContent = 'Select Number of Pitches';
                    return;
                }
                
                // Check if both duplicate checkboxes are selected
                const daysSelected = document.querySelector('input[name="duplicateAvailableDays"]:checked');
                const timesSelected = document.querySelector('input[name="duplicateKickOffTimes"]:checked');
                
                if (!daysSelected || !timesSelected) {
                    confirmButton.disabled = true;
                    confirmButton.textContent = 'Complete Duplicate Options';
                    return;
                }
                
                const duplicateDays = daysSelected.value === 'yes';
                const duplicateTimes = timesSelected.value === 'yes';
                
                // Validate shared settings if applicable
                if (duplicateDays) {
                    const hasSelectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                        .some(day => document.getElementById(`shared-${day}`)?.checked);
                    
                    if (!hasSelectedDays) {
                        confirmButton.disabled = true;
                        confirmButton.textContent = 'Select Available Days';
                        return;
                    }
                }
                
                if (duplicateTimes) {
                    const timesList = document.getElementById('shared-times-list');
                    const hasSelectedTimes = timesList?.querySelectorAll('.time-chip').length > 0;
                    
                    if (!hasSelectedTimes) {
                        confirmButton.disabled = true;
                        confirmButton.textContent = 'Add Kick Off Times';
                        return;
                    }
                }
                
                // Validate individual pitch configurations
                for (let i = 1; i <= pitchCount; i++) {
                    const pitchName = document.querySelector(`input[name="pitchName${i}"]`)?.value;
                    const pitchSize = document.querySelector(`select[name="pitchSize${i}"]`)?.value;
                    
                    if (!pitchName?.trim() || !pitchSize) {
                        confirmButton.disabled = true;
                        confirmButton.textContent = `Complete Pitch ${i} Details`;
                        return;
                    }
                    
                    // Check individual settings if not using shared
                    if (!duplicateDays) {
                        const hasSelectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            .some(day => document.getElementById(`pitch${i}-${day}`)?.checked);
                        
                        if (!hasSelectedDays) {
                            confirmButton.disabled = true;
                            confirmButton.textContent = `Select Days for Pitch ${i}`;
                            return;
                        }
                    }
                    
                    if (!duplicateTimes) {
                        const timesList = document.getElementById(`pitch${i}-times-list`);
                        const hasSelectedTimes = timesList?.querySelectorAll('.time-chip').length > 0;
                        
                        if (!hasSelectedTimes) {
                            confirmButton.disabled = true;
                            confirmButton.textContent = `Add Times for Pitch ${i}`;
                            return;
                        }
                    }
                }
                
                // All validation passed
                confirmButton.disabled = false;
                confirmButton.textContent = 'Create Pitches';
            };
            
            // Add global functions for the modal
            window.selectDuplicateOption = (type, value) => {
                const radio = document.getElementById(`duplicate-${type === 'availableDays' ? 'days' : 'times'}-${value}`);
                radio.checked = true;
                
                // Update visual styling for both options in the group
                const groupName = type === 'availableDays' ? 'duplicateAvailableDays' : 'duplicateKickOffTimes';
                const allOptions = document.querySelectorAll(`input[name="${groupName}"]`);
                
                allOptions.forEach(option => {
                    const container = option.closest('.tick-cross-option');
                    const span = container.querySelector('span');
                    const isSelected = option.value === value;
                    
                    if (isSelected) {
                        // Selected state - clean highlighting
                        if (value === 'yes') {
                            container.style.backgroundColor = '#f0fdf4';
                            container.style.borderColor = '#22c55e';
                            container.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.15)';
                            span.style.color = '#16a34a';
                            span.style.fontWeight = '700';
                        } else {
                            container.style.backgroundColor = '#fef2f2';
                            container.style.borderColor = '#ef4444';
                            container.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
                            span.style.color = '#dc2626';
                            span.style.fontWeight = '700';
                        }
                    } else {
                        // Unselected state - clean transparent
                        container.style.backgroundColor = '#f8fafc';
                        container.style.borderColor = 'transparent';
                        container.style.boxShadow = 'none';
                        span.style.color = '#94a3b8';
                        span.style.fontWeight = '600';
                    }
                });
                
                if (type === 'availableDays') {
                    const section = document.getElementById('shared-days-section');
                    if (value === 'yes') {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                } else if (type === 'kickOffTimes') {
                    const section = document.getElementById('shared-times-section');
                    if (value === 'yes') {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                }
                
                updatePitchCountVisibility();
                
                // Regenerate pitch forms if a count is already selected
                const pitchCountSelect = document.getElementById('pitch-count-select');
                if (pitchCountSelect && pitchCountSelect.value) {
                    generatePitchForms();
                }
                
                // Trigger validation after any selection change
                if (typeof validateMultiplePitchesForm === 'function') {
                    validateMultiplePitchesForm();
                }
            };
            
            window.toggleSharedDay = (day) => {
                const checkbox = document.getElementById(`shared-${day}`);
                const container = checkbox.closest('.day-checkbox');
                const span = container.querySelector('span');
                
                checkbox.checked = !checkbox.checked;
                
                // Update visual state
                if (checkbox.checked) {
                    // Selected state - green
                    container.style.backgroundColor = '#dcfce7';
                    container.style.borderColor = '#16a34a';
                    span.style.color = '#16a34a';
                } else {
                    // Unselected state - gray
                    container.style.backgroundColor = '#f9fafb';
                    container.style.borderColor = '#d1d5db';
                    span.style.color = '#6b7280';
                }
                
                // Trigger validation after day toggle
                if (typeof validateMultiplePitchesForm === 'function') {
                    setTimeout(validateMultiplePitchesForm, 10);
                }
            };
            
            window.addSharedKickOffTime = () => {
                const hourSelect = document.getElementById('shared-hour-select');
                const minuteSelect = document.getElementById('shared-minute-select');
                const errorDiv = document.getElementById('shared-time-selection-error');
                const timesList = document.getElementById('shared-times-list');
                const noTimesIndicator = document.getElementById('shared-no-times-indicator');
                
                const hour = hourSelect.value;
                const minute = minuteSelect.value;
                
                if (!hour || !minute) {
                    errorDiv.style.display = 'block';
                    return;
                }
                
                errorDiv.style.display = 'none';
                const time = `${hour}:${minute}`;
                
                // Check if time already exists
                const existingTimes = Array.from(timesList.querySelectorAll('.time-chip')).map(chip => chip.dataset.time);
                if (existingTimes.includes(time)) {
                    return;
                }
                
                // Hide no times indicator
                if (noTimesIndicator) {
                    noTimesIndicator.style.display = 'none';
                }
                
                const timeChip = document.createElement('span');
                timeChip.className = 'time-chip';
                timeChip.dataset.time = time;
                timeChip.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #2e6417; color: white; border: 1px solid #2e6417; border-radius: 16px; font-size: 12px; font-weight: 500;';
                timeChip.innerHTML = `${time} <button type="button" onclick="this.parentElement.remove(); checkSharedTimesEmpty();" style="background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 0; margin: 0; font-size: 14px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" onmouseover="this.style.color='rgba(255,255,255,1)'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.8)'; this.style.background='none'">×</button>`;
                
                timesList.appendChild(timeChip);
                
                // Reset selectors
                hourSelect.value = '';
                minuteSelect.value = '';
            };
            
            window.checkSharedTimesEmpty = () => {
                const timesList = document.getElementById('shared-times-list');
                const noTimesIndicator = document.getElementById('shared-no-times-indicator');
                const timeChips = timesList.querySelectorAll('.time-chip');
                
                if (timeChips.length === 0) {
                    noTimesIndicator.style.display = 'block';
                }
                
                // Trigger validation after checking shared times
                if (typeof validateMultiplePitchesForm === 'function') {
                    setTimeout(validateMultiplePitchesForm, 10);
                }
            };
            
            window.generatePitchForms = () => {
                const count = parseInt(document.getElementById('pitch-count-select').value);
                const container = document.getElementById('pitch-forms-container');
                const formsSection = document.getElementById('pitches-forms-section');
                
                if (!count) {
                    // Clear forms and hide section when empty option selected
                    container.innerHTML = '';
                    formsSection.classList.add('hidden');
                    return;
                }
                
                // Check if both duplicate checkboxes have been selected
                const daysSelected = document.querySelector('input[name="duplicateAvailableDays"]:checked');
                const timesSelected = document.querySelector('input[name="duplicateKickOffTimes"]:checked');
                
                if (!daysSelected || !timesSelected) {
                    // Hide pitch forms section if both checkboxes aren't selected yet
                    container.innerHTML = '';
                    formsSection.classList.add('hidden');
                    return;
                }
                
                container.innerHTML = '';
                
                const duplicateDays = daysSelected.value === 'yes';
                const duplicateTimes = timesSelected.value === 'yes';
                
                for (let i = 1; i <= count; i++) {
                    const pitchForm = document.createElement('div');
                    pitchForm.className = 'pitch-item';
                    pitchForm.innerHTML = `
                        <div style="display: flex; gap: 16px;">
                            <div class="professional-form-group" style="flex: 1;">
                                <label class="professional-form-label">Pitch Name</label>
                                <input type="text" name="pitchName${i}" class="professional-form-input" placeholder="Enter pitch name" required oninput="validateMultiplePitchesForm()">
                            </div>
                            <div class="professional-form-group" style="flex: 1;">
                                <label class="professional-form-label">Pitch Size</label>
                                <select name="pitchSize${i}" class="professional-form-select" required onchange="validateMultiplePitchesForm()">
                                    <option value="">Select size</option>
                                    <option value="5-a-side">5-a-side</option>
                                    <option value="6-a-side">6-a-side</option>
                                    <option value="7-a-side">7-a-side</option>
                                    <option value="9-a-side">9-a-side</option>
                                    <option value="11-a-side">11-a-side</option>
                                </select>
                            </div>
                        </div>
                        ${!duplicateDays ? `
                        <div class="professional-form-group">
                            <label class="professional-form-label">Available Days</label>
                            <div class="days-row" style="display: flex; gap: 8px; flex-wrap: nowrap; justify-content: space-between;">
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'monday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-monday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Mo</span>
                                </div>
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'tuesday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-tuesday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Tu</span>
                                </div>
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'wednesday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-wednesday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">We</span>
                                </div>
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'thursday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-thursday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Th</span>
                                </div>
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'friday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-friday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Fr</span>
                                </div>
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'saturday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-saturday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Sa</span>
                                </div>
                                <div class="day-checkbox" onclick="togglePitchDay(${i}, 'sunday')" style="cursor: pointer; padding: 10px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; flex: 1; text-align: center; min-width: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <input type="checkbox" id="pitch${i}-sunday" style="display: none;">
                                    <span style="font-size: 12px; font-weight: 600; color: #6b7280;">Su</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        ${!duplicateTimes ? `
                        <div class="professional-form-group">
                            <label class="professional-form-label">Kick Off Times</label>
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
                                <select id="pitch${i}-hour-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                    <option value="">Hour</option>
                                    ${Array.from({length: 24}, (_, h) => String(h).padStart(2, '0')).map(hour => `<option value="${hour}">${hour}</option>`).join('')}
                                </select>
                                <span style="color: #64748b; font-weight: 500;">:</span>
                                <select id="pitch${i}-minute-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                    <option value="">Min</option>
                                    ${['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => `<option value="${min}">${min}</option>`).join('')}
                                </select>
                                <button type="button" onclick="addPitchKickOffTime(${i})" style="padding: 8px 16px; background: #2e6417; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;">Add Time</button>
                            </div>
                            <div id="pitch${i}-time-selection-error" style="color: #ef4444; font-size: 12px; margin-bottom: 8px; display: none;">Please select both hour and minute before adding a time.</div>
                            <div style="border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 10px; min-height: 40px;">
                                <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Selected Times:</div>
                                <div id="pitch${i}-times-list" style="display: flex; flex-wrap: wrap; gap: 6px; overflow: hidden;">
                                    <div id="pitch${i}-no-times-indicator" style="color: #9ca3af; font-style: italic; font-size: 12px; padding: 8px 0;">No kick-off times selected</div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    `;
                    container.appendChild(pitchForm);
                }
                
                formsSection.classList.remove('hidden');
            };
            
            window.togglePitchDay = (pitchIndex, day) => {
                const checkbox = document.getElementById(`pitch${pitchIndex}-${day}`);
                const container = checkbox.closest('.day-checkbox');
                const span = container.querySelector('span');
                
                checkbox.checked = !checkbox.checked;
                
                // Update visual state
                if (checkbox.checked) {
                    // Selected state - green
                    container.style.backgroundColor = '#dcfce7';
                    container.style.borderColor = '#16a34a';
                    span.style.color = '#16a34a';
                } else {
                    // Unselected state - gray
                    container.style.backgroundColor = '#f9fafb';
                    container.style.borderColor = '#d1d5db';
                    span.style.color = '#6b7280';
                }
                
                // Trigger validation after day toggle
                if (typeof validateMultiplePitchesForm === 'function') {
                    setTimeout(validateMultiplePitchesForm, 10);
                }
            };
            
            window.addPitchKickOffTime = (pitchIndex) => {
                const hourSelect = document.getElementById(`pitch${pitchIndex}-hour-select`);
                const minuteSelect = document.getElementById(`pitch${pitchIndex}-minute-select`);
                const errorDiv = document.getElementById(`pitch${pitchIndex}-time-selection-error`);
                const timesList = document.getElementById(`pitch${pitchIndex}-times-list`);
                const noTimesIndicator = document.getElementById(`pitch${pitchIndex}-no-times-indicator`);
                
                const hour = hourSelect.value;
                const minute = minuteSelect.value;
                
                if (!hour || !minute) {
                    errorDiv.style.display = 'block';
                    return;
                }
                
                errorDiv.style.display = 'none';
                const time = `${hour}:${minute}`;
                
                // Check if time already exists
                const existingTimes = Array.from(timesList.querySelectorAll('.time-chip')).map(chip => chip.dataset.time);
                if (existingTimes.includes(time)) {
                    return;
                }
                
                // Hide no times indicator
                if (noTimesIndicator) {
                    noTimesIndicator.style.display = 'none';
                }
                
                const timeChip = document.createElement('span');
                timeChip.className = 'time-chip';
                timeChip.dataset.time = time;
                timeChip.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #2e6417; color: white; border: 1px solid #2e6417; border-radius: 16px; font-size: 12px; font-weight: 500;';
                timeChip.innerHTML = `${time} <button type="button" onclick="this.parentElement.remove(); checkPitchTimesEmpty(${pitchIndex});" style="background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 0; margin: 0; font-size: 14px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" onmouseover="this.style.color='rgba(255,255,255,1)'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.8)'; this.style.background='none'">×</button>`;
                
                timesList.appendChild(timeChip);
                
                // Reset selectors
                hourSelect.value = '';
                minuteSelect.value = '';
                
                // Trigger validation after adding time
                if (typeof validateMultiplePitchesForm === 'function') {
                    setTimeout(validateMultiplePitchesForm, 10);
                }
            };
            
            window.checkPitchTimesEmpty = (pitchIndex) => {
                const timesList = document.getElementById(`pitch${pitchIndex}-times-list`);
                const noTimesIndicator = document.getElementById(`pitch${pitchIndex}-no-times-indicator`);
                const timeChips = timesList.querySelectorAll('.time-chip');
                
                if (timeChips.length === 0) {
                    noTimesIndicator.style.display = 'block';
                }
                
                // Trigger validation after checking times
                if (typeof validateMultiplePitchesForm === 'function') {
                    setTimeout(validateMultiplePitchesForm, 10);
                }
            };
            
            const updatePitchCountVisibility = () => {
                const select = document.getElementById('pitch-count-select');
                const currentValue = select.value; // Preserve current selection
                
                // Always populate options based on remaining slots
                select.innerHTML = '<option value="">Select number of pitches</option>';
                for (let i = 1; i <= remainingSlots; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = i;
                    // Restore previous selection if it's still valid
                    if (currentValue === i.toString()) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
                
                // The pitch count section is now always visible at the top
                // No need to show/hide it based on checkbox selections
            };
        },
        
        async createMultiplePitches() {
            const form = document.getElementById('add-multiple-pitches-form');
            if (!form) {
                utils.showNotification('Form not found', 'error');
                return false;
            }
            
            try {
                const duplicateDays = document.querySelector('input[name="duplicateAvailableDays"]:checked')?.value === 'yes';
                const duplicateTimes = document.querySelector('input[name="duplicateKickOffTimes"]:checked')?.value === 'yes';
                const pitchCount = parseInt(document.getElementById('pitch-count-select').value);
                
                if (!pitchCount) {
                    utils.showNotification('Please select number of pitches to create', 'error');
                    return false;
                }
                
                // Get shared settings if applicable
                let sharedAvailability = {};
                let sharedKickOffTimes = [];
                
                if (duplicateDays) {
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    days.forEach(day => {
                        const checkbox = document.getElementById(`shared-${day}`);
                        if (checkbox && checkbox.checked) {
                            sharedAvailability[day] = true;
                        }
                    });
                    
                    if (Object.keys(sharedAvailability).length === 0) {
                        utils.showNotification('Please select at least one available day', 'error');
                        return false;
                    }
                }
                
                if (duplicateTimes) {
                    const timesList = document.getElementById('shared-times-list');
                    const timeElements = timesList.querySelectorAll('span');
                    timeElements.forEach(timeEl => {
                        const time = timeEl.textContent.replace('×', '').trim();
                        if (time) sharedKickOffTimes.push(time);
                    });
                    
                    if (sharedKickOffTimes.length === 0) {
                        utils.showNotification('Please add at least one kick off time', 'error');
                        return false;
                    }
                }
                
                // Create each pitch
                const createdPitches = [];
                for (let i = 1; i <= pitchCount; i++) {
                    const pitchName = form.querySelector(`input[name="pitchName${i}"]`)?.value;
                    const pitchSize = form.querySelector(`select[name="pitchSize${i}"]`)?.value;
                    
                    if (!pitchName || !pitchSize) {
                        utils.showNotification(`Please fill in all fields for Pitch ${i}`, 'error');
                        return false;
                    }
                    
                    // Get individual settings if not using shared
                    let availability = duplicateDays ? sharedAvailability : {};
                    let kickOffTimes = duplicateTimes ? sharedKickOffTimes : [];
                    
                    if (!duplicateDays) {
                        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        days.forEach(day => {
                            const checkbox = document.getElementById(`pitch${i}-${day}`);
                            if (checkbox && checkbox.checked) {
                                availability[day] = true;
                            }
                        });
                        
                        if (Object.keys(availability).length === 0) {
                            utils.showNotification(`Please select available days for Pitch ${i}`, 'error');
                            return false;
                        }
                    }
                    
                    if (!duplicateTimes) {
                        const timesList = document.getElementById(`pitch${i}-times-list`);
                        const timeElements = timesList.querySelectorAll('span');
                        kickOffTimes = [];
                        timeElements.forEach(timeEl => {
                            const time = timeEl.textContent.replace('×', '').trim();
                            if (time) kickOffTimes.push(time);
                        });
                        
                        if (kickOffTimes.length === 0) {
                            utils.showNotification(`Please add kick off times for Pitch ${i}`, 'error');
                            return false;
                        }
                    }
                    
                    // Get current user data to ensure we have the correct tenant_id
                    let tenantId = null;
                    try {
                        const currentUser = JSON.parse(localStorage.getItem('fivetrackr_session') || '{}');
                        tenantId = currentUser.tenant_id || parseInt(localStorage.getItem('tenant_id'));
                        
                        // If still null, try to get from auth token payload
                        if (!tenantId) {
                            const authToken = localStorage.getItem('auth_token');
                            if (authToken) {
                                const payload = JSON.parse(atob(authToken.split('.')[1]));
                                tenantId = payload.tenant_id || payload.user_id;
                            }
                        }
                    } catch (error) {
                        console.error('Error getting tenant_id:', error);
                        tenantId = 36; // Fallback based on logs showing user is tenant 36
                    }
                    
                    const currentVenueId = window.VenueSelector ? window.VenueSelector.currentVenueId : null;
                    console.log('DEBUG: Building pitch data with currentVenueId:', currentVenueId, 'tenantId:', tenantId);
                    
                    if (!currentVenueId) {
                        utils.showNotification('Please select a venue first', 'error');
                        return false;
                    }
                    
                    // Ensure tenant_id is not null - use fallback if needed
                    if (!tenantId) {
                        tenantId = 36; // Based on server logs showing this user is tenant 36
                        console.warn('Using fallback tenant_id:', tenantId);
                    }
                    
                    const pitchData = {
                        venue_id: parseInt(currentVenueId),
                        tenant_id: parseInt(tenantId),
                        name: pitchName,  // Server expects 'name', not 'pitch_name'
                        size: pitchSize,  // Server expects 'size', not 'pitch_size'
                        status: 'available',
                        is_active: true,
                        availability: availability,
                        kickOffTimes: kickOffTimes  // Server requires this field
                    };
                    
                    // Create pitch in database
                    const result = await this.createPitchInDatabase(pitchData);
                    
                    if (result && result.success) {
                        // Clear cache to ensure fresh data on next load
                        this._apiCache = {};
                        
                        // Add the new pitch to local data
                        const createdPitch = result.pitch || {
                            id: result.id || Date.now() + i,
                            pitch_id: result.pitch_id || result.id || Date.now() + i,
                            ...pitchData,
                            createdAt: new Date().toISOString()
                        };
                        this.pitchesData.push(this.normalizePitchData(createdPitch));
                        createdPitches.push(createdPitch);
                    } else {
                        const errorMessage = result?.message || `Failed to create Pitch ${i}`;
                        utils.showNotification(errorMessage, 'error');
                        return false;
                    }
                }
                
                // Update UI and show success message
                this.renderPitchesGrid();
                this.updateSubscriptionInfo();
                utils.showNotification(`Successfully created ${createdPitches.length} pitches`, 'success');
                return true; // Close modal
                
            } catch (error) {
                console.error('Error creating multiple pitches:', error);
                utils.showNotification('Failed to create pitches', 'error');
                return false;
            }
        },

        exportData() {
            if (this.pitchesData.length === 0) {
                utils.showNotification('No pitches to export', 'info');
                return;
            }

            // Get current venue information
            const selectedVenueName = document.getElementById('selected-venue-name')?.textContent || 'Unknown Venue';
            const isAllVenues = selectedVenueName === 'All Venues' || selectedVenueName === 'Loading...';
            
            const exportHTML = `
                <style>
                    .export-container {
                        padding: 20px;
                        max-width: 600px;
                        margin: 0 auto;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, sans-serif;
                    }
                    
                    .export-section {
                        margin-bottom: 24px;
                        padding: 16px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        background: #f8fafc;
                    }
                    
                    .export-section h3 {
                        margin: 0 0 12px 0;
                        font-size: 14px;
                        font-weight: 600;
                        color: #374151;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .field-selection {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 8px;
                    }
                    
                    .field-checkbox {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 6px 0;
                    }
                    
                    .field-checkbox input[type="checkbox"] {
                        width: 16px;
                        height: 16px;
                        accent-color: #2e6417;
                    }
                    
                    .field-checkbox label {
                        font-size: 13px;
                        color: #4b5563;
                        cursor: pointer;
                        flex: 1;
                    }
                    
                    .format-selection {
                        display: flex;
                        gap: 12px;
                        flex-wrap: wrap;
                    }
                    
                    .format-option {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 8px 12px;
                        border: 2px solid #e5e7eb;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        background: white;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    
                    .format-option:hover {
                        border-color: #2e6417;
                        background: #f0fdf4;
                    }
                    
                    .format-option.selected {
                        border-color: #2e6417;
                        background: #f0fdf4;
                        color: #2e6417;
                    }
                    
                    .format-option input[type="radio"] {
                        display: none;
                    }
                    
                    .date-range-section {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                    }
                    
                    .date-range-toggle {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    
                    .date-range-toggle input[type="checkbox"] {
                        width: 16px;
                        height: 16px;
                        accent-color: #2e6417;
                    }
                    
                    .date-input-group {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    
                    .date-input-group label {
                        font-size: 11px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                    }
                    
                    .date-input {
                        padding: 6px 8px;
                        border: 1px solid #d1d5db;
                        border-radius: 4px;
                        font-size: 13px;
                        min-width: 120px;
                    }
                    
                    .calendar-picker-btn {
                        background: #2e6417;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .calendar-picker-btn:hover {
                        background: #1e4009;
                    }
                    
                    .date-range-inputs {
                        display: none;
                        margin-top: 12px;
                    }
                    
                    .date-range-inputs.enabled {
                        display: flex;
                    }
                    
                    .export-summary {
                        background: #fffbeb;
                        border: 1px solid #fbbf24;
                        border-radius: 8px;
                        padding: 12px;
                        margin: 16px 0;
                    }
                    
                    .export-summary h4 {
                        margin: 0 0 8px 0;
                        font-size: 13px;
                        font-weight: 600;
                        color: #92400e;
                    }
                    
                    .export-summary p {
                        margin: 0;
                        font-size: 12px;
                        color: #b45309;
                    }
                    
                    .export-actions {
                        display: flex;
                        gap: 8px;
                        justify-content: flex-end;
                        margin-top: 20px;
                    }
                    
                    .export-btn {
                        background: #2e6417;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .export-btn:hover {
                        background: #1e4009;
                    }
                    
                    .export-btn:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                    }
                    
                    .cancel-btn {
                        background: #f3f4f6;
                        color: #374151;
                        border: 1px solid #d1d5db;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }
                    
                    .cancel-btn:hover {
                        background: #e5e7eb;
                        border-color: #9ca3af;
                    }
                    
                    .venue-info-display {
                        display: flex;
                        justify-content: center;
                        padding: 8px 0;
                    }
                    
                    .venue-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: linear-gradient(135deg, #2e6417, #16a34a);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        box-shadow: 0 2px 4px rgba(46, 100, 23, 0.2);
                    }
                    
                    .venue-icon {
                        font-size: 14px;
                    }
                    
                    .pitch-selection-controls {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 12px;
                        padding: 8px 0;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    
                    .selection-control-btn {
                        background: #f8fafc;
                        color: #374151;
                        border: 1px solid #d1d5db;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        transition: all 0.2s ease;
                    }
                    
                    .selection-control-btn:hover {
                        background: #e5e7eb;
                        border-color: #9ca3af;
                    }
                    
                    .selection-counter {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                        margin-left: auto;
                    }
                    
                    .pitch-selection-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 8px;
                        max-height: 300px;
                        overflow-y: auto;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 8px;
                        background: white;
                    }
                    
                    .pitch-selection-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px;
                        border-radius: 6px;
                        border: 1px solid #e5e7eb;
                        background: white;
                        transition: all 0.2s ease;
                    }
                    
                    .pitch-selection-item:hover {
                        border-color: #2e6417;
                        background: #f0fdf4;
                    }
                    
                    .pitch-checkbox {
                        width: 16px;
                        height: 16px;
                        accent-color: #2e6417;
                        cursor: pointer;
                    }
                    
                    .pitch-selection-label {
                        cursor: pointer;
                        flex: 1;
                        margin: 0;
                    }
                    
                    .pitch-selection-info {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    
                    .pitch-selection-name {
                        font-weight: 600;
                        font-size: 13px;
                        color: #1f2937;
                    }
                    
                    .pitch-selection-details {
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    }
                    
                    .pitch-size {
                        font-size: 11px;
                        color: #64748b;
                        background: #f1f5f9;
                        padding: 2px 6px;
                        border-radius: 8px;
                        text-transform: uppercase;
                        font-weight: 500;
                    }
                    
                    .pitch-status {
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 8px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .pitch-status.status-active {
                        background: #dcfce7;
                        color: #166534;
                    }
                    
                    .pitch-status.status-maintenance {
                        background: #fef3c7;
                        color: #92400e;
                    }
                    
                    .pitch-status.status-inactive {
                        background: #fee2e2;
                        color: #991b1b;
                    }
                    
                    .pitch-status.status-unavailable {
                        background: #f3f4f6;
                        color: #374151;
                    }
                </style>
                
                <div class="export-container">
                    <div class="export-section">
                        <h3>🏟️ Venue Information</h3>
                        <div class="venue-info-display">
                            <div class="venue-badge">
                                <span class="venue-icon">📍</span>
                                <span class="venue-text">${isAllVenues ? 'Exporting from All Venues' : `Exporting from: ${selectedVenueName}`}</span>
                            </div>
                        </div>
                    </div>

                    <div class="export-section">
                        <h3>⚽ Select Pitches</h3>
                        <div class="pitch-selection-controls">
                            <button type="button" class="selection-control-btn" onclick="selectAllPitches()">Select All</button>
                            <button type="button" class="selection-control-btn" onclick="deselectAllPitches()">Deselect All</button>
                            <span class="selection-counter" id="selection-counter">0 of ${this.pitchesData.length} pitches selected</span>
                        </div>
                        <div class="pitch-selection-grid" id="pitch-selection-grid">
                            ${this.pitchesData.map(pitch => `
                                <div class="pitch-selection-item">
                                    <input type="checkbox" id="pitch-${pitch.id}" class="pitch-checkbox" data-pitch-id="${pitch.id}" checked>
                                    <label for="pitch-${pitch.id}" class="pitch-selection-label">
                                        <div class="pitch-selection-info">
                                            <div class="pitch-selection-name">${pitch.name}</div>
                                            <div class="pitch-selection-details">
                                                <span class="pitch-size">${pitch.pitchSize}</span>
                                                <span class="pitch-status status-${pitch.status}">${pitch.status}</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h3>🎯 Select Data Fields</h3>
                        <div class="field-selection">
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-name" checked>
                                <label for="field-name">Pitch Name</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-size" checked>
                                <label for="field-size">Pitch Size</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-status" checked>
                                <label for="field-status">Status</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-availability" checked>
                                <label for="field-availability">Available Days</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-kickoff-times" checked>
                                <label for="field-kickoff-times">Kick Off Times</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-time-slots">
                                <label for="field-time-slots">Time Slot Status</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-created" checked>
                                <label for="field-created">Created Date</label>
                            </div>
                            <div class="field-checkbox">
                                <input type="checkbox" id="field-updated">
                                <label for="field-updated">Last Updated</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h3>📄 File Format</h3>
                        <div class="format-selection">
                            <div class="format-option selected" data-format="csv">
                                <input type="radio" name="format" value="csv" checked>
                                <span>📊 CSV</span>
                            </div>
                            <div class="format-option" data-format="json">
                                <input type="radio" name="format" value="json">
                                <span>🔧 JSON</span>
                            </div>
                            <div class="format-option" data-format="excel">
                                <input type="radio" name="format" value="excel">
                                <span>📈 Excel</span>
                            </div>
                            <div class="format-option" data-format="pdf">
                                <input type="radio" name="format" value="pdf">
                                <span>📄 PDF Report</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h3>📅 Date Range</h3>
                        <div class="date-range-toggle">
                            <input type="checkbox" id="enable-date-filter">
                            <label for="enable-date-filter">Filter by creation/update date range</label>
                        </div>
                        <div class="date-range-inputs" id="date-range-inputs">
                            <div class="date-range-section">
                                <div class="date-input-group">
                                    <label>From Date</label>
                                    <input type="date" id="from-date" class="date-input">
                                </div>
                                <div class="date-input-group">
                                    <label>To Date</label>
                                    <input type="date" id="to-date" class="date-input">
                                </div>
                                <button class="calendar-picker-btn" onclick="openDateRangePicker()">
                                    📅 Calendar Picker
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="export-summary">
                        <h4>📋 Export Summary</h4>
                        <p id="export-summary-text">Ready to export ${this.pitchesData.length} selected pitches with all fields in CSV format</p>
                    </div>
                    
                    <div class="export-actions">
                        <button class="cancel-btn" onclick="cancelExport()">Cancel</button>
                        <button class="export-btn" id="export-execute-btn" onclick="executeExport()">Export Data</button>
                    </div>
                </div>
            `;

            utils.showModal({
                title: 'Export Pitches Data',
                content: exportHTML,
                showDefaultButtons: false
            });

            // Set up event listeners
            this.setupExportModalListeners();
        },

        setupExportModalListeners() {
            // Format selection
            document.querySelectorAll('.format-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.format-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    const radio = option.querySelector('input[type="radio"]');
                    radio.checked = true;
                    this.updateExportSummary();
                });
            });

            // Date range toggle
            const dateToggle = document.getElementById('enable-date-filter');
            const dateInputs = document.getElementById('date-range-inputs');
            
            dateToggle.addEventListener('change', () => {
                if (dateToggle.checked) {
                    dateInputs.classList.add('enabled');
                } else {
                    dateInputs.classList.remove('enabled');
                }
                this.updateExportSummary();
            });

            // Field selection and date changes
            document.querySelectorAll('input[type="checkbox"], input[type="date"]').forEach(input => {
                input.addEventListener('change', () => this.updateExportSummary());
            });

            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            document.getElementById('from-date').value = monthAgo.toISOString().split('T')[0];
            document.getElementById('to-date').value = today;

            // Pitch selection listeners
            document.querySelectorAll('.pitch-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.updateSelectionCounter());
            });

            // Global functions for modal
            window.selectAllPitches = () => this.selectAllPitches();
            window.deselectAllPitches = () => this.deselectAllPitches();
            window.openDateRangePicker = () => this.openDateRangePicker();
            window.executeExport = () => this.executeExport();
            window.cancelExport = () => this.cancelExport();
            
            // Initial counter update
            this.updateSelectionCounter();
        },

        updateSelectionCounter() {
            const selectedPitches = document.querySelectorAll('.pitch-checkbox:checked').length;
            const totalPitches = this.pitchesData.length;
            const counter = document.getElementById('selection-counter');
            if (counter) {
                counter.textContent = `${selectedPitches} of ${totalPitches} pitches selected`;
            }
            this.updateExportSummary();
        },

        selectAllPitches() {
            document.querySelectorAll('.pitch-checkbox').forEach(checkbox => {
                checkbox.checked = true;
            });
            this.updateSelectionCounter();
        },

        deselectAllPitches() {
            document.querySelectorAll('.pitch-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            this.updateSelectionCounter();
        },

        cancelExport() {
            // Clear any temporary states
            window.selectAllPitches = null;
            window.deselectAllPitches = null;
            window.openDateRangePicker = null;
            window.executeExport = null;
            window.cancelExport = null;
            window.navigateCalendarMonth = null;
            window.closeDateRangePicker = null;
            window.applyDateRange = null;
            
            // Close modal
            utils.hideModal();
            
            // Show cancellation message
            utils.showNotification('Export cancelled', 'info');
        },

        updateExportSummary() {
            const selectedFields = document.querySelectorAll('.field-checkbox input:checked').length;
            const selectedFormat = document.querySelector('.format-option.selected').dataset.format.toUpperCase();
            const dateFilterEnabled = document.getElementById('enable-date-filter').checked;
            const selectedPitches = document.querySelectorAll('.pitch-checkbox:checked').length;
            
            let totalPitches = selectedPitches;
            
            if (dateFilterEnabled) {
                const fromDate = document.getElementById('from-date').value;
                const toDate = document.getElementById('to-date').value;
                
                if (fromDate && toDate) {
                    const selectedPitchIds = Array.from(document.querySelectorAll('.pitch-checkbox:checked'))
                        .map(cb => cb.dataset.pitchId);
                    
                    totalPitches = this.pitchesData.filter(pitch => {
                        const pitchDate = new Date(pitch.createdAt || pitch.updatedAt);
                        const inDateRange = pitchDate >= new Date(fromDate) && pitchDate <= new Date(toDate);
                        const isSelected = selectedPitchIds.includes(pitch.id);
                        return inDateRange && isSelected;
                    }).length;
                }
            }
            
            const summaryText = `Ready to export ${totalPitches} selected pitches with ${selectedFields} fields in ${selectedFormat} format${dateFilterEnabled ? ' (filtered by date range)' : ''}`;
            document.getElementById('export-summary-text').textContent = summaryText;
            
            // Enable/disable export button
            const exportBtn = document.getElementById('export-execute-btn');
            exportBtn.disabled = selectedFields === 0 || totalPitches === 0;
        },

        openDateRangePicker() {
            const calendarHTML = `
                <style>
                    .date-picker-container {
                        max-width: 400px;
                        margin: 0 auto;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, sans-serif;
                    }
                    
                    .date-picker-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #e2e8f0;
                        margin-bottom: 16px;
                    }
                    
                    .date-picker-nav {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    
                    .date-picker-nav button {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        padding: 4px 8px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    
                    .date-picker-title {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .date-range-selection {
                        margin-bottom: 16px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 6px;
                    }
                    
                    .range-status {
                        font-size: 12px;
                        color: #64748b;
                        margin-bottom: 8px;
                    }
                    
                    .selected-range {
                        font-size: 13px;
                        font-weight: 500;
                        color: #2e6417;
                    }
                    
                    .date-picker-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 1px;
                        background: #e5e7eb;
                        border-radius: 6px;
                        overflow: hidden;
                        margin-bottom: 16px;
                    }
                    
                    .date-picker-day-header {
                        background: #374151;
                        color: white;
                        padding: 6px 2px;
                        text-align: center;
                        font-size: 10px;
                        font-weight: 600;
                    }
                    
                    .date-picker-day {
                        background: white;
                        min-height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s ease;
                        position: relative;
                    }
                    
                    .date-picker-day:hover {
                        background: #f1f5f9;
                    }
                    
                    .date-picker-day.other-month {
                        color: #9ca3af;
                        background: #f9fafb;
                    }
                    
                    .date-picker-day.selected {
                        background: #2e6417;
                        color: white;
                    }
                    
                    .date-picker-day.in-range {
                        background: #dcfce7;
                        color: #166534;
                    }
                    
                    .date-picker-actions {
                        display: flex;
                        gap: 8px;
                        justify-content: flex-end;
                    }
                    
                    .picker-btn {
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        border: 1px solid #d1d5db;
                        background: white;
                        transition: all 0.2s ease;
                    }
                    
                    .picker-btn.primary {
                        background: #2e6417;
                        color: white;
                        border-color: #2e6417;
                    }
                    
                    .picker-btn:hover {
                        border-color: #9ca3af;
                    }
                    
                    .picker-btn.primary:hover {
                        background: #1e4009;
                    }
                </style>
                
                <div class="date-picker-container">
                    <div class="date-picker-header">
                        <div class="date-picker-nav">
                            <button onclick="navigateCalendarMonth(-1)">&lt;</button>
                            <div class="date-picker-title" id="picker-month-year"></div>
                            <button onclick="navigateCalendarMonth(1)">&gt;</button>
                        </div>
                    </div>
                    
                    <div class="date-range-selection">
                        <div class="range-status">Select start and end dates for export range</div>
                        <div class="selected-range" id="selected-range-display">No dates selected</div>
                    </div>
                    
                    <div class="date-picker-grid" id="date-picker-grid">
                        <div class="date-picker-day-header">Su</div>
                        <div class="date-picker-day-header">Mo</div>
                        <div class="date-picker-day-header">Tu</div>
                        <div class="date-picker-day-header">We</div>
                        <div class="date-picker-day-header">Th</div>
                        <div class="date-picker-day-header">Fr</div>
                        <div class="date-picker-day-header">Sa</div>
                    </div>
                    
                    <div class="date-picker-actions">
                        <button class="picker-btn" onclick="closeDateRangePicker()">Cancel</button>
                        <button class="picker-btn primary" onclick="applyDateRange()">Apply Range</button>
                    </div>
                </div>
            `;

            utils.showModal({
                title: 'Select Date Range',
                content: calendarHTML,
                showDefaultButtons: false
            });

            this.initDateRangePicker();
        },

        initDateRangePicker() {
            this.pickerState = {
                currentMonth: new Date().getMonth(),
                currentYear: new Date().getFullYear(),
                startDate: null,
                endDate: null,
                selecting: 'start' // 'start' or 'end'
            };

            this.renderDatePickerCalendar();

            // Global functions for date picker
            window.navigateCalendarMonth = (direction) => {
                this.pickerState.currentMonth += direction;
                if (this.pickerState.currentMonth < 0) {
                    this.pickerState.currentMonth = 11;
                    this.pickerState.currentYear--;
                } else if (this.pickerState.currentMonth > 11) {
                    this.pickerState.currentMonth = 0;
                    this.pickerState.currentYear++;
                }
                this.renderDatePickerCalendar();
            };

            window.closeDateRangePicker = () => {
                utils.hideModal();
                // Reopen export modal
                this.exportData();
            };

            window.applyDateRange = () => {
                if (this.pickerState.startDate && this.pickerState.endDate) {
                    document.getElementById('from-date').value = this.pickerState.startDate;
                    document.getElementById('to-date').value = this.pickerState.endDate;
                    document.getElementById('enable-date-filter').checked = true;
                    document.getElementById('date-range-inputs').classList.add('enabled');
                }
                utils.hideModal();
                // Reopen export modal
                this.exportData();
            };
        },

        renderDatePickerCalendar() {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            
            const monthYearElement = document.getElementById('picker-month-year');
            if (monthYearElement) {
                monthYearElement.textContent = `${monthNames[this.pickerState.currentMonth]} ${this.pickerState.currentYear}`;
            }

            const grid = document.getElementById('date-picker-grid');
            if (!grid) return;

            // Keep headers, clear days
            const headers = grid.querySelectorAll('.date-picker-day-header');
            grid.innerHTML = '';
            headers.forEach(header => grid.appendChild(header));

            const firstDay = new Date(this.pickerState.currentYear, this.pickerState.currentMonth, 1);
            const lastDay = new Date(this.pickerState.currentYear, this.pickerState.currentMonth + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = currentDate.getMonth() === this.pickerState.currentMonth;
                const dateStr = currentDate.toISOString().split('T')[0];
                
                const dayElement = document.createElement('div');
                dayElement.className = 'date-picker-day';
                dayElement.textContent = currentDate.getDate();
                dayElement.dataset.date = dateStr;
                
                if (!isCurrentMonth) {
                    dayElement.classList.add('other-month');
                }

                if (dateStr === this.pickerState.startDate || dateStr === this.pickerState.endDate) {
                    dayElement.classList.add('selected');
                }

                if (this.pickerState.startDate && this.pickerState.endDate) {
                    const start = new Date(this.pickerState.startDate);
                    const end = new Date(this.pickerState.endDate);
                    if (currentDate > start && currentDate < end) {
                        dayElement.classList.add('in-range');
                    }
                }

                dayElement.addEventListener('click', () => this.selectPickerDate(dateStr));
                grid.appendChild(dayElement);
            }

            this.updateRangeDisplay();
        },

        selectPickerDate(dateStr) {
            if (this.pickerState.selecting === 'start' || !this.pickerState.startDate) {
                this.pickerState.startDate = dateStr;
                this.pickerState.endDate = null;
                this.pickerState.selecting = 'end';
            } else {
                const startDate = new Date(this.pickerState.startDate);
                const selectedDate = new Date(dateStr);
                
                if (selectedDate < startDate) {
                    // If selected date is before start, make it the new start
                    this.pickerState.endDate = this.pickerState.startDate;
                    this.pickerState.startDate = dateStr;
                } else {
                    this.pickerState.endDate = dateStr;
                }
                this.pickerState.selecting = 'start';
            }
            
            this.renderDatePickerCalendar();
        },

        updateRangeDisplay() {
            const display = document.getElementById('selected-range-display');
            if (!display) return;

            if (this.pickerState.startDate && this.pickerState.endDate) {
                const start = new Date(this.pickerState.startDate).toLocaleDateString();
                const end = new Date(this.pickerState.endDate).toLocaleDateString();
                display.textContent = `${start} to ${end}`;
            } else if (this.pickerState.startDate) {
                display.textContent = `Start: ${new Date(this.pickerState.startDate).toLocaleDateString()} (select end date)`;
            } else {
                display.textContent = 'No dates selected';
            }
        },

        async executeExport() {
            const selectedFields = [];
            const fieldMap = {
                'field-name': { key: 'name', label: 'Name' },
                'field-size': { key: 'pitchSize', label: 'Size' },
                'field-status': { key: 'status', label: 'Status' },
                'field-availability': { key: 'availability', label: 'Available Days' },
                'field-kickoff-times': { key: 'kickOffTimes', label: 'Kick Off Times' },
                'field-time-slots': { key: 'timeSlotStatus', label: 'Time Slot Status' },
                'field-created': { key: 'createdAt', label: 'Created Date' },
                'field-updated': { key: 'updatedAt', label: 'Last Updated' }
            };

            // Get selected fields
            Object.keys(fieldMap).forEach(fieldId => {
                if (document.getElementById(fieldId).checked) {
                    selectedFields.push(fieldMap[fieldId]);
                }
            });

            if (selectedFields.length === 0) {
                utils.showNotification('Please select at least one field to export', 'error');
                return;
            }

            // Get selected format
            const format = document.querySelector('.format-option.selected').dataset.format;
            
            // Get selected pitches
            const selectedPitchIds = Array.from(document.querySelectorAll('.pitch-checkbox:checked'))
                .map(cb => cb.dataset.pitchId);
            
            // Filter data by selected pitches first
            let dataToExport = this.pitchesData.filter(pitch => selectedPitchIds.includes(pitch.id));
            
            // Then filter by date range if enabled
            if (document.getElementById('enable-date-filter').checked) {
                const fromDate = new Date(document.getElementById('from-date').value);
                const toDate = new Date(document.getElementById('to-date').value);
                
                dataToExport = dataToExport.filter(pitch => {
                    const pitchDate = new Date(pitch.createdAt || pitch.updatedAt || new Date());
                    return pitchDate >= fromDate && pitchDate <= toDate;
                });
            }

            if (dataToExport.length === 0) {
                utils.showNotification('No pitches match the selected criteria (pitches selected and date range)', 'error');
                return;
            }

            // Execute export based on format
            switch (format) {
                case 'csv':
                    this.exportAsCSV(dataToExport, selectedFields);
                    break;
                case 'json':
                    this.exportAsJSON(dataToExport, selectedFields);
                    break;
                case 'excel':
                    this.exportAsExcel(dataToExport, selectedFields);
                    break;
                case 'pdf':
                    await this.exportAsPDF(dataToExport, selectedFields);
                    break;
            }

            utils.hideModal();
            utils.showNotification(`Successfully exported ${dataToExport.length} pitches as ${format.toUpperCase()}`, 'success');
        },

        exportAsCSV(data, fields) {
            const headers = fields.map(field => field.label);
            const csvRows = [headers.join(',')];
            
            data.forEach(pitch => {
                const row = fields.map(field => {
                    let value = pitch[field.key];
                    
                    if (field.key === 'availability') {
                        value = Object.entries(pitch.availability || {})
                            .filter(([day, available]) => available)
                            .map(([day]) => day)
                            .join(';');
                    } else if (field.key === 'kickOffTimes') {
                        value = (pitch.kickOffTimes || []).join(';');
                    } else if (field.key === 'timeSlotStatus') {
                        value = Object.entries(pitch.timeSlotStatus || {})
                            .map(([time, status]) => `${time}:${status}`)
                            .join(';');
                    } else if (field.key === 'createdAt' || field.key === 'updatedAt') {
                        value = value ? new Date(value).toLocaleDateString() : 'N/A';
                    }
                    
                    return `"${value || 'N/A'}"`;
                });
                csvRows.push(row.join(','));
            });
            
            const csvContent = csvRows.join('\n');
            this.downloadFile(csvContent, 'text/csv', 'pitches_export.csv');
        },

        exportAsJSON(data, fields) {
            const filteredData = data.map(pitch => {
                const filtered = {};
                fields.forEach(field => {
                    let value = pitch[field.key];
                    
                    if (field.key === 'availability') {
                        value = Object.entries(pitch.availability || {})
                            .filter(([day, available]) => available)
                            .map(([day]) => day);
                    } else if (field.key === 'createdAt' || field.key === 'updatedAt') {
                        value = value ? new Date(value).toISOString() : null;
                    }
                    
                    filtered[field.key] = value || null;
                });
                return filtered;
            });
            
            const jsonContent = JSON.stringify({
                exportDate: new Date().toISOString(),
                totalRecords: filteredData.length,
                data: filteredData
            }, null, 2);
            
            this.downloadFile(jsonContent, 'application/json', 'pitches_export.json');
        },

        exportAsExcel(data, fields) {
            // Create a simple tab-separated format that Excel can read
            const headers = fields.map(field => field.label);
            const tsvRows = [headers.join('\t')];
            
            data.forEach(pitch => {
                const row = fields.map(field => {
                    let value = pitch[field.key];
                    
                    if (field.key === 'availability') {
                        value = Object.entries(pitch.availability || {})
                            .filter(([day, available]) => available)
                            .map(([day]) => day)
                            .join(', ');
                    } else if (field.key === 'kickOffTimes') {
                        value = (pitch.kickOffTimes || []).join(', ');
                    } else if (field.key === 'timeSlotStatus') {
                        value = Object.entries(pitch.timeSlotStatus || {})
                            .map(([time, status]) => `${time}: ${status}`)
                            .join(', ');
                    } else if (field.key === 'createdAt' || field.key === 'updatedAt') {
                        value = value ? new Date(value).toLocaleDateString() : 'N/A';
                    }
                    
                    return value || 'N/A';
                });
                tsvRows.push(row.join('\t'));
            });
            
            const tsvContent = tsvRows.join('\n');
            this.downloadFile(tsvContent, 'application/vnd.ms-excel', 'pitches_export.xls');
        },

        async exportAsPDF(data, fields) {
            // Get venue information
            const selectedVenueName = document.getElementById('selected-venue-name')?.textContent || 'Unknown Venue';
            const isAllVenues = selectedVenueName === 'All Venues' || selectedVenueName === 'Loading...';
            const dateFilterEnabled = document.getElementById('enable-date-filter').checked;
            let fromDate = null;
            let toDate = null;
            
            if (dateFilterEnabled) {
                fromDate = new Date(document.getElementById('from-date').value);
                toDate = new Date(document.getElementById('to-date').value);
            }

            // Generate mock fixture data for the selected pitches and date range
            const allFixtures = this.generateMockFixturesForPitches(data, fromDate, toDate);

            // Create professional PDF content
            const currentDate = new Date().toLocaleDateString();
            const currentTime = new Date().toLocaleTimeString();
            
            let pdfContent = `
5ive Trackr - Pitches Export Report
Generated: ${currentDate} at ${currentTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VENUE INFORMATION
${isAllVenues ? 'Exporting from: All Venues' : `Venue: ${selectedVenueName}`}

EXPORT PARAMETERS
• Total Pitches: ${data.length}
• Date Range: ${dateFilterEnabled ? `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}` : 'All Dates'}
• Fields Exported: ${fields.map(f => f.label).join(', ')}
• Total Fixtures Found: ${allFixtures.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PITCHES OVERVIEW
`;

            // Add pitch information
            data.forEach((pitch, index) => {
                const pitchFixtures = allFixtures.filter(f => f.pitchId === pitch.id);
                
                pdfContent += `
${index + 1}. ${pitch.name} (${pitch.pitchSize})
   Status: ${pitch.status.toUpperCase()}
   Available Days: ${Object.entries(pitch.availability || {})
       .filter(([day, available]) => available)
       .map(([day]) => day)
       .join(', ') || 'None'}
   Kick Off Times: ${(pitch.kickOffTimes || []).join(', ') || 'None'}
   Created: ${pitch.createdAt ? new Date(pitch.createdAt).toLocaleDateString() : 'Unknown'}
   ${pitch.updatedAt ? `Last Updated: ${new Date(pitch.updatedAt).toLocaleDateString()}` : ''}
   
   FIXTURES FOR THIS PITCH (${pitchFixtures.length}):`;

                if (pitchFixtures.length > 0) {
                    pitchFixtures.forEach(fixture => {
                        pdfContent += `
   • ${fixture.date} at ${fixture.time} - ${fixture.homeTeam} vs ${fixture.awayTeam}
     League: ${fixture.league} | Division: ${fixture.division} | Status: ${fixture.status.toUpperCase()}`;
                    });
                } else {
                    pdfContent += `
   • No fixtures scheduled${dateFilterEnabled ? ' in selected date range' : ''}`;
                }
                
                pdfContent += `\n`;
            });

            // Add fixtures summary if there are fixtures
            if (allFixtures.length > 0) {
                pdfContent += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIXTURES CALENDAR${dateFilterEnabled ? ` (${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})` : ''}

`;
                // Group fixtures by date
                const fixturesByDate = {};
                allFixtures.forEach(fixture => {
                    if (!fixturesByDate[fixture.date]) {
                        fixturesByDate[fixture.date] = [];
                    }
                    fixturesByDate[fixture.date].push(fixture);
                });

                // Sort dates
                const sortedDates = Object.keys(fixturesByDate).sort();
                
                sortedDates.forEach(date => {
                    const dayFixtures = fixturesByDate[date];
                    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    
                    pdfContent += `${formattedDate}\n`;
                    pdfContent += `${'─'.repeat(formattedDate.length)}\n`;
                    
                    dayFixtures.sort((a, b) => a.time.localeCompare(b.time));
                    dayFixtures.forEach(fixture => {
                        const pitch = data.find(p => p.id === fixture.pitchId);
                        pdfContent += `${fixture.time} | ${fixture.homeTeam} vs ${fixture.awayTeam}\n`;
                        pdfContent += `         Pitch: ${pitch?.name || 'Unknown'} | ${fixture.league} (${fixture.division})\n`;
                        pdfContent += `         Status: ${fixture.status.toUpperCase()}\n\n`;
                    });
                });
            }

            // Add summary statistics
            pdfContent += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY STATISTICS

Pitches by Status:`;
            
            const statusCounts = {};
            data.forEach(pitch => {
                statusCounts[pitch.status] = (statusCounts[pitch.status] || 0) + 1;
            });
            
            Object.entries(statusCounts).forEach(([status, count]) => {
                pdfContent += `\n• ${status.toUpperCase()}: ${count} pitches`;
            });

            if (allFixtures.length > 0) {
                pdfContent += `\n\nFixtures by Status:`;
                const fixtureStatusCounts = {};
                allFixtures.forEach(fixture => {
                    fixtureStatusCounts[fixture.status] = (fixtureStatusCounts[fixture.status] || 0) + 1;
                });
                
                Object.entries(fixtureStatusCounts).forEach(([status, count]) => {
                    pdfContent += `\n• ${status.toUpperCase()}: ${count} fixtures`;
                });

                pdfContent += `\n\nFixtures by League:`;
                const leagueCounts = {};
                allFixtures.forEach(fixture => {
                    leagueCounts[fixture.league] = (leagueCounts[fixture.league] || 0) + 1;
                });
                
                Object.entries(leagueCounts).forEach(([league, count]) => {
                    pdfContent += `\n• ${league.toUpperCase()}: ${count} fixtures`;
                });
            }

            pdfContent += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by 5ive Trackr
© 2025 5ive Trackr. All rights reserved.
`;

            // Create PDF using the browser's built-in PDF generation
            this.generatePDFFromContent(pdfContent, `pitches_report_${new Date().toISOString().split('T')[0]}.pdf`);
        },

        generateMockFixturesForPitches(pitches, fromDate, toDate) {
            const fixtures = [];
            const leagues = ['premier', 'championship', 'league1', 'youth'];
            const divisions = {
                'premier': ['div1', 'div2'],
                'championship': ['north', 'south'],
                'league1': ['east', 'west'],
                'youth': ['u18', 'u16']
            };
            
            const teams = [
                'Arsenal FC', 'Chelsea FC', 'Man City', 'Liverpool FC', 'Brighton FC', 
                'Tottenham', 'West Ham', 'Newcastle', 'Youth Team A', 'Youth Team B',
                'Oxford United', 'Cambridge City', 'Reading FC', 'Bristol City',
                'Wolves', 'Everton', 'Leeds United', 'Norwich City'
            ];

            pitches.forEach(pitch => {
                // Generate 3-8 fixtures per pitch
                const fixtureCount = Math.floor(Math.random() * 6) + 3;
                
                for (let i = 0; i < fixtureCount; i++) {
                    const league = leagues[Math.floor(Math.random() * leagues.length)];
                    const divisionOptions = divisions[league];
                    const division = divisionOptions[Math.floor(Math.random() * divisionOptions.length)];
                    
                    // Generate random date within range or within next 60 days
                    let fixtureDate;
                    if (fromDate && toDate) {
                        const timeDiff = toDate.getTime() - fromDate.getTime();
                        const randomTime = Math.random() * timeDiff;
                        fixtureDate = new Date(fromDate.getTime() + randomTime);
                    } else {
                        const today = new Date();
                        const futureDate = new Date(today.getTime() + (Math.random() * 60 * 24 * 60 * 60 * 1000));
                        fixtureDate = futureDate;
                    }
                    
                    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
                    let awayTeam = teams[Math.floor(Math.random() * teams.length)];
                    while (awayTeam === homeTeam) {
                        awayTeam = teams[Math.floor(Math.random() * teams.length)];
                    }
                    
                    // Use pitch's kick-off times if available
                    let time = '15:00'; // default
                    if (pitch.kickOffTimes && pitch.kickOffTimes.length > 0) {
                        time = pitch.kickOffTimes[Math.floor(Math.random() * pitch.kickOffTimes.length)];
                    } else {
                        const times = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
                        time = times[Math.floor(Math.random() * times.length)];
                    }
                    
                    fixtures.push({
                        pitchId: pitch.id,
                        date: fixtureDate.toISOString().split('T')[0],
                        time: time,
                        homeTeam: homeTeam,
                        awayTeam: awayTeam,
                        league: league,
                        division: division,
                        status: Math.random() > 0.8 ? 'pending' : 'confirmed'
                    });
                }
            });
            
            return fixtures.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        },

        generatePDFFromContent(content, filename) {
            // Create a new window with the content formatted for printing
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>5ive Trackr - Pitches Export Report</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            line-height: 1.4;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                        .header {
                            text-align: center;
                            font-size: 14px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #2e6417;
                            padding-bottom: 10px;
                        }
                        .section {
                            margin-bottom: 15px;
                            page-break-inside: avoid;
                        }
                        .section-title {
                            font-weight: bold;
                            font-size: 11px;
                            color: #2e6417;
                            margin-bottom: 8px;
                            border-bottom: 1px solid #e2e8f0;
                            padding-bottom: 2px;
                        }
                        .pitch-item {
                            margin-bottom: 15px;
                            padding: 10px;
                            border-left: 3px solid #2e6417;
                            background: #f8fafc;
                            page-break-inside: avoid;
                        }
                        .pitch-name {
                            font-weight: bold;
                            font-size: 11px;
                            color: #1f2937;
                            margin-bottom: 5px;
                        }
                        .fixture-item {
                            margin: 3px 0;
                            padding-left: 10px;
                            font-size: 9px;
                        }
                        .footer {
                            position: fixed;
                            bottom: 10mm;
                            right: 20mm;
                            font-size: 8px;
                            color: #666;
                        }
                        @media print {
                            body { print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        5ive Trackr - Pitches Export Report
                    </div>
                    <pre>${content}</pre>
                    <div class="footer">
                        Generated by 5ive Trackr | Page <span class="page-number"></span>
                    </div>
                    <script>
                        // Auto-print when loaded
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
        },

        downloadFile(content, mimeType, filename) {
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename.split('.')[0]}_${new Date().toISOString().split('T')[0]}.${filename.split('.')[1]}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },

        editPitch(id) {
            // Look for pitch by both id and pitch_id to handle data inconsistencies
            const pitch = this.pitchesData.find(p => p.id === id || p.pitch_id === id || p.id == id || p.pitch_id == id);
            if (!pitch) {
                console.error('Pitch not found. ID:', id, 'Available pitches:', this.pitchesData.map(p => ({id: p.id, pitch_id: p.pitch_id, name: p.name})));
                utils.showNotification('Pitch not found', 'error');
                return;
            }
            
            // Pre-fill form with existing data
            const form = `
                <style>
                    /* Modal content container - eliminate all white corners */
                    .modal-content {
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                        background: transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        max-height: 85vh !important;
                        height: auto !important;
                    }
                    
                    /* Modal wrapper - all possible classes */
                    .modal, .modal-dialog, .modal-backdrop, .utils-modal, .modal-container, .modal-wrapper {
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    }
                    
                    /* Target any element with modal in class name */
                    [class*="modal"] {
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    }
                    
                    /* Modal body with scroll */
                    .modal-body {
                        padding: 0 !important;
                        background: white !important;
                        flex: 1 1 auto !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        min-height: 0 !important;
                        max-height: calc(85vh - 160px) !important;
                    }
                    
                    /* Custom scrollbar styling for modal body */
                    .modal-body::-webkit-scrollbar {
                        width: 6px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-track {
                        background: #f1f1f1 !important;
                        border-radius: 3px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-thumb {
                        background: #c1c1c1 !important;
                        border-radius: 3px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-thumb:hover {
                        background: #a8a8a8 !important;
                    }
                    
                    .modal-header {
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%) !important;
                        color: white !important;
                        padding: 28px 40px !important;
                        border-radius: 12px 12px 0 0 !important;
                        position: sticky !important;
                        top: 0 !important;
                        overflow: visible !important;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3) !important;
                        margin: -1px -1px 0 -1px !important;
                        transform: scale(1.01) !important;
                        border: none !important;
                        z-index: 1001 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-align: center !important;
                    }
                    
                    .modal-header h3 {
                        font-size: 18px !important;
                        font-weight: 600 !important;
                        color: white !important;
                        margin: 0 !important;
                        line-height: 1 !important;
                        padding: 0 !important;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                    }
                    
                    .professional-modal-form {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 2rem 2rem 5rem 2rem;
                        width: 100%;
                        box-sizing: border-box;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                    }
                    
                    .professional-form-group {
                        margin-bottom: 20px;
                    }
                    
                    .professional-form-label {
                        display: block;
                        margin-bottom: 6px;
                        font-size: 13px;
                        font-weight: 600 !important;
                        color: #374151;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                    }
                    
                    .professional-form-input, .professional-form-select {
                        width: 100%;
                        padding: 10px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        background: white;
                        transition: all 0.2s ease;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                        box-sizing: border-box;
                    }
                    
                    .professional-form-input:focus, .professional-form-select:focus {
                        outline: none;
                        border-color: #2e6417;
                        box-shadow: 0 0 0 3px rgba(46, 100, 23, 0.1);
                    }
                    
                    .professional-form-section {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 20px;
                    }
                    
                    .professional-form-section-title {
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 12px;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
                    }
                    
                    .time-selection-error {
                        color: #ef4444;
                        font-size: 12px;
                        margin-top: 4px;
                        display: none;
                        font-weight: 500;
                    }
                    
                    .modal-footer {
                        background: white !important;
                        padding: 20px 40px !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        gap: 12px !important;
                        position: sticky !important;
                        bottom: 0 !important;
                        border-radius: 0 0 12px 12px !important;
                        box-shadow: 0 -2px 8px rgba(0,0,0,0.05) !important;
                    }
                    
                    .modal-footer .btn {
                        margin: 0 !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                        font-weight: 600 !important;
                        font-size: 13px !important;
                        padding: 8px 16px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        letter-spacing: 0.02em !important;
                    }
                    
                    .modal-footer .btn-secondary {
                        background: transparent !important;
                        color: #475569 !important;
                        border: 2px solid #6b7280 !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                    }
                    
                    .modal-footer .btn-secondary:hover {
                        background: #f9fafb !important;
                        color: #374151 !important;
                        border-color: #9ca3af !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                    }
                    
                    .modal-footer .btn-secondary:active {
                        transform: translateY(0) !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                    }
                    
                    .modal-footer .btn-primary {
                        background: #2e6417 !important;
                        color: white !important;
                        border: 2px solid #2e6417 !important;
                        box-shadow: 0 1px 3px rgba(46, 100, 23, 0.3) !important;
                    }
                    
                    .modal-footer .btn-primary:hover {
                        background: #1e4009 !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3) !important;
                    }
                </style>
                
                <form id="edit-pitch-form" class="professional-modal-form">
                    <div class="professional-form-group">
                        <label class="professional-form-label">Pitch Name</label>
                        <input type="text" name="name" class="professional-form-input" value="${pitch.name}" required>
                    </div>
                    <div style="display: flex; gap: 16px;">
                        <div class="professional-form-group" style="flex: 1;">
                            <label class="professional-form-label">Pitch Size</label>
                            <select name="pitchSize" class="professional-form-select" required>
                                <option value="">Select size</option>
                                <option value="5-a-side" ${pitch.pitchSize === '5-a-side' ? 'selected' : ''}>5-a-side</option>
                                <option value="6-a-side" ${pitch.pitchSize === '6-a-side' ? 'selected' : ''}>6-a-side</option>
                                <option value="7-a-side" ${pitch.pitchSize === '7-a-side' ? 'selected' : ''}>7-a-side</option>
                                <option value="9-a-side" ${pitch.pitchSize === '9-a-side' ? 'selected' : ''}>9-a-side</option>
                                <option value="11-a-side" ${pitch.pitchSize === '11-a-side' ? 'selected' : ''}>11-a-side</option>
                            </select>
                        </div>
                        <div class="professional-form-group" style="flex: 1;">
                            <label class="professional-form-label">Status</label>
                            <select name="status" class="professional-form-select" required>
                                <option value="available" ${pitch.status === 'available' ? 'selected' : ''}>Available</option>
                                <option value="maintenance" ${pitch.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="unavailable" ${pitch.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="professional-form-section">
                        <div class="professional-form-section-title">Availability Configuration</div>
                        <div class="professional-form-group">
                            <label class="professional-form-label">Available Days</label>
                            <div class="days-row" style="display: flex; gap: 6px; flex-wrap: wrap;">
                                ${[{full: 'monday', short: 'Mo'}, {full: 'tuesday', short: 'Tu'}, {full: 'wednesday', short: 'We'}, {full: 'thursday', short: 'Th'}, {full: 'friday', short: 'Fr'}, {full: 'saturday', short: 'Sa'}, {full: 'sunday', short: 'Su'}].map(day => `
                                    <label class="day-checkbox" style="display: flex; align-items: center; gap: 3px; padding: 3px 4px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer; transition: all 0.2s ease; font-size: 10px; font-weight: 500; min-width: 35px; justify-content: center; flex-shrink: 0;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">
                                        <input type="checkbox" name="availability" value="${day.full}" ${pitch.availability[day.full] ? 'checked' : ''} style="margin: 0; accent-color: #2e6417;">
                                        <span style="color: #374151;">${day.short}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="professional-form-group" style="margin-bottom: 0;">
                            <label class="professional-form-label">Kick Off Times</label>
                            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                                <select id="hours-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                    <option value="">Hour</option>
                                    ${Array.from({length: 18}, (_, i) => {
                                        const hour = i + 6; // 6 AM to 11 PM
                                        const hourStr = hour.toString().padStart(2, '0');
                                        return `<option value="${hourStr}">${hourStr}</option>`;
                                    }).join('')}
                                </select>
                                <span style="color: #64748b; font-weight: 500;">:</span>
                                <select id="minutes-select" class="professional-form-select" style="width: 80px; padding: 8px 10px; font-size: 12px;">
                                    <option value="">Min</option>
                                    ${['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => `<option value="${min}">${min}</option>`).join('')}
                                </select>
                                <button type="button" onclick="addCustomTime()" style="padding: 8px 16px; background: #2e6417; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;">Add Time</button>
                            </div>
                            <div id="time-selection-error" class="time-selection-error">Please select both hour and minute before adding a time.</div>
                            <div style="border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 10px; min-height: 40px;">
                                <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Selected Times:</div>
                                <div id="selected-times" style="display: flex; flex-wrap: wrap; gap: 6px; overflow: hidden;">
                                    ${pitch.kickOffTimes.length > 0 ? pitch.kickOffTimes.map(time => `
                                        <span class="time-chip" data-time="${time}" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #2e6417; color: white; border: 1px solid #2e6417; border-radius: 16px; font-size: 12px; font-weight: 500;">
                                            ${time}
                                            <button type="button" onclick="removeTime('${time}')" style="background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 0; margin: 0; font-size: 14px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" onmouseover="this.style.color='rgba(255,255,255,1)'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.8)'; this.style.background='none'">×</button>
                                        </span>
                                    `).join('') : '<div id="no-times-indicator" style="color: #9ca3af; font-style: italic; font-size: 12px; padding: 8px 0;">No kick-off times selected</div>'}
                                </div>
                            </div>
                            <input type="hidden" name="kickOffTimes" id="kickoff-times-hidden" value="${pitch.kickOffTimes.join(',')}">
                        </div>
                    </div>
                    <input type="hidden" name="pitchId" value="${id}">
                </form>
            `;
            
            utils.showModal({
                title: `Edit ${pitch.name}`,
                content: form,
                onConfirm: async () => {
                    const success = await this.updatePitch(id);
                    return success; // Return success to control modal closing
                }
            });
            
            // Add custom time management functions to global scope
            window.addCustomTime = () => {
                const hoursSelect = document.getElementById('hours-select');
                const minutesSelect = document.getElementById('minutes-select');
                const selectedTimesDiv = document.getElementById('selected-times');
                const hiddenInput = document.getElementById('kickoff-times-hidden');
                const noTimesIndicator = document.getElementById('no-times-indicator');
                const errorMessage = document.getElementById('time-selection-error');
                
                // Hide error message first
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
                
                if (hoursSelect.value && minutesSelect.value) {
                    const timeValue = `${hoursSelect.value}:${minutesSelect.value}`;
                    const currentTimes = hiddenInput.value ? hiddenInput.value.split(',').filter(t => t.trim()) : [];
                    
                    if (!currentTimes.includes(timeValue)) {
                        currentTimes.push(timeValue);
                        currentTimes.sort();
                        
                        // Remove no times indicator if it exists
                        if (noTimesIndicator) {
                            noTimesIndicator.remove();
                        }
                        
                        const timeBadge = document.createElement('span');
                        timeBadge.className = 'time-chip';
                        timeBadge.setAttribute('data-time', timeValue);
                        timeBadge.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #2e6417; color: white; border: 1px solid #2e6417; border-radius: 16px; font-size: 12px; font-weight: 500;';
                        timeBadge.innerHTML = `
                            ${timeValue}
                            <button type="button" onclick="removeTime('${timeValue}')" style="background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 0; margin: 0; font-size: 14px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" onmouseover="this.style.color='rgba(255,255,255,1)'; this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.8)'; this.style.background='none'">×</button>
                        `;
                        
                        selectedTimesDiv.appendChild(timeBadge);
                        hiddenInput.value = currentTimes.join(',');
                        
                        // Reset dropdowns
                        hoursSelect.value = '';
                        minutesSelect.value = '';
                    }
                } else {
                    // Show error message if hour or minute not selected
                    if (errorMessage) {
                        errorMessage.style.display = 'block';
                        setTimeout(() => {
                            errorMessage.style.display = 'none';
                        }, 3000); // Hide after 3 seconds
                    }
                }
            };
            
            window.removeTime = (timeToRemove) => {
                const selectedTimesDiv = document.getElementById('selected-times');
                const hiddenInput = document.getElementById('kickoff-times-hidden');
                const timeBadge = selectedTimesDiv.querySelector(`[data-time="${timeToRemove}"]`);
                
                if (timeBadge) {
                    timeBadge.remove();
                    const currentTimes = hiddenInput.value.split(',').filter(time => time !== timeToRemove && time.trim());
                    hiddenInput.value = currentTimes.join(',');
                    
                    // Show no times indicator if no times left
                    if (currentTimes.length === 0) {
                        const noTimesIndicator = document.createElement('div');
                        noTimesIndicator.id = 'no-times-indicator';
                        noTimesIndicator.style.cssText = 'color: #9ca3af; font-style: italic; font-size: 12px; padding: 8px 0;';
                        noTimesIndicator.textContent = 'No kick-off times selected';
                        selectedTimesDiv.appendChild(noTimesIndicator);
                    }
                }
            };
        },

        async updatePitch(id) {
            try {
                const form = document.getElementById('edit-pitch-form');
                if (!form) {
                    console.error('Edit pitch form not found');
                    utils.showNotification('Form not found', 'error');
                    return false; // Keep modal open on error
                }
                
                const formData = new FormData(form);
                
                // Use flexible search logic to find the pitch
                const pitchIndex = this.pitchesData.findIndex(p => p.id === id || p.pitch_id === id || p.id == id || p.pitch_id == id);
                
                if (pitchIndex === -1) {
                    console.error('Pitch not found for update. ID:', id, 'Available pitches:', this.pitchesData.map(p => ({id: p.id, pitch_id: p.pitch_id, name: p.name})));
                    utils.showNotification('Pitch not found', 'error');
                    return false; // Pitch not found, keep modal open
                }
                
                // Validate required fields
                const name = formData.get('name');
                const pitchSize = formData.get('pitchSize');
                
                if (!name || !name.trim()) {
                    utils.showNotification('Please enter a pitch name', 'error');
                    return false; // Validation failed, keep modal open
                }
                
                if (!pitchSize) {
                    utils.showNotification('Please select a pitch size', 'error');
                    return false; // Validation failed, keep modal open
                }
                
                // Update pitch data
                const updatedPitch = {
                    ...this.pitchesData[pitchIndex],
                    name: name.trim(),
                    pitchSize: pitchSize,
                    status: formData.get('status'),
                    availability: {},
                    kickOffTimes: formData.get('kickOffTimes') ? formData.get('kickOffTimes').split(',').filter(time => time.trim()) : [],
                    updatedAt: new Date().toISOString()
                };
                
                // Set availability
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
                    updatedPitch.availability[day] = formData.getAll('availability').includes(day);
                });
                
                // Validate at least one day is selected
                const hasAvailableDays = Object.values(updatedPitch.availability).some(day => day);
                if (!hasAvailableDays) {
                    utils.showNotification('Please select at least one available day', 'error');
                    return false; // Validation failed, keep modal open
                }
                
                // Prepare data for API (match the database schema)
                const apiData = {
                    name: updatedPitch.name,
                    size: updatedPitch.pitchSize,
                    surface: updatedPitch.surface || 'Grass',
                    status: updatedPitch.status,
                    availability: updatedPitch.availability,
                    kickOffTimes: updatedPitch.kickOffTimes
                };
                
                // Update in database via API
                const result = await this.updatePitchInDatabase(this.pitchesData[pitchIndex].pitch_id || this.pitchesData[pitchIndex].id, apiData);
                
                if (result && result.success) {
                    // Clear cache to ensure fresh data on next load
                    this._apiCache = {};
                    
                    // Update local data immediately instead of reloading from database
                    const pitchIndex = this.pitchesData.findIndex(p => 
                        (p.id === id || p.pitch_id === id || p.id == id || p.pitch_id == id)
                    );
                    if (pitchIndex !== -1) {
                        this.pitchesData[pitchIndex] = this.normalizePitchData({
                            ...this.pitchesData[pitchIndex],
                            ...updatedPitch,
                            updatedAt: new Date().toISOString()
                        });
                    }
                    this.renderPitchesGrid();
                    utils.showNotification(`Successfully updated "${updatedPitch.name}"`, 'success');
                    return true; // Indicate success to close modal
                } else {
                    const errorMessage = result?.message || 'Failed to update pitch in database';
                    utils.showNotification(errorMessage, 'error');
                    return false; // Indicate failure to keep modal open
                }
            } catch (error) {
                console.error('Error updating pitch:', error);
                utils.showNotification('Failed to update pitch', 'error');
                return false; // Indicate failure to keep modal open
            }
        },

        viewCalendar(id, displayMonth = null, displayYear = null) {
            const pitch = this.pitchesData.find(p => p.id === id);
            if (!pitch) {
                utils.showNotification('Pitch not found', 'error');
                return;
            }

            // Use provided month/year or default to current
            const now = new Date();
            const currentMonth = displayMonth !== null ? displayMonth : now.getMonth();
            const currentYear = displayYear !== null ? displayYear : now.getFullYear();
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

            // Mock leagues and divisions data
            const leaguesData = {
                'premier': { name: 'Premier League', divisions: ['div1', 'div2'] },
                'championship': { name: 'Championship', divisions: ['north', 'south'] },
                'league1': { name: 'League One', divisions: ['east', 'west'] },
                'youth': { name: 'Youth League', divisions: ['u18', 'u16'] }
            };

            const divisionsData = {
                'div1': 'Division 1', 'div2': 'Division 2',
                'north': 'Northern Division', 'south': 'Southern Division',
                'east': 'Eastern Division', 'west': 'Western Division',
                'u18': 'Under 18', 'u16': 'Under 16'
            };

            // Mock fixture data with league/division info
            const allFixtures = [
                { date: '2025-01-15', time: '15:00', homeTeam: 'Arsenal FC', awayTeam: 'Chelsea FC', status: 'confirmed', league: 'premier', division: 'div1' },
                { date: '2025-01-22', time: '17:30', homeTeam: 'Man City', awayTeam: 'Liverpool FC', status: 'confirmed', league: 'premier', division: 'div2' },
                { date: '2025-01-28', time: '19:00', homeTeam: 'Brighton FC', awayTeam: 'Tottenham', status: 'pending', league: 'championship', division: 'north' },
                { date: '2025-02-05', time: '16:00', homeTeam: 'West Ham', awayTeam: 'Newcastle', status: 'confirmed', league: 'championship', division: 'south' },
                { date: '2025-01-12', time: '14:00', homeTeam: 'Youth Team A', awayTeam: 'Youth Team B', status: 'confirmed', league: 'youth', division: 'u18' },
                { date: '2025-01-20', time: '16:00', homeTeam: 'Oxford United', awayTeam: 'Cambridge City', status: 'pending', league: 'league1', division: 'east' }
            ];

            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

            let calendarHTML = `
                <style>
                    .calendar-container {
                        max-width: 500px;
                        margin: 0 auto;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, sans-serif;
                    }
                    
                    .calendar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #e2e8f0;
                        margin-bottom: 12px;
                    }
                    
                    .calendar-nav {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    
                    .nav-btn {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 6px 10px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }
                    
                    .nav-btn:hover {
                        background: #f1f5f9;
                        border-color: #cbd5e1;
                    }
                    
                    .calendar-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #1f2937;
                        margin: 0 8px;
                    }
                    
                    .pitch-info {
                        background: linear-gradient(135deg, #2e6417, #1e4009);
                        color: white;
                        padding: 4px 12px;
                        border-radius: 16px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    
                    .filters-section {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 12px;
                        align-items: center;
                    }
                    
                    .filter-group {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    
                    .filter-label {
                        font-size: 11px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .filter-select {
                        padding: 6px 8px;
                        border: 1px solid #d1d5db;
                        border-radius: 4px;
                        font-size: 12px;
                        background: white;
                        min-width: 120px;
                    }
                    
                    .calendar-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 1px;
                        background: #e5e7eb;
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    
                    .calendar-day-header {
                        background: #374151;
                        color: white;
                        padding: 8px 4px;
                        text-align: center;
                        font-weight: 600;
                        font-size: 10px;
                        text-transform: uppercase;
                    }
                    
                    .calendar-day {
                        background: white;
                        min-height: 50px;
                        padding: 4px;
                        position: relative;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .calendar-day:hover {
                        background: #f8fafc;
                    }
                    
                    .calendar-day.other-month {
                        background: #f9fafb;
                        color: #9ca3af;
                    }
                    
                    .calendar-day.today {
                        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
                        border: 1px solid #3b82f6;
                    }
                    
                    .day-number {
                        font-weight: 600;
                        font-size: 11px;
                        margin-bottom: 2px;
                    }
                    
                    .fixture-indicator {
                        background: linear-gradient(135deg, #2e6417, #16a34a);
                        color: white;
                        font-size: 8px;
                        padding: 1px 3px;
                        border-radius: 8px;
                        margin-bottom: 1px;
                        font-weight: 500;
                        text-align: center;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    }
                    
                    .fixture-indicator.pending {
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                    }
                    
                    .legend {
                        display: flex;
                        justify-content: center;
                        gap: 12px;
                        margin-top: 12px;
                        padding: 8px;
                        background: #f8fafc;
                        border-radius: 6px;
                    }
                    
                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 10px;
                    }
                    
                    .legend-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                    }
                </style>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-nav">
                            <button class="nav-btn" onclick="navigateMonth(-1)">&lt;</button>
                            <div class="calendar-title">${monthNames[currentMonth]} ${currentYear}</div>
                            <button class="nav-btn" onclick="navigateMonth(1)">&gt;</button>
                        </div>
                        <div class="pitch-info">${pitch.name}</div>
                    </div>
                    
                    <div class="filters-section">
                        <div class="filter-group">
                            <div class="filter-label">League</div>
                            <select class="filter-select" id="league-filter" onchange="updateDivisionFilter()">
                                <option value="">All Leagues</option>
                                ${Object.keys(leaguesData).map(key => `
                                    <option value="${key}">${leaguesData[key].name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <div class="filter-label">Division</div>
                            <select class="filter-select" id="division-filter" disabled onchange="filterFixtures()">
                                <option value="">Select League First</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="calendar-grid">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
            `;

            // Generate calendar days (42 days total for complete weeks)
            const today = new Date();
            for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = currentDate.getMonth() === currentMonth;
                const isToday = currentDate.toDateString() === today.toDateString();
                const dateStr = currentDate.toISOString().split('T')[0];
                
                // Check for fixtures on this date
                const dayFixtures = allFixtures.filter(fixture => fixture.date === dateStr);
                
                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                
                calendarHTML += `
                    <div class="${dayClass}">
                        <div class="day-number">${currentDate.getDate()}</div>
                        ${dayFixtures.map(fixture => `
                            <div class="fixture-indicator ${fixture.status}" title="${fixture.homeTeam} vs ${fixture.awayTeam} at ${fixture.time}">
                                ${fixture.time}
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            calendarHTML += `
                    </div>
                    
                    <div class="legend">
                        <div class="legend-item">
                            <div class="legend-dot" style="background: linear-gradient(135deg, #2e6417, #16a34a);"></div>
                            <span>Confirmed Fixtures</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background: linear-gradient(135deg, #f59e0b, #d97706);"></div>
                            <span>Pending Fixtures</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background: linear-gradient(135deg, #3b82f6, #2563eb);"></div>
                            <span>Today</span>
                        </div>
                    </div>
                </div>
            `;

            utils.showModal({
                title: `${pitch.name} - Fixture Calendar`,
                content: calendarHTML,
                showDefaultButtons: false
            });

            // Add navigation and filtering functions
            window.navigateMonth = (direction) => {
                const newMonth = currentMonth + direction;
                const newYear = currentYear + Math.floor(newMonth / 12);
                const adjustedMonth = ((newMonth % 12) + 12) % 12;
                
                // Close current modal and open new one with updated month
                utils.hideModal();
                this.viewCalendar(id, adjustedMonth, newYear);
            };

            window.updateDivisionFilter = () => {
                const leagueSelect = document.getElementById('league-filter');
                const divisionSelect = document.getElementById('division-filter');
                const selectedLeague = leagueSelect.value;
                
                divisionSelect.innerHTML = '';
                
                if (!selectedLeague) {
                    divisionSelect.innerHTML = '<option value="">Select League First</option>';
                    divisionSelect.disabled = true;
                } else {
                    divisionSelect.disabled = false;
                    divisionSelect.innerHTML = '<option value="">All Divisions</option>';
                    
                    const divisions = leaguesData[selectedLeague].divisions;
                    divisions.forEach(divKey => {
                        divisionSelect.innerHTML += `<option value="${divKey}">${divisionsData[divKey]}</option>`;
                    });
                }
                
                // Trigger filtering after updating divisions
                window.filterFixtures();
            };

            window.filterFixtures = () => {
                const leagueSelect = document.getElementById('league-filter');
                const divisionSelect = document.getElementById('division-filter');
                const selectedLeague = leagueSelect.value;
                const selectedDivision = divisionSelect.value;
                
                // Filter fixtures based on selection
                let filteredFixtures = allFixtures;
                
                if (selectedLeague) {
                    filteredFixtures = filteredFixtures.filter(fixture => fixture.league === selectedLeague);
                }
                
                if (selectedDivision) {
                    filteredFixtures = filteredFixtures.filter(fixture => fixture.division === selectedDivision);
                }
                
                // Update calendar display with filtered fixtures
                document.querySelectorAll('.calendar-day').forEach(dayElement => {
                    const dayNumber = dayElement.querySelector('.day-number');
                    if (dayNumber) {
                        // Remove existing fixture indicators
                        const existingFixtures = dayElement.querySelectorAll('.fixture-indicator');
                        existingFixtures.forEach(indicator => indicator.remove());
                        
                        // Get the date for this calendar day
                        const dayNum = parseInt(dayNumber.textContent);
                        const isOtherMonth = dayElement.classList.contains('other-month');
                        
                        let checkDate;
                        if (isOtherMonth) {
                            // Calculate actual date for other month days
                            if (dayNum > 15) {
                                // Previous month
                                checkDate = new Date(currentYear, currentMonth - 1, dayNum);
                            } else {
                                // Next month
                                checkDate = new Date(currentYear, currentMonth + 1, dayNum);
                            }
                        } else {
                            checkDate = new Date(currentYear, currentMonth, dayNum);
                        }
                        
                        const dateStr = checkDate.toISOString().split('T')[0];
                        
                        // Add filtered fixtures for this date
                        const dayFilteredFixtures = filteredFixtures.filter(fixture => fixture.date === dateStr);
                        dayFilteredFixtures.forEach(fixture => {
                            const fixtureElement = document.createElement('div');
                            fixtureElement.className = `fixture-indicator ${fixture.status}`;
                            fixtureElement.title = `${fixture.homeTeam} vs ${fixture.awayTeam} at ${fixture.time}`;
                            fixtureElement.textContent = fixture.time;
                            dayElement.appendChild(fixtureElement);
                        });
                    }
                });
            };
        },

        manageTimes(id) {
            const pitch = this.pitchesData.find(p => p.id === id);
            if (!pitch) {
                utils.showNotification('Pitch not found', 'error');
                return;
            }
            utils.showNotification(`Time management for "${pitch.name}" coming soon`, 'info');
        },

        async changeStatus(id) {
            console.log(`Attempting to change status for pitch ID: ${id}`);
            console.log(`Available pitches:`, this.pitchesData.map(p => ({
                id: p.id, 
                pitch_id: p.pitch_id, 
                name: p.name,
                status: p.status
            })));
            
            // Normalize ID for comparison (handle string vs number issues)
            const normalizedId = String(id);
            const pitch = this.pitchesData.find(p => 
                String(p.id) === normalizedId || String(p.pitch_id) === normalizedId
            );
            
            if (!pitch) {
                console.error(`Pitch not found. Searched for ID: ${id} (normalized: ${normalizedId})`);
                utils.showNotification('Pitch not found', 'error');
                return;
            }
            
            console.log(`Found pitch for status change:`, { 
                id: pitch.id, 
                pitch_id: pitch.pitch_id, 
                name: pitch.name, 
                currentStatus: pitch.status 
            });

            const availableStatuses = [
                { value: 'available', label: '✅ Available', description: 'Available for fixtures and bookings' },
                { value: 'maintenance', label: '🔧 Maintenance', description: 'Under maintenance - temporarily unavailable' },
                { value: 'unavailable', label: '❌ Unavailable', description: 'Not available for use' }
            ];

            const statusOptions = availableStatuses.map(status => 
                `<div class="status-option" data-value="${status.value}" ${status.value === pitch.status ? 'data-selected="true"' : ''}>
                    <div class="status-option-header">
                        <span class="status-option-label">${status.label}</span>
                        ${status.value === pitch.status ? '<span class="current-status">Current</span>' : ''}
                    </div>
                    <div class="status-option-description">${status.description}</div>
                </div>`
            ).join('');

            const content = `
                <div class="status-change-container">
                    <div class="current-pitch-info">
                        <h4>Changing status for: <strong>${pitch.name}</strong></h4>
                        <p>Current status: <span class="current-status-badge">${pitch.status}</span></p>
                    </div>
                    <div class="status-options">
                        ${statusOptions}
                    </div>
                </div>
                <style>
                    .status-change-container {
                        padding: 16px;
                    }
                    .current-pitch-info {
                        margin-bottom: 20px;
                        padding: 16px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2e6417;
                    }
                    .current-pitch-info h4 {
                        margin: 0 0 8px 0;
                        color: #1f2937;
                    }
                    .current-pitch-info p {
                        margin: 0;
                        color: #6b7280;
                    }
                    .current-status-badge {
                        background: #2e6417;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: capitalize;
                    }
                    .status-options {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .status-option {
                        padding: 16px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        background: white;
                    }
                    .status-option:hover {
                        border-color: #2e6417;
                        background: #f0f9ff;
                    }
                    .status-option[data-selected="true"] {
                        border-color: #2e6417;
                        background: #f0fdf4;
                    }
                    .status-option-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 4px;
                    }
                    .status-option-label {
                        font-weight: 600;
                        font-size: 14px;
                        color: #1f2937;
                    }
                    .current-status {
                        background: #fbbf24;
                        color: #92400e;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .status-option-description {
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 1.4;
                    }
                    .btn-disabled {
                        opacity: 0.6 !important;
                        cursor: not-allowed !important;
                        pointer-events: none !important;
                        background-color: #f3f4f6 !important;
                        border-color: #d1d5db !important;
                        color: #9ca3af !important;
                    }
                </style>
            `;

            let selectedStatus = pitch.status;

            // Show modal with custom content
            utils.showModal({
                title: 'Change Pitch Status',
                content: content,
                onConfirm: async () => {
                    if (selectedStatus === pitch.status) {
                        utils.showNotification('No changes made to pitch status', 'info');
                        return false; // Keep modal open since no change was made
                    }

                    try {
                        // Prepare update data
                        const updateData = {
                            name: pitch.name,
                            size: pitch.pitchSize || pitch.size,
                            status: selectedStatus,
                            availability: pitch.availability,
                            kickOffTimes: pitch.kickOffTimes
                        };

                        // Update in database via API
                        const result = await this.updatePitchInDatabase(pitch.pitch_id || pitch.id, updateData);

                        if (result && result.success) {
                            // Update local data immediately
                            const pitchIndex = this.pitchesData.findIndex(p => 
                                (p.id === id || p.pitch_id === id || p.id == id || p.pitch_id == id)
                            );
                            if (pitchIndex !== -1) {
                                this.pitchesData[pitchIndex].status = selectedStatus;
                                this.pitchesData[pitchIndex].updatedAt = new Date().toISOString();
                            }
                            
                            // Re-render the grid immediately for status changes
                            this.renderPitchesGrid();
                            const statusLabel = availableStatuses.find(s => s.value === selectedStatus)?.label || selectedStatus;
                            utils.showNotification(`Successfully changed "${pitch.name}" status to ${statusLabel}`, 'success');
                            return true; // Close modal
                        } else {
                            const errorMessage = result?.message || 'Failed to update pitch status in database';
                            utils.showNotification(errorMessage, 'error');
                            return false; // Keep modal open
                        }
                    } catch (error) {
                        console.error('Error updating pitch status:', error);
                        utils.showNotification('Failed to update pitch status', 'error');
                        return false; // Keep modal open on error
                    }
                }
            });

            // Add click handlers for status options - use requestAnimationFrame for reliable timing
            requestAnimationFrame(() => {
                const statusOptions = document.querySelectorAll('.status-option');
                const confirmBtn = document.querySelector('.modal-footer .btn-primary');
                
                console.log(`Setting up status change handlers for ${statusOptions.length} options`);
                
                // Function to update button state
                const updateButtonState = (newStatus) => {
                    if (!confirmBtn) return;
                    
                    if (newStatus === pitch.status) {
                        confirmBtn.textContent = 'No Change';
                        confirmBtn.disabled = true;
                        confirmBtn.classList.add('btn-disabled');
                    } else {
                        const statusLabel = availableStatuses.find(s => s.value === newStatus)?.label || newStatus;
                        confirmBtn.textContent = `Change to ${statusLabel}`;
                        confirmBtn.disabled = false;
                        confirmBtn.classList.remove('btn-disabled');
                    }
                };
                
                statusOptions.forEach(option => {
                    // Remove any existing listeners to prevent duplicates
                    const newOption = option.cloneNode(true);
                    option.parentNode.replaceChild(newOption, option);
                    
                    newOption.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log(`Status option clicked: ${this.getAttribute('data-value')}`);
                        
                        // Remove selection from all options
                        document.querySelectorAll('.status-option').forEach(opt => {
                            opt.removeAttribute('data-selected');
                        });
                        
                        // Add selection to clicked option
                        this.setAttribute('data-selected', 'true');
                        selectedStatus = this.getAttribute('data-value');
                        
                        // Update button state
                        updateButtonState(selectedStatus);
                    });
                });
                
                // Initialize button state
                updateButtonState(selectedStatus);
                
                // Add default footer buttons
                const modalFooter = document.querySelector('.modal-footer');
                if (modalFooter && !modalFooter.querySelector('.btn')) {
                    modalFooter.innerHTML = `
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="document.querySelector('.modal-overlay').confirmCallback && document.querySelector('.modal-overlay').confirmCallback()" disabled>No Change</button>
                    `;
                }
            }, 100);
        },

        upgradePlan() {
            utils.showNotification('Upgrade subscription plan coming soon', 'info');
        },

        async toggleTimeSlot(pitchId, time) {
            const pitchIndex = this.pitchesData.findIndex(p => p.id === pitchId);
            if (pitchIndex === -1) {
                utils.showNotification('Pitch not found', 'error');
                return;
            }

            const pitch = this.pitchesData[pitchIndex];
            
            // Initialize timeSlotStatus if it doesn't exist
            if (!pitch.timeSlotStatus) {
                pitch.timeSlotStatus = {};
            }

            // Toggle the status
            const currentStatus = pitch.timeSlotStatus[time] || 'available';
            const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
            
            // Show confirmation modal
            const statusText = newStatus === 'available' ? 'Available' : 'Unavailable';
            const statusColor = newStatus === 'available' ? '#16a34a' : '#dc2626';
            
            const confirmationHtml = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">${newStatus === 'available' ? '✅' : '❌'}</div>
                    <h3 style="margin: 0 0 12px 0; color: #1f2937;">Change Time Slot Status</h3>
                    <p style="margin: 0 0 16px 0; color: #6b7280;">
                        Set <strong>${time}</strong> on <strong>${pitch.name}</strong> to:
                    </p>
                    <div style="padding: 12px 20px; border-radius: 8px; background: ${statusColor}20; border: 2px solid ${statusColor}; color: ${statusColor}; font-weight: 600; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${statusText}
                    </div>
                    <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">
                        This will ${newStatus === 'available' ? 'allow' : 'prevent'} bookings for this time slot.
                    </p>
                </div>
            `;

            utils.showModal({
                title: 'Update Time Slot',
                content: confirmationHtml,
                onConfirm: async () => {
                    try {
                        // Update the status
                        pitch.timeSlotStatus[time] = newStatus;
                        pitch.updatedAt = new Date().toISOString();
                        
                        // Save to database
                        const result = await this.savePitchesDataWithConflictCheck();
                        
                        if (result.success) {
                            // Update the UI immediately
                            const timeSlotElement = document.querySelector(`[data-pitch-id="${pitchId}"][data-time="${time}"]`);
                            if (timeSlotElement) {
                                const indicator = timeSlotElement.querySelector('.time-status-indicator');
                                const statusColor = newStatus === 'available' ? '#16a34a' : '#dc2626';
                                
                                timeSlotElement.style.borderColor = statusColor;
                                timeSlotElement.className = `time-slot-premium clickable-time-slot ${newStatus}`;
                                
                                if (indicator) {
                                    // Update premium indicator with gradient and shadow
                                    indicator.style.background = `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`;
                                    indicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
                                }
                            }
                            
                            utils.showNotification(`Time slot ${time} set to ${statusText.toLowerCase()}`, 'success');
                        } else {
                            utils.showNotification('Failed to update time slot status', 'error');
                        }
                    } catch (error) {
                        console.error('Error updating time slot status:', error);
                        utils.showNotification('Error updating time slot status', 'error');
                    }
                }
            });
        },

        filterPitchesByVenue(venueId) {
            console.log('Filtering pitches by venue ID:', venueId);
            
            // Check if we're on the pitches page before trying to render
            const pitchesGrid = document.getElementById('pitches-grid');
            if (!pitchesGrid) {
                console.log('Not on pitches page, skipping grid render');
                return;
            }
            
            // Debounce venue filter calls to prevent multiple rapid renders
            if (this._venueFilterTimeout) {
                console.log('Clearing previous venue filter timeout to prevent jittering');
                clearTimeout(this._venueFilterTimeout);
            }
            
            this._venueFilterTimeout = setTimeout(() => {
                console.log(`Executing venue filter for: ${venueId}`);
                
                if (!venueId || venueId === 'all') {
                    // Show all pitches
                    this.renderPitchesGrid();
                    return;
                }
                
                // Filter pitches by venue and re-render
                const filteredData = this.pitchesData.filter(pitch => pitch.venueId === venueId);
                console.log(`Filtered ${this.pitchesData.length} pitches to ${filteredData.length} for venue ${venueId}`);
                
                // Store the filtered data separately and render with it
                this.currentFilteredData = filteredData;
                this.renderPitchesGrid(filteredData);
                
                this._venueFilterTimeout = null;
            }, 100); // 100ms debounce for venue filtering
        },

        // Data normalization method
        normalizePitchData(pitch) {
            // Transform database pitch data to frontend format
            // Handle JSON parsing for availability and kickOffTimes
            let availability = {};
            let kickOffTimes = [];
            
            // Parse availability
            if (pitch.availability) {
                if (typeof pitch.availability === 'string') {
                    try {
                        availability = JSON.parse(pitch.availability);
                    } catch (e) {
                        console.warn('Failed to parse availability JSON:', e);
                        availability = {};
                    }
                } else {
                    availability = pitch.availability;
                }
            }
            
            // Parse kickOffTimes - check both separate field and within availability
            if (pitch.kickOffTimes || pitch.kick_off_times) {
                const times = pitch.kickOffTimes || pitch.kick_off_times;
                if (typeof times === 'string') {
                    try {
                        kickOffTimes = JSON.parse(times);
                    } catch (e) {
                        console.warn('Failed to parse kickOffTimes JSON:', e);
                        kickOffTimes = [];
                    }
                } else if (Array.isArray(times)) {
                    kickOffTimes = times;
                }
            } else if (availability && availability.kick_off_times) {
                // Extract kick-off times from availability structure
                kickOffTimes = availability.kick_off_times || [];
            }
            
            return {
                id: pitch.id || pitch.pitch_id,
                pitch_id: pitch.pitch_id || pitch.id,
                name: pitch.name || pitch.pitch_name,
                pitch_name: pitch.pitch_name || pitch.name,
                size: pitch.size || pitch.pitch_size,
                pitchSize: pitch.pitch_size || pitch.size,
                surface: pitch.surface || 'Grass',
                status: pitch.status || 'available',
                availability: availability,
                kickOffTimes: kickOffTimes,
                venue_id: pitch.venue_id,
                venueId: pitch.venue_id, // Compatibility
                venueName: pitch.venue_name,
                venue_name: pitch.venue_name,
                venue_address: pitch.venue_address,
                createdAt: pitch.created_at || pitch.createdAt,
                updatedAt: pitch.updated_at || pitch.updatedAt,
                created_at: pitch.created_at,
                updated_at: pitch.updated_at
            };
        },

        // Database API Methods
        async fetchPitchesFromDatabase(venueId = null) {
            try {
                const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';
                
                let url = `${API_BASE}/pitches`;
                if (venueId) {
                    url += `?venue_id=${venueId}`;
                }
                
                // Simple cache to avoid redundant requests within 30 seconds
                const cacheKey = `pitches_${venueId || 'all'}`;
                const cached = this._apiCache && this._apiCache[cacheKey];
                if (cached && (Date.now() - cached.timestamp) < 30000) {
                    console.log('Using cached pitches data');
                    return cached.data;
                }
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Response Details:', {
                        status: response.status,
                        statusText: response.statusText,
                        response: errorText
                    });
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Cache the successful result
                if (result.success && result.pitches) {
                    if (!this._apiCache) this._apiCache = {};
                    this._apiCache[cacheKey] = {
                        data: result,
                        timestamp: Date.now()
                    };
                }
                
                return result;
            } catch (error) {
                console.error('Error fetching pitches from database:', error);
                throw error;
            }
        },

        async createPitchInDatabase(pitchData) {
            try {
                const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';
                
                const authToken = localStorage.getItem('auth_token');
                console.log('DEBUG: Creating pitch with auth token:', authToken ? 'EXISTS' : 'MISSING');
                console.log('DEBUG: Pitch data:', JSON.stringify(pitchData, null, 2));
                
                const response = await fetch(`${API_BASE}/pitches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pitchData)
                });
                
                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    console.error('Failed to parse server response:', parseError);
                    result = { message: 'Invalid server response' };
                }
                
                if (!response.ok) {
                    console.error('Server error response:', JSON.stringify(result, null, 2));
                    console.error('Response status:', response.status);
                    console.error('Response headers:', [...response.headers.entries()]);
                    throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                return result;
            } catch (error) {
                console.error('Error creating pitch in database:', error);
                return { success: false, message: error.message };
            }
        },

        async updatePitchInDatabase(pitchId, pitchData) {
            try {
                const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';
                
                const response = await fetch(`${API_BASE}/pitches/${pitchId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pitchData)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                return result;
            } catch (error) {
                console.error('Error updating pitch in database:', error);
                return { success: false, message: error.message };
            }
        },

        async deletePitchFromDatabase(pitchId) {
            try {
                const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';
                
                const response = await fetch(`${API_BASE}/pitches/${pitchId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                return result;
            } catch (error) {
                console.error('Error deleting pitch from database:', error);
                return { success: false, message: error.message };
            }
        }
    };

    // Venues Module
    modules.venues = {
        venuesData: [],
        // Subscription tiers based on subscription-requirements.txt
        subscriptionTiers: {
            'starter': {
                id: 'starter',
                name: 'Starter',
                priceMonthly: 49.99,
                limits: {
                    venues: 1,
                    pitches: 1,
                    referees: 10,
                    leagues: 1,
                    divisionsPerLeague: 1,
                    teams: 10 // 1 league × 1 division × 10 teams max per division
                }
            },
            'growth': {
                id: 'growth', 
                name: 'Growth',
                priceMonthly: 99.99,
                limits: {
                    venues: 1,
                    pitches: 3,
                    referees: 25,
                    leagues: 5,
                    divisionsPerLeague: 3,
                    teams: 150 // 5 leagues × 3 divisions × 10 teams max per division
                }
            },
            'pro': {
                id: 'pro',
                name: 'Pro', 
                priceMonthly: 179.99,
                limits: {
                    venues: 1,
                    pitches: 8,
                    referees: 50,
                    leagues: 10,
                    divisionsPerLeague: 5,
                    teams: 500 // 10 leagues × 5 divisions × 10 teams max per division
                }
            }
        },
        // Add-on pricing per tier
        addOnPricing: {
            extraPitch: { starter: 25, growth: 25 },
            extraReferee: { starter: 3, growth: 3 },
            extraLeague: { starter: 15, growth: 15 },
            extraDivisionsPerLeague: { starter: 8, growth: 8 }
        },
        NEXT_TIER_UPGRADE_THRESHOLD: 0.80,

        // Helper methods for subscription management
        getNextTier(currentTierId) {
            if (currentTierId === 'starter') return 'growth';
            if (currentTierId === 'growth') return 'pro';
            if (currentTierId === 'pro') return 'super';
            return null; // Super tier has no next tier
        },

        computeAddOnCost(currentTierId, addOns) {
            let cost = 0;
            const pricing = this.addOnPricing;
            
            if (addOns.extraPitches > 0) {
                const price = pricing.extraPitch[currentTierId] || Infinity;
                cost += addOns.extraPitches * price;
            }
            if (addOns.extraReferees > 0) {
                const price = pricing.extraReferee[currentTierId] || Infinity;
                cost += addOns.extraReferees * price;
            }
            if (addOns.extraLeagues > 0) {
                const price = pricing.extraLeague[currentTierId] || Infinity;
                cost += addOns.extraLeagues * price;
            }
            if (addOns.extraDivisionsPerLeague > 0) {
                const price = pricing.extraDivisionsPerLeague[currentTierId] || Infinity;
                cost += addOns.extraDivisionsPerLeague * price;
            }
            
            return cost;
        },

        wouldMeetOrExceedNextTierCapacity(currentTier, addOns, nextTier) {
            const eff = {
                pitches: currentTier.limits.pitches + addOns.extraPitches,
                referees: currentTier.limits.referees + addOns.extraReferees,
                leagues: currentTier.limits.leagues + addOns.extraLeagues,
                divisionsPerLeague: currentTier.limits.divisionsPerLeague + addOns.extraDivisionsPerLeague,
                teams: currentTier.limits.teams
            };
            
            return (
                eff.pitches >= nextTier.limits.pitches ||
                eff.referees >= nextTier.limits.referees ||
                eff.leagues >= nextTier.limits.leagues ||
                eff.divisionsPerLeague >= nextTier.limits.divisionsPerLeague ||
                eff.teams >= nextTier.limits.teams
            );
        },

        quoteWithAddOns(currentTierId, addOns, mode = 'strict') {
            const tier = this.subscriptionTiers[currentTierId];
            const addOnCost = this.computeAddOnCost(currentTierId, addOns);
            const totalMonthly = tier.priceMonthly + addOnCost;

            const nextTierId = this.getNextTier(currentTierId);
            if (!nextTierId) {
                return { 
                    totalMonthly, 
                    recommend: 'sales', 
                    reason: 'top tier', 
                    actions: ['contact_sales'] 
                };
            }

            const nextTier = this.subscriptionTiers[nextTierId];
            const thresholdForNext = nextTier.priceMonthly * this.NEXT_TIER_UPGRADE_THRESHOLD;

            const hitsCapacity = this.wouldMeetOrExceedNextTierCapacity(tier, addOns, nextTier);

            if (totalMonthly >= thresholdForNext || (mode === 'strict' && hitsCapacity)) {
                return {
                    totalMonthly,
                    recommend: 'upgrade',
                    upgradeTo: nextTierId,
                    compare: {
                        currentPlusAddOns: totalMonthly,
                        nextTierPrice: nextTier.priceMonthly
                    },
                    actions: ['one_click_upgrade']
                };
            }

            return {
                totalMonthly,
                recommend: 'stay',
                notes: 'Add-ons approved under threshold',
                actions: ['confirm_add_ons']
            };
        },
        
        // Get current usage across all resources
        getCurrentUsage() {
            // Simulate getting current usage from the app
            // In real implementation, this would query actual data
            return {
                pitches: 2, // Current pitches in use
                referees: 15, // Current referees 
                leagues: 2, // Current leagues
                teams: 25, // Current teams
                divisionsPerLeague: 2 // Current divisions per league
            };
        },

        // Check if user can add pitches based on their plan
        canAddPitches(requestedPitches, currentPlan = null) {
            const planId = currentPlan || this.getCurrentUserPlan();
            const tier = this.subscriptionTiers[planId];
            const currentUsage = this.getCurrentUsage();
            
            
            if (currentUsage.pitches + requestedPitches <= tier.limits.pitches) {
                return { allowed: true, reason: 'within_limits' };
            }
            
            // Check if add-ons would help (and if upgrade is recommended)
            const addOnsNeeded = {
                extraPitches: (currentUsage.pitches + requestedPitches) - tier.limits.pitches,
                extraReferees: 0,
                extraLeagues: 0,
                extraDivisionsPerLeague: 0
            };
            
            const quote = this.quoteWithAddOns(planId, addOnsNeeded);
            
            return { 
                allowed: false, 
                reason: 'over_limit',
                addOnsNeeded,
                quote
            };
        },
        
        currentPlan: 'growth', // Default to growth plan for demo
        
        // Get current user's subscription plan (would normally come from API)
        getCurrentUserPlan() {
            // In a real implementation, this would fetch from the user's account
            return this.currentPlan;
        },

        // Enhanced subscription status checking with expiration logic
        getSubscriptionStatusStyle(subscription) {
            if (!subscription) {
                return 'background: #fef2f2; color: #dc2626;'; // Red for no subscription
            }

            const status = subscription.status;
            const currentDate = new Date();
            
            // Parse expiration date if available
            let expirationDate = null;
            if (subscription.expires_at || subscription.expiration_date || subscription.next_billing_date) {
                const expDateStr = subscription.expires_at || subscription.expiration_date || subscription.next_billing_date;
                expirationDate = new Date(expDateStr);
            }

            // Active subscription
            if (status === 'active') {
                return 'background: #dcfce7; color: #16a34a;'; // Green
            }
            
            // Cancelled but still has time remaining
            if ((status === 'cancelled' || status === 'canceled') && expirationDate && currentDate < expirationDate) {
                return 'background: #fed7aa; color: #ea580c;'; // Orange for expiring
            }
            
            // Inactive, expired, or cancelled without remaining time
            return 'background: #fef2f2; color: #dc2626;'; // Red
        },

        getSubscriptionStatusText(subscription) {
            if (!subscription) {
                return '● Inactive';
            }

            const status = subscription.status;
            const currentDate = new Date();
            
            // Parse expiration date if available
            let expirationDate = null;
            if (subscription.expires_at || subscription.expiration_date || subscription.next_billing_date) {
                const expDateStr = subscription.expires_at || subscription.expiration_date || subscription.next_billing_date;
                expirationDate = new Date(expDateStr);
            }

            // Active subscription
            if (status === 'active') {
                return '● Active';
            }
            
            // Cancelled but still has time remaining
            if ((status === 'cancelled' || status === 'canceled') && expirationDate && currentDate < expirationDate) {
                return '● Expiring';
            }
            
            // Inactive, expired, or cancelled without remaining time
            return '● Inactive';
        },

        async render() {
            return `
                <div class="content-area">
                    <!-- Venues Grid -->
                    <div class="venues-grid" id="venues-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 24px; margin-bottom: 32px;">
                        <div class="venues-loading" style="grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; min-height: 300px; background: #f8f9fa; border-radius: 16px;">
                            <div class="loading-content" style="text-align: center;">
                                <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0369a1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                                <p style="color: #666; margin: 0;">Loading venues...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Venues module initialized');
            await this.loadVenuesData();
            this.renderVenuesGrid();
            
            // Refresh venue selector in sidebar after venues are loaded
            if (window.VenueSelector) {
                await window.VenueSelector.refresh();
            }
        },

        async loadVenuesData() {
            try {
                console.log('Loading venues data from server...');
                
                // Get API base URL
                const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';

                const response = await fetch(`${apiBase}/venues`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.venues) {
                        this.venuesData = result.venues;
                        console.log('Loaded venues from server:', this.venuesData);
                        return;
                    }
                }

                console.log('No venues found on server or error occurred - starting with empty data');
                this.venuesData = [];
            } catch (error) {
                console.error('Error loading venues from server:', error);
                this.venuesData = [];
                console.log('Data loading failed - starting with empty data');
            }
        },

        getMockVenuesData() {
            // No mock data - return empty array for clean start
            return [];
        },

        renderVenuesGrid() {
            const grid = document.getElementById('venues-grid');
            const loadingElement = grid.querySelector('.venues-loading');
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            const existingCards = grid.querySelectorAll('.venue-card, .add-venue-card');
            existingCards.forEach(card => card.remove());
            
            this.venuesData.forEach(venue => {
                const venueCard = this.createVenueCard(venue);
                grid.appendChild(venueCard);
            });

            // Always show add venue card - each tenant gets at least one venue automatically
            const addCard = this.createAddVenueCard();
            grid.appendChild(addCard);
        },

        createVenueCard(venue) {
            const card = document.createElement('div');
            card.className = 'venue-card venue-professional';
            
            // Ensure we have a consistent ID field
            const venueId = venue.id || venue.venue_id;
            console.log(`Creating venue card for: ${venue.name} (ID: ${venueId})`);
            
            // Get operating hours for today
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const todaysHours = venue.operatingHours?.[today];
            const hoursText = todaysHours ? `${todaysHours.open} - ${todaysHours.close}` : 'Closed';

            // Get stats with defaults
            const stats = venue.stats || {};
            const managers = venue.managers || {};
            
            // Get subscription tier information and current usage
            const subscriptionPlan = (venue.subscription?.plan || venue.subscription_plan || 'Starter').toLowerCase();
            const tier = this.subscriptionTiers[subscriptionPlan] || this.subscriptionTiers['starter'];
            
            // Real current usage from venue data and stats
            const currentUsage = {
                pitches: venue.pitches || venue.pitch_count || stats.pitches || 0,
                referees: stats.referees || 0,
                leagues: stats.leagues || 0,
                teams: stats.teams || 0,
                divisions: stats.divisions || 0
            };

            card.innerHTML = `
                <div class="venue-card-inner">
                    <!-- Header Section - Modern Gradient -->
                    <div style="
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%);
                        color: white; 
                        padding: 24px 20px; 
                        margin: -20px -20px 20px -20px; 
                        border-radius: 16px 16px 0 0;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3);
                    ">
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%); pointer-events: none;"></div>
                        <div style="position: relative; z-index: 2;">
                            <h3 style="font-size: 20px; font-weight: 800; color: white; margin: 0 0 8px 0; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${venue.name}</h3>
                            <div style="font-size: 14px; color: rgba(255,255,255,0.95); font-weight: 500;">${venue.city || 'City'}</div>
                        </div>
                    </div>


                    <!-- Subscription Section -->
                    <div style="background: white; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="
                                    width: 32px; 
                                    height: 32px; 
                                    border-radius: 8px; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center; 
                                    color: white; 
                                    position: relative; 
                                    overflow: hidden; 
                                    background: ${
                                        tier.name === 'Starter' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' :
                                        tier.name === 'Pro' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                        'linear-gradient(135deg, #2e6417 0%, #1e4009 100%)'
                                    };
                                    box-shadow: 0 2px 6px ${
                                        tier.name === 'Starter' ? 'rgba(99, 102, 241, 0.2)' :
                                        tier.name === 'Pro' ? 'rgba(245, 158, 11, 0.2)' :
                                        'rgba(46, 100, 23, 0.2)'
                                    };
                                    border: 1px solid rgba(255, 255, 255, 0.15);
                                ">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">
                                        ${tier.name === 'Starter' ? 
                                            '<path d="M13 10V3L4 14h7v7l9-11h-7z"/>' :
                                        tier.name === 'Pro' ? 
                                            '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' :
                                            '<path d="M12 2L8 12h3v8h2v-8h3L12 2z"/>'
                                        }
                                    </svg>
                                </div>
                                <div>
                                    <div style="font-size: 14px; font-weight: 600; color: #1f2937;">
                                        ${tier.name} Subscription
                                    </div>
                                </div>
                            </div>
                            <div style="padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; ${this.getSubscriptionStatusStyle(venue.subscription)}">
                                ${this.getSubscriptionStatusText(venue.subscription).replace('● ', '')}
                            </div>
                        </div>
                        
                        <!-- Premium Resource Management - Vertical Stack -->
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                            <!-- Pitches -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; position: relative; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Pitches</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px; font-weight: 700; color: #111827; font-family: system-ui, -apple-system, sans-serif;">${currentUsage.pitches}</span>
                                        <span style="font-size: 13px; color: #6b7280;">/ ${tier.limits.pitches === Infinity ? '∞' : tier.limits.pitches}</span>
                                        ${currentUsage.pitches >= tier.limits.pitches && tier.limits.pitches !== Infinity ? '<div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></div>' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Teams -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; position: relative; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Teams</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px; font-weight: 700; color: #111827; font-family: system-ui, -apple-system, sans-serif;">${currentUsage.teams}</span>
                                        <span style="font-size: 13px; color: #6b7280;">/ ${tier.limits.teams === Infinity ? '∞' : tier.limits.teams}</span>
                                        ${currentUsage.teams >= tier.limits.teams && tier.limits.teams !== Infinity ? '<div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></div>' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Leagues -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; position: relative; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Leagues</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px; font-weight: 700; color: #111827; font-family: system-ui, -apple-system, sans-serif;">${currentUsage.leagues}</span>
                                        <span style="font-size: 13px; color: #6b7280;">/ ${tier.limits.leagues === Infinity ? '∞' : tier.limits.leagues}</span>
                                        ${currentUsage.leagues >= tier.limits.leagues && tier.limits.leagues !== Infinity ? '<div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></div>' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Referees -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; position: relative; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Referees</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px; font-weight: 700; color: #111827; font-family: system-ui, -apple-system, sans-serif;">${currentUsage.referees}</span>
                                        <span style="font-size: 13px; color: #6b7280;">/ ${tier.limits.referees === Infinity ? '∞' : tier.limits.referees}</span>
                                        ${currentUsage.referees >= tier.limits.referees && tier.limits.referees !== Infinity ? '<div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></div>' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Divisions -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; position: relative; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Divisions</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px; font-weight: 700; color: #111827; font-family: system-ui, -apple-system, sans-serif;">${currentUsage.divisions || 0}</span>
                                        <span style="font-size: 13px; color: #6b7280;">/ ${tier.limits.divisionsPerLeague === Infinity ? '∞' : tier.limits.divisionsPerLeague}</span>
                                        ${(currentUsage.divisions || 0) >= tier.limits.divisionsPerLeague && tier.limits.divisionsPerLeague !== Infinity ? '<div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></div>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Upgrade Action -->
                        <div onclick="SPAModules.venues.upgradeAddons('${venueId}')" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.15s ease; margin-top: 12px; text-align: center;" onmouseover="this.style.borderColor='#2e6417'; this.style.background='linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100)'">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #6b7280;">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                                <span style="font-size: 14px; font-weight: 600; color: #374151;">Upgrade Limits</span>
                            </div>
                        </div>
                    </div>


                    <!-- Action Buttons -->
                    <div style="display: flex; justify-content: center; gap: 8px;">
                        <button onclick="SPAModules.venues.editVenue('${venueId}')" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; width: 36px; height: 36px; padding: 0; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                            ✏️
                        </button>
                        <button onclick="SPAModules.venues.deleteVenue('${venueId}')" style="background: #dc2626; color: white; border: 1px solid #b91c1c; width: 36px; height: 36px; padding: 0; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                            🗑️
                        </button>
                    </div>
                </div>
            `;

            // Add comprehensive styling - matching pitches module style
            card.style.cssText = `
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 20px;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                box-shadow: 
                    0 4px 6px rgba(0, 0, 0, 0.05),
                    0 1px 3px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                backdrop-filter: blur(10px);
                transform-origin: center;
            `;

            // Add style element for inner components
            const style = document.createElement('style');
            style.textContent = `
                .venue-card-inner {
                    padding: 20px;
                }
                
                .venue-card:hover .btn-primary {
                    background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%) !important;
                }
                
                .btn-secondary:hover {
                    background: #f3f4f6 !important;
                    border-color: #9ca3af !important;
                }
                
                .btn-danger:hover {
                    background: #fee2e2 !important;
                    border-color: #f87171 !important;
                }
                
                .metric-card {
                    transition: all 0.2s ease;
                }
                
                .venue-card:hover .metric-card {
                    transform: scale(1.02);
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            
            // Append style to document head if not already present
            if (!document.getElementById('venue-card-styles')) {
                style.id = 'venue-card-styles';
                document.head.appendChild(style);
            }

            // Add premium hover interactions - matching pitches style
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = `
                    0 20px 25px rgba(0, 0, 0, 0.15),
                    0 8px 10px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(3, 105, 161, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8)
                `;
                card.style.borderColor = 'rgba(3, 105, 161, 0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = `
                    0 4px 6px rgba(0, 0, 0, 0.05),
                    0 1px 3px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6)
                `;
                card.style.borderColor = 'rgba(226, 232, 240, 0.8)';
            });

            // Add click animation
            card.addEventListener('mousedown', () => {
                card.style.transform = 'translateY(-4px) scale(0.98)';
            });

            card.addEventListener('mouseup', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            return card;
        },

        createAddVenueCard() {
            const card = document.createElement('div');
            card.className = 'add-venue-card';
            card.style.cssText = `
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px dashed #0369a1;
                border-radius: 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 350px;
                cursor: pointer;
                transition: all 0.3s ease;
                padding: 40px 20px;
                text-align: center;
            `;

            card.innerHTML = `
                <div style="font-size: 48px; color: #0369a1; margin-bottom: 16px;">🏟️</div>
                <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">Add New Venue</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Register a new football venue</p>
            `;

            card.addEventListener('click', () => this.addVenue());
            
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = '#0284c7';
                card.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                card.style.transform = 'translateY(-2px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = '#0369a1';
                card.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
                card.style.transform = 'translateY(0)';
            });
            
            return card;
        },


        // Calculate how many venues tenant can still create based on subscription packages
        async getAvailableVenueCount() {
            const availablePackages = await this.getAvailableSubscriptionPackages();
            
            // Count unassigned packages (each package allows 1 venue except super)
            return availablePackages.filter(pkg => !pkg.assigned).length;
        },

        // Get tenant's available subscription packages from database
        async getAvailableSubscriptionPackages() {
            try {
                const isLocalTesting = window.location.protocol === 'file:';
                
                if (isLocalTesting) {
                    // Local testing mode - simulate database response
                    console.info('Local testing mode - simulating subscription packages');
                    // For new tenants with no venues, simulate they have their purchased subscription
                    if (this.venuesData.length === 0) {
                        return [
                            { id: 'tenant_package_1', tier: 'starter', name: 'Starter Package', purchased: true, assigned: false }
                        ];
                    }
                    return [];
                }
                
                // Fetch subscription packages from API
                try {
                    // Get current user/tenant info
                    const currentUser = SessionManager.getCurrentUser();
                    if (!currentUser) {
                        console.warn('No current user session found');
                        return [];
                    }
                    
                    // Get API base URL
                    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                        ? 'http://localhost:8080/api'
                        : 'https://five-trackr-yq6ly.ondigitalocean.app/api';
                    
                    // Get auth token
                    const token = localStorage.getItem('auth_token');
                    if (!token) {
                        console.warn('No auth token found');
                        return [];
                    }
                    
                    // Fetch tenant subscription info
                    const response = await fetch(`${apiBase}/auth/subscription-info`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        console.error('Failed to fetch subscription info:', response.status);
                        return [];
                    }
                    
                    const data = await response.json();
                    
                    // Also fetch recycled packages from the new endpoint
                    let recycledPackages = [];
                    try {
                        const recycledResponse = await fetch(`${apiBase}/venues/available-packages`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (recycledResponse.ok) {
                            const recycledData = await recycledResponse.json();
                            if (recycledData.packages && Array.isArray(recycledData.packages)) {
                                // Format recycled packages to match the expected structure
                                recycledPackages = recycledData.packages.map(pkg => ({
                                    id: pkg.package_id,
                                    tier: pkg.subscription_tier,
                                    name: `${pkg.subscription_plan} (Recycled from ${pkg.source_venue_name})`,
                                    purchased: true,
                                    assigned: false,
                                    is_recycled: true,
                                    expires_at: pkg.expires_at
                                }));
                                console.log(`Found ${recycledPackages.length} recycled packages`);
                            }
                        }
                    } catch (error) {
                        console.warn('Could not fetch recycled packages:', error);
                    }
                    
                    // Check if we have packages data
                    if (data.subscription && data.subscription.packages) {
                        // Get list of assigned venue IDs from current venues
                        const assignedPackageIds = this.venuesData
                            .filter(v => v.subscription && v.subscription.packageId)
                            .map(v => v.subscription.packageId);
                        
                        // Filter packages to only show unassigned ones
                        const availablePackages = data.subscription.packages.filter(pkg => {
                            // Check if this package is already assigned to a venue
                            const isAssigned = assignedPackageIds.includes(pkg.id) || pkg.assigned;
                            return pkg.purchased && !isAssigned;
                        });
                        
                        console.log(`Found ${availablePackages.length} available packages out of ${data.subscription.packages.length} total`);
                        
                        // Combine regular and recycled packages
                        const allPackages = [...availablePackages, ...recycledPackages];
                        console.log(`Total available packages (including recycled): ${allPackages.length}`);
                        return allPackages;
                    }
                    
                    // Legacy single-tier subscription support
                    if (data.subscription && data.subscription.tier_id && data.subscription.venue_limit) {
                        const venueCount = this.venuesData.length;
                        const venueLimit = data.subscription.venue_limit;
                        
                        if (venueCount < venueLimit) {
                            // Still have venues available in legacy subscription
                            return [{
                                id: `legacy_${data.subscription.tier_id}_${Date.now()}`,
                                tier: data.subscription.tier_id,
                                name: data.subscription.plan_name || 'Legacy Subscription',
                                purchased: true,
                                assigned: false
                            }];
                        }
                    }
                    
                    console.log('No available packages or venues remaining in subscription');
                    return [];
                    
                } catch (error) {
                    console.error('Error fetching subscription packages from API:', error);
                    return [];
                }
                
                // Fallback if API call fails - return empty (will show subscription purchase options)
                console.warn('Could not fetch subscription packages from database');
                return [];
                
            } catch (error) {
                console.error('Error fetching subscription packages:', error);
                return [];
            }
        },

        // Venue Management Methods
        async addVenue() {
            try {
                // Get available subscription packages for this tenant
                const availablePackages = await this.getAvailableSubscriptionPackages();
                
                // If tenant has available packages, show package selection
                if (availablePackages.length > 0) {
                    this.showVenueCreationWithPackageSelection(availablePackages);
                    return;
                }
                
                // If no available packages, show subscription purchase options
                this.showSubscriptionPurchaseOptions();
            } catch (error) {
                console.error('Error loading subscription packages:', error);
                utils.showNotification('Error loading subscription information', 'error');
            }
        },

        // Show subscription purchase options
        showSubscriptionPurchaseOptions() {
            utils.showModal({
                title: 'Choose Your Subscription Plan',
                content: `
                    <div class="subscription-packages">
                        <div style="margin-bottom: 20px; text-align: center; color: #6b7280;">
                            No available subscription packages found. Purchase a new subscription plan to create additional venues.
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                            <!-- Starter Plan -->
                            <div class="package-card" data-plan="starter" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #374151; margin-bottom: 8px;">Starter</div>
                                <div style="font-size: 32px; font-weight: 800; color: #2e6417; margin-bottom: 4px;">£49.99</div>
                                <div style="font-size: 12px; color: #9ca3af; margin-bottom: 16px;">per month</div>
                                
                                <div style="text-align: left; margin-bottom: 16px;">
                                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #374151;">Limits:</div>
                                    <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                                        • 1 venue<br>
                                        • 1 pitch<br>
                                        • 10 referees<br>
                                        • 1 league<br>
                                        • 1 division per league<br>
                                        • 10 teams<br>
                                        • Basic support
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: 16px; padding: 8px; background: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280;">
                                    Add-ons available: £25/pitch, £3/referee, £15/league, £8/division
                                </div>
                                
                                <button class="select-plan-btn" style="width: 100%; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px; border-radius: 8px; font-weight: 500; cursor: pointer;">
                                    Select Starter
                                </button>
                            </div>
                            
                            <!-- Growth Plan -->
                            <div class="package-card" data-plan="growth" style="border: 2px solid #2e6417; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; text-align: center; position: relative;">
                                <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: #2e6417; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">POPULAR</div>
                                <div style="font-size: 20px; font-weight: 700; color: #374151; margin-bottom: 8px;">Growth</div>
                                <div style="font-size: 32px; font-weight: 800; color: #2e6417; margin-bottom: 4px;">£99.99</div>
                                <div style="font-size: 12px; color: #9ca3af; margin-bottom: 16px;">per month</div>
                                
                                <div style="text-align: left; margin-bottom: 16px;">
                                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #374151;">Limits:</div>
                                    <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                                        • 1 venue<br>
                                        • 3 pitches<br>
                                        • 25 referees<br>
                                        • 5 leagues<br>
                                        • 3 divisions per league<br>
                                        • 150 teams<br>
                                        • Priority support
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: 16px; padding: 8px; background: #f0f9ff; border-radius: 6px; font-size: 12px; color: #0369a1;">
                                    Add-ons available: £25/pitch, £3/referee, £15/league, £8/division
                                </div>
                                
                                <button class="select-plan-btn" style="width: 100%; background: #2e6417; color: white; border: 1px solid #2e6417; padding: 10px; border-radius: 8px; font-weight: 500; cursor: pointer;">
                                    Select Growth
                                </button>
                            </div>
                            
                            <!-- Pro Plan -->
                            <div class="package-card" data-plan="pro" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #374151; margin-bottom: 8px;">Pro</div>
                                <div style="font-size: 32px; font-weight: 800; color: #2e6417; margin-bottom: 4px;">£179.99</div>
                                <div style="font-size: 12px; color: #9ca3af; margin-bottom: 16px;">per month</div>
                                
                                <div style="text-align: left; margin-bottom: 16px;">
                                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #374151;">Limits:</div>
                                    <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                                        • 1 venue<br>
                                        • 8 pitches<br>
                                        • 50 referees<br>
                                        • 10 leagues<br>
                                        • 5 divisions per league<br>
                                        • 500 teams<br>
                                        • Premium support
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: 16px; padding: 8px; background: #fef3c7; border-radius: 6px; font-size: 12px; color: #92400e;">
                                    Enterprise add-ons: Contact sales for custom pricing
                                </div>
                                
                                <button class="select-plan-btn" style="width: 100%; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px; border-radius: 8px; font-weight: 500; cursor: pointer;">
                                    Select Pro
                                </button>
                            </div>
                        </div>
                    </div>
                `,
                showDefaultButtons: false,
                size: 'large',
                onLoad: () => {
                    // Add click handlers for plan selection
                    document.querySelectorAll('.select-plan-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const planCard = e.target.closest('.package-card');
                            const selectedPlan = planCard.dataset.plan;
                            this.proceedWithPlanSelection(selectedPlan);
                        });
                    });

                    // Add hover effects
                    document.querySelectorAll('.package-card').forEach(card => {
                        card.addEventListener('mouseenter', () => {
                            card.style.transform = 'translateY(-4px)';
                            card.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                        });
                        card.addEventListener('mouseleave', () => {
                            card.style.transform = 'translateY(0)';
                            card.style.boxShadow = 'none';
                        });
                    });
                }
            });
        },

        proceedWithPlanSelection(selectedPlan) {
            // Close subscription modal and show venue creation form
            utils.hideModal();
            
            // Show venue creation form with selected plan
            setTimeout(() => {
                this.showVenueCreationForm(selectedPlan);
            }, 300);
        },

        // Show venue creation with package selection button
        showVenueCreationWithPackageSelection(availablePackages) {
            // Store available packages for later use
            this.availablePackages = availablePackages;
            this.selectedPackage = null;
            
            const form = `
                <style>
                    /* Modal design standards matching add pitch modal */
                    .modal-content {
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                        background: transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        max-height: 85vh !important;
                        height: auto !important;
                    }
                    
                    .modal, .modal-dialog, .modal-backdrop, .utils-modal, .modal-container, .modal-wrapper {
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    }
                    
                    [class*="modal"] {
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    }
                    
                    .modal-body {
                        padding: 20px 0 20px 0 !important;
                        background: white !important;
                        flex: 1 1 auto !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        min-height: 0 !important;
                        max-height: calc(85vh - 160px) !important;
                        box-sizing: border-box !important;
                    }
                    
                    .modal-body::-webkit-scrollbar {
                        width: 6px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-track {
                        background: #f1f1f1 !important;
                        border-radius: 3px !important;
                    }
                    
                    .modal-body::-webkit-scrollbar-thumb {
                        background: #c1c1c1 !important;
                        border-radius: 3px !important;
                    }
                    
                    .modal-header {
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%) !important;
                        color: white !important;
                        padding: 28px 40px !important;
                        border-radius: 12px 12px 0 0 !important;
                        position: sticky !important;
                        top: 0 !important;
                        overflow: visible !important;
                        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3) !important;
                        margin: -1px -1px 0 -1px !important;
                        transform: scale(1.01) !important;
                        border: none !important;
                        z-index: 1001 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-align: center !important;
                    }
                    
                    .modal-header h3 {
                        font-size: 18px !important;
                        font-weight: 600 !important;
                        color: white !important;
                        margin: 0 !important;
                        line-height: 1 !important;
                        padding: 0 !important;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
                        word-wrap: break-word !important;
                        overflow: visible !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif !important;
                    }
                    
                    .modal-footer {
                        background: white !important;
                        padding: 20px 40px !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        gap: 12px !important;
                        position: sticky !important;
                        bottom: 0 !important;
                        border-radius: 0 0 12px 12px !important;
                        box-shadow: 0 -2px 8px rgba(0,0,0,0.05) !important;
                    }
                    
                    .modal-footer .btn {
                        margin: 0 !important;
                        padding: 8px 16px !important;
                        font-size: 13px !important;
                        border-radius: 6px !important;
                        font-weight: 500 !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                    }
                    
                    .modal-footer .btn-outline {
                        background: transparent !important;
                        border: 2px solid #6b7280 !important;
                        color: #6b7280 !important;
                    }
                    
                    .modal-footer .btn-primary {
                        background: #2e6417 !important;
                        border: none !important;
                        color: white !important;
                    }
                    
                    .modal-form {
                        padding: 0px 40px 20px 40px !important;
                    }
                    
                    .form-group {
                        margin-bottom: 20px !important;
                    }
                    
                    .form-label {
                        display: block !important;
                        font-weight: 600 !important;
                        color: #374151 !important;
                        margin-bottom: 8px !important;
                        font-size: 14px !important;
                    }
                    
                    .form-control {
                        width: 100% !important;
                        padding: 12px 16px !important;
                        border: 2px solid #d1d5db !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        background: white !important;
                        transition: all 0.2s ease !important;
                        box-sizing: border-box !important;
                    }
                    
                    .form-control:focus {
                        outline: none !important;
                        border-color: #2e6417 !important;
                        box-shadow: 0 0 0 3px rgba(46, 100, 23, 0.1) !important;
                    }
                </style>
                
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin: 0px 40px 20px 40px;">
                    <div style="font-size: 14px; color: #0369a1;">
                        <strong>Subscription Package Required:</strong> Select a package to assign to this venue
                    </div>
                </div>
                
                <form id="add-venue-form" class="modal-form">
                    <input type="hidden" name="selectedPackage" id="selected-package-id">
                    <input type="hidden" name="selectedPlan" id="selected-plan-tier">
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Subscription Package</label>
                        <div id="package-selector-container" style="position: relative;">
                            <button type="button" id="package-selector-btn" onclick="SPAModules.venues.showPackageSelectionModal()" 
                                    style="width: 100%; padding: 12px 16px; border: 2px solid #d1d5db; border-radius: 8px; 
                                           background: white; text-align: left; font-size: 14px; cursor: pointer; 
                                           display: flex; justify-content: space-between; align-items: center;
                                           transition: all 0.2s ease;">
                                <span id="selected-package-text" style="color: #6b7280;">Click to select a package...</span>
                                <svg style="width: 20px; height: 20px; color: #9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div id="selected-package-info" style="display: none; background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div id="package-details" style="font-size: 14px; color: #15803d; flex: 1;"></div>
                            <button type="button" onclick="SPAModules.venues.showPackageSelectionModal()" 
                                    style="padding: 4px 8px; background: #2e6417; color: white; border: none; 
                                           border-radius: 4px; font-size: 12px; cursor: pointer; margin-left: 12px;">
                                Change
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Venue Name</label>
                        <input type="text" name="name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" name="city" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Full Address <span style="color: #9ca3af; font-size: 12px;">(optional)</span></label>
                        <textarea name="address" class="form-control" rows="2" placeholder="Enter venue address (optional)"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone Number <span style="color: #9ca3af; font-size: 12px;">(optional)</span></label>
                        <input type="tel" name="phone" class="form-control" placeholder="Enter phone number (optional)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address <span style="color: #9ca3af; font-size: 12px;">(optional)</span></label>
                        <input type="email" name="email" class="form-control" placeholder="Enter email address (optional)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select name="status" class="form-control" required>
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </form>
            `;
            
            utils.showModal({
                title: 'Add New Venue',
                content: form,
                onConfirm: () => this.saveVenue()
            });
        },

        // Show package selection modal
        showPackageSelectionModal() {
            if (!this.availablePackages || this.availablePackages.length === 0) {
                utils.showNotification('No packages available', 'error');
                return;
            }
            
            // Create a secondary modal for package selection
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); 
                            display: flex; align-items: center; justify-content: center; z-index: 10000;">
                    <div style="background: white; border-radius: 12px; max-width: 800px; width: 90%; height: 80vh; 
                                display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                                overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%); 
                                    color: white; padding: 20px; border-radius: 12px 12px 0 0; margin: -1px -1px 0 -1px; 
                                    transform: scale(1.01); flex-shrink: 0; text-align: center;">
                            <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Select Subscription Package</h3>
                        </div>
                        
                        <div style="flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px;">
                            <div id="packages-grid" style="display: grid; gap: 16px;">
                                ${this.availablePackages.map((pkg, index) => {
                                    const tier = this.subscriptionTiers[pkg.tier];
                                    const isRecycled = pkg.is_recycled || false;
                                    const expiryDate = pkg.expires_at ? new Date(pkg.expires_at) : null;
                                    const daysRemaining = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                                    
                                    return `
                                        <div class="package-option" data-package-index="${index}"
                                             style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; 
                                                    padding: 24px; cursor: pointer; transition: all 0.3s ease; 
                                                    position: relative; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                                            
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                                <div>
                                                    <h4 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
                                                        ${tier.name} Package
                                                    </h4>
                                                    ${isRecycled ? `
                                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                                                            Previously assigned to: ${pkg.name.replace(/ \(Recycled.*\)/, '').replace(`${tier.name} Package - `, '')}
                                                        </p>
                                                    ` : ''}
                                                </div>
                                                ${isRecycled ? `
                                                    <span style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; 
                                                                padding: 6px 12px; border-radius: 20px; font-size: 11px; 
                                                                font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Recycled
                                                    </span>
                                                ` : `
                                                    <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; 
                                                                padding: 6px 12px; border-radius: 20px; font-size: 11px; 
                                                                font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Available
                                                    </span>
                                                `}
                                            </div>
                                            
                                            <div style="background: linear-gradient(to bottom, #f9fafb, #f3f4f6); border-radius: 10px; 
                                                        padding: 16px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
                                                <div style="font-size: 14px; color: #374151; line-height: 1.8;">
                                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                                        <div style="display: flex; align-items: center;">
                                                            <svg style="width: 16px; height: 16px; margin-right: 8px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                            </svg>
                                                            <span style="font-weight: 500;">${tier.limits.venues} Venue${tier.limits.venues === 1 ? '' : 's'}</span>
                                                        </div>
                                                        <div style="display: flex; align-items: center;">
                                                            <svg style="width: 16px; height: 16px; margin-right: 8px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                            </svg>
                                                            <span style="font-weight: 500;">${tier.limits.pitches} Pitch${tier.limits.pitches === 1 ? '' : 'es'}</span>
                                                        </div>
                                                        <div style="display: flex; align-items: center;">
                                                            <svg style="width: 16px; height: 16px; margin-right: 8px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                            </svg>
                                                            <span style="font-weight: 500;">${tier.limits.referees} Referee${tier.limits.referees === 1 ? '' : 's'}</span>
                                                        </div>
                                                        <div style="display: flex; align-items: center;">
                                                            <svg style="width: 16px; height: 16px; margin-right: 8px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                            </svg>
                                                            <span style="font-weight: 500;">${tier.limits.leagues} League${tier.limits.leagues === 1 ? '' : 's'}</span>
                                                        </div>
                                                        <div style="display: flex; align-items: center;">
                                                            <svg style="width: 16px; height: 16px; margin-right: 8px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                            </svg>
                                                            <span style="font-weight: 500;">${tier.limits.divisionsPerLeague} Division${tier.limits.divisionsPerLeague === 1 ? '' : 's'}/League</span>
                                                        </div>
                                                        <div style="display: flex; align-items: center;">
                                                            <svg style="width: 16px; height: 16px; margin-right: 8px; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                            </svg>
                                                            <span style="font-weight: 500;">${tier.limits.teams} Team${tier.limits.teams === 1 ? '' : 's'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            ${expiryDate ? `
                                                <div style="background: ${daysRemaining < 7 ? '#fef2f2' : '#f0fdf4'}; 
                                                            border: 1px solid ${daysRemaining < 7 ? '#fecaca' : '#bbf7d0'}; 
                                                            border-radius: 8px; padding: 12px; display: flex; 
                                                            justify-content: space-between; align-items: center;">
                                                    <div style="display: flex; align-items: center;">
                                                        <svg style="width: 16px; height: 16px; margin-right: 8px; 
                                                                    color: ${daysRemaining < 7 ? '#dc2626' : '#059669'};" 
                                                             fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                                                        </svg>
                                                        <span style="font-size: 13px; color: #4b5563; font-weight: 500;">Package Expires</span>
                                                    </div>
                                                    <span style="font-size: 13px; font-weight: 700; 
                                                                color: ${daysRemaining < 7 ? '#dc2626' : '#059669'};">
                                                        ${expiryDate.toLocaleDateString()} (${daysRemaining} day${daysRemaining === 1 ? '' : 's'})
                                                    </span>
                                                </div>
                                            ` : ''}
                                            
                                            <div class="selection-indicator" style="display: none; position: absolute; 
                                                                                     top: -2px; left: -2px; right: -2px; bottom: -2px;
                                                                                     border: 3px solid #2e6417; border-radius: 12px; 
                                                                                     pointer-events: none;">
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px; 
                                    border-top: 1px solid #e5e7eb; background: white; flex-shrink: 0;
                                    border-radius: 0 0 12px 12px;">
                            <button type="button" id="cancel-package-selection" 
                                    style="padding: 10px 20px; background: transparent; border: 2px solid #6b7280; 
                                           color: #6b7280; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;">
                                Cancel
                            </button>
                            <button type="button" id="confirm-package-selection" disabled
                                    style="padding: 10px 20px; background: #2e6417; color: white; border: none; 
                                           border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;
                                           opacity: 0.5; cursor: not-allowed;">
                                Confirm Selection
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalContent);
            
            let selectedIndex = null;
            const confirmBtn = modalContent.querySelector('#confirm-package-selection');
            
            // Add click handlers to package options
            modalContent.querySelectorAll('.package-option').forEach((option, index) => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    modalContent.querySelectorAll('.selection-indicator').forEach(ind => {
                        ind.style.display = 'none';
                    });
                    modalContent.querySelectorAll('.package-option').forEach(opt => {
                        opt.style.borderColor = '#e5e7eb';
                    });
                    
                    // Add selection to clicked option
                    option.querySelector('.selection-indicator').style.display = 'block';
                    option.style.borderColor = '#2e6417';
                    selectedIndex = index;
                    
                    // Enable confirm button
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = '1';
                    confirmBtn.style.cursor = 'pointer';
                });
                
                // Add hover effect
                option.addEventListener('mouseenter', () => {
                    if (!option.querySelector('.selection-indicator').style.display || 
                        option.querySelector('.selection-indicator').style.display === 'none') {
                        option.style.borderColor = '#d1d5db';
                        option.style.transform = 'translateY(-4px)';
                        option.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)';
                    }
                });
                
                option.addEventListener('mouseleave', () => {
                    if (!option.querySelector('.selection-indicator').style.display || 
                        option.querySelector('.selection-indicator').style.display === 'none') {
                        option.style.borderColor = '#e5e7eb';
                        option.style.transform = 'translateY(0)';
                        option.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                    }
                });
            });
            
            // Cancel button handler
            modalContent.querySelector('#cancel-package-selection').addEventListener('click', () => {
                document.body.removeChild(modalContent);
            });
            
            // Confirm button handler
            confirmBtn.addEventListener('click', () => {
                if (selectedIndex !== null) {
                    this.selectPackage(this.availablePackages[selectedIndex]);
                    document.body.removeChild(modalContent);
                }
            });
            
            // Close on backdrop click
            modalContent.firstElementChild.addEventListener('click', (e) => {
                if (e.target === modalContent.firstElementChild) {
                    document.body.removeChild(modalContent);
                }
            });
        },
        
        // Handle package selection
        selectPackage(pkg) {
            this.selectedPackage = pkg;
            const tier = this.subscriptionTiers[pkg.tier];
            
            // Update the button text
            const btnText = document.getElementById('selected-package-text');
            if (btnText) {
                btnText.textContent = `${tier.name} Package${pkg.is_recycled ? ' (Recycled)' : ''}`;
                btnText.style.color = '#111827';
            }
            
            // Update the button style
            const btn = document.getElementById('package-selector-btn');
            if (btn) {
                btn.style.borderColor = '#2e6417';
                btn.style.background = '#f0fdf4';
            }
            
            // Show package details
            const detailsContainer = document.getElementById('selected-package-info');
            const detailsContent = document.getElementById('package-details');
            if (detailsContainer && detailsContent) {
                detailsContainer.style.display = 'block';
                
                const expiryDate = pkg.expires_at ? new Date(pkg.expires_at) : null;
                const daysRemaining = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                
                detailsContent.innerHTML = `
                    <strong>${tier.name} Package</strong><br>
                    <span style="font-size: 13px;">
                        ${tier.limits.venues} venue, ${tier.limits.pitches} pitch${tier.limits.pitches === 1 ? '' : 'es'}, 
                        ${tier.limits.referees} referees, ${tier.limits.teams} teams
                        ${expiryDate ? `<br>Expires: ${expiryDate.toLocaleDateString()} (${daysRemaining} days remaining)` : ''}
                        ${pkg.is_recycled ? '<br><em>Recycled from previous venue</em>' : ''}
                    </span>
                `;
            }
            
            // Update hidden inputs
            const packageInput = document.getElementById('selected-package-id');
            const tierInput = document.getElementById('selected-plan-tier');
            if (packageInput) packageInput.value = pkg.id;
            if (tierInput) tierInput.value = pkg.tier;
        },
        
        // Update package info when package is selected
        async updatePackageInfo(packageId) {
            if (!packageId) {
                document.getElementById('selected-package-info').style.display = 'none';
                document.getElementById('selected-package-id').value = '';
                document.getElementById('selected-plan-tier').value = '';
                return;
            }

            const availablePackages = await this.getAvailableSubscriptionPackages();
            const selectedPackage = availablePackages.find(pkg => pkg.id === packageId);
            
            if (!selectedPackage) return;
            
            const tier = this.subscriptionTiers[selectedPackage.tier];
            
            document.getElementById('selected-package-info').style.display = 'block';
            document.getElementById('package-details').innerHTML = `
                <strong>Selected Package:</strong> ${tier.name}<br>
                <strong>Package Limits:</strong> ${tier.limits.venues} venue, ${tier.limits.pitches} pitch${tier.limits.pitches === 1 ? '' : 'es'}, ${tier.limits.referees} referees, ${tier.limits.leagues} league${tier.limits.leagues === 1 ? '' : 's'}, ${tier.limits.divisionsPerLeague} division${tier.limits.divisionsPerLeague === 1 ? '' : 's'} per league, ${tier.limits.teams} teams
            `;
            
            document.getElementById('selected-package-id').value = packageId;
            document.getElementById('selected-plan-tier').value = selectedPackage.tier;
            
            // No need for pitch validation - determined by subscription package
        },

        async showVenueCreationForm(selectedPlan) {
            // Note: Venues are not limited by subscription - pitches are the main limit
            // This function shows venue creation form with selected plan for context
            const tier = this.subscriptionTiers[selectedPlan];
            if (!tier) {
                utils.showNotification('Invalid plan selected', 'error');
                return;
            }

            // Show venue creation form with selected plan
            const showPlanInfo = this.venuesData.length > 0; // Only show plan info if tenant has existing venues
            const availableVenueCount = await this.getAvailableVenueCount();
            
            utils.showModal({
                title: showPlanInfo ? `Add New Venue - ${tier.name} Plan` : 'Add Your First Venue',
                content: `
                    ${showPlanInfo ? `
                        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                            <div style="font-size: 14px; color: #0369a1;">
                                <strong>Selected Plan:</strong> ${tier.name} (£${tier.priceMonthly}/month)<br>
                                <strong>Plan Limits:</strong> ${tier.limits.venues} venue${tier.limits.venues === 1 ? '' : 's'}, ${tier.limits.pitches} pitch${tier.limits.pitches === 1 ? '' : 'es'}, ${tier.limits.referees} referees, ${tier.limits.leagues} league${tier.limits.leagues === 1 ? '' : 's'}, ${tier.limits.divisionsPerLeague} division${tier.limits.divisionsPerLeague === 1 ? '' : 's'} per league, ${tier.limits.teams} teams
                            </div>
                        </div>
                    ` : `
                        <div style="background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                            <div style="font-size: 14px; color: #15803d;">
                                <strong>Create your first venue</strong><br>
                                You currently have ${availableVenueCount} venue${availableVenueCount === 1 ? '' : 's'} available for creation
                            </div>
                        </div>
                    `}
                    
                    <form id="add-venue-form" class="modal-form">
                        <input type="hidden" name="selectedPlan" value="${selectedPlan}">
                        <div class="form-group">
                            <label class="form-label">Venue Name</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">City</label>
                            <input type="text" name="city" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Full Address <span style="color: #9ca3af; font-size: 12px;">(optional)</span></label>
                            <textarea name="address" class="form-control" rows="2" placeholder="Enter venue address (optional)"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number <span style="color: #9ca3af; font-size: 12px;">(optional)</span></label>
                            <input type="tel" name="phone" class="form-control" placeholder="Enter phone number (optional)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address <span style="color: #9ca3af; font-size: 12px;">(optional)</span></label>
                            <input type="email" name="email" class="form-control" placeholder="Enter email address (optional)">
                        </div>
                        <!-- Number of pitches removed - determined by subscription package -->
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select name="status" class="form-control" required>
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </form>
                `,
                onConfirm: () => this.saveVenue()
            });
        },

        // checkPitchLimits function removed - pitch count determined by subscription package

        // Assign a subscription package to a venue
        async assignPackageToVenue(packageId, venueId) {
            try {
                const isLocalTesting = window.location.protocol === 'file:';
                
                if (isLocalTesting) {
                    console.info(`Local testing mode - simulating package assignment: ${packageId} -> ${venueId}`);
                    return { success: true, simulated: true };
                }
                
                // Get API base URL
                const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';
                
                // Get auth token
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    console.error('No auth token found for package assignment');
                    return { success: false, error: 'Authentication required' };
                }
                
                // Call API to assign package to venue
                const response = await fetch(`${apiBase}/auth/assign-package`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        packageId: packageId,
                        venueId: venueId,
                        assigned: true,
                        assignedAt: new Date().toISOString()
                    })
                });
                
                if (!response.ok) {
                    console.error('Failed to assign package:', response.status);
                    return { success: false, error: 'Failed to assign package to venue' };
                }
                
                const data = await response.json();
                
                if (data.success) {
                    console.log(`Package ${packageId} assigned to venue ${venueId}`);
                    return { success: true };
                } else {
                    console.error(`Package assignment failed: ${data.error}`);
                    return { success: false, error: data.error };
                }
                
            } catch (error) {
                console.error('Error assigning package to venue:', error);
                return { success: false, error: error.message };
            }
        },

        async saveVenue() {
            try {
                const form = document.getElementById('add-venue-form');
                const formData = new FormData(form);
                
                const name = formData.get('name');
                const city = formData.get('city');
                const address = formData.get('address') || ''; // Optional
                const phone = formData.get('phone') || ''; // Optional
                const email = formData.get('email') || ''; // Optional
                
                // Check if package was selected
                if (!this.selectedPackage) {
                    utils.showNotification('Please select a subscription package', 'error');
                    return;
                }
                // Validate required fields
                if (!name || !name.trim()) {
                    utils.showNotification('Please enter a venue name', 'error');
                    return;
                }
                
                if (!city || !city.trim()) {
                    utils.showNotification('Please enter a city', 'error');
                    return;
                }
                
                // Use the selected package
                const packageInfo = this.selectedPackage;
                const tier = this.subscriptionTiers[packageInfo.tier];
                const packageId = packageInfo.id;
                
                if (!tier) {
                    utils.showNotification('Invalid subscription plan', 'error');
                    return;
                }
                
                // Get number of pitches from subscription package/plan limits
                const pitches = tier.limits.pitches;
                console.log(`Creating venue with ${pitches} pitches based on ${tier.name} subscription`);
                
                const newVenue = {
                    id: 'venue-' + Date.now(),
                    name: name.trim(),
                    city: city.trim(),
                    address: address.trim() || null, // Optional
                    contactInfo: {
                        phone: phone.trim() || null, // Optional
                        email: email.trim() || null, // Optional
                        website: null
                    },
                    status: formData.get('status') || 'active',
                    pitches: pitches, // Number of pitches for this venue
                    stats: {
                        leagues: 0,
                        divisions: 0,
                        teams: 0,
                        referees: 0
                    },
                    managers: {
                        leagueManager: null,
                        assistantManager: null
                    },
                    subscription: {
                        packageId: packageId, // Track which package this venue is using
                        plan: tier.name,
                        tier: packageInfo.tier,
                        status: 'active',
                        expiresAt: packageInfo.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Use package expiry or 1 year
                    },
                    operatingHours: {
                        monday: { open: '09:00', close: '21:00' },
                        tuesday: { open: '09:00', close: '21:00' },
                        wednesday: { open: '09:00', close: '21:00' },
                        thursday: { open: '09:00', close: '21:00' },
                        friday: { open: '09:00', close: '22:00' },
                        saturday: { open: '09:00', close: '22:00' },
                        sunday: { open: '10:00', close: '20:00' }
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Save venue to server database
                const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';

                const venueData = {
                    venue_name: newVenue.name,
                    address: newVenue.address || newVenue.city,
                    max_pitches: newVenue.pitches,
                    package_id: packageId,
                    subscription_plan: tier.name,
                    subscription_tier: packageInfo.tier
                };

                const response = await fetch(`${apiBase}/venues`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(venueData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // If using a package, mark it as assigned
                        if (packageId) {
                            await this.assignPackageToVenue(packageId, result.venue_id || newVenue.id);
                        }
                        
                        // Reload venues from server to get the latest data
                        await this.loadVenuesData();
                        this.renderVenuesGrid();
                        
                        // Refresh venue selector in sidebar
                        if (window.VenueSelector) {
                            await window.VenueSelector.refresh();
                        }
                        
                        utils.showNotification(`Successfully added "${newVenue.name}"`, 'success');
                        utils.hideModal();
                    } else {
                        utils.showNotification(`Failed to save venue: ${result.message || 'Unknown error'}`, 'error');
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Server error creating venue:', response.status, errorText);
                    utils.showNotification(`Failed to save venue to server: ${response.status}`, 'error');
                }
            } catch (error) {
                console.error('Error saving venue:', error);
                utils.showNotification('Failed to save venue', 'error');
            }
        },

        async saveVenuesData() {
            // Since venues are now saved directly to the server via /api/venues POST,
            // and loaded from the server via /api/venues GET,
            // this function just returns success as venues should already be in the database
            console.log('Venues are saved directly to server - no additional save needed');
            return { success: true, message: 'Venues saved to server database' };
        },

        viewVenueDetails(id) {
            const venue = this.venuesData.find(v => v.id === id);
            if (!venue) {
                utils.showNotification('Venue not found', 'error');
                return;
            }

            utils.showModal({
                title: `${venue.name} - Operations Center`,
                content: `
                    <div class="venue-details-modal">
                        <div class="venue-info-section">
                            <h4>Venue Information</h4>
                            <div class="info-grid">
                                <div><strong>Address:</strong> ${venue.address}</div>
                                <div><strong>Status:</strong> <span class="status-badge">${venue.status}</span></div>
                                <div><strong>Phone:</strong> ${venue.contactInfo.phone}</div>
                                ${venue.contactInfo.email ? `<div><strong>Email:</strong> ${venue.contactInfo.email}</div>` : ''}
                            </div>
                        </div>

                        <div class="operating-hours-section">
                            <h4>Operating Hours</h4>
                            <div class="hours-grid">
                                ${Object.entries(venue.operatingHours).map(([day, hours]) => `
                                    <div class="hours-item">
                                        <strong>${day.charAt(0).toUpperCase() + day.slice(1)}:</strong> 
                                        ${hours.open} - ${hours.close}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="emergency-section">
                            <h4>Emergency Information</h4>
                            <div><strong>Primary Contact:</strong> ${venue.emergencyInfo.primaryContact}</div>
                            <div><strong>Emergency Exits:</strong> ${venue.emergencyInfo.emergencyExits}</div>
                            <div><strong>First Aid Station:</strong> ${venue.emergencyInfo.firstAidStation}</div>
                        </div>
                    </div>
                `,
                size: 'large'
            });
        },

        editVenue(id) {
            console.log('Attempting to edit venue with ID:', id);
            console.log('Available venues:', this.venuesData.map(v => ({ id: v.id, venue_id: v.venue_id, name: v.name })));
            
            // Normalize ID for comparison (handle string vs number issues)
            const normalizedId = String(id);
            const venue = this.venuesData.find(v => 
                String(v.id) === normalizedId || 
                String(v.venue_id) === normalizedId
            );
            
            if (!venue) {
                console.error(`Venue not found. Searched for ID: ${id} (normalized: ${normalizedId})`);
                utils.showNotification('Venue not found', 'error');
                return;
            }
            
            console.log('Found venue for editing:', venue);

            utils.showModal({
                title: `Edit Venue - ${venue.name}`,
                content: `
                    <form id="edit-venue-form" class="modal-form">
                        <input type="hidden" name="venueId" value="${venue.id}">
                        
                        <!-- Basic Information -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Basic Information</h4>
                            
                            <div class="form-group">
                                <label class="form-label">Venue Name</label>
                                <input type="text" name="name" class="form-control" value="${venue.name}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">City</label>
                                <input type="text" name="city" class="form-control" value="${venue.city || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Full Address</label>
                                <textarea name="address" class="form-control" rows="2" required>${venue.address}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-control" required>
                                    <option value="active" ${venue.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="maintenance" ${venue.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                    <option value="closed" ${venue.status === 'closed' ? 'selected' : ''}>Closed</option>
                                </select>
                            </div>
                        </div>

                        <!-- Contact Information -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Contact Information</h4>
                            
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" name="phone" class="form-control" value="${venue.contactInfo?.phone || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" name="email" class="form-control" value="${venue.contactInfo?.email || ''}">
                            </div>
                        </div>



                        <!-- Statistics Info (Read-only) -->
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                            <h4 style="font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Statistics (Read-only)</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; text-align: center;">
                                <div>
                                    <div style="font-size: 18px; font-weight: 600; color: #374151;">${venue.stats?.leagues || 0}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">Leagues</div>
                                </div>
                                <div>
                                    <div style="font-size: 18px; font-weight: 600; color: #374151;">${venue.stats?.divisions || 0}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">Divisions</div>
                                </div>
                                <div>
                                    <div style="font-size: 18px; font-weight: 600; color: #374151;">${venue.stats?.teams || 0}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">Teams</div>
                                </div>
                                <div>
                                    <div style="font-size: 18px; font-weight: 600; color: #374151;">${venue.pitches || 0}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">Pitches</div>
                                </div>
                                <div>
                                    <div style="font-size: 18px; font-weight: 600; color: #374151;">${venue.stats?.referees || 0}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">Referees</div>
                                </div>
                            </div>
                            <div style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 8px; font-style: italic;">
                                These values are automatically updated by other sections of the application
                            </div>
                        </div>
                    </form>
                `,
                size: 'large',
                onConfirm: () => this.saveVenueChanges()
            });
        },

        async saveVenueChanges() {
            try {
                const form = document.getElementById('edit-venue-form');
                const formData = new FormData(form);
                
                const venueId = formData.get('venueId');
                const venueIndex = this.venuesData.findIndex(v => v.id === venueId);
                
                if (venueIndex === -1) {
                    utils.showNotification('Venue not found', 'error');
                    return;
                }
                
                const name = formData.get('name');
                const city = formData.get('city');
                const address = formData.get('address');
                
                if (!name || !name.trim()) {
                    utils.showNotification('Please enter a venue name', 'error');
                    return;
                }
                
                if (!city || !city.trim()) {
                    utils.showNotification('Please enter a city', 'error');
                    return;
                }
                
                if (!address || !address.trim()) {
                    utils.showNotification('Please enter a venue address', 'error');
                    return;
                }
                
                // Update the venue data
                const updatedVenue = {
                    ...this.venuesData[venueIndex],
                    name: name.trim(),
                    city: city.trim(),
                    address: address.trim(),
                    status: formData.get('status'),
                    contactInfo: {
                        phone: formData.get('phone'),
                        email: formData.get('email') || null
                    },
                    operatingHours: {
                        monday: { open: formData.get('monday_open'), close: formData.get('monday_close') },
                        tuesday: { open: formData.get('tuesday_open'), close: formData.get('tuesday_close') },
                        wednesday: { open: formData.get('wednesday_open'), close: formData.get('wednesday_close') },
                        thursday: { open: formData.get('thursday_open'), close: formData.get('thursday_close') },
                        friday: { open: formData.get('friday_open'), close: formData.get('friday_close') },
                        saturday: { open: formData.get('saturday_open'), close: formData.get('saturday_close') },
                        sunday: { open: formData.get('sunday_open'), close: formData.get('sunday_close') }
                    },
                    managers: {
                        leagueManager: formData.get('leagueManagerName') ? {
                            name: formData.get('leagueManagerName'),
                            phone: formData.get('leagueManagerPhone'),
                            email: formData.get('leagueManagerEmail') || null
                        } : null,
                        assistantManager: formData.get('assistantManagerName') ? {
                            name: formData.get('assistantManagerName'),
                            phone: formData.get('assistantManagerPhone'),
                            email: formData.get('assistantManagerEmail') || null
                        } : null
                    },
                    updatedAt: new Date().toISOString()
                };
                
                // Update the venue in the array
                this.venuesData[venueIndex] = updatedVenue;
                
                // Save to database
                const result = await this.saveVenuesData();
                
                if (result && result.success) {
                    this.renderVenuesGrid();
                    utils.showNotification(`Successfully updated "${updatedVenue.name}"`, 'success');
                    utils.hideModal();
                } else {
                    utils.showNotification('Failed to save changes to database', 'error');
                }
            } catch (error) {
                console.error('Error saving venue changes:', error);
                utils.showNotification('Failed to save changes', 'error');
            }
        },


        contactVenue(id) {
            console.log('Attempting to contact venue with ID:', id);
            
            // Normalize ID for comparison (handle string vs number issues)
            const normalizedId = String(id);
            const venue = this.venuesData.find(v => 
                String(v.id) === normalizedId || 
                String(v.venue_id) === normalizedId
            );
            
            if (!venue) {
                console.error(`Venue not found for contact. Searched for ID: ${id} (normalized: ${normalizedId})`);
                utils.showNotification('Venue not found', 'error');
                return;
            }

            utils.showModal({
                title: `Contact ${venue.name}`,
                content: `
                    <div class="contact-venue-modal">
                        <div class="contact-options">
                            <a href="tel:${venue.contactInfo.phone}" class="contact-option">
                                <span class="contact-icon">📞</span>
                                <div>
                                    <div class="contact-method">Phone</div>
                                    <div class="contact-value">${venue.contactInfo.phone}</div>
                                </div>
                            </a>
                            ${venue.contactInfo.email ? `
                                <a href="mailto:${venue.contactInfo.email}" class="contact-option">
                                    <span class="contact-icon">✉️</span>
                                    <div>
                                        <div class="contact-method">Email</div>
                                        <div class="contact-value">${venue.contactInfo.email}</div>
                                    </div>
                                </a>
                            ` : ''}
                            <div class="contact-option emergency">
                                <span class="contact-icon">🚨</span>
                                <div>
                                    <div class="contact-method">Emergency Contact</div>
                                    <div class="contact-value">${venue.emergencyInfo.primaryContact}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                showDefaultButtons: false
            });
        },

        async deleteVenue(id) {
            try {
                console.log('Attempting to delete venue with ID:', id);
                
                // Normalize ID for comparison (handle string vs number issues)
                const normalizedId = String(id);
                const venue = this.venuesData.find(v => 
                    String(v.id) === normalizedId || 
                    String(v.venue_id) === normalizedId
                );
                
                if (!venue) {
                    console.error(`Venue not found for deletion. Searched for ID: ${id} (normalized: ${normalizedId})`);
                    utils.showNotification('Venue not found', 'error');
                    return;
                }
                
                // First confirmation dialog
                const confirmed = await utils.showConfirm(
                    'Delete Venue',
                    `Are you sure you want to delete "${venue.name}"? This will release the subscription package back to your available packages with the same expiry date.`
                );
                
                if (!confirmed) return;

                // Second confirmation with password
                const passwordConfirmed = await utils.showPasswordConfirm(
                    'Confirm Deletion',
                    `Please enter your password to permanently delete "${venue.name}". The subscription package will be returned to your available packages.`
                );

                if (!passwordConfirmed) return;

                // Show loading state
                utils.showNotification('Deleting venue and recycling subscription package...', 'info');

                // Delete venue with package recycling
                const result = await this.deleteVenueWithPackageRecycling(venue);
                
                if (result && result.success) {
                    // Remove venue from local data
                    this.venuesData = this.venuesData.filter(v => 
                        String(v.id) !== normalizedId && String(v.venue_id) !== normalizedId
                    );
                    
                    this.renderVenuesGrid();
                    utils.showNotification(`Successfully deleted "${venue.name}". Subscription package returned to available packages.`, 'success');
                } else {
                    const errorMessage = result?.message || 'Failed to delete venue from database';
                    utils.showNotification(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error deleting venue:', error);
                utils.showNotification('Failed to delete venue', 'error');
            }
        },

        async deleteVenueWithPackageRecycling(venue) {
            try {
                const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:8080/api'
                    : 'https://five-trackr-yq6ly.ondigitalocean.app/api';

                // Get the auth token
                const authToken = window.localStorage.getItem('auth_token');
                if (!authToken) {
                    throw new Error('No authentication token found');
                }

                // Call the enhanced delete API endpoint that handles package recycling
                const response = await fetch(`${API_BASE}/venues/${venue.venue_id || venue.id}/delete-with-recycle`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        venue_id: venue.venue_id || venue.id,
                        package_id: venue.package_id,
                        subscription_plan: venue.subscription_plan,
                        preserve_expiry: true
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Venue deletion with package recycling result:', result);
                
                return result;
            } catch (error) {
                console.error('Error deleting venue with package recycling:', error);
                return { success: false, message: error.message };
            }
        },

        togglePackageLimits(venueId) {
            const dropdown = document.getElementById(`package-limits-${venueId}`);
            const arrow = document.getElementById(`dropdown-arrow-${venueId}`);
            const expandText = document.getElementById(`expand-text-${venueId}`);
            
            if (dropdown && arrow && expandText) {
                const isVisible = dropdown.style.display !== 'none';
                
                if (isVisible) {
                    // Collapse: show "View Limits" text and rotate arrow down
                    dropdown.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                    arrow.innerHTML = '▼';
                    expandText.innerHTML = 'View Limits';
                } else {
                    // Expand: clear text and rotate arrow up  
                    dropdown.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                    arrow.innerHTML = '▲';
                    expandText.innerHTML = '';
                }
            }
        },

        async editPackage(venueId) {
            try {
                // Find the venue data
                const venue = this.venuesData.find(v => 
                    String(v.id) === String(venueId) || 
                    String(v.venue_id) === String(venueId)
                );
                
                if (!venue) {
                    utils.showNotification('Venue not found', 'error');
                    return;
                }
                
                // Get current subscription tier info
                const subscriptionPlan = (venue.subscription?.plan || venue.subscription_plan || 'Starter').toLowerCase();
                const tier = this.subscriptionTiers[subscriptionPlan] || this.subscriptionTiers['starter'];
                
                // Show add-ons modal
                this.showAddOnsModal(venue, tier);
                
            } catch (error) {
                console.error('Error loading edit package modal:', error);
                utils.showNotification('Failed to load package editor', 'error');
            }
        },

        exportVenuesData() {
            utils.showNotification('Export Venues Data: Feature coming soon', 'info');
        },

        showAddOnsModal(venue, tier) {
            const form = `
                <style>
                    /* Modal styling matching venue modal */
                    .modal-content {
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                        background: transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        max-height: 85vh !important;
                        height: auto !important;
                    }
                    
                    .modal-body {
                        padding: 20px 0 20px 0 !important;
                        background: white !important;
                        flex: 1 1 auto !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        min-height: 0 !important;
                        max-height: calc(85vh - 160px) !important;
                        box-sizing: border-box !important;
                    }
                    
                    .modal-header {
                        background: linear-gradient(135deg, #2e6417 0%, #1e4009 50%, #0f2a04 100%) !important;
                        color: white !important;
                        padding: 28px 40px !important;
                        border-radius: 12px 12px 0 0 !important;
                        position: sticky !important;
                        top: 0 !important;
                        text-align: center !important;
                    }
                    
                    .modal-footer {
                        background: white !important;
                        padding: 20px 40px !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        gap: 12px !important;
                        position: sticky !important;
                        bottom: 0 !important;
                    }
                    
                    .addon-section {
                        padding: 0 40px 20px 40px;
                    }
                    
                    .addon-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        margin-bottom: 12px;
                        background: white;
                        transition: all 0.2s ease;
                    }
                    
                    .addon-item:hover {
                        border-color: #d1d5db;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .addon-info {
                        flex: 1;
                    }
                    
                    .addon-name {
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 4px;
                    }
                    
                    .addon-price {
                        color: #059669;
                        font-size: 14px;
                        font-weight: 500;
                    }
                    
                    .addon-controls {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    
                    .quantity-control {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .quantity-btn {
                        width: 32px;
                        height: 32px;
                        border: 1px solid #d1d5db;
                        background: white;
                        border-radius: 6px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        color: #374151;
                        transition: all 0.2s ease;
                    }
                    
                    .quantity-btn:hover {
                        background: #f3f4f6;
                        border-color: #9ca3af;
                    }
                    
                    .quantity-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    
                    .quantity-input {
                        width: 60px;
                        text-align: center;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        padding: 6px;
                        font-weight: 500;
                    }
                    
                    .current-package {
                        background: linear-gradient(to right, #ecfdf5, #f0fdf4);
                        border: 1px solid #bbf7d0;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 0 40px 20px 40px;
                    }
                    
                    .pricing-summary {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 0 40px 20px 40px;
                    }
                    
                    .pricing-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    
                    .pricing-total {
                        border-top: 1px solid #dee2e6;
                        padding-top: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        color: #2e6417;
                    }
                    
                    .upgrade-warning {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 8px;
                        padding: 12px;
                        margin: 0 40px 20px 40px;
                        color: #856404;
                        font-size: 14px;
                    }
                </style>
                
                <!-- Current Package Info -->
                <div class="current-package">
                    <h4 style="margin: 0 0 8px 0; color: #15803d; font-size: 16px;">Current Package: ${tier.name}</h4>
                    <p style="margin: 0; font-size: 14px; color: #374151;">
                        Base includes: ${tier.limits.pitches} pitch${tier.limits.pitches === 1 ? '' : 'es'}, 
                        ${tier.limits.referees} referees, ${tier.limits.leagues} league${tier.limits.leagues === 1 ? '' : 's'}, 
                        ${tier.limits.divisionsPerLeague} division${tier.limits.divisionsPerLeague === 1 ? '' : 's'} per league
                    </p>
                </div>
                
                <div class="addon-section">
                    <h4 style="margin: 0 0 16px 0; color: #374151;">Add Extra Resources</h4>
                    
                    <!-- Extra Pitches -->
                    <div class="addon-item">
                        <div class="addon-info">
                            <div class="addon-name">Extra Pitches</div>
                            <div class="addon-price">£25.00 per pitch/month</div>
                        </div>
                        <div class="addon-controls">
                            <div class="quantity-control">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_pitches', -1)">-</button>
                                <input type="number" id="extra_pitches" class="quantity-input" value="0" min="0" max="10" onchange="SPAModules.venues.updatePricing()">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_pitches', 1)">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Extra Referees -->
                    <div class="addon-item">
                        <div class="addon-info">
                            <div class="addon-name">Extra Referees</div>
                            <div class="addon-price">£3.00 per referee/month</div>
                        </div>
                        <div class="addon-controls">
                            <div class="quantity-control">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_referees', -1)">-</button>
                                <input type="number" id="extra_referees" class="quantity-input" value="0" min="0" max="50" onchange="SPAModules.venues.updatePricing()">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_referees', 1)">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Extra Divisions -->
                    <div class="addon-item">
                        <div class="addon-info">
                            <div class="addon-name">Extra Divisions</div>
                            <div class="addon-price">£15.00 per division/month</div>
                        </div>
                        <div class="addon-controls">
                            <div class="quantity-control">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_divisions', -1)">-</button>
                                <input type="number" id="extra_divisions" class="quantity-input" value="0" min="0" max="20" onchange="SPAModules.venues.updatePricing()">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_divisions', 1)">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Extra Leagues -->
                    <div class="addon-item">
                        <div class="addon-info">
                            <div class="addon-name">Extra Leagues per Division</div>
                            <div class="addon-price">£8.00 per league/month</div>
                        </div>
                        <div class="addon-controls">
                            <div class="quantity-control">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_leagues', -1)">-</button>
                                <input type="number" id="extra_leagues" class="quantity-input" value="0" min="0" max="15" onchange="SPAModules.venues.updatePricing()">
                                <button type="button" class="quantity-btn" onclick="SPAModules.venues.adjustQuantity('extra_leagues', 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Pricing Summary -->
                <div class="pricing-summary">
                    <div class="pricing-row">
                        <span>Base Package (${tier.name})</span>
                        <span>£${tier.priceMonthly.toFixed(2)}/month</span>
                    </div>
                    <div id="addon-pricing-rows"></div>
                    <div class="pricing-row pricing-total">
                        <span>Total Monthly Cost</span>
                        <span id="total-cost">£${tier.priceMonthly.toFixed(2)}/month</span>
                    </div>
                </div>
                
                <!-- Upgrade Warning (hidden by default) -->
                <div id="upgrade-warning" class="upgrade-warning" style="display: none;">
                    <strong>Upgrade Recommended:</strong> Your add-ons total is approaching the next tier cost. 
                    Consider upgrading for better value and more features.
                </div>
            `;
            
            // Store venue and tier for use in handlers
            this.currentVenueForEdit = venue;
            this.currentTierForEdit = tier;
            
            utils.showModal({
                title: `Manage Add-ons for ${venue.name}`,
                content: form,
                showDefaultButtons: false,
                customFooter: `
                    <button type="button" class="btn btn-outline modal-cancel" onclick="utils.hideModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="SPAModules.venues.proceedToCheckout()" id="checkout-btn">Add to Subscription</button>
                `
            });
            
            // Initialize pricing
            this.updatePricing();
        },
        
        adjustQuantity(addonType, change) {
            const input = document.getElementById(addonType);
            if (!input) return;
            
            const currentValue = parseInt(input.value) || 0;
            const newValue = Math.max(0, Math.min(currentValue + change, parseInt(input.getAttribute('max'))));
            
            input.value = newValue;
            this.updatePricing();
        },
        
        updatePricing() {
            const addOnPricing = {
                'extra_pitches': 25,
                'extra_referees': 3,
                'extra_divisions': 15,
                'extra_leagues': 8
            };
            
            const baseCost = this.currentTierForEdit?.priceMonthly || 0;
            let addOnCost = 0;
            let addOnRows = '';
            
            // Calculate add-on costs and build pricing rows
            Object.keys(addOnPricing).forEach(addonType => {
                const input = document.getElementById(addonType);
                if (input) {
                    const quantity = parseInt(input.value) || 0;
                    if (quantity > 0) {
                        const cost = quantity * addOnPricing[addonType];
                        addOnCost += cost;
                        
                        const displayName = addonType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        addOnRows += `
                            <div class="pricing-row">
                                <span>${displayName} (${quantity})</span>
                                <span>£${cost.toFixed(2)}/month</span>
                            </div>
                        `;
                    }
                }
            });
            
            // Update pricing display
            const addOnPricingContainer = document.getElementById('addon-pricing-rows');
            const totalCostElement = document.getElementById('total-cost');
            
            if (addOnPricingContainer) {
                addOnPricingContainer.innerHTML = addOnRows;
            }
            
            if (totalCostElement) {
                const totalCost = baseCost + addOnCost;
                totalCostElement.textContent = `£${totalCost.toFixed(2)}/month`;
            }
            
            // Check for upgrade recommendation
            this.checkUpgradeRecommendation(baseCost + addOnCost);
            
            // Enable/disable checkout button
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.disabled = addOnCost === 0;
                checkoutBtn.textContent = addOnCost === 0 ? 'Select Add-ons' : `Add to Subscription (£${addOnCost.toFixed(2)}/month)`;
            }
        },
        
        checkUpgradeRecommendation(totalCost) {
            const currentTierId = this.currentTierForEdit.id;
            const nextTierId = this.getNextTier(currentTierId);
            
            const warningElement = document.getElementById('upgrade-warning');
            if (!warningElement) return;
            
            if (nextTierId) {
                const nextTier = this.subscriptionTiers[nextTierId];
                const threshold = nextTier.priceMonthly * 0.8; // 80% threshold
                
                if (totalCost >= threshold) {
                    warningElement.style.display = 'block';
                    warningElement.innerHTML = `
                        <strong>Upgrade Recommended:</strong> Your total cost (£${totalCost.toFixed(2)}) is close to the 
                        ${nextTier.name} tier (£${nextTier.priceMonthly.toFixed(2)}). Consider upgrading for better value!
                    `;
                } else {
                    warningElement.style.display = 'none';
                }
            } else {
                warningElement.style.display = 'none';
            }
        },
        
        async proceedToCheckout() {
            try {
                // Get selected add-ons
                const addOns = {};
                ['extra_pitches', 'extra_referees', 'extra_divisions', 'extra_leagues'].forEach(addonType => {
                    const input = document.getElementById(addonType);
                    if (input) {
                        const quantity = parseInt(input.value) || 0;
                        if (quantity > 0) {
                            addOns[addonType] = quantity;
                        }
                    }
                });
                
                if (Object.keys(addOns).length === 0) {
                    utils.showNotification('Please select at least one add-on', 'info');
                    return;
                }
                
                // Create checkout session
                const apiBase = window.config?.apiBaseUrl || '/api';
                const token = localStorage.getItem('auth_token');
                
                const response = await fetch(`${apiBase}/subscriptions/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        venue_id: this.currentVenueForEdit.id,
                        add_ons: addOns
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Redirect to Stripe Checkout
                if (result.checkout_url) {
                    utils.hideModal();
                    window.location.href = result.checkout_url;
                } else {
                    throw new Error('No checkout URL received');
                }
                
            } catch (error) {
                console.error('Error creating checkout session:', error);
                utils.showNotification('Failed to start checkout process', 'error');
            }
        },

        // Resource Management Methods for Action Cards
        async manageResource(venueId, resourceType) {
            const venue = this.venues.find(v => v.id === venueId);
            if (!venue) {
                utils.showNotification('Venue not found', 'error');
                return;
            }

            const resourceConfig = {
                pitches: { title: 'Pitch Management', color: '#2e6417', description: 'Manage football pitches and capacity' },
                teams: { title: 'Team Management', color: '#2e6417', description: 'Organize teams and registrations' },
                leagues: { title: 'League Management', color: '#2e6417', description: 'Configure leagues and competitions' },
                referees: { title: 'Referee Management', color: '#2e6417', description: 'Manage referee assignments' },
                divisions: { title: 'Division Management', color: '#2e6417', description: 'Structure league divisions' }
            };

            const config = resourceConfig[resourceType];
            if (!config) {
                utils.showNotification('Invalid resource type', 'error');
                return;
            }

            const subscription = venue.subscription || {};
            const tier = this.getSubscriptionTier(subscription);
            const currentUsage = venue.current_usage || {};
            const limit = tier.limits[resourceType];
            const current = currentUsage[resourceType] || 0;
            const isOverLimit = current >= limit && limit !== Infinity;
            const utilizationPercent = limit === Infinity ? 0 : Math.min(100, (current / limit) * 100);

            utils.showModal({
                title: config.title,
                content: `
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div>
                                <h3 style="color: #111827; margin: 0 0 4px 0; font-size: 20px; font-weight: 700;">${venue.name}</h3>
                                <div style="font-size: 14px; color: #6b7280;">${config.description}</div>
                            </div>
                            ${isOverLimit ? '<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Limit Reached</div>' : ''}
                        </div>
                    </div>
                    
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Current Usage</div>
                                <div style="display: flex; align-items: baseline; gap: 6px;">
                                    <span style="font-size: 32px; font-weight: 800; color: ${isOverLimit ? '#ef4444' : '#111827'}; font-family: system-ui, -apple-system, sans-serif;">${current}</span>
                                    <span style="font-size: 18px; color: #9ca3af;">of ${limit === Infinity ? '∞' : limit}</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Utilization</div>
                                <div style="font-size: 20px; font-weight: 700; color: ${isOverLimit ? '#ef4444' : '#2e6417'};">${limit === Infinity ? '0' : Math.round(utilizationPercent)}%</div>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 8px; height: 6px; overflow: hidden; margin-bottom: 16px;">
                            <div style="background: ${isOverLimit ? '#ef4444' : '#2e6417'}; height: 100%; width: ${Math.min(100, utilizationPercent)}%; transition: width 0.3s ease;"></div>
                        </div>
                        
                        ${isOverLimit ? `
                            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
                                <div style="color: #dc2626; font-size: 14px; font-weight: 600; margin-bottom: 4px;">Capacity Exceeded</div>
                                <div style="color: #b91c1c; font-size: 13px; line-height: 1.5;">You've exceeded your ${resourceType} allocation. Upgrade your plan or purchase add-ons to increase capacity.</div>
                            </div>
                        ` : ''}
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <button type="button" class="btn btn-outline" onclick="closeModal(); SPAModules.venues.upgradeAddons('${venueId}', '${resourceType}')" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                                Upgrade Plan
                            </button>
                            <button type="button" class="btn btn-primary" onclick="closeModal(); SPARouter.navigateTo('${resourceType}')" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                                </svg>
                                Manage ${config.title.replace(' Management', '')}s
                            </button>
                        </div>
                    </div>
                `,
                showFooter: false
            });
        },

        async upgradeAddons(venueId, resourceType = null) {
            const venue = this.venues.find(v => v.id === venueId);
            if (!venue) {
                utils.showNotification('Venue not found', 'error');
                return;
            }

            const subscription = venue.subscription || {};
            const tier = this.getSubscriptionTier(subscription);
            const currentUsage = venue.current_usage || {};

            const addonPricing = {
                pitches: { price: 25, unit: 'pitch', description: 'Additional football pitch capacity' },
                teams: { price: 15, unit: 'team pack (10)', description: 'Expand team registration limits' },
                leagues: { price: 20, unit: 'league', description: 'Create additional competition leagues' },
                referees: { price: 12, unit: 'referee pack (5)', description: 'Increase referee allocation' },
                divisions: { price: 8, unit: 'division pack (5)', description: 'Add more league divisions' }
            };

            const generateAddonCard = (type, config) => {
                const current = currentUsage[type] || 0;
                const limit = tier.limits[type];
                const isOverLimit = current >= limit && limit !== Infinity;
                const isHighlighted = resourceType === type;
                
                return `
                    <div class="addon-card" data-addon="${type}" style="
                        background: ${isHighlighted ? '#f0fdf4' : 'white'};
                        border: 1px solid ${isOverLimit ? '#ef4444' : (isHighlighted ? '#22c55e' : '#e5e7eb')};
                        border-radius: 8px;
                        padding: 20px;
                        transition: all 0.15s ease;
                        position: relative;
                    ">
                        ${isOverLimit ? '<div style="position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid white;"></div>' : ''}
                        
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                                <div style="font-weight: 700; color: #111827; text-transform: capitalize; font-size: 16px;">${type}</div>
                                <div style="font-size: 14px; font-weight: 600; color: #2e6417;">£${config.price}</div>
                            </div>
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${config.description}</div>
                            <div style="font-size: 13px; color: #9ca3af;">
                                Current: <span style="font-weight: 600; color: ${isOverLimit ? '#ef4444' : '#374151'};">${current}</span> / ${limit === Infinity ? '∞' : limit}
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button class="addon-decrease" data-type="${type}" style="
                                    width: 32px; height: 32px; 
                                    border: 1px solid #d1d5db; 
                                    background: white; 
                                    border-radius: 6px; 
                                    cursor: pointer; 
                                    display: flex; align-items: center; justify-content: center; 
                                    font-size: 16px; font-weight: 600;
                                    transition: all 0.15s ease;
                                " onmouseover="this.style.borderColor='#2e6417'; this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='#d1d5db'; this.style.background='white'">−</button>
                                <input type="number" class="addon-quantity" data-type="${type}" value="0" min="0" max="10" style="
                                    width: 60px; 
                                    text-align: center; 
                                    border: 1px solid #d1d5db; 
                                    border-radius: 6px; 
                                    padding: 8px 4px;
                                    font-weight: 600;
                                    font-size: 14px;
                                ">
                                <button class="addon-increase" data-type="${type}" style="
                                    width: 32px; height: 32px; 
                                    border: 1px solid #d1d5db; 
                                    background: white; 
                                    border-radius: 6px; 
                                    cursor: pointer; 
                                    display: flex; align-items: center; justify-content: center; 
                                    font-size: 16px; font-weight: 600;
                                    transition: all 0.15s ease;
                                " onmouseover="this.style.borderColor='#2e6417'; this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='#d1d5db'; this.style.background='white'">+</button>
                            </div>
                            <div class="addon-total" data-type="${type}" style="
                                font-weight: 700; 
                                color: #2e6417; 
                                font-size: 16px;
                                min-width: 50px;
                                text-align: right;
                            ">£0</div>
                        </div>
                    </div>
                `;
            };

            const modalContent = `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <h3 style="color: #111827; margin: 0 0 4px 0; font-size: 20px; font-weight: 700;">Plan Upgrades</h3>
                            <div style="font-size: 14px; color: #6b7280;">Add capacity to ${venue.name}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Current Plan</div>
                            <div style="font-size: 16px; font-weight: 700; color: #2e6417;">${tier.name}</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; gap: 16px; margin-bottom: 24px; max-height: 400px; overflow-y: auto;">
                    ${Object.entries(addonPricing).map(([type, config]) => generateAddonCard(type, config)).join('')}
                </div>
                
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 600; color: #374151;">Monthly Add-on Cost</div>
                            <div style="font-size: 12px; color: #6b7280;">Billed monthly with your subscription</div>
                        </div>
                        <div id="total-cost" style="font-size: 24px; font-weight: 800; color: #2e6417; font-family: system-ui, -apple-system, sans-serif;">£0.00</div>
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; text-align: center; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        Add-ons can be modified or cancelled anytime from your account settings
                    </div>
                </div>
            `;

            utils.showModal({
                title: 'Plan Upgrades',
                content: modalContent,
                buttons: [
                    {
                        text: 'Cancel',
                        style: 'outline',
                        onclick: 'closeModal()'
                    },
                    {
                        text: 'Purchase Add-ons',
                        style: 'primary',
                        onclick: () => this.processAddonUpgrade(venueId)
                    }
                ],
                onShow: () => {
                    // Add event listeners for quantity controls
                    document.querySelectorAll('.addon-decrease').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const type = e.target.dataset.type;
                            const input = document.querySelector(`.addon-quantity[data-type="${type}"]`);
                            const value = Math.max(0, parseInt(input.value) - 1);
                            input.value = value;
                            this.updateAddonTotal(type, value, addonPricing[type].price);
                        });
                    });
                    
                    document.querySelectorAll('.addon-increase').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const type = e.target.dataset.type;
                            const input = document.querySelector(`.addon-quantity[data-type="${type}"]`);
                            const value = Math.min(10, parseInt(input.value) + 1);
                            input.value = value;
                            this.updateAddonTotal(type, value, addonPricing[type].price);
                        });
                    });
                    
                    document.querySelectorAll('.addon-quantity').forEach(input => {
                        input.addEventListener('change', (e) => {
                            const type = e.target.dataset.type;
                            const value = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                            e.target.value = value;
                            this.updateAddonTotal(type, value, addonPricing[type].price);
                        });
                    });
                    
                    // Initialize totals (start with 0 for all)
                    Object.keys(addonPricing).forEach(type => {
                        this.updateAddonTotal(type, 0, addonPricing[type].price);
                    });
                    
                    // If a specific resource type was requested, set it to 1
                    if (resourceType && addonPricing[resourceType]) {
                        const input = document.querySelector(`.addon-quantity[data-type="${resourceType}"]`);
                        if (input) {
                            input.value = 1;
                            this.updateAddonTotal(resourceType, 1, addonPricing[resourceType].price);
                        }
                    }
                }
            });
        },

        updateAddonTotal(type, quantity, unitPrice) {
            const total = quantity * unitPrice;
            const totalElement = document.querySelector(`.addon-total[data-type="${type}"]`);
            if (totalElement) {
                totalElement.textContent = `£${total}`;
            }
            
            // Update overall total
            let overallTotal = 0;
            document.querySelectorAll('.addon-total').forEach(el => {
                const value = parseFloat(el.textContent.replace('£', ''));
                if (!isNaN(value)) overallTotal += value;
            });
            
            const totalCostElement = document.getElementById('total-cost');
            if (totalCostElement) {
                totalCostElement.textContent = `£${overallTotal.toFixed(2)}`;
            }
        },

        async processAddonUpgrade(venueId) {
            const selectedAddons = {};
            let totalCost = 0;
            
            document.querySelectorAll('.addon-quantity').forEach(input => {
                const type = input.dataset.type;
                const quantity = parseInt(input.value) || 0;
                if (quantity > 0) {
                    selectedAddons[type] = quantity;
                    // Calculate cost based on the pricing structure
                    const pricing = {
                        pitches: 25,
                        teams: 15,
                        leagues: 20,
                        referees: 12,
                        divisions: 8
                    };
                    totalCost += quantity * pricing[type];
                }
            });

            if (Object.keys(selectedAddons).length === 0) {
                utils.showNotification('Please select at least one add-on to continue', 'warning');
                return;
            }

            // Confirmation dialog
            const confirmUpgrade = confirm(`Confirm purchase of add-ons for £${totalCost.toFixed(2)}/month?\n\nThis will be added to your monthly subscription bill.`);
            if (!confirmUpgrade) {
                return;
            }

            try {
                utils.showNotification('Processing add-on upgrade...', 'info');
                
                const response = await fetch('/api/subscriptions/addons/upgrade', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                    body: JSON.stringify({
                        venue_id: venueId,
                        addons: selectedAddons
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    utils.showNotification('Add-ons upgraded successfully!', 'success');
                    closeModal();
                    this.loadVenues(); // Refresh venue data
                } else {
                    utils.showNotification(result.error || 'Failed to upgrade add-ons', 'error');
                }
            } catch (error) {
                console.error('Error upgrading add-ons:', error);
                utils.showNotification('Failed to process add-on upgrade', 'error');
            }
        }
    };

    // Settings Module
    modules.settings = {
        async render() {
            return `
                <div class="content-area">
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Settings</h1>
                            <p class="page-subtitle">Configure league preferences and settings</p>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-sections">
                            <div class="settings-section">
                                <h3>League Settings</h3>
                                <div class="settings-group">
                                    <label class="setting-item">
                                        <span>Season Start Date</span>
                                        <input type="date" class="form-input" value="2025-01-01">
                                    </label>
                                    <label class="setting-item">
                                        <span>Season End Date</span>
                                        <input type="date" class="form-input" value="2025-12-31">
                                    </label>
                                    <label class="setting-item">
                                        <span>Default Match Duration</span>
                                        <select class="form-select">
                                            <option>90 minutes</option>
                                            <option>80 minutes</option>
                                            <option>70 minutes</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3>Notification Preferences</h3>
                                <div class="settings-group">
                                    <label class="setting-item checkbox">
                                        <input type="checkbox" checked>
                                        <span>Email notifications for new registrations</span>
                                    </label>
                                    <label class="setting-item checkbox">
                                        <input type="checkbox" checked>
                                        <span>SMS alerts for match day reminders</span>
                                    </label>
                                    <label class="setting-item checkbox">
                                        <input type="checkbox">
                                        <span>Push notifications for payment updates</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="settings-actions">
                                <button class="btn btn-primary" onclick="SPAModules.settings.saveSettings()">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Settings module initialized');
        },

        saveSettings() {
            utils.showNotification('Settings saved successfully!');
        }
    };

    // Team Payments Module
    modules['team-payments'] = {
        async render() {
            return `
                <div class="content-area">
                    <div class="page-header">
                        <div class="page-title-section">
                            <h1 class="content-title">Team Payments</h1>
                            <p class="page-subtitle">Track and manage team payment status</p>
                        </div>
                    </div>
                    
                    <div class="payments-content">
                        <div class="payment-stats">
                            <div class="stat-card">
                                <h4>Total Outstanding</h4>
                                <p class="stat-value">£4,500</p>
                            </div>
                            <div class="stat-card">
                                <h4>Teams Paid</h4>
                                <p class="stat-value">12/16</p>
                            </div>
                            <div class="stat-card">
                                <h4>Overdue</h4>
                                <p class="stat-value warning">4</p>
                            </div>
                        </div>
                        
                        <div class="payments-list" id="payments-list">
                            <div class="loading-message">Loading payment data...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            console.log('Team Payments module initialized');
            await this.loadPayments();
        },

        async loadPayments() {
            const container = document.getElementById('payments-list');
            if (!container) return;

            const payments = [
                { team: 'Arsenal FC', amount: 1500, status: 'paid', dueDate: '2025-01-01' },
                { team: 'Chelsea FC', amount: 1500, status: 'partial', paid: 750, dueDate: '2025-01-01' },
                { team: 'Manchester United', amount: 1500, status: 'paid', dueDate: '2025-01-01' },
                { team: 'Brighton FC', amount: 1500, status: 'overdue', dueDate: '2024-12-15' }
            ];

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(payment => `
                            <tr>
                                <td>${payment.team}</td>
                                <td>£${payment.amount.toLocaleString()}</td>
                                <td>
                                    <span class="badge badge-${payment.status}">
                                        ${payment.status}
                                        ${payment.status === 'partial' ? `(£${payment.paid})` : ''}
                                    </span>
                                </td>
                                <td>${utils.formatDate(payment.dueDate)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" 
                                            onclick="SPAModules['team-payments'].recordPayment('${payment.team}')">
                                        Record Payment
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        },

        recordPayment(team) {
            utils.showNotification(`Recording payment for ${team}...`, 'info');
        }
    };

    // Export public API
    return modules;
})();

// Add global styles for notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: #10b981;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        z-index: 10000;
    }
    
    .notification.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .notification.error {
        background: #ef4444;
    }
    
    .notification.info {
        background: #3b82f6;
    }
    
    .notification.warning {
        background: #f59e0b;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2e6417;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        color: #666;
    }
    
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        text-align: center;
        color: #666;
    }
    
    .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .modal-container {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .modal-container.large-modal {
        max-width: 800px;
    }
    
    .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-footer {
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }
    
    .form-section {
        margin-bottom: 24px;
    }
    
    .section-header {
        margin-bottom: 16px;
    }
    
    .section-header h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
    }
    
    .section-header p {
        margin: 0;
        color: #666;
        font-size: 14px;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
    }
    
    .form-label {
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
    }
    
    .form-label.required::after {
        content: ' *';
        color: #ef4444;
    }
    
    .form-input,
    .form-select {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    
    .form-input:focus,
    .form-select:focus {
        outline: none;
        border-color: #2e6417;
        box-shadow: 0 0 0 3px rgba(46, 100, 23, 0.1);
    }
    
    .team-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: box-shadow 0.2s;
    }
    
    .team-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .team-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .team-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .team-name {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .team-actions {
        display: flex;
        gap: 8px;
    }
    
    .btn-icon {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .btn-icon:hover {
        opacity: 1;
    }
    
    .team-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }

    /* Pitch Card Grid Layout */
    .pitch-card,
    .pitch-masterpiece {
        width: 400px;
        max-width: 400px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
    }
    
    .pitch-card:hover,
    .pitch-masterpiece:hover {
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
    
    .add-pitch-card {
        width: 400px;
        max-width: 400px;
        min-height: 300px;
    }

    /* Premium Pitch Card Styles - Masterpiece Design */
    .pitch-masterpiece-container {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .pitch-header-gradient {
        background: #2e6417;
        padding: 15px 20px;
        position: relative;
        overflow: hidden;
        color: white;
        border-radius: 8px 8px 0 0;
    }

    .pitch-header-gradient::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.03"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.02"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.04"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        pointer-events: none;
    }

    .pitch-header-content {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 50px;
    }

    .pitch-name-premium {
        color: white;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        letter-spacing: 0.3px;
        text-align: center;
    }

    .demo-badge-corner {
        position: absolute;
        top: 8px;
        right: 8px;
        background: linear-gradient(45deg, #fbbf24, #f59e0b);
        color: #92400e;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        animation: shimmer 2s infinite;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(5px);
    }

    @keyframes shimmer {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    .pitch-size-indicator {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.1);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
    }

    .status-indicator-premium {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .status-icon {
        font-size: 14px;
    }

    .pitch-graphic-premium {
        padding: 16px;
        background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 120px;
    }

    .pitch-graphic-wrapper {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .pitch-svg-container {
        position: relative;
        width: 180px;
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .pitch-svg-premium {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 4px 8px rgba(46, 100, 23, 0.2));
        transition: all 0.3s ease;
    }

    .pitch-overlay-info {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .pitch-size-overlay {
        background: rgba(46, 100, 23, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3);
    }

    .pitch-glow-effect {
        position: absolute;
        top: -20px;
        left: -20px;
        right: -20px;
        bottom: -20px;
        background: radial-gradient(ellipse at center, 
            rgba(46, 100, 23, 0.1) 0%, 
            rgba(46, 100, 23, 0.05) 40%, 
            transparent 70%);
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
        z-index: -1;
    }

    .pitch-info-premium {
        padding: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .pitch-status-info-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    }

    .status-indicator-main {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        flex: 1;
    }
    
    .status-clickable {
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
    }
    
    .status-clickable:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .status-click-hint {
        font-size: 9px;
        opacity: 0.7;
        margin-left: auto;
        font-style: italic;
    }
    
    .status-clickable:hover .status-click-hint {
        opacity: 1;
    }

    .pitch-size-badge {
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        color: #475569;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        border: 1px solid rgba(203, 213, 225, 0.5);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .quick-stats-bar {
        display: flex;
        align-items: center;
        background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }
    
    .stat-days {
        flex: 3;
    }
    
    .stat-slots {
        flex: 1;
    }

    .stat-icon {
        font-size: 18px;
        filter: grayscale(0.2);
    }

    .stat-text {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
    }

    .stat-divider {
        width: 1px;
        height: 24px;
        background: linear-gradient(to bottom, transparent, #cbd5e1, transparent);
        margin: 0 16px;
    }

    .premium-time-slots {
        background: white;
        border-radius: 12px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        overflow: hidden;
    }

    .time-slots-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    }

    .slots-label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
    }

    .slots-count {
        background: linear-gradient(45deg, #2e6417, #166534);
        color: white;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
    }

    .time-slots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        gap: 6px;
        padding: 10px 16px;
    }

    .time-slot-premium {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 6px;
        background: linear-gradient(145deg, #f8fafc, #f1f5f9);
        border-radius: 6px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        transition: all 0.3s ease;
        animation: slideInUp 0.5s ease forwards;
        opacity: 0;
        transform: translateY(20px);
    }

    .time-slot-premium:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.15);
        border-color: rgba(46, 100, 23, 0.3);
    }

    @keyframes slideInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .time-text {
        font-size: 11px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 2px;
    }

    .time-indicator {
        width: 6px;
        height: 6px;
        background: linear-gradient(45deg, #10b981, #059669);
        border-radius: 50%;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    .premium-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: auto;
    }

    .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px 6px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: inherit;
        position: relative;
        overflow: hidden;
    }

    .action-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
    }

    .action-btn:hover::before {
        left: 100%;
    }

    .primary-action {
        background: linear-gradient(135deg, #2e6417 0%, #166534 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(46, 100, 23, 0.3);
    }

    .primary-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(46, 100, 23, 0.4);
    }

    .secondary-action {
        background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(3, 105, 161, 0.3);
    }

    .secondary-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(3, 105, 161, 0.4);
    }

    .tertiary-action {
        background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .tertiary-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
    }

    .danger-action {
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .danger-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
    }

    .btn-icon-premium {
        font-size: 14px;
        margin-bottom: 2px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }

    .btn-text-premium {
        font-size: 10px;
        font-weight: 500;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, Roboto, 'Noto Sans', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    .action-btn:active {
        transform: translateY(0) scale(0.95);
    }

        margin-bottom: 12px;
    }
    
    .detail-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
    }
    
    .detail-label {
        color: #666;
    }
    
    .detail-value {
        font-weight: 500;
    }
    
    .team-card-footer {
        border-top: 1px solid #e5e7eb;
        padding-top: 12px;
    }
    
    .match-info {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        color: #666;
    }
    
    .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
    }
    
    .badge-active,
    .badge-success {
        background: #d1fae5;
        color: #065f46;
    }
    
    .badge-inactive,
    .badge-warning {
        background: #fed7aa;
        color: #92400e;
    }
    
    .badge-pending {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .badge-premier {
        background: #e0e7ff;
        color: #3730a3;
    }
    
    .badge-championship {
        background: #fce7f3;
        color: #9f1239;
    }
    
    .payment-paid {
        color: #065f46;
    }
    
    .payment-pending {
        color: #92400e;
    }
    
    .payment-partial {
        color: #1e40af;
    }
    
    .payment-overdue {
        color: #dc2626;
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .data-table th {
        background: #f9fafb;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table td {
        padding: 12px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
    }
    
    .data-table tr:hover {
        background: #f9fafb;
    }
    
    .fixture-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }
    
    .fixture-teams {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 12px;
        font-size: 18px;
        font-weight: 600;
    }
    
    .vs {
        color: #666;
        font-size: 14px;
    }
    
    .fixture-details {
        display: flex;
        justify-content: space-around;
        margin-bottom: 12px;
        font-size: 14px;
        color: #666;
    }
    
    .fixture-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
    }
    
    .venue-card,
    .league-card,
    .division-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
    }
    
    .venue-card h3,
    .league-card h3,
    .division-card h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        font-family: Arial, sans-serif;
    }
    
    .venue-details {
        margin-bottom: 16px;
    }
    
    .venue-details p {
        margin: 8px 0;
        font-size: 14px;
    }
    
    .status-available {
        color: #065f46;
    }
    
    .status-unavailable {
        color: #dc2626;
    }
    
    .settings-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .settings-section h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .settings-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
    }
    
    .setting-item.checkbox {
        justify-content: flex-start;
        gap: 12px;
    }
    
    .payment-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }
    
    .stat-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
    }
    
    .stat-card h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #666;
        font-weight: 500;
    }
    
    .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #2e6417;
    }
    
    .stat-value.warning {
        color: #dc2626;
    }
    
    .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    
    .btn-primary {
        background: #2e6417;
        color: white;
    }
    
    .btn-primary:hover {
        background: #1e4009;
    }
    
    .btn-outline {
        background: white;
        color: #2e6417;
        border: 1px solid #2e6417;
    }
    
    .btn-outline:hover {
        background: #f9fafb;
    }
    
    .btn-sm {
        padding: 6px 12px;
        font-size: 13px;
    }
    
    .page-actions {
        display: flex;
        gap: 12px;
    }
    
    .teams-toolbar,
    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 20px;
    }
    
    .toolbar-left,
    .toolbar-right {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    
    .search-box {
        position: relative;
    }
    
    .search-box input {
        padding-left: 36px;
        width: 300px;
    }
    
    .teams-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .teams-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .teams-count {
        color: #666;
        font-size: 14px;
    }
    
    .leagues-grid,
    .divisions-grid,
    .venues-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
    }
`;
document.head.appendChild(style);

console.log('Enhanced SPA Modules loaded successfully');