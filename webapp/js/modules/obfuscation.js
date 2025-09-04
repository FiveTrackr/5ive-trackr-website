/**
 * 5ive Trackr Code Obfuscation System
 * This file contains utilities to obfuscate critical code segments
 * making it harder to analyze and copy functionality.
 */

// Self-executing function to hide implementation details
(function() {
    // Create unpredictable variable names
    const _0x57fe1c = 'fivetrackr';
    const _0x9a24f6 = window;
    const _0xb3e871 = document;
    
    // Store original functions with obfuscated names
    const _0x8c275d = {};
    
    // Track obfuscated function calls
    const _0x4c5e7f = [];
    
    // Obfuscate a function by wrapping it
    function _0x27c36a(func, name) {
        // Store original function
        _0x8c275d[name] = func;
        
        // Create wrapper function with logging
        return function() {
            // Log function call
            _0x4c5e7f.push({
                n: name,
                t: new Date().getTime(),
                a: Array.from(arguments).map(arg => typeof arg)
            });
            
            // Check if call pattern is suspicious
            _0x34a7c1();
            
            // Call original function
            return func.apply(this, arguments);
        };
    }
    
    // Check for suspicious call patterns
    function _0x34a7c1() {
        if (_0x4c5e7f.length < 5) return;
        
        // Check for rapid successive calls (potential automation/scraping)
        const recentCalls = _0x4c5e7f.slice(-5);
        let suspicious = true;
        
        // Calculate time differences
        for (let i = 1; i < recentCalls.length; i++) {
            const timeDiff = recentCalls[i].t - recentCalls[i-1].t;
            // If any call took more than 100ms, it's probably human interaction
            if (timeDiff > 100) {
                suspicious = false;
                break;
            }
        }
        
        if (suspicious) {
            console.warn('5ive Trackr: Suspicious activity detected');
            // Could trigger additional protections here
            
            // Reset call tracking
            _0x4c5e7f.length = 0;
        }
        
        // Only keep last 20 calls
        if (_0x4c5e7f.length > 20) {
            _0x4c5e7f.splice(0, _0x4c5e7f.length - 20);
        }
    }
    
    // Create hidden element with app fingerprint
    function _0x8f65c9() {
        const elem = _0xb3e871.createElement('div');
        elem.style.display = 'none';
        elem.innerHTML = '<!-- ' + _0x57fe1c + '-' + _0xf2a593() + ' -->';
        _0xb3e871.body.appendChild(elem);
    }
    
    // Generate a random string
    function _0xf2a593(len = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // Add code mutation to obfuscate key functions
    function _0xe4a68c() {
        // This technique makes static analysis more difficult
        // by modifying code at runtime
        
        // Create obfuscated versions of common functions
        _0x9a24f6.showLoginForm = _0x27c36a(_0x9a24f6.showLoginForm, 'showLoginForm');
        _0x9a24f6.hideLoginForm = _0x27c36a(_0x9a24f6.hideLoginForm, 'hideLoginForm');
        
        // More complex obfuscation: split function into parts
        const SessionManager = _0x9a24f6.SessionManager;
        if (SessionManager && SessionManager.createSession) {
            // Break the createSession function into two parts
            const originalCreateSession = SessionManager.createSession;
            
            // Replace with an obfuscated version
            SessionManager.createSession = function(userData, role) {
                // First half of function
                const session = {
                    userId: userData.userId,
                    name: userData.name,
                    role: role
                };
                
                // Call second half through a temporary function
                return (function(s, ud) {
                    s.venueId = ud.venueId;
                    s.loginTime = new Date().toISOString();
                    s.lastActivity = new Date().toISOString();
                    localStorage.setItem(_0x57fe1c + '_session', JSON.stringify(s));
                    return s;
                })(session, userData);
            };
        }
    }
    
    // Add some random delays to critical functions to throw off automated tools
    function _0x24a7b6() {
        // Find all buttons
        const buttons = _0xb3e871.querySelectorAll('button');
        
        // Add random delays to button clicks
        buttons.forEach(button => {
            const originalOnClick = button.onclick;
            if (originalOnClick) {
                button.onclick = function(e) {
                    // Small random delay
                    const delay = Math.floor(Math.random() * 50) + 10;
                    setTimeout(() => {
                        originalOnClick.call(this, e);
                    }, delay);
                    return false;
                };
            }
        });
    }
    
    // Initialize obfuscation when DOM is loaded
    _0xb3e871.addEventListener('DOMContentLoaded', function() {
        // Wait a random amount of time
        setTimeout(() => {
            // Add hidden fingerprint
            _0x8f65c9();
            
            // Apply code mutations
            _0xe4a68c();
            
            // Add timing variations
            _0x24a7b6();
            
            console.log('5ive Trackr: Security initialized');
        }, Math.random() * 100);
    });
    
    // Protect the obfuscation code itself
    const _0x7a3b9f = _0xe4a68c.toString();
    const _0x59f2c7 = _0x24a7b6.toString();
    
    // Create a closure with all the variables and functions hidden
    _0x9a24f6._5TObfuscation = {
        // Only expose a verification method
        verify: function() {
            const sum = _0x7a3b9f.length + _0x59f2c7.length;
            return sum % 256; // Return a checksum that can be verified
        }
    };
})();

// Add source code tracing functionality
// This adds line numbers and file information to key functions, making
// it easier to trace unauthorized copies
(function() {
    // Add trace info to Function prototype
    const originalFunction = Function.prototype.toString;
    
    Function.prototype.toString = function() {
        const result = originalFunction.call(this);
        
        // Only add tracing to specific functions
        if (this.name && 
            (this.name.includes('login') || 
             this.name.includes('Session') || 
             this.name.includes('Auth'))) {
            // Add a comment with trace info
            return result + "\n// 5ive Trackr - Original Code - " + 
                   new Date().toISOString().split('T')[0];
        }
        
        return result;
    };
    
    // Create a hidden signature in the console
    console.log(
        "%c5ive Trackr - Protected Original Code", 
        "color: transparent; font-size: 0px;" +
        "background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhE" +
        "UFhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAA" +
        "AABJRU5ErkJggg==);"
    );
})();
