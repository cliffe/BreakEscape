import { displayDashes } from '../../utils/display-dashes.js';

/**
 * KeySelection
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeySelection(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeySelection {
    
    constructor(parent) {
        this.parent = parent;
    }

    createKeyFromPinSizes(pinSizes) {
        // Create a complete key object based on a set of pin sizes
        // pinSizes: array of numbers representing the depth of each cut (0-100)
        
        const keyConfig = {
            pinCount: pinSizes.length,
            cuts: pinSizes,
            // Standard key dimensions
            circleRadius: 20,
            shoulderWidth: 30,
            shoulderHeight: 130,
            bladeWidth: 420,
            bladeHeight: 110,
            keywayStartX: 100,
            keywayStartY: 170,
            keywayWidth: 400,
            keywayHeight: 120
        };
        
        return keyConfig;
    }

    generateRandomKey(pinCount = 5) {
        // Generate a random key with the specified number of pins
        const cuts = [];
        for (let i = 0; i < pinCount; i++) {
            // Generate random cut depth between 25-65 (middle range for realistic key variation)
            cuts.push(Math.floor(Math.random() * 40) + 25);
        }
        return { 
            id: `random_key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cuts,
            name: `Random Key`,
            pinCount: pinCount
        };
    }

    createKeysFromInventory(inventoryKeys, correctKeyId) {
        // Create key selection from inventory keys
        // inventoryKeys: array of key objects from player inventory
        // correctKeyId: ID of the key that should work with this lock
        
        // Filter keys to only include those with cuts data
        const validKeys = inventoryKeys.filter(key => key.cuts && Array.isArray(key.cuts));
        
        if (validKeys.length === 0) {
            // No valid keys in inventory, generate random ones
            const key1 = this.generateRandomKey(this.parent.pinCount);
            const key2 = this.generateRandomKey(this.parent.pinCount);
            const key3 = this.generateRandomKey(this.parent.pinCount);
            
            // Make the first key correct
            key1.cuts = this.parent.keyData.cuts;
            key1.id = correctKeyId || 'correct_key';
            key1.name = `Key ${Math.floor(Math.random() * 10000)}`;
            
            // Give other keys generic names too
            key2.name = `Key ${Math.floor(Math.random() * 10000)}`;
            key3.name = `Key ${Math.floor(Math.random() * 10000)}`;
            
            // Randomize the order
            const keys = [key1, key2, key3];
            this.parent.gameUtil.shuffleArray(keys);
            
            return this.createKeySelectionUI(keys, correctKeyId);
        }
        
        // Use inventory keys and randomize their order
        const shuffledKeys = [...validKeys];
        this.parent.gameUtil.shuffleArray(shuffledKeys);
        
        return this.createKeySelectionUI(shuffledKeys, correctKeyId);
    }

    createKeysForChallenge(correctKeyId = 'challenge_key') {
        // Create keys for challenge mode (like locksmith-forge.html)
        // Generates 3 keys with one guaranteed correct key
        
        const key1 = this.generateRandomKey(this.parent.pinCount);
        const key2 = this.generateRandomKey(this.parent.pinCount);
        const key3 = this.generateRandomKey(this.parent.pinCount);
        
        // Make the first key correct by copying the actual key cuts
        key1.cuts = this.parent.keyData.cuts;
        key1.id = correctKeyId;
        key1.name = `Key ${Math.floor(Math.random() * 10000)}`;
        
        // Give other keys generic names too
        key2.name = `Key ${Math.floor(Math.random() * 10000)}`;
        key3.name = `Key ${Math.floor(Math.random() * 10000)}`;
        
        // Randomize the order of keys
        const keys = [key1, key2, key3];
        this.parent.gameUtil.shuffleArray(keys);
        
        // Find the new index of the correct key after shuffling
        const correctKeyIndex = keys.findIndex(key => key.id === correctKeyId);
        
        return this.createKeySelectionUI(keys, correctKeyId);
    }


    // Example usage:
    // 
    // 1. For BreakEscape main game with inventory keys:
    // const playerKeys = [
    //     { id: 'office_key', cuts: [45, 67, 23, 89, 34], name: 'Office Key' },
    //     { id: 'basement_key', cuts: [12, 78, 56, 23, 90], name: 'Basement Key' },
    //     { id: 'shed_key', cuts: [67, 34, 89, 12, 45], name: 'Shed Key' }
    // ];
    // this.startWithKeySelection(playerKeys, 'office_key');
    //
    // 2. For challenge mode (like locksmith-forge.html):
    // this.startWithKeySelection(); // Generates 3 random keys, one correct
    //
    // 3. Skip starting key and go straight to selection:
    // const minigame = new LockpickingMinigamePhaser(container, {
    //     keyMode: true,
    //     skipStartingKey: true, // Don't create initial key
    //     lockId: 'office_door_lock'
    // });
    // minigame.startWithKeySelection(playerKeys, 'office_key');
    
    createKeySelectionUI(keys, correctKeyId = null) {
        // Create a UI for selecting between multiple keys
        // keys: array of key objects with id, cuts, and optional name properties
        // correctKeyId: ID of the correct key (if null, uses index 0 as fallback)
        // Shows 3 keys at a time with navigation buttons for more than 3 keys

        // Resolve Phaser scene (may not be ready yet if key selection runs before scene create())
        const scene = this.parent.scene || (this.parent.game && this.parent.game.scene && this.parent.game.scene.getScene('LockpickingScene'));
        if (!scene) {
            console.warn('Key selection: Phaser scene not ready, retrying in 50ms');
            setTimeout(() => this.createKeySelectionUI(keys, correctKeyId), 50);
            return;
        }
        
        // Find the correct key index in the original array
        let correctKeyIndex = 0;
        if (correctKeyId) {
            correctKeyIndex = keys.findIndex(key => key.id === correctKeyId);
            if (correctKeyIndex === -1) {
                correctKeyIndex = 0; // Fallback to first key if ID not found
            }
        }
        
        // Remove any existing key from the scene before showing selection UI
        if (this.parent.keyGroup) {
            this.parent.keyGroup.destroy();
            this.parent.keyGroup = null;
        }
        
        // Remove any existing click zone
        if (this.parent.keyClickZone) {
            this.parent.keyClickZone.destroy();
            this.parent.keyClickZone = null;
        }
        
        // Remove any existing input blocker
        if (this.parent.keySelectionInputBlocker) {
            this.parent.keySelectionInputBlocker.destroy();
            this.parent.keySelectionInputBlocker = null;
        }
        
        // Disable interactive on pins and tension wrench so they cannot be
        // accidentally triggered by clicks while the key selection UI is visible.
        // Phaser 3 depth sorting for input doesn't work reliably across containers.
        if (this.parent.pins) {
            this.parent.pins.forEach(pin => {
                if (pin.container) pin.container.disableInteractive();
            });
        }
        if (this.parent.tensionWrench) {
            this.parent.tensionWrench.disableInteractive();
        }
        
        // Reset pins to their original positions before showing key selection
        this.parent.lockConfig.resetPinsToOriginalPositions();
        
        // Layout constants
        const keyWidth = 140;
        const keyHeight = 80;
        const spacing = 20;
        const padding = 20;
        const labelHeight = 30; // Space for key label below each key
        const keysPerPage = 3; // Always show 3 keys at a time
        const buttonWidth = 30;
        const buttonHeight = 30;
        const buttonSpacing = 10; // Space between button and keys
        
        // Calculate container dimensions (always 3 keys wide + buttons on sides with minimal spacing)
        // For 3 keys: [button] padding [key1] spacing [key2] spacing [key3] padding [button]
        const keysWidth = (keysPerPage - 1) * (keyWidth + spacing) + keyWidth; // 3 keys with spacing between them
        const containerWidth = keysWidth + (keys.length > keysPerPage ? buttonWidth * 2 + buttonSpacing * 2 + padding * 2 : padding * 2);
        const containerHeight = keyHeight + labelHeight + spacing + padding + 10; // +50 for title
        
        // Create container for key selection - positioned in the middle but below pins
        const keySelectionContainer = scene.add.container(0, 230);
        keySelectionContainer.setDepth(1000); // High z-index to appear above everything
        
        // Add background - interactive to block clicks from reaching underlying scene objects
        const background = scene.add.graphics();
        background.fillStyle(0x000000, 0.8);
        background.fillRect(0, 0, containerWidth, containerHeight);
        background.lineStyle(2, 0xffffff);
        background.strokeRect(0, 0, containerWidth - 1, containerHeight - 1);
        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, containerWidth, containerHeight), Phaser.Geom.Rectangle.Contains);
        keySelectionContainer.add(background);
        
        // Add title - interactive to block clicks from reaching underlying scene objects
        const titleX = containerWidth / 2;
        const title = scene.add.text(titleX, 15, 'Select the correct key', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'VT323',
        });
        title.setOrigin(0.5, 0);
        title.setInteractive();
        keySelectionContainer.add(title);
        
        // Track current page
        let currentPage = 0;
        const totalPages = Math.ceil(keys.length / keysPerPage);
        
        // Create navigation buttons if more than 3 keys
        let prevButton = null;
        let nextButton = null;
        let prevText = null;
        let nextText = null;
        let pageIndicator = null;
        let itemsToRemoveNext = null; // Track items for cleanup
        
        // Create a function to render the current page of keys
        const renderKeyPage = () => {
            // Remove any existing key visuals and labels from the previous page
            const itemsToRemove = [];
            keySelectionContainer.list.forEach(item => {
                if (item !== background && item !== title && item !== prevButton && item !== nextButton && item !== pageIndicator && item !== prevText && item !== nextText) {
                    itemsToRemove.push(item);
                }
            });
            itemsToRemove.forEach(item => item.destroy());
            
            // Calculate which keys to show on this page
            const startIndex = currentPage * keysPerPage;
            const endIndex = Math.min(startIndex + keysPerPage, keys.length);
            const pageKeys = keys.slice(startIndex, endIndex);
            
            // Display keys for this page
            // Position: [button] buttonSpacing [keys] buttonSpacing [button]
            const keysStartX = (keys.length > keysPerPage ? buttonWidth + buttonSpacing : padding);
            const startX = keysStartX + padding / 2;
            const startY = 50;
            
            pageKeys.forEach((keyData, pageIndex) => {
                const actualIndex = startIndex + pageIndex;
                const keyX = startX + pageIndex * (keyWidth + spacing);
                const keyY = startY;
                
                // Create key visual representation
                const keyVisual = this.parent.keyOps.createKeyVisual(keyData, keyWidth, keyHeight);
                keyVisual.setPosition(keyX, keyY);
                keySelectionContainer.add(keyVisual);
                
                // Make key clickable
                keyVisual.setInteractive(new Phaser.Geom.Rectangle(0, 0, keyWidth, keyHeight), Phaser.Geom.Rectangle.Contains);
                keyVisual.on('pointerdown', () => {
                    // Close the popup and clear reference so selectKey doesn't double-destroy
                    keySelectionContainer.destroy();
                    this.parent.keySelectionContainer = null;
                    // Trigger key selection and insertion
                    this.parent.keyOps.selectKey(actualIndex, correctKeyIndex, keyData);
                });
                
                // Add key label (use name if available, otherwise use number)
                const keyName = keyData.name || `Key ${actualIndex + 1}`;
                const keyLabel = scene.add.text(keyX + keyWidth/2, keyY + keyHeight + 5, displayDashes(keyName), {
                    fontSize: '16px',
                    fill: '#ffffff',
                    fontFamily: 'VT323'
                });
                keyLabel.setOrigin(0.5, 0);
                keySelectionContainer.add(keyLabel);
            });
            
            // Update page indicator
            if (pageIndicator) {
                pageIndicator.setText(`${currentPage + 1}/${totalPages}`);
            }
            
            // Update button visibility
            if (prevButton) {
                if (currentPage > 0) {
                    prevButton.setVisible(true);
                    prevText.setVisible(true);
                } else {
                    prevButton.setVisible(false);
                    prevText.setVisible(false);
                }
            }
            
            if (nextButton) {
                if (currentPage < totalPages - 1) {
                    nextButton.setVisible(true);
                    nextText.setVisible(true);
                } else {
                    nextButton.setVisible(false);
                    nextText.setVisible(false);
                }
            }
        };
        
        if (keys.length > keysPerPage) {
            // Position buttons on the sides of the keys, vertically centered
            const keysAreaCenterY = 50 + (keyHeight + labelHeight) / 2;
            
            // Previous button (left side)
            prevButton = scene.add.graphics();
            prevButton.fillStyle(0x444444);
            prevButton.fillRect(0, 0, buttonWidth, buttonHeight);
            prevButton.lineStyle(2, 0xffffff);
            prevButton.strokeRect(0, 0, buttonWidth, buttonHeight);
            prevButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
            prevButton.on('pointerdown', () => {
                if (currentPage > 0) {
                    currentPage--;
                    renderKeyPage();
                }
            });
            prevButton.setPosition(padding / 2, keysAreaCenterY - buttonHeight / 2);
            prevButton.setDepth(1001);
            prevButton.setVisible(false); // Initially hidden
            keySelectionContainer.add(prevButton);
            
            // Previous button text
            prevText = scene.add.text(padding / 2 + buttonWidth / 2, keysAreaCenterY, '‹', {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'VT323'
            });
            prevText.setOrigin(0.5, 0.5);
            prevText.setDepth(1002);
            prevText.setVisible(false); // Initially hidden
            keySelectionContainer.add(prevText);
            
            // Next button (right side)
            nextButton = scene.add.graphics();
            nextButton.fillStyle(0x444444);
            nextButton.fillRect(0, 0, buttonWidth, buttonHeight);
            nextButton.lineStyle(2, 0xffffff);
            nextButton.strokeRect(0, 0, buttonWidth, buttonHeight);
            nextButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
            nextButton.on('pointerdown', () => {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    renderKeyPage();
                }
            });
            nextButton.setPosition(containerWidth - padding / 2 - buttonWidth, keysAreaCenterY - buttonHeight / 2);
            nextButton.setDepth(1001);
            nextButton.setVisible(false); // Initially hidden
            keySelectionContainer.add(nextButton);
            
            // Next button text
            nextText = scene.add.text(containerWidth - padding / 2 - buttonWidth / 2, keysAreaCenterY, '›', {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'VT323'
            });
            nextText.setOrigin(0.5, 0.5);
            nextText.setDepth(1002);
            nextText.setVisible(false); // Initially hidden
            keySelectionContainer.add(nextText);
            
            // Page indicator - centered below all keys
            pageIndicator = scene.add.text(containerWidth / 2, containerHeight - 20, `1/${totalPages}`, {
                fontSize: '12px',
                fill: '#888888',
                fontFamily: 'VT323'
            });
            pageIndicator.setOrigin(0.5, 0.5);
            keySelectionContainer.add(pageIndicator);
        }
        
        // Render the first page
        renderKeyPage();
        
        this.parent.keySelectionContainer = keySelectionContainer;
    }
    
}
