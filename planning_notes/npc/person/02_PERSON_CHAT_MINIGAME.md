# Person-Chat Minigame Design

## Overview
A cinematic conversation interface that shows zoomed character portraits during face-to-face dialogue with in-person NPCs. Similar to phone-chat but with visual emphasis on the characters speaking.

## Visual Design Philosophy

### Cinematic Presentation
- **Large character portraits**: 4x zoomed sprites showing character faces
- **Side-by-side layout**: NPC on left, player on right
- **Subtitle-style dialogue**: Text overlays the portrait area or appears below
- **Minimal UI chrome**: Focus on characters and conversation
- **Pixel-art aesthetic**: Maintain sharp edges, no border-radius, 2px borders

### Differences from Phone-Chat
| Aspect | Phone-Chat | Person-Chat |
|--------|-----------|-------------|
| Context | Remote messaging | Face-to-face |
| Visuals | Phone UI with avatar icons | Zoomed sprite portraits |
| Layout | Single column messages | Side-by-side characters |
| Atmosphere | Asynchronous | Immediate/present |
| Contact list | Multiple contacts | Single conversation |

## UI Layout

### Full Interface Mockup
```
╔═══════════════════════════════════════════════════════════════╗
║  In Conversation - Alex the Sysadmin                    [X]   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                 ║
║  ┏━━━━━━━━━━━━━━━┓                      ┏━━━━━━━━━━━━━━━┓     ║
║  ┃               ┃                      ┃               ┃     ║
║  ┃               ┃                      ┃               ┃     ║
║  ┃   NPC Face    ┃                      ┃  Player Face  ┃     ║
║  ┃   (Zoomed     ┃                      ┃   (Zoomed     ┃     ║
║  ┃    4x)        ┃                      ┃     4x)       ┃     ║
║  ┃               ┃                      ┃               ┃     ║
║  ┃               ┃                      ┃               ┃     ║
║  ┗━━━━━━━━━━━━━━━┛                      ┗━━━━━━━━━━━━━━━┛     ║
║        Alex                                   You              ║
║                                                                 ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ "I've been monitoring the security logs all day. There  │  ║
║  │  are some really suspicious access patterns coming from │  ║
║  │  the CEO's office. Want me to show you?"                │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ [1] Yes, please show me the logs                        │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ [2] Can you give me access to the server room?          │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ [3] I'll come back later when I have more questions     │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                   [Add to Notepad] [Close]    ║
╚═══════════════════════════════════════════════════════════════╝
```

### Layout Zones
1. **Header** (60px): Title and close button
2. **Portrait Area** (300px): Character faces side-by-side
3. **Dialogue Area** (150px): Text box showing current speech
4. **Choices Area** (flexible): Choice buttons stacked
5. **Footer** (60px): Notebook and close buttons

## Portrait Rendering System

### Approach: Canvas Screenshot of Game Viewport (SIMPLIFIED)

**Strategy:**
- Capture current game canvas when conversation starts
- Scale and zoom on specific sprite positions
- Use CSS transform for visual zoom effect
- Simple, performant, no complex texture management

**Pros:**
- Minimal code complexity
- Reuses existing game rendering
- Works with any sprite instantly
- No special texture management
- Easy to zoom in with CSS transform

**Cons:**
- Static portrait (doesn't update with animations during conversation)
- Need to center on sprite when zooming

**Implementation:**
```javascript
class SpritePortrait {
    constructor(gameCanvas, sprite, scale = 4) {
        this.gameCanvas = gameCanvas;
        this.sprite = sprite;
        this.scale = scale; // Zoom level (4x)
    }
    
    captureAsDataURL() {
        // Get canvas image data
        return this.gameCanvas.toDataURL();
    }
    
    getZoomViewBox() {
        // Calculate viewport to show zoomed sprite
        const spriteX = this.sprite.x;
        const spriteY = this.sprite.y;
        
        // At 4x zoom, we want 256x256 area centered on sprite
        // Original area before zoom: 64x64
        const viewWidth = 256 / this.scale;  // 64
        const viewHeight = 256 / this.scale; // 64
        
        return {
            x: spriteX - viewWidth / 2,
            y: spriteY - viewHeight / 2,
            width: viewWidth,
            height: viewHeight,
            scale: this.scale
        };
    }
}
```

**CSS Zoom Effect:**
```css
.person-chat-portrait-canvas {
    width: 256px;
    height: 256px;
    image-rendering: pixelated;
    object-fit: cover;
    object-position: center;
}
```

### Why This Works
1. **Simplicity**: One screenshot, scale via CSS
2. **Reuses game rendering**: No duplicate rendering
3. **Pixel-perfect**: Maintains game's pixel art style
4. **Performance**: Single capture, CSS transform is GPU accelerated
5. **Flexibility**: Works with any sprite, any animation state

## Person-Chat Minigame Module Structure

### File Organization
```
js/minigames/person-chat/
    ├── person-chat-minigame.js      # Main controller (extends MinigameScene)
    ├── person-chat-ui.js            # UI rendering
    ├── person-chat-portraits.js     # Portrait rendering system
    └── person-chat-conversation.js  # Conversation flow logic
```

### Module: person-chat-minigame.js
Main controller extending MinigameScene.

```javascript
/**
 * PersonChatMinigame - Face-to-face conversation interface
 * 
 * Extends MinigameScene to provide cinematic character portraits
 * during in-person NPC conversations.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import PersonChatUI from './person-chat-ui.js';
import PersonChatPortraits from './person-chat-portraits.js';
import PersonChatConversation from './person-chat-conversation.js';
import InkEngine from '../../systems/ink/ink-engine.js';

export class PersonChatMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        
        // Validate required params
        if (!params.npcId) {
            throw new Error('PersonChatMinigame requires npcId');
        }
        
        // Get managers
        this.npcManager = window.npcManager;
        this.inkEngine = new InkEngine();
        
        // Initialize modules
        this.ui = null;
        this.portraits = null;
        this.conversation = null;
        
        // State
        this.currentNPCId = params.npcId;
        this.npc = this.npcManager.getNPC(this.currentNPCId);
        
        console.log('🎭 PersonChatMinigame created for', this.npc.displayName);
    }
    
    init() {
        // Set up base minigame structure
        super.init();
        
        // Customize header
        this.headerElement.innerHTML = `
            <h3>In Conversation - ${this.npc.displayName}</h3>
        `;
        
        // Initialize portrait rendering system
        this.portraits = new PersonChatPortraits(
            window.game,
            this.npc._sprite,
            window.player
        );
        
        // Initialize UI
        this.ui = new PersonChatUI(
            this.gameContainer,
            this.params,
            this.portraits
        );
        this.ui.render();
        
        // Initialize conversation system
        this.conversation = new PersonChatConversation(
            this.npcManager,
            this.inkEngine,
            this.currentNPCId
        );
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start conversation
        this.startConversation();
    }
    
    startConversation() {
        console.log('🎭 Starting conversation with', this.npc.displayName);
        
        // Trigger talking animation on NPC sprite
        if (this.npc._sprite) {
            const talkAnim = `npc-${this.npc.id}-talk`;
            if (this.npc._sprite.anims.exists(talkAnim)) {
                this.npc._sprite.play(talkAnim, true);
            }
        }
        
        // Load Ink story and show initial dialogue
        this.conversation.start().then(() => {
            this.showCurrentDialogue();
        });
    }
    
    showCurrentDialogue() {
        const dialogue = this.conversation.getCurrentText();
        const choices = this.conversation.getChoices();
        
        // Update UI
        this.ui.showDialogue(dialogue);
        this.ui.showChoices(choices);
        
        // Update portraits
        this.portraits.update();
    }
    
    setupEventListeners() {
        // Choice button clicks
        this.addEventListener(this.ui.elements.choicesContainer, 'click', (e) => {
            const choiceButton = e.target.closest('.choice-button');
            if (choiceButton) {
                const choiceIndex = parseInt(choiceButton.dataset.index);
                this.selectChoice(choiceIndex);
            }
        });
        
        // Notebook button
        const notebookBtn = document.getElementById('minigame-notebook');
        if (notebookBtn) {
            this.addEventListener(notebookBtn, 'click', () => {
                this.saveConversationToNotepad();
            });
        }
    }
    
    selectChoice(choiceIndex) {
        // Process choice through Ink
        this.conversation.selectChoice(choiceIndex).then(() => {
            // Handle action tags (unlock doors, give items, etc.)
            this.handleActionTags();
            
            // Update dialogue
            if (this.conversation.canContinue()) {
                this.showCurrentDialogue();
            } else {
                // Conversation ended
                this.endConversation();
            }
        });
    }
    
    handleActionTags() {
        const tags = this.conversation.getCurrentTags();
        
        tags.forEach(tag => {
            if (tag.startsWith('unlock_door:')) {
                const doorId = tag.split(':')[1];
                window.unlockDoor(doorId);
            } else if (tag.startsWith('give_item:')) {
                const itemType = tag.split(':')[1];
                window.giveItemToPlayer(itemType);
            }
        });
    }
    
    endConversation() {
        console.log('🎭 Conversation ended');
        
        // Return NPC to idle animation
        if (this.npc._sprite) {
            const idleAnim = `npc-${this.npc.id}-idle`;
            this.npc._sprite.play(idleAnim, true);
        }
        
        // Close minigame
        this.close();
    }
    
    saveConversationToNotepad() {
        const history = this.npcManager.getConversationHistory(this.currentNPCId);
        const text = this.formatConversationHistory(history);
        
        if (window.notebookManager) {
            window.notebookManager.addEntry({
                title: `Conversation: ${this.npc.displayName}`,
                content: text,
                category: 'conversations'
            });
        }
    }
    
    formatConversationHistory(history) {
        return history.map(entry => {
            const speaker = entry.type === 'npc' ? this.npc.displayName : 'You';
            return `${speaker}: ${entry.text}`;
        }).join('\n\n');
    }
    
    cleanup() {
        // Clean up portraits
        if (this.portraits) {
            this.portraits.destroy();
        }
        
        super.cleanup();
    }
}
```

### Module: person-chat-portraits.js
Handles portrait rendering using RenderTexture.

```javascript
/**
 * PersonChatPortraits - Portrait Rendering System
 * 
 * Manages 4x zoomed character portraits for person-chat interface.
 * Uses RenderTexture to capture and scale sprite faces.
 */

export default class PersonChatPortraits {
    constructor(scene, npcSprite, playerSprite) {
        this.scene = scene;
        this.npcSprite = npcSprite;
        this.playerSprite = playerSprite;
        
        // Portrait dimensions (256x256 @ 4x zoom of 64x64 sprite)
        this.portraitSize = 256;
        this.cropHeight = 40; // Upper portion for face
        
        // Create render textures
        this.npcPortrait = this.createPortraitTexture('npc');
        this.playerPortrait = this.createPortraitTexture('player');
        
        // Initial render
        this.update();
    }
    
    createPortraitTexture(id) {
        const texture = this.scene.add.renderTexture(
            0, 0,
            this.portraitSize,
            this.portraitSize
        );
        texture.setOrigin(0.5, 0.5);
        texture.name = `portrait_${id}`;
        return texture;
    }
    
    update() {
        // Update NPC portrait
        this.renderPortrait(
            this.npcPortrait,
            this.npcSprite
        );
        
        // Update player portrait
        this.renderPortrait(
            this.playerPortrait,
            this.playerSprite
        );
    }
    
    renderPortrait(renderTexture, sprite) {
        if (!sprite || !renderTexture) return;
        
        // Clear previous render
        renderTexture.clear();
        
        // Create temp sprite with current frame
        const tempSprite = this.scene.add.sprite(0, 0, sprite.texture.key);
        tempSprite.setFrame(sprite.frame.name);
        
        // Crop to face area (top portion of sprite)
        tempSprite.setCrop(0, 0, 64, this.cropHeight);
        
        // Scale up 4x
        tempSprite.setScale(4);
        
        // Center in render texture
        const centerX = this.portraitSize / 2;
        const centerY = this.portraitSize / 2;
        
        // Draw to texture
        renderTexture.draw(tempSprite, centerX, centerY);
        
        // Clean up
        tempSprite.destroy();
    }
    
    getNPCPortraitDataURL() {
        return this.npcPortrait.canvas.toDataURL();
    }
    
    getPlayerPortraitDataURL() {
        return this.playerPortrait.canvas.toDataURL();
    }
    
    destroy() {
        if (this.npcPortrait) {
            this.npcPortrait.destroy();
        }
        if (this.playerPortrait) {
            this.playerPortrait.destroy();
        }
    }
}
```

### Module: person-chat-ui.js
Renders UI elements and integrates portraits.

```javascript
/**
 * PersonChatUI - UI Rendering
 * 
 * Creates and manages HTML UI for person-chat interface.
 */

export default class PersonChatUI {
    constructor(container, params, portraits) {
        this.container = container;
        this.params = params;
        this.portraits = portraits;
        
        this.elements = {};
    }
    
    render() {
        // Create main UI structure
        const html = `
            <div class="person-chat-container">
                <!-- Portraits Section -->
                <div class="person-chat-portraits">
                    <div class="portrait-wrapper portrait-npc">
                        <canvas id="npc-portrait-canvas"></canvas>
                        <div class="portrait-label">${this.params.npcName}</div>
                    </div>
                    <div class="portrait-wrapper portrait-player">
                        <canvas id="player-portrait-canvas"></canvas>
                        <div class="portrait-label">You</div>
                    </div>
                </div>
                
                <!-- Dialogue Section -->
                <div class="person-chat-dialogue">
                    <div class="dialogue-text" id="dialogue-text"></div>
                </div>
                
                <!-- Choices Section -->
                <div class="person-chat-choices" id="choices-container">
                    <!-- Dynamically filled -->
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Store element references
        this.elements = {
            portraitNPC: document.getElementById('npc-portrait-canvas'),
            portraitPlayer: document.getElementById('player-portrait-canvas'),
            dialogueText: document.getElementById('dialogue-text'),
            choicesContainer: document.getElementById('choices-container')
        };
        
        // Render portraits to canvases
        this.updatePortraitCanvases();
    }
    
    updatePortraitCanvases() {
        // Draw NPC portrait
        const npcCanvas = this.elements.portraitNPC;
        const npcCtx = npcCanvas.getContext('2d');
        npcCanvas.width = 256;
        npcCanvas.height = 256;
        
        const npcImage = new Image();
        npcImage.src = this.portraits.getNPCPortraitDataURL();
        npcImage.onload = () => {
            npcCtx.drawImage(npcImage, 0, 0);
        };
        
        // Draw player portrait
        const playerCanvas = this.elements.portraitPlayer;
        const playerCtx = playerCanvas.getContext('2d');
        playerCanvas.width = 256;
        playerCanvas.height = 256;
        
        const playerImage = new Image();
        playerImage.src = this.portraits.getPlayerPortraitDataURL();
        playerImage.onload = () => {
            playerCtx.drawImage(playerImage, 0, 0);
        };
    }
    
    showDialogue(text) {
        this.elements.dialogueText.textContent = text;
    }
    
    showChoices(choices) {
        this.elements.choicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button person-chat-choice';
            button.dataset.index = index;
            button.textContent = `[${index + 1}] ${choice.text}`;
            this.elements.choicesContainer.appendChild(button);
        });
    }
}
```

## CSS Styling

### File: css/person-chat-minigame.css
```css
/* Person-Chat Minigame Styles */

.person-chat-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
}

/* Portraits Section */
.person-chat-portraits {
    display: flex;
    justify-content: space-around;
    gap: 40px;
    padding: 20px;
}

.portrait-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.portrait-wrapper canvas {
    width: 256px;
    height: 256px;
    border: 2px solid #000;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}

.portrait-label {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
}

/* Dialogue Section */
.person-chat-dialogue {
    background-color: #f0f0f0;
    border: 2px solid #000;
    padding: 20px;
    min-height: 100px;
}

.dialogue-text {
    font-size: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
}

/* Choices Section */
.person-chat-choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.person-chat-choice {
    background-color: #fff;
    border: 2px solid #000;
    padding: 15px;
    font-size: 16px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
}

.person-chat-choice:hover {
    background-color: #e0e0e0;
}

.person-chat-choice:active {
    background-color: #d0d0d0;
}
```

## Integration with Interaction System

### Triggering Person-Chat
```javascript
// In js/systems/interactions.js

function handleNPCInteraction(npc) {
    console.log('💬 Starting conversation with', npc.displayName);
    
    // Start person-chat minigame
    window.MinigameFramework.startMinigame('person-chat', {
        npcId: npc.id,
        npcName: npc.displayName,
        title: `Talking to ${npc.displayName}`,
        onComplete: (result) => {
            console.log('Conversation complete:', result);
            
            // Emit event
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('npc_conversation_ended', {
                    npcId: npc.id,
                    npcName: npc.displayName
                });
            }
        }
    });
}
```

## Animation Synchronization

### During Conversation
- **NPC speaking**: Show NPC's current animation frame in portrait
- **Player choosing**: Subtle highlight on player portrait
- **Action performed**: Brief flash or effect on relevant portrait

### Update Timing
```javascript
// In person-chat-minigame.js update loop

update() {
    // Update portraits to match current sprite frames
    if (this.portraits) {
        this.portraits.update();
        this.ui.updatePortraitCanvases();
    }
}
```

## Next Steps
1. Implement PersonChatMinigame class
2. Create portrait rendering system
3. Style UI with person-chat-minigame.css
4. Integrate with interaction system
5. Test with sample NPC
