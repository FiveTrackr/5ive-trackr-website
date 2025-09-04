/**
 * Mock Server API Endpoints for Development
 * This file simulates server endpoints for session management
 * Replace with actual server implementation when deploying
 */

// Mock server endpoints for session management
(function() {
    'use strict';
    
    // Disabled - No local development mode needed (live API only)
    return; // Mock server disabled - all requests go to live API
    
    // Mock session storage (in production this would be server-side)
    const mockSessions = new Map();
    
    // Override fetch for our API endpoints
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        
        // Handle session API endpoints (updated for new Python server)
        if (url === '/api/auth/check-session') {
            return new Promise((resolve) => {
                setTimeout(() => { // Simulate network delay
                    
                    // Check for JWT token in Authorization header
                    const authHeader = options.headers?.Authorization || options.headers?.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        // Simulate valid session
                        resolve(new Response(JSON.stringify({
                            success: true,
                            valid: true,
                            user: {
                                user_id: 1,
                                email: 'admin@5ivetrackr.com',
                                username: 'admin',
                                full_name: 'Default Admin',
                                user_role: 'league_manager'
                            }
                        }), { status: 200 }));
                    } else {
                        resolve(new Response(JSON.stringify({
                            success: false,
                            error: 'Invalid or missing token'
                        }), { status: 401 }));
                    }
                }, 100);
            });
        }
        
        // Handle login endpoint
        if (url === '/api/auth/login') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const body = JSON.parse(options.body || '{}');
                    if (body.email === 'admin@5ivetrackr.com') {
                        resolve(new Response(JSON.stringify({
                            success: true,
                            token: 'mock-jwt-token-12345',
                            refresh_token: 'mock-refresh-token',
                            user: {
                                user_id: 1,
                                email: 'admin@5ivetrackr.com',
                                username: 'admin',
                                full_name: 'Default Admin',
                                user_role: 'league_manager'
                            },
                            expires_in: 86400
                        }), { status: 200 }));
                    } else {
                        resolve(new Response(JSON.stringify({
                            success: false,
                            error: 'Invalid credentials'
                        }), { status: 401 }));
                    }
                }, 100);
            });
        }
        
        // Legacy session endpoints (redirect to new endpoints)
        if (url === '/api/auth/session') {
            return new Promise((resolve) => {
                setTimeout(() => { // Simulate network delay
                    
                    if (options.method === 'POST') {
                        // Save session
                        const body = JSON.parse(options.body || '{}');
                        if (body.action === 'save' && body.sessionData) {
                            mockSessions.set(body.sessionId, {
                                sessionData: body.sessionData,
                                timestamp: Date.now()
                            });
                            console.log('Mock server: Session saved', body.sessionId);
                            resolve(new Response(JSON.stringify({ success: true }), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            }));
                        } else {
                            resolve(new Response(JSON.stringify({ error: 'Invalid request' }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            }));
                        }
                        
                    } else if (options.method === 'GET') {
                        // Load session - in real implementation, this would use cookies/headers
                        // For mock, we'll return the most recent session
                        let mostRecentSession = null;
                        let mostRecentTime = 0;
                        
                        for (let [sessionId, sessionInfo] of mockSessions) {
                            if (sessionInfo.timestamp > mostRecentTime) {
                                mostRecentTime = sessionInfo.timestamp;
                                mostRecentSession = sessionInfo;
                            }
                        }
                        
                        if (mostRecentSession) {
                            // Check if session is still valid (15 minutes)
                            const fifteenMinutes = 15 * 60 * 1000;
                            if (Date.now() - mostRecentSession.timestamp < fifteenMinutes) {
                                console.log('Mock server: Session loaded');
                                resolve(new Response(JSON.stringify(mostRecentSession), {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' }
                                }));
                                return;
                            }
                        }
                        
                        console.log('Mock server: No valid session found');
                        resolve(new Response(JSON.stringify({ error: 'No session found' }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                        
                    } else if (options.method === 'DELETE') {
                        // Delete session
                        const body = JSON.parse(options.body || '{}');
                        if (body.sessionId) {
                            mockSessions.delete(body.sessionId);
                            console.log('Mock server: Session deleted', body.sessionId);
                        }
                        resolve(new Response(JSON.stringify({ success: true }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    }
                }, 100); // 100ms delay to simulate network
            });
        }
        
        // For all other requests, use original fetch
        return originalFetch.apply(this, arguments);
    };
    
    console.log('Mock server API initialized for development');
    
})();
