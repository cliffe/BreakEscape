/**
 * BIOMETRIC SAMPLES
 * =================
 *
 * One module owns the player's lifted fingerprints (window.gameState.biometricSamples).
 * Samples are merged per owner: the best quality wins, `identified` is ORed and the
 * earliest `collectedAt` is kept. Persistence goes through StateSync, and the server
 * applies the same merge rules (Game#merge_biometric_samples!).
 */

export function ratingForQuality(quality) {
    const pct = Math.round((Number(quality) || 0) * 100);
    if (pct >= 95) return 'Perfect';
    if (pct >= 85) return 'Excellent';
    if (pct >= 75) return 'Good';
    if (pct >= 60) return 'Fair';
    if (pct >= 40) return 'Acceptable';
    return 'Poor';
}

// 'Robert Vance' -> 'robert_vance'
export function ownerSlug(owner) {
    return String(owner ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function looksLikeId(str) {
    return /^[a-z0-9]+([_-][a-z0-9]+)*$/.test(str);
}

function humanise(str) {
    return str.replace(/[_-]+/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
}

function npcDisplayName(owner) {
    const npcs = window.npcManager?.npcs;
    if (!npcs) return null;
    const entry = typeof npcs.get === 'function' ? npcs.get(owner) : npcs[owner];
    return entry?.displayName || null;
}

/** Name to show the player: fingerprintOwnerName, then the NPC's displayName, then a tidied owner string. */
export function displayNameForOwner(owner, scenarioData) {
    if (scenarioData?.fingerprintOwnerName) return scenarioData.fingerprintOwnerName;
    const npcName = npcDisplayName(owner);
    if (npcName) return npcName;
    const text = String(owner ?? '');
    return looksLikeId(text) ? humanise(text) : text;
}

/** Bring a stored sample (including the legacy {owner, quality, rating, data, timestamp}) to the current shape. */
export function normaliseSample(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const owner = raw.owner !== undefined && raw.owner !== null ? String(raw.owner) : 'Unknown';
    const slug = ownerSlug(owner);
    const quality = Math.min(Math.max(Number(raw.quality) || 0, 0), 1);
    let collectedAt = raw.collectedAt;
    if (!collectedAt) {
        const ts = Number(raw.timestamp);
        collectedAt = Number.isFinite(ts) && ts > 0 ? new Date(ts).toISOString() : new Date().toISOString();
    }
    return {
        id: `fp_${slug}`,
        type: 'fingerprint',
        owner,
        ownerId: raw.ownerId || slug,
        ownerName: raw.ownerName || displayNameForOwner(owner, null),
        quality,
        rating: raw.rating || ratingForQuality(quality),
        pattern: raw.pattern ?? null,
        identified: raw.identified === true,
        sourceObjectId: raw.sourceObjectId ?? null,
        sourceRoomId: raw.sourceRoomId ?? null,
        sourceName: raw.sourceName ?? null,
        surface: raw.surface ?? null,
        collectedAt
    };
}

function samplesArray() {
    if (!window.gameState) window.gameState = {};
    if (!Array.isArray(window.gameState.biometricSamples)) window.gameState.biometricSamples = [];
    return window.gameState.biometricSamples;
}

// Merge one normalised sample into the list (in place). Returns { sample, previous }.
function mergeInto(list, incoming) {
    const idx = list.findIndex(s => s && s.owner === incoming.owner);
    if (idx === -1) {
        list.push(incoming);
        return { sample: incoming, previous: null };
    }
    const previous = normaliseSample(list[idx]);
    const best = incoming.quality > previous.quality ? incoming : previous;
    const merged = {
        ...best,
        id: previous.id,
        identified: previous.identified || incoming.identified,
        collectedAt: [previous.collectedAt, incoming.collectedAt].sort()[0]
    };
    list[idx] = merged;
    return { sample: merged, previous };
}

function refreshUi() {
    window.updateBiometricsPanel?.();
    window.updateBiometricsCount?.();
}

/**
 * Store a lift. Returns { sample, previous, newlyIdentified } where `sample` is the merged
 * record now held for that owner, or null if the input was unusable.
 */
export function addBiometricSample(rawSample) {
    const incoming = normaliseSample(rawSample);
    if (!incoming) return null;
    const { sample, previous } = mergeInto(samplesArray(), incoming);
    refreshUi();
    window.stateSync?.sync();
    return { sample, previous, newlyIdentified: sample.identified && !(previous && previous.identified) };
}

/** Merge samples saved by the server into the live list (no sync back). */
export function restoreBiometricSamples(saved) {
    if (!Array.isArray(saved) || saved.length === 0) return;
    const list = samplesArray();
    for (const raw of saved) {
        const incoming = normaliseSample(raw);
        if (incoming) mergeInto(list, incoming);
    }
    refreshUi();
}

export function getBiometricSamples() {
    return samplesArray();
}

/** Best-quality sample lifted from this surface, or null. */
export function bestLiftFromObject(objectId) {
    if (!objectId) return null;
    let best = null;
    for (const s of samplesArray()) {
        if (s && s.sourceObjectId === objectId && (!best || (Number(s.quality) || 0) > (Number(best.quality) || 0))) {
            best = s;
        }
    }
    return best;
}

if (typeof window !== 'undefined') {
    window.addBiometricSample = addBiometricSample;
    window.restoreBiometricSamples = restoreBiometricSamples;
    window.getBiometricSamples = getBiometricSamples;
    window.bestLiftFromObject = bestLiftFromObject;
}
