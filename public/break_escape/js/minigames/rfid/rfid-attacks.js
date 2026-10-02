/**
 * MIFARE Attack Manager
 *
 * Handles MIFARE Classic key attacks:
 * - Dictionary Attack: Try common keys (instant)
 * - Darkside Attack: Crack keys from scratch (30 sec)
 * - Nested Attack: Crack remaining keys when one is known (10 sec)
 *
 * @module rfid-attacks
 */

import { MIFARE_COMMON_KEYS, ATTACK_DURATIONS } from './rfid-protocols.js';

export class MIFAREAttackManager {
    constructor() {
        this.activeAttacks = new Map();
        console.log('🔓 MIFAREAttackManager initialized');
    }

    /**
     * Dictionary attack - protocol-aware success rates
     * Tries common keys against all 16 sectors
     * @param {string} uid - Card UID
     * @param {Object} existingKeys - Already known keys {sector: {keyA, keyB}}
     * @param {string} protocol - Protocol name (determines success rate)
     * @returns {Object} {success, foundKeys, newKeysFound, message}
     */
    dictionaryAttack(uid, existingKeys = {}, protocol) {
        console.log(`🔓 Dictionary attack on ${uid} (${protocol})`);

        const foundKeys = { ...existingKeys };
        let newKeysFound = 0;

        // Success rate based on protocol
        // Weak defaults: 95% (most sectors use factory default)
        // Custom keys: 0% (no default keys)
        const successRate = protocol === 'MIFARE_Classic_Weak_Defaults' ? 0.95 : 0.0;

        for (let sector = 0; sector < 16; sector++) {
            if (foundKeys[sector]) continue;

            if (Math.random() < successRate) {
                foundKeys[sector] = {
                    keyA: MIFARE_COMMON_KEYS[0], // FFFFFFFFFFFF (factory default)
                    keyB: MIFARE_COMMON_KEYS[0]
                };
                newKeysFound++;
            }
        }

        return {
            success: newKeysFound > 0,
            foundKeys: foundKeys,
            newKeysFound: newKeysFound,
            message: this.getDictionaryMessage(newKeysFound, protocol)
        };
    }

    /**
     * Get message for dictionary attack result
     * @param {number} found - Number of sectors found
     * @param {string} protocol - Protocol name
     * @returns {string} Message text
     */
    getDictionaryMessage(found, protocol) {
        if (found === 16) {
            return '🔓 All sectors use factory defaults!';
        } else if (found > 0) {
            return `🔓 Found ${found} sectors with default keys`;
        } else if (protocol === 'MIFARE_Classic_Weak_Defaults') {
            return '⚠️ Some sectors have custom keys - try Nested attack';
        } else {
            return '⚠️ No default keys - use Darkside attack';
        }
    }

    /**
     * Darkside attack - crack all keys from scratch
     * Exploits crypto weakness to brute force sector keys
     * Duration varies based on protocol (weak defaults crack faster)
     * @param {string} uid - Card UID
     * @param {Function} progressCallback - Progress update callback
     * @param {string} protocol - Protocol name
     * @returns {Promise<Object>} {success, foundKeys, message}
     */
    async startDarksideAttack(uid, progressCallback, protocol) {
        console.log(`🔓 Darkside attack on ${uid}`);

        // Weak defaults crack faster (10 sec vs 30 sec)
        const duration = protocol === 'MIFARE_Classic_Weak_Defaults' ?
            ATTACK_DURATIONS.darksideWeak : ATTACK_DURATIONS.darkside;

        return new Promise((resolve) => {
            const attack = {
                type: 'darkside',
                uid: uid,
                protocol: protocol,
                foundKeys: {},
                startTime: Date.now()
            };

            this.activeAttacks.set(uid, attack);

            const updateInterval = 500; // Update every 500ms
            let elapsed = 0;

            const interval = setInterval(() => {
                elapsed += updateInterval;
                const progress = Math.min(100, (elapsed / duration) * 100);
                const currentSector = Math.floor((progress / 100) * 16);

                // Add keys progressively
                for (let i = 0; i < currentSector; i++) {
                    if (!attack.foundKeys[i]) {
                        attack.foundKeys[i] = {
                            keyA: this.generateRandomKey(),
                            keyB: this.generateRandomKey()
                        };
                    }
                }

                if (progressCallback) {
                    progressCallback({
                        progress: progress,
                        currentSector: currentSector,
                        foundKeys: attack.foundKeys,
                        totalSectors: 16,
                        elapsed: elapsed,
                        duration: duration
                    });
                }

                if (progress >= 100) {
                    clearInterval(interval);

                    // Ensure all 16 sectors are complete
                    for (let i = 0; i < 16; i++) {
                        if (!attack.foundKeys[i]) {
                            attack.foundKeys[i] = {
                                keyA: this.generateRandomKey(),
                                keyB: this.generateRandomKey()
                            };
                        }
                    }

                    this.activeAttacks.delete(uid);

                    resolve({
                        success: true,
                        foundKeys: attack.foundKeys,
                        message: '🔓 All 16 sectors cracked!'
                    });
                }
            }, updateInterval);

            attack.interval = interval;
        });
    }

    /**
     * Nested attack - crack remaining keys when one is known
     * Uses known key to exploit crypto and crack remaining sectors
     * @param {string} uid - Card UID
     * @param {Object} knownKeys - Already known keys
     * @param {Function} progressCallback - Progress update callback
     * @returns {Promise<Object>} {success, foundKeys, message}
     */
    async startNestedAttack(uid, knownKeys, progressCallback) {
        console.log(`🔓 Nested attack on ${uid}`);

        if (Object.keys(knownKeys).length === 0) {
            return Promise.reject(new Error('Need at least one known key'));
        }

        return new Promise((resolve) => {
            const attack = {
                type: 'nested',
                uid: uid,
                foundKeys: { ...knownKeys },
                startTime: Date.now()
            };

            this.activeAttacks.set(uid, attack);

            const duration = ATTACK_DURATIONS.nested; // 10 seconds
            const updateInterval = 500;
            const sectorsToFind = 16 - Object.keys(knownKeys).length;

            let elapsed = 0;
            let sectorsFound = 0;

            const interval = setInterval(() => {
                elapsed += updateInterval;
                const progress = Math.min(100, (elapsed / duration) * 100);

                const expectedFound = Math.floor((progress / 100) * sectorsToFind);

                // Add keys progressively
                while (sectorsFound < expectedFound) {
                    for (let i = 0; i < 16; i++) {
                        if (!attack.foundKeys[i]) {
                            attack.foundKeys[i] = {
                                keyA: this.generateRandomKey(),
                                keyB: this.generateRandomKey()
                            };
                            sectorsFound++;
                            break;
                        }
                    }
                }

                if (progressCallback) {
                    progressCallback({
                        progress: progress,
                        foundKeys: attack.foundKeys,
                        sectorsRemaining: sectorsToFind - sectorsFound,
                        sectorsTotal: sectorsToFind,
                        elapsed: elapsed,
                        duration: duration
                    });
                }

                if (progress >= 100) {
                    clearInterval(interval);

                    // Ensure all sectors are complete
                    for (let i = 0; i < 16; i++) {
                        if (!attack.foundKeys[i]) {
                            attack.foundKeys[i] = {
                                keyA: this.generateRandomKey(),
                                keyB: this.generateRandomKey()
                            };
                        }
                    }

                    this.activeAttacks.delete(uid);

                    resolve({
                        success: true,
                        foundKeys: attack.foundKeys,
                        message: `🔓 Cracked ${sectorsToFind} remaining sectors!`
                    });
                }
            }, updateInterval);

            attack.interval = interval;
        });
    }

    /**
     * Generate random MIFARE key (12 hex characters)
     * @returns {string} 12-character hex key
     */
    generateRandomKey() {
        return Array.from({ length: 12 }, () =>
            Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join('');
    }

    /**
     * Get attack in progress for given UID
     * @param {string} uid - Card UID
     * @returns {Object|null} Attack object or null
     */
    getActiveAttack(uid) {
        return this.activeAttacks.get(uid) || null;
    }

    /**
     * Cancel attack in progress
     * @param {string} uid - Card UID
     */
    cancelAttack(uid) {
        const attack = this.activeAttacks.get(uid);
        if (attack && attack.interval) {
            clearInterval(attack.interval);
            console.log(`❌ Cancelled ${attack.type} attack on ${uid}`);
        }
        this.activeAttacks.delete(uid);
    }

    /**
     * Cancel all active attacks and clean up
     */
    cleanup() {
        console.log(`🧹 Cleaning up ${this.activeAttacks.size} active attacks`);
        this.activeAttacks.forEach((attack, uid) => {
            if (attack.interval) {
                clearInterval(attack.interval);
            }
        });
        this.activeAttacks.clear();
    }

    /**
     * Save state for persistence (for future implementation)
     * @returns {Object} Serializable state
     */
    saveState() {
        return {
            activeAttacks: Array.from(this.activeAttacks.entries()).map(([uid, attack]) => ({
                uid: uid,
                type: attack.type,
                protocol: attack.protocol,
                startTime: attack.startTime,
                foundKeys: attack.foundKeys
            }))
        };
    }

    /**
     * Restore state from saved data (for future implementation)
     * @param {Object} state - Saved state
     */
    restoreState(state) {
        if (!state || !state.activeAttacks) return;

        // Note: Full restoration would require restarting attack timers
        // For now, just restore the found keys
        state.activeAttacks.forEach(attackData => {
            console.log(`⏮️ Restored attack state for ${attackData.uid}`);
            // Could restart attacks here if needed
        });
    }
}

// Create global instance
window.mifareAttackManager = window.mifareAttackManager || new MIFAREAttackManager();

export default MIFAREAttackManager;
