/**
 * 5ive Trackr Dashboard Layout
 * 
 * Handles the dashboard layout functionality such as sidebar toggling,
 * responsive behavior, notifications, and common UI components
 * 
 * @copyright 5ive Trackr 2025
 */

class DashboardLayout {
    /**
     * Initialize the dashboard layout
     * @param {Object} options - Configuration options
     * @param {string} options.sidebarToggleId - ID of the sidebar toggle button
     * @param {string} options.userMenuButtonId - ID of the user menu button
     * @param {string} options.userMenuDropdownId - ID of the user menu dropdown
     */
    constructor(options = {}) {
        this.options = {
            sidebarToggleId: 'sidebarToggle',
            userMenuButtonId: 'userMenuButton',
            userMenuDropdownId: 'userMenuDropdown',
            ...options
        };
        
        // Store references to elements
        this.elements = {
            body: document.body,
            sidebar: document.getElementById('sidebar'),
            sidebarToggle: document.getElementById(this.options.sidebarToggleId),
            userMenuButton: document.getElementById(this.options.userMenuButtonId),
            userMenuDropdown: document.getElementById(this.options.userMenuDropdownId),
            notificationsContainer: null
        };
        
        // Create notifications container
        this.createNotificationsContainer();
        
        // Initialize state
        this.state = {
            sidebarCollapsed: window.innerWidth < 768, // Collapse on mobile by default
            userMenuOpen: false,
            notificationQueue: [],
            notificationDisplayTime: 5000, // 5 seconds
            notificationProcessing: false
        };
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI based on state
        this.updateUI();
    }
    
    /**
     * Create notifications container if it doesn't exist
     */
    createNotificationsContainer() {
        let container = document.getElementById('notificationsContainer');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationsContainer';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        this.elements.notificationsContainer = container;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Sidebar toggle
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // User menu toggle
        if (this.elements.userMenuButton) {
            this.elements.userMenuButton.addEventListener('click', () => this.toggleUserMenu());
        }
        
        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.state.userMenuOpen && 
                this.elements.userMenuButton && 
                this.elements.userMenuDropdown &&
                !this.elements.userMenuButton.contains(e.target) && 
                !this.elements.userMenuDropdown.contains(e.target)) {
                this.closeUserMenu();
            }
        });
        
        // Responsive behavior
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // If on mobile, collapse sidebar
        if (window.innerWidth < 768 && !this.state.sidebarCollapsed) {
            this.collapseSidebar();
        }
    }
    
    /**
     * Update UI based on current state
     */
    updateUI() {
        // Update sidebar state
        if (this.elements.sidebar) {
            if (this.state.sidebarCollapsed) {
                this.elements.sidebar.classList.add('collapsed');
                this.elements.body.classList.add('sidebar-collapsed');
            } else {
                this.elements.sidebar.classList.remove('collapsed');
                this.elements.body.classList.remove('sidebar-collapsed');
            }
        }
        
        // Update user menu state
        if (this.elements.userMenuDropdown) {
            if (this.state.userMenuOpen) {
                this.elements.userMenuDropdown.classList.remove('hidden');
            } else {
                this.elements.userMenuDropdown.classList.add('hidden');
            }
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        this.updateUI();
    }
    
    /**
     * Collapse sidebar
     */
    collapseSidebar() {
        this.state.sidebarCollapsed = true;
        this.updateUI();
    }
    
    /**
     * Expand sidebar
     */
    expandSidebar() {
        this.state.sidebarCollapsed = false;
        this.updateUI();
    }
    
    /**
     * Toggle user menu
     */
    toggleUserMenu() {
        this.state.userMenuOpen = !this.state.userMenuOpen;
        this.updateUI();
    }
    
    /**
     * Close user menu
     */
    closeUserMenu() {
        this.state.userMenuOpen = false;
        this.updateUI();
    }
    
    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type: 'success', 'error', 'info', 'warning'
     */
    showNotification(message, type = 'info') {
        // Add to queue
        this.state.notificationQueue.push({ message, type });
        
        // Start processing if not already processing
        if (!this.state.notificationProcessing) {
            this.processNotificationQueue();
        }
    }
    
    /**
     * Process notification queue
     */
    async processNotificationQueue() {
        if (this.state.notificationQueue.length === 0) {
            this.state.notificationProcessing = false;
            return;
        }
        
        this.state.notificationProcessing = true;
        
        // Get next notification
        const notification = this.state.notificationQueue.shift();
        
        // Create notification element
        await this.createNotificationElement(notification);
        
        // Continue processing
        setTimeout(() => {
            this.processNotificationQueue();
        }, 300); // Small delay between notifications
    }
    
    /**
     * Create and display notification element
     * @param {Object} notification - Notification object
     * @param {string} notification.message - Notification message
     * @param {string} notification.type - Notification type
     */
    async createNotificationElement(notification) {
        // Create element
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        
        // Add icon based on type
        let icon = '';
        switch (notification.type) {
            case 'success':
                icon = '✅';
                break;
            case 'error':
                icon = '❌';
                break;
            case 'warning':
                icon = '⚠️';
                break;
            case 'info':
            default:
                icon = 'ℹ️';
                break;
        }
        
        // Set content
        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${notification.message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        this.elements.notificationsContainer.appendChild(element);
        
        // Add event listener to close button
        const closeBtn = element.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeNotification(element);
            });
        }
        
        // Animate in
        setTimeout(() => {
            element.classList.add('visible');
        }, 10);
        
        // Set timeout to remove
        setTimeout(() => {
            this.removeNotification(element);
        }, this.state.notificationDisplayTime);
        
        return new Promise(resolve => {
            setTimeout(resolve, 300); // Wait for animation to complete
        });
    }
    
    /**
     * Remove a notification element
     * @param {HTMLElement} element - Notification element
     */
    removeNotification(element) {
        // Animate out
        element.classList.remove('visible');
        
        // Remove after animation
        setTimeout(() => {
            if (element.parentNode === this.elements.notificationsContainer) {
                this.elements.notificationsContainer.removeChild(element);
            }
        }, 300); // Match CSS transition time
    }
    
    /**
     * Set active navigation item
     * @param {string} href - Href value of the active item
     */
    setActiveNavigationItem(href) {
        if (!this.elements.sidebar) return;
        
        // Find all navigation items
        const navItems = this.elements.sidebar.querySelectorAll('.sidebar-menu a');
        
        // Remove active class from all
        navItems.forEach(item => {
            item.parentElement.classList.remove('active');
        });
        
        // Add active class to matching item
        navItems.forEach(item => {
            if (item.getAttribute('href') === href) {
                item.parentElement.classList.add('active');
            }
        });
    }
}

// Export as global
window.DashboardLayout = DashboardLayout;
