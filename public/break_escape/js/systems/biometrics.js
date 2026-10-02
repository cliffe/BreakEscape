/**
 * BIOMETRICS SYSTEM
 * =================
 * 
 * Handles fingerprint collection and biometric scanning functionality.
 * Includes dusting minigame integration and biometric sample management.
 */

import { INTERACTION_RANGE_SQ } from '../utils/constants.js';
import {
    addBiometricSample, bestLiftFromObject, displayNameForOwner, ownerSlug, ratingForQuality
} from './biometric-samples.js';

// A surface that has given a lift this good stops intercepting interactions.
const EXCELLENT_LIFT = 0.85;

// Fingerprint collection function. Returns null (so the caller falls through to the
// object's normal interaction) when there is nothing to dust or the surface has already
// given an excellent lift; otherwise starts dusting and returns true.
export function collectFingerprint(item) {
    if (!item.scenarioData?.hasFingerprint) {
        window.gameAlert("No fingerprints found on this surface.", 'info', 'No Fingerprints', 3000);
        return null;
    }

    const objectId = item.scenarioData?.id || item.objectId;
    const best = bestLiftFromObject(objectId);
    if (best && best.quality >= EXCELLENT_LIFT) return null;

    startDustingMinigame(item);
    return true;
}

// Handle biometric scanner interaction
export function handleBiometricScan(sprite) {
    const player = window.player;
    if (!player) return;
    
    // Check if player is in range
    const dx = player.x - sprite.x;
    const dy = player.y - sprite.y;
    const distanceSq = dx * dx + dy * dy;
    
    if (distanceSq > INTERACTION_RANGE_SQ) {
        window.gameAlert('You need to be closer to use the biometric scanner.', 'warning', 'Too Far', 3000);
        return;
    }
    
    // Show biometric authentication interface
    window.gameAlert('Place your finger on the scanner...', 'info', 'Biometric Scan', 2000);
    
    // Simulate biometric scan process
    setTimeout(() => {
        // For now, just show a message - can be enhanced with actual authentication logic
        window.gameAlert('Biometric scan complete.', 'success', 'Scan Complete', 3000);
    }, 2000);
}

// Build, store and announce a sample from the dusting result (T3 contract:
// { quality, rating, pattern, identified, surface, powder, objectId, roomId }).
function recordLift(item, result) {
    const scenarioData = item.scenarioData || {};
    const owner = scenarioData.fingerprintOwner || 'Unknown';
    const ownerId = ownerSlug(owner);
    const ownerName = displayNameForOwner(owner, scenarioData);
    const quality = Math.min(Math.max(Number(result.quality) || 0, 0), 1);
    const rating = result.rating || ratingForQuality(quality);
    const sourceObjectId = scenarioData.id || result.objectId || item.objectId || null;
    const sourceRoomId = window.currentPlayerRoom || result.roomId || null;
    const sourceName = scenarioData.name || null;

    const stored = addBiometricSample({
        id: `fp_${ownerId}`,
        type: 'fingerprint',
        owner,
        ownerId,
        ownerName,
        quality,
        rating,
        pattern: result.pattern || null,
        identified: result.identified === true,
        sourceObjectId,
        sourceRoomId,
        sourceName,
        surface: result.surface || null,
        collectedAt: new Date().toISOString()
    });
    if (!stored) return;

    const payload = {
        owner, ownerId, ownerName,
        objectId: sourceObjectId, roomId: sourceRoomId,
        quality, identified: stored.sample.identified
    };
    window.eventDispatcher?.emit(`fingerprint_collected:${ownerId}`, payload);
    if (stored.newlyIdentified) {
        window.eventDispatcher?.emit(`fingerprint_identified:${ownerId}`, payload);
    }

    const pct = Math.round(quality * 100);
    const message = stored.sample.identified
        ? `Lifted ${ownerName}'s print (${rating}, ${pct}%).`
        : `Lifted a print${sourceName ? ` from ${sourceName}` : ''} (${rating}, ${pct}%).`;
    window.gameAlert(message, 'success', 'Print Lifted', 4000);
}

// Start fingerprint dusting minigame
export function startDustingMinigame(item) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available; cannot start the dusting minigame');
        return;
    }

    // Initialize the framework if not already done
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }

    // Add scene reference to item for the minigame
    item.scene = window.game;

    window.MinigameFramework.startMinigame('dusting', null, {
        item: item,
        scene: item.scene,
        onComplete: (success, result) => {
            if (success) {
                recordLift(item, result || {});
            } else if (result?.useNormally) {
                // "Use normally": run the object's ordinary interaction once, skipping the print branch.
                item._bypassFingerprintOnce = true;
                setTimeout(() => window.handleObjectInteraction?.(item), 0);
            }
            // Cancelled: nothing to show.
        }
    });
}

// Generate fingerprint data
export function generateFingerprintData(item) {
    const owner = item.scenarioData?.fingerprintOwner || 'Unknown';
    const timestamp = Date.now();
    return `${owner}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export for global access
window.collectFingerprint = collectFingerprint;
window.handleBiometricScan = handleBiometricScan;
window.startDustingMinigame = startDustingMinigame;
window.generateFingerprintData = generateFingerprintData;

