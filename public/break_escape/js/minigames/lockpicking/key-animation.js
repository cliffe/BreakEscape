
/**
 * KeyAnimation
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeyAnimation(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeyAnimation {
    
    constructor(parent) {
        this.parent = parent;
    }

    snapPinsToExactPositions() {
        // Use selected key data for visual positioning, but original key data for correctness
        const keyDataToUse = this.parent.selectedKeyData || this.parent.keyData;
        if (!keyDataToUse || !keyDataToUse.cuts) return;
        
        console.log('Snapping pins to exact positions based on key cuts for shear line alignment');
        
        // Ensure key data matches lock pin count
        if (keyDataToUse.cuts.length !== this.parent.pinCount) {
            console.warn(`Key has ${keyDataToUse.cuts.length} cuts but lock has ${this.parent.pinCount} pins. Adjusting key data.`);
            // Truncate or pad cuts to match pin count
            if (keyDataToUse.cuts.length > this.parent.pinCount) {
                keyDataToUse.cuts = keyDataToUse.cuts.slice(0, this.parent.pinCount);
            } else {
                // Pad with default cuts if key has fewer cuts than lock has pins
                while (keyDataToUse.cuts.length < this.parent.pinCount) {
                    keyDataToUse.cuts.push(40); // Default cut depth
                }
            }
        }
        
        // Set each pin to the exact final position based on key cut dimensions
        keyDataToUse.cuts.forEach((cutDepth, index) => {
            if (index >= this.parent.pinCount) {
                console.warn(`Key has ${keyDataToUse.cuts.length} cuts but lock only has ${this.parent.pinCount} pins. Skipping cut ${index}.`);
                return;
            }
            
            const pin = this.parent.pins[index];
            if (!pin) {
                console.error(`Pin at index ${index} is undefined. Available pins: ${this.parent.pins.length}`);
                return;
            }
            
            // Calculate the exact position where the pin should rest on the key cut
            // The cut depth represents how deep the cut is from the blade top
            // We need to position the pin so its bottom rests exactly on the cut surface
            
            // Key blade dimensions
            const bladeHeight = this.parent.keyConfig.bladeHeight;
            const keyBladeBaseY = this.parent.keyGroup.y - bladeHeight / 2;
            
            // Calculate the Y position of the cut surface
            const cutSurfaceY = keyBladeBaseY + cutDepth;
            
            // Calculate where the pin bottom should be to rest on the cut surface
            // Add safety check for undefined properties
            if (!pin.driverPinLength || !pin.keyPinLength) {
                console.warn(`Pin ${pin.index} missing length properties:`, pin);
                return; // Skip this pin if properties are missing
            }
            const pinRestY = 200 - 50 + pin.driverPinLength + pin.keyPinLength; // Pin rest position
            const targetKeyPinBottom = cutSurfaceY;
            
            // Calculate the exact lift needed to move pin bottom from rest to cut surface
            const exactLift = pinRestY - targetKeyPinBottom;
            
            // Snap to exact position
            pin.currentHeight = Math.max(0, exactLift);
            
            // Update pin visuals immediately
            this.parent.pinVisuals.updatePinVisuals(pin);
            
            console.log(`Pin ${index}: cutDepth=${cutDepth}, cutSurfaceY=${cutSurfaceY}, exactLift=${exactLift}, currentHeight=${pin.currentHeight}, keyBladeBaseY=${keyBladeBaseY}, bladeHeight=${bladeHeight}`);
        });
        
        // Note: Rotation animation will be triggered by checkKeyCorrectness() only if key is correct
    }

    startKeyRotationAnimationWithChamberHoles() {
        // Animation configuration variables - same as lockpicking success
        const KEY_PIN_TOP_SHRINK = 10; // How much the key pin top moves down
        const KEY_PIN_BOTTOM_SHRINK = 5; // How much the key pin bottom moves up
        const KEY_PIN_TOTAL_SHRINK = KEY_PIN_TOP_SHRINK + KEY_PIN_BOTTOM_SHRINK; // Total key pin shrink
        const CHANNEL_MOVEMENT = 25; // How much channels move down
        const KEYWAY_SHRINK = 20; // How much keyway shrinks
        const KEY_SHRINK_FACTOR = 0.7; // How much the key shrinks on Y axis to simulate rotation
        
        // Play success sound
        if (this.parent.sounds.success) {
            this.parent.sounds.success.play();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }
        }
        
        this.parent.keyInsertion.updateFeedback("Key inserted successfully! Lock turning...");

        // Create upper edge effect - a copy of the entire key group that stays in place
        // Position at the key's current position (after insertion, before rotation)
        const upperEdgeKeyGroup = this.parent.scene.add.container(this.parent.keyGroup.x, this.parent.keyGroup.y);
        upperEdgeKeyGroup.setDepth(0); // Behind the original key
        
        // Copy the handle (circle)
        const upperEdgeHandle = this.parent.scene.add.graphics();
        upperEdgeHandle.fillStyle(0xaaaaaa); // Slightly darker tone for the upper edge
        upperEdgeHandle.fillCircle(this.parent.keyConfig.circleRadius, 0, this.parent.keyConfig.circleRadius);
        upperEdgeKeyGroup.add(upperEdgeHandle);
        
        // Copy the shoulder and blade using render texture
        const upperEdgeRenderTexture = this.parent.scene.add.renderTexture(0, 0, this.parent.keyRenderTexture.width, this.parent.keyRenderTexture.height);
        upperEdgeRenderTexture.setTint(0xaaaaaa); // Apply darker tone
        upperEdgeRenderTexture.setOrigin(0, 0.5); // Match the original key's origin
        upperEdgeKeyGroup.add(upperEdgeRenderTexture);
        
        // Draw the shoulder and blade to the upper edge render texture
        const upperEdgeGraphics = this.parent.scene.add.graphics();
        upperEdgeGraphics.fillStyle(0xaaaaaa); // Slightly darker tone
        
        // Draw shoulder
        const shoulderX = this.parent.keyConfig.circleRadius * 1.9;
        upperEdgeGraphics.fillRect(shoulderX, 0, this.parent.keyConfig.shoulderWidth, this.parent.keyConfig.shoulderHeight);
        
        // Draw blade - adjust Y position to account for container offset
        const bladeX = shoulderX + this.parent.keyConfig.shoulderWidth;
        const bladeY = this.parent.keyConfig.shoulderHeight/2 - this.parent.keyConfig.bladeHeight/2;
        this.parent.keyDraw.drawKeyBladeAsSolidShape(upperEdgeGraphics, bladeX, bladeY, this.parent.keyConfig.bladeWidth, this.parent.keyConfig.bladeHeight);
        
        upperEdgeRenderTexture.draw(upperEdgeGraphics);
        upperEdgeGraphics.destroy();
        
        // Initially hide the upper edge
        upperEdgeKeyGroup.setVisible(false);
        
        // Animate key shrinking on Y axis to simulate rotation
        this.parent.scene.tweens.add({
            targets: this.parent.keyGroup,
            scaleY: KEY_SHRINK_FACTOR,
            duration: 1400,
            ease: 'Cubic.easeInOut',
            onStart: () => {
                // Show the upper edge when rotation starts
                upperEdgeKeyGroup.setVisible(true);
            }
        });
        
        // Animate the upper edge copy to shrink and move upward (keeping top edge in place)
        this.parent.scene.tweens.add({
            targets: upperEdgeKeyGroup,
            scaleY: KEY_SHRINK_FACTOR,
            y: upperEdgeKeyGroup.y - 6, // Simple upward movement
            duration: 1400,
            ease: 'Cubic.easeInOut'
        });

        // Shrink key pins downward and add half circles to simulate cylinder rotation
        this.parent.pins.forEach(pin => {
            // Hide all highlights
            if (pin.shearHighlight) pin.shearHighlight.setVisible(false);
            if (pin.setHighlight) pin.setHighlight.setVisible(false);
            if (pin.bindingHighlight) pin.bindingHighlight.setVisible(false);
            if (pin.overpickedHighlight) pin.overpickedHighlight.setVisible(false);
            if (pin.failureHighlight) pin.failureHighlight.setVisible(false);
            
            // Create chamber hole circle that expands at the actual chamber position
            const chamberCircle = this.parent.scene.add.graphics();
            chamberCircle.fillStyle(0x666666); // Dark gray color for chamber holes
            chamberCircle.x = pin.x; // Center horizontally on the pin
            
            // Position at actual chamber hole location (shear line)
            const chamberY = pin.y + (-45); // Shear line position
            chamberCircle.y = chamberY;
            chamberCircle.setDepth(5); // Above all other elements
            
            // Create a temporary object to hold the circle expansion data
            const circleData = { 
                width: 24, // Start full width (same as key pin)
                height: 2, // Start very thin (flat top)
                y: chamberY
            };
            
            // Animate the chamber hole circle expanding to full circle (stays at chamber position)
            this.parent.scene.tweens.add({
                targets: circleData,
                width: 24, // Full circle width (stays same)
                height: 16, // Full circle height (expands from 2 to 16)
                y: chamberY, // Stay at the chamber position (no movement)
                duration: 1400,
                ease: 'Cubic.easeInOut',
                onUpdate: function() {
                    chamberCircle.clear();
                    chamberCircle.fillStyle(0xff0000); // Light red for chamber holes filled with key pin
                    
                    // Calculate animation progress (0 to 1)
                    const progress = (circleData.height - 2) / (16 - 2); // From 2 to 16 height
                    
                    // Draw different circle shapes based on progress (widest in middle)
                    if (progress < 0.1) {
                        // Start: just a thin line (flat top)
                        chamberCircle.fillRect(-12, 0, 24, 2);
                    } else if (progress < 0.3) {
                        // Early: thin oval with middle bulge
                        chamberCircle.fillRect(-8, 0, 16, 2);     // narrow top
                        chamberCircle.fillRect(-12, 2, 24, 2);    // wide middle
                        chamberCircle.fillRect(-8, 4, 16, 2);     // narrow bottom
                    } else if (progress < 0.5) {
                        // Middle: growing circle with middle bulge
                        chamberCircle.fillRect(-6, 0, 12, 2);     // narrow top
                        chamberCircle.fillRect(-10, 2, 20, 2);    // wider
                        chamberCircle.fillRect(-12, 4, 24, 2);    // widest middle
                        chamberCircle.fillRect(-10, 6, 20, 2);    // wider
                        chamberCircle.fillRect(-6, 8, 12, 2);     // narrow bottom
                    } else if (progress < 0.7) {
                        // Later: more circle-like with middle bulge
                        chamberCircle.fillRect(-4, 0, 8, 2);      // narrow top
                        chamberCircle.fillRect(-8, 2, 16, 2);     // wider
                        chamberCircle.fillRect(-12, 4, 24, 2);    // widest middle
                        chamberCircle.fillRect(-12, 6, 24, 2);    // widest middle
                        chamberCircle.fillRect(-8, 8, 16, 2);     // wider
                        chamberCircle.fillRect(-4, 10, 8, 2);     // narrow bottom
                    } else if (progress < 0.9) {
                        // Almost full: near complete circle
                        chamberCircle.fillRect(-2, 0, 4, 2);      // narrow top
                        chamberCircle.fillRect(-6, 2, 12, 2);     // wider
                        chamberCircle.fillRect(-10, 4, 20, 2);    // wider
                        chamberCircle.fillRect(-12, 6, 24, 2);    // widest middle
                        chamberCircle.fillRect(-12, 8, 24, 2);    // widest middle
                        chamberCircle.fillRect(-10, 10, 20, 2);   // wider
                        chamberCircle.fillRect(-6, 12, 12, 2);    // wider
                        chamberCircle.fillRect(-2, 14, 4, 2);     // narrow bottom
                    } else {
                        // Full: complete pixel art circle
                        chamberCircle.fillRect(-2, 0, 4, 2);      // narrow top
                        chamberCircle.fillRect(-6, 2, 12, 2);     // wider
                        chamberCircle.fillRect(-10, 4, 20, 2);    // wider
                        chamberCircle.fillRect(-12, 6, 24, 2);    // widest middle
                        chamberCircle.fillRect(-12, 8, 24, 2);    // widest middle
                        chamberCircle.fillRect(-10, 10, 20, 2);   // wider
                        chamberCircle.fillRect(-6, 12, 12, 2);    // wider
                        chamberCircle.fillRect(-2, 14, 4, 2);     // narrow bottom
                    }
                    
                    // Update position
                    chamberCircle.y = circleData.y;
                }
            });
            
            // Animate key pin moving down as a unit (staying connected to chamber hole)
            const keyPinData = { 
                yOffset: 0 // How much the entire key pin moves down
            };
            this.parent.scene.tweens.add({
                targets: keyPinData,
                yOffset: KEY_PIN_TOP_SHRINK, // Move entire key pin down
                duration: 1400,
                ease: 'Cubic.easeInOut',
                onUpdate: function() {
                    pin.keyPin.clear();
                    pin.keyPin.fillStyle(0xdd3333);
                    
                    // Calculate position: entire key pin moves down as a unit
                    const originalTopY = -50 + pin.driverPinLength - pin.currentHeight; // Current top position (at shear line)
                    const newTopY = originalTopY + keyPinData.yOffset; // Entire key pin moves down
                    const newBottomY = newTopY + pin.keyPinLength; // Bottom position
                    
                    // Draw rectangular part of key pin (moves down as unit)
                    pin.keyPin.fillRect(-12, newTopY, 24, pin.keyPinLength - 8);
                    
                    // Draw triangular bottom in pixel art style (moves down with key pin)
                    pin.keyPin.fillRect(-12, newBottomY - 8, 24, 2);
                    pin.keyPin.fillRect(-10, newBottomY - 6, 20, 2);
                    pin.keyPin.fillRect(-8, newBottomY - 4, 16, 2);
                    pin.keyPin.fillRect(-6, newBottomY - 2, 12, 2);
                }
            });
            
            // Animate key pin channel rectangle moving down with the channel circles
            if (pin.channelRect) {
                this.parent.scene.tweens.add({
                    targets: pin.channelRect,
                    y: pin.channelRect.y + CHANNEL_MOVEMENT, // Move down by channel movement amount
                    duration: 1400,
                    ease: 'Cubic.easeInOut'
                });
            }
        });

        // Animate the keyway shrinking (keeping bottom in place) to make cylinder appear to grow
        const keywayData = { height: 90 };
        this.parent.scene.tweens.add({
            targets: keywayData,
            height: 90 - KEYWAY_SHRINK, // Shrink by keyway shrink amount
            duration: 1400,
            ease: 'Cubic.easeInOut',
            onUpdate: function() {
                // Update keyway visual to show shrinking
                // This would need to be implemented based on how the keyway is drawn
            }
        });
    }

    liftPinsWithKey() {
        if (!this.parent.keyData || !this.parent.keyData.cuts) return;
        
        // Lift each pin to the correct height based on key cuts
        this.parent.keyData.cuts.forEach((cutDepth, index) => {
            if (index >= this.parent.pinCount) return;
            
            const pin = this.parent.pins[index];
            
            // Calculate the height needed to lift the pin so it aligns at the shear line
            const shearLineY = -45; // Shear line position
            const keyPinTopAtShearLine = shearLineY; // Key pin top should be at shear line
            const keyPinBottomAtRest = -50 + pin.driverPinLength + pin.keyPinLength; // Key pin bottom when not lifted
            const requiredLift = keyPinBottomAtRest - keyPinTopAtShearLine; // How much to lift
            
            // The cut depth should match the required lift
            const maxLift = pin.keyPinLength; // Maximum possible lift (full key pin height)
            const requiredCutDepth = (requiredLift / maxLift) * 100; // Convert to percentage
            
            // Calculate the actual lift based on the key cut depth
            const actualLift = (cutDepth / 100) * maxLift;
            
            // Animate pin to correct position
            this.parent.scene.tweens.add({
                targets: { height: 0 },
                height: actualLift,
                duration: 500,
                ease: 'Cubic.easeOut',
                onUpdate: (tween) => {
                    pin.currentHeight = tween.targets[0].height;
                    this.parent.pinVisuals.updatePinVisuals(pin);
                }
            });
        });
    }

    lockPickingSuccess() {
        // Animation configuration variables - easy to tweak
        const KEY_PIN_TOP_SHRINK = 10; // How much the key pin top moves down
        const KEY_PIN_BOTTOM_SHRINK = 5; // How much the key pin bottom moves up
        const KEY_PIN_TOTAL_SHRINK = KEY_PIN_TOP_SHRINK + KEY_PIN_BOTTOM_SHRINK; // Total key pin shrink
        const CHANNEL_MOVEMENT = 25; // How much channels move down
        const KEYWAY_SHRINK = 20; // How much keyway shrinks
        const WRENCH_VERTICAL_SHRINK = 60; // How much wrench vertical arm shrinks
        const WRENCH_HORIZONTAL_SHRINK = 5; // How much wrench horizontal arm gets thinner
        const WRENCH_MOVEMENT = 10; // How much wrench moves down
        
        this.parent.gameState.isActive = false;
        
        // Play success sound
        if (this.parent.sounds.success) {
            this.parent.sounds.success.play();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }
        }
        
        this.parent.keyInsertion.updateFeedback("Lock picked successfully!");

        // Shrink key pins downward and add half circles to simulate cylinder rotation
        this.parent.pins.forEach(pin => {
            // Hide all highlights
            if (pin.shearHighlight) pin.shearHighlight.setVisible(false);
            if (pin.setHighlight) pin.setHighlight.setVisible(false);
            if (pin.bindingHighlight) pin.bindingHighlight.setVisible(false);
            if (pin.overpickedHighlight) pin.overpickedHighlight.setVisible(false);
            if (pin.failureHighlight) pin.failureHighlight.setVisible(false);
            
            // Create squashed circle that expands and moves to stay aligned with key pin top
            const squashedCircle = this.parent.scene.add.graphics();
            //was 0xdd3333 Red color (key pin color)
            squashedCircle.fillStyle(0xffffff); // white color for testing purposes
            squashedCircle.x = pin.x; // Center horizontally on the pin
            
            // Start position: aligned with the top of the key pin
            const startTopY = pin.y + (-50 + pin.driverPinLength); // Top of key pin position
            squashedCircle.y = startTopY;
            squashedCircle.setDepth(3); // Above driver pins so they're visible
            
            // Create a temporary object to hold the circle expansion data
            const circleData = { 
                width: 24, // Start full width (same as key pin)
                height: 2, // Start very thin (flat top)
                y: startTopY
            };
            
            // Animate the squashed circle expanding to full circle (stays at top of key pin)
            this.parent.scene.tweens.add({
                targets: circleData,
                width: 24, // Full circle width (stays same)
                height: 16, // Full circle height (expands from 2 to 16)
                y: startTopY, // Stay at the top of the key pin (no movement)
                duration: 1400,
                ease: 'Cubic.easeInOut',
                onUpdate: function() {
                    squashedCircle.clear();
                    squashedCircle.fillStyle(0xff3333); // Red color (key pin color)
                    
                    // Calculate animation progress (0 to 1)
                    const progress = (circleData.height - 2) / (16 - 2); // From 2 to 16 height
                    
                    // Draw different circle shapes based on progress (widest in middle)
                    if (progress < 0.1) {
                        // Start: just a thin line (flat top)
                        squashedCircle.fillRect(-12, 0, 24, 2);
                    } else if (progress < 0.3) {
                        // Early: thin oval with middle bulge
                        squashedCircle.fillRect(-8, 0, 16, 2);     // narrow top
                        squashedCircle.fillRect(-12, 2, 24, 2);    // wide middle
                        squashedCircle.fillRect(-8, 4, 16, 2);     // narrow bottom
                    } else if (progress < 0.5) {
                        // Middle: growing circle with middle bulge
                        squashedCircle.fillRect(-6, 0, 12, 2);     // narrow top
                        squashedCircle.fillRect(-10, 2, 20, 2);    // wider
                        squashedCircle.fillRect(-12, 4, 24, 2);    // widest middle
                        squashedCircle.fillRect(-10, 6, 20, 2);    // wider
                        squashedCircle.fillRect(-6, 8, 12, 2);     // narrow bottom
                    } else if (progress < 0.7) {
                        // Later: more circle-like with middle bulge
                        squashedCircle.fillRect(-4, 0, 8, 2);      // narrow top
                        squashedCircle.fillRect(-8, 2, 16, 2);     // wider
                        squashedCircle.fillRect(-12, 4, 24, 2);    // widest middle
                        squashedCircle.fillRect(-12, 6, 24, 2);    // widest middle
                        squashedCircle.fillRect(-8, 8, 16, 2);     // wider
                        squashedCircle.fillRect(-4, 10, 8, 2);     // narrow bottom
                    } else if (progress < 0.9) {
                        // Almost full: near complete circle
                        squashedCircle.fillRect(-2, 0, 4, 2);      // narrow top
                        squashedCircle.fillRect(-6, 2, 12, 2);     // wider
                        squashedCircle.fillRect(-10, 4, 20, 2);    // wider
                        squashedCircle.fillRect(-12, 6, 24, 2);    // widest middle
                        squashedCircle.fillRect(-12, 8, 24, 2);    // widest middle
                        squashedCircle.fillRect(-10, 10, 20, 2);   // wider
                        squashedCircle.fillRect(-6, 12, 12, 2);    // wider
                        squashedCircle.fillRect(-2, 14, 4, 2);     // narrow bottom
                    } else {
                        // Full: complete pixel art circle
                        squashedCircle.fillRect(-2, 0, 4, 2);      // narrow top
                        squashedCircle.fillRect(-6, 2, 12, 2);     // wider
                        squashedCircle.fillRect(-10, 4, 20, 2);    // wider
                        squashedCircle.fillRect(-12, 6, 24, 2);    // widest middle
                        squashedCircle.fillRect(-12, 8, 24, 2);    // widest middle
                        squashedCircle.fillRect(-10, 10, 20, 2);   // wider
                        squashedCircle.fillRect(-6, 12, 12, 2);    // wider
                        squashedCircle.fillRect(-2, 14, 4, 2);     // narrow bottom
                    }
                    
                    // Update position
                    squashedCircle.y = circleData.y;
                }
            });
            
            // Animate key pin shrinking from both top and bottom
            const keyPinData = { height: pin.keyPinLength, topOffset: 0 };
            this.parent.scene.tweens.add({
                targets: keyPinData,
                height: pin.keyPinLength - KEY_PIN_TOTAL_SHRINK, // Shrink by total amount
                topOffset: KEY_PIN_TOP_SHRINK, // Move top down
                duration: 1400,
                ease: 'Cubic.easeInOut',
                onUpdate: function() {
                    pin.keyPin.clear();
                    pin.keyPin.fillStyle(0xdd3333);
                    
                    // Calculate new position: top moves down, bottom moves up
                    const originalTopY = -50 + pin.driverPinLength; // Original top of key pin
                    const newTopY = originalTopY + keyPinData.topOffset; // Top moves down
                    const newBottomY = newTopY + keyPinData.height; // Bottom position
                    
                    // Draw rectangular part of key pin (shrunk from both ends)
                    pin.keyPin.fillRect(-12, newTopY, 24, keyPinData.height - 8);
                    
                    // Draw triangular bottom in pixel art style (bottom moves up)
                    pin.keyPin.fillRect(-12, newBottomY - 8, 24, 2);
                    pin.keyPin.fillRect(-10, newBottomY - 6, 20, 2);
                    pin.keyPin.fillRect(-8, newBottomY - 4, 16, 2);
                    pin.keyPin.fillRect(-6, newBottomY - 2, 12, 2);
                }
            });
            
            // Animate key pin channel rectangle moving down with the channel circles
            this.parent.scene.tweens.add({
                targets: pin.channelRect,
                y: pin.channelRect.y + CHANNEL_MOVEMENT, // Move down by channel movement amount
                duration: 1400,
                ease: 'Cubic.easeInOut'
            });
        });

        // Animate the keyway shrinking (keeping bottom in place) to make cylinder appear to grow
        // Create a temporary object to hold the height value for tweening
        const keywayData = { height: 90 };
        this.parent.scene.tweens.add({
            targets: keywayData,
            height: 90 - KEYWAY_SHRINK, // Shrink by keyway shrink amount
            duration: 1400,
            ease: 'Cubic.easeInOut',
            onUpdate: function() {
                this.parent.keywayGraphics.clear();
                this.parent.keywayGraphics.fillStyle(0x2a2a2a);
                // Move top down: y increases as height shrinks, keeping bottom at y=290
                const newY = 200 + (90 - keywayData.height); // Move top down
                this.parent.keywayGraphics.fillRect(100, newY, 400, keywayData.height);
                this.parent.keywayGraphics.lineStyle(1, 0x1a1a1a);
                this.parent.keywayGraphics.strokeRect(100, newY, 400, keywayData.height);
            }.bind(this)
        });

        // Animate tension wrench shrinking and moving down
        if (this.parent.tensionWrench) {
            // Create a temporary object to hold the height value for tweening
            const wrenchData = { height: 170, y: 0, horizontalHeight: 10 }; // Original vertical arm height, y offset, and horizontal arm height
            this.parent.scene.tweens.add({
                targets: wrenchData,
                height: 170 - WRENCH_VERTICAL_SHRINK, // Shrink by vertical shrink amount
                y: WRENCH_MOVEMENT, // Move entire wrench down
                horizontalHeight: 10 - WRENCH_HORIZONTAL_SHRINK, // Make horizontal arm thinner
                duration: 1400,
                ease: 'Cubic.easeInOut',
                onUpdate: function() {
                    // Update the wrench graphics (both active and inactive states)
                    this.parent.wrenchGraphics.clear();
                    this.parent.wrenchGraphics.fillStyle(this.parent.lockState.tensionApplied ? 0x00ff00 : 0x888888);
                    
                    // Calculate new top position (move top down as height shrinks)
                    const originalTop = -120; // Original top position
                    const newTop = originalTop + (170 - wrenchData.height) + wrenchData.y; // Move top down and add y offset
                    
                    // Long vertical arm (left side of L) - top moves down and shrinks
                    this.parent.wrenchGraphics.fillRect(0, newTop, 10, wrenchData.height);
                    
                    // Short horizontal arm (bottom of L) - also moves down with top and gets thinner
                    this.parent.wrenchGraphics.fillRect(0, newTop + wrenchData.height, 37.5, wrenchData.horizontalHeight);
                }.bind(this)
            });
        }

        // Channel rectangles are already created during initial render

        // Animate pixel-art circles (channels) moving down from above the shear line
        this.parent.pins.forEach(pin => {
            // Calculate starting position: above the shear line (behind driver pins)
            const pinX = pin.x;
            const pinY = pin.y;
            const shearLineY = -45; // Shear line position
            const circleStartY = pinY + shearLineY - 20; // Start above shear line
            const circleEndY = circleStartY + CHANNEL_MOVEMENT; // Move down same distance as cylinder

            // Create pixel-art circle graphics
            const channelCircle = this.parent.scene.add.graphics();
            channelCircle.x = pinX;
            channelCircle.y = circleStartY;
            // Pixel-art circle: red color (like key pins)
            const color = 0x333333; // Red color (key pin color)
            channelCircle.fillStyle(color, 1);
            // Create a proper circle shape with pixel-art steps (middle widest)
            channelCircle.fillRect(-6, 0, 12, 2);    // bottom (narrowest)
            channelCircle.fillRect(-8, 2, 16, 2);    // wider
            channelCircle.fillRect(-10, 4, 20, 2);   // wider
            channelCircle.fillRect(-12, 6, 24, 2);   // widest (middle)
            channelCircle.fillRect(-12, 8, 24, 2);   // widest (middle)
            channelCircle.fillRect(-10, 10, 20, 2);  // narrower
            channelCircle.fillRect(-8, 12, 16, 2);   // narrower
            channelCircle.fillRect(-6, 14, 12, 2);   // top (narrowest)
            channelCircle.setDepth(1); // Normal depth for circles

            // Animate the circle moving down
            this.parent.scene.tweens.add({
                targets: channelCircle,
                y: circleEndY,
                duration: 1400,
                ease: 'Cubic.easeInOut',
            });
        });

        // Show success message immediately but delay the game completion
        const successHTML = `
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">Lock picked successfully!</div>
        `;
        // this.showSuccess(successHTML, false, 2000);
        
        // Delay the actual game completion until animation finishes
        setTimeout(() => {
            // Now trigger the success callback that unlocks the game
            this.parent.showSuccess(successHTML, true, 2000);
            this.parent.gameResult = { lockable: this.parent.lockable };
          }, 1500); // Wait 1.5 seconds (slightly longer than animation duration)
    }
    
}
