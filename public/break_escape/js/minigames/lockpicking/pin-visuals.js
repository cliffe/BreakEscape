
/**
 * PinVisuals
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new PinVisuals(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class PinVisuals {
    
    constructor(parent) {
        this.parent = parent;
    }

    updatePinHighlighting(pin, distanceToShearLine, tolerance) {
        // Update pin highlighting based on distance to shear line
        // This provides visual feedback during key insertion
        
        // Create shear highlight if it doesn't exist
        if (!pin.shearHighlight) {
            pin.shearHighlight = this.parent.scene.add.graphics();
            pin.shearHighlight.fillStyle(0x00ff00, 0.4); // Green with transparency
            pin.shearHighlight.fillRect(-22.5, -110, 45, 140);
            pin.container.addAt(pin.shearHighlight, 0); // Add at beginning to appear behind pins
        }
        
        // Hide all highlights first
        pin.shearHighlight.setVisible(false);
        if (pin.bindingHighlight) pin.bindingHighlight.setVisible(false);
        if (pin.overpickedHighlight) pin.overpickedHighlight.setVisible(false);
        if (pin.failureHighlight) pin.failureHighlight.setVisible(false);
        
        // Show green highlight only if pin is at shear line
        if (distanceToShearLine <= tolerance) {
            // Pin is at shear line - show green highlight
            pin.shearHighlight.setVisible(true);
            console.log(`Pin ${pin.index} showing GREEN highlight - distance: ${distanceToShearLine}`);
        } else {
            // Pin is not at shear line - no highlight
            console.log(`Pin ${pin.index} NO highlight - distance: ${distanceToShearLine}`);
        }
    }

    updatePinVisuals(pin) {
        console.log(`Updating pin ${pin.index} visuals - currentHeight: ${pin.currentHeight}`);
        
        // Update key pin visual
        pin.keyPin.clear();
        pin.keyPin.fillStyle(0xdd3333);
        
        // Calculate new position based on currentHeight
        // Add safety check for undefined properties
        if (!pin.driverPinLength || !pin.keyPinLength) {
            console.warn(`Pin ${pin.index} missing length properties in updatePinVisuals:`, pin);
            return; // Skip this pin if properties are missing
        }
        const newKeyPinY = -50 + pin.driverPinLength - pin.currentHeight;
        const keyPinTopY = newKeyPinY;
        const keyPinBottomY = newKeyPinY + pin.keyPinLength;
        const shearLineY = -45;
        const distanceToShearLine = Math.abs(keyPinTopY - shearLineY);
        
        console.log(`Pin ${pin.index} final positioning: keyPinTopY=${keyPinTopY}, keyPinBottomY=${keyPinBottomY}, distanceToShearLine=${distanceToShearLine}`);
        
        // Draw rectangular part of key pin
        pin.keyPin.fillRect(-12, -50 + pin.driverPinLength - pin.currentHeight, 24, pin.keyPinLength - 8);
        
        // Draw triangular bottom in pixel art style
        pin.keyPin.fillRect(-12, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 8, 24, 2);
        pin.keyPin.fillRect(-10, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 6, 20, 2);
        pin.keyPin.fillRect(-8, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 4, 16, 2);
        pin.keyPin.fillRect(-6, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 2, 12, 2);
        
        // Update driver pin visual
        pin.driverPin.clear();
        pin.driverPin.fillStyle(0x3388dd);
        pin.driverPin.fillRect(-12, -50 - pin.currentHeight, 24, pin.driverPinLength);
        
        // Update spring compression
        pin.spring.clear();
        pin.spring.fillStyle(0x666666);
        const springCompression = pin.currentHeight;
        const compressionFactor = Math.max(0.3, 1 - (springCompression / 60));
        
        const springTop = -130;
        const driverPinTop = -50 - pin.currentHeight;
        const springBottom = driverPinTop;
        const springHeight = springBottom - springTop;
        const totalSpringSpace = springHeight;
        const segmentSpacing = totalSpringSpace / 11;
        
        for (let s = 0; s < 12; s++) {
            const segmentHeight = 4 * compressionFactor;
            const segmentY = springTop + (s * segmentSpacing);
            
            if (segmentY + segmentHeight <= springBottom) {
                pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
            }
        }
    }

    checkPinSet(pin) {
        // Check if the key/driver boundary is at the shear line
        const boundaryPosition = -50 + pin.driverPinLength - pin.currentHeight;
        const shearLineY = -45; // Shear line is at y=-45 (much higher position)
        const distanceToShearLine = Math.abs(boundaryPosition - shearLineY);
        const shouldBind = this.parent.gameUtil.shouldPinBind(pin);
        
        // Calculate threshold based on sensitivity (1-8)
        // Higher sensitivity = smaller threshold (easier to set pins)
        const baseThreshold = 8;
        const sensitivityFactor = (9 - this.parent.thresholdSensitivity) / 8; // Invert so higher sensitivity = smaller threshold
        const threshold = baseThreshold * sensitivityFactor;
        
        // Debug logging for threshold calculation
        if (distanceToShearLine < threshold + 2) { // Log when close to threshold
            console.log(`Pin ${pin.index + 1}: distance=${distanceToShearLine.toFixed(2)}, threshold=${threshold.toFixed(2)}, sensitivity=${this.parent.thresholdSensitivity}`);
        }
        
        if (distanceToShearLine < threshold && shouldBind) {
            // Pin set successfully
            pin.isSet = true;
            
            // Set separate heights for key pin and driver pin
            pin.keyPinHeight = 0; // Key pin drops back to original position
            pin.driverPinHeight = 60; // Driver pin stays at shear line (60 units from base position)
            
            // Snap driver pin to shear line - calculate exact position
            const shearLineY = -45;
            const targetDriverBottom = shearLineY;
            const driverPinTop = targetDriverBottom - pin.driverPinLength;
            
            // Update driver pin to snap to shear line
            pin.driverPin.clear();
            pin.driverPin.fillStyle(0x3388dd);
            pin.driverPin.fillRect(-12, driverPinTop, 24, pin.driverPinLength);
            
            // Reset key pin to original position (falls back down)
            pin.keyPin.clear();
            pin.keyPin.fillStyle(0xdd3333);
            
            // Draw rectangular part of key pin
            pin.keyPin.fillRect(-12, -50 + pin.driverPinLength, 24, pin.keyPinLength - 8);
            
            // Draw triangular bottom in pixel art style
            pin.keyPin.fillRect(-12, -50 + pin.driverPinLength + pin.keyPinLength - 8, 24, 2);
            pin.keyPin.fillRect(-10, -50 + pin.driverPinLength + pin.keyPinLength - 6, 20, 2);
            pin.keyPin.fillRect(-8, -50 + pin.driverPinLength + pin.keyPinLength - 4, 16, 2);
            pin.keyPin.fillRect(-6, -50 + pin.driverPinLength + pin.keyPinLength - 2, 12, 2);
            
            // Reset spring to original position
            pin.spring.clear();
            pin.spring.fillStyle(0x666666);
            const springTop = -130; // Fixed spring top
            const springBottom = -50; // Driver pin top when not lifted
            const springHeight = springBottom - springTop;
            
            for (let s = 0; s < 12; s++) {
                const segmentHeight = 4;
                const segmentSpacing = springHeight / 12;
                
                // Calculate segment position from bottom up to ensure bottom segment touches driver pin
                const segmentY = springBottom - (segmentHeight + (11 - s) * segmentSpacing);
                pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
            }
            
            // Show set pin highlight
            if (!pin.setHighlight) {
                pin.setHighlight = this.parent.scene.add.graphics();
                pin.setHighlight.fillStyle(0x00ff00, 0.5);
                pin.setHighlight.fillRect(-22.5, -110, 45, 140);
                pin.container.addAt(pin.setHighlight, 0); // Add at beginning to appear behind pins
            }
            pin.setHighlight.setVisible(true);
            
            // Hide other highlights
            if (pin.shearHighlight) pin.shearHighlight.setVisible(false);
            if (pin.highlight) pin.highlight.setVisible(false);
            if (pin.overpickedHighlight) pin.overpickedHighlight.setVisible(false);
            if (pin.failureHighlight) pin.failureHighlight.setVisible(false);
            
            this.parent.lockState.pinsSet++;
            
            // Play set sound
            if (this.parent.sounds.set) {
                this.parent.sounds.set.play();
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }
            }
            
            this.parent.keyInsertion.updateFeedback(`Pin ${pin.index + 1} set! (${this.parent.lockState.pinsSet}/${this.parent.pinCount})`);
            this.parent.pinMgmt.updateBindingPins();
            
            if (this.parent.lockState.pinsSet === this.parent.pinCount) {
                this.parent.keyAnim.lockPickingSuccess();
            }
        } else if (pin.isOverpicked) {
            // Pin is overpicked - stays stuck until tension is released
            if (pin.isSet) {
                this.parent.keyInsertion.updateFeedback("Set pin overpicked! Release tension to reset.");
            } else {
                this.parent.keyInsertion.updateFeedback("Pin overpicked! Release tension to reset.");
            }
        } else if (pin.isSet) {
            // Set pin: key pin falls back down, driver pin stays at shear line
            pin.keyPinHeight = 0; // Key pin falls back to original position
            pin.overpickingTimer = null; // Reset overpicking timer
            
            // Redraw key pin at original position
            pin.keyPin.clear();
            pin.keyPin.fillStyle(0xdd3333);
            pin.keyPin.fillRect(-12, -50 + pin.driverPinLength, 24, pin.keyPinLength - 8);
            pin.keyPin.fillRect(-12, -50 + pin.driverPinLength + pin.keyPinLength - 8, 24, 2);
            pin.keyPin.fillRect(-10, -50 + pin.driverPinLength + pin.keyPinLength - 6, 20, 2);
            pin.keyPin.fillRect(-8, -50 + pin.driverPinLength + pin.keyPinLength - 4, 16, 2);
            pin.keyPin.fillRect(-6, -50 + pin.driverPinLength + pin.keyPinLength - 2, 12, 2);
            
            // Driver pin stays at shear line
            pin.driverPin.clear();
            pin.driverPin.fillStyle(0x3388dd);
            const shearLineY = -45;
            const driverPinY = shearLineY - pin.driverPinLength;
            pin.driverPin.fillRect(-12, driverPinY, 24, pin.driverPinLength);
            
            // Spring stays connected to driver pin at shear line
            pin.spring.clear();
            pin.spring.fillStyle(0x666666);
            const springTop = -130;
            const springBottom = shearLineY - pin.driverPinLength;
            const springHeight = springBottom - springTop;
            const segmentSpacing = springHeight / 11;
            for (let s = 0; s < 12; s++) {
                const segmentHeight = 4 * 0.3;
                const segmentY = springTop + (s * segmentSpacing);
                if (segmentY + segmentHeight <= springBottom) {
                    pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
                }
            }
        } else {
            // Normal pin falls back down due to gravity
            pin.currentHeight = 0;
            
            // Reset key pin to original position
            pin.keyPin.clear();
            pin.keyPin.fillStyle(0xdd3333);
            
            // Draw rectangular part of key pin
            pin.keyPin.fillRect(-12, -50 + pin.driverPinLength, 24, pin.keyPinLength - 8);
            
            // Draw triangular bottom in pixel art style
            pin.keyPin.fillRect(-12, -50 + pin.driverPinLength + pin.keyPinLength - 8, 24, 2);
            pin.keyPin.fillRect(-10, -50 + pin.driverPinLength + pin.keyPinLength - 6, 20, 2);
            pin.keyPin.fillRect(-8, -50 + pin.driverPinLength + pin.keyPinLength - 4, 16, 2);
            pin.keyPin.fillRect(-6, -50 + pin.driverPinLength + pin.keyPinLength - 2, 12, 2);
            
            // Reset driver pin to original position
            pin.driverPin.clear();
            pin.driverPin.fillStyle(0x3388dd);
            pin.driverPin.fillRect(-12, -50, 24, pin.driverPinLength);
            
            // Reset spring to original position (all 12 segments visible)
            pin.spring.clear();
            pin.spring.fillStyle(0x666666);
            const springTop = -130; // Fixed spring top
            const springBottom = -50; // Driver pin top when not lifted
            const springHeight = springBottom - springTop;
            
            // Calculate total spring space and distribute segments evenly
            const totalSpringSpace = springHeight;
            const segmentSpacing = totalSpringSpace / 11; // 11 gaps between 12 segments
            
            for (let s = 0; s < 12; s++) {
                const segmentHeight = 4;
                const segmentY = springTop + (s * segmentSpacing);
                pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
            }
            
            // Hide all highlights
            if (pin.shearHighlight) pin.shearHighlight.setVisible(false);
            if (pin.setHighlight) pin.setHighlight.setVisible(false);
        }
    }
    
}
