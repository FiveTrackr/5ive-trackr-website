/**
 * 5ive Trackr Toggle Button Remover
 * 
 * This script removes all sidebar toggle buttons from the DOM
 * 
 * @copyright 5ive Trackr 2025
 */

// Immediately remove any toggle buttons when the script loads
(function() {
    // Function to remove toggle buttons
    function removeToggleButtons() {
        // Find and remove the toggle button by ID
        const toggleById = document.getElementById('toggle-sidebar');
        if (toggleById && toggleById.parentNode) {
            toggleById.parentNode.removeChild(toggleById);
            console.log('Removed toggle button by ID');
        }
        
        // Find and remove by class
        const togglesByClass = document.querySelectorAll('.sidebar-toggle');
        togglesByClass.forEach(button => {
            if (button && button.parentNode) {
                button.parentNode.removeChild(button);
                console.log('Removed toggle button by class');
            }
        });
    }
    
    // Run immediately
    removeToggleButtons();
    
    // Also run when DOM is fully loaded to catch any dynamically added buttons
    document.addEventListener('DOMContentLoaded', removeToggleButtons);
    
    // Run periodically to catch any buttons that might be added by scripts
    setInterval(removeToggleButtons, 500);
})();
