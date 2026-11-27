
/**
 * LockConfiguration
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new LockConfiguration(this)
 * 
 * All 'this' references replaced with 'parent' to access parent instance state:
 * - parent.pins (array of pin objects)
 * - parent.scene (Phaser scene)
 * - parent.lockId (lock identifier)
 * - parent.lockState (lock state object)
 * etc.
 */
export class LockConfiguration {
    
    constructor(parent) {
        this.parent = parent;
    }

    saveLockConfiguration() {
        // DISABLED: Persistence removed - all locks use keyPins from scenario
        // Pin configurations are now determined solely by the scenario's keyPins property
        console.log(`Lock configuration for ${this.parent.lockId} uses scenario keyPins - no persistence`);
    }

    loadLockConfiguration() {
        // DISABLED: Persistence removed - return null to force use of predefined pins
        // Pin configurations should come from scenario's keyPins passed in params
        return null;
    }

    clearLockConfiguration() {
        // Clear the lock configuration for this lock
        if (window.lockConfigurations[this.parent.lockId]) {
            delete window.lockConfigurations[this.parent.lockId];
            
            // Also remove from localStorage
            try {
                const savedConfigs = localStorage.getItem('lockConfigurations') || '{}';
                const parsed = JSON.parse(savedConfigs);
                delete parsed[this.parent.lockId];
                localStorage.setItem('lockConfigurations', JSON.stringify(parsed));
            } catch (error) {
                console.warn('Failed to clear lock configuration from localStorage:', error);
            }
            
            console.log(`Cleared lock configuration for ${this.parent.lockId}`);
        }
    }

    getLockPinConfiguration() {
        if (!this.parent.pins || this.parent.pins.length === 0) {
            return null;
        }
        
        return {
            pinCount: this.parent.pinCount,
            pinHeights: this.parent.pins.map(pin => pin.originalHeight),
            pinLengths: this.parent.pins.map(pin => ({
                keyPinLength: pin.keyPinLength,
                driverPinLength: pin.driverPinLength
            }))
        };
    }

    clearAllLockConfigurations() {
        // Clear all lock configurations (useful for testing)
        window.lockConfigurations = {};
        
        // Also clear from localStorage
        try {
            localStorage.removeItem('lockConfigurations');
        } catch (error) {
            console.warn('Failed to clear all lock configurations from localStorage:', error);
        }
        
        console.log('Cleared all lock configurations');
    }

    resetPinsToOriginalPositions() {
        // Reset all pins to their original positions (before any key insertion)
        this.parent.pins.forEach(pin => {
            pin.currentHeight = 0;
            pin.isSet = false;
            
            // Clear any highlights
            if (pin.shearHighlight) {
                pin.shearHighlight.setVisible(false);
            }
            if (pin.setHighlight) {
                pin.setHighlight.setVisible(false);
            }
            
            // Update pin visuals
            this.parent.pinVisuals.updatePinVisuals(pin);
        });
        
        console.log('Reset all pins to original positions');
    }
    
}
