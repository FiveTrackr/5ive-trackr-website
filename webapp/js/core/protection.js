/**
 * 5ive Trackr Code Protection System
 * This file contains protection mechanisms to identify original code
 * and prevent unauthorized copying or use.
 */

// Digital fingerprinting for the application
const FiveTrackrProtection = {
    // Application signature - unique to this codebase
    _appSignature: "5T-" + (function() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        // Generate a unique 32-character signature
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    })(),
    
    // Timestamp of code creation - used for verification
    _creationTimestamp: "2025-07-15T" + new Date().getHours() + ":" + 
                        new Date().getMinutes() + ":" + new Date().getSeconds(),
    
    // Unique watermark patterns inserted throughout the codebase
    _watermarkPatterns: [
        "FTK-" + Math.floor(Math.random() * 9000 + 1000),
        "TRK-" + Math.floor(Math.random() * 9000 + 1000),
        "5IVE-" + Math.floor(Math.random() * 9000 + 1000)
    ],
    
    // Initialize protection system
    init: function() {
        console.log("5ive Trackr code protection initialized");
        this._insertCodeWatermarks();
        this._registerCodeOrigin();
        this._setupTamperDetection();
        return this._getPublicMethods();
    },
    
    // Insert digital watermarks throughout the codebase
    _insertCodeWatermarks: function() {
        // This function inserts invisible comments and code patterns
        // that can be used to identify copied code
        
        // Create invisible DOM markers
        const markerDiv = document.createElement('div');
        markerDiv.style.display = 'none';
        markerDiv.setAttribute('data-fivetrackr', this._watermarkPatterns[0]);
        markerDiv.setAttribute('data-origin', 'original-webapp');
        document.body.appendChild(markerDiv);
        
        // Insert watermark in CSS as well (through JS)
        const styleEl = document.createElement('style');
        styleEl.textContent = '/* ' + this._watermarkPatterns[1] + ' */';
        document.head.appendChild(styleEl);
        
        // Store watermark in localStorage with encryption
        this._secureStore('fivetrackr_watermark', this._watermarkPatterns[2]);
    },
    
    // Register code origin for verification
    _registerCodeOrigin: function() {
        // Create an origin signature that combines:
        // - The current domain
        // - The app signature
        // - A timestamp
        
        const originSignature = {
            domain: window.location.hostname,
            signature: this._appSignature,
            timestamp: this._creationTimestamp,
            fingerprint: this._generateBrowserFingerprint()
        };
        
        // Store this information for verification
        this._secureStore('fivetrackr_origin', JSON.stringify(originSignature));
        
        // Set a cookie with partial signature (30 days expiry)
        document.cookie = "fivetrackr_verify=" + 
                          this._appSignature.substring(0, 8) + 
                          "; path=/; max-age=2592000; SameSite=Strict";
    },
    
    // Generate a unique browser fingerprint
    _generateBrowserFingerprint: function() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        const debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
        
        // Combine various browser information to create a unique fingerprint
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            gpu: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
            colorDepth: screen.colorDepth,
            timezone: new Date().getTimezoneOffset()
        };
        
        // Create a hash from the fingerprint
        return this._simpleHash(JSON.stringify(fingerprint));
    },
    
    // Setup code tampering detection
    _setupTamperDetection: function() {
        // Create a self-verifying hash of core functions
        const coreCodeBlocks = [
            window.showLoginForm.toString(),
            window.hideLoginForm.toString(),
            this._appSignature
        ];
        
        const codeHash = this._simpleHash(coreCodeBlocks.join(''));
        this._secureStore('fivetrackr_integrity', codeHash);
        
        // Periodically check for code tampering
        setInterval(() => {
            const currentCodeBlocks = [
                window.showLoginForm.toString(),
                window.hideLoginForm.toString(),
                this._appSignature
            ];
            
            const currentHash = this._simpleHash(currentCodeBlocks.join(''));
            const storedHash = this._secureRetrieve('fivetrackr_integrity');
            
            if (currentHash !== storedHash) {
                // Code has been tampered with - can trigger various responses:
                // 1. Log the tampering
                console.warn('5ive Trackr: Code integrity violation detected');
                
                // 2. Report the violation (in a real app, this would call to your server)
                this._reportViolation('integrity_violation', {
                    expectedHash: storedHash,
                    actualHash: currentHash
                });
            }
        }, 60000); // Check every minute
    },
    
    // Simple string hashing function
    _simpleHash: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36); // Convert to base-36 for shorter representation
    },
    
    // Secure store with simple encryption
    _secureStore: function(key, value) {
        // Simple XOR encryption with the app signature
        const encrypted = this._xorEncrypt(value, this._appSignature);
        localStorage.setItem(key, encrypted);
    },
    
    // Secure retrieve with simple decryption
    _secureRetrieve: function(key) {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return this._xorDecrypt(encrypted, this._appSignature);
    },
    
    // Simple XOR encryption
    _xorEncrypt: function(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result); // Base64 encode
    },
    
    // Simple XOR decryption
    _xorDecrypt: function(encoded, key) {
        const text = atob(encoded); // Base64 decode
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    },
    
    // Report violations (in a real app, this would call to your server)
    _reportViolation: function(type, details) {
        console.warn('5ive Trackr violation detected:', type, details);
        // In a real app, you would send this data to your server
        
        // For now, just log to localStorage
        const violations = JSON.parse(localStorage.getItem('fivetrackr_violations') || '[]');
        violations.push({
            type: type,
            details: details,
            timestamp: new Date().toISOString(),
            fingerprint: this._generateBrowserFingerprint()
        });
        localStorage.setItem('fivetrackr_violations', JSON.stringify(violations));
    },
    
    // Provide public methods that don't expose internal workings
    _getPublicMethods: function() {
        return {
            verify: function() {
                const originData = JSON.parse(this._secureRetrieve('fivetrackr_origin'));
                return {
                    isOriginal: originData.signature === this._appSignature,
                    signature: this._appSignature.substring(0, 8) + '...' // Only show partial
                };
            }.bind(this),
            
            // Check if this is an authorized installation
            isAuthorized: function() {
                return document.cookie.includes('fivetrackr_verify=' + this._appSignature.substring(0, 8));
            }.bind(this),
            
            // Report unauthorized usage
            reportUnauthorized: function() {
                this._reportViolation('unauthorized_usage', {
                    location: window.location.href,
                    referrer: document.referrer
                });
            }.bind(this)
        };
    }
};

// Initialize protection system
const CodeProtection = FiveTrackrProtection.init();

// Export for usage in other files
if (typeof module !== 'undefined') {
    module.exports = { CodeProtection };
}
