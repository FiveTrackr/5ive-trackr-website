/**
 * 5ive Trackr UI Enhancements
 * 
 * Additional UI improvements and interactions
 * 
 * @copyright 5ive Trackr 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add subtle hover effect to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.05)';
        });
    });
    
    // Add transition styles for tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Handle tab transition
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Apply smooth transition to tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                if (content.classList.contains('active')) {
                    content.style.opacity = '0';
                    setTimeout(() => {
                        content.classList.remove('active');
                    }, 300);
                }
            });
            
            // Show the selected tab content
            const targetId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                setTimeout(() => {
                    targetContent.classList.add('active');
                    setTimeout(() => {
                        targetContent.style.opacity = '1';
                    }, 50);
                }, 300);
            }
        });
    });
    
    // Add subtle animations to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add transition for sidebar toggle
    const sidebarToggle = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            if (sidebar.classList.contains('collapsed')) {
                this.querySelector('.icon').classList.remove('icon-chevron-left');
                this.querySelector('.icon').classList.add('icon-chevron-right');
            } else {
                this.querySelector('.icon').classList.remove('icon-chevron-right');
                this.querySelector('.icon').classList.add('icon-chevron-left');
            }
        });
    }
    
    // User dropdown menu
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (userMenu && dropdownMenu) {
        userMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('active');
        });
    }
});
