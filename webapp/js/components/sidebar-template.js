/**
 * Sidebar Template
 * Central place for the sidebar HTML structure used across the application
 * 
 * Copyright © 2025 5ive Trackr. All rights reserved.
 */

const SidebarTemplate = {
    /**
     * Get the appropriate path prefix based on the current page's depth
     * @returns {string} Path prefix for assets
     */
    getPathPrefix() {
        const path = window.location.pathname;
        // Count slashes to determine depth
        const depth = (path.match(/\//g) || []).length - 1;
        
        // For files in the root
        if (path.lastIndexOf('/') === 0) return '';
        
        // For files in pages/ directory
        if (path.includes('/pages/') && !path.includes('/pages/league-manager/') && !path.includes('/pages/referee/')) {
            return '../';
        }
        
        // For files in subdirectories like pages/league-manager/ or pages/referee/
        if (path.includes('/pages/league-manager/') || path.includes('/pages/referee/')) {
            return '../../';
        }
        
        return '';
    },
    
    /**
     * Get the sidebar HTML
     * @param {string} activePage - ID of the active page
     * @param {string} role - User role (league-manager, referee, etc.)
     * @returns {string} Sidebar HTML
     */
    getSidebarHtml(activePage = 'dashboard', role = null) {
        const pathPrefix = this.getPathPrefix();
        
        // Detect role if not provided
        if (!role) {
            const path = window.location.pathname;
            if (path.includes('referee')) {
                role = 'referee';
            } else if (path.includes('league-manager')) {
                role = 'league-manager';
            } else {
                role = 'default';
            }
        }
        
        // Common sidebar header
        const sidebarHeader = `
        <div class="sidebar-header">
            <div class="logo-container">
                <img src="${pathPrefix}img/header-logo.svg" alt="5ive Trackr" class="logo">
            </div>
        </div>`;
        
        // Role-specific navigation
        const navItems = this.getNavigationItems(role, activePage, pathPrefix);
        
        // Common sidebar footer - removed toggle button
        const sidebarFooter = `
        <div class="sidebar-footer">
            <a href="${pathPrefix}pages/settings.html" class="settings-link">
                <span class="icon icon-cog"></span> Settings
            </a>
            <a href="#" class="logout-link" id="logout-btn">
                <span class="icon icon-sign-out"></span> Logout
            </a>
        </div>`;
        
        return sidebarHeader + navItems + sidebarFooter;
    },
    
    /**
     * Get navigation items based on user role
     * @param {string} role - User role
     * @param {string} activePage - Current active page
     * @param {string} pathPrefix - Path prefix for URLs
     * @returns {string} Navigation HTML
     */
    getNavigationItems(role, activePage, pathPrefix) {
        let items = '';
        
        // Role-specific navigation items
        if (role === 'referee') {
            items = `
                <li class="${activePage === 'dashboard' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/referee/referee-dashboard.html">
                        <span class="icon">📊</span> Dashboard
                    </a>
                </li>
                <li class="${activePage === 'assignments' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/referee/assignments.html">
                        <span class="icon icon-calendar"></span> My Assignments
                    </a>
                </li>
                <li class="${activePage === 'reports' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/referee/reports.html">
                        <span class="icon icon-file-text"></span> Match Reports
                    </a>
                </li>
                <li class="${activePage === 'availability' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/referee/availability.html">
                        <span class="icon icon-clock"></span> Availability
                    </a>
                </li>
            `;
        } else if (role === 'league-manager') {
            items = `
                <li class="${activePage === 'dashboard' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/league-manager/dashboard.html">
                        <span class="icon">📊</span> Dashboard
                    </a>
                </li>
                <li class="${activePage === 'leagues' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/leagues.html">
                        <span class="icon icon-trophy"></span> Leagues
                    </a>
                </li>
                <li class="${activePage === 'teams' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/teams.html">
                        <span class="icon icon-users"></span> Teams
                    </a>
                </li>
                <li class="${activePage === 'fixtures' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/fixtures.html">
                        <span class="icon icon-calendar"></span> Fixtures
                    </a>
                </li>
                <li class="${activePage === 'referees' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/referees.html">
                        <img src="${pathPrefix}img/referee-icon.svg" alt="Referees" class="nav-icon"> Referees
                    </a>
                </li>
            `;
        } else {
            // Default navigation
            items = `
                <li class="${activePage === 'dashboard' ? 'active' : ''}">
                    <a href="${pathPrefix}pages/dashboard.html">
                        <span class="icon">📊</span> Dashboard
                    </a>
                </li>
            `;
        }
        
        return `<nav class="sidebar-nav"><ul>${items}</ul></nav>`;
    }
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarTemplate;
}

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarTemplate;
}
