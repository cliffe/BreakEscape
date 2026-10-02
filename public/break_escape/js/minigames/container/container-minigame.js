// Container Minigame
import { MinigameScene } from '../framework/base-minigame.js';
import { addToInventory, removeFromInventory } from '../../systems/inventory.js';
import { makeDraggable } from '../../utils/helpers.js';
import { displayDashes } from '../../utils/display-dashes.js';

export class ContainerMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        this.containerItem = params.containerItem;
        // Don't set contents here - let init() load from server if available
        // Only use passed contents as fallback for locked containers or local games
        this.contents = [];
        this.isTakeable = params.isTakeable || false;
        
        // NPC mode support
        this.mode = params.mode || 'container'; // 'container', 'pc', or 'npc'
        this.npcId = params.npcId || null;
        this.npcDisplayName = params.npcDisplayName || null;
        this.npcAvatar = params.npcAvatar || null;
        
        // Auto-detect desktop mode for PC/tablet containers (not used in NPC mode)
        this.desktopMode = (this.mode !== 'npc') && (params.desktopMode || this.shouldUseDesktopMode());
    }
        /**
     * Test bridge state (see MinigameScene.getTestState).
     *
     * Containers NEST. Clicking an item does one of two things:
     *   - `kind: "take"` — the item goes straight into the inventory and the
     *     container stays open.
     *   - `kind: "view"` — the item is taken AND a viewer opens on top (notes,
     *     text-file, …). Closing that viewer RE-OPENS this container, via
     *     window.pendingContainerReturn.
     *
     * So an agent that closes a viewer must expect to land back here, not in
     * the overworld. `returnsToContainer` on the viewer's own state says so.
     *
     * Items are read from the live DOM because the markup differs by mode:
     * `.container-content-item` for bins and safes, `.desktop-icon` for PCs.
     * Use minigame.take(nameOrIndex) rather than matching those classes yourself.
     */
    getTestState() {
        const root = this.container;
        const nodes = root
            ? Array.from(root.querySelectorAll('.container-content-item, .desktop-icon'))
                  .filter(el => el.offsetParent !== null)
            : [];

        const items = nodes.map((el, i) => {
            const isDesktop = el.classList.contains('desktop-icon');
            const name = (el.title || el.alt ||
                          el.querySelector('.desktop-icon-label')?.textContent || '').trim();
            // scenarioData for this entry, matched by name — tells us whether
            // clicking opens a viewer or just pockets the item.
            const data = (this.contents || []).find(c => displayDashes(c?.name || '') === name) || {};
            const opensViewer = !!(data.readable || data.noteContent || data.text ||
                                   ['notes', 'note', 'text-file', 'document'].includes(data.type));
            return {
                index: i,
                name,
                type: data.type ?? null,
                kind: opensViewer ? 'view' : 'take',
                selector: isDesktop ? '.desktop-icon' : '.container-content-item'
            };
        });

        return {
            ...super.getTestState(),
            mode: this.mode,
            npcId: this.npcId || null,
            containerName: this.containerItem?.scenarioData?.name || null,
            items,
            // Still listed for reference; `items` is what you act on.
            contents: (this.contents || []).map(item => ({
                id: item?.id ?? null,
                name: item?.name ?? null,
                type: item?.type ?? null
            })),
            takeHint: 'take("<item name>") — handles both container and desktop markup.'
        };
    }

    getContainerImageUrl() {
        const key = this.containerItem?.texture?.key;
        if (!key) return null;
        // Maps Phaser texture keys to their actual filenames (where key !== filename stem)
        const KEY_TO_FILE = {
            'safe':         'safe1',
            'pc':           'pc1',
            'notes':        'notes1',
            'phone':        'phone1',
            'suitcase':     'suitcase-1',
            'photo':        'picture1',
            'book':         'book1',
            'fingerprint':  'fingerprint_small',
            'spoofing_kit': 'office-misc-headphones',
        };
        const file = KEY_TO_FILE[key] || key;
        return `/break_escape/assets/objects/${file}.png`;
    }

    shouldUseDesktopMode() {
        // Check if the container is a PC, tablet, or computer-related device
        const containerName = this.containerItem?.scenarioData?.name?.toLowerCase() || '';
        const containerType = this.containerItem?.scenarioData?.type?.toLowerCase() || '';
        const containerImage = this.containerItem?.name?.toLowerCase() || '';

        // Keywords that indicate desktop/computer devices
        const desktopKeywords = [
            'computer', 'pc', 'laptop', 'desktop', 'terminal', 'workstation',
            'tablet', 'ipad', 'surface', 'monitor', 'screen', 'display',
            'server', 'mainframe', 'console', 'kiosk', 'smartboard'
        ];

        // Check if any keyword matches
        const allText = `${containerName} ${containerType} ${containerImage}`.toLowerCase();
        return desktopKeywords.some(keyword => allText.includes(keyword));
    }

    async loadContainerContents() {
        // Try multiple sources for gameId
        const gameId = window.gameId || window.breakEscapeConfig?.gameId;
        const containerId = this.containerItem.scenarioData.id ||
                           this.containerItem.scenarioData.name ||
                           this.containerItem.objectId;

        if (!gameId) {
            console.error('No gameId available for container loading. Checked window.gameId and window.breakEscapeConfig?.gameId');
            return [];
        }

        console.log(`Loading contents for container: ${containerId} (gameId: ${gameId})`);

        try {
            const response = await fetch(`/break_escape/games/${gameId}/container/${containerId}`, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    if (window.gameAlert) {
                        window.gameAlert('Container is locked', 'error', 'Locked', 2000);
                    }
                    this.complete(false);
                    return [];
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Loaded ${data.contents?.length || 0} items from container ${containerId}:`, data.contents);
            return data.contents || [];
        } catch (error) {
            console.error('Failed to load container contents:', error);
            if (window.gameAlert) {
                window.gameAlert('Could not load container contents', 'error', 'Error', 3000);
            }
            return [];
        }
    }

    async init() {
        // Call parent init first
        super.init();

        // Play drawer/container opening sound (not for PC/desktop containers)
        if (this.mode !== 'pc' && !this.desktopMode) {
            try {
                if (window.game && window.game.sound) {
                    const sound = window.game.sound.get('drawer_open') || window.game.sound.add('drawer_open');
                    sound.play({ volume: 0.8 });
                }
            } catch (e) {
                // Sound not available
            }
        }

        // Update header with container name
        if (this.headerElement) {
            this.headerElement.innerHTML = `
                <h3>${displayDashes(this.containerItem.scenarioData.name)}</h3>
                <p>${displayDashes(this.containerItem.scenarioData.observations || '')}</p>
            `;
        }

        // Add notebook button to minigame controls if postit note exists (before cancel button)
        if (this.controlsElement && this.containerItem.scenarioData.postitNote && this.containerItem.scenarioData.showPostit) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes-sm.png" alt="Notepad" class="icon-small"> Add to Notepad';
            // Insert before the cancel button (first child in controls)
            this.controlsElement.insertBefore(notebookBtn, this.controlsElement.firstChild);
        }

        // Show loading state
        this.gameContainer.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;">Loading contents...</div>';

        // Always load contents from server if gameId exists and container is unlocked
        // This ensures we get the latest contents (with items already in inventory filtered out)
        // Even if contents were passed in params, reload from server to get accurate state
        const gameId = window.gameId || window.breakEscapeConfig?.gameId;
        if (gameId && this.containerItem.scenarioData.locked === false) {
            console.log('Reloading container contents from server to get latest state');
            this.contents = await this.loadContainerContents();
        } else if (this.params.contents && this.params.contents.length > 0) {
            // Only use passed contents if server loading isn't available (locked container or local game)
            console.log('Using passed contents (container locked or no server)');
            this.contents = this.params.contents;
        }

        // Create the container minigame UI
        this.createContainerUI();
    }
    
    createContainerUI() {
        if (this.mode === 'npc') {
            this.createNPCUI();
        } else if (this.desktopMode) {
            this.createDesktopUI();
        } else {
            this.createStandardUI();
        }
        
        // Populate contents
        this.populateContents();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    createNPCUI() {
        // NPC mode - show NPC avatar and offer items
        let avatarHtml = '';
        if (this.npcAvatar) {
            avatarHtml = `<img src="${this.npcAvatar}" alt="${this.npcDisplayName}" class="npc-avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">`;
        }
        
        this.gameContainer.innerHTML = `
            <div class="container-minigame npc-mode">
                ${avatarHtml}
                <h3 style="text-align: center; margin-bottom: 20px;">${this.npcDisplayName || 'NPC'} offers you items</h3>
                <div class="container-contents-section">
                    <h4 style="text-align: center;">Available Items</h4>
                    <div class="container-contents-grid" id="container-contents-grid">
                        <!-- Contents will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    createStandardUI() {
        this.gameContainer.innerHTML = `
            <div class="container-minigame">
                <div class="container-image-section">
                    <img src="${this.getContainerImageUrl()}"
                         alt="${this.containerItem.scenarioData.name}"
                         class="container-image">
                    <div class="container-info">
                        <h4>${displayDashes(this.containerItem.scenarioData.name)}</h4>
                        <p>${displayDashes(this.containerItem.scenarioData.observations || '')}</p>
                    </div>
                </div>

                <div class="container-contents-section">
                    <h4>Contents</h4>
                    <div class="container-contents-grid" id="container-contents-grid">
                        <!-- Contents will be populated here -->
                    </div>
                </div>
                
                <div class="container-actions">
                    ${this.isTakeable ? '<button class="minigame-button" id="take-container-btn">Take Container</button>' : ''}
                </div>
            </div>
        `;
    }
    
    createDesktopUI() {
        this.gameContainer.innerHTML = `
            <div class="container-image-section">
                <img src="${this.getContainerImageUrl()}"
                        alt="${this.containerItem.scenarioData.name}"
                        class="container-image">
                <div class="container-info">
                    <h4>${displayDashes(this.containerItem.scenarioData.name)}</h4>
                    <p>${displayDashes(this.containerItem.scenarioData.observations || '')}</p>
                </div>
            </div>
            <div class="container-minigame desktop-mode">
                <div class="container-monitor-bezel">
                    <div class="desktop-background">
                        <div class="desktop-wallpaper"></div>
                        <div class="desktop-icons" id="desktop-icons">
                            <!-- Desktop icons will be populated here -->
                        </div>
                    </div>
                    
                </div>

                <div class="desktop-taskbar">
                    <div class="desktop-actions">
                        ${this.isTakeable ? '<button class="minigame-button" id="take-container-btn">Take Container</button>' : ''}
                    </div>
                </div>
            </div>
        `;

        if (this.containerItem.scenarioData.postitNote && this.containerItem.scenarioData.showPostit) {
            const postit = document.createElement('div');
            postit.className = 'postit-note';
            postit.textContent = displayDashes(this.containerItem.scenarioData.postitNote);
            makeDraggable(postit);
            this.gameContainer.appendChild(postit);
        }
    }
    
    populateContents() {
        if (this.desktopMode) {
            this.populateDesktopIcons();
        } else {
            this.populateStandardContents();
        }
    }
    
    populateStandardContents() {
        const contentsGrid = document.getElementById('container-contents-grid');
        if (!contentsGrid) return;
        
        if (this.contents.length === 0) {
            contentsGrid.innerHTML = '<p class="empty-contents">This container is empty.</p>';
            return;
        }
        
        this.contents.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'container-content-slot';
            
            const itemImg = document.createElement('img');
            itemImg.className = 'container-content-item';
            itemImg.src = `/break_escape/assets/objects/${item.type}.png`;
            itemImg.alt = item.name;
            itemImg.title = displayDashes(item.name);
            
            // Add item data
            itemImg.scenarioData = item;
            itemImg.name = item.type;
            itemImg.objectId = `container_${index}`;
            
            // Add click handler for all items (both takeable and interactive)
            itemImg.style.cursor = 'pointer';
            
            // Check if this is an interactive item that should trigger a minigame
            if (this.isInteractiveItem(item)) {
                itemImg.addEventListener('click', () => this.handleInteractiveItem(item, itemImg));
            } else if (item.takeable) {
                // Regular takeable items
                itemImg.addEventListener('click', () => this.takeItem(item, itemImg));
            }
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'container-content-tooltip';
            tooltip.textContent = displayDashes(item.name);
            
            slot.appendChild(itemImg);
            slot.appendChild(tooltip);
            contentsGrid.appendChild(slot);
        });
    }
    
    populateDesktopIcons() {
        const desktopIcons = document.getElementById('desktop-icons');
        if (!desktopIcons) return;
        
        if (this.contents.length === 0) {
            desktopIcons.innerHTML = '<div class="empty-desktop">Desktop is empty</div>';
            return;
        }
        
        this.contents.forEach((item, index) => {
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            
            const iconImg = document.createElement('img');
            iconImg.className = 'desktop-icon-image';
            iconImg.src = `/break_escape/assets/objects/${item.type}.png`;
            iconImg.alt = item.name;
            
            const iconLabel = document.createElement('div');
            iconLabel.className = 'desktop-icon-label';
            iconLabel.textContent = displayDashes(item.name);
            
            // Add item data
            iconImg.scenarioData = item;
            iconImg.name = item.type;
            iconImg.objectId = `desktop_${index}`;
            
            // Add click handler for all items (both takeable and interactive)
            icon.style.cursor = 'pointer';
            
            // Check if this is an interactive item that should trigger a minigame
            if (this.isInteractiveItem(item)) {
                icon.addEventListener('click', () => this.handleInteractiveItem(item, iconImg));
            } else if (item.takeable) {
                // Regular takeable items
                icon.addEventListener('click', () => this.takeItem(item, iconImg));
            }
            
            icon.appendChild(iconImg);
            icon.appendChild(iconLabel);
            desktopIcons.appendChild(icon);
        });
    }
    
    setupEventListeners() {
        // Take container button
        const takeContainerBtn = document.getElementById('take-container-btn');
        if (takeContainerBtn) {
            this.addEventListener(takeContainerBtn, 'click', () => this.takeContainer());
        }
        
        // Close button
        const closeBtn = document.getElementById('close-container-btn');
        if (closeBtn) {
            this.addEventListener(closeBtn, 'click', () => this.complete(false));
        }

        // Add to Notepad button
        const addToNotebookBtn = document.getElementById('minigame-notebook-postit');
        if (addToNotebookBtn) {
            this.addEventListener(addToNotebookBtn, 'click', () => this.addPostitToNotebook());
        }
    }
    
    isInteractiveItem(item) {
        // Check if this item should trigger a minigame instead of being taken

        // Notes with readable text (all notes variants: notes, notes2, notes3, ...)
        if (/^notes\d*$/.test(item.type) && item.readable && item.text) {
            return true;
        }

        // Text files — always interactive (never taken, even without text)
        if (item.type === 'text_file') {
            return true;
        }
        
        // Phone with messages
        if (item.type === 'phone' && (item.text || item.voice)) {
            return true;
        }
        
        // Workstation (crypto workstation)
        if (item.type === 'workstation') {
            return true;
        }
        
        // Add more interactive item types as needed

        // Custom minigame types (VM-01, VM-02 and future minigame objects in containers)
        if (item.type === 'scada_historian' ||
            item.type === 'log_filter_terminal' ||
            item.type === 'drug_library_terminal' ||
            item.minigameId) {
            return true;
        }

        return false;
    }
    
    handleInteractiveItem(item, itemElement) {
        console.log('Handling interactive item from container:', item);

        // Apply onRead.setVariable (or legacy onPickup.setVariable) when item is read/used.
        // onRead is preferred for non-takeable readable items; onPickup is kept as fallback.
        const readAction = item.onRead || item.onPickup;
        if (readAction?.setVariable && window.gameState?.globalVariables) {
            Object.entries(readAction.setVariable).forEach(([varName, value]) => {
                const oldValue = window.gameState.globalVariables[varName];
                window.gameState.globalVariables[varName] = value;
                console.log(`📖 onRead.setVariable: ${varName} = ${value}`);
                if (window.npcConversationStateManager) {
                    window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
                }
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                        name: varName, value, oldValue
                    });
                    console.log(`📡 Emitted event: global_variable_changed:${varName}`);
                }
            });

            // Emit item_picked_up so collect_items tasks can track reads of non-takeable files
            if (window.eventDispatcher) {
                window.eventDispatcher.emit(`item_picked_up:${item.type}`, {
                    itemType: item.type,
                    itemName: item.name,
                    itemId: item.id || item.name,
                    collectionGroup: item.collection_group || null,
                    roomId: window.currentPlayerRoom
                });
            }
        }

        // For readable notes items (all variants), open notes minigame — goes to notepad, not inventory
        if (/^notes\d*$/.test(item.type) && item.readable && item.text) {
            console.log('Notes item is takeable - will trigger minigame then take item');
            
            // Store container state for return after minigame
            const containerState = {
                containerItem: this.containerItem,
                contents: this.contents,
                isTakeable: this.isTakeable,
                itemToTake: item,  // Store the item to take after minigame
                itemElement: itemElement,
                // Preserve NPC context if in NPC mode
                npcOptions: this.mode === 'npc' ? {
                    mode: this.mode,
                    npcId: this.npcId,
                    npcDisplayName: this.npcDisplayName,
                    npcAvatar: this.npcAvatar
                } : null
            };
            
            // Store the container state globally so we can return to it
            window.pendingContainerReturn = containerState;
            
            // Close the container minigame first
            this.complete(false);
            
            // Create a temporary sprite-like object for the main game handler
            const tempSprite = {
                scenarioData: item,
                name: item.type,
                objectId: `temp_${Date.now()}`
            };
            
            // Delegate to main game's handler for viewing/reading items (notes, phone, files, etc.)
            if (window.handleObjectInteraction) {
                window.handleObjectInteraction(tempSprite);
            } else {
                console.error('handleObjectInteraction not available');
                window.gameAlert('Could not handle item interaction', 'error', 'Error', 3000);
            }
            return;
        }
        
        // For other takeable items, use takeItem to properly remove from container
        if (item.takeable) {
            console.log('Item is takeable, using takeItem method');
            this.takeItem(item, itemElement);
            return;
        }
        
        // Store container state for return after minigame
        const containerState = {
            containerItem: this.containerItem,
            contents: this.contents,
            isTakeable: this.isTakeable,
            // Preserve NPC context if in NPC mode
            npcOptions: this.mode === 'npc' ? {
                mode: this.mode,
                npcId: this.npcId,
                npcDisplayName: this.npcDisplayName,
                npcAvatar: this.npcAvatar
            } : null
        };
        
        // Store the container state globally so we can return to it
        window.pendingContainerReturn = containerState;
        
        // Close the container minigame first
        this.complete(false);
        
        // Create a temporary sprite-like object for the main game handler
        const tempSprite = {
            scenarioData: item,
            name: item.type,
            objectId: `temp_${Date.now()}`
        };
        
        // Delegate to main game's handler for viewing/reading items (notes, phone, files, etc.)
        if (window.handleObjectInteraction) {
            window.handleObjectInteraction(tempSprite);
        } else {
            console.error('handleObjectInteraction not available');
            window.gameAlert('Could not handle item interaction', 'error', 'Error', 3000);
        }
    }
    
    addPostitToNotebook() {
        console.log('Adding postit note to notebook:', this.containerItem.scenarioData.postitNote);

        const postitNote = this.containerItem.scenarioData.postitNote;
        if (!postitNote || postitNote.trim() === '') {
            this.showMessage('No postit note to add.', 'error');
            return;
        }

        // Create comprehensive notebook content
        const notebookTitle = `Postit Note - ${this.containerItem.scenarioData.name}`;
        let notebookContent = `Postit Note:\n${'-'.repeat(50)}\n\n${postitNote}`;
        
        // Add container contents list
        notebookContent += `\n\n${'='.repeat(20)}\n`;
        notebookContent += `CONTAINER CONTENTS: ${this.containerItem.scenarioData.name}\n`;
        notebookContent += `${'='.repeat(20)}\n`;
        
        if (this.contents && this.contents.length > 0) {
            this.contents.forEach((item, index) => {
                notebookContent += `${index + 1}. ${item.name || item.type}`;
                if (item.description) {
                    notebookContent += ` - ${item.description}`;
                }
                notebookContent += '\n';
            });
        } else {
            notebookContent += 'No items found\n';
        }
        
        notebookContent += `${'='.repeat(20)}\n`;
        notebookContent += `Date: ${new Date().toLocaleString()}`;
        
        const notebookObservations = `Postit note found in ${this.containerItem.scenarioData.name}.`;

        // Check if notes minigame is available
        if (window.startNotesMinigame) {
            // Store the container state globally so we can return to it
            const containerState = {
                containerItem: this.containerItem,
                contents: this.contents,
                isTakeable: this.isTakeable,
                // Preserve NPC context if in NPC mode
                npcOptions: this.mode === 'npc' ? {
                    mode: this.mode,
                    npcId: this.npcId,
                    npcDisplayName: this.npcDisplayName,
                    npcAvatar: this.npcAvatar
                } : null
            };

            window.pendingContainerReturn = containerState;

            // Create a postit item for the notes minigame
            const postitItem = {
                scenarioData: {
                    type: 'postit_note',
                    name: notebookTitle,
                    text: notebookContent,
                    observations: notebookObservations,
                    important: true
                }
            };

            // Start notes minigame
            window.startNotesMinigame(
                postitItem,
                notebookContent,
                notebookObservations,
                null,
                false,
                false
            );

            this.showMessage("Added postit note to notepad", 'success');
        } else {
            console.error('Notes minigame not available');
            this.showMessage('Notepad not available', 'error');
        }
    }
    
    // async because addToInventory is: `if (addToInventory(...))` tests a
    // Promise, which is always truthy, so this used to take the success branch
    // even when the server refused the item and removed the row anyway.
    async takeItem(item, itemElement) {
        console.log('Taking item from container:', item);
        
        // Create a temporary sprite-like object for the inventory system
        const tempSprite = {
            scenarioData: item,
            name: item.type,
            objectId: `temp_${Date.now()}`,
            setVisible: function(visible) {
                // Mock setVisible method for inventory compatibility
                console.log(`Mock setVisible(${visible}) called on temp sprite`);
            }
        };
        
        // Add to inventory
        const addResult = await addToInventory(tempSprite);
        if (addResult && addResult.ok) {
            if (window.playUISound) window.playUISound('item');
            // Remove from container display
            itemElement.parentElement.remove();
            
            // Remove from contents array
            const itemIndex = this.contents.findIndex(content => content === item);
            if (itemIndex !== -1) {
                this.contents.splice(itemIndex, 1);
                
                // If in NPC mode, also remove from NPC's itemsHeld
                if (this.mode === 'npc' && this.npcId && window.npcManager) {
                    const npc = window.npcManager.getNPC(this.npcId);
                    if (npc && npc.itemsHeld) {
                        const npcItemIndex = npc.itemsHeld.findIndex(i => i === item);
                        if (npcItemIndex !== -1) {
                            npc.itemsHeld.splice(npcItemIndex, 1);
                            
                            // Emit event to update Ink variables
                            if (window.eventDispatcher) {
                                window.eventDispatcher.emit('npc_items_changed', { 
                                    npcId: this.npcId 
                                });
                            }
                        }
                    }
                }
            }
            
            // Show success message
            this.showMessage(`Added ${displayDashes(item.name)} to inventory`, 'success');
            
            // If container is now empty, update display
            if (this.contents.length === 0) {
                const contentsGrid = document.getElementById('container-contents-grid');
                if (contentsGrid) {
                    contentsGrid.innerHTML = '<p class="empty-contents">This container is empty.</p>';
                }
            }
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.showMessage(`Failed to add ${displayDashes(item.name)} to inventory`, 'error');
        }
    }

    // async for the same reason as takeItem above.
    async takeContainer() {
        console.log('Taking container:', this.containerItem);
        
        // Ensure container item has setVisible method if it doesn't already
        if (!this.containerItem.setVisible) {
            this.containerItem.setVisible = function(visible) {
                console.log(`Mock setVisible(${visible}) called on container item`);
            };
        }
        
        // Add container to inventory
        const addResult = await addToInventory(this.containerItem);
        if (addResult && addResult.ok) {
            this.showMessage(`Added ${displayDashes(this.containerItem.scenarioData.name)} to inventory`, 'success');
            
            // Close the minigame after a short delay
            setTimeout(() => {
                this.complete(true);
            }, 1500);
        } else {
            this.showMessage(`Failed to add ${displayDashes(this.containerItem.scenarioData.name)} to inventory`, 'error');
        }
    }
    
    showMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `container-message container-message-${type}`;
        messageElement.textContent = message;
        
        this.messageContainer.appendChild(messageElement);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.parentElement.removeChild(messageElement);
            }
        }, 3000);
    }
    
    /**
     * Complete the minigame
     * Override to handle returning to conversation for NPC inventory mode
     */
    complete(success) {
        // If in NPC mode, return to the conversation instead of just closing
        if (this.mode === 'npc') {
            // Check if we're in the middle of transitioning to another minigame (e.g., notes)
            // If pendingContainerReturn exists, it means we should return to container, not conversation
            if (window.pendingContainerReturn) {
                console.log('Container minigame (NPC mode) closing - but pendingContainerReturn exists, so just closing');
                // Just close normally - we'll return to container after the next minigame
                super.complete(success);
            } else {
                console.log('Container minigame (NPC mode) closing - returning to conversation');
                
                // Call the parent complete to close the minigame
                super.complete(success);
                
                // Then return to the conversation via the minigame framework
                if (window.returnToConversationAfterNPCInventory) {
                    // Delay slightly to ensure minigame is fully closed
                    setTimeout(() => {
                        window.returnToConversationAfterNPCInventory();
                    }, 100);
                }
            }
        } else {
            // For regular containers, just close normally
            super.complete(success);
        }
    }
}

// Function to start the container minigame
export function startContainerMinigame(containerItem, contents, isTakeable = false, desktopMode = null, npcOptions = null) {
    // Auto-detect desktop mode if not explicitly set
    if (desktopMode === null) {
        desktopMode = shouldUseDesktopModeForContainer(containerItem);
    }
    
    console.log('Starting container minigame', { containerItem, contents, isTakeable, desktopMode, npcOptions });
    
    // Initialize the minigame framework if not already done
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }
    
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    
    // Start the container minigame
    window.MinigameFramework.startMinigame('container', null, {
        title: containerItem.scenarioData.name,
        containerItem: containerItem,
        contents: contents,
        isTakeable: isTakeable,
        desktopMode: desktopMode,
        cancelText: 'Close',
        showCancel: true,
        ...(npcOptions && {
            mode: npcOptions.mode || 'container',
            npcId: npcOptions.npcId,
            npcDisplayName: npcOptions.npcDisplayName,
            npcAvatar: npcOptions.npcAvatar
        }),
        onComplete: (success, result) => {
            console.log('Container minigame completed', { success, result });
        }
    });
}

// Helper function to determine if a container should use desktop mode
function shouldUseDesktopModeForContainer(containerItem) {
    // Check if the container is a PC, tablet, or computer-related device
    const containerName = containerItem?.scenarioData?.name?.toLowerCase() || '';
    const containerType = containerItem?.scenarioData?.type?.toLowerCase() || '';
    const containerImage = containerItem?.name?.toLowerCase() || '';
    
    // Keywords that indicate desktop/computer devices
    const desktopKeywords = [
        'computer', 'pc', 'laptop', 'desktop', 'terminal', 'workstation',
        'tablet', 'ipad', 'surface', 'monitor', 'screen', 'display',
        'server', 'mainframe', 'console', 'kiosk', 'smartboard'
    ];
    
    // Check if any keyword matches
    const allText = `${containerName} ${containerType} ${containerImage}`.toLowerCase();
    return desktopKeywords.some(keyword => allText.includes(keyword));
}

// Function to return to container after notes minigame
export function returnToContainerAfterNotes() {
    console.log('Returning to container after notes minigame');
    
    // Check if there's a pending container return
    if (window.pendingContainerReturn) {
        const containerState = window.pendingContainerReturn;
        
        // Clear the pending return state
        window.pendingContainerReturn = null;
        
        // Check if we should remove a notes item after the notes minigame
        if (containerState.itemToTake) {
            console.log('Removing notes item after notes minigame:', containerState.itemToTake);
            
            // Notes-family items: register with server so the container filters them on next load.
            // inventory.js skips the UI slot for notes types — they live in the notepad.
            // (takeable was set to false by interactions.js before opening the minigame.)
            if (window.addToInventory) {
                const tempSprite = {
                    scenarioData: containerState.itemToTake,
                    name: containerState.itemToTake.type,
                    objectId: `temp_${Date.now()}`,
                    setVisible: function() {}
                };
                window.addToInventory(tempSprite);
            }
            
            // Remove from container display
            if (containerState.itemElement && containerState.itemElement.parentElement) {
                containerState.itemElement.parentElement.remove();
            }
            
            // Remove from contents array
            const itemIndex = containerState.contents.findIndex(content => content === containerState.itemToTake);
            if (itemIndex !== -1) {
                containerState.contents.splice(itemIndex, 1);
            }
            
            window.gameAlert(`${containerState.itemToTake.name} has been noted`, 'success', 'Added to Notes', 2000);
        }
        
        // Start the container minigame - don't pass contents, let it reload from server
        // This ensures items already in inventory are filtered out
        startContainerMinigame(
            containerState.containerItem,
            null, // Don't pass contents - let it reload from server
            containerState.isTakeable,
            null, // desktopMode - let it auto-detect or use npcOptions
            containerState.npcOptions // Restore NPC context if it was saved
        );
    } else {
        console.log('No pending container return found');
    }
}

/**
 * Return to the conversation after closing the NPC inventory container
 * This handles the flow: Conversation → NPC Inventory → Back to Conversation
 */
export function returnToConversationAfterNPCInventory() {
    console.log('Returning to conversation after NPC inventory');
    
    // Check if there's a pending conversation return
    if (window.pendingConversationReturn) {
        const conversationState = window.pendingConversationReturn;
        
        // Clear the pending return state
        window.pendingConversationReturn = null;
        
        console.log('Restoring conversation:', conversationState);
        
        // Restart the appropriate conversation minigame
        if (window.MinigameFramework) {
            // Small delay to ensure container is fully closed
            setTimeout(() => {
                if (conversationState.type === 'person-chat') {
                    // Restart person-chat minigame
                    window.MinigameFramework.startMinigame('person-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true  // Flag to indicate we're resuming from a tag action
                    });
                } else if (conversationState.type === 'phone-chat') {
                    // Restart phone-chat minigame
                    window.MinigameFramework.startMinigame('phone-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true  // Flag to indicate we're resuming from a tag action
                    });
                }
            }, 50);
        }
    } else {
        console.log('No pending conversation return found');
    }
}
