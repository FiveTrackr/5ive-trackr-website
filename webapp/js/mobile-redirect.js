/**
 * 5ive Trackr Mobile Detection and Redirect System
 * 
 * Detects mobile devices and redirects to appropriate app stores
 * Optimizes web app for desktop-only experience
 * 
 * @copyright 5ive Trackr 2025
 * All rights reserved - Original code only
 */

class MobileRedirectManager {
    constructor() {
        // Load configuration from external config file if available
        const externalConfig = window.MobileRedirectConfig || {};
        
        this.config = {
            // App store URLs - to be updated when apps are published
            iosAppStoreUrl: 'https://apps.apple.com/app/5ive-trackr/ID_TO_BE_ADDED',
            androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.fivetrackr.app',
            
            // Detection settings
            enableRedirect: true,
            showBypassOption: true,
            redirectDelay: 1500, // milliseconds before redirect
            
            // Tablet handling - set to true to treat tablets as mobile
            redirectTablets: false,
            
            // Screen size thresholds (pixels)
            maxMobileWidth: 768,
            maxMobileHeight: 1024,
            
            // Debug mode - set to true to log detection details
            debugMode: false,
            
            // Merge with external configuration
            ...externalConfig
        };
        
        this.deviceInfo = {
            isMobile: false,
            isTablet: false,
            isDesktop: false,
            platform: 'unknown',
            userAgent: '',
            screenWidth: 0,
            screenHeight: 0,
            hasTouch: false
        };
    }

    /**
     * Initialize mobile detection and redirect system
     * Call this as early as possible in page load
     */
    init() {
        // Perform detection immediately
        this.detectDevice();
        
        // Log detection results if debug mode is enabled
        if (this.config.debugMode) {
            this.logDetectionResults();
        }
        
        // Handle redirect if mobile device detected
        if (this.shouldRedirect()) {
            this.handleMobileRedirect();
        } else {
            // Device is desktop - optimize for desktop experience
            this.optimizeForDesktop();
        }
    }

    /**
     * Comprehensive device detection
     */
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        this.deviceInfo.userAgent = userAgent;
        this.deviceInfo.screenWidth = window.screen.width;
        this.deviceInfo.screenHeight = window.screen.height;
        this.deviceInfo.hasTouch = this.detectTouchCapability();
        
        // FIRST: Check if this is Chrome DevTools device emulation
        const isDevToolsEmulation = this.detectDevToolsEmulation();
        
        if (isDevToolsEmulation) {
            // Override mobile detection - treat as desktop even if emulating mobile
            this.deviceInfo.isMobile = false;
            this.deviceInfo.isTablet = false;
            this.deviceInfo.isDesktop = true;
            this.deviceInfo.platform = 'desktop';
            this.deviceInfo.isDevToolsEmulation = true;
            
            if (this.config.debugMode) {
                console.log('5ive Trackr: Chrome DevTools device emulation detected - forcing desktop mode');
            }
            return;
        }
        
        // Normal device detection if not DevTools emulation
        const isMobileOS = this.detectMobileOS(userAgent);
        const isMobileScreen = this.detectMobileScreen();
        const isMobileBrowser = this.detectMobileBrowser(userAgent);
        
        // Combine detection methods for accuracy
        this.deviceInfo.isMobile = isMobileOS || (isMobileScreen && this.deviceInfo.hasTouch);
        this.deviceInfo.isTablet = this.detectTablet(userAgent);
        this.deviceInfo.isDesktop = !this.deviceInfo.isMobile && !this.deviceInfo.isTablet;
        this.deviceInfo.isDevToolsEmulation = false;
        
        // Determine platform
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            this.deviceInfo.platform = 'ios';
        } else if (userAgent.includes('android')) {
            this.deviceInfo.platform = 'android';
        } else if (userAgent.includes('windows phone')) {
            this.deviceInfo.platform = 'windows';
        } else {
            this.deviceInfo.platform = this.deviceInfo.isDesktop ? 'desktop' : 'mobile';
        }
    }

    /**
     * Detect mobile operating systems via user agent
     */
    detectMobileOS(userAgent) {
        const mobilePatterns = [
            /android/i,
            /webos/i,
            /iphone/i,
            /ipad/i,
            /ipod/i,
            /blackberry/i,
            /windows phone/i,
            /mobile/i
        ];
        
        return mobilePatterns.some(pattern => pattern.test(userAgent));
    }

    /**
     * Detect mobile screen dimensions
     */
    detectMobileScreen() {
        const width = Math.min(window.screen.width, window.screen.height);
        const height = Math.max(window.screen.width, window.screen.height);
        
        return width <= this.config.maxMobileWidth && height <= this.config.maxMobileHeight;
    }

    /**
     * Detect mobile browsers
     */
    detectMobileBrowser(userAgent) {
        const mobileBrowsers = [
            /chrome\/[0-9]+.*mobile/i,
            /safari.*mobile/i,
            /mobile.*safari/i,
            /crios/i, // Chrome iOS
            /fxios/i, // Firefox iOS
            /ucbrowser/i,
            /samsung.*browser/i
        ];
        
        return mobileBrowsers.some(pattern => pattern.test(userAgent));
    }

    /**
     * Detect tablet devices
     */
    detectTablet(userAgent) {
        const tabletPatterns = [
            /ipad/i,
            /android.*tablet/i,
            /kindle/i,
            /silk/i,
            /playbook/i,
            /tablet/i
        ];
        
        const isTabletUA = tabletPatterns.some(pattern => pattern.test(userAgent));
        
        // Also check screen size for tablet-like dimensions
        const width = window.screen.width;
        const height = window.screen.height;
        const isTabletScreen = (width >= 768 && width <= 1024) || (height >= 768 && height <= 1024);
        
        return isTabletUA || (isTabletScreen && this.deviceInfo.hasTouch);
    }

    /**
     * Detect touch capability
     */
    detectTouchCapability() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0) ||
               (window.TouchEvent !== undefined);
    }

    /**
     * Detect Chrome DevTools device emulation
     * When DevTools is emulating a mobile device, we want to treat it as desktop
     */
    detectDevToolsEmulation() {
        // Method 1: Check for DevTools-specific properties
        const hasDevTools = window.outerHeight - window.innerHeight > 160 || 
                           window.outerWidth - window.innerWidth > 160;
        
        // Method 2: Check if screen dimensions don't match window dimensions in suspicious ways
        const screenMismatch = Math.abs(window.screen.width - window.innerWidth) > 50 ||
                              Math.abs(window.screen.height - window.innerHeight) > 100;
        
        // Method 3: Check for Chrome-specific DevTools indicators
        const isChromeDevTools = navigator.userAgent.includes('Chrome') && 
                                (window.navigator.webdriver === true ||
                                 window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect);
        
        // Method 4: Detect if device pixel ratio suggests emulation
        const suspiciousPixelRatio = window.devicePixelRatio % 1 !== 0 && 
                                   window.devicePixelRatio < 1;
        
        // Method 5: Check for emulation-specific properties
        const hasEmulationProperties = 'ontouchstart' in window && 
                                     window.screen.width > 1200 && // Large screen with touch suggests emulation
                                     navigator.userAgent.includes('Chrome');
        
        // Method 6: Performance-based detection
        const performanceCheck = this.checkEmulationPerformance();
        
        // Method 7: Check for inconsistent touch/pointer events
        const touchInconsistency = this.checkTouchInconsistency();
        
        // If any strong indicators are present, consider it DevTools emulation
        const strongIndicators = hasDevTools || isChromeDevTools || touchInconsistency;
        const weakIndicators = screenMismatch || suspiciousPixelRatio || hasEmulationProperties || performanceCheck;
        
        // Require at least one strong indicator or multiple weak indicators
        const isEmulation = strongIndicators || (weakIndicators && this.countTrueValues([screenMismatch, suspiciousPixelRatio, hasEmulationProperties, performanceCheck]) >= 2);
        
        if (isEmulation && this.config.debugMode) {
            console.log('DevTools Emulation Detection:', {
                hasDevTools,
                screenMismatch,
                isChromeDevTools,
                suspiciousPixelRatio,
                hasEmulationProperties,
                performanceCheck,
                touchInconsistency,
                userAgent: navigator.userAgent,
                screen: { width: window.screen.width, height: window.screen.height },
                window: { width: window.innerWidth, height: window.innerHeight },
                outer: { width: window.outerWidth, height: window.outerHeight },
                devicePixelRatio: window.devicePixelRatio
            });
        }
        
        return isEmulation;
    }

    /**
     * Performance-based emulation detection
     */
    checkEmulationPerformance() {
        try {
            const start = performance.now();
            // Operations that are slower in emulated environments
            for (let i = 0; i < 1000; i++) {
                const temp = Math.random() * Math.PI;
            }
            const end = performance.now();
            
            // Emulated environments often have different performance characteristics
            return (end - start) > 10; // Arbitrary threshold, may need tuning
        } catch (e) {
            return false;
        }
    }

    /**
     * Check for touch event inconsistencies that suggest emulation
     */
    checkTouchInconsistency() {
        // If touch events are supported but we're on a desktop-class browser
        if ('ontouchstart' in window) {
            const userAgent = navigator.userAgent.toLowerCase();
            
            // Desktop Chrome/Firefox with touch suggests emulation
            const isDesktopBrowser = (userAgent.includes('chrome') || userAgent.includes('firefox')) &&
                                   !userAgent.includes('mobile') &&
                                   !userAgent.includes('tablet');
            
            // Large screen resolution with touch is suspicious
            const hasLargeScreen = window.screen.width > 1200 || window.screen.height > 800;
            
            return isDesktopBrowser && hasLargeScreen;
        }
        
        return false;
    }

    /**
     * Count true values in an array
     */
    countTrueValues(arr) {
        return arr.filter(Boolean).length;
    }

    /**
     * Determine if device should be redirected
     */
    shouldRedirect() {
        if (!this.config.enableRedirect) return false;
        
        // Never redirect if DevTools emulation is detected
        if (this.deviceInfo.isDevToolsEmulation) {
            this.showDevToolsEmulationWarning();
            return false;
        }
        
        // Always redirect mobile phones
        if (this.deviceInfo.isMobile && !this.deviceInfo.isTablet) return true;
        
        // Redirect tablets if configured to do so
        if (this.deviceInfo.isTablet && this.config.redirectTablets) return true;
        
        return false;
    }

    /**
     * Show warning when DevTools emulation is detected
     */
    showDevToolsEmulationWarning() {
        // Only show if debug mode is enabled (no localhost check needed)
        if (!this.config.debugMode) {
            return;
        }
        
        // Create warning notification
        setTimeout(() => {
            const warning = document.createElement('div');
            warning.id = 'devtools-emulation-warning';
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b35;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 600;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
                border: 2px solid #e55a2e;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            `;
            
            warning.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">⚠️</span>
                    <div>
                        <div style="font-weight: bold; margin-bottom: 5px;">DevTools Emulation Detected</div>
                        <div style="font-size: 12px; opacity: 0.9;">Mobile redirect bypassed for testing</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: auto;">×</button>
                </div>
            `;
            
            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(warning);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (warning.parentElement) {
                    warning.remove();
                }
            }, 10000);
            
        }, 1000);
    }

    /**
     * Handle mobile device redirect
     */
    handleMobileRedirect() {
        // Ensure DOM is ready before manipulating elements
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.executeRedirect();
            });
        } else {
            this.executeRedirect();
        }
    }

    /**
     * Execute the mobile redirect
     */
    executeRedirect() {
        // Ensure document.documentElement exists
        if (!document.documentElement) {
            setTimeout(() => this.executeRedirect(), 10);
            return;
        }

        // Prevent page from loading further
        document.documentElement.style.display = 'none';
        
        // Create redirect overlay
        this.createRedirectOverlay();
        
        // Set up automatic redirect
        if (!this.config.showBypassOption) {
            setTimeout(() => {
                this.performRedirect();
            }, this.config.redirectDelay);
        }
    }

    /**
     * Create visual redirect overlay
     */
    createRedirectOverlay() {
        // Ensure DOM and body are ready
        if (!document.body) {
            setTimeout(() => this.createRedirectOverlay(), 10);
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'mobile-redirect-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #2e6417 0%, #1e4009 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        const content = this.createRedirectContent();
        overlay.appendChild(content);
        
        // Show overlay
        if (document.documentElement) {
            document.documentElement.style.display = 'block';
        }
        document.body.appendChild(overlay);
    }

    /**
     * Create redirect content based on detected platform
     */
    createRedirectContent() {
        const container = document.createElement('div');
        container.style.cssText = 'max-width: 400px; width: 100%;';
        
        const logo = document.createElement('div');
        logo.style.cssText = `
            font-size: 48px;
            margin-bottom: 24px;
            font-weight: 800;
        `;
        logo.textContent = '⚽ 5ive Trackr';
        
        const title = document.createElement('h1');
        title.style.cssText = `
            font-size: 24px;
            margin: 0 0 16px 0;
            font-weight: 700;
        `;
        title.textContent = 'Mobile App Available';
        
        const message = document.createElement('p');
        message.style.cssText = `
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 32px 0;
            opacity: 0.9;
        `;
        
        let platformMessage = '';
        if (this.deviceInfo.platform === 'ios') {
            platformMessage = 'Download the 5ive Trackr app from the App Store for the best mobile experience.';
        } else if (this.deviceInfo.platform === 'android') {
            platformMessage = 'Download the 5ive Trackr app from Google Play for the best mobile experience.';
        } else {
            platformMessage = 'Download the 5ive Trackr mobile app for the best experience on your device.';
        }
        
        message.textContent = platformMessage;
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
        `;
        
        // Download button
        const downloadBtn = this.createDownloadButton();
        buttonsContainer.appendChild(downloadBtn);
        
        // Bypass option if enabled
        if (this.config.showBypassOption) {
            const bypassBtn = this.createBypassButton();
            buttonsContainer.appendChild(bypassBtn);
        }
        
        container.appendChild(logo);
        container.appendChild(title);
        container.appendChild(message);
        container.appendChild(buttonsContainer);
        
        return container;
    }

    /**
     * Create platform-specific download button
     */
    createDownloadButton() {
        const button = document.createElement('button');
        button.style.cssText = `
            background: white;
            color: #2e6417;
            border: none;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        `;
        
        let buttonText = 'Download App';
        if (this.deviceInfo.platform === 'ios') {
            buttonText = '📱 Download from App Store';
        } else if (this.deviceInfo.platform === 'android') {
            buttonText = '📱 Download from Google Play';
        }
        
        button.textContent = buttonText;
        
        button.addEventListener('click', () => {
            this.performRedirect();
        });
        
        button.addEventListener('mouseover', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
        
        return button;
    }

    /**
     * Create bypass button for edge cases
     */
    createBypassButton() {
        const button = document.createElement('button');
        button.style.cssText = `
            background: transparent;
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        `;
        
        button.textContent = 'Continue to Web App Anyway';
        
        button.addEventListener('click', () => {
            this.bypassRedirect();
        });
        
        button.addEventListener('mouseover', () => {
            button.style.borderColor = 'white';
            button.style.backgroundColor = 'rgba(255,255,255,0.1)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.borderColor = 'rgba(255,255,255,0.3)';
            button.style.backgroundColor = 'transparent';
        });
        
        return button;
    }

    /**
     * Perform redirect to appropriate app store
     */
    performRedirect() {
        let redirectUrl = '';
        
        if (this.deviceInfo.platform === 'ios') {
            redirectUrl = this.config.iosAppStoreUrl;
        } else if (this.deviceInfo.platform === 'android') {
            redirectUrl = this.config.androidPlayStoreUrl;
        } else {
            // Fallback - could show both options or default to one
            redirectUrl = this.config.androidPlayStoreUrl;
        }
        
        window.location.href = redirectUrl;
    }

    /**
     * Allow user to bypass redirect and continue to web app
     */
    bypassRedirect() {
        const overlay = document.getElementById('mobile-redirect-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        // Add flag to prevent re-triggering
        sessionStorage.setItem('mobileRedirectBypassed', 'true');
        
        // Continue with desktop optimization
        this.optimizeForDesktop();
    }

    /**
     * Optimize web app for desktop experience
     */
    optimizeForDesktop() {
        // Ensure DOM is ready before manipulating body
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyDesktopOptimizations();
            });
        } else {
            this.applyDesktopOptimizations();
        }
    }

    /**
     * Apply desktop optimizations to the page
     */
    applyDesktopOptimizations() {
        // Ensure body exists
        if (!document.body) {
            setTimeout(() => this.applyDesktopOptimizations(), 10);
            return;
        }

        // Add desktop-only class to body
        document.body.classList.add('desktop-only');
        document.body.setAttribute('data-device', 'desktop');
        
        // Add desktop-specific styles
        this.addDesktopStyles();
        
        // Enable desktop-specific features
        this.enableDesktopFeatures();
    }

    /**
     * Add desktop-optimized styles
     */
    addDesktopStyles() {
        // Ensure head exists
        if (!document.head) {
            setTimeout(() => this.addDesktopStyles(), 10);
            return;
        }

        // Check if styles already added
        if (document.getElementById('desktop-optimization-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'desktop-optimization-styles';
        style.textContent = `
            /* Desktop-Only Optimizations */
            .desktop-only {
                min-width: 1024px;
                cursor: default;
            }
            
            /* Remove mobile-specific styles */
            .desktop-only * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: auto;
                user-select: auto;
            }
            
            /* Enhanced hover effects for desktop */
            .desktop-only button:hover,
            .desktop-only .btn:hover,
            .desktop-only .nav-link:hover {
                transform: translateY(-1px);
                transition: all 0.2s ease;
            }
            
            /* Desktop-specific cursor styles */
            .desktop-only .clickable,
            .desktop-only button,
            .desktop-only .btn,
            .desktop-only .nav-link,
            .desktop-only .calendar-day {
                cursor: pointer;
            }
            
            /* Scrollbar styling for desktop */
            .desktop-only ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            .desktop-only ::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .desktop-only ::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            
            .desktop-only ::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Enable desktop-specific features
     */
    enableDesktopFeatures() {
        // Enable right-click context menus
        document.addEventListener('contextmenu', (e) => {
            // Allow right-click for text selection, etc.
            // Can be customized per element if needed
        });
        
        // Enable keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Add desktop keyboard shortcuts here
            // e.g., Ctrl+N for new pitch, Ctrl+E for export, etc.
        });
        
        // Enable drag and drop if needed in future
        // Will be implemented when drag-drop features are added
        
        console.log('Desktop optimizations enabled');
    }

    /**
     * Log detection results for debugging
     */
    logDetectionResults() {
        console.group('🔍 Mobile Detection Results');
        console.log('User Agent:', this.deviceInfo.userAgent);
        console.log('Screen Dimensions:', `${this.deviceInfo.screenWidth}x${this.deviceInfo.screenHeight}`);
        console.log('Touch Capability:', this.deviceInfo.hasTouch);
        console.log('Platform:', this.deviceInfo.platform);
        console.log('Is Mobile:', this.deviceInfo.isMobile);
        console.log('Is Tablet:', this.deviceInfo.isTablet);
        console.log('Is Desktop:', this.deviceInfo.isDesktop);
        console.log('Should Redirect:', this.shouldRedirect());
        console.groupEnd();
    }

    /**
     * Update configuration (for when app store URLs are available)
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Check if redirect was bypassed this session
     */
    wasRedirectBypassed() {
        return sessionStorage.getItem('mobileRedirectBypassed') === 'true';
    }
}

// Initialization logic with proper DOM handling
function initializeMobileRedirect() {
    // Only initialize if redirect wasn't bypassed this session
    if (sessionStorage.getItem('mobileRedirectBypassed') === 'true') {
        // Still optimize for desktop even if bypassed
        const manager = new MobileRedirectManager();
        manager.optimizeForDesktop();
        return;
    }

    window.mobileRedirectManager = new MobileRedirectManager();
    window.mobileRedirectManager.init();
}

// Auto-initialize based on document state
if (document.readyState === 'loading') {
    // DOM is still loading
    document.addEventListener('DOMContentLoaded', initializeMobileRedirect);
} else {
    // DOM is already loaded
    initializeMobileRedirect();
}

// Also listen for DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', () => {
    // Only run if not already initialized
    if (!window.mobileRedirectManager && !sessionStorage.getItem('mobileRedirectBypassed')) {
        initializeMobileRedirect();
    }
});

// Export for manual initialization if needed
window.MobileRedirectManager = MobileRedirectManager;
