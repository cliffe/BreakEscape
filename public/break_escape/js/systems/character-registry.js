/**
 * Global Character Registry
 * ========================
 * Maintains a registry of all characters (player, NPCs) available in the game.
 * This registry is populated as NPCs are registered via npcManager, and as rooms are loaded.
 * The person-chat minigame uses this registry for speaker resolution.
 * 
 * When an NPC is registered via npcManager.registerNPC(), it's automatically added here.
 * Format: { id: { id, displayName, spriteSheet, spriteTalk, ... }, ... }
 */

window.characterRegistry = {
    // Player character - set when game initializes
    player: null,
    
    // All NPCs registered in the game
    npcs: {},
    
    /**
     * Add player to registry
     * @param {Object} playerData - Player object with id, displayName, etc.
     */
    setPlayer(playerData) {
        this.player = playerData;
        console.log(`✅ Character Registry: Added player (${playerData.displayName})`);
    },
    
    /**
     * Register an NPC in the character registry
     * Called automatically when npcManager.registerNPC() is invoked
     * @param {string} npcId - NPC identifier
     * @param {Object} npcData - Full NPC data object
     */
    registerNPC(npcId, npcData) {
        this.npcs[npcId] = npcData;
        console.log(`✅ Character Registry: Added NPC ${npcId} (displayName: ${npcData.displayName})`);
    },
    
    /**
     * Get a character (player or NPC) by ID
     * @param {string} characterId - Character identifier
     * @returns {Object|null} Character data or null if not found
     */
    getCharacter(characterId) {
        if (characterId === 'player') {
            return this.player;
        }
        return this.npcs[characterId] || null;
    },
    
    /**
     * Get all available characters for speaker resolution
     * Combines player and all registered NPCs
     * @returns {Object} Dictionary of all characters
     */
    getAllCharacters() {
        const all = {};
        if (this.player) {
            all['player'] = this.player;
        }
        Object.assign(all, this.npcs);
        return all;
    },
    
    /**
     * Check if a character exists in registry
     * @param {string} characterId - Character identifier
     * @returns {boolean} True if character exists
     */
    hasCharacter(characterId) {
        if (characterId === 'player') {
            return this.player !== null;
        }
        return characterId in this.npcs;
    },
    
    /**
     * Clear all registered NPCs (used for scenario transitions)
     */
    clearNPCs() {
        this.npcs = {};
        console.log(`🗑️ Character Registry: Cleared all NPCs`);
    },
    
    /**
     * Debug: Log current registry state
     */
    debug() {
        const chars = Object.keys(this.getAllCharacters());
        console.log(`📋 Character Registry:`, {
            playerCount: this.player ? 1 : 0,
            npcCount: Object.keys(this.npcs).length,
            totalCharacters: chars.length,
            characters: chars
        });
    }
};

console.log('✅ Character Registry system initialized');
