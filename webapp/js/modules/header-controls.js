/**
 * Header Controls
 * Handles user interactions with the dashboard header elements
 * 
 * Copyright © 2025 5ive Trackr. All rights reserved.
 */

class HeaderControls {
    constructor() {
        this.initialized = false;
    }
    
    /**
     * Initialize the header controls
     */
    init() {
        if (this.initialized) return;
        
        this.setupEventListeners();
        this.initialized = true;
        
        return this;
    }
    
    /**
     * Set up event listeners for header interactions
     */
    setupEventListeners() {
        // Header logout button
        const headerLogoutBtn = document.getElementById('header-logout-btn');
        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // User menu dropdown
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', this.toggleUserMenu.bind(this));
        }
    }
    
    /**
     * Toggle the user menu dropdown
     * @param {Event} e - Click event
     */
    toggleUserMenu(e) {
        const dropdown = e.currentTarget.querySelector('.dropdown-menu');
        if (dropdown) {
            dropdown.classList.toggle('active');
            
            // Close dropdown when clicking elsewhere
            const closeDropdown = (event) => {
                if (!e.currentTarget.contains(event.target)) {
                    dropdown.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                }
            };
            
            // Add click listener to document to close dropdown
            if (dropdown.classList.contains('active')) {
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 0);
            }
        }
    }
    
    /**
     * Handle logout action
     * @param {Event} e - Click event
     */
    handleLogout(e) {
        e.preventDefault();
        
        // Check if session manager is available
        if (window.sessionManager && typeof window.sessionManager.logout === 'function') {
            window.sessionManager.logout();
        } else {
            // Fallback logout approach
            localStorage.removeItem('5iveTrackr_session');
            window.location.href = '../index.html';
        }
    }
}

// Initialize header controls when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const headerControls = new HeaderControls();
    headerControls.init();
    
    // Make available globally for other scripts
    window.headerControls = headerControls;
});
