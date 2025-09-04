/**
 * Account Creation API Integration Example
 * This demonstrates how the user data structure works with API endpoints
 * © 2025 5ive Trackr. All rights reserved.
 */

// Example: Account Creation Function for Future Website Page
async function createAccount(formData) {
    try {
        // Validate required fields
        const requiredFields = ['fullName', 'email', 'password', 'role'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Prepare user data structure that matches users.json format
        const userData = {
            id: generateUserId(), // Your API will generate this
            fullName: formData.fullName.trim(),
            email: formData.email.toLowerCase().trim(),
            password: formData.password, // Your API will hash this
            role: formData.role,
            created: new Date().toISOString(),
            lastLogin: null,
            subscription: formData.subscription || 'basic' // Default to basic if not specified
        };

        // Send to your API endpoint
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('Account created successfully:', result.user);
            
            // Update local storage for immediate use
            updateLocalUserData(result.user);
            
            return {
                success: true,
                user: result.user,
                message: 'Account created successfully'
            };
        } else {
            throw new Error(result.message || 'Failed to create account');
        }

    } catch (error) {
        console.error('Account creation error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Example: Login with new user structure
async function loginWithNewStructure(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // User object from API will have the complete structure
            const user = result.user; // Contains: id, fullName, email, role, subscription, etc.
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            
            // Save session using existing SessionManager
            if (window.SessionManager) {
                SessionManager.login(user.email, password, user.role);
                
                // Store complete user data for header template
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
            
            return {
                success: true,
                user: user
            };
        } else {
            throw new Error(result.message || 'Login failed');
        }

    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Example: Update user profile (for settings page)
async function updateUserProfile(userId, updates) {
    try {
        // Only allow certain fields to be updated
        const allowedFields = ['fullName', 'email', 'subscription'];
        const validUpdates = {};
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                validUpdates[key] = value;
            }
        }

        const response = await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}` // Your auth token
            },
            body: JSON.stringify(validUpdates)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Update local storage with new user data
            updateLocalUserData(result.user);
            
            // Update header display
            if (window.leagueManagerHeader) {
                window.leagueManagerHeader.updateUserData();
            }
            
            return {
                success: true,
                user: result.user
            };
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }

    } catch (error) {
        console.error('Profile update error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Helper function to update local user data
function updateLocalUserData(userData) {
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Update SessionManager if available
    if (window.SessionManager && typeof SessionManager.updateCurrentUser === 'function') {
        SessionManager.updateCurrentUser(userData);
    }
    
    // Dispatch event for components to update
    document.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { user: userData }
    }));
}

// Helper function to generate user ID (your API will handle this)
function generateUserId() {
    return 'user-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper function to get auth token
function getAuthToken() {
    // Get from SessionManager or localStorage
    const session = JSON.parse(localStorage.getItem('fivetrackr_session') || '{}');
    return session.sessionId || null;
}

// Example API endpoints your server should implement:

/* 
API Endpoints needed:

POST /api/auth/register
- Creates new user account
- Body: { fullName, email, password, role, subscription }
- Returns: { success: true, user: {...} }

POST /api/auth/login
- Authenticates user
- Body: { email, password }
- Returns: { success: true, user: {...} }

PATCH /api/users/:userId
- Updates user profile
- Headers: Authorization: Bearer <token>
- Body: { fullName?, email?, subscription? }
- Returns: { success: true, user: {...} }

GET /api/users/:userId
- Gets user profile
- Headers: Authorization: Bearer <token>
- Returns: { success: true, user: {...} }
*/

// Export functions for use in actual pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createAccount,
        loginWithNewStructure,
        updateUserProfile,
        updateLocalUserData
    };
} else {
    // Browser environment
    window.AccountManager = {
        createAccount,
        loginWithNewStructure,
        updateUserProfile,
        updateLocalUserData
    };
}
