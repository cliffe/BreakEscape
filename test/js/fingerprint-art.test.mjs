// Art slots for the reader and kit panel: a missing PNG is silent, a present one is applied.
// Run with: node test/js/fingerprint-art.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const present = new Set(['lift-card']);
globalThis.Image = class {
    set src(url) {
        const name = url.split('/').pop().replace('.png', '');
        setTimeout(() => (present.has(name) ? this.onload() : this.onerror()), 0);
    }
};
const { artUrl, loadArtSlot, applyArtSlot, ART_SLOTS } =
    await import('data:text/javascript;base64,' + Buffer.from(readFileSync(
        join(root, 'public/break_escape/js/minigames/biometrics/fingerprint-art.js'), 'utf8')).toString('base64'));

const fakeEl = () => {
    const vars = {}; const classes = new Set();
    return { isConnected: true, vars, classes,
        style: { setProperty: (k, v) => { vars[k] = v; } }, classList: { add: c => classes.add(c) } };
};

test('slots and path', () => {
    assert.deepEqual(ART_SLOTS, ['reader-bezel', 'lift-card', 'reference-card']);
    assert.equal(artUrl('lift-card'), '/break_escape/assets/minigames/fingerprint/lift-card.png');
});

test('a missing file leaves the fallback, a present one sets the art', async () => {
    assert.equal(await loadArtSlot('reader-bezel'), null);
    assert.equal(await loadArtSlot('nonsense'), null);
    const missing = fakeEl(); const there = fakeEl();
    applyArtSlot(missing, 'reader-bezel');
    applyArtSlot(there, 'lift-card');
    await loadArtSlot('lift-card');
    await new Promise(r => setTimeout(r, 5));
    assert.equal(missing.classes.has('has-art'), false);
    assert.equal(there.classes.has('has-art'), true);
    assert.match(there.vars['--fp-art'], /lift-card\.png/);
});
