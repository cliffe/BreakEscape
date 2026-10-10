
/**
 * PinManagement
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new PinManagement(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class PinManagement {
    
    constructor(parent) {
        this.parent = parent;
    }

    createPins() {
        // Create random binding order
        const bindingOrder = [];
        for (let i = 0; i < this.parent.pinCount; i++) {
            bindingOrder.push(i);
        }
        this.parent.gameUtil.shuffleArray(bindingOrder);
        
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75; // 25% smaller margins
        
        // REMOVED: Persistence check - load only from predefined pins in params
        // keyPins should be passed from scenario as predefinedPinHeights parameter
        const predefinedPinHeights = this.parent.params?.predefinedPinHeights;
        
        console.log(`🔧 PIN MANAGEMENT createPins():`);
        console.log(`  - pinCount: ${this.parent.pinCount}`);
        console.log(`  - lockId: ${this.parent.lockId}`);
        console.log(`  - params.predefinedPinHeights: ${predefinedPinHeights ? '[' + predefinedPinHeights.join(', ') + ']' : 'none'}`);
        console.log(`  - using predefined: ${predefinedPinHeights ? 'YES' : 'NO - will generate random'}`);
        
        for (let i = 0; i < this.parent.pinCount; i++) {
            const pinX = 100 + margin + i * pinSpacing;
            const pinY = 200;
            
            // Use predefined pin heights if available, otherwise generate random ones
            let keyPinLength, driverPinLength;
            if (predefinedPinHeights && predefinedPinHeights[i] !== undefined) {
                // Use predefined configuration from scenario keyPins
                keyPinLength = predefinedPinHeights[i];
                driverPinLength = 75 - keyPinLength; // Total height is 75
                console.log(`✓ Pin ${i}: Using scenario keyPin height: ${keyPinLength} (driver: ${driverPinLength})`);
            } else {
                // Generate random pin lengths that add up to 75 (total height - 25% increase from 60)
                keyPinLength = 25 + Math.random() * 37.5; // 25-62.5 (25% increase)
                driverPinLength = 75 - keyPinLength; // Remaining to make 75 total
                console.log(`⚠ Pin ${i}: Generated random pin height: ${keyPinLength} (driver: ${driverPinLength})`);
            }
            
            const pin = {
                index: i,
                binding: bindingOrder[i],
                isSet: false,
                currentHeight: 0,
                originalHeight: keyPinLength, // Store original height for consistency
                keyPinHeight: 0, // Track key pin position separately
                driverPinHeight: 0, // Track driver pin position separately
                keyPinLength: keyPinLength,
                driverPinLength: driverPinLength,
                x: pinX,
                y: pinY,
                container: null,
                keyPin: null,
                driverPin: null,
                spring: null
            };
            
            // Ensure pin properties are valid
            if (!pin.keyPinLength || !pin.driverPinLength) {
                console.error(`Pin ${i} created with invalid lengths:`, pin);
                pin.keyPinLength = pin.keyPinLength || 30; // Default fallback
                pin.driverPinLength = pin.driverPinLength || 45; // Default fallback
            }
            
            // Create pin container
            pin.container = this.parent.scene.add.container(pinX, pinY);
            
            // Add all highlights FIRST (so they appear behind pins)
            // Add hover effect using a highlight rectangle - 25% less wide, full height from spring top to pin bottom (extended down)
            pin.highlight = this.parent.scene.add.graphics();
            pin.highlight.fillStyle(0xffff00, 0.3);
            pin.highlight.fillRect(-22.5, -110, 45, 140);
            pin.highlight.setVisible(false);
            pin.container.add(pin.highlight);
            
            // Add overpicked highlight
            pin.overpickedHighlight = this.parent.scene.add.graphics();
            pin.overpickedHighlight.fillStyle(0xff0000, 0.6);
            pin.overpickedHighlight.fillRect(-22.5, -110, 45, 140);
            pin.overpickedHighlight.setVisible(false);
            pin.container.add(pin.overpickedHighlight);
            
            // Add failure highlight for overpicked set pins
            pin.failureHighlight = this.parent.scene.add.graphics();
            pin.failureHighlight.fillStyle(0xff6600, 0.7);
            pin.failureHighlight.fillRect(-22.5, -110, 45, 140);
            pin.failureHighlight.setVisible(false);
            pin.container.add(pin.failureHighlight);
            
            // Create spring (top part) - 12 segments with correct initial spacing
            pin.spring = this.parent.scene.add.graphics();
            pin.spring.fillStyle(0x666666);
            const springTop = -130;
            const springBottom = -50; // Driver pin top when not lifted
            const springHeight = springBottom - springTop;
            
            // Calculate total spring space and distribute segments evenly
            const totalSpringSpace = springHeight;
            const segmentSpacing = totalSpringSpace / 11; // 11 gaps between 12 segments
            
            for (let s = 0; s < 12; s++) {
                const segmentY = springTop + (s * segmentSpacing);
                pin.spring.fillRect(-12, segmentY, 24, 4);
            }
            pin.container.add(pin.spring);
            
            // Create driver pin (middle part) - starts at y=-50
            pin.driverPin = this.parent.scene.add.graphics();
            pin.driverPin.fillStyle(0x3388dd);
            pin.driverPin.fillRect(-12, -50, 24, driverPinLength);
            pin.container.add(pin.driverPin);
            
            // Set container depth to ensure driver pins are above circles
            pin.container.setDepth(2);
            
            // Create key pin (bottom part) - starts below driver pin with triangular bottom
            pin.keyPin = this.parent.scene.add.graphics();
            pin.keyPin.fillStyle(0xdd3333);
            
            // Draw rectangular part of key pin
            pin.keyPin.fillRect(-12, -50 + driverPinLength, 24, keyPinLength - 8);
            
            // Draw triangular bottom in pixel art style
            pin.keyPin.fillRect(-12, -50 + driverPinLength + keyPinLength - 8, 24, 2);
            pin.keyPin.fillRect(-10, -50 + driverPinLength + keyPinLength - 6, 20, 2);
            pin.keyPin.fillRect(-8, -50 + driverPinLength + keyPinLength - 4, 16, 2);
            pin.keyPin.fillRect(-6, -50 + driverPinLength + keyPinLength - 2, 12, 2);
            
            pin.container.add(pin.keyPin);
            
            // Add labels for pin components (only for the first pin to avoid clutter)
            if (i === 0) {
                // Spring label
                const springLabel = this.parent.scene.add.text(pinX, pinY - 140, 'Spring', {
                    fontSize: '18px',
                    fontFamily: 'VT323',
                    fill: '#00ff00',
                    fontWeight: 'bold'
                });
                springLabel.setOrigin(0.5);
                springLabel.setDepth(100); // Bring to front
                
                // Driver pin label - positioned below the shear line
                const driverPinX = 100 + margin + 1 * pinSpacing; // Pin index 1 (2nd pin)
                const driverPinLabel = this.parent.scene.add.text(driverPinX, pinY - 35, 'Driver Pin', {
                    fontSize: '18px',
                    fontFamily: 'VT323',
                    fill: '#00ff00',
                    fontWeight: 'bold'
                });
                driverPinLabel.setOrigin(0.5);
                driverPinLabel.setDepth(100); // Bring to front
                
                // Key pin label - positioned at the middle of the key pin
                const keyPinX = 100 + margin + 2 * pinSpacing; // Pin index 2 (3rd pin)
                const keyPinLabel = this.parent.scene.add.text(keyPinX, pinY - 50 + driverPinLength + (keyPinLength / 2), 'Key Pin', {
                    fontSize: '18px',
                    fontFamily: 'VT323',
                    fill: '#00ff00',
                    fontWeight: 'bold'
                });
                keyPinLabel.setOrigin(0.5);
                keyPinLabel.setDepth(100); // Bring to front
                
                // Store references to labels for hiding
                this.parent.springLabel = springLabel;
                this.parent.driverPinLabel = driverPinLabel;
                this.parent.keyPinLabel = keyPinLabel;
            }
            
            // Create channel rectangle (keyway for this pin) - above cylinder but behind key pins
            const shearLineY = -45; // Shear line position
            const keywayTopY = 200; // Top of the main keyway
            const channelHeight = keywayTopY - (pinY + shearLineY); // From keyway to shear line
            
            // Create channel rectangle graphics
            pin.channelRect = this.parent.scene.add.graphics();
            pin.channelRect.x = pinX;
            pin.channelRect.y = pinY + shearLineY - 15; // Start at circle start position (20px above shear line)
            pin.channelRect.fillStyle(0x2a2a2a, 1); // Same color as keyway
            pin.channelRect.fillRect(-13, 3, 26, channelHeight + 15 - 3); // 3px margin except at shear line
            pin.channelRect.setDepth(0); // Behind key pins but above cylinder
            
            // Add border to match keyway style
            pin.channelRect.lineStyle(1, 0x1a1a1a);
            pin.channelRect.strokeRect(-13, 3, 26, channelHeight + 20 - 3);
            
            // Create spring channel rectangle - behind spring, above cylinder
            const springChannelHeight = springBottom - springTop; // Spring height
            
            // Create spring channel rectangle graphics
            pin.springChannelRect = this.parent.scene.add.graphics();
            pin.springChannelRect.x = pinX;
            pin.springChannelRect.y = pinY + springTop; // Start at spring top
            pin.springChannelRect.fillStyle(0x2a2a2a, 1); // Same color as keyway
            pin.springChannelRect.fillRect(-13, 3, 26, springChannelHeight - 3); // 3px margin except at shear line
            pin.springChannelRect.setDepth(1); // Behind spring but above cylinder
            
            // Add border to match keyway style
            pin.springChannelRect.lineStyle(1, 0x1a1a1a);
            pin.springChannelRect.strokeRect(-13, 3, 26, springChannelHeight - 3);
            
            // Make pin interactive - 25% less wide, full height from spring top to bottom of keyway (extended down)
            pin.container.setInteractive(new Phaser.Geom.Rectangle(-18.75, -110, 37.5, 230), Phaser.Geom.Rectangle.Contains);
            
            // Add pin number
            const pinText = this.parent.scene.add.text(0, 40, (i + 1).toString(), {
                fontSize: '18px',
                fontFamily: 'VT323',
                fill: '#ffffff',
                fontWeight: 'bold'
            });
            pinText.setOrigin(0.5);
            pin.container.add(pinText);
            
            // Store reference to pin text for hiding
            pin.pinText = pinText;
            
            pin.container.on('pointerover', () => {
                if (this.parent.lockState.tensionApplied && !pin.isSet) {
                    pin.highlight.setVisible(true);
                }
            });
            
            pin.container.on('pointerout', () => {
                pin.highlight.setVisible(false);
            });
            
            // Add event handlers
            pin.container.on('pointerdown', () => {
                console.log('Pin clicked:', pin.index);
                this.parent.lockState.currentPin = pin;
                this.parent.gameState.mouseDown = true;
                console.log('Pin interaction started');
                
                // Play click sound with slight random pitch variation
                if (this.parent.sounds.click) {
                    this.parent.sounds.click.play({ detune: Math.random() * 200 - 100 });
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }

                // Hide labels on first pin click
                if (!this.parent.pinClicked) {
                    this.parent.pinClicked = true;
                    if (this.parent.wrenchText) {
                        this.parent.wrenchText.setVisible(false);
                    }
                    if (this.parent.shearLineText) {
                        this.parent.shearLineText.setVisible(false);
                    }
                    if (this.parent.hookPickLabel) {
                        this.parent.hookPickLabel.setVisible(false);
                    }
                    if (this.parent.springLabel) {
                        this.parent.springLabel.setVisible(false);
                    }
                    if (this.parent.driverPinLabel) {
                        this.parent.driverPinLabel.setVisible(false);
                    }
                    if (this.parent.keyPinLabel) {
                        this.parent.keyPinLabel.setVisible(false);
                    }
                    
                    // Hide all pin numbers
                    this.parent.pins.forEach(pin => {
                        if (pin.pinText) {
                            pin.pinText.setVisible(false);
                        }
                    });
                }
                
                if (!this.parent.lockState.tensionApplied) {
                    this.parent.keyInsertion.updateFeedback("Apply tension first before picking pins");
                    this.parent.toolMgr.flashWrenchRed();
                }
            });
            
            this.parent.pins.push(pin);
        }
        
        // Save the lock configuration after all pins are created
        this.parent.lockConfig.saveLockConfiguration();
    }

    createShearLine() {
        // Create a more visible shear line at y=155 (which is -45 in pin coordinates)
        const graphics = this.parent.scene.add.graphics();
        graphics.lineStyle(3, 0x00ff00);
        graphics.beginPath();
        graphics.moveTo(100, 155);
        graphics.lineTo(500, 155);
        graphics.strokePath();
        
        // Add a dashed line effect
        graphics.lineStyle(1, 0x00ff00, 0.5);
        for (let x = 100; x < 500; x += 10) {
            graphics.beginPath();
            graphics.moveTo(x, 150);
            graphics.lineTo(x, 160);
            graphics.strokePath();
        }
        
        // Add shear line label
        const shearLineText = this.parent.scene.add.text(430, 135, 'SHEAR LINE', {
            fontSize: '16px',
            fontFamily: 'VT323',
            fill: '#00ff00',
            fontWeight: 'bold'
        });
        shearLineText.setDepth(100); // Bring to front
        
        // Store reference to shear line text for hiding
        this.parent.shearLineText = shearLineText;
        
        // // Add instruction text
        // this.scene.add.text(300, 180, 'Align key/driver pins at the shear line', {
        //     fontSize: '12px',
        //     fill: '#00ff00',
        //     fontStyle: 'italic'
        // }).setOrigin(0.5);
    }

    setupInputHandlers() {
        this.parent.scene.input.on('pointerup', () => {
            if (this.parent.lockState.currentPin) {
                this.parent.pinVisuals.checkPinSet(this.parent.lockState.currentPin);
                this.parent.lockState.currentPin = null;
            }
            this.parent.gameState.mouseDown = false;
            
            // Only return hook to resting position if not in key mode
            if (!this.parent.keyMode && this.parent.hookPickGraphics && this.parent.hookConfig) {
                this.parent.toolMgr.returnHookToStart();
            }
            
            // Stop key insertion if in key mode
            if (this.parent.keyMode) {
                this.parent.keyInserting = false;
            }
        });
        
        // Add keyboard bindings
        this.parent.scene.input.keyboard.on('keydown', (event) => {
            const key = event.key;
            
            // Pin number keys (1-8)
            if (key >= '1' && key <= '8') {
                const pinIndex = parseInt(key) - 1; // Convert 1-8 to 0-7
                
                // Check if pin exists
                if (pinIndex < this.parent.pinCount) {
                    const pin = this.parent.pins[pinIndex];
                    if (pin) {
                        // Simulate pin click
                        this.parent.lockState.currentPin = pin;
                        this.parent.gameState.mouseDown = true;
                        
                        // Play click sound with slight random pitch variation
                        if (this.parent.sounds.click) {
                            this.parent.sounds.click.play({ detune: Math.random() * 200 - 100 });
                            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                navigator.vibrate(50);
                            }
                        }
                        
                        // Hide labels on first pin click
                        if (!this.parent.pinClicked) {
                            this.parent.pinClicked = true;
                            if (this.parent.wrenchText) {
                                this.parent.wrenchText.setVisible(false);
                            }
                            if (this.parent.shearLineText) {
                                this.parent.shearLineText.setVisible(false);
                            }
                            if (this.parent.hookPickLabel) {
                                this.parent.hookPickLabel.setVisible(false);
                            }
                            if (this.parent.springLabel) {
                                this.parent.springLabel.setVisible(false);
                            }
                            if (this.parent.driverPinLabel) {
                                this.parent.driverPinLabel.setVisible(false);
                            }
                            if (this.parent.keyPinLabel) {
                                this.parent.keyPinLabel.setVisible(false);
                            }
                            
                            // Hide all pin numbers
                            this.parent.pins.forEach(pin => {
                                if (pin.pinText) {
                                    pin.pinText.setVisible(false);
                                }
                            });
                        }
                        
                        if (!this.parent.lockState.tensionApplied) {
                            this.parent.keyInsertion.updateFeedback("Apply tension first before picking pins");
                            this.parent.toolMgr.flashWrenchRed();
                        }
                    }
                }
            }
            
            // SPACE key for tension wrench toggle
            if (key === ' ') {
                event.preventDefault(); // Prevent page scroll
                
                // Simulate tension wrench click
                this.parent.lockState.tensionApplied = !this.parent.lockState.tensionApplied;

                // Play tension on apply, reset on release (not both)
                if (this.parent.lockState.tensionApplied) {
                    if (this.parent.sounds.tension) {
                        this.parent.sounds.tension.play();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([200]);
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
                
                this.updateBindingPins();
            }
        });
        
        // Add keyboard release handler for pin keys
        this.parent.scene.input.keyboard.on('keyup', (event) => {
            const key = event.key;
            
            // Pin number keys (1-8)
            if (key >= '1' && key <= '8') {
                const pinIndex = parseInt(key) - 1; // Convert 1-8 to 0-7
                
                // Check if pin exists and is currently being held
                if (pinIndex < this.parent.pinCount && this.parent.lockState.currentPin && this.parent.lockState.currentPin.index === pinIndex) {
                    this.parent.pinVisuals.checkPinSet(this.parent.lockState.currentPin);
                    this.parent.lockState.currentPin = null;
                    this.parent.gameState.mouseDown = false;
                    
                    // Return hook to resting position
                    if (this.parent.hookPickGraphics && this.parent.hookConfig) {
                        this.parent.toolMgr.returnHookToStart();
                    }
                }
            }
        });
        
        // Add key interaction handlers if in key mode
        if (this.parent.keyMode && this.parent.keyClickZone) {
            console.log('Setting up key click handler...');
            this.parent.keyClickZone.on('pointerdown', (pointer) => {
                console.log('Key clicked! Event triggered.');
                // Prevent this event from bubbling up to global handlers
                pointer.event.stopPropagation();
                
                if (!this.parent.keyInserting) {
                    console.log('Starting key insertion animation...');
                    this.parent.keyOps.startKeyInsertion();
                } else {
                    console.log('Key insertion already in progress, ignoring click.');
                }
            });
        } else {
            console.log('Key mode or click zone not available:', { keyMode: this.parent.keyMode, hasClickZone: !!this.parent.keyClickZone });
        }
    }

    liftPin() {
        if (!this.parent.lockState.currentPin || !this.parent.gameState.mouseDown) return;
        
        const pin = this.parent.lockState.currentPin;
        const liftSpeed = this.parent.liftSpeed;
        const shearLineY = -45;

        // If pin is set and not already overpicked, allow key pin to move up, driver pin stays at SL
        if (pin.isSet && !pin.isOverpicked) {
            // Move key pin up gradually from its dropped position (slower when not connected to driver pin)
            const keyPinLiftSpeed = liftSpeed * 0.5; // Half speed for key pin movement
            // Key pin should stop when its top surface reaches the shear line
            // The key pin's top is at: -50 + pin.driverPinLength - pin.keyPinHeight
            // We want this to equal -45 (shear line)
            // So: -50 + pin.driverPinLength - pin.keyPinHeight = -45
            // Therefore: pin.keyPinHeight = pin.driverPinLength - 5
            const maxKeyPinHeight = pin.driverPinLength - 5; // Top of key pin at shear line
            pin.keyPinHeight = Math.min(pin.keyPinHeight + keyPinLiftSpeed, maxKeyPinHeight);
            
            // If key pin reaches driver pin, start overpicking timer
            if (pin.keyPinHeight >= maxKeyPinHeight) { // Key pin top at shear line
                // Start overpicking timer if not already started
                if (!pin.overpickingTimer) {
                    pin.overpickingTimer = Date.now();
                    this.parent.keyInsertion.updateFeedback("Key pin at shear line. Release now or continue to overpick...");
                }
                
                // Check if 500ms have passed since reaching shear line
                if (Date.now() - pin.overpickingTimer >= 500) {
                                    // Both move up together
                pin.isOverpicked = true;
                pin.keyPinHeight = 90; // Move both up above SL
                pin.driverPinHeight = 90; // Driver pin moves up too
                
                // Play overpicking sound
                if (this.parent.sounds.overtension) {
                    this.parent.sounds.overtension.play();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }

                }
                
                // Mark as overpicked and stuck
                this.parent.keyInsertion.updateFeedback("Set pin overpicked! Release tension to reset.");
                    if (!pin.failureHighlight) {
                        pin.failureHighlight = this.parent.scene.add.graphics();
                        pin.failureHighlight.fillStyle(0xff6600, 0.7);
                        pin.failureHighlight.fillRect(-22.5, -110, 45, 140);
                        pin.container.add(pin.failureHighlight);
                    }
                    pin.failureHighlight.setVisible(true);
                    if (pin.setHighlight) pin.setHighlight.setVisible(false);
                }
            }

            // Draw key pin (rectangular part) - move gradually from dropped position
            pin.keyPin.clear();
            pin.keyPin.fillStyle(0xdd3333);
            // Calculate key pin position based on keyPinHeight (gradual movement from dropped position)
            const keyPinY = -50 + pin.driverPinLength - pin.keyPinHeight;
            pin.keyPin.fillRect(-12, keyPinY, 24, pin.keyPinLength - 8);
            // Draw triangle
            pin.keyPin.fillRect(-12, keyPinY + pin.keyPinLength - 8, 24, 2);
            pin.keyPin.fillRect(-10, keyPinY + pin.keyPinLength - 6, 20, 2);
            pin.keyPin.fillRect(-8, keyPinY + pin.keyPinLength - 4, 16, 2);
            pin.keyPin.fillRect(-6, keyPinY + pin.keyPinLength - 2, 12, 2);
            // Draw driver pin at shear line (stays at SL until overpicked)
            pin.driverPin.clear();
            pin.driverPin.fillStyle(0x3388dd);
            const shearLineY = -45;
            const driverPinY = shearLineY - pin.driverPinLength; // Driver pin bottom at shear line
            pin.driverPin.fillRect(-12, driverPinY, 24, pin.driverPinLength);
            // Spring
            pin.spring.clear();
            pin.spring.fillStyle(0x666666);
            const springTop = -130;
            const springBottom = shearLineY - pin.driverPinLength; // Driver pin top (at shear line)
            const springHeight = springBottom - springTop;
            const totalSpringSpace = springHeight;
            const segmentSpacing = totalSpringSpace / 11;
            for (let s = 0; s < 12; s++) {
                const segmentHeight = 4 * 0.3;
                const segmentY = springTop + (s * segmentSpacing);
                if (segmentY + segmentHeight <= springBottom) {
                    pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
                }
            }
            // Continue lifting if mouse is still down
            if (this.parent.gameState.mouseDown && !pin.isOverpicked) {
                requestAnimationFrame(() => this.liftPin());
            }
            return; // Exit early for set pins - don't run normal lifting logic
        }

        // Existing overpicking and normal lifting logic follows...
        // Check for overpicking when tension is applied (for binding pins and set pins)
        if (this.parent.lockState.tensionApplied && (this.parent.gameUtil.shouldPinBind(pin) || pin.isSet)) {
            // For set pins, use keyPinHeight; for normal pins, use currentHeight
            const heightToCheck = pin.isSet ? pin.keyPinHeight : pin.currentHeight;
            const boundaryPosition = -50 + pin.driverPinLength - heightToCheck;
            
            // If key pin is pushed too far beyond shear line, it gets stuck
            if (boundaryPosition < shearLineY - 10) {
                // Check if this pin being overpicked would prevent automatic success
                // If all other pins are correctly positioned, don't allow overpicking
                let otherPinsCorrect = true;
                this.parent.pins.forEach(otherPin => {
                    if (otherPin !== pin && !otherPin.isOverpicked) {
                        const otherBoundaryPosition = -50 + otherPin.driverPinLength - otherPin.currentHeight;
                        const otherDistanceToShearLine = Math.abs(otherBoundaryPosition - shearLineY);
                        if (otherDistanceToShearLine > 8) {
                            otherPinsCorrect = false;
                        }
                    }
                });
                
                // If other pins are correct and this pin is being actively moved, prevent overpicking
                if (otherPinsCorrect && this.parent.gameState.mouseDown) {
                    // Stop the pin from moving further up but don't mark as overpicked
                    if (pin.isSet) {
                        const maxKeyPinHeight = pin.driverPinLength - 5; // Top of key pin at shear line
                        pin.keyPinHeight = Math.min(pin.keyPinHeight, maxKeyPinHeight);
                    } else {
                        // Use pin-specific maximum height for overpicking prevention
                        const baseMaxHeight = 75;
                        const maxHeightReduction = 15;
                        const pinHeightFactor = pin.index / (this.parent.pinCount - 1);
                        const pinMaxHeight = baseMaxHeight - (maxHeightReduction * pinHeightFactor);
                        pin.currentHeight = Math.min(pin.currentHeight, pinMaxHeight);
                    }
                    return;
                }
                
                // Otherwise, allow normal overpicking behavior
                pin.isOverpicked = true;
                
                // Play overpicking sound
                if (this.parent.sounds.overtension) {
                    this.parent.sounds.overtension.play();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }
                }
                
                if (pin.isSet) {
                    this.parent.keyInsertion.updateFeedback("Set pin overpicked! Release tension to reset.");
                    
                    // Show failure highlight for overpicked set pins
                    if (!pin.failureHighlight) {
                        pin.failureHighlight = this.parent.scene.add.graphics();
                        pin.failureHighlight.fillStyle(0xff6600, 0.7);
                        pin.failureHighlight.fillRect(-22.5, -110, 45, 140);
                        pin.container.add(pin.failureHighlight);
                    }
                    pin.failureHighlight.setVisible(true);
                    
                    // Hide set highlight
                    if (pin.setHighlight) pin.setHighlight.setVisible(false);
                } else {
                    this.parent.keyInsertion.updateFeedback("Pin overpicked! Release tension to reset.");
                    
                    // Show overpicked highlight for regular pins
                    if (!pin.overpickedHighlight) {
                        pin.overpickedHighlight = this.parent.scene.add.graphics();
                        pin.overpickedHighlight.fillStyle(0xff0000, 0.6);
                        pin.overpickedHighlight.fillRect(-22.5, -110, 45, 140);
                        pin.container.add(pin.overpickedHighlight);
                    }
                    pin.overpickedHighlight.setVisible(true);
                }
                
                // Don't return - allow further pushing even when overpicked
            }
        }
        
        // Calculate pin-specific maximum height (further pins have less upward movement)
        const baseMaxHeight = 75; // Base maximum height for closest pin
        const maxHeightReduction = 15; // Maximum reduction for furthest pin
        const pinHeightFactor = pin.index / (this.parent.pinCount - 1); // 0 for first pin, 1 for last pin
        const pinMaxHeight = baseMaxHeight - (maxHeightReduction * pinHeightFactor);
        
        pin.currentHeight = Math.min(pin.currentHeight + liftSpeed, pinMaxHeight); 
        
        // Update visual - both pins move up together toward the spring
        pin.keyPin.clear();
        pin.keyPin.fillStyle(0xdd3333);
        
        // Draw rectangular part of key pin
        pin.keyPin.fillRect(-12, -50 + pin.driverPinLength - pin.currentHeight, 24, pin.keyPinLength - 8);
                
        // Update hook position to follow any moving pin
        if (pin.currentHeight > 0) {
            this.parent.hookMech.updateHookPosition(pin.index);
        }
        
        // Draw triangular bottom in pixel art style
        pin.keyPin.fillRect(-12, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 8, 24, 2);
        pin.keyPin.fillRect(-10, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 6, 20, 2);
        pin.keyPin.fillRect(-8, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 4, 16, 2);
        pin.keyPin.fillRect(-6, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 2, 12, 2);
        
        pin.driverPin.clear();
        pin.driverPin.fillStyle(0x3388dd);
        pin.driverPin.fillRect(-12, -50 - pin.currentHeight, 24, pin.driverPinLength);
        
        // Spring compresses as pins push up (segments get shorter and closer together)
        pin.spring.clear();
        pin.spring.fillStyle(0x666666);
        const springCompression = pin.currentHeight;
        const compressionFactor = Math.max(0.3, 1 - (springCompression / 60)); // Segments get shorter, minimum 30% size (1.2px)
        
        // Fixed spring top position
        const springTop = -130;
        // Spring bottom follows driver pin top
        const driverPinTop = -50 - pin.currentHeight;
        const springBottom = driverPinTop;
        const springHeight = springBottom - springTop;
        
        // Calculate total spring space and distribute segments evenly
        const totalSpringSpace = springHeight;
        const segmentSpacing = totalSpringSpace / 11; // 11 gaps between 12 segments - keep consistent spacing
        
        for (let s = 0; s < 12; s++) {
            const segmentHeight = 4 * compressionFactor;
            const segmentY = springTop + (s * segmentSpacing);
            
            if (segmentY + segmentHeight <= springBottom) { // Only show segments within spring bounds
                pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
            }
        }
        
        // Check if the key/driver boundary is at the shear line (much higher position)
        const boundaryPosition = -50 + pin.driverPinLength - pin.currentHeight;
        const distanceToShearLine = Math.abs(boundaryPosition - shearLineY);
        
        // Calculate threshold based on sensitivity (same as pin setting logic)
        const baseThreshold = 8;
        const sensitivityFactor = (9 - this.parent.thresholdSensitivity) / 8; // Updated for 1-8 range
        const threshold = baseThreshold * sensitivityFactor;
        
        if (distanceToShearLine < threshold && this.parent.highlightPinAlignment) {
            // Show green highlight when boundary is at shear line (only if alignment highlighting is enabled)
            if (!pin.shearHighlight) {
                pin.shearHighlight = this.parent.scene.add.graphics();
                pin.shearHighlight.fillStyle(0x00ff00, 0.4);
                pin.shearHighlight.fillRect(-22.5, -110, 45, 140);
                pin.container.addAt(pin.shearHighlight, 0); // Add at beginning to appear behind pins
            }
            
            // Check if highlight is transitioning from hidden to visible
            const wasHidden = !pin.shearHighlight.visible;
            pin.shearHighlight.setVisible(true);
            
            // Play feedback when pin first reaches the shear line
            // Use a quieter, lower-pitched version of the "set" sound as a hint
            if (wasHidden) {
                if (this.parent.sounds.set) {
                    this.parent.sounds.set.play({ volume: 0.35, rate: 0.7 });
                }
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(100);
                }
            }
        } else {
            if (pin.shearHighlight) {
                pin.shearHighlight.setVisible(false);
            }
        }
    }

    applyGravity() {
        // When tension is not applied, all pins fall back down (except overpicked ones)
        // Also, pins that are not binding fall back down even with tension
        this.parent.pins.forEach(pin => {
            const shouldFall = !this.parent.lockState.tensionApplied || (!this.parent.gameUtil.shouldPinBind(pin) && !pin.isSet);
            if (pin.currentHeight > 0 && !pin.isOverpicked && shouldFall) {
                pin.currentHeight = Math.max(0, pin.currentHeight - 2.25); // Fall faster than lift (25% slower: 2.25 instead of 3)
                
                        // Update visual
        pin.keyPin.clear();
        pin.keyPin.fillStyle(0xdd3333);
        
        // Draw rectangular part of key pin
        pin.keyPin.fillRect(-12, -50 + pin.driverPinLength - pin.currentHeight, 24, pin.keyPinLength - 8);
        
                        // Update hook position to follow any moving pin
                this.parent.hookMech.updateHookPosition(pin.index);
                
                // Draw triangular bottom in pixel art style
                pin.keyPin.fillRect(-12, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 8, 24, 2);
                pin.keyPin.fillRect(-10, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 6, 20, 2);
                pin.keyPin.fillRect(-8, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 4, 16, 2);
                pin.keyPin.fillRect(-6, -50 + pin.driverPinLength - pin.currentHeight + pin.keyPinLength - 2, 12, 2);
                
                pin.driverPin.clear();
                pin.driverPin.fillStyle(0x3388dd);
                pin.driverPin.fillRect(-12, -50 - pin.currentHeight, 24, pin.driverPinLength);
                
                // Spring decompresses as pins fall
                pin.spring.clear();
                pin.spring.fillStyle(0x666666);
                const springCompression = pin.currentHeight;
                const compressionFactor = Math.max(0.3, 1 - (springCompression / 60)); // Segments get shorter, minimum 30% size (1.2px)
                
                // Fixed spring top position
                const springTop = -130;
                // Spring bottom follows driver pin top
                const driverPinTop = -50 - pin.currentHeight;
                const springBottom = driverPinTop;
                const springHeight = springBottom - springTop;
                
                // Calculate total spring space and distribute segments evenly
                const totalSpringSpace = springHeight;
                const segmentSpacing = totalSpringSpace / 11; // 11 gaps between 12 segments - keep consistent spacing
                
                for (let s = 0; s < 12; s++) {
                    const segmentHeight = 4 * compressionFactor;
                    const segmentY = springTop + (s * segmentSpacing);
                    
                    if (segmentY + segmentHeight <= springBottom) { // Only show segments within spring bounds
                        pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
                    }
                }
                
                // Hide highlights when falling
                if (pin.shearHighlight) pin.shearHighlight.setVisible(false);
                if (pin.setHighlight) pin.setHighlight.setVisible(false);
                if (pin.bindingHighlight) pin.bindingHighlight.setVisible(false);
                if (pin.overpickedHighlight) pin.overpickedHighlight.setVisible(false);
                if (pin.failureHighlight) pin.failureHighlight.setVisible(false);
            } else if (pin.isSet && shouldFall) {
                // Set pins fall back down when tension is released
                pin.isSet = false;
                pin.keyPinHeight = 0;
                pin.driverPinHeight = 0;
                pin.currentHeight = 0;
                
                // Reset visual to original position
                pin.keyPin.clear();
                pin.keyPin.fillStyle(0xdd3333);
                pin.keyPin.fillRect(-12, -50 + pin.driverPinLength, 24, pin.keyPinLength - 8);
                pin.keyPin.fillRect(-12, -50 + pin.driverPinLength + pin.keyPinLength - 8, 24, 2);
                pin.keyPin.fillRect(-10, -50 + pin.driverPinLength + pin.keyPinLength - 6, 20, 2);
                pin.keyPin.fillRect(-8, -50 + pin.driverPinLength + pin.keyPinLength - 4, 16, 2);
                pin.keyPin.fillRect(-6, -50 + pin.driverPinLength + pin.keyPinLength - 2, 12, 2);
                
                pin.driverPin.clear();
                pin.driverPin.fillStyle(0x3388dd);
                pin.driverPin.fillRect(-12, -50, 24, pin.driverPinLength);
                
                // Reset spring
                pin.spring.clear();
                pin.spring.fillStyle(0x666666);
                const springTop = -130;
                const springBottom = -50;
                const springHeight = springBottom - springTop;
                const segmentSpacing = springHeight / 11;
                for (let s = 0; s < 12; s++) {
                    const segmentHeight = 4;
                    const segmentY = springTop + (s * segmentSpacing);
                    pin.spring.fillRect(-12, segmentY, 24, segmentHeight);
                }
                
                // Hide set highlight
                if (pin.setHighlight) pin.setHighlight.setVisible(false);
            }
        });
    }

    checkAllPinsCorrect() {
        const shearLineY = -45;
        const threshold = 8; // Same threshold as individual pin checking
        
        let allCorrect = true;
        
        this.parent.pins.forEach(pin => {
            if (pin.isOverpicked) {
                allCorrect = false;
                return;
            }
            
            // Calculate current boundary position between key and driver pins
            const boundaryPosition = -50 + pin.driverPinLength - pin.currentHeight;
            const distanceToShearLine = Math.abs(boundaryPosition - shearLineY);
            
            // Check if driver pin is above shear line and key pin is below
            const driverPinBottom = boundaryPosition;
            const keyPinTop = boundaryPosition;
            
            // Driver pin should be above shear line, key pin should be below
            if (driverPinBottom > shearLineY + threshold || keyPinTop < shearLineY - threshold) {
                allCorrect = false;
            }
        });
        
        // If all pins are correctly positioned, set them all and complete the lock
        if (allCorrect && this.parent.lockState.pinsSet < this.parent.pinCount) {
            this.parent.pins.forEach(pin => {
                if (!pin.isSet) {
                    pin.isSet = true;
                    
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
                }
            });
            
            this.parent.lockState.pinsSet = this.parent.pinCount;
            this.parent.keyInsertion.updateFeedback("All pins correctly positioned! Lock picked successfully!");
            this.parent.keyAnim.lockPickingSuccess();
        }
    }

    updateBindingPins() {
        if (!this.parent.lockState.tensionApplied || !this.parent.highlightBindingOrder) {
            this.parent.pins.forEach(pin => {
                // Hide binding highlight
                if (pin.bindingHighlight) {
                    pin.bindingHighlight.setVisible(false);
                }
            });
            return;
        }
        
        // Find the next unset pin in binding order
        for (let order = 0; order < this.parent.pinCount; order++) {
            const nextPin = this.parent.pins.find(p => p.binding === order && !p.isSet);
            if (nextPin) {
                this.parent.pins.forEach(pin => {
                    if (pin.index === nextPin.index && !pin.isSet) {
                        // Show binding highlight for next pin
                        if (!pin.bindingHighlight) {
                            pin.bindingHighlight = this.parent.scene.add.graphics();
                            pin.bindingHighlight.fillStyle(0xffff00, 0.6);
                            pin.bindingHighlight.fillRect(-22.5, -110, 45, 140);
                            pin.container.addAt(pin.bindingHighlight, 0); // Add at beginning to appear behind pins
                        }
                        pin.bindingHighlight.setVisible(true);
                    } else if (!pin.isSet) {
                        // Hide binding highlight for other pins
                        if (pin.bindingHighlight) {
                            pin.bindingHighlight.setVisible(false);
                        }
                    }
                });
                return;
            }
        }
        
        // All pins set
        this.parent.pins.forEach(pin => {
            if (!pin.isSet && pin.bindingHighlight) {
                pin.bindingHighlight.setVisible(false);
            }
        });
    }

    resetAllPins() {
        this.parent.pins.forEach(pin => {
            if (!pin.isSet) {
                pin.currentHeight = 0;
                pin.isOverpicked = false; // Reset overpicked state
                pin.keyPinHeight = 0; // Reset key pin height
                pin.driverPinHeight = 0; // Reset driver pin height
                
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
                if (pin.bindingHighlight) pin.bindingHighlight.setVisible(false);
            }
        });
    }
    
}
