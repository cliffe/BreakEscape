// Sample shape, display names, merging and restore for lifted fingerprints.
// Run with: node test/js/biometric-samples.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The engine has no package.json type:module, so load the ES module through a data: URL.
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const loadModule = name => import('data:text/javascript;base64,' + Buffer.from(
    readFileSync(join(root, 'public/break_escape/js/systems', name + '.js'), 'utf8')).toString('base64'));

let syncs = 0, panels = 0, counts = 0;
globalThis.window = {
    gameState: { biometricSamples: [] },
    stateSync: { sync() { syncs++; } },
    updateBiometricsPanel() { panels++; },
    updateBiometricsCount() { counts++; }
};
const S = await loadModule('biometric-samples');

const reset = () => {
    window.gameState = { biometricSamples: [] };
    window.npcManager = undefined;
    syncs = panels = counts = 0;
};
const lift = (over = {}) => ({
    owner: 'Robert Vance', quality: 0.6, pattern: 'loop', identified: false,
    sourceObjectId: 'panel', sourceRoomId: 'hall', sourceName: 'Panel',
    collectedAt: '2026-10-01T12:00:00Z', ...over
});

test('ownerSlug lowercases and collapses non-alphanumerics', () => {
    assert.equal(S.ownerSlug('Robert Vance'), 'robert_vance');
    assert.equal(S.ownerSlug("Dr. O'Neil-Smith "), 'dr_o_neil_smith');
    assert.equal(S.ownerSlug('receptionist'), 'receptionist');
});

test('displayNameForOwner order: fingerprintOwnerName, NPC (Map or object), humanised id, as is', () => {
    reset();
    assert.equal(S.displayNameForOwner('receptionist', { fingerprintOwnerName: 'Pat Moss' }), 'Pat Moss');
    window.npcManager = { npcs: new Map([['receptionist', { displayName: 'Pat Moss (NPC)' }]]) };
    assert.equal(S.displayNameForOwner('receptionist', {}), 'Pat Moss (NPC)');
    window.npcManager = { npcs: { receptionist: { displayName: 'Plain Object Pat' } } };
    assert.equal(S.displayNameForOwner('receptionist', null), 'Plain Object Pat');
    window.npcManager = undefined;
    assert.equal(S.displayNameForOwner('crypto_lead', {}), 'Crypto Lead');
    assert.equal(S.displayNameForOwner('Robert Vance', {}), 'Robert Vance');
    assert.equal(S.displayNameForOwner('Mrs Moo', {}), 'Mrs Moo');
});

test('normaliseSample fills the current shape and converts legacy samples', () => {
    const n = S.normaliseSample({ owner: 'Robert Vance', quality: 0.82, rating: 'Good', data: 'x', timestamp: 1790000000000 });
    assert.equal(n.id, 'fp_robert_vance');
    assert.equal(n.type, 'fingerprint');
    assert.equal(n.ownerId, 'robert_vance');
    assert.equal(n.ownerName, 'Robert Vance');
    assert.equal(n.rating, 'Good');
    assert.equal(n.identified, false);
    assert.equal(n.collectedAt, new Date(1790000000000).toISOString());
    assert.equal(S.normaliseSample({ owner: 'x', quality: 0.9 }).rating, 'Excellent');
    assert.equal(S.normaliseSample({ owner: 'x', quality: 7 }).quality, 1);
    assert.equal(S.normaliseSample(null), null);
});

test('ratingForQuality bands', () => {
    assert.deepEqual([0.95, 0.85, 0.75, 0.6, 0.4, 0.39].map(S.ratingForQuality),
        ['Perfect', 'Excellent', 'Good', 'Fair', 'Acceptable', 'Poor']);
});

test('addBiometricSample merges by owner: best quality, OR identified, earliest date', () => {
    reset();
    const first = S.addBiometricSample(lift({ quality: 0.6, collectedAt: '2026-10-01T12:00:00Z' }));
    assert.equal(first.newlyIdentified, false);
    const worseIdentified = S.addBiometricSample(lift({ quality: 0.4, identified: true, collectedAt: '2026-10-01T13:00:00Z', sourceObjectId: 'other' }));
    assert.equal(worseIdentified.newlyIdentified, true);
    assert.equal(window.gameState.biometricSamples.length, 1);
    let s = window.gameState.biometricSamples[0];
    assert.equal(s.quality, 0.6);
    assert.equal(s.identified, true);
    assert.equal(s.sourceObjectId, 'panel');
    const better = S.addBiometricSample(lift({ quality: 0.9, identified: false, collectedAt: '2026-10-01T14:00:00Z', sourceObjectId: 'mug' }));
    assert.equal(better.newlyIdentified, false);
    s = window.gameState.biometricSamples[0];
    assert.equal(s.quality, 0.9);
    assert.equal(s.identified, true);
    assert.equal(s.sourceObjectId, 'mug');
    assert.equal(s.collectedAt, '2026-10-01T12:00:00Z');
    S.addBiometricSample(lift({ owner: 'David Torres' }));
    assert.equal(window.gameState.biometricSamples.length, 2);
});

test('addBiometricSample refreshes the UI and syncs', () => {
    reset();
    S.addBiometricSample(lift());
    assert.equal(panels, 1);
    assert.equal(counts, 1);
    assert.equal(syncs, 1);
});

test('restoreBiometricSamples merges saved samples without syncing', () => {
    reset();
    S.addBiometricSample(lift({ quality: 0.5 }));
    syncs = 0;
    S.restoreBiometricSamples([lift({ quality: 0.8, identified: true }), lift({ owner: 'David Torres', quality: 0.7 })]);
    const list = window.gameState.biometricSamples;
    assert.equal(list.length, 2);
    assert.equal(list.find(s => s.owner === 'Robert Vance').quality, 0.8);
    assert.equal(list.find(s => s.owner === 'Robert Vance').identified, true);
    assert.equal(syncs, 0);
    S.restoreBiometricSamples(undefined);
    S.restoreBiometricSamples([]);
    assert.equal(list.length, 2);
});

test('bestLiftFromObject finds the best lift from a surface', () => {
    reset();
    assert.equal(S.bestLiftFromObject('panel'), null);
    S.addBiometricSample(lift({ quality: 0.7 }));
    S.addBiometricSample(lift({ owner: 'David Torres', quality: 0.9, sourceObjectId: 'mug' }));
    assert.equal(S.bestLiftFromObject('panel').quality, 0.7);
    assert.equal(S.bestLiftFromObject('mug').owner, 'David Torres');
    assert.equal(S.bestLiftFromObject('nothing'), null);
    assert.equal(S.bestLiftFromObject(undefined), null);
});

test('window globals are exposed', () => {
    assert.equal(typeof window.addBiometricSample, 'function');
    assert.equal(typeof window.restoreBiometricSamples, 'function');
    assert.equal(typeof window.getBiometricSamples, 'function');
});
