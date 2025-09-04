/**
 * 5ive Trackr Fixed Sidebar Controller
 * 
 * This script handles the interaction for the fixed sidebar layout
 * with scrollable content, ensuring proper behavior on different devices
 * 
 * @copyright 5ive Trackr 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    
    // Initialize sidebar state based on screen size
    function initSidebarState() {
        if (window.innerWidth < 768) {
            body.classList.add('sidebar-collapsed');
            sidebar.classList.remove('active');
        }
    }
    
    // Handle sidebar toggle on button click
    function setupSidebarToggle() {
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (window.innerWidth < 768) {
                    // For mobile: show/hide sidebar
                    body.classList.toggle('sidebar-active');
                    sidebar.classList.toggle('active');
                } else {
                    // For desktop: collapse/expand sidebar
                    body.classList.toggle('sidebar-collapsed');
                }
            });
        }
    }
    
    // Close sidebar on mobile when clicking outside
    function setupOutsideClickHandler() {
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 768 && 
                !sidebar.contains(e.target) && 
                e.target !== sidebarToggleBtn &&
                body.classList.contains('sidebar-active')) {
                
                body.classList.remove('sidebar-active');
                sidebar.classList.remove('active');
            }
        });
    }
    
    // Handle window resize events
    function setupResizeHandler() {
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                sidebar.classList.remove('active');
                body.classList.remove('sidebar-active');
            } else {
                body.classList.add('sidebar-collapsed');
            }
        });
    }
    
    // Initialize all event handlers
    initSidebarState();
    setupSidebarToggle();
    setupOutsideClickHandler();
    setupResizeHandler();
});
