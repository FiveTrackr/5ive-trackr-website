/**
 * Universal Header Template Loader for League Manager Pages
 * This script enables automatic updates across all pages when the header template changes
 * © 2025 5ive Trackr. All rights reserved.
 */

(function() {
    'use strict';
    
    // Configuration
    const TEMPLATE_PATH = '/webapp/src/templates/league-manager/header-template.html';
    const HEADER_CONTAINER_ID = 'header-container';
    
    // Global header loader function
    window.loadLeagueManagerHeader = async function() {
        try {
            console.log('Loading dynamic header template...');
            
            // Find the header container
            const headerContainer = document.getElementById(HEADER_CONTAINER_ID);
            if (!headerContainer) {
                console.error('Header container not found. Make sure you have an element with id="header-container"');
                return false;
            }
            
            // Fetch the template
            const response = await fetch(TEMPLATE_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load header template: ${response.status} ${response.statusText}`);
            }
            
            // Load the template content
            const templateHTML = await response.text();
            headerContainer.innerHTML = templateHTML;
            
            console.log('Header template loaded successfully');
            
            // Dispatch event to notify that header has been loaded
            document.dispatchEvent(new CustomEvent('headerTemplateLoaded', {
                detail: {
                    timestamp: new Date().toISOString(),
                    templatePath: TEMPLATE_PATH
                }
            }));
            
            return true;
            
        } catch (error) {
            console.error('Error loading header template:', error);
            
            // Fallback header content
            const headerContainer = document.getElementById(HEADER_CONTAINER_ID);
            if (headerContainer) {
                headerContainer.innerHTML = `
                    <div class="header-left">
                        <h1 class="page-title">Page Title</h1>
                    </div>
                    <div class="header-right">
                        <div class="user-info">
                            <div class="user-avatar">LM</div>
                            <div class="user-details">
                                <div class="user-name">League Manager</div>
                                <div class="user-role">Administrator</div>
                            </div>
                        </div>
                        <div class="header-actions">
                            <a href="/webapp/src/pages/notifications.html" class="header-btn">
                                <span class="btn-icon">🔔</span>
                                <span class="btn-text">Notifications</span>
                            </a>
                        </div>
                    </div>
                `;
            }
            
            return false;
        }
    };
    
    // Auto-load header if container exists when script loads
    document.addEventListener('DOMContentLoaded', function() {
        const headerContainer = document.getElementById(HEADER_CONTAINER_ID);
        if (headerContainer && !headerContainer.hasAttribute('data-template-loaded')) {
            window.loadLeagueManagerHeader().then(success => {
                if (success) {
                    headerContainer.setAttribute('data-template-loaded', 'true');
                }
            });
        }
    });
    
    // Support for manual reloading (useful for development)
    window.reloadLeagueManagerHeader = function() {
        const headerContainer = document.getElementById(HEADER_CONTAINER_ID);
        if (headerContainer) {
            headerContainer.removeAttribute('data-template-loaded');
            return window.loadLeagueManagerHeader();
        }
        return Promise.resolve(false);
    };
    
})();
