/**
 * BIOMETRIC LOCK LOGIC
 * ====================
 *
 * Pure functions (no DOM, no Phaser) that decide whether a presented
 * fingerprint sample opens a biometric lock. The reader overlay and the node
 * tests both use them.
 */

export const DEFAULT_BIOMETRIC_THRESHOLD = 0.4;

// A threshold may be written 0..1 or as a percentage (85 means 0.85).
function toThreshold(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.min(n > 1 ? n / 100 : n, 1);
}

/**
 * Minimum quality a lift needs for this lock. Order: the door's own properties
 * (copied from the room data by doors.js), the object's scenarioData, the
 * legacy field on the lockable itself, then 0.4.
 */
export function resolveBiometricThreshold(lockable, type) {
    const candidates = [
        lockable?.doorProperties?.biometricMatchThreshold,
        lockable?.scenarioData?.biometricMatchThreshold,
        lockable?.biometricMatchThreshold
    ];
    for (const value of candidates) {
        const t = toThreshold(value);
        if (t !== null) return t;
    }
    return DEFAULT_BIOMETRIC_THRESHOLD;
}

/**
 * Decide the outcome of presenting a lift to a reader.
 * Without chosenSampleId the best-quality sample enrolled for `requires` is used.
 * Returns { result: 'accepted' | 'low_quality' | 'no_match' | 'no_samples', sample }.
 */
export function evaluateBiometricLock({ requires, threshold, samples, chosenSampleId } = {}) {
    const fingerprints = (Array.isArray(samples) ? samples : [])
        .filter(s => s && (s.type === undefined || s.type === 'fingerprint'));
    if (fingerprints.length === 0) return { result: 'no_samples', sample: null };

    const needed = toThreshold(threshold) ?? DEFAULT_BIOMETRIC_THRESHOLD;
    const enrolled = Array.isArray(requires) ? requires : [requires];
    const matches = s => enrolled.some(r => r !== undefined && r !== null && s.owner === r);

    let sample = null;
    if (chosenSampleId !== undefined && chosenSampleId !== null) {
        sample = fingerprints.find(s => s.id === chosenSampleId) || null;
    } else {
        sample = fingerprints.filter(matches)
            .sort((a, b) => (Number(b.quality) || 0) - (Number(a.quality) || 0))[0] || null;
    }

    if (!sample || !matches(sample)) return { result: 'no_match', sample };
    // Small epsilon so a lift of exactly 0.85 passes an 85% reader despite float error.
    if ((Number(sample.quality) || 0) + 1e-9 < needed) return { result: 'low_quality', sample };
    return { result: 'accepted', sample };
}

if (typeof window !== 'undefined') {
    window.resolveBiometricThreshold = resolveBiometricThreshold;
    window.evaluateBiometricLock = evaluateBiometricLock;
}
