/**
 * Dynamic Sidebar Loader for League Manager
 * Automatically loads and initializes the sidebar template
 */

class LeagueManagerSidebar {
    constructor() {
        this.templatePath = '/webapp/src/templates/league-manager-sidebar.html?v=' + Date.now();
        this.sidebarElement = null;
        this.isLoaded = false;
    }

    /**
     * Load the sidebar template and enhance existing content
     */
    async loadSidebar() {
        try {
            console.log('Enhancing League Manager sidebar...');
            
            // Find the sidebar element
            this.sidebarElement = document.querySelector('.sidebar');
            if (!this.sidebarElement) {
                console.error('Sidebar element not found');
                return false;
            }

            console.log('Sidebar element found, checking for existing content...');
            
            // Check if sidebar already has content (static content)
            const existingContent = this.sidebarElement.querySelector('.sidebar-header');
            
            if (existingContent) {
                console.log('Static sidebar content found, enhancing instead of replacing...');
                // Enhance existing content rather than replace
                this.enhanceExistingSidebar();
            } else {
                console.log('No static content found, loading dynamic template...');
                // Fallback to dynamic loading if no static content exists
                await this.loadDynamicTemplate();
            }
            
            // Mark sidebar as league-manager loaded with isolation
            this.sidebarElement.setAttribute('data-loaded', 'league-manager');
            this.sidebarElement.setAttribute('data-role', 'league-manager');
            this.sidebarElement.classList.add('league-manager-sidebar');
            
            // Ensure sidebar isolation parameters
            this.sidebarElement.style.contain = 'layout style paint';
            this.sidebarElement.style.isolation = 'isolate';
            this.sidebarElement.style.position = 'fixed';
            this.sidebarElement.style.zIndex = '1000';
            this.sidebarElement.style.width = '250px';
            this.sidebarElement.style.height = '100vh';
            this.sidebarElement.style.top = '0';
            this.sidebarElement.style.left = '0';
            
            // Set body data attribute for page-wide styling isolation
            document.body.setAttribute('data-role', 'league-manager');
            
            // Mark as loaded
            this.isLoaded = true;
            
            // Initialize sidebar functionality
            this.initializeSidebar();
            
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('sidebarLoaded', {
                detail: { 
                    component: 'league-manager-sidebar',
                    template: this.templatePath,
                    success: true,
                    enhanced: existingContent ? true : false
                }
            }));
            
            console.log('League Manager sidebar loaded successfully');
            return true;
            
        } catch (error) {
            console.error('Error loading sidebar template:', error);
            this.loadFallbackSidebar();
            return false;
        }
    }

    /**
     * Enhance existing static sidebar content
     */
    enhanceExistingSidebar() {
        console.log('Enhancing existing static sidebar content...');
        
        // Ensure body has proper data attribute for CSS targeting
        document.body.setAttribute('data-role', 'league-manager');
        
        // Ensure all navigation icons are properly set up
        const navIcons = this.sidebarElement.querySelectorAll('.nav-icon[data-icon]');
        console.log(`Found ${navIcons.length} navigation icons to enhance`);
        
        navIcons.forEach(icon => {
            const iconType = icon.getAttribute('data-icon');
            console.log(`Enhancing icon: ${iconType}`);
            
            // Ensure icon is visible and styled correctly
            icon.style.display = 'inline-block';
            icon.style.width = '20px';
            icon.style.height = '18px';
            
            // Force a repaint to ensure CSS background images load
            icon.offsetHeight; // Trigger reflow
        });
        
        console.log('Static sidebar content enhanced successfully');
    }

    /**
     * Load dynamic template when no static content exists
     */
    async loadDynamicTemplate() {
        console.log('Loading dynamic template from:', this.templatePath);
        
        // Load the template
        const response = await fetch(this.templatePath);
        if (!response.ok) {
            throw new Error(`Failed to load sidebar template: ${response.status} - ${response.statusText}`);
        }

        const templateContent = await response.text();
        console.log('Template loaded successfully, length:', templateContent.length);
        
        // Clear existing content and inject new template
        this.sidebarElement.innerHTML = templateContent;
    }

    /**
     * Initialize sidebar functionality after loading
     */
    initializeSidebar() {
        this.initToggle();
        this.initResponsive();
        this.addAccessibilityFeatures();
        this.initLogout();
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('sidebarLoaded', {
            detail: { sidebar: this.sidebarElement }
        }));
    }

    /**
     * Initialize logout functionality
     */
    initLogout() {
        // Make handleLogout function globally available
        window.handleLogout = this.handleLogout.bind(this);
    }

    /**
     * Handle user logout
     */
    handleLogout(event) {
        event.preventDefault();
        
        // Use SessionManager if available
        if (window.SessionManager && typeof SessionManager.logout === 'function') {
            SessionManager.logout();
            return;
        }
        
        // Fallback: Clear any stored authentication data
        localStorage.removeItem('fivetrackr_session');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userData');
        
        // Clear any cookies
        document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Show logout confirmation (optional)
        console.log('User logged out successfully');
        
        // Redirect to home page
        window.location.href = '/webapp/src/pages/home.html';
    }

    /**
     * Initialize sidebar toggle functionality
     */
    initToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            if (sidebar && mainContent) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
                
                // Update toggle button icon
                const icon = toggleBtn.querySelector('.icon');
                if (sidebar.classList.contains('collapsed')) {
                    icon.className = 'icon icon-chevron-right';
                    toggleBtn.setAttribute('aria-label', 'Expand Sidebar');
                } else {
                    icon.className = 'icon icon-chevron-left';
                    toggleBtn.setAttribute('aria-label', 'Collapse Sidebar');
                }
                
                // Save state
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            }
        });

        // Restore previous state
        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (wasCollapsed) {
            toggleBtn.click();
        }
    }

    /**
     * Initialize responsive behavior
     */
    initResponsive() {
        const sidebar = this.sidebarElement;
        if (!sidebar) return;

        // Handle mobile view
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('mobile');
                document.body.classList.add('mobile-layout');
            } else {
                sidebar.classList.remove('mobile');
                document.body.classList.remove('mobile-layout');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        // Mobile overlay click to close
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !e.target.closest('.menu-toggle-btn')) {
                sidebar.classList.add('collapsed');
            }
        });
    }

    /**
     * Add accessibility features
     */
    addAccessibilityFeatures() {
        const navLinks = this.sidebarElement.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            // Add keyboard navigation
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });

            // Add focus management
            link.addEventListener('focus', () => {
                link.classList.add('focused');
            });

            link.addEventListener('blur', () => {
                link.classList.remove('focused');
            });
        });

        // Add ARIA labels
        this.sidebarElement.setAttribute('role', 'navigation');
        this.sidebarElement.setAttribute('aria-label', 'League Manager Navigation');
    }

    /**
     * Load fallback sidebar if template fails
     */
    loadFallbackSidebar() {
        if (!this.sidebarElement) return;

        this.sidebarElement.innerHTML = `
            <div class="sidebar-header">
                <div class="logo-container">
                    <img src="../../img/header-logo.svg" alt="5ive Trackr" class="logo">
                </div>
            </div>
            <div class="sidebar-error">
                <p>Navigation temporarily unavailable</p>
                <a href="/webapp/src/pages/dashboard.html">Return to Dashboard</a>
            </div>
        `;
    }

    /**
     * Update active navigation item
     */
    setActive(pageId) {
        if (!this.isLoaded) return;

        const navItems = this.sidebarElement.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Show/hide quick actions based on user permissions
     */
    updatePermissions(permissions = {}) {
        if (!this.isLoaded) return;

        const quickActions = this.sidebarElement.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            const actionType = action.querySelector('.action-link').getAttribute('data-action');
            const isAllowed = permissions[actionType] !== false;
            
            action.style.display = isAllowed ? 'block' : 'none';
        });
    }
}

// Auto-initialize for League Manager pages
(function() {
    'use strict';
    
    // Only initialize on league manager pages
    const isLeagueManagerPage = document.body.getAttribute('data-role') === 'league-manager' ||
                               window.location.pathname.includes('/league-manager/');
    
    if (isLeagueManagerPage) {
        const sidebar = new LeagueManagerSidebar();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => sidebar.loadSidebar());
        } else {
            sidebar.loadSidebar();
        }
        
        // Make sidebar instance globally available
        window.leagueManagerSidebar = sidebar;
    }
})();
