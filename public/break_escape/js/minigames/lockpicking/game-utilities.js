
/**
 * GameUtilities
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new GameUtilities(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class GameUtilities {
    
    constructor(parent) {
        this.parent = parent;
    }

    shouldPinBind(pin) {
        if (!this.parent.lockState.tensionApplied) return false;
        
        // Find the next unset pin in binding order
        for (let order = 0; order < this.parent.pinCount; order++) {
            const nextPin = this.parent.pins.find(p => p.binding === order && !p.isSet);
            if (nextPin) {
                return pin.index === nextPin.index;
            }
        }
        return false;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
}
