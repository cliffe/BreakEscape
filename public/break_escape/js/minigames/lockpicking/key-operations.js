
/**
 * KeyOperations
 * 
 * Extracted from lockpicking-game-phaser.js
 * Includes key creation, insertion, correctness checking, and visual feedback
 * Instantiate with: new KeyOperations(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeyOperations {
    
    constructor(parent) {
        this.parent = parent;
    }

    createKey() {
        if (!this.parent.keyMode) return;
        
        // Generate key data from actual pin heights if not provided
        if (!this.parent.keyData) {
            this.parent.keyDataGen.generateKeyDataFromPins();
        }

        // Key dimensions - make keyway higher so key pins align at shear line
        const keywayWidth = 400; // Width of the keyway
        const keywayHeight = 120; // Increased height to accommodate key cuts
        const keywayStartX = 100; // Left edge of keyway
        const keywayStartY = 170; // Moved higher (was 200) so key pins align at shear line
        
        // Key parts dimensions
        const keyCircleRadius = 140; // Circle (handle) - 2x larger (was 15)
        const keyShoulderWidth = 20; // Shoulder width (short)
        const keyShoulderHeight = keywayHeight + 10; // Slightly taller than keyway
        const keyBladeWidth = keywayWidth + 20; // Blade length (reaches end of keyway)
        const keyBladeHeight = keywayHeight - 10; // Slightly smaller than keyway
        
        // Key starting position (just outside the keyway to the LEFT) - ready to be inserted
        // Account for full key length: circle + shoulder + blade
        const fullKeyLength = keyCircleRadius * 2 + keyShoulderWidth + keyBladeWidth;
        const keyStartX = keywayStartX - fullKeyLength + 20; // Just the blade tip visible at keyway entrance
        const keyStartY = keywayStartY + keywayHeight / 2; // Centered in keyway
        
        // Create key container
        this.parent.keyGroup = this.parent.scene.add.container(keyStartX, keyStartY);
        
        // Create render texture for the key - make it wider to accommodate the full circle
        const renderTextureWidth = Math.max(fullKeyLength, keyCircleRadius * 2 + 50); // Ensure enough space for circle
        this.parent.keyRenderTexture = this.parent.scene.add.renderTexture(0, 0, renderTextureWidth, keyShoulderHeight);
        this.parent.keyRenderTexture.setOrigin(0, 0.5);
        
        // Draw the key using render texture
        this.parent.keyDraw.drawKeyWithRenderTexture(keyCircleRadius, keyShoulderWidth, keyShoulderHeight, keyBladeWidth, keyBladeHeight, fullKeyLength);
        
        this.parent.keyGroup.add(this.parent.keyRenderTexture);
        
        // Set key graphics to low z-index so it appears behind pins
        this.parent.keyGroup.setDepth(1); // Set low z-index so key appears behind pins
        
        // Create click zone covering the entire keyway area in key mode
        // Position click zone to cover the entire keyway from left edge to right edge
        const keywayClickWidth = 400; // Full keyway width
        const keywayClickHeight = 120; // Full keyway height
        const clickZone = this.parent.scene.add.rectangle(0, 0, 
            keywayClickWidth, keywayClickHeight, 0x000000, 0);
        clickZone.setDepth(9999); // Very high z-index for clickability
        clickZone.setInteractive();
        
        // Position click zone to cover the entire keyway area (not relative to key group)
        clickZone.x = 100; // Keyway start X
        clickZone.y = 170 + keywayClickHeight/2; // Keyway center Y
        this.parent.keyClickZone = clickZone;
        
        // Add click handler for key insertion
        clickZone.on('pointerdown', () => {
            if (!this.parent.keyInserting) {
                // Hide labels on first key click (similar to pin clicks)
                if (!this.parent.pinClicked) {
                    this.parent.pinClicked = true;
                }
                this.startKeyInsertion();
            }
        });
        
        console.log('Key click zone created:', { 
            width: keywayClickWidth, 
            height: keyShoulderHeight,
            position: '0,0 relative to key group'
        });
        
        // Store key configuration
        this.parent.keyConfig = {
            startX: keyStartX,
            startY: keyStartY,
            circleRadius: keyCircleRadius,
            shoulderWidth: keyShoulderWidth,
            shoulderHeight: keyShoulderHeight,
            bladeWidth: keyBladeWidth,
            bladeHeight: keyBladeHeight,
            keywayStartX: keywayStartX,
            keywayStartY: keywayStartY,
            keywayWidth: keywayWidth,
            keywayHeight: keywayHeight
        };
        
        // Create collision rectangles for the key blade surface (after config is set)
        this.createKeyBladeCollision();
        
        console.log('Key created with config:', this.parent.keyConfig);
    }

    startKeyInsertion() {
        console.log('startKeyInsertion called with:', { 
            hasKeyGroup: !!this.parent.keyGroup, 
            hasKeyConfig: !!this.parent.keyConfig, 
            keyInserting: this.parent.keyInserting 
        });
        
        if (!this.parent.keyGroup || !this.parent.keyConfig || this.parent.keyInserting) {
            console.log('startKeyInsertion early return - missing requirements');
            return;
        }
        
        console.log('Starting key insertion animation...');
        this.parent.keyInserting = true;
        this.parent.keyInsertion.updateFeedback("Inserting key...");
        
        // Play key insertion sound
        if (this.parent.sounds && this.parent.sounds.keyUnlock) {
            this.parent.sounds.keyUnlock.play();
        }
        
        // Calculate target position - key should be fully inserted
        const targetX = this.parent.keyConfig.keywayStartX - this.parent.keyConfig.shoulderWidth;
        const startX = this.parent.keyGroup.x;
        
        // Calculate fully inserted position - move key so it's completely inside the keyway
        const keywayLeftEdge = this.parent.keyConfig.keywayStartX; // 100px
        const shoulderRightEdge = this.parent.keyConfig.circleRadius * 1.9 + this.parent.keyConfig.shoulderWidth; // 266 + 20 = 286px from key group center
        const fullyInsertedX = keywayLeftEdge - shoulderRightEdge; // 100 - 286 = -186px
        
        // Create smooth animation from left to right
        this.parent.scene.tweens.add({
            targets: this.parent.keyGroup,
            x: fullyInsertedX,
            duration: 4000, // 4 seconds for slower insertion
            ease: 'Cubic.easeInOut',
            onUpdate: (tween) => {
                // Calculate progress (0 to 1) - key moves from left to right
                const progress = (this.parent.keyGroup.x - startX) / (fullyInsertedX - startX);
                this.parent.keyInsertionProgress = Math.max(0, Math.min(1, progress));
                
                console.log('Animation update - key position:', this.parent.keyGroup.x, 'progress:', this.parent.keyInsertionProgress);
                
                // Update pin positions based on key cuts as the key is inserted
                this.parent.keyInsertion.updatePinsWithKeyInsertion(this.parent.keyInsertionProgress);
            },
            onComplete: () => {
                this.parent.keyInserting = false;
                this.parent.keyInsertionProgress = 1.0; // Fully inserted
                
                // Snap pins to exact final positions based on key cut dimensions
                this.parent.keyAnim.snapPinsToExactPositions();
                
                this.checkKeyCorrectness();
            }
        });
    }

    checkKeyCorrectness() {
        if (!this.parent.keyData || !this.parent.keyData.cuts) return;
        
        // Check if the selected key matches the correct key
        let isCorrect = false;
        
        if (this.parent.selectedKeyData && this.parent.selectedKeyData.cuts) {
            // Compare the selected key cuts with the original correct key cuts
            const selectedCuts = this.parent.selectedKeyData.cuts;
            const correctCuts = this.parent.keyData.cuts;
            
            if (selectedCuts.length === correctCuts.length) {
                isCorrect = true;
                for (let i = 0; i < selectedCuts.length; i++) {
                    if (Math.abs(selectedCuts[i] - correctCuts[i]) > 5) { // Allow small tolerance
                isCorrect = false;
                        break;
                    }
                }
            }
        }
        
        console.log('Key correctness check:', {
            selectedKey: this.parent.selectedKeyData ? this.parent.selectedKeyData.cuts : 'none',
            correctKey: this.parent.keyData.cuts,
            isCorrect: isCorrect
        });
        
        if (isCorrect) {
            // Key is correct - all pins are aligned at the shear line
            this.parent.keyInsertion.updateFeedback("Key fits perfectly! Lock unlocked.");
            
                    // Start the rotation animation for correct key
        this.parent.scene.time.delayedCall(500, () => {
            this.parent.keyAnim.startKeyRotationAnimationWithChamberHoles();
        });
            
            // Complete the minigame after rotation animation
            setTimeout(() => {
                this.parent.complete(true);
            }, 3000); // Longer delay to allow rotation animation to complete
        } else {
            // Key is wrong - show red flash and then pop up key selection again
            this.parent.keyInsertion.updateFeedback("Wrong key! The lock won't turn.");
            
            // Play wrong sound
            if (this.parent.sounds.wrong) {
                this.parent.sounds.wrong.play();
            }
            
            // Flash the entire lock red
            this.flashLockRed();
            
            // Reset key position and show key selection again after a delay
            setTimeout(() => {
                this.parent.keyInsertion.updateKeyPosition(0);
                // Show key selection again
                if (this.parent.keySelectionMode) {
                    // For main game, go back to original key selection interface
                    // For challenge mode (locksmith-forge.html), use the training interface
                    if (this.parent.params?.lockable?.id === 'progressive-challenge') {
                        // This is the locksmith-forge.html challenge mode
                        this.parent.keySelection.createKeysForChallenge('correct_key');
                    } else {
                        // This is the main game - go back to key selection with original inventory keys
                        this.parent.startWithKeySelection(this.parent.originalInventoryKeys, this.parent.originalCorrectKeyId);
                    }
                }
            }, 2000); // Longer delay to show the red flash
        }
    }

    createKeyVisual(keyData, width, height) {
        // Create a visual representation of a key for the selection UI by building the actual key and scaling it down
        const keyContainer = this.parent.scene.add.container(0, 0);
        
        // Save the original key data and pin count before temporarily changing them
        const originalKeyData = this.parent.keyData;
        const originalPinCount = this.parent.pinCount;
        
        // Temporarily set the key data and pin count to create this specific key
        this.parent.keyData = keyData;
        this.parent.pinCount = keyData.pinCount || 5;
        
        // Create the key with this specific key data
        this.createKey();
        
        // createKey() always creates an interactive keyClickZone covering the keyway area.
        // For visual-only usage here we must destroy it immediately to prevent phantom
        // click zones accumulating under the key selection UI.
        if (this.parent.keyClickZone) {
            this.parent.keyClickZone.destroy();
            this.parent.keyClickZone = null;
        }
        
        // Get the key group and scale it down
        const keyGroup = this.parent.keyGroup;
        if (keyGroup) {
            // Calculate scale to fit within the selection area
            const maxWidth = width - 20; // Leave 10px margin on each side
            const maxHeight = height - 20;
            
            // Get the key's current dimensions
            const keyBounds = keyGroup.getBounds();
            const keyWidth = keyBounds.width;
            const keyHeight = keyBounds.height;
            
            // Calculate scale
            const scaleX = maxWidth / keyWidth;
            const scaleY = maxHeight / keyHeight;
            const scale = Math.min(scaleX, scaleY) * 0.9; // Use 90% to leave some margin
            
            // Scale the key group
            keyGroup.setScale(scale);
            
            // Center the key in the selection area
            const scaledWidth = keyWidth * scale;
            const scaledHeight = keyHeight * scale;
            const offsetX = (width - scaledWidth) / 2;
            const offsetY = (height - scaledHeight) / 2;
            
            // Position the key
            keyGroup.setPosition(offsetX, offsetY);
            
            // Add the key group to the container
            keyContainer.add(keyGroup);
        }
        
        // Restore the original key data and pin count
        this.parent.keyData = originalKeyData;
        this.parent.pinCount = originalPinCount;
        
        return keyContainer;
    }

    selectKey(selectedIndex, correctIndex, keyData) {
        // Handle key selection from the UI
        console.log(`Key ${selectedIndex + 1} selected (correct: ${correctIndex + 1})`);
        
        // Close the popup immediately
        if (this.parent.keySelectionContainer) {
            this.parent.keySelectionContainer.destroy();
        }
        
        // Remove the input blocker (legacy - may not exist)
        if (this.parent.keySelectionInputBlocker) {
            this.parent.keySelectionInputBlocker.destroy();
            this.parent.keySelectionInputBlocker = null;
        }
        
        // Re-enable interactive on pins and tension wrench that were disabled during key selection
        // (they will be recreated/setup during key insertion, but re-enable as a safety measure)
        if (this.parent.pins) {
            this.parent.pins.forEach(pin => {
                if (pin.container) {
                    pin.container.setInteractive(
                        new Phaser.Geom.Rectangle(-18.75, -110, 37.5, 230),
                        Phaser.Geom.Rectangle.Contains
                    );
                }
            });
        }
        if (this.parent.tensionWrench) {
            this.parent.tensionWrench.setInteractive(
                new Phaser.Geom.Rectangle(-12.5, -138.75, 60, 268.75),
                Phaser.Geom.Rectangle.Contains
            );
        }
        
        // Remove any existing key from the scene
        if (this.parent.keyGroup) {
            this.parent.keyGroup.destroy();
            this.parent.keyGroup = null;
        }
        
        // Remove any existing click zone
        if (this.parent.keyClickZone) {
            this.parent.keyClickZone.destroy();
            this.parent.keyClickZone = null;
        }
        
        // Reset pins to their original positions before creating the new key
        this.parent.lockConfig.resetPinsToOriginalPositions();
        
        // Store the original correct key data (this determines if the key is correct)
        const originalKeyData = this.parent.keyData;
        
        // Store the selected key data for visual purposes
        this.parent.selectedKeyData = keyData;
        
        // Create the visual key with the selected key data
        this.parent.keyData = keyData;
        this.parent.pinCount = keyData.pinCount;
        this.createKey();
        
        // Restore the original key data for correctness checking
        this.parent.keyData = originalKeyData;
        
        // Update feedback - don't reveal if correct/wrong yet
        this.parent.keyInsertion.updateFeedback("Key selected! Inserting into lock...");
        
        // Automatically trigger key insertion after a short delay
        setTimeout(() => {
            this.startKeyInsertion();
        }, 300); // Small delay to let the key appear first
        
        // Update feedback if available
        if (this.parent.selectKeyCallback) {
            this.parent.selectKeyCallback(selectedIndex, correctIndex, keyData);
        }
    }

    showWrongKeyFeedback() {
        // Show visual feedback for wrong key selection
        const feedback = this.parent.scene.add.graphics();
        feedback.fillStyle(0xff0000, 0.3);
        feedback.fillRect(0, 0, 800, 600);
        feedback.setDepth(9999);
        
        // Remove feedback after a short delay
        this.parent.scene.time.delayedCall(500, () => {
            feedback.destroy();
        });
    }

    flashLockRed() {
        // Flash the entire lock area red to indicate wrong key
        const flash = this.parent.scene.add.graphics();
        flash.fillStyle(0xff0000, 0.4); // Red with 40% opacity
        flash.fillRect(100, 50, 400, 300); // Cover the entire lock area
        flash.setDepth(9998); // High z-index but below other UI elements
        
        // Remove flash after a short delay
        this.parent.scene.time.delayedCall(800, () => {
            flash.destroy();
        });
    }

    createKeyBladeCollision() {
        if (!this.parent.keyData || !this.parent.keyData.cuts || !this.parent.keyConfig) return;
        
        // Create collision rectangles for each section of the key blade
        this.parent.keyCollisionRects = [];
        
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        const bladeStartX = this.parent.keyConfig.circleRadius * 2 + this.parent.keyConfig.shoulderWidth;
        
        console.log('Creating key collision rectangles, bladeStartX:', bladeStartX);
        
        // Create collision rectangles for each pin position
        for (let i = 0; i < this.parent.pinCount; i++) {
            const cutDepth = this.parent.keyData.cuts[i] || 50;
            const bladeHeight = this.parent.keyConfig.bladeHeight;
            
            // The cut depth directly represents how deep the divot is
            // Small pin = small cut, Large pin = large cut
            const cutHeight = (bladeHeight / 2) * (cutDepth / 100);
            const surfaceHeight = bladeHeight - cutHeight;
            
            // Calculate pin position in the lock
            const pinX = 100 + margin + i * pinSpacing;
            
            // Create collision rectangle for this section - position relative to blade start
            const rect = {
                x: pinX - 100, // Position relative to blade start (not absolute)
                y: -bladeHeight/2 + cutHeight, // Position relative to key center
                width: 24, // Pin width
                height: surfaceHeight,
                cutDepth: cutDepth
            };
            
            console.log(`Key collision rect ${i}: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
            this.parent.keyCollisionRects.push(rect);
        }
    }

    getKeySurfaceHeightAtPosition(pinX, keyBladeStartX) {
        if (!this.parent.keyCollisionRects || !this.parent.keyConfig) return this.parent.keyConfig ? this.parent.keyConfig.bladeHeight : 0;
        
        // Find the collision rectangle for this pin position
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        
        for (let i = 0; i < this.parent.pinCount; i++) {
            const cutPinX = 100 + margin + i * pinSpacing;
            if (Math.abs(pinX - cutPinX) < 12) { // Within pin width
                return this.parent.keyCollisionRects[i].height;
            }
        }
        
        // If no cut found, return full blade height
        return this.parent.keyConfig.bladeHeight;
    }
    
}
