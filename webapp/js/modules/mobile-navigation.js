/**
 * 5ive Trackr Mobile Navigation
 * Handles responsive mobile navigation and menu toggling
 * 
 * @copyright 5ive Trackr 2025
 */

class MobileNavigation {
    constructor() {
        this.toggleButton = document.getElementById('toggle-sidebar');
        this.sidebar = document.querySelector('.sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-overlay';
        
        this.init();
    }
    
    init() {
        // Add overlay to the DOM
        document.body.appendChild(this.overlay);
        
        // Set up event listeners
        this.toggleButton.addEventListener('click', () => this.toggleSidebar());
        this.overlay.addEventListener('click', () => this.closeSidebar());
        
        // Check for screen resizes
        window.addEventListener('resize', () => this.handleResize());
        
        // Initialize based on current screen size
        this.handleResize();
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('active');
        
        // Toggle overlay
        if (this.sidebar.classList.contains('active')) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            this.overlay.classList.remove('active');
            document.body.style.overflow = ''; // Allow scrolling
        }
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.style.overflow = ''; // Allow scrolling
    }
    
    handleResize() {
        if (window.innerWidth > 768) {
            // On larger screens, always show the sidebar
            this.sidebar.classList.remove('active');
            this.overlay.classList.remove('active');
            document.body.style.overflow = ''; // Allow scrolling
        }
    }
}

// Initialize the mobile navigation when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.mobileNavigation = new MobileNavigation();
});
