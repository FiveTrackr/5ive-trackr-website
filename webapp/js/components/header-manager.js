/**
 * Header Manager
 * Handles the creation and functionality of headers across the application
 * 
 * @copyright 5ive Trackr 2025
 */

class HeaderManager {
    /**
     * Initialize the header
     * @param {string} title - Header title
     * @param {string} breadcrumb - Breadcrumb text
     * @param {string} role - User role
     */
    constructor(title = 'Dashboard', breadcrumb = 'Home', role = null) {
        this.title = title;
        this.breadcrumb = breadcrumb;
        this.role = role;
        this.init();
    }
    
    /**
     * Initialize the header
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.loadUserInfo();
    }
    
    /**
     * Render the header
     */
    render() {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) return;
        
        const headerHtml = HeaderTemplate.getHeaderHtml(this.title, this.breadcrumb, this.role);
        headerContainer.innerHTML = headerHtml;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // User menu dropdown
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                const dropdown = userMenu.querySelector('.dropdown-menu');
                dropdown.classList.toggle('active');
                e.stopPropagation();
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.querySelector('.dropdown-menu');
            if (dropdown) {
                dropdown.classList.remove('active');
            }
        });
        
        // Logout button
        const logoutBtn = document.getElementById('header-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        // Notification button
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }
        
        // Messages button
        const messagesBtn = document.getElementById('messages-btn');
        if (messagesBtn) {
            messagesBtn.addEventListener('click', () => {
                this.showMessages();
            });
        }
    }
    
    /**
     * Load user information
     */
    loadUserInfo() {
        // Get user info from session
        const userNameElement = document.getElementById('user-name');
        if (!userNameElement) return;
        
        // Try to get user from session manager if available
        if (typeof SessionManager !== 'undefined' && SessionManager.getCurrentUser) {
            const user = SessionManager.getCurrentUser();
            if (user && user.name) {
                userNameElement.textContent = user.name;
            }
        }
    }
    
    /**
     * Handle logout
     */
    handleLogout() {
        // If session manager exists, use it
        if (typeof SessionManager !== 'undefined' && SessionManager.logout) {
            SessionManager.logout();
        } else {
            // Fallback: redirect to login
            window.location.href = '/webapp/src/pages/home.html';
        }
    }
    
    /**
     * Show notifications
     */
    showNotifications() {
        console.log('Show notifications');
        // Implementation for showing notifications
        // Can be expanded later
    }
    
    /**
     * Show messages
     */
    showMessages() {
        console.log('Show messages');
        // Implementation for showing messages
        // Can be expanded later
    }
}

// Initialize header when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we need to initialize the header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        // Get parameters from data attributes if available
        const title = headerContainer.getAttribute('data-title') || document.title.replace(' - 5ive Trackr', '');
        const breadcrumb = headerContainer.getAttribute('data-breadcrumb') || 'Home';
        const role = headerContainer.getAttribute('data-role');
        
        // Initialize header manager
        window.headerManager = new HeaderManager(title, breadcrumb, role);
    }
});

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderManager;
}
