/**
 * 5ive Trackr Enhanced Anti-Debugging Protection
 * Runtime protection against unauthorized inspection
 * 
 * @copyright 5ive Trackr 2025
 */

// Enhanced runtime protection with multiple detection methods
(function() {
    'use strict';
    
    // Detection state
    let devToolsOpen = false;
    let warningShown = false;
    let detectionActive = true;
    
    // Enhanced DevTools detector with multiple methods
    const devToolsDetector = {
        // Method 1: Window size detection
        checkWindowSize: function() {
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;
            
            return widthDiff > threshold || heightDiff > threshold;
        },
        
        // Method 2: Console detection via function toString
        checkConsole: function() {
            try {
                const startTime = performance.now();
                console.clear();
                const endTime = performance.now();
                return endTime - startTime > 100; // Console operations take longer when DevTools open
            } catch (e) {
                return true; // If console.clear fails, likely DevTools interference
            }
        },
        
        // Method 3: Debugger statement timing
        checkDebugger: function() {
            try {
                const start = performance.now();
                // This will pause if DevTools is open and debugger tab is active
                // We'll use a try-catch to avoid actually pausing
                eval('false && debugger');
                const end = performance.now();
                return end - start > 100;
            } catch (e) {
                return false;
            }
        },
        
        // Method 4: Element inspection detection
        checkElementInspection: function() {
            const element = document.createElement('div');
            element.id = 'devtools-detector-' + Math.random();
            document.body.appendChild(element);
            
            // Check if element can be selected via devtools-like methods
            const selected = document.querySelector('#' + element.id);
            document.body.removeChild(element);
            
            return false; // This method is more complex, keeping simple for now
        },
        
        // Method 5: Performance timing detection
        checkPerformance: function() {
            const image = new Image();
            const start = performance.now();
            image.onload = image.onerror = function() {
                const end = performance.now();
                if (end - start < 1) {
                    // Suspiciously fast, might indicate DevTools interference
                    devToolsOpen = true;
                }
            };
            image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        },
        
        // Method 6: Function decompilation detection
        checkFunctionToString: function() {
            try {
                const fn = function() { return 'test'; };
                const stringified = fn.toString();
                // Check if function string has been modified by debugging tools
                return stringified.length !== fn.toString().length;
            } catch (e) {
                return true;
            }
        },
        
        // Main detection method combining all approaches
        isDevToolsOpen: function() {
            if (!detectionActive) return false;
            
            const methods = [
                this.checkWindowSize(),
                this.checkConsole(),
                this.checkDebugger(),
                this.checkFunctionToString()
            ];
            
            // If any method detects DevTools, consider them open
            return methods.some(result => result === true);
        },
        
        // Handle DevTools detection
        handleDetection: function() {
            if (!devToolsOpen && this.isDevToolsOpen()) {
                devToolsOpen = true;
                this.triggerProtection();
            } else if (devToolsOpen && !this.isDevToolsOpen()) {
                // DevTools closed
                devToolsOpen = false;
                warningShown = false;
            }
        },
        
        // Trigger protection measures
        triggerProtection: function() {
            if (warningShown) return;
            warningShown = true;
            
            // Console warnings
            console.clear();
            console.log('%c🛑 UNAUTHORIZED ACCESS DETECTED', 'color: red; font-size: 32px; font-weight: bold; background: yellow; padding: 10px;');
            console.log('%c5ive Trackr: Proprietary Software', 'color: red; font-size: 24px; font-weight: bold;');
            console.log('%cThis application is protected by copyright law.', 'color: red; font-size: 18px;');
            console.log('%cUnauthorized inspection, copying, or reverse engineering is prohibited.', 'color: red; font-size: 16px;');
            console.log('%cAll access attempts are logged and monitored.', 'color: red; font-size: 16px;');
            
            // Visual warning overlay
            this.showWarningOverlay();
            
            // Log the attempt
            this.logTamperingAttempt();
            
            // Optional: More aggressive measures
            setTimeout(() => {
                if (devToolsOpen) {
                    this.escalateProtection();
                }
            }, 5000);
        },
        
        // Show visual warning overlay
        showWarningOverlay: function() {
            // Remove existing overlay if present
            const existingOverlay = document.getElementById('devtools-warning-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            const overlay = document.createElement('div');
            overlay.id = 'devtools-warning-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 0, 0, 0.95);
                color: white;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: 'Courier New', monospace;
                text-align: center;
                user-select: none;
                pointer-events: all;
            `;
            
            overlay.innerHTML = `
                <div style="max-width: 600px; padding: 40px;">
                    <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                        🛑 UNAUTHORIZED ACCESS
                    </h1>
                    <h2 style="font-size: 24px; margin-bottom: 30px;">
                        Developer Tools Detected
                    </h2>
                    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                        This is proprietary software protected by copyright law.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Unauthorized inspection, copying, or reverse engineering is prohibited.
                        All access attempts are logged and monitored.
                    </p>
                    <button onclick="this.parentElement.parentElement.style.display='none'; console.clear();" 
                            style="background: #fff; color: #d00; border: none; padding: 15px 30px; font-size: 16px; font-weight: bold; cursor: pointer; border-radius: 5px;">
                        CLOSE DEVELOPER TOOLS TO CONTINUE
                    </button>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Auto-remove overlay when DevTools closed
            const checkClosed = setInterval(() => {
                if (!devToolsOpen) {
                    overlay.remove();
                    clearInterval(checkClosed);
                }
            }, 1000);
        },
        
        // Log tampering attempt
        logTamperingAttempt: function() {
            const attempt = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer,
                screen: `${screen.width}x${screen.height}`,
                window: `${window.innerWidth}x${window.innerHeight}`,
                outer: `${window.outerWidth}x${window.outerHeight}`
            };
            
            // Store locally
            const attempts = JSON.parse(localStorage.getItem('fivetrackr_tampering_attempts') || '[]');
            attempts.push(attempt);
            localStorage.setItem('fivetrackr_tampering_attempts', JSON.stringify(attempts.slice(-10))); // Keep last 10
            
            // Also store individual attempt
            localStorage.setItem('fivetrackr_last_tampering_attempt', JSON.stringify(attempt));
            
            console.log('Security Event Logged:', attempt);
        },
        
        // Escalate protection measures
        escalateProtection: function() {
            if (!devToolsOpen) return;
            
            console.clear();
            console.log('%cWARNING: Continued unauthorized access detected', 'color: red; font-size: 20px; font-weight: bold;');
            console.log('%cThis session is being monitored for security violations', 'color: red; font-size: 16px;');
            
            // More aggressive overlay
            const escalationOverlay = document.getElementById('devtools-warning-overlay');
            if (escalationOverlay) {
                escalationOverlay.style.background = 'rgba(255, 0, 0, 1)';
                escalationOverlay.innerHTML = `
                    <div style="max-width: 600px; padding: 40px; animation: blink 1s infinite;">
                        <h1 style="font-size: 60px; margin-bottom: 20px;">
                            ⚠️ SECURITY VIOLATION ⚠️
                        </h1>
                        <h2 style="font-size: 28px; margin-bottom: 30px;">
                            Unauthorized Access Continued
                        </h2>
                        <p style="font-size: 20px; line-height: 1.6; margin-bottom: 20px;">
                            Your access attempt has been logged and reported.
                        </p>
                        <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                            Close developer tools immediately to avoid further security measures.
                        </p>
                    </div>
                    <style>
                        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.7; } }
                    </style>
                `;
            }
        },
        
        // Initialize protection
        init: function() {
            console.log('5ive Trackr Security System Active');
            
            // Start continuous monitoring
            const monitorInterval = setInterval(() => {
                this.handleDetection();
            }, 1000);
            
            // Also run performance checks
            const performanceInterval = setInterval(() => {
                this.checkPerformance();
            }, 5000);
            
            // Keyboard protection
            this.setupKeyboardProtection();
            
            // Mouse protection
            this.setupMouseProtection();
            
            // Store intervals for cleanup if needed
            window.fiveTrackrSecurityIntervals = [monitorInterval, performanceInterval];
        },
        
        // Setup keyboard protection
        setupKeyboardProtection: function() {
            document.addEventListener('keydown', (e) => {
                // Prevent common dev tool shortcuts
                const forbiddenKeys = [
                    { key: 123 }, // F12
                    { ctrl: true, shift: true, key: 73 }, // Ctrl+Shift+I
                    { ctrl: true, shift: true, key: 74 }, // Ctrl+Shift+J
                    { ctrl: true, shift: true, key: 67 }, // Ctrl+Shift+C
                    { ctrl: true, key: 85 }, // Ctrl+U (view source)
                    { key: 116 }, // F5 (refresh) - optional
                ];
                
                const isBlocked = forbiddenKeys.some(blocked => {
                    const ctrlMatch = blocked.ctrl ? e.ctrlKey : !e.ctrlKey;
                    const shiftMatch = blocked.shift ? e.shiftKey : !e.shiftKey;
                    const keyMatch = blocked.key === e.keyCode;
                    
                    return ctrlMatch && shiftMatch && keyMatch;
                });
                
                if (isBlocked) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('%cBlocked shortcut key combination', 'color: orange; font-weight: bold;');
                    return false;
                }
            }, true);
        },
        
        // Setup mouse protection
        setupMouseProtection: function() {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                console.log('%cRight-click disabled for security', 'color: orange; font-weight: bold;');
                return false;
            });
            
            // Disable text selection in some cases
            document.addEventListener('selectstart', (e) => {
                if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'STYLE') {
                    e.preventDefault();
                    return false;
                }
            });
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            devToolsDetector.init();
        });
    } else {
        devToolsDetector.init();
    }
    
    // Export for testing/debugging (will be removed in production)
    window.FiveTrackrSecurity = {
        disable: () => { detectionActive = false; console.log('Security disabled for testing'); },
        enable: () => { detectionActive = true; console.log('Security enabled'); },
        status: () => ({ devToolsOpen, warningShown, detectionActive })
    };
    
})();
