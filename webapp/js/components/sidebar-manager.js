/**
 * Sidebar Manager
 * Handles the consistent sidebar experience across the application
 * 
 * Copyright © 2025 5ive Trackr. All rights reserved.
 */

class SidebarManager {
    constructor() {
        this.initialized = false;
        // Sidebar is now always expanded, no need to track state
        this.activePage = document.body.dataset.page || this.detectActivePage();
        this.userRole = document.body.dataset.role || this.detectUserRole();
    }
    
    /**
     * Initialize the sidebar
     */
    init() {
        if (this.initialized) return;
        
        this.injectSidebar();
        this.setupEventListeners();
        this.applySidebarState();
        
        this.initialized = true;
        
        return this;
    }
    
    /**
     * Inject the sidebar into the page
     */
    injectSidebar() {
        const sidebarElement = document.querySelector('.sidebar');
        
        if (sidebarElement) {
            sidebarElement.innerHTML = SidebarTemplate.getSidebarHtml(this.activePage, this.userRole);
        }
    }
    
    /**
     * Set up event listeners for sidebar interactions
     */
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }
    
    /**
     * Apply saved sidebar state
     * Note: Sidebar toggle functionality has been removed
     */
    applySidebarState() {
        // Sidebar is now always expanded
        return;
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
            window.location.href = SidebarTemplate.getPathPrefix() + 'home.html';
        }
    }
    
    /**
     * Detect the active page based on current URL
     * @returns {string} Page identifier
     */
    detectActivePage() {
        const path = window.location.pathname;
        
        if (path.includes('league-manager-dashboard') || (path.includes('league-manager/dashboard'))) return 'dashboard';
        if (path.includes('referee-dashboard')) return 'dashboard';
        if (path.includes('assignments')) return 'assignments';
        if (path.includes('reports')) return 'reports';
        if (path.includes('availability')) return 'availability';
        if (path.includes('leagues')) return 'leagues';
        if (path.includes('teams')) return 'teams';
        if (path.includes('fixtures')) return 'fixtures';
        if (path.includes('referees')) return 'referees';
        
        // Default to dashboard if no match
        return 'dashboard';
    }
    
    /**
     * Detect user role based on URL or other context
     * @returns {string} User role
     */
    detectUserRole() {
        const path = window.location.pathname;
        
        // Detect role based on URL path
        if (path.includes('/referee/')) {
            return 'referee';
        } else if (path.includes('/league-manager/')) {
            return 'league-manager';
        }
        
        // Check if we have a session with role information
        if (window.sessionManager && sessionManager.getCurrentUser) {
            const user = sessionManager.getCurrentUser();
            if (user && user.role) {
                return user.role;
            }
        }
        
        // Default role
        return 'default';
    }
}

// Initialize the sidebar when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if the SidebarTemplate is available
    if (typeof SidebarTemplate !== 'undefined') {
        const sidebarManager = new SidebarManager();
        sidebarManager.init();
        
        // Make available globally for other scripts
        window.sidebarManager = sidebarManager;
    } else {
        console.error('SidebarTemplate not found. Make sure sidebar-template.js is loaded first.');
    }
});
