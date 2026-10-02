
/**
 * LockGraphics
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new LockGraphics(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class LockGraphics {
    
    constructor(parent) {
        this.parent = parent;
    }

    createLockBackground() {
        const graphics = this.parent.scene.add.graphics();
        graphics.lineStyle(2, 0x666666);
        graphics.strokeRect(100, 50, 400, 300);
        graphics.fillStyle(0x555555);
        graphics.fillRect(100, 50, 400, 300);
        
        // Create key cylinder - rectangle from shear line to near bottom
        this.parent.cylinderGraphics = this.parent.scene.add.graphics();
        this.parent.cylinderGraphics.fillStyle(0xcd7f32); // Bronze color
        this.parent.cylinderGraphics.fillRect(100, 155, 400, 180); // From shear line (y=155) to near bottom (y=335)
        this.parent.cylinderGraphics.lineStyle(1, 0x8b4513); // Darker bronze border
        this.parent.cylinderGraphics.strokeRect(100, 155, 400, 180);
        
        // Create keyway - space where key would enter (moved higher to align with shear line)
        this.parent.keywayGraphics = this.parent.scene.add.graphics();
        this.parent.keywayGraphics.fillStyle(0x2a2a2a); // Dark gray for keyway
        this.parent.keywayGraphics.fillRect(100, 170, 400, 120); // Moved higher (y=170) and increased height (120)
        this.parent.keywayGraphics.lineStyle(1, 0x1a1a1a); // Darker border
        this.parent.keywayGraphics.strokeRect(100, 170, 400, 120);
    }

    createTensionWrench() {
        const wrenchX = 80; // Position to the left of the lock
        const wrenchY = 160; // Position down by half the arm width (5 units) from shear line
        
        // Create tension wrench container
        this.parent.tensionWrench = this.parent.scene.add.container(wrenchX, wrenchY);
        
        // Create L-shaped tension wrench graphics (25% larger)
        this.parent.wrenchGraphics = this.parent.scene.add.graphics();
        this.parent.wrenchGraphics.fillStyle(0x888888);
        
        // Long vertical arm (left side of L) - extended above the lock
        this.parent.wrenchGraphics.fillRect(0, -120, 10, 170);
        
        // Short horizontal arm (bottom of L) extending into keyway - 25% larger
        this.parent.wrenchGraphics.fillRect(0, 40, 37.5, 10);
        
        this.parent.tensionWrench.add(this.parent.wrenchGraphics);
        
        // Make it interactive - extended hit area to match pin click zones (down to keyway bottom)
        // Covers vertical arm, horizontal arm, handle, and extends down to bottom of keyway
        this.parent.tensionWrench.setInteractive(new Phaser.Geom.Rectangle(-12.5, -138.75, 60, 268.75), Phaser.Geom.Rectangle.Contains);
        
        // Add text
        const wrenchText = this.parent.scene.add.text(-10, 58, 'Tension Wrench', {
            fontSize: '18px',
            fontFamily: 'VT323',
            fill: '#00ff00',
            fontWeight: 'bold'
        });
        wrenchText.setOrigin(0.5);
        wrenchText.setDepth(100); // Bring to front
        this.parent.tensionWrench.add(wrenchText);
        
        // Store reference to wrench text for hiding
        this.parent.wrenchText = wrenchText;
        
        // Add click handler
        this.parent.tensionWrench.on('pointerdown', () => {
            this.parent.lockState.tensionApplied = !this.parent.lockState.tensionApplied;

            if (this.parent.lockState.tensionApplied) {
                // Play tension sound only when applying
                if (this.parent.sounds.tension) {
                    this.parent.sounds.tension.play();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
                }
            }

            if (this.parent.lockState.tensionApplied) {
                this.parent.wrenchGraphics.clear();
                this.parent.wrenchGraphics.fillStyle(0x00ff00);
                
                // Long vertical arm (left side of L) - same dimensions as inactive
                this.parent.wrenchGraphics.fillRect(0, -120, 10, 170);
                
                // Short horizontal arm (bottom of L) extending into keyway - same dimensions as inactive
                this.parent.wrenchGraphics.fillRect(0, 40, 37.5, 10);
                
                this.parent.keyInsertion.updateFeedback("Tension applied. Only the binding pin can be set - others will fall back down.");
            } else {
                this.parent.wrenchGraphics.clear();
                this.parent.wrenchGraphics.fillStyle(0x888888);
                
                // Long vertical arm (left side of L) - same dimensions as active
                this.parent.wrenchGraphics.fillRect(0, -120, 10, 170);
                
                // Short horizontal arm (bottom of L) extending into keyway - same dimensions as active
                this.parent.wrenchGraphics.fillRect(0, 40, 37.5, 10);
                
                this.parent.keyInsertion.updateFeedback("Tension released. All pins will fall back down.");
                
                // Play reset sound
                if (this.parent.sounds.reset) {
                    this.parent.sounds.reset.play();
                }
                
                // Reset ALL pins when tension is released (including set and overpicked ones)
                this.parent.pins.forEach(pin => {
                    pin.isSet = false;
                    pin.isOverpicked = false;
                    pin.currentHeight = 0;
                    pin.keyPinHeight = 0; // Reset key pin height
                    pin.driverPinHeight = 0; // Reset driver pin height
                    pin.overpickingTimer = null; // Reset overpicking timer
                    
                    // Reset visual
                    pin.keyPin.clear();
                    pin.keyPin.fillStyle(0xdd3333);
                    
                    // Draw rectangular part of key pin
                    pin.keyPin.fillRect(-12, -50 + pin.driverPinLength, 24, pin.keyPinLength - 8);
                    
                    // Draw triangular bottom in pixel art style
                    pin.keyPin.fillRect(-12, -50 + pin.driverPinLength + pin.keyPinLength - 8, 24, 2);
                    pin.keyPin.fillRect(-10, -50 + pin.driverPinLength + pin.keyPinLength - 6, 20, 2);
                    pin.keyPin.fillRect(-8, -50 + pin.driverPinLength + pin.keyPinLength - 4, 16, 2);
                    pin.keyPin.fillRect(-6, -50 + pin.driverPinLength + pin.keyPinLength - 2, 12, 2);
                    
                    pin.driverPin.clear();
                    pin.driverPin.fillStyle(0x3388dd);
                    pin.driverPin.fillRect(-12, -50, 24, pin.driverPinLength);
                    
                    // Reset spring to original position
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
                    if (pin.bindingHighlight) pin.bindingHighlight.setVisible(false);
                    if (pin.overpickedHighlight) pin.overpickedHighlight.setVisible(false);
                    if (pin.failureHighlight) pin.failureHighlight.setVisible(false);
                });
                
                // Reset lock state
                this.parent.lockState.pinsSet = 0;
            }
            
            this.parent.pinMgmt.updateBindingPins();
        });
    }

    createHookPick() {
        // Create hook pick that comes in from the left side
        // Handle is off-screen, long horizontal arm curves up to bottom of key pin 1
        
        // Calculate pin spacing and margin (same as createPins)
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75; // 25% smaller margins
        
        // Hook target coordinates (can be easily changed to point at any pin or coordinate)
        const targetX = 100 + margin + (this.parent.pinCount - 1) * pinSpacing; // Last pin X position
        const targetY = -50 + this.parent.pins[this.parent.pinCount - 1].driverPinLength + this.parent.pins[this.parent.pinCount - 1].keyPinLength; // Last pin bottom Y
        
        // Hook should start 2/3rds down the keyway (keyway is from y=200 to y=290, so 2/3rds down is y=260)
        const keywayStartY = 200;
        const keywayEndY = 290;
        const keywayHeight = keywayEndY - keywayStartY;
        const hookEntryY = keywayStartY + (keywayHeight * 2/3); // 2/3rds down the keyway
        
        // Hook pick dimensions and positioning
        const handleWidth = 20;
        const handleHeight = 240; // 4x longer (was 60)
        const armWidth = 8;
        const armLength = 140; // Horizontal arm length
        
        // Start position (handle off-screen to the left)
        const startX = -120; // Handle starts further off-screen (was -30)
        const startY = hookEntryY; // Handle center Y position (2/3rds down keyway)
        
        // Calculate hook dimensions based on target
        const hookStartX = startX + handleWidth + armLength;
        const hookStartY = startY;
        
        // Hook segments configuration
        const segmentSize = 8;
        const diagonalSegments = 2; // Number of diagonal segments
        const verticalSegments = 3; // Number of vertical segments (increased by 1)
        const segmentStep = 8; // Distance between segment centers
        
        // Calculate total hook height needed
        const totalHookHeight = (diagonalSegments + verticalSegments) * segmentStep;
        
        // Calculate required horizontal length to reach target
        const requiredHorizontalLength = targetX - hookStartX - totalHookHeight + 48; // Add 48px to reach target (24px + 24px further right)
        
        // Adjust horizontal length to align with target
        const curveStartX = hookStartX + requiredHorizontalLength;
        
        // Calculate the tip position (end of the hook)
        const tipX = curveStartX + (diagonalSegments * segmentStep);
        const tipY = hookStartY - (diagonalSegments * segmentStep) - (verticalSegments * segmentStep);
        
        // Create a container for the hook pick with rotation center at the tip
        this.parent.hookGroup = this.parent.scene.add.container(0, 0);
        this.parent.hookGroup.x = tipX;
        this.parent.hookGroup.y = tipY;
        
        // Create graphics for hook pick (relative to group center)
        const hookPickGraphics = this.parent.scene.add.graphics();
        hookPickGraphics.fillStyle(0x888888); // Gray color for the pick
        hookPickGraphics.lineStyle(2, 0x888888); // Darker border
        
        // Calculate positions relative to group center (tip position)
        const relativeStartX = startX - tipX;
        const relativeStartY = startY - tipY;
        const relativeHookStartX = hookStartX - tipX;
        const relativeCurveStartX = curveStartX - tipX;
        
        // Draw the handle (off-screen)
        hookPickGraphics.fillRect(relativeStartX, relativeStartY - handleHeight/2, handleWidth, handleHeight);
        hookPickGraphics.strokeRect(relativeStartX, relativeStartY - handleHeight/2, handleWidth, handleHeight);
        
        // Draw the horizontal arm (extends from handle to near the lock)
        const armStartX = relativeStartX + handleWidth;
        const armEndX = armStartX + armLength;
        hookPickGraphics.fillRect(armStartX, relativeStartY - armWidth/2, armLength, armWidth);
        hookPickGraphics.strokeRect(armStartX, relativeStartY - armWidth/2, armLength, armWidth);
        
        // Draw horizontal part to curve start
        hookPickGraphics.fillRect(relativeHookStartX, relativeStartY - armWidth/2, relativeCurveStartX - relativeHookStartX, armWidth);
        hookPickGraphics.strokeRect(relativeHookStartX, relativeStartY - armWidth/2, relativeCurveStartX - relativeHookStartX, armWidth);
        
        // Draw the hook segments: diagonal then vertical
        // First 2 segments: up and right (2x scale)
        for (let i = 0; i < diagonalSegments; i++) {
            const x = relativeCurveStartX + (i * segmentStep); // Move right 8px each segment
            const y = relativeStartY - (i * segmentStep); // Move up 8px each segment
            hookPickGraphics.fillRect(x - armWidth/2, y - segmentSize/2, armWidth, segmentSize);
            hookPickGraphics.strokeRect(x - armWidth/2, y - segmentSize/2, armWidth, segmentSize);
        }
        
        // Next 3 segments: straight up (increased by 1 segment)
        for (let i = 0; i < verticalSegments; i++) {
            const x = relativeCurveStartX + (diagonalSegments * segmentStep); // Stay at the rightmost position from diagonal segments
            const y = relativeStartY - (diagonalSegments * segmentStep) - (i * segmentStep); // Continue moving up from where we left off
            hookPickGraphics.fillRect(x - armWidth/2, y - segmentSize/2, armWidth, segmentSize);
            hookPickGraphics.strokeRect(x - armWidth/2, y - segmentSize/2, armWidth, segmentSize);
        }
        
        // Add graphics to container
        this.parent.hookGroup.add(hookPickGraphics);
        
        // Add hook pick label
        const hookPickLabel = this.parent.scene.add.text(-10, 85, 'Hook Pick', {
            fontSize: '18px',
            fontFamily: 'VT323',
            fill: '#00ff00',
            fontWeight: 'bold'
        });
        hookPickLabel.setOrigin(0.5);
        hookPickLabel.setDepth(100); // Bring to front
        this.parent.tensionWrench.add(hookPickLabel);
        
        // Store reference to hook pick label for hiding
        this.parent.hookPickLabel = hookPickLabel;
        
        // Debug logging
        console.log('Hook positioning debug:', {
            targetX,
            targetY,
            hookStartX,
            hookStartY,
            tipX,
            tipY,
            totalHookHeight,
            requiredHorizontalLength,
            curveStartX,
            pinCount: this.parent.pinCount,
            pinSpacing,
            margin
        });
        
        // Store reference to hook pick for animations
        this.parent.hookPickGraphics = hookPickGraphics;
        
        // Store hook configuration for dynamic updates
        this.parent.hookConfig = {
            targetPin: this.parent.pinCount - 1, // Default to last pin (should be 4 for 5 pins)
            lastTargetedPin: this.parent.pinCount - 1, // Track the last pin that was targeted
            baseTargetX: targetX,
            baseTargetY: targetY,
            hookStartX: hookStartX,
            hookStartY: hookStartY,
            diagonalSegments: diagonalSegments,
            verticalSegments: verticalSegments,
            segmentStep: segmentStep,
            segmentSize: segmentSize,
            armWidth: armWidth,
            curveStartX: curveStartX,
            tipX: tipX,
            tipY: tipY,
            rotationCenterX: tipX,
            rotationCenterY: tipY
        };
        
        console.log('Hook config initialized - targetPin:', this.parent.hookConfig.targetPin, 'pinCount:', this.parent.pinCount);
    }
    
}
