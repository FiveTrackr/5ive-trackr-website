/**
 * 5ive Trackr Data Manager
 * 
 * Client-side data management system that simulates a database
 * using localStorage for persistence. Provides CRUD operations
 * and schema validation.
 * 
 * @copyright 5ive Trackr 2025
 */

class DataManager {
    /**
     * Initialize the data manager
     */
    constructor() {
        // Storage key prefix
        this.storagePrefix = 'fivetrackr_data_';
        
        // Schema definitions
        this.schemas = {
            // League schema
            league: {
                properties: {
                    id: { type: 'string', required: true },
                    name: { type: 'string', required: true },
                    description: { type: 'string' },
                    seasonStart: { type: 'string', required: true }, // ISO date string
                    seasonEnd: { type: 'string', required: true }, // ISO date string
                    maxTeams: { type: 'number', default: 8 },
                    playersPerTeam: { type: 'number', default: 5 },
                    matchDuration: { type: 'number', default: 40 }, // in minutes
                    halfTimeDuration: { type: 'number', default: 5 }, // in minutes
                    substitutesAllowed: { type: 'boolean', default: true },
                    pointsForWin: { type: 'number', default: 3 },
                    pointsForDraw: { type: 'number', default: 1 },
                    pointsForLoss: { type: 'number', default: 0 },
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Team schema
            team: {
                properties: {
                    id: { type: 'string', required: true },
                    name: { type: 'string', required: true },
                    color: { type: 'string' },
                    logo: { type: 'string' },
                    leagueId: { type: 'string', required: true },
                    captain: { type: 'string' },
                    captainContact: { type: 'string' },
                    players: { type: 'array', default: [] },
                    played: { type: 'number', default: 0 },
                    won: { type: 'number', default: 0 },
                    drawn: { type: 'number', default: 0 },
                    lost: { type: 'number', default: 0 },
                    goalsFor: { type: 'number', default: 0 },
                    goalsAgainst: { type: 'number', default: 0 },
                    points: { type: 'number', default: 0 },
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Player schema
            player: {
                properties: {
                    id: { type: 'string', required: true },
                    name: { type: 'string', required: true },
                    number: { type: 'number' },
                    position: { type: 'string' },
                    teamId: { type: 'string', required: true },
                    leagueId: { type: 'string', required: true },
                    goals: { type: 'number', default: 0 },
                    assists: { type: 'number', default: 0 },
                    yellowCards: { type: 'number', default: 0 },
                    redCards: { type: 'number', default: 0 },
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Match schema
            match: {
                properties: {
                    id: { type: 'string', required: true },
                    leagueId: { type: 'string', required: true },
                    homeTeamId: { type: 'string', required: true },
                    homeTeamName: { type: 'string', required: true },
                    awayTeamId: { type: 'string', required: true },
                    awayTeamName: { type: 'string', required: true },
                    date: { type: 'string', required: true }, // ISO date string
                    venue: { type: 'string' },
                    referee: { type: 'string' },
                    completed: { type: 'boolean', default: false },
                    homeGoals: { type: 'number' },
                    awayGoals: { type: 'number' },
                    events: { type: 'array', default: [] }, // goals, cards, etc.
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Venue schema
            venue: {
                properties: {
                    id: { type: 'string', required: true },
                    name: { type: 'string', required: true },
                    address: { type: 'string' },
                    location: { type: 'object' }, // { lat, lng }
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Referee schema
            referee: {
                properties: {
                    id: { type: 'string', required: true },
                    name: { type: 'string', required: true },
                    contact: { type: 'string' },
                    matchesOfficiated: { type: 'number', default: 0 },
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Goal schema
            goal: {
                properties: {
                    id: { type: 'string', required: true },
                    matchId: { type: 'string', required: true },
                    leagueId: { type: 'string', required: true },
                    teamId: { type: 'string', required: true },
                    playerId: { type: 'string', required: true },
                    playerName: { type: 'string', required: true },
                    minute: { type: 'number', required: true },
                    ownGoal: { type: 'boolean', default: false },
                    penalty: { type: 'boolean', default: false },
                    assistPlayerId: { type: 'string' },
                    assistPlayerName: { type: 'string' },
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            },
            
            // Booking schema
            booking: {
                properties: {
                    id: { type: 'string', required: true },
                    matchId: { type: 'string', required: true },
                    leagueId: { type: 'string', required: true },
                    teamId: { type: 'string', required: true },
                    playerId: { type: 'string', required: true },
                    playerName: { type: 'string', required: true },
                    minute: { type: 'number', required: true },
                    type: { type: 'string', required: true }, // yellow, red
                    reason: { type: 'string' },
                    createdBy: { type: 'string', required: true },
                    createdAt: { type: 'string', required: true } // ISO date string
                }
            }
        };
        
        // Initialize data
        this.initializeData();
    }
    
    /**
     * Initialize data storage
     */
    initializeData() {
        // Check if each collection exists, if not create it
        Object.keys(this.schemas).forEach(collection => {
            const storageKey = this.getStorageKey(collection);
            const storedData = localStorage.getItem(storageKey);
            
            if (!storedData) {
                // Initialize with empty array
                localStorage.setItem(storageKey, JSON.stringify([]));
            }
        });
    }
    
    /**
     * Get storage key for a collection
     * @param {string} collection - Collection name
     * @returns {string} Storage key
     */
    getStorageKey(collection) {
        return `${this.storagePrefix}${collection}`;
    }
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Validate an object against a schema
     * @param {string} collection - Collection name
     * @param {Object} data - Data object to validate
     * @returns {Object} Validated and sanitized data object
     */
    validateData(collection, data) {
        const schema = this.schemas[collection];
        
        if (!schema) {
            throw new Error(`Unknown collection: ${collection}`);
        }
        
        const result = {};
        
        // Apply schema validation
        Object.entries(schema.properties).forEach(([field, rules]) => {
            const value = data[field];
            
            // Check required fields
            if (rules.required && (value === undefined || value === null)) {
                // Generate ID if it's required but not provided
                if (field === 'id') {
                    result[field] = this.generateId();
                }
                // Generate timestamp if it's required but not provided
                else if (field === 'createdAt') {
                    result[field] = new Date().toISOString();
                }
                // Otherwise throw error
                else {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
            // Handle optional fields or fields with defaults
            else {
                // If value is provided, check type
                if (value !== undefined && value !== null) {
                    // Type checking
                    const actualType = Array.isArray(value) ? 'array' : typeof value;
                    if (actualType !== rules.type) {
                        throw new Error(`Invalid type for ${field}: expected ${rules.type}, got ${actualType}`);
                    }
                    
                    result[field] = value;
                }
                // If value is not provided but has a default
                else if (rules.default !== undefined) {
                    result[field] = rules.default;
                }
            }
        });
        
        return result;
    }
    
    /**
     * Create a new item in a collection
     * @param {string} collection - Collection name
     * @param {Object} data - Data object to create
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async create(collection, data) {
        try {
            // Ensure ID and createdAt are set
            if (!data.id) data.id = this.generateId();
            if (!data.createdAt) data.createdAt = new Date().toISOString();
            
            // Validate data against schema
            const validatedData = this.validateData(collection, data);
            
            // Get existing data
            const storageKey = this.getStorageKey(collection);
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Check for duplicate ID
            if (storedData.some(item => item.id === validatedData.id)) {
                throw new Error(`Item with ID ${validatedData.id} already exists`);
            }
            
            // Add new item
            storedData.push(validatedData);
            
            // Save back to storage
            localStorage.setItem(storageKey, JSON.stringify(storedData));
            
            return {
                success: true,
                data: validatedData,
                message: `${collection} created successfully`
            };
        } catch (error) {
            console.error('Create error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create item'
            };
        }
    }
    
    /**
     * Find an item by ID
     * @param {string} collection - Collection name
     * @param {string} id - Item ID
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async findById(collection, id) {
        try {
            // Get data
            const storageKey = this.getStorageKey(collection);
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Find item
            const item = storedData.find(item => item.id === id);
            
            if (!item) {
                return {
                    success: false,
                    message: `Item not found with ID: ${id}`
                };
            }
            
            return {
                success: true,
                data: item
            };
        } catch (error) {
            console.error('Find by ID error:', error);
            return {
                success: false,
                error: error.message || 'Failed to find item'
            };
        }
    }
    
    /**
     * Read items from a collection with optional filtering and sorting
     * @param {string} collection - Collection name
     * @param {Object} query - Query object for filtering
     * @param {Object} options - Options for sorting and pagination
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async read(collection, query = {}, options = {}) {
        try {
            // Get data
            const storageKey = this.getStorageKey(collection);
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Filter data
            let result = storedData;
            
            if (Object.keys(query).length > 0) {
                result = storedData.filter(item => {
                    return Object.entries(query).every(([field, value]) => {
                        // Handle special cases
                        if (value === undefined || value === null) {
                            return item[field] === undefined || item[field] === null;
                        }
                        
                        // Handle array values (OR condition)
                        if (Array.isArray(value)) {
                            return value.includes(item[field]);
                        }
                        
                        // Handle object values (advanced filtering)
                        if (typeof value === 'object') {
                            return Object.entries(value).every(([op, opValue]) => {
                                switch (op) {
                                    case 'eq': return item[field] === opValue;
                                    case 'ne': return item[field] !== opValue;
                                    case 'gt': return item[field] > opValue;
                                    case 'gte': return item[field] >= opValue;
                                    case 'lt': return item[field] < opValue;
                                    case 'lte': return item[field] <= opValue;
                                    case 'in': return Array.isArray(opValue) && opValue.includes(item[field]);
                                    case 'nin': return Array.isArray(opValue) && !opValue.includes(item[field]);
                                    default: return true;
                                }
                            });
                        }
                        
                        // Handle string values (exact match)
                        return item[field] === value;
                    });
                });
            }
            
            // Sort data
            if (options.sort) {
                const sortFields = Object.entries(options.sort);
                
                result.sort((a, b) => {
                    for (const [field, direction] of sortFields) {
                        const dir = direction === -1 ? -1 : 1;
                        
                        if (a[field] < b[field]) return -1 * dir;
                        if (a[field] > b[field]) return 1 * dir;
                    }
                    
                    return 0;
                });
            }
            
            // Pagination
            if (options.limit !== undefined) {
                const skip = options.skip || 0;
                result = result.slice(skip, skip + options.limit);
            }
            
            return {
                success: true,
                data: result,
                total: storedData.length,
                count: result.length
            };
        } catch (error) {
            console.error('Read error:', error);
            return {
                success: false,
                error: error.message || 'Failed to read items'
            };
        }
    }
    
    /**
     * Update an item
     * @param {string} collection - Collection name
     * @param {string} id - Item ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async update(collection, id, data) {
        try {
            // Get data
            const storageKey = this.getStorageKey(collection);
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Find item index
            const itemIndex = storedData.findIndex(item => item.id === id);
            
            if (itemIndex === -1) {
                return {
                    success: false,
                    message: `Item not found with ID: ${id}`
                };
            }
            
            // Get existing item
            const existingItem = storedData[itemIndex];
            
            // Merge existing data with new data
            const updatedItem = { ...existingItem, ...data, id };
            
            // Validate updated data
            const validatedData = this.validateData(collection, updatedItem);
            
            // Update item
            storedData[itemIndex] = validatedData;
            
            // Save back to storage
            localStorage.setItem(storageKey, JSON.stringify(storedData));
            
            return {
                success: true,
                data: validatedData,
                message: `${collection} updated successfully`
            };
        } catch (error) {
            console.error('Update error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update item'
            };
        }
    }
    
    /**
     * Delete an item
     * @param {string} collection - Collection name
     * @param {string} id - Item ID
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async delete(collection, id) {
        try {
            // Get data
            const storageKey = this.getStorageKey(collection);
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Find item index
            const itemIndex = storedData.findIndex(item => item.id === id);
            
            if (itemIndex === -1) {
                return {
                    success: false,
                    message: `Item not found with ID: ${id}`
                };
            }
            
            // Remove item
            const deletedItem = storedData.splice(itemIndex, 1)[0];
            
            // Save back to storage
            localStorage.setItem(storageKey, JSON.stringify(storedData));
            
            return {
                success: true,
                data: deletedItem,
                message: `${collection} deleted successfully`
            };
        } catch (error) {
            console.error('Delete error:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete item'
            };
        }
    }
    
    /**
     * Delete multiple items by query
     * @param {string} collection - Collection name
     * @param {Object} query - Query object for filtering items to delete
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async deleteMany(collection, query) {
        try {
            // Get data
            const storageKey = this.getStorageKey(collection);
            const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Find items to keep (inverse of delete)
            const remainingItems = storedData.filter(item => {
                return !Object.entries(query).every(([field, value]) => {
                    return item[field] === value;
                });
            });
            
            // Calculate deleted count
            const deletedCount = storedData.length - remainingItems.length;
            
            // Save back to storage
            localStorage.setItem(storageKey, JSON.stringify(remainingItems));
            
            return {
                success: true,
                deletedCount,
                message: `Deleted ${deletedCount} items from ${collection}`
            };
        } catch (error) {
            console.error('Delete many error:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete items'
            };
        }
    }
    
    /**
     * Count items in a collection with optional filtering
     * @param {string} collection - Collection name
     * @param {Object} query - Query object for filtering
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async count(collection, query = {}) {
        try {
            // Use read method with same query but no pagination
            const result = await this.read(collection, query);
            
            return {
                success: true,
                count: result.data.length
            };
        } catch (error) {
            console.error('Count error:', error);
            return {
                success: false,
                error: error.message || 'Failed to count items'
            };
        }
    }
    
    /**
     * Clear all data for a collection
     * @param {string} collection - Collection name
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async clear(collection) {
        try {
            // Get storage key
            const storageKey = this.getStorageKey(collection);
            
            // Clear data
            localStorage.setItem(storageKey, JSON.stringify([]));
            
            return {
                success: true,
                message: `${collection} cleared successfully`
            };
        } catch (error) {
            console.error('Clear error:', error);
            return {
                success: false,
                error: error.message || 'Failed to clear collection'
            };
        }
    }
    
    /**
     * Clear all data for all collections
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async clearAll() {
        try {
            // Clear each collection
            Object.keys(this.schemas).forEach(collection => {
                const storageKey = this.getStorageKey(collection);
                localStorage.setItem(storageKey, JSON.stringify([]));
            });
            
            return {
                success: true,
                message: 'All data cleared successfully'
            };
        } catch (error) {
            console.error('Clear all error:', error);
            return {
                success: false,
                error: error.message || 'Failed to clear all data'
            };
        }
    }
    
    /**
     * Export all data as JSON
     * @returns {Promise<Object>} Promise resolving to result object with data
     */
    async exportData() {
        try {
            const exportData = {};
            
            // Export each collection
            Object.keys(this.schemas).forEach(collection => {
                const storageKey = this.getStorageKey(collection);
                const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
                exportData[collection] = data;
            });
            
            return {
                success: true,
                data: exportData,
                message: 'Data exported successfully'
            };
        } catch (error) {
            console.error('Export error:', error);
            return {
                success: false,
                error: error.message || 'Failed to export data'
            };
        }
    }
    
    /**
     * Import data from JSON
     * @param {Object} data - Data to import
     * @returns {Promise<Object>} Promise resolving to result object
     */
    async importData(data) {
        try {
            // Validate data structure
            if (typeof data !== 'object') {
                throw new Error('Import data must be an object');
            }
            
            // Import each collection
            Object.entries(data).forEach(([collection, items]) => {
                // Check if collection exists in schema
                if (!this.schemas[collection]) {
                    console.warn(`Unknown collection in import: ${collection}`);
                    return;
                }
                
                // Validate items
                if (!Array.isArray(items)) {
                    throw new Error(`Collection ${collection} data must be an array`);
                }
                
                // Save to storage
                const storageKey = this.getStorageKey(collection);
                localStorage.setItem(storageKey, JSON.stringify(items));
            });
            
            return {
                success: true,
                message: 'Data imported successfully'
            };
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                error: error.message || 'Failed to import data'
            };
        }
    }
}

// Export as global
window.DataManager = DataManager;
