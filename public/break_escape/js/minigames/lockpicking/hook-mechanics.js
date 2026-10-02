
/**
 * HookMechanics
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new HookMechanics(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class HookMechanics {
    
    constructor(parent) {
        this.parent = parent;
    }

    updateHookPosition(pinIndex) {
        if (!this.parent.hookGroup || !this.parent.hookConfig) return;
        
        const config = this.parent.hookConfig;
        const targetPin = this.parent.pins[pinIndex];
        
        if (!targetPin) return;
        
        // Calculate the target Y position (bottom of the key pin)
        const pinWorldY = 200; // Base Y position for pins
        const currentTargetY = pinWorldY - 50 + targetPin.driverPinLength + targetPin.keyPinLength - targetPin.currentHeight;
        
        console.log('Hook update - following pin:', pinIndex, 'currentHeight:', targetPin.currentHeight, 'targetY:', currentTargetY);
        
        // Update the last targeted pin
        this.parent.hookConfig.lastTargetedPin = pinIndex;
        
        // Calculate the pin's X position (same logic as createPins)
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        const pinX = 100 + margin + pinIndex * pinSpacing;
        
        // Calculate the pin's base Y position (when currentHeight = 0)
        const pinBaseY = pinWorldY - 50 + targetPin.driverPinLength + targetPin.keyPinLength;
        
        // Calculate how much the pin has moved from its own base position
        const heightDifference = pinBaseY - currentTargetY;
        
        // Calculate rotation angle based on percentage of pin movement and pin number
        const maxHeightDifference = 50; // Maximum expected height difference
        const minRotationDegrees = 20; // Minimum rotation for highest pin
        const maxRotationDegrees = 40; // Maximum rotation for lowest pin
        
        // Calculate pin-based rotation range (pin 0 = max rotation, pin n-1 = min rotation)
        const pinRotationRange = maxRotationDegrees - minRotationDegrees;
        const pinRotationFactor = pinIndex / (this.parent.pinCount - 1); // 0 for first pin, 1 for last pin
        const pinRotationOffset = pinRotationRange * pinRotationFactor;
        const pinMaxRotation = maxRotationDegrees - pinRotationOffset;
        
        // Calculate percentage of pin movement (0% to 100%)
        const pinMovementPercentage = Math.min((heightDifference / maxHeightDifference) * 100, 100);
        
        // Calculate rotation based on percentage and pin-specific max rotation
        // Higher pin indices (further pins) rotate slower by reducing the percentage
        const pinSpeedFactor = 1 - (pinIndex / this.parent.pinCount) * 0.5; // 1.0 for pin 0, 0.5 for last pin
        const adjustedPercentage = pinMovementPercentage * pinSpeedFactor;
        const rotationAngle = (adjustedPercentage / 100) * pinMaxRotation;
        
        // Calculate the new tip position (hook should point at the current pin)
        const totalHookHeight = (config.diagonalSegments + config.verticalSegments) * config.segmentStep;
        const newTipX = pinX - totalHookHeight + 34; // Add 34px offset (24px + 10px further right)
        
        // Update hook position and rotation
        this.parent.hookGroup.x = newTipX;
        this.parent.hookGroup.y = currentTargetY;
        this.parent.hookGroup.setAngle(-rotationAngle); // Negative for anti-clockwise rotation
        
        // Check for collisions with other pins using hook's current position
        this.checkHookCollisions(pinIndex, this.parent.hookGroup.y);
        
        console.log('Hook update - pinX:', pinX, 'newTipX:', newTipX, 'currentTargetY:', currentTargetY, 'heightDifference:', heightDifference, 'pinMaxRotation:', pinMaxRotation, 'pinMovementPercentage:', pinMovementPercentage.toFixed(1) + '%', 'pinSpeedFactor:', pinSpeedFactor.toFixed(2), 'rotationAngle:', rotationAngle.toFixed(1));
    }

    checkHookCollisions(targetPinIndex, hookCurrentY) {
        if (!this.parent.hookConfig || !this.parent.gameState.mouseDown) return;
        
        // Clear previous debug graphics
        if (this.parent.debugGraphics) {
            this.parent.debugGraphics.clear();
        } else {
            this.parent.debugGraphics = this.parent.scene.add.graphics();
            this.parent.debugGraphics.setDepth(100); // Render on top
        }
        
        // Create a temporary rectangle for the hook's horizontal arm using Phaser's physics
        const hookArmWidth = 8;
        const hookArmLength = 100;
        
        // Calculate the horizontal arm position relative to the hook's current position
        // The horizontal arm extends from the handle to the curve start
        const handleStartX = -120; // Handle starts at -120
        const handleWidth = 20;
        const armStartX = handleStartX + handleWidth; // Arm starts after handle (-100)
        const armEndX = armStartX + hookArmLength; // Arm ends at +40
        
        // Position the collision box lower along the arm (not at the tip)
        const collisionOffsetY = 35; // Move collision box down by 2350px
        
        // Convert to world coordinates with rotation
        const hookAngle = this.parent.hookGroup.angle * (Math.PI / 180); // Convert degrees to radians
        const cosAngle = Math.cos(hookAngle);
        const sinAngle = Math.sin(hookAngle);
        
        // Calculate rotated arm start and end points
        const armStartX_rotated = armStartX * cosAngle - collisionOffsetY * sinAngle;
        const armStartY_rotated = armStartX * sinAngle + collisionOffsetY * cosAngle;
        const armEndX_rotated = armEndX * cosAngle - collisionOffsetY * sinAngle;
        const armEndY_rotated = armEndX * sinAngle + collisionOffsetY * cosAngle;
        
        // Convert to world coordinates
        const worldArmStartX = armStartX_rotated + this.parent.hookGroup.x;
        const worldArmStartY = armStartY_rotated + this.parent.hookGroup.y;
        const worldArmEndX = armEndX_rotated + this.parent.hookGroup.x;
        const worldArmEndY = armEndY_rotated + this.parent.hookGroup.y;
        
        // Create a line for the rotated arm (this is what we'll use for collision detection)
        const hookArmLine = new Phaser.Geom.Line(worldArmStartX, worldArmStartY, worldArmEndX, worldArmEndY);
        
        // // Render hook arm hitbox (red) - draw as a line to show rotation
        // this.debugGraphics.lineStyle(3, 0xff0000);
        // this.debugGraphics.beginPath();
        // this.debugGraphics.moveTo(worldArmStartX, worldArmStartY);
        // this.debugGraphics.lineTo(worldArmEndX, worldArmEndY);
        // this.debugGraphics.strokePath();
        
        // // Also render a rectangle around the collision area for debugging
        // this.debugGraphics.lineStyle(1, 0xff0000);
        // this.debugGraphics.strokeRect(
        //     Math.min(worldArmStartX, worldArmEndX), 
        //     Math.min(worldArmStartY, worldArmEndY), 
        //     Math.abs(worldArmEndX - worldArmStartX), 
        //     Math.abs(worldArmEndY - worldArmStartY) + hookArmWidth
        // );
        
        // Check each pin for collision using Phaser's geometry
        this.parent.pins.forEach((pin, pinIndex) => {
            if (pinIndex === targetPinIndex) return; // Skip the target pin
            
            // Calculate pin position
            const pinSpacing = 400 / (this.parent.pinCount + 1);
            const margin = pinSpacing * 0.75;
            const pinX = 100 + margin + pinIndex * pinSpacing;
            const pinWorldY = 200;
            
            // Calculate pin's current position (including any existing movement)
            // Add safety check for undefined properties
            if (!pin.driverPinLength || !pin.keyPinLength) {
                console.warn(`Pin ${pinIndex} missing length properties in checkHookCollisions:`, pin);
                return; // Skip this pin if properties are missing
            }
            const pinCurrentY = pinWorldY - 50 + pin.driverPinLength + pin.keyPinLength - pin.currentHeight;
            const keyPinTop = pinCurrentY - pin.keyPinLength;
            const keyPinBottom = pinCurrentY;
            
            // Create a rectangle for the key pin
            const keyPinRect = new Phaser.Geom.Rectangle(pinX - 12, keyPinTop, 24, pin.keyPinLength);
            
            // // Render pin hitbox (blue)
            // this.debugGraphics.lineStyle(2, 0x0000ff);
            // this.debugGraphics.strokeRect(pinX - 12, keyPinTop, 24, pin.keyPinLength);
            
            // Use Phaser's built-in line-to-rectangle intersection
            if (Phaser.Geom.Intersects.LineToRectangle(hookArmLine, keyPinRect)) {
                // Collision detected - lift this pin
                this.liftCollidedPin(pin, pinIndex);
                
                // // Render collision (green)
                // this.debugGraphics.lineStyle(3, 0x00ff00);
                // this.debugGraphics.strokeRect(pinX - 12, keyPinTop, 24, pin.keyPinLength);
            }
        });
    }

    liftCollidedPin(pin, pinIndex) {
        // Only lift if the pin isn't already being actively moved
        if (this.parent.lockState.currentPin && this.parent.lockState.currentPin.index === pinIndex) return;
        
        // Calculate pin-specific maximum height
        const baseMaxHeight = 75;
        const maxHeightReduction = 15;
        const pinHeightFactor = pinIndex / (this.parent.pinCount - 1);
        const pinMaxHeight = baseMaxHeight - (maxHeightReduction * pinHeightFactor);
        
        // Lift the pin faster for collision (more responsive)
        const collisionLiftSpeed = this.parent.liftSpeed * 0.8; // 80% of normal lift speed (increased from 30%)
        pin.currentHeight = Math.min(pin.currentHeight + collisionLiftSpeed, pinMaxHeight * 0.5); // Max 50% of pin's max height
        
        // Update pin visuals
        this.parent.pinVisuals.updatePinVisuals(pin);
        
        console.log(`Hook collision: Lifting pin ${pinIndex} to height ${pin.currentHeight}`);
    }
    
}
