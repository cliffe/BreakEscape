
/**
 * KeyDataGenerator
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeyDataGenerator(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */

import KeyCutCalculator from '../../utils/key-cut-calculator.js';

export class KeyDataGenerator {
    
    constructor(parent) {
        this.parent = parent;
    }

    generateKeyDataFromPins() {
        // Generate key cuts based on actual pin heights
        // Uses KeyCutCalculator utility for consistent calculation across all code paths
        const keyPinLengths = this.parent.pins
            .slice(0, this.parent.pinCount)
            .map(pin => pin.keyPinLength);
        
        const cuts = KeyCutCalculator.calculateCutDepthsRounded(keyPinLengths);
        
        this.parent.keyData = { cuts: cuts };
        console.log('Generated key data from pins:', this.parent.keyData);
    }
    
}
