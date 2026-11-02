
/**
 * KeyInsertion
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeyInsertion(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeyInsertion {
    
    constructor(parent) {
        this.parent = parent;
    }

    updateKeyPosition(progress) {
        if (!this.parent.keyGroup || !this.parent.keyConfig) return;
        
        // Calculate new position based on insertion progress
        // Key moves from left (off-screen) to right (shoulder touches lock edge)
        const targetX = this.parent.keyConfig.keywayStartX - this.parent.keyConfig.shoulderWidth; // Shoulder touches lock edge
        const currentX = this.parent.keyConfig.startX + (targetX - this.parent.keyConfig.startX) * progress;
        
        this.parent.keyGroup.x = currentX;
        this.parent.keyInsertionProgress = progress;
        
        // If fully inserted, check if key is correct
        if (progress >= 1.0) {
            this.parent.keyOps.checkKeyCorrectness();
        }
    }

    updatePinsWithKeyInsertion(progress) {
        if (!this.parent.keyConfig) return;
        
        // Calculate key blade position relative to the lock
        // Same blade origin as the drawing (key-drawing.js: shoulderX = circleRadius * 1.9); * 2 put the
        // sampled surface 14px right of the drawn key, so pins sank into its slopes.
        const keyBladeStartX = this.parent.keyGroup.x + this.parent.keyConfig.circleRadius * 1.9 + this.parent.keyConfig.shoulderWidth;
        const keyBladeEndX = keyBladeStartX + this.parent.keyConfig.bladeWidth;
        
        // Key blade base position in world coordinates
        const keyBladeBaseY = this.parent.keyGroup.y - this.parent.keyConfig.bladeHeight / 2;
        
        // Shear line for highlighting
        const shearLineY = -45; // Same as lockpicking mode
        const tolerance = 10;
        
        // Check each pin for collision with the key blade
        this.parent.pins.forEach((pin, index) => {
            if (index >= this.parent.pinCount) return;
            
            // Calculate pin position in the lock
            const pinSpacing = 400 / (this.parent.pinCount + 1);
            const margin = pinSpacing * 0.75;
            const pinX = 100 + margin + index * pinSpacing;
            
            // Check if this pin is under the key blade
            const pinIsUnderKeyBlade = pinX >= keyBladeStartX && pinX <= keyBladeEndX;
            
            if (pinIsUnderKeyBlade) {
                // Use collision detection to find the key surface height at this pin's position
                const keySurfaceY = this.parent.keyGeom.getKeySurfaceHeightAtPinPosition(pinX, keyBladeStartX, keyBladeBaseY);
                
                // Calculate where the key pin bottom should be to sit on the key surface
                const pinRestY = 200 - 50 + pin.driverPinLength + pin.keyPinLength;
                const targetKeyPinBottom = keySurfaceY;
                
                // Calculate required lift to move key pin bottom from rest to key surface
                const requiredLift = pinRestY - targetKeyPinBottom;
                const targetLift = Math.max(0, requiredLift);
                
                // The pins are spring-loaded, so the key pin rides the key surface exactly.
                // (A fixed 2px/1px step per frame lagged behind the 4 s insertion tween,
                // most on slow frame rates, and the pins then jumped when snapped at the end.)
                pin.currentHeight = targetLift;
            } else {
                // Pin is not under key blade - keep current position (don't drop back down)
                // This ensures pins stay lifted once they've been pushed up by the key
            }
            
            // Check if pin is near shear line for highlighting
            // Use the same boundary calculation as lockpicking mode
            const boundaryPosition = -50 + pin.driverPinLength - pin.currentHeight;
            const distanceToShearLine = Math.abs(boundaryPosition - shearLineY);
            
            // Update pin highlighting based on shear line proximity
            this.parent.pinVisuals.updatePinHighlighting(pin, distanceToShearLine, tolerance);
            
            // Update pin visuals
            this.parent.pinVisuals.updatePinVisuals(pin);
        });
    }

    updateFeedback(message) {
        this.parent.feedback.textContent = message;
    }
    
}
