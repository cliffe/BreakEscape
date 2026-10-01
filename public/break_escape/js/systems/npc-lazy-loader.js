/**
 * NPCLazyLoader - Loads NPCs per-room on demand
 * Loads NPC Ink stories via Rails API endpoint
 * Uses in-memory caching only (no persistent storage between sessions)
 */
export default class NPCLazyLoader {
  constructor(npcManager) {
    this.npcManager = npcManager;
    this.loadedRooms = new Set();
    this.storyCache = new Map(); // In-memory cache for current session only
    this.gameId = window.breakEscapeConfig?.gameId;
    if (!this.gameId) {
      console.warn('⚠️ NPCLazyLoader: gameId not found in window.breakEscapeConfig');
    }
  }

  /**
   * Load all NPCs for a specific room
   * @param {string} roomId - Room identifier
   * @param {object} roomData - Room data containing npcs array
   * @returns {Promise<void>}
   */
  async loadNPCsForRoom(roomId, roomData) {
    // Skip if already loaded or no NPCs
    if (this.loadedRooms.has(roomId) || !roomData?.npcs?.length) {
      return;
    }
    // Two loads of one room can overlap (a door and an NPC's patrol both ask for it);
    // loadedRooms is only set once the stories arrive, so share the first load rather
    // than registering every NPC in the room twice (E21).
    this.inFlightRooms = this.inFlightRooms || new Map();
    if (this.inFlightRooms.has(roomId)) {
      return this.inFlightRooms.get(roomId);
    }
    const load = this._loadNPCsForRoom(roomId, roomData);
    this.inFlightRooms.set(roomId, load);
    try {
      return await load;
    } finally {
      this.inFlightRooms.delete(roomId);
    }
  }

  async _loadNPCsForRoom(roomId, roomData) {
    console.log(`📦 Loading ${roomData.npcs.length} NPCs for room ${roomId}`);
    
    // Separate NPCs with and without story paths
    const npcsWithStories = roomData.npcs.filter(npc => npc.storyPath && !this.storyCache.has(npc.storyPath));
    const npcsWithoutStories = roomData.npcs.filter(npc => !npc.storyPath);
    
    if (npcsWithoutStories.length > 0) {
      console.log(`⚠️  ${npcsWithoutStories.length} NPCs have no storyPath: ${npcsWithoutStories.map(n => n.id).join(', ')}`);
    }
    
    // Load all Ink stories in parallel (optimization)
    const storyPromises = npcsWithStories
      .map(npc => this._loadStory(npc.id, npc.storyPath).catch(err => {
        // Don't throw - log and continue so other NPCs can be registered
        console.error(`⚠️  Failed to load story for ${npc.id}: ${err.message}`);
        return null;
      }));
    
    if (storyPromises.length > 0) {
      console.log(`📖 Loading ${storyPromises.length} Ink stories for room ${roomId}`);
      await Promise.all(storyPromises);
    }
    
    // Register NPCs (synchronous now that stories are cached)
    for (const npcDef of roomData.npcs) {
      npcDef.roomId = roomId;  // Add roomId for compatibility
      
      // registerNPC accepts either registerNPC(id, opts) or registerNPC({ id, ...opts })
      // We use the second form - passing the full object
      this.npcManager.registerNPC(npcDef);
      console.log(`✅ Registered NPC: ${npcDef.id} (${npcDef.npcType}) in room ${roomId}`);
      
      // Check if NPC was defeated in a previous session (isKO state persisted)
      if (npcDef.isKO && window.npcHostileSystem) {
        console.log(`💀 NPC ${npcDef.id} has persisted KO state from server - restoring hostile state`);
        
        // Restore hostile state with KO status
        const npcState = window.npcHostileSystem.getState(npcDef.id);
        npcState.isKO = true;
        npcState.currentHP = npcDef.currentHP || 0;
        npcState.isHostile = true; // Mark as hostile so behavior system knows it's combat-related
        
        // Note: When sprite is created, it will check isKO and render death animation
      }
    }
    
    this.loadedRooms.add(roomId);
  }

  /**
   * Load an Ink story file from Rails API endpoint
   * Caches in memory for current session only
   * @private
   */
  async _loadStory(npcId, storyPath) {
    try {
      if (!this.gameId) {
        throw new Error('Game ID not configured - cannot load story from server');
      }
      
      // Use Rails API endpoint: GET /games/:id/ink?npc=:npc_id
      const endpoint = `/break_escape/games/${this.gameId}/ink?npc=${encodeURIComponent(npcId)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const story = await response.json();
      
      // Store in memory for this session only
      this.storyCache.set(storyPath, story);
      console.log(`✅ Loaded story: ${storyPath}`);
    } catch (error) {
      console.error(`❌ Failed to load story: ${storyPath}`, error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Get cached story (used by NPCManager if needed)
   * @param {string} storyPath - Path to story file
   * @returns {object|null} Story JSON or null if not cached
   */
  getCachedStory(storyPath) {
    return this.storyCache.get(storyPath) || null;
  }
}

