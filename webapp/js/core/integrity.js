/**
 * 5ive Trackr Integrity Checker
 * This file contains code to verify the integrity of the application
 * and detect unauthorized modifications.
 */

// Self-executing function to hide implementation
(function() {
    // Generate a unique application identifier
    function generateAppId() {
        // Create a deterministic ID based on code structure
        const codeElements = [
            document.querySelector('script[src*="app.js"]')?.outerHTML || '',
            document.querySelector('link[href*="style.css"]')?.outerHTML || '',
            document.querySelector('head')?.innerHTML.length || 0,
            navigator.userAgent
        ];
        
        // Create a simple hash from these elements
        return simpleHash(codeElements.join('|'));
    }
    
    // Simple hash function
    function simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert to a hex string
        return (hash >>> 0).toString(16);
    }
    
    // Check DOM integrity
    function checkDomIntegrity() {
        // Original structure fingerprints
        const originalStructures = {
            loginForm: 'form#login-form.login-form>h2+input+input+button+button',
            loginOptions: 'div.login-options>button.login-btn.league+button.login-btn.referee'
        };
        
        // Verify critical structures
        const integrityChecks = {
            loginForm: matchesStructure('form#login-form', originalStructures.loginForm),
            loginOptions: matchesStructure('div.login-options', originalStructures.loginOptions)
        };
        
        // Count how many checks passed
        const passedChecks = Object.values(integrityChecks).filter(Boolean).length;
        const totalChecks = Object.keys(integrityChecks).length;
        
        return {
            passed: passedChecks === totalChecks,
            score: passedChecks / totalChecks,
            details: integrityChecks
        };
    }
    
    // Check if an element matches expected DOM structure
    function matchesStructure(selector, expectedStructure) {
        const element = document.querySelector(selector);
        if (!element) return false;
        
        // Build a simple selector-like string representing the actual structure
        function buildStructureString(elem) {
            let str = elem.tagName.toLowerCase();
            
            // Add id if present
            if (elem.id) str += '#' + elem.id;
            
            // Add classes if present
            if (elem.classList && elem.classList.length) {
                str += '.' + Array.from(elem.classList).join('.');
            }
            
            // Add children
            if (elem.children.length) {
                str += '>' + Array.from(elem.children)
                    .map(buildStructureString)
                    .join('+');
            }
            
            return str;
        }
        
        const actualStructure = buildStructureString(element);
        return actualStructure === expectedStructure;
    }
    
    // Check style integrity
    function checkStyleIntegrity() {
        const expectedStyles = {
            loginForm: {
                position: 'fixed',
                zIndex: '100'
            },
            loginBtn: {
                borderRadius: '0.75rem',
                fontWeight: '600'
            }
        };
        
        // Check if computed styles match expected values
        const loginForm = document.querySelector('.login-form');
        const loginBtn = document.querySelector('.login-btn');
        
        const styleChecks = {
            loginFormPosition: loginForm && 
                getComputedStyle(loginForm).position === expectedStyles.loginForm.position,
            loginFormZIndex: loginForm && 
                getComputedStyle(loginForm).zIndex === expectedStyles.loginForm.zIndex,
            loginBtnBorderRadius: loginBtn && 
                getComputedStyle(loginBtn).borderRadius.includes(expectedStyles.loginBtn.borderRadius),
            loginBtnFontWeight: loginBtn && 
                getComputedStyle(loginBtn).fontWeight === expectedStyles.loginBtn.fontWeight
        };
        
        // Count passed checks
        const passedChecks = Object.values(styleChecks).filter(Boolean).length;
        const totalChecks = Object.keys(styleChecks).length;
        
        return {
            passed: passedChecks >= totalChecks * 0.75, // Allow some flexibility
            score: passedChecks / totalChecks,
            details: styleChecks
        };
    }
    
    // Check script integrity
    function checkScriptIntegrity() {
        // Check if critical functions exist and haven't been modified
        const expectedFunctions = [
            'showLoginForm', 
            'hideLoginForm'
        ];
        
        const functionChecks = {};
        
        expectedFunctions.forEach(funcName => {
            const func = window[funcName];
            functionChecks[funcName] = {
                exists: typeof func === 'function',
                sizeOk: func && func.toString().length > 50 // Simple check that it's not too small
            };
        });
        
        // Check overall integrity
        const passedChecks = Object.values(functionChecks)
            .flatMap(check => Object.values(check))
            .filter(Boolean).length;
            
        const totalChecks = Object.values(functionChecks)
            .flatMap(check => Object.keys(check)).length;
        
        return {
            passed: passedChecks === totalChecks,
            score: passedChecks / totalChecks,
            details: functionChecks
        };
    }
    
    // Run all integrity checks
    function runIntegrityChecks() {
        // Create a verification token
        const appId = generateAppId();
        
        // Store the original app ID if not already present
        if (!localStorage.getItem('fivetrackr_original_id')) {
            localStorage.setItem('fivetrackr_original_id', appId);
        }
        
        // Check if the current app matches the original
        const originalAppId = localStorage.getItem('fivetrackr_original_id');
        const appMatches = appId === originalAppId;
        
        // Run all checks
        const domIntegrity = checkDomIntegrity();
        const styleIntegrity = checkStyleIntegrity();
        const scriptIntegrity = checkScriptIntegrity();
        
        // Calculate overall integrity score
        const overallScore = (
            (appMatches ? 1 : 0) +
            domIntegrity.score + 
            styleIntegrity.score + 
            scriptIntegrity.score
        ) / 4;
        
        // Create integrity report
        const integrityReport = {
            timestamp: new Date().toISOString(),
            appIdMatch: appMatches,
            currentAppId: appId.substring(0, 8) + '...',
            originalAppId: originalAppId ? (originalAppId.substring(0, 8) + '...') : 'Not set',
            domIntegrity: domIntegrity,
            styleIntegrity: styleIntegrity,
            scriptIntegrity: scriptIntegrity,
            overallScore: overallScore,
            passed: overallScore > 0.85 // 85% pass threshold
        };
        
        // Store the report
        const reportsHistory = JSON.parse(localStorage.getItem('fivetrackr_integrity_reports') || '[]');
        reportsHistory.push(integrityReport);
        
        // Only keep the last 5 reports
        if (reportsHistory.length > 5) {
            reportsHistory.splice(0, reportsHistory.length - 5);
        }
        
        localStorage.setItem('fivetrackr_integrity_reports', JSON.stringify(reportsHistory));
        
        // Return the current report
        return integrityReport;
    }
    
    // Expose the integrity checker to the window object
    window.FiveTrackrIntegrity = {
        // Public API
        check: function() {
            return runIntegrityChecks();
        },
        
        // Get verification status
        getStatus: function() {
            const reports = JSON.parse(localStorage.getItem('fivetrackr_integrity_reports') || '[]');
            if (reports.length === 0) {
                return { status: 'unknown', lastChecked: null };
            }
            
            const latestReport = reports[reports.length - 1];
            return {
                status: latestReport.passed ? 'verified' : 'compromised',
                lastChecked: latestReport.timestamp,
                score: Math.round(latestReport.overallScore * 100) + '%'
            };
        },
        
        // Verify the application is original
        verifyOrigin: function() {
            const report = runIntegrityChecks();
            return {
                isOriginal: report.passed && report.appIdMatch,
                confidence: Math.round(report.overallScore * 100) + '%',
                lastVerified: new Date().toISOString()
            };
        }
    };
    
    // Run an initial check when page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a short time for everything to load
        setTimeout(runIntegrityChecks, 1000);
        
        // Set up periodic checks
        setInterval(runIntegrityChecks, 5 * 60 * 1000); // Check every 5 minutes
    });
})();
