/**
 * Login form functionality for 5ive Trackr
 * 
 * Handles login form submission and validation
 * 
 * @copyright 5ive Trackr 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const mainLoginBtn = document.getElementById('main-login-btn');
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    const loginModal = document.getElementById('loginModal');
    
    // Only proceed if we're on the login page
    if (!loginForm) return;
    
    // Setup the main login button click handler
    if (mainLoginBtn) {
        mainLoginBtn.addEventListener('click', function() {
            showLoginModal();
        });
    }
    
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', function() {
            hideLoginModal();
        });
    }
    
    // Close modal when clicking outside of it
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                hideLoginModal();
            }
        });
    }
    
    // Function to show login modal
    function showLoginModal() {
        // Clear any previous error messages when showing the form
        if (loginError) {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }
        
        // Show the login modal
        if (loginModal) {
            loginModal.style.display = 'flex';
        }
        
        // Focus on email input
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 100);
        }
    }
    
    // Function to hide login modal
    function hideLoginModal() {
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        
        // Clear form data
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (loginError) {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }
    }
        
    
    // Initialize session manager if it exists
    const sessionManager = window.sessionManager || {
        createSession: function(user, token, role) {
            console.log('Session created for:', user);
            return true;
        }
    };
    
    // Handle form submission
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Reset error message immediately and keep it hidden during login process
        if (loginError) {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }
        
        // Get values
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate inputs
        if (!email || !password) {
            if (loginError) {
                loginError.textContent = 'Please enter both email and password';
                loginError.style.display = 'block';
            }
            return;
        }
        
        // Disable login button to prevent multiple submissions
        if (loginButton) loginButton.disabled = true;
        
        // No need for preset form role - let authentication determine the role
        const formRole = 'auto'; // Will be determined by user credentials
        
        // Attempt login (this will check for existing sessions)
        attemptLogin(email, password, formRole, false);
    });
    
    // Function to attempt login with session checking
    async function attemptLogin(email, password, formRole, forceLogin) {
        // Ensure SessionManager is available
        if (typeof SessionManager === 'undefined') {
            console.error('SessionManager is not defined. Make sure auth.js is loaded.');
            showError('Authentication system not ready. Please refresh the page.');
            return;
        }

        // Check for existing sessions first (unless forcing login)
        if (!forceLogin) {
            try {
                const existingSession = await SessionManager.checkForActiveSession();
                if (existingSession) {
                    // Show session warning modal
                    showSessionWarningModal(existingSession.userData.fullName, email, password, formRole);
                    return;
                }
            } catch (error) {
                console.warn('Error checking for active session:', error);
                // Continue with login anyway
            }
        }
        
        // Use SessionManager to validate login
        const result = await SessionManager.login(email, password, formRole, forceLogin);
        
        if (result.success) {
            // Login successful - removed verbose logging for cleaner console
            
            // Immediately hide any error messages that might have appeared
            if (loginError) {
                loginError.style.display = 'none';
                loginError.textContent = '';
            }
            
            // Ensure session is fully saved before redirecting
            setTimeout(() => {
                // Show success notification before redirecting
                if (window.showSuccessNotification) {
                    // Extract first name for welcome message
                    const fullName = result.user.fullName || result.user.full_name || result.user.name || result.user.username;
                    const firstName = fullName.trim().split(' ')[0];
                    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                    
                    window.showSuccessNotification('Login Successful', `Welcome, ${capitalizedFirstName}!`, 1500);
                    
                    // Redirect after notification displays
                    setTimeout(function() {
                        if (result.user.role === 'referee') {
                            window.location.href = 'pages/referee/dashboard.html';
                        } else {
                            window.location.href = 'pages/league-manager/league-manager.html#dashboard';
                        }
                    }, 1500);
                } else {
                    // Fallback if notification function isn't available
                    if (result.user.role === 'referee') {
                        window.location.href = 'pages/referee/dashboard.html';
                    } else {
                        window.location.href = 'pages/league-manager/league-manager.html#dashboard';
                    }
                }
            }, 100); // Small delay to ensure session is saved
        } else if (result.error === 'EXISTING_SESSION') {
            // Show session warning modal
            showSessionWarningModal(result.existingUser, email, password, formRole);
        } else {
            // Show regular error
            if (loginError) {
                loginError.textContent = result.message || 'Invalid email or password';
                loginError.style.display = 'block';
            }
            if (loginButton) loginButton.disabled = false;
        }
    }
    
    // Function to show session warning modal
    function showSessionWarningModal(existingUserName, email, password, formRole) {
        const modal = document.getElementById('sessionWarningModal');
        const existingUserNameEl = document.getElementById('existingUserName');
        const forceLoginBtn = document.getElementById('forceLoginBtn');
        const cancelLoginBtn = document.getElementById('cancelLoginBtn');
        
        if (!modal) return;
        
        // Set existing user name
        if (existingUserNameEl) {
            existingUserNameEl.textContent = existingUserName;
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Handle force login
        forceLoginBtn.onclick = function() {
            modal.style.display = 'none';
            attemptLogin(email, password, formRole, true); // Force login
        };
        
        // Handle cancel
        cancelLoginBtn.onclick = function() {
            modal.style.display = 'none';
            if (loginButton) loginButton.disabled = false;
        };
        
        // Close modal on overlay click
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
                if (loginButton) loginButton.disabled = false;
            }
        };
    }
});
