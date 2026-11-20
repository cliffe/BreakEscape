
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
/**
 * Caption for the "Switch to Lockpicking" button in key mode: a player who holds a
 * lockpick should see at once that picking the lock is an option. Text via
 * textContent; styled by .lockpicking-or-caption in lockpicking.css.
 */
export function createPickCaption(doc = document) {
    const caption = doc.createElement('span');
    caption.className = 'lockpicking-or-caption';
    caption.id = 'lockpicking-or-caption';
    caption.textContent = 'Or pick the lock:';
    return caption;
}

export class ToolManager {
    
    constructor(parent) {
        this.parent = parent;
    }

    // The mode-switch rows sit on their own line under the item image and name
    // (.lockpicking-mode-row in lockpicking.css). Built here so the first build and a
    // rebuild after a switch are the same markup.
    buildPickButtonRow() {
        const row = document.createElement('div');
        row.className = 'lockpicking-mode-row';
        const btn = document.createElement('button');
        btn.className = 'minigame-button';
        btn.id = 'lockpicking-switch-mode-btn';
        // The label is its own span so a short landscape window can show the icon alone
        // (lockpicking.css); aria-label and title keep the name for readers and hover
        btn.innerHTML = '<img src="/break_escape/assets/objects/lockpick.png" alt="" class="icon-large"> <span class="lockpicking-mode-label">Switch to Lockpicking</span>';
        this.labelModeButton(btn, 'Switch to Lockpicking');
        btn.onclick = () => this.switchToPickMode();
        this.applyDisabled(btn, !!(this.parent.keyInserting || this.parent.keyInsertTween || this.parent.keyUnlocked));
        row.appendChild(createPickCaption());
        row.appendChild(btn);
        return row;
    }

    buildKeyButtonRow() {
        const row = document.createElement('div');
        row.className = 'lockpicking-mode-row';
        const btn = document.createElement('button');
        btn.className = 'minigame-button';
        btn.id = 'lockpicking-switch-to-keys-btn';
        btn.innerHTML = '<img src="/break_escape/assets/objects/key.png" alt="" class="icon-large"> <span class="lockpicking-mode-label">Switch to Key Mode</span>';
        this.labelModeButton(btn, 'Switch to Key Mode');
        btn.onclick = () => this.switchToKeyMode();
        this.applyDisabled(btn, !!(this.parent.keyInserting || this.parent.keyInsertTween || this.parent.keyUnlocked));
        row.appendChild(btn);
        return row;
    }

    // The button's name for assistive tech and hover; applyDisabled puts it back on re-enable
    labelModeButton(btn, label) {
        btn.modeLabel = label;
        btn.title = label;
        if (typeof btn.setAttribute === 'function') btn.setAttribute('aria-label', label);
    }

    // Replace whatever mode row the strip holds with the given one (or none)
    replaceModeRow(build) {
        if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;
        const strip = document.querySelector('.lockpicking-item-section');
        if (!strip) return;
        strip.querySelectorAll('.lockpicking-mode-row').forEach((el) => el.remove());
        if (build) strip.appendChild(build());
    }

    // Disable (or re-enable) the mode-switch buttons. The real disabled attribute stops
    // clicks; lockpicking.css dims the label and changes the cursor so it is not only colour.
    setModeButtonsDisabled(disabled) {
        if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;
        const strip = document.querySelector('.lockpicking-item-section');
        if (!strip) return;
        let buttons;
        if (typeof strip.querySelectorAll === 'function') {
            const found = strip.querySelectorAll('.lockpicking-mode-row button');
            // Real DOM returns a NodeList; the test mock returns something else
            if (found && typeof found.length === 'number') buttons = Array.from(found);
        }
        if (!buttons) {
            buttons = [];
            for (const row of Array.from(strip.children || [])) {
                if (row.className !== 'lockpicking-mode-row') continue;
                for (const btn of Array.from(row.children || [])) {
                    if ((btn.tagName || btn.tag || '').toLowerCase() === 'button') buttons.push(btn);
                }
            }
        }
        buttons.forEach((btn) => this.applyDisabled(btn, disabled));
    }

    // The real disabled attribute plus a tooltip that says why (cleared again on re-enable)
    applyDisabled(btn, disabled) {
        btn.disabled = !!disabled;
        if (disabled) {
            btn.title = this.parent.keyUnlocked ? 'The lock is opening' : 'Not while a key is going in';
        } else if (btn.modeLabel) {
            btn.title = btn.modeLabel;
        } else if (typeof btn.removeAttribute === 'function') {
            btn.removeAttribute('title');
        } else {
            btn.title = '';
        }
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
        this.parent.lockLabels?.syncLeaders();
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

        // A key is still going in (the buttons are disabled, this is the defensive guard):
        // stop the insertion so no wrong-key or unlock result lands in pick mode
        if (this.parent.keyInserting || this.parent.keyInsertTween) {
            this.parent.scene?.tweens?.killTweensOf(this.parent.keyGroup);
            this.parent.keyInsertTween = null;
            this.parent.keyInserting = false;
        }

        // A correct key is already turning: the unlock is a key unlock
        if (this.parent.keyUnlocked) return;

        // An NPC watching catches the pick (same gate as the direct pick path);
        // the gate closes this minigame and opens the conversation.
        const gate = this.parent.params?.beforeSwitchToPickMode;
        if (typeof gate === 'function' && gate()) {
            return;
        }
        
        // Remove the pick button row (no empty flex gap left behind); offer the way back
        // to key mode when the player holds a key
        this.replaceModeRow(this.parent.canSwitchToKeyMode ? () => this.buildKeyButtonRow() : null);
        
        // Cancel a pending wrong-key retry or key insertion so neither can rebuild the key panel
        clearTimeout(this.parent.keyRetryTimer);
        this.parent.keyRetryTimer = null;
        clearTimeout(this.parent._keyInsertTimer);
        this.parent._keyInsertTimer = null;

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
        // After the first pin press the teaching labels stay hidden (LockLabels._hidden)
        if (this.parent.wrenchText && !this.parent.lockLabels?._hidden) {
            this.parent.wrenchText.setVisible(true);
        }
        if (this.parent.hookPickLabel && !this.parent.lockLabels?._hidden) {
            this.parent.hookPickLabel.setVisible(true);
        }
        this.parent.lockLabels?.syncLeaders();
        
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
        // After the first pin press the teaching labels stay hidden (LockLabels._hidden)
        if (this.parent.wrenchText && !this.parent.lockLabels?._hidden) {
            this.parent.wrenchText.setVisible(true);
        }
        if (this.parent.hookPickLabel && !this.parent.lockLabels?._hidden) {
            this.parent.hookPickLabel.setVisible(true);
        }
        this.parent.lockLabels?.syncLeaders();
    }

    switchToKeyMode() {
        // Switch from lockpicking mode to key selection mode
        console.log('Switching from lockpicking mode to key mode');
        
        if (this.parent.keyUnlocked) return;

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
        this.parent.lockLabels?.syncLeaders();
        
        // Reset pins to original positions
        this.parent.lockConfig.resetPinsToOriginalPositions();
        
        // Swap the key row for the pick row (can switch back to lockpicking if available)
        this.replaceModeRow(this.parent.canSwitchToPickMode ? () => this.buildPickButtonRow() : null);
        
        // Show key selection UI with available keys. createKeySelectionUI lives on the
        // KeySelection helper (parent.keySelection), not on the minigame. Pick-first
        // locks pass availableKeys; key-first locks store the converted list as
        // originalInventoryKeys (parent.inventoryKeys holds raw items, so it is not used).
        // requiredKeyId is null in production (the server filters it); it only picks the
        // highlighted entry and the log line, never the correctness gate.
        const keys = this.parent.availableKeys || this.parent.originalInventoryKeys;
        const requiredId = this.parent.requiredKeyId ?? this.parent.originalCorrectKeyId ?? null;
        if (keys && keys.length > 0 && this.parent.keySelection) {
            // Pick-first locks arrive with no key data and keys without a pinCount
            if (!this.parent.keyData) this.parent.keyDataGen.generateKeyDataFromPins();
            const normalised = keys.map(k => ({ ...k, pinCount: k.pinCount || k.cuts?.length || this.parent.pinCount }));
            this.parent.originalInventoryKeys ??= normalised;
            this.parent.originalCorrectKeyId ??= requiredId;
            this.parent.keySelection.createKeySelectionUI(normalised, requiredId);
            this.parent.keyInsertion.updateFeedback("Select a key to use");
        } else {
            this.parent.keyInsertion.updateFeedback("No keys available");
        }
    }
    
}
