/**
 * 5ive Trackr League Manager Actions
 * 
 * Handles action required cards and dashboard functionality
 * for league managers
 * 
 * @copyright 5ive Trackr 2025
 */

class LeagueManagerActions {
    /**
     * Initialize the league manager actions controller
     */
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.loadActionData();
    }

    /**
     * Initialize references to DOM elements
     */
    initElements() {
        this.elements = {
            // Action Required Elements
            refreshActionsBtn: document.getElementById('refresh-actions'),
            attendanceCard: document.getElementById('attendance-card'),
            refereeCard: document.getElementById('referee-card'),
            paymentsCard: document.getElementById('payments-card'),
            fixturesCard: document.getElementById('fixtures-card'),
            actionsCard: document.getElementById('actions-card'),
            
            // Header Elements
            sidebarToggle: document.getElementById('sidebar-toggle'),
            themeToggle: document.getElementById('theme-toggle'),
            searchInput: document.querySelector('.search-input'),
            notificationsBtn: document.querySelector('.notifications-menu .header-icon-button'),
            markAllReadBtn: document.querySelector('.mark-all-read'),
            userProfile: document.querySelector('.user-profile')
        };
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Refresh button click
        if (this.elements.refreshActionsBtn) {
            this.elements.refreshActionsBtn.addEventListener('click', () => {
                this.loadActionData(true);
            });
        }

        // Add click listeners to cards
        this.addCardEventListeners();
        
        // Initialize header interactions
        this.initHeaderInteractions();
    }
    
    /**
     * Initialize header interaction events
     */
    initHeaderInteractions() {
        // Sidebar toggle in header
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-collapsed');
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('collapsed');
                    // Save sidebar state to localStorage for persistence
                    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
                }
            });
            
            // Apply saved sidebar state
            const savedState = localStorage.getItem('sidebarCollapsed') === 'true';
            if (savedState) {
                document.body.classList.add('sidebar-collapsed');
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.add('collapsed');
                }
            }
        }
        
        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDarkMode = document.body.classList.contains('dark-mode');
                
                // Update icon
                const icon = this.elements.themeToggle.querySelector('.icon');
                if (icon) {
                    icon.className = isDarkMode ? 'icon icon-sun' : 'icon icon-moon';
                }
                
                // Store preference
                localStorage.setItem('darkMode', isDarkMode.toString());
            });
            
            // Set initial theme based on preference
            const savedTheme = localStorage.getItem('darkMode');
            if (savedTheme === 'true') {
                document.body.classList.add('dark-mode');
                const icon = this.elements.themeToggle.querySelector('.icon');
                if (icon) {
                    icon.className = 'icon icon-sun';
                }
            }
        }
        
        // Notifications
        if (this.elements.notificationsBtn) {
            this.elements.notificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = this.elements.notificationsBtn.closest('.notifications-menu').querySelector('.notifications-dropdown');
                
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    
                    // Close when clicking outside
                    document.addEventListener('click', function closeDropdown(e) {
                        if (!dropdown.contains(e.target) && e.target !== this.elements.notificationsBtn) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeDropdown);
                        }
                    }.bind(this), { once: true });
                }
            });
        }
        
        // Mark all notifications as read
        if (this.elements.markAllReadBtn) {
            this.elements.markAllReadBtn.addEventListener('click', () => {
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => {
                    item.classList.remove('unread');
                });
                
                // Update the badge count
                const badge = document.querySelector('.notification-badge');
                if (badge) {
                    badge.textContent = '0';
                    badge.style.display = 'none';
                }
            });
        }
        
        // User profile dropdown
        if (this.elements.userProfile) {
            this.elements.userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = this.elements.userProfile.querySelector('.user-dropdown');
                
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    
                    // Close when clicking outside
                    document.addEventListener('click', function closeUserDropdown(e) {
                        if (!dropdown.contains(e.target) && e.target !== this.elements.userProfile) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeUserDropdown);
                        }
                    }.bind(this), { once: true });
                }
            });
        }
        
        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
    }
    
    /**
     * Perform search action
     * @param {string} query - Search query
     */
    performSearch(query) {
        if (query.trim() === '') return;
        
        console.log(`Searching for: ${query}`);
        // In a real implementation, this would trigger the search functionality
        // For now, just show a simple alert
        alert(`Search functionality would show results for: "${query}"`);
    }

    /**
     * Add click event listeners to action cards
     */
    addCardEventListeners() {
        const cards = [
            { element: this.elements.attendanceCard, tab: 'teams-tab', action: 'attendance' },
            { element: this.elements.refereeCard, tab: 'referees-tab', action: 'allocation' },
            { element: this.elements.paymentsCard, tab: 'teams-tab', action: 'payments' },
            { element: this.elements.fixturesCard, tab: 'fixtures-tab', action: 'today' }
        ];

        // Add click listeners to each card
        cards.forEach(card => {
            if (card.element) {
                card.element.addEventListener('click', () => {
                    this.navigateToSection(card.tab, card.action);
                });
            }
        });
    }

    /**
     * Navigate to specific tab and action
     * @param {string} tabId - Tab ID to navigate to
     * @param {string} action - Specific action filter to apply
     */
    navigateToSection(tabId, action) {
        // Find tab navigation element
        const tabElement = document.querySelector(`.modern-tab-item[data-tab="${tabId}"]`);
        
        if (tabElement) {
            // Activate the tab
            const currentActive = document.querySelector('.modern-tab-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            tabElement.classList.add('active');
            
            // Show the tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Apply any specific filters based on action
                this.applyActionFilter(tabId, action);
            }
        }
    }

    /**
     * Apply specific filters based on action type
     * @param {string} tabId - The tab ID
     * @param {string} action - The action type
     */
    applyActionFilter(tabId, action) {
        // Different logic based on the tab and action
        switch(tabId) {
            case 'teams-tab':
                if (action === 'attendance') {
                    // Filter for teams with attendance issues
                    const teamFilter = document.getElementById('team-filter');
                    if (teamFilter) {
                        teamFilter.value = 'attendance_required';
                        // Trigger the filter change event
                        teamFilter.dispatchEvent(new Event('change'));
                    }
                } else if (action === 'payments') {
                    // Filter for teams with payment issues
                    const teamFilter = document.getElementById('team-filter');
                    if (teamFilter) {
                        teamFilter.value = 'payment_required';
                        // Trigger the filter change event
                        teamFilter.dispatchEvent(new Event('change'));
                    }
                }
                break;
                
            case 'fixtures-tab':
                if (action === 'today') {
                    // Set date filter to today
                    const dateFilter = document.getElementById('fixture-date-filter');
                    if (dateFilter) {
                        const today = new Date().toISOString().split('T')[0];
                        dateFilter.value = today;
                        // Trigger the filter change event
                        dateFilter.dispatchEvent(new Event('change'));
                    }
                }
                break;
        }
    }

    /**
     * Load action data from API or local storage
     * @param {boolean} forceRefresh - Whether to force a refresh from the server
     */
    loadActionData(forceRefresh = false) {
        // Show loading state
        this.setLoadingState(true);
        
        // In a real implementation, this would be an API call
        // For now, we'll simulate with a timeout
        setTimeout(() => {
            // Mock data - in production would come from API
            const actionData = {
                attendance: 3,
                refereeAllocations: 2,
                payments: 4,
                fixtures: 0, // Today's fixtures
                totalActions: 9
            };
            
            this.updateActionCards(actionData);
            this.setLoadingState(false);
        }, 600);
    }
    
    /**
     * Update action cards with data
     * @param {Object} data - Action data object
     */
    updateActionCards(data) {
        // Update each card with its corresponding value
        this.updateCard('attendance-card', data.attendance);
        this.updateCard('referee-card', data.refereeAllocations);
        this.updateCard('payments-card', data.payments);
        this.updateCard('fixtures-card', data.fixtures);
        this.updateCard('actions-card', data.totalActions);
    }
    
    /**
     * Update a single action card
     * @param {string} cardId - Card element ID
     * @param {number} count - Action count value
     */
    updateCard(cardId, count) {
        const card = document.getElementById(cardId);
        if (!card) return;
        
        // Update the header data attribute for color
        const header = card.querySelector('.action-card-header');
        if (header) {
            header.setAttribute('data-count', count);
        }
        
        // Update the count display
        const countElement = card.querySelector('.action-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }
    
    /**
     * Set loading state for action cards
     * @param {boolean} isLoading - Whether cards are loading
     */
    setLoadingState(isLoading) {
        const cards = document.querySelectorAll('.action-card');
        
        cards.forEach(card => {
            if (isLoading) {
                card.classList.add('loading');
            } else {
                card.classList.remove('loading');
            }
        });
        
        // Disable refresh button during loading
        if (this.elements.refreshActionsBtn) {
            this.elements.refreshActionsBtn.disabled = isLoading;
        }
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the actions controller
    const leagueManagerActions = new LeagueManagerActions();
    
    // Store in window for debugging/access
    window.leagueManagerActions = leagueManagerActions;
});
