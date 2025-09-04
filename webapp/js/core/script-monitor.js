/**
 * 5ive Trackr Script Loading Monitor
 * Monitors proper loading of application scripts
 * 
 * @copyright 5ive Trackr 2025
 */

// Check if scripts are loading properly
window.scriptLoaded = false;
window.addEventListener('load', function() {
    console.log('Page fully loaded');
    if (!window.scriptLoaded) {
        console.error('App script did not load properly');
        alert('Warning: App script did not load properly. Please check your browser console for errors.');
    }
});
