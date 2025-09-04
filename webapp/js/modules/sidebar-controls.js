/**
 * 5ive Trackr Sidebar Controls
 * 
 * Sidebar controls - toggle functionality has been removed
 * 
 * @copyright 5ive Trackr 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get sidebar element
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Remove the toggle button if it exists
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn && toggleBtn.parentNode) {
        toggleBtn.parentNode.removeChild(toggleBtn);
    }
    
    // Ensure sidebar is in expanded state
    if (sidebar) {
        sidebar.classList.remove('collapsed');
    }
    
    // Adjust main content to match expanded sidebar
    if (sidebar && mainContent) {
        mainContent.style.width = 'calc(100% - 250px)';
        mainContent.style.marginLeft = '250px';
    }
    
    // Remove the stored collapsed state
    localStorage.removeItem('sidebarCollapsed');
    
    // Mobile menu handling
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-button';
    mobileMenuBtn.innerHTML = '<span class="icon icon-menu"></span>';
    
    // Only add mobile button on small screens
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    if (mediaQuery.matches) {
        const header = document.querySelector('.dashboard-header');
        if (header) {
            header.insertBefore(mobileMenuBtn, header.firstChild);
            
            // Handle mobile menu button click
            mobileMenuBtn.addEventListener('click', function() {
                if (sidebar) {
                    sidebar.classList.toggle('mobile-open');
                    
                    // Create overlay if it doesn't exist
                    let overlay = document.querySelector('.mobile-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.className = 'mobile-overlay';
                        document.body.appendChild(overlay);
                        
                        // Close sidebar when clicking overlay
                        overlay.addEventListener('click', function() {
                            sidebar.classList.remove('mobile-open');
                        });
                    }
                }
            });
        }
    }
    
    // Restore sidebar state from localStorage
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true' && sidebar) {
        sidebar.classList.add('collapsed');
        
        // Update toggle button icon
        const icon = toggleBtn?.querySelector('.icon');
        if (icon) {
            icon.classList.remove('icon-chevron-left');
            icon.classList.add('icon-chevron-right');
        }
        
        // Adjust main content width on load
        adjustContentWidth();
    }
    
    // Initial layout adjustment
    adjustContentWidth();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Add mobile menu button if it doesn't exist
            if (!document.querySelector('.mobile-menu-button')) {
                const header = document.querySelector('.dashboard-header');
                if (header) {
                    header.insertBefore(mobileMenuBtn, header.firstChild);
                }
            }
            
            // Remove mobile-open class when resizing to mobile
            if (sidebar) {
                sidebar.classList.remove('mobile-open');
            }
        } else {
            // Remove mobile menu button on larger screens
            const mobileBtn = document.querySelector('.mobile-menu-button');
            if (mobileBtn) {
                mobileBtn.remove();
            }
            
            // Remove overlay
            const overlay = document.querySelector('.mobile-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    });
});
