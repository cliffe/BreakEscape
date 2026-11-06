
/**
 * ToolManager
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new ToolManager(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class ToolManager {
    
    constructor(parent) {
        this.parent = parent;
    }

    hideLockpickingTools() {
        // Hide tension wrench and hook pick in key mode
        if (this.parent.tensionWrench) {
            this.parent.tensionWrench.setVisible(false);
        }
        if (this.parent.hookGroup) {
            this.parent.hookGroup.setVisible(false);
        }
        
        // Hide labels
        if (this.parent.wrenchText) {
            this.parent.wrenchText.setVisible(false);
        }
        if (this.parent.hookPickLabel) {
            this.parent.hookPickLabel.setVisible(false);
        }
    }

    returnHookToStart() {
        if (!this.parent.hookGroup || !this.parent.hookConfig) return;
        
        const config = this.parent.hookConfig;
        
        console.log('Returning hook to starting position (no rotation)');
        
        // Get the current X position from the last targeted pin
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        const targetPinIndex = config.lastTargetedPin;
        const currentX = 100 + margin + targetPinIndex * pinSpacing; // Last targeted pin's X position
        
        // Calculate the tip position for the current pin
        const totalHookHeight = (config.diagonalSegments + config.verticalSegments) * config.segmentStep;
        const tipX = currentX - totalHookHeight + 48; // Add 48px offset (24px + 24px further right)
        
        // Calculate resting Y position (a few pixels lower than original)
        const restingY = config.hookStartY - 24; // 24px lower than original position (was 15px)
        
        // Reset position and rotation
        this.parent.hookGroup.x = tipX;
        this.parent.hookGroup.y = restingY;
        this.parent.hookGroup.setAngle(0);
        
        // Clear debug graphics when hook returns to start
        if (this.parent.debugGraphics) {
            this.parent.debugGraphics.clear();
        }
    }

    start() {
        super.start();
        this.parent.gameState.isActive = true;
        this.parent.lockState.tensionApplied = false;
        this.parent.lockState.pinsSet = 0;
        this.parent.updateProgress(0, this.parent.pinCount);
    }

    cleanup() {
        if (this.parent.game) {
            this.parent.game.destroy(true);
            this.parent.game = null;
        }
        super.cleanup();
    }

    flashWrenchRed() {
        // Flash the tension wrench red to indicate tension is needed
        if (!this.parent.wrenchGraphics) return;
        
        const originalFillStyle = this.parent.lockState.tensionApplied ? 0x00ff00 : 0x888888;
        
        // Store original state
        const originalClear = this.parent.wrenchGraphics.clear.bind(this.parent.wrenchGraphics);
        
        // Flash red 3 times
        for (let i = 0; i < 3; i++) {
            this.parent.scene.time.delayedCall(i * 150, () => {
                this.parent.wrenchGraphics.clear();
                this.parent.wrenchGraphics.fillStyle(0xff0000); // Red
                
                // Long vertical arm
                this.parent.wrenchGraphics.fillRect(0, -120, 10, 170);
                // Short horizontal arm
                this.parent.wrenchGraphics.fillRect(0, 40, 37.5, 10);
            });
            
            this.parent.scene.time.delayedCall(i * 150 + 75, () => {
                this.parent.wrenchGraphics.clear();
                this.parent.wrenchGraphics.fillStyle(originalFillStyle); // Back to original color
                
                // Long vertical arm
                this.parent.wrenchGraphics.fillRect(0, -120, 10, 170);
                // Short horizontal arm
                this.parent.wrenchGraphics.fillRect(0, 40, 37.5, 10);
            });
        }
    }

    switchToPickMode() {
        // Switch from key selection mode to lockpicking mode
        console.log('Switching from key mode to lockpicking mode');

        // An NPC watching catches the pick (same gate as the direct pick path);
        // the gate closes this minigame and opens the conversation.
        const gate = this.parent.params?.beforeSwitchToPickMode;
        if (typeof gate === 'function' && gate()) {
            return;
        }
        
        // Hide the mode switch button
        const switchBtn = document.getElementById('lockpicking-switch-mode-btn');
        if (switchBtn) {
            switchBtn.style.display = 'none';
        }
        
        // Exit key mode
        this.parent.keyMode = false;
        this.parent.keySelectionMode = false;
        
        // Clean up key selection UI if visible
        if (this.parent.keySelectionContainer) {
            this.parent.keySelectionContainer.destroy();
            this.parent.keySelectionContainer = null;
        }
        
        // Remove the input blocker if present
        if (this.parent.keySelectionInputBlocker) {
            this.parent.keySelectionInputBlocker.destroy();
            this.parent.keySelectionInputBlocker = null;
        }
        
        // Clean up any key visuals
        if (this.parent.keyGroup) {
            this.parent.keyGroup.destroy();
            this.parent.keyGroup = null;
        }
        if (this.parent.keyClickZone) {
            this.parent.keyClickZone.destroy();
            this.parent.keyClickZone = null;
        }
        
        // Show lockpicking tools and re-enable their interactivity
        // (pins and wrench may have been disabled during key selection UI display)
        if (this.parent.tensionWrench) {
            this.parent.tensionWrench.setVisible(true);
            this.parent.tensionWrench.setInteractive(
                new Phaser.Geom.Rectangle(-12.5, -138.75, 60, 268.75),
                Phaser.Geom.Rectangle.Contains
            );
        }
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
        if (this.parent.hookGroup) {
            this.parent.hookGroup.setVisible(true);
        }
        if (this.parent.wrenchText) {
            this.parent.wrenchText.setVisible(true);
        }
        if (this.parent.hookPickLabel) {
            this.parent.hookPickLabel.setVisible(true);
        }
        
        // Reset pins to original positions
        this.parent.lockConfig.resetPinsToOriginalPositions();
        
        // Update feedback
        this.parent.keyInsertion.updateFeedback("Lockpicking mode - Apply tension first, then lift pins in binding order");
    }

    showLockpickingTools() {
        // Show tension wrench and hook pick in lockpicking mode
        if (this.parent.tensionWrench) {
            this.parent.tensionWrench.setVisible(true);
        }
        if (this.parent.hookGroup) {
            this.parent.hookGroup.setVisible(true);
        }
        
        // Show labels
        if (this.parent.wrenchText) {
            this.parent.wrenchText.setVisible(true);
        }
        if (this.parent.hookPickLabel) {
            this.parent.hookPickLabel.setVisible(true);
        }
    }

    switchToKeyMode() {
        // Switch from lockpicking mode to key selection mode
        console.log('Switching from lockpicking mode to key mode');
        
        // Hide the mode switch button
        const switchBtn = document.getElementById('lockpicking-switch-to-keys-btn');
        if (switchBtn) {
            switchBtn.style.display = 'none';
        }
        
        // Enter key mode
        this.parent.keyMode = true;
        this.parent.keySelectionMode = true;
        
        // Hide lockpicking tools
        if (this.parent.tensionWrench) {
            this.parent.tensionWrench.setVisible(false);
        }
        if (this.parent.hookGroup) {
            this.parent.hookGroup.setVisible(false);
        }
        if (this.parent.wrenchText) {
            this.parent.wrenchText.setVisible(false);
        }
        if (this.parent.hookPickLabel) {
            this.parent.hookPickLabel.setVisible(false);
        }
        
        // Reset pins to original positions
        this.parent.lockConfig.resetPinsToOriginalPositions();
        
        // Add mode switch back button (can switch back to lockpicking if available)
        if (this.parent.canSwitchToPickMode) {
            const itemDisplayDiv = document.querySelector('.lockpicking-item-section');
            if (itemDisplayDiv) {
                // Remove any existing button container
                const existingButtonContainer = itemDisplayDiv.querySelector('div[style*="margin-top"]');
                if (existingButtonContainer) {
                    existingButtonContainer.remove();
                }
                
                // Add new button container
                const buttonContainer = document.createElement('div');
                buttonContainer.style.cssText = `
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                    justify-content: center;
                `;
                
                const switchModeBtn = document.createElement('button');
                switchModeBtn.className = 'minigame-button';
                switchModeBtn.id = 'lockpicking-switch-mode-btn';
                switchModeBtn.innerHTML = '<img src="/break_escape/assets/objects/lockpick.png" alt="Lockpick" class="icon-large"> Switch to Lockpicking';
                switchModeBtn.onclick = () => this.switchToPickMode();
                
                buttonContainer.appendChild(switchModeBtn);
                itemDisplayDiv.appendChild(buttonContainer);
            }
        }
        
        // Show key selection UI with available keys
        if (this.parent.availableKeys && this.parent.availableKeys.length > 0) {
            this.parent.createKeySelectionUI(this.parent.availableKeys, this.parent.requiredKeyId);
            this.parent.keyInsertion.updateFeedback("Select a key to use");
        } else {
            this.parent.keyInsertion.updateFeedback("No keys available");
        }
    }
    
}
