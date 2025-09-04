/**
 * Header Template
 * Provides consistent header structure across the application
 * 
 * @copyright 5ive Trackr 2025
 */

const HeaderTemplate = {
    /**
     * Get the header HTML based on user role and page
     * @param {string} title - The title to display in the header
     * @param {string} breadcrumb - The breadcrumb text
     * @param {string} role - The user role (optional)
     * @returns {string} - The header HTML
     */
    getHeaderHtml(title, breadcrumb, role = null) {
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
        
        return `
        <header class="dashboard-header">
            <div class="header-left">
                <div class="header-logo">
                    <img src="../../img/header-logo.svg" alt="5ive Trackr" class="header-logo-image">
                </div>
                <div class="header-title">
                    <h2>${title}</h2>
                    <div class="breadcrumbs">
                        <span>${breadcrumb}</span>
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="header-actions">
                    <button class="action-button" id="notifications-btn">
                        <span class="icon icon-bell"></span>
                    </button>
                    <button class="action-button" id="messages-btn">
                        <span class="icon icon-envelope"></span>
                    </button>
                </div>
                <div class="user-menu">
                    <img src="../../img/avatar.png" alt="User" class="user-avatar">
                    <span class="user-name" id="user-name">User</span>
                    <span class="icon icon-chevron-down"></span>
                    
                    <div class="dropdown-menu">
                        <a href="/webapp/src/pages/profile.html"><span class="icon icon-user-circle"></span> Profile</a>
                        <a href="/webapp/src/pages/settings.html"><span class="icon icon-cog"></span> Settings</a>
                        <a href="#" id="header-logout-btn"><span class="icon icon-sign-out"></span> Logout</a>
                    </div>
                </div>
            </div>
        </header>`;
    }
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderTemplate;
}
