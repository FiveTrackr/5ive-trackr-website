/**
 * League Manager Dynamic Header Component
 * Automatically loads and manages the header template for league manager role pages
 */

class LeagueManagerHeader {
    constructor() {
        this.isLoaded = false;
        this.currentPage = null;
        this.init();
    }

    async init() {
        // Check if we're on a league manager page
        if (document.body.getAttribute('data-role') === 'league-manager') {
            await this.loadHeader();
            // Don't automatically set page title during init
            // Let the page-specific updatePageTitle() calls handle it
            console.log('Header initialized, waiting for page-specific title update');
        }
    }

    async loadHeader() {
        try {
            // Find the header container
            const headerContainer = document.querySelector('.main-header, header[class*="header"]');
            
            if (headerContainer) {
                // Check if static content is already present
                const hasStaticContent = headerContainer.querySelector('.header-left, .header-right');
                
                if (hasStaticContent) {
                    // Static content exists, enhance it instead of replacing
                    console.log('Static header content detected, enhancing existing structure');
                    await this.enhanceExistingHeader(headerContainer);
                } else {
                    // No static content, but don't load dynamic template - this should not happen
                    console.log('No static content found - pages should have static headers');
                    // Just add the data attributes and continue
                }
                
                // Set data attributes for CSS targeting
                headerContainer.setAttribute('data-loaded', 'league-manager');
                headerContainer.classList.add('league-manager-header');
                
                this.isLoaded = true;
                console.log('League manager header loaded successfully');
                
                // Dispatch custom event
                document.dispatchEvent(new CustomEvent('headerLoaded', {
                    detail: { component: 'league-manager-header', timestamp: Date.now() }
                }));
            } else {
                throw new Error('Header container not found');
            }
        } catch (error) {
            console.error('Error loading league manager header:', error);
            // Don't show loading state error since static content should be present
        }
    }

    async enhanceExistingHeader(container) {
        // The static content is already present and styled
        // Just add any dynamic enhancements here if needed
        console.log('Header enhanced with static content');
        
        // Update user info if dynamic data is available
        this.updateUserInfo();
        
        return true;
    }

    async loadDynamicTemplate(container) {
        try {
            // Add cache-busting timestamp for development
            const timestamp = Date.now();
            const response = await fetch(`/webapp/src/templates/league-manager-header.html?v=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load header template: ${response.status}`);
            }

            const templateContent = await response.text();
            
            // Extract just the content part (skip the style section)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateContent;
            
            // Get the header content (everything after the </style> tag)
            const headerContent = tempDiv.querySelector('.header-left') ? 
                tempDiv.innerHTML : 
                templateContent.split('</style>')[1] || templateContent;
            
            // Load the template content
            container.innerHTML = headerContent;
                
            return true;
        } catch (error) {
            console.error('Error loading dynamic header template:', error);
            return false;
        }
    }

    updateUserInfo() {
        // Get user data from SessionManager if available
        try {
            let userData = null;
            
            // Try to get current user from SessionManager
            if (typeof SessionManager !== 'undefined' && SessionManager.getCurrentUser) {
                userData = SessionManager.getCurrentUser();
            }
            
            // If no user data, try getting from auth.js if available
            if (!userData && typeof auth !== 'undefined' && auth.getCurrentUser) {
                userData = auth.getCurrentUser();
            }
            
            // For development: if no user is logged in, simulate a login for demo purposes
            if (!userData && typeof SessionManager !== 'undefined' && SessionManager.login) {
                console.log('No user logged in, attempting demo login...');
                const loginResult = SessionManager.login('manager@fivetrackr.com', 'league123', 'league_manager');
                if (loginResult && loginResult.success) {
                    userData = SessionManager.getCurrentUser();
                    console.log('Demo login successful:', userData);
                }
            }
            
            // Find elements with data attributes
            const userInitialsEl = document.querySelector('[data-user-initials]');
            const userNameEl = document.querySelector('[data-user-name]');
            const userRoleEl = document.querySelector('[data-user-role]');
            
            if (userData && (userInitialsEl || userNameEl || userRoleEl)) {
                // Extract user info with better fallback handling
                const fullName = userData.fullName || userData.full_name || userData.name || 'User';
                const role = userData.role || userData.user_role || 'User';
                const email = userData.email || '';
                
                console.log('User data for header:', userData);
                console.log('Extracted fullName:', fullName);
                
                // Generate initials from first and last name only
                const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
                let initials = '';
                if (nameParts.length >= 2) {
                    // First name and last name initials
                    initials = nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                } else if (nameParts.length === 1) {
                    // Just first name, use first two characters or first character repeated
                    initials = nameParts[0].substring(0, 2).toUpperCase();
                } else {
                    // Fallback
                    initials = 'LM';
                }
                
                // Update the elements
                if (userInitialsEl) {
                    userInitialsEl.textContent = initials;
                }
                
                if (userNameEl) {
                    userNameEl.textContent = fullName;
                }
                
                if (userRoleEl) {
                    // Format role for display
                    const displayRole = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    userRoleEl.textContent = displayRole;
                }
                
                console.log('User info updated:', { fullName, role: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), initials });
            } else {
                // No user data available, keep loading placeholders or set defaults
                console.log('No user data available from SessionManager');
                
                // Set default values for development
                if (userInitialsEl && (userInitialsEl.textContent === '--' || userInitialsEl.textContent === 'Loading...')) {
                    userInitialsEl.textContent = 'LM';
                }
                if (userNameEl && (userNameEl.textContent === 'Loading...' || userNameEl.textContent.trim() === '')) {
                    userNameEl.textContent = 'League Manager';
                }
                if (userRoleEl && (userRoleEl.textContent === 'Loading...' || userRoleEl.textContent.trim() === '')) {
                    userRoleEl.textContent = 'League Manager';
                }
            }
        } catch (error) {
            console.error('Error updating user info:', error);
            
            // Fallback to defaults on error
            const userInitialsEl = document.querySelector('[data-user-initials]');
            const userNameEl = document.querySelector('[data-user-name]');
            const userRoleEl = document.querySelector('[data-user-role]');
            
            if (userInitialsEl) userInitialsEl.textContent = 'LM';
            if (userNameEl) userNameEl.textContent = 'League Manager';
            if (userRoleEl) userRoleEl.textContent = 'League Manager';
        }
    }

    initializeHeader() {
        // Set up any interactive elements in the header
        this.setupUserAvatar();
        this.setupActionButtons();
    }

    initializeHeader() {
        // Set up any interactive elements in the header
        this.setupUserAvatar();
        this.setupActionButtons();
    }

    setupUserAvatar() {
        // You can customize user info here
        const userAvatar = document.querySelector('.main-header .user-avatar');
        const userName = document.querySelector('.main-header .user-name');
        
        if (userAvatar && userName) {
            // Example: Set initials from user name
            const initials = userName.textContent.split(' ').map(n => n[0]).join('');
            userAvatar.textContent = initials;
        }
    }

    setupActionButtons() {
        // Add click handlers for header buttons
        const notificationBtn = document.querySelector('.main-header .header-btn[href="/webapp/src/pages/notifications.html"]');
        const settingsBtn = document.querySelector('.main-header .header-btn[href="/webapp/src/pages/settings.html"]');
        
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Notifications clicked');
                // Add notification functionality here
            });
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Settings clicked');
                // Add settings functionality here
            });
        }
    }

    setPageTitle(title = null) {
        const pageTitleElement = document.querySelector('.main-header .page-title[data-page-title]');
        
        console.log('setPageTitle called with title:', title);
        console.log('Found page title element:', pageTitleElement);
        console.log('Current element text:', pageTitleElement?.textContent);
        console.log('Element selector used: .main-header .page-title[data-page-title]');
        
        if (pageTitleElement) {
            if (title) {
                // Explicit title provided, always update
                console.log(`Setting page title to: ${title}`);
                pageTitleElement.textContent = title;
                console.log(`Page title updated to: ${pageTitleElement.textContent}`);
            } else {
                // Auto-detect page title from body data-page attribute or current page
                const currentPage = document.body.getAttribute('data-page') || this.detectPageFromURL();
                const pageTitle = this.getPageTitle(currentPage);
                console.log(`Auto-detecting page title: ${pageTitle} (detected page: ${currentPage})`);
                pageTitleElement.textContent = pageTitle;
            }
        } else {
            console.log('Page title element not found!');
            console.log('Available elements with page-title class:', document.querySelectorAll('.page-title'));
            console.log('Main header element:', document.querySelector('.main-header'));
        }
    }

    detectPageFromURL() {
        const path = window.location.pathname;
        console.log(`Detecting page from URL: ${path}`);
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('fixtures')) return 'fixtures';
        if (path.includes('referees')) return 'referees';
        if (path.includes('leagues') || path.includes('league-dashboard')) return 'leagues';
        if (path.includes('teams')) return 'teams';
        if (path.includes('pitches')) return 'pitches';
        if (path.includes('venues')) return 'venues';
        if (path.includes('settings')) return 'settings';
        if (path.includes('payments')) return 'payments';
        console.log(`No specific page detected, defaulting to dashboard`);
        return 'dashboard'; // default
    }

    getPageTitle(page) {
        const titles = {
            'dashboard': 'Dashboard',
            'fixtures': 'Fixtures',
            'referees': 'Referees', 
            'leagues': 'Leagues',
            'teams': 'Teams',
            'pitches': 'Pitches',
            'venues': 'Venues',
            'settings': 'Settings',
            'payments': 'Team Payments'
        };
        return titles[page] || 'Dashboard';
    }

    updatePageTitle(page) {
        console.log(`updatePageTitle called with page: ${page}`);
        this.currentPage = page;
        const title = this.getPageTitle(page);
        console.log(`getPageTitle returned: ${title} for page: ${page}`);
        this.setPageTitle(title);
        console.log(`Header page title updated to: ${title}`);
    }
}

// Initialize the header component when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.leagueManagerHeader = new LeagueManagerHeader();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeagueManagerHeader;
}
