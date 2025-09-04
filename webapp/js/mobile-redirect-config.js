/**
 * 5ive Trackr Mobile Redirect Configuration
 * 
 * Centralized configuration for mobile detection and app store redirects
 * Update this file when app store URLs become available
 * 
 * @copyright 5ive Trackr 2025
 */

window.MobileRedirectConfig = {
    // ===========================================
    // APP STORE URLs - UPDATE WHEN AVAILABLE
    // ===========================================
    
    // iOS App Store URL - Update when iOS app is published
    iosAppStoreUrl: 'https://apps.apple.com/app/5ive-trackr/ID_TO_BE_ADDED',
    
    // Android Google Play URL - Update when Android app is published  
    androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.fivetrackr.app',
    
    // ===========================================
    // REDIRECT BEHAVIOR SETTINGS
    // ===========================================
    
    // Enable/disable the redirect system
    enableRedirect: true,
    
    // Show "Continue to Web App" option for edge cases
    showBypassOption: true,
    
    // Delay before automatic redirect (milliseconds)
    redirectDelay: 1500,
    
    // ===========================================
    // DEVICE DETECTION SETTINGS
    // ===========================================
    
    // Treat tablets as mobile devices (redirect them too)
    redirectTablets: false,
    
    // Screen size thresholds for mobile detection (pixels)
    maxMobileWidth: 768,
    maxMobileHeight: 1024,
    
    // ===========================================
    // DEVELOPMENT & DEBUGGING
    // ===========================================
    
    // Enable debug logging in browser console
    debugMode: false,
    
    // ===========================================
    // CUSTOM MESSAGES
    // ===========================================
    
    messages: {
        ios: {
            title: 'Mobile App Available',
            description: 'Download the 5ive Trackr app from the App Store for the best mobile experience.',
            buttonText: '📱 Download from App Store'
        },
        android: {
            title: 'Mobile App Available', 
            description: 'Download the 5ive Trackr app from Google Play for the best mobile experience.',
            buttonText: '📱 Download from Google Play'
        },
        generic: {
            title: 'Mobile App Available',
            description: 'Download the 5ive Trackr mobile app for the best experience on your device.',
            buttonText: '📱 Download App'
        }
    },
    
    // ===========================================
    // STYLING CUSTOMIZATION
    // ===========================================
    
    styling: {
        // Primary brand color for overlay background
        primaryColor: '#2e6417',
        primaryColorDark: '#1e4009',
        
        // Text colors
        textColor: '#ffffff',
        textColorSecondary: 'rgba(255,255,255,0.9)',
        
        // Button styling
        buttonBackgroundColor: '#ffffff',
        buttonTextColor: '#2e6417',
        
        // Border and accent colors
        borderColor: 'rgba(255,255,255,0.3)',
        borderColorHover: '#ffffff'
    }
};

// ===========================================
// QUICK CONFIGURATION FUNCTIONS
// ===========================================

/**
 * Update app store URLs when they become available
 * @param {Object} urls - Object with iosAppStoreUrl and/or androidPlayStoreUrl
 */
window.updateAppStoreUrls = function(urls) {
    if (urls.iosAppStoreUrl) {
        window.MobileRedirectConfig.iosAppStoreUrl = urls.iosAppStoreUrl;
    }
    if (urls.androidPlayStoreUrl) {
        window.MobileRedirectConfig.androidPlayStoreUrl = urls.androidPlayStoreUrl;
    }
    
    // Update the redirect manager if it exists
    if (window.mobileRedirectManager) {
        window.mobileRedirectManager.updateConfig(urls);
    }
    
    console.log('📱 App store URLs updated:', urls);
};

/**
 * Enable or disable redirects
 * @param {boolean} enabled - Whether to enable redirects
 */
window.toggleMobileRedirect = function(enabled) {
    window.MobileRedirectConfig.enableRedirect = enabled;
    
    if (window.mobileRedirectManager) {
        window.mobileRedirectManager.updateConfig({ enableRedirect: enabled });
    }
    
    console.log('📱 Mobile redirect', enabled ? 'enabled' : 'disabled');
};

/**
 * Enable debug mode to see detection details
 * @param {boolean} debug - Whether to enable debug mode
 */
window.setMobileRedirectDebug = function(debug) {
    window.MobileRedirectConfig.debugMode = debug;
    
    if (window.mobileRedirectManager) {
        window.mobileRedirectManager.updateConfig({ debugMode: debug });
    }
    
    console.log('🔍 Mobile redirect debug mode', debug ? 'enabled' : 'disabled');
};

// ===========================================
// EXAMPLE USAGE (Remove when URLs are ready)
// ===========================================

/*
// When your apps are published, update the URLs like this:

window.updateAppStoreUrls({
    iosAppStoreUrl: 'https://apps.apple.com/app/5ive-trackr/id1234567890',
    androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.fivetrackr.app'
});

// To temporarily disable redirects during development:
window.toggleMobileRedirect(false);

// To enable debug logging:
window.setMobileRedirectDebug(true);
*/
