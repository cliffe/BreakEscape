/**
 * NPC Talk Icon System
 * 
 * Displays a "talk" icon above NPC heads when the player is within interaction range.
 * Manages icon creation, positioning, and visibility based on player proximity.
 * 
 * @module npc-talk-icons
 */

import { DOOR_INTERACTION_RANGE } from '../utils/constants.js';

export class NPCTalkIconSystem {
    constructor(scene) {
        this.scene = scene;
        this.npcIcons = new Map(); // { npcId: { npc, icon, sprite } }
        // Offset from NPC position - use whole pixels to avoid sub-pixel rendering
        this.ICON_OFFSET = { x: 0, y: -33 }; 
        this.INTERACTION_RANGE = DOOR_INTERACTION_RANGE;
        this.UPDATE_INTERVAL = 200; // ms between updates
        this.lastUpdate = 0;
        this.ICON_WIDTH = 21; // Talk icon width in pixels
    }

    /**
     * Initialize talk icons for all NPCs in the current room
     * @param {Array} npcs - Array of NPC objects
     * @param {Array} sprites - Array of NPC sprite objects
     */
    init(npcs, sprites) {
        this.npcs = npcs || [];
        this.sprites = sprites || [];
        
        // Create icons for each NPC sprite
        if (this.sprites && Array.isArray(this.sprites)) {
            this.sprites.forEach(spriteObj => {
                this.createIconForNPC(spriteObj);
            });
        }
        
        console.log(`💬 Initialized ${this.npcIcons.size} talk icons`);
    }

    /**
     * Create a talk icon for an NPC sprite
     * @param {Object} spriteObj - NPC sprite object
     */
    createIconForNPC(spriteObj) {
        if (!spriteObj || !spriteObj.npcId) return;
        
        // Don't create duplicate icons
        if (this.npcIcons.has(spriteObj.npcId)) return;
        
        try {
            // Calculate the offset to align icon's right edge with sprite's right edge
            // Get sprite's actual width in pixels (accounting for scale)
            const spriteWidth = spriteObj.width;
            // Offset from sprite center to align right edges
            const offsetX = 0; //(spriteWidth / 2) - (scaledIconWidth / 2);
            
            // Calculate pixel-perfect position (round to whole pixels)
            const iconX = Math.round(spriteObj.x + offsetX);
            const iconY = Math.round(spriteObj.y + this.ICON_OFFSET.y);
            
            // Create the icon image
            const icon = this.scene.add.image(iconX, iconY, 'talk');
            
            // Hide by default
            icon.setVisible(false);
            icon.setDepth(spriteObj.depth + 1);
            // icon.setOrigin(0.5, 0.5);
            
            // Store reference with calculated offset for consistent positioning
            this.npcIcons.set(spriteObj.npcId, {
                npc: spriteObj,
                icon: icon,
                visible: false,
                offsetX: offsetX  // Store for consistent updates
            });
            
            console.log(`💬 Created talk icon for NPC: ${spriteObj.npcId} at offset x=${offsetX}`);
        } catch (error) {
            console.error(`❌ Error creating talk icon for ${spriteObj.npcId}:`, error);
        }
    }

    /**
     * Update icon visibility based on player proximity
     * @param {Object} player - Player sprite object
     */
    update(player) {
        if (!player) return;
        
        // Throttle updates
        const now = Date.now();
        if (now - this.lastUpdate < this.UPDATE_INTERVAL) {
            return;
        }
        this.lastUpdate = now;
        
        // Check distance to each NPC
        this.npcIcons.forEach((iconData, npcId) => {
            const distance = Phaser.Math.Distance.Between(
                player.x,
                player.y,
                iconData.npc.x,
                iconData.npc.y
            );
            
            const shouldShow = distance <= this.INTERACTION_RANGE;
            
            // Update icon visibility and position
            if (shouldShow !== iconData.visible) {
                iconData.icon.setVisible(shouldShow);
                iconData.visible = shouldShow;
            }
            
            // Update position to follow NPC with pixel-perfect alignment
            // Use stored offset to ensure consistent positioning without recalculating bounds
            const newX = Math.round(iconData.npc.x + iconData.offsetX);
            const newY = Math.round(iconData.npc.y + this.ICON_OFFSET.y);
            iconData.icon.setPosition(newX, newY);
            
            // Update depth if needed
            const expectedDepth = iconData.npc.depth + 1;
            if (iconData.icon.depth !== expectedDepth) {
                iconData.icon.setDepth(expectedDepth);
            }
        });
    }

    /**
     * Show icon for a specific NPC
     * @param {string} npcId - NPC ID
     */
    showIcon(npcId) {
        const iconData = this.npcIcons.get(npcId);
        if (iconData && !iconData.visible) {
            iconData.icon.setVisible(true);
            iconData.visible = true;
        }
    }

    /**
     * Hide icon for a specific NPC
     * @param {string} npcId - NPC ID
     */
    hideIcon(npcId) {
        const iconData = this.npcIcons.get(npcId);
        if (iconData && iconData.visible) {
            iconData.icon.setVisible(false);
            iconData.visible = false;
        }
    }

    /**
     * Hide all talk icons
     */
    hideAll() {
        this.npcIcons.forEach(iconData => {
            iconData.icon.setVisible(false);
            iconData.visible = false;
        });
    }

    /**
     * Show all talk icons
     */
    showAll() {
        this.npcIcons.forEach(iconData => {
            iconData.icon.setVisible(true);
            iconData.visible = true;
        });
    }

    /**
     * Remove talk icon for a specific NPC
     * @param {string} npcId - NPC ID
     */
    removeIcon(npcId) {
        const iconData = this.npcIcons.get(npcId);
        if (iconData) {
            iconData.icon.destroy();
            this.npcIcons.delete(npcId);
        }
    }

    /**
     * Cleanup all icons
     */
    destroy() {
        this.npcIcons.forEach(iconData => {
            iconData.icon.destroy();
        });
        this.npcIcons.clear();
    }

    /**
     * Set interaction range for showing icons
     * @param {number} range - Range in pixels
     */
    setInteractionRange(range) {
        this.INTERACTION_RANGE = range;
    }

    /**
     * Set icon offset from NPC position
     * @param {Object} offset - {x, y} offset
     */
    setIconOffset(offset) {
        this.ICON_OFFSET = offset;
    }
}

export default NPCTalkIconSystem;
