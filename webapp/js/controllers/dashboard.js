// 5ive Trackr Dashboard JavaScript
console.log('Dashboard loaded');

// Session Management
const SessionManager = {
    // Get current session if it exists
    getSession: function() {
        const sessionData = localStorage.getItem('fivetrackr_session');
        return sessionData ? JSON.parse(sessionData) : null;
    },
    
    // Check if user is logged in
    isLoggedIn: function() {
        return this.getSession() !== null;
    },
    
    // Update last activity time
    updateActivity: function() {
        const session = this.getSession();
        if (session) {
            session.lastActivity = new Date().toISOString();
            localStorage.setItem('fivetrackr_session', JSON.stringify(session));
        }
    },
    
    // End the session
    endSession: function() {
        localStorage.removeItem('fivetrackr_session');
        // Account for subdirectory path
        window.location.href = '/webapp/src/pages/home.html';
    }
};

// Dashboard UI Controller
const DashboardUI = {
    // Initialize the dashboard
    init: function() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.setCurrentDate();
        
        // Check if user is logged in
        if (!SessionManager.isLoggedIn()) {
            window.location.href = '/webapp/src/pages/home.html';
            return;
        }
        
        // Update activity
        SessionManager.updateActivity();
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Toggle sidebar
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this.toggleSidebar);
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                SessionManager.endSession();
            });
        }
        
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item a');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Only prevent default for internal navigation
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    
                    // Update active class
                    navItems.forEach(nav => nav.parentElement.classList.remove('active'));
                    this.parentElement.classList.add('active');
                    
                    // Update page title
                    const pageTitle = document.getElementById('page-title');
                    if (pageTitle) {
                        pageTitle.textContent = this.querySelector('.label').textContent;
                    }
                    
                    // If on mobile, close the sidebar
                    if (window.innerWidth <= 768) {
                        document.querySelector('.sidebar').classList.remove('active');
                    }
                    
                    // Load the content
                    DashboardUI.loadContent(href.substring(1));
                }
            });
        });
    },
    
    // Toggle sidebar (mobile)
    toggleSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    },
    
    // Load user information
    loadUserInfo: function() {
        if (!SessionManager.isLoggedIn()) return;
        const user = SessionManager.getCurrentUser();
        
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && user && (user.fullName || user.username)) {
            userNameEl.textContent = user.fullName || user.username;
        }
    },
    
    // Set current date
    setCurrentDate: function() {
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            const today = new Date();
            dateEl.textContent = today.toLocaleDateString('en-GB', options);
        }
    },
    
    // Load content for different sections
    loadContent: function(section) {
        console.log(`Loading content for section: ${section}`);
        // This would normally load content via AJAX or switch visible sections
        // For this demo, we're just logging the section change
    }
};

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    DashboardUI.init();
});
