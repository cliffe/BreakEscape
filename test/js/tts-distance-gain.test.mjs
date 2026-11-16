// TTSManager.setDistanceGain (chatter falloff R1 m10): the real method on a fake gain node.
// The gain node sits between the analyser and the voice bus; a new line sets it at once, following
// the player eases it, with no Web Audio routing it falls back to the element volume, and a call
// with no volume (a play() with no volume option) resets it to 1.
// Run with: node --max-old-space-size=2048 test/js/tts-distance-gain.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/systems/tts-manager.js'), 'utf8');
const m = src.match(/\n    setDistanceGain\(([^)]*)\) \{\n([\s\S]*?)\n    \}\n/);
assert.ok(m, 'setDistanceGain found');
const make = MusicController => new Function('MusicController', `return function (${m[1]}) {\n${m[2]}\n};`)(MusicController);

function rig({ routed = true, node = true } = {}) {
    const calls = [];
    const gain = { cancelScheduledValues: t => calls.push(['cancel', t]), setValueAtTime: (v, t) => calls.push(['set', v, t]), setTargetAtTime: (v, t, k) => calls.push(['ease', v, t, k]) };
    const mgr = { _distanceNode: node ? { gain } : null, _ttsAudioRouted: routed, audio: { volume: 1 }, volume: 0.8, distanceGain: 1 };
    mgr.setDistanceGain = make({ context: { currentTime: 5 } });
    return { mgr, calls };
}

test('a new line sets the gain at once, following the player eases it', () => {
    const { mgr, calls } = rig();
    mgr.setDistanceGain(0.4, true);
    assert.deepEqual(calls, [['cancel', 5], ['set', 0.4, 5]]);
    assert.equal(mgr.distanceGain, 0.4);
    calls.length = 0;
    mgr.setDistanceGain(0.2);
    assert.deepEqual(calls, [['ease', 0.2, 5, 0.1]]);
});

test('values are clamped to 0..1', () => {
    const { mgr } = rig();
    mgr.setDistanceGain(7, true); assert.equal(mgr.distanceGain, 1);
    mgr.setDistanceGain(-3, true); assert.equal(mgr.distanceGain, 0);
});

test('with no volume (a play() without one) the gain resets to 1', () => {
    const { mgr, calls } = rig();
    mgr.setDistanceGain(0.3, true);
    mgr.setDistanceGain(undefined, true);
    assert.equal(mgr.distanceGain, 1);
    assert.deepEqual(calls.at(-1), ['set', 1, 5]);
});

test('with no Web Audio routing the element volume is used (times the manager volume)', () => {
    const { mgr } = rig({ routed: false, node: false });
    mgr.setDistanceGain(0.5, true);
    assert.equal(mgr.audio.volume, 0.5 * 0.8);
});
