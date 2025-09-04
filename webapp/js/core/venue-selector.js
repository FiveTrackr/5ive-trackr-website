/**
 * Venue Selector Utility for League Manager Pages
 * © 2025 5ive Trackr. All rights reserved.
 */

class VenueSelector {
    constructor() {
        this.currentVenueId = null;
        this.currentVenueName = null;
        this.currentVenueAddress = null;
        this.venues = [];
        this.onVenueChange = null; // Callback for when venue changes
        
        // Load saved venue selection from localStorage
        this.loadSavedVenueSelection();
    }

    // Initialize the venue selector
    async initialize(onVenueChangeCallback = null) {
        this.onVenueChange = onVenueChangeCallback;
        console.log('Initializing venue selector...');
        await this.loadUserVenues();
    }

    // Load venues from API
    async loadUserVenues() {
        const user = window.SessionManager?.getCurrentUser();
        if (!user) {
            console.warn('No user session found for venue selector');
            return;
        }

        try {
            // Get API base URL
            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8080/api'
                : 'https://five-trackr-yq6ly.ondigitalocean.app/api';

            const response = await fetch(`${apiBase}/venues`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.venues) {
                    this.venues = result.venues;
                    this.updateVenueDropdownOptions(result.venues);
                    return;
                }
            }

            console.error('Failed to load venues:', response.status);
        } catch (error) {
            console.error('Error loading venues:', error);
        }

        // No venues found or error occurred
        this.venues = [];
        this.updateNoVenuesState();
    }

    // Update the venue selector UI when no venues exist
    updateNoVenuesState() {
        const selectedVenueName = document.getElementById('selected-venue-name');
        const btn = document.getElementById('venue-selector-btn');
        
        if (selectedVenueName) {
            selectedVenueName.textContent = 'No venues available';
        }
        
        // Disable dropdown functionality when no venues
        if (btn) {
            btn.style.cursor = 'default';
            btn.onclick = null;
        }
    }

    // Update venue dropdown with venues
    updateVenueDropdownOptions(venues) {
        const dropdown = document.getElementById('venue-dropdown');
        
        if (!dropdown) {
            console.warn('Venue dropdown element not found');
            return;
        }

        dropdown.innerHTML = '';

        if (venues.length === 0) {
            this.updateNoVenuesState();
            return;
        }

        // Sort venues alphabetically by name
        const sortedVenues = venues.sort((a, b) => a.name.localeCompare(b.name));

        // Enable dropdown button functionality when venues exist
        const btn = document.getElementById('venue-selector-btn');
        if (btn) {
            btn.style.cursor = 'pointer';
            btn.onclick = () => this.toggleVenueDropdown();
        }

        sortedVenues.forEach((venue) => {
            const option = document.createElement('div');
            option.className = 'venue-option';
            option.dataset.venueId = venue.id;
            option.onclick = (event) => this.selectVenue(venue.id, venue.name, venue.address || venue.city, event);

            option.innerHTML = `
                <div class="venue-option-details">
                    <div class="venue-option-name">${venue.name}</div>
                    <div class="venue-option-address">${venue.address || venue.city || ''}</div>
                </div>
                <span class="venue-option-check" style="display: none;">✓</span>
            `;

            dropdown.appendChild(option);
        });

        // Try to restore previously selected venue, or select first venue
        if (sortedVenues.length > 0) {
            let selectedVenue = null;
            
            // Check if we have a saved venue selection that still exists
            if (this.currentVenueId) {
                selectedVenue = sortedVenues.find(v => v.id === this.currentVenueId);
            }
            
            // If saved venue doesn't exist, select first venue alphabetically
            if (!selectedVenue) {
                selectedVenue = sortedVenues[0];
            }
            
            this.selectVenue(selectedVenue.id, selectedVenue.name, selectedVenue.address || selectedVenue.city, null, false);
            console.log(`Venue selected: ${selectedVenue.name}`);
        }
    }

    // Toggle venue dropdown
    toggleVenueDropdown() {
        const dropdown = document.getElementById('venue-dropdown');
        const btn = document.getElementById('venue-selector-btn');
        const overlay = document.getElementById('venue-selector-overlay');

        if (dropdown && dropdown.classList.contains('show')) {
            this.closeVenueDropdown();
        } else {
            if (dropdown) dropdown.classList.add('show');
            if (btn) btn.classList.add('active');
            if (overlay) overlay.classList.add('show');
        }
    }

    // Close venue dropdown
    closeVenueDropdown() {
        const dropdown = document.getElementById('venue-dropdown');
        const btn = document.getElementById('venue-selector-btn');
        const overlay = document.getElementById('venue-selector-overlay');

        if (dropdown) dropdown.classList.remove('show');
        if (btn) btn.classList.remove('active');
        if (overlay) overlay.classList.remove('show');
    }

    // Select a venue
    selectVenue(venueId, venueName, venueAddress, event, closeDropdown = true) {
        // Prevent event bubbling to parent button
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        // Update selected venue
        this.currentVenueId = venueId;
        this.currentVenueName = venueName;
        this.currentVenueAddress = venueAddress;
        
        // Save venue selection to localStorage for persistence
        this.saveVenueSelection();

        // Update button text
        const selectedVenueName = document.getElementById('selected-venue-name');
        if (selectedVenueName) {
            selectedVenueName.textContent = venueName;
        }

        // Update option selection states
        document.querySelectorAll('.venue-option').forEach(option => {
            const checkmark = option.querySelector('.venue-option-check');
            if (option.dataset.venueId === venueId) {
                option.classList.add('selected');
                if (checkmark) checkmark.style.display = 'block';
            } else {
                option.classList.remove('selected');
                if (checkmark) checkmark.style.display = 'none';
            }
        });

        // Close dropdown if requested
        if (closeDropdown) {
            this.closeVenueDropdown();
        }

        // Call venue change callback if provided
        if (this.onVenueChange && typeof this.onVenueChange === 'function') {
            const venueData = this.venues.find(v => v.id === venueId);
            this.onVenueChange(venueData || {
                id: venueId,
                name: venueName,
                address: venueAddress
            });
        }

        // Notify pitches module of venue change
        if (window.SPAModules && window.SPAModules.pitches && typeof window.SPAModules.pitches.loadPitchesData === 'function') {
            console.log('Notifying pitches module of venue change');
            window.SPAModules.pitches.loadPitchesData().then(() => {
                if (typeof window.SPAModules.pitches.renderPitchesGrid === 'function') {
                    window.SPAModules.pitches.renderPitchesGrid();
                }
            });
        }

        console.log(`Venue selected: ${venueName} (ID: ${venueId})`);
    }

    // Get current venue data
    getCurrentVenue() {
        return {
            id: this.currentVenueId,
            name: this.currentVenueName,
            address: this.currentVenueAddress
        };
    }

    // Get venue by ID
    getVenueById(venueId) {
        return this.venues.find(v => v.id === venueId);
    }

    // Get all venues
    getAllVenues() {
        return this.venues;
    }

    // Set up event listeners for dropdown interaction
    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('venue-dropdown');
            const btn = document.getElementById('venue-selector-btn');
            const overlay = document.getElementById('venue-selector-overlay');

            if (dropdown && btn && overlay &&
                !dropdown.contains(event.target) && 
                !btn.contains(event.target) &&
                !overlay.contains(event.target)) {
                this.closeVenueDropdown();
            }
        });

        // Close dropdown when clicking overlay
        const overlay = document.getElementById('venue-selector-overlay');
        if (overlay) {
            overlay.onclick = () => this.closeVenueDropdown();
        }
    }

    // Refresh venues (call this after adding/deleting venues)
    async refresh() {
        console.log('Refreshing venue selector...');
        await this.loadUserVenues();
    }

    // Save venue selection to localStorage for persistence across page navigation
    saveVenueSelection() {
        if (this.currentVenueId) {
            const venueData = {
                id: this.currentVenueId,
                name: this.currentVenueName,
                address: this.currentVenueAddress,
                timestamp: Date.now()
            };
            localStorage.setItem('selectedVenue', JSON.stringify(venueData));
            console.log('Venue selection saved:', venueData);
        }
    }

    // Load saved venue selection from localStorage
    loadSavedVenueSelection() {
        try {
            const saved = localStorage.getItem('selectedVenue');
            if (saved) {
                const venueData = JSON.parse(saved);
                
                // Check if saved data is not too old (24 hours)
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                if (venueData.timestamp && (Date.now() - venueData.timestamp) < maxAge) {
                    this.currentVenueId = venueData.id;
                    this.currentVenueName = venueData.name;
                    this.currentVenueAddress = venueData.address;
                    console.log('Restored venue selection:', venueData);
                } else {
                    // Clear old data
                    localStorage.removeItem('selectedVenue');
                    console.log('Cleared expired venue selection');
                }
            }
        } catch (error) {
            console.warn('Failed to load saved venue selection:', error);
            localStorage.removeItem('selectedVenue');
        }
    }
}

// Create global instance
window.VenueSelector = new VenueSelector();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    window.VenueSelector.setupEventListeners();
    
    // Initialize venue selector
    window.VenueSelector.initialize();
});