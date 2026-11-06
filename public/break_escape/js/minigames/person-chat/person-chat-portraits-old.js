/**
 * PersonChatPortraits - Portrait Rendering System
 * 
 * Handles capturing game canvas as zoomed portraits for conversation UI.
 * Uses simplified canvas screenshot approach instead of RenderTexture.
 * 
 * Approach:
 * 1. Capture game canvas to data URL
 * 2. Calculate zoom viewbox for NPC sprite (4x zoom)
 * 3. Display cropped/zoomed portion in portrait container
 * 4. Handle cleanup on minigame close
 * 
 * @module person-chat-portraits
 */

export default class PersonChatPortraits {
    /**
     * Create portrait renderer
     * @param {Phaser.Game} game - Phaser game instance
     * @param {Object} npc - NPC data with sprite reference
     * @param {HTMLElement} portraitContainer - Container for portrait canvas
     */
    constructor(game, npc, portraitContainer) {
        this.game = game;
        this.npc = npc;
        this.portraitContainer = portraitContainer;
        
        // Portrait settings
        this.portraitWidth = 200;   // Portrait display size
        this.portraitHeight = 250;
        this.zoomLevel = 2;         // 2x zoom on sprite
        this.updateInterval = 100;  // Update portrait every 100ms during conversation
        
        // State
        this.portraitCanvas = null;
        this.portraitCtx = null;
        this.updateTimer = null;
        this.gameCanvas = null;
        
        console.log(`🖼️ Portrait renderer created for NPC: ${npc.id}`);
        alert('Portrait renderer created for NPC: ' + npc.id);
    }
    
    /**
     * Initialize portrait display in container
     * Creates canvas and sets up styling
     */
    init() {
        if (!this.portraitContainer) {
            console.warn('❌ Portrait container not found');
            return false;
        }
        
        try {
            // Create portrait canvas
            this.portraitCanvas = document.createElement('canvas');
            this.portraitCanvas.width = this.portraitWidth;
            this.portraitCanvas.height = this.portraitHeight;
            this.portraitCanvas.className = 'person-chat-portrait';
            this.portraitCanvas.id = `portrait-${this.npc.id}`;
            
            this.portraitCtx = this.portraitCanvas.getContext('2d');
            
            // Get game canvas from Phaser (optional - portrait feature)
            this.gameCanvas = this.game?.canvas || null;
            
            if (!this.gameCanvas) {
                console.log(`ℹ️ Game canvas not available - portrait will show placeholder for ${this.npc.id}`);
                // Continue without portrait rendering - just show placeholder
            }
            
            // Add styling
            this.portraitCanvas.style.border = '2px solid #333';
            this.portraitCanvas.style.backgroundColor = '#000';
            this.portraitCanvas.style.imageRendering = 'pixelated';
            this.portraitCanvas.style.imageRendering = '-moz-crisp-edges';
            this.portraitCanvas.style.imageRendering = 'crisp-edges';
            
            // Clear container and add portrait
            this.portraitContainer.innerHTML = '';
            this.portraitContainer.appendChild(this.portraitCanvas);
            
            // Start updating portrait
            this.startUpdate();
            
            console.log(`✅ Portrait initialized for ${this.npc.id}`);
            return true;
        } catch (error) {
            console.error('❌ Error initializing portrait:', error);
            return false;
        }
    }
    
    /**
     * Start periodic portrait updates
     * Captures game canvas and draws zoomed NPC sprite
     */
    startUpdate() {
        // Clear any existing timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        // Update immediately
        this.updatePortrait();
        
        // Then update periodically
        this.updateTimer = setInterval(() => {
            if (this.portraitCtx && this.npc._sprite) {
                this.updatePortrait();
            }
        }, this.updateInterval);
    }
    
    /**
     * Update portrait with current game canvas content
     * Captures zoomed portion of NPC sprite
     */
    updatePortrait() {
        if (!this.portraitCanvas || !this.portraitCtx || !this.npc._sprite || !this.gameCanvas) {
            return;
        }
        
        try {
            const sprite = this.npc._sprite;
            
            // Get sprite position and size
            const spriteX = sprite.x;
            const spriteY = sprite.y;
            const spriteWidth = sprite.displayWidth;
            const spriteHeight = sprite.displayHeight;
            
            // Calculate zoom region (4x zoom, centered on sprite)
            const zoomWidth = this.portraitWidth / this.zoomLevel;
            const zoomHeight = this.portraitHeight / this.zoomLevel;
            
            // Center zoom on sprite center
            const sourceX = Math.max(0, spriteX - (zoomWidth / 2));
            const sourceY = Math.max(0, spriteY - (zoomHeight / 2));
            
            // Clear portrait
            this.portraitCtx.fillStyle = '#000';
            this.portraitCtx.fillRect(0, 0, this.portraitWidth, this.portraitHeight);
            
            // Draw zoomed portion of game canvas
            this.portraitCtx.drawImage(
                this.gameCanvas,
                sourceX, sourceY,
                zoomWidth, zoomHeight,
                0, 0,
                this.portraitWidth, this.portraitHeight
            );
            
        } catch (error) {
            console.error('❌ Error updating portrait:', error);
        }
    }
    
    /**
     * Stop updating portrait
     */
    stopUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    /**
     * Set zoom level for portrait
     * @param {number} zoomLevel - Zoom multiplier (e.g., 4 for 4x)
     */
    setZoomLevel(zoomLevel) {
        this.zoomLevel = Math.max(1, zoomLevel);
    }
    
    /**
     * Get portrait as data URL for export
     * @returns {string|null} Data URL or null if failed
     */
    getPortraitDataURL() {
        if (!this.portraitCanvas) {
            return null;
        }
        
        try {
            return this.portraitCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('❌ Error exporting portrait:', error);
            return null;
        }
    }
    
    /**
     * Cleanup portrait renderer
     * Stops updates and clears resources
     */
    destroy() {
        try {
            // Stop updates
            this.stopUpdate();
            
            // Clear canvas references
            if (this.portraitCanvas && this.portraitContainer) {
                this.portraitCanvas.remove();
            }
            
            this.portraitCanvas = null;
            this.portraitCtx = null;
            this.gameCanvas = null;
            
            console.log(`✅ Portrait destroyed for ${this.npc.id}`);
        } catch (error) {
            console.error('❌ Error destroying portrait:', error);
        }
    }
}
