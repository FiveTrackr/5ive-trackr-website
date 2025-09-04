/**
 * 5ive Trackr Web Application
 * © 2025 5ive Trackr. All rights reserved.
 */

console.log('5ive Trackr Web App loaded.');
window.scriptLoaded = true;

// Application Initialization
(function() {
    // Custom notification system
    window.showNotification = function(type, title, message, duration = 1000) {
        const container = document.querySelector('.notification-container');
        const notifications = document.querySelectorAll('.notification');
        const notification = document.querySelector(`.notification.${type}`);
        
        if (!container || !notification) {
            console.error('Notification elements not found');
            return;
        }
        
        // Hide all notifications first
        notifications.forEach(n => {
            n.style.display = 'none';
        });
        
        // Display only the requested notification type
        notification.style.display = 'flex';
        
        // Set content
        notification.querySelector('h3').textContent = title;
        notification.querySelector('p').textContent = message;
        
        // Show notification
        container.classList.add('show');
        
        // Hide after duration
        if (duration > 0) {
            setTimeout(() => {
                container.classList.remove('show');
            }, duration);
        }
        
        return {
            close: function() {
                container.classList.remove('show');
            }
        };
    };
    
    window.showSuccessNotification = function(title, message, duration) {
        return window.showNotification('success', title, message, duration);
    };
    
    window.showErrorNotification = function(title, message, duration) {
        return window.showNotification('error', title, message, duration);
    };
    
    // Setup notification close buttons
    document.addEventListener('DOMContentLoaded', function() {
        const closeButtons = document.querySelectorAll('.notification-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                document.querySelector('.notification-container').classList.remove('show');
                
                // Reset all notifications after closing
                setTimeout(() => {
                    document.querySelectorAll('.notification').forEach(n => {
                        n.style.display = 'none';
                    });
                }, 300);
            });
        });
        
        // Also allow clicking outside notification to close it
        const container = document.querySelector('.notification-container');
        if (container) {
            container.addEventListener('click', function(e) {
                if (e.target === container) {
                    container.classList.remove('show');
                    
                    setTimeout(() => {
                        document.querySelectorAll('.notification').forEach(n => {
                            n.style.display = 'none';
                        });
                    }, 300);
                }
            });
        }
    });

    // Form UI management
    window.showLoginForm = function(role) {
        console.log('showLoginForm called with role:', role);
        
        try {
            const loginOptions = document.getElementById('login-options');
            const form = document.getElementById('loginForm');
            const title = document.getElementById('login-form-title');
            
            if (!form) return;
            
            form.style.display = 'flex';
            loginOptions.classList.add('hidden');
            form.dataset.role = role;
            form.classList.add('active');
            
            // Reset form classes
            form.classList.remove('league-form', 'referee-form', 'captain-form');
            
            // Configure form based on role
            if (role === 'league') {
                title.textContent = 'Administrator Login';
                form.classList.add('league-form');
                document.querySelector('.login-btn.submit').style.background = 'var(--venue-color)';
                document.getElementById('form-icon-img').src = 'img/admin-icon.svg';
            } else if (role === 'referee') {
                title.textContent = 'Referee Login';
                form.classList.add('referee-form');
                const submitBtn = document.querySelector('.login-btn.submit');
                submitBtn.style.background = '#14532d';
                document.getElementById('form-icon-img').src = 'img/referee-icon.svg';
            } else if (role === 'captain') {
                title.textContent = 'Team Captain Login';
                form.classList.add('captain-form');
                document.getElementById('form-icon-img').src = 'img/admin-icon.svg';
            } else {
                title.textContent = 'Login';
            }
            
            setTimeout(function() {
                form.classList.add('active');
                form.style.webkitTransform = 'translate3d(-50%, -50%, 0)';
                form.style.transform = 'translate3d(-50%, -50%, 0)';
                console.log('Added active class to form');
            }, 250);
            
        } catch (error) {
            console.error('Error in showLoginForm:', error);
            window.showErrorNotification('Form Error', 'Error showing login form: ' + error.message);
        }
    };
    
    window.hideLoginForm = function() {
        const form = document.getElementById('loginForm');
        const loginOptions = document.getElementById('login-options');
        
        if (!form) return;
        
        form.classList.remove('active');
        
        setTimeout(function() {
            loginOptions.classList.remove('hidden');
        }, 250);
        
        console.log('Login form hidden, returning to main options');
    };
    
    // Direct login for testing
    window.loginDirectly = function(username) {
        // Check if SessionManager is available
        if (typeof SessionManager === 'undefined') {
            console.error('SessionManager not available for direct login');
            window.showErrorNotification('Authentication Error', 'Authentication system not ready. Please refresh the page.');
            return;
        }

        const passwords = {
            'admin': 'test',
            'leaguemanager': 'league123',
            'referee': 'test',
            'teamcaptain': 'team123'
        };
        
        if (passwords[username]) {
            let formRole = 'referee';
            
            if (username === 'leaguemanager' || username === 'admin') {
                formRole = 'league';
            }
            
            const loginResult = SessionManager.login(username, passwords[username], formRole);
            
            if (loginResult.success) {
                let redirectUrl = '';
                const userRole = loginResult.user.role;
                
                switch(userRole) {
                    case 'admin':
                    case 'league_manager':
                        redirectUrl = 'pages/league-manager/league-manager.html#dashboard';
                        break;
                    case 'referee':
                        redirectUrl = 'pages/referee/referee-dashboard.html';
                        break;
                    case 'team_captain':
                        redirectUrl = 'team-dashboard.html';
                        break;
                    default:
                        redirectUrl = 'home.html';
                }
                
                // Extract first name for welcome message
                const fullName = loginResult.user.fullName || loginResult.user.full_name || loginResult.user.name || loginResult.user.username;
                const firstName = fullName.trim().split(' ')[0];
                const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                
                console.log('Login success - extracted name:', { fullName, firstName, capitalizedFirstName });
                window.showSuccessNotification('Login Successful', `Welcome, ${capitalizedFirstName}!`, 1000);
                
                // Set flag for dashboard loading screen if redirecting to league manager
                if (redirectUrl.includes('league-manager.html')) {
                    sessionStorage.setItem('showDashboardLoading', 'true');
                    console.log('🚩 Set dashboard loading flag for league manager redirect');
                }
                
                // Show loading screen and redirect
                setTimeout(function() {
                    console.log('🚀 About to show loading screen from loginDirectly');
                    window.showLoginLoadingScreen();
                    setTimeout(function() {
                        console.log('🔗 Redirecting to:', redirectUrl);
                        window.location.href = redirectUrl;
                    }, 2000); // Show loading for 2 seconds
                }, 500);
            } else {
                window.showErrorNotification('Login Failed', loginResult.message);
            }
        } else {
            window.showErrorNotification('Invalid Username', 'The username you entered is not recognized.');
        }
    };
    
    // Handle form submission
    document.addEventListener('DOMContentLoaded', function() {
        // Apply watermarking and protection
        if (typeof applyWatermark === 'function') {
            applyWatermark();
        }
        
        if (typeof verifyIntegrity === 'function') {
            verifyIntegrity();
        }
        
        // Display current date
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            const now = new Date();
            currentDateElement.textContent = now.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Check if user is already logged in
        if (typeof SessionManager !== 'undefined' && SessionManager.isLoggedIn()) {
            const currentUser = SessionManager.getCurrentUser();
            const role = currentUser ? currentUser.role : undefined;
            
            // Enhanced debug logging
            console.log('=== AUTHENTICATION DEBUG ===');
            console.log('Page:', window.location.pathname);
            console.log('SessionManager.isLoggedIn():', SessionManager.isLoggedIn());
            console.log('Current user object:', JSON.stringify(currentUser, null, 2));
            console.log('User role detected:', role);
            console.log('localStorage auth_token exists:', !!localStorage.getItem('auth_token'));
            console.log('localStorage fivetrackr_session:', localStorage.getItem('fivetrackr_session'));
            console.log('============================');
            
            // If role is undefined or invalid, clear the session and stay on login page
            if (!role || role === 'undefined') {
                console.log('❌ Role is undefined/invalid, clearing session and staying on login page');
                SessionManager.logout();
                return; // Don't redirect, stay on login page
            }
            
            console.log('✅ Valid role found, redirecting to appropriate dashboard');
            console.log('📍 About to redirect to:', 'pages/league-manager/league-manager.html#dashboard');
            console.log('⏰ Executing redirect now...');
            
            // Show loading screen and redirect based on role
            let redirectUrl = '';
            switch(role) {
                case 'admin':
                case 'league_manager':
                case 'tenant_manager':
                case 'venue_manager':
                    redirectUrl = 'pages/league-manager/league-manager.html#dashboard';
                    break;
                case 'referee':
                    redirectUrl = 'pages/referee/referee-dashboard.html';
                    break;
                case 'team_captain':
                case 'team_manager':
                    redirectUrl = 'team-dashboard.html';
                    break;
                default:
                    // Log the unknown role for debugging, but don't logout immediately
                    console.warn('Unknown user role:', role, 'Current user:', currentUser);
                    // Default to league manager dashboard for now
                    redirectUrl = 'pages/league-manager/league-manager.html#dashboard';
            }
            
            // Set flag for dashboard loading screen if redirecting to league manager
            if (redirectUrl.includes('league-manager.html')) {
                sessionStorage.setItem('showDashboardLoading', 'true');
                console.log('🚩 Set dashboard loading flag for auto-login redirect');
            }
            
            // Show loading screen and redirect
            console.log('🚀 About to show loading screen from auto-login');
            window.showLoginLoadingScreen();
            setTimeout(function() {
                console.log('🔗 Auto-redirecting to:', redirectUrl);
                window.location.href = redirectUrl;
            }, 2000); // Show loading for 2 seconds
        }
        
        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (typeof SessionManager !== 'undefined') {
                    SessionManager.logout();
                }
                window.location.href = 'home.html';
            });
        }
        
        // Professional loading screen for login
        window.showLoginLoadingScreen = function() {
            console.log('🔄 Showing login loading screen...');
            // Create loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'login-loading-overlay';
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1e4009 0%, #2e6417 50%, #0f2a04 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 20000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            // Loading content
            loadingOverlay.innerHTML = `
                <div style="text-align: center; color: white;">
                    <div style="position: relative; margin-bottom: 32px;">
                        <img src="img/5ive-trackr-plain.svg" 
                             alt="5ive Trackr" 
                             style="width: 150px; height: auto; filter: brightness(0) invert(1);"
                             onerror="this.style.display='none'; document.getElementById('fallback-logo').style.display='block';">
                        <div id="fallback-logo" style="display: none; font-size: 48px; font-weight: bold; color: white;">5ive Trackr</div>
                        
                        <!-- Large spinner around logo -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 200px;
                            height: 200px;
                            border: 3px solid rgba(255, 255, 255, 0.3);
                            border-top: 3px solid white;
                            border-radius: 50%;
                            animation: spin 2s linear infinite;
                        "></div>
                    </div>
                    
                    <h2 style="
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0 0 16px 0;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
                    ">Loading Dashboard...</h2>
                    
                    <div style="
                        width: 300px;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 2px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg, transparent, white, transparent);
                            border-radius: 2px;
                            animation: loading-bar 1.5s ease-in-out infinite;
                        "></div>
                    </div>
                </div>
                
                <style>
                    @keyframes spin {
                        0% { transform: translate(-50%, -50%) rotate(0deg); }
                        100% { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    
                    @keyframes loading-bar {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(0%); }
                        100% { transform: translateX(100%); }
                    }
                </style>
            `;
            
            // Add to page
            document.body.appendChild(loadingOverlay);
            console.log('📱 Loading overlay added to body');
            
            // Fade in immediately and also set a backup
            loadingOverlay.style.opacity = '1';
            setTimeout(() => {
                loadingOverlay.style.opacity = '1';
                console.log('✨ Loading screen should be visible now');
            }, 10);
            
            return loadingOverlay;
        };
        
        // Hide loading screen
        window.hideLoginLoadingScreen = function() {
            const overlay = document.getElementById('login-loading-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
        };
    });
})();