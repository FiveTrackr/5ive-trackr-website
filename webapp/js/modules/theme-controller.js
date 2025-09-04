/**
 * 5ive Trackr Theme Controller
 * 
 * This script handles the theme switching functionality between light and dark mode
 * for the 5ive Trackr application. It saves user preferences to localStorage
 * and applies the correct theme on page load.
 * 
 * Original code created for 5ive Trackr.
 */

class ThemeController {
    constructor() {
        this.darkModeKey = '5iveTrackr-darkMode';
        this.darkModeClass = 'dark-mode';
        this.themeSwitch = document.getElementById('theme-switch');
        
        this.init();
    }
    
    init() {
        // Check for saved user preference
        this.loadUserPreference();
        
        // Add event listener to the theme switch
        if (this.themeSwitch) {
            this.themeSwitch.addEventListener('change', () => this.toggleTheme());
        }
        
        // Also listen for system preference changes
        this.listenForSystemPreferenceChanges();
    }
    
    loadUserPreference() {
        try {
            // Check if user has a saved preference
            const userPreference = localStorage.getItem(this.darkModeKey);
            
            if (userPreference !== null) {
                // Apply saved preference
                const isDarkMode = userPreference === 'true';
                this.applyTheme(isDarkMode);
            } else {
                // If no saved preference, check system preference
                this.checkSystemPreference();
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
            // Fall back to light mode
            this.applyTheme(false);
        }
    }
    
    checkSystemPreference() {
        // Check if system prefers dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.applyTheme(true);
        } else {
            this.applyTheme(false);
        }
    }
    
    listenForSystemPreferenceChanges() {
        // Listen for system preference changes if supported
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', e => {
                    // Only apply if user hasn't set a preference
                    if (!localStorage.getItem(this.darkModeKey)) {
                        this.applyTheme(e.matches);
                    }
                });
        }
    }
    
    toggleTheme() {
        const isDarkMode = this.themeSwitch.checked;
        this.applyTheme(isDarkMode);
        
        // Save user preference
        try {
            localStorage.setItem(this.darkModeKey, isDarkMode.toString());
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    }
    
    applyTheme(isDarkMode) {
        if (isDarkMode) {
            document.body.classList.add(this.darkModeClass);
            if (this.themeSwitch) this.themeSwitch.checked = true;
        } else {
            document.body.classList.remove(this.darkModeClass);
            if (this.themeSwitch) this.themeSwitch.checked = false;
        }
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { darkMode: isDarkMode } 
        }));
    }
}

// Initialize the theme controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeController = new ThemeController();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeController;
}
