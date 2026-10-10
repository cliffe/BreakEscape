// Inventory clicks can't replace a forced (disableClose) minigame such as the debrief
// (forced-minigame-guard.js; m02 playtest M1).
// Run with: node --test test/js/forced-minigame-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/systems/forced-minigame-guard.js');
const dir = mkdtempSync(join(tmpdir(), 'forced-minigame-guard-'));
writeFileSync(join(dir, 'guard.mjs'), readFileSync(src, 'utf8'));
const { inventoryBlockedByForcedMinigame } = await import(pathToFileURL(join(dir, 'guard.mjs')).href);

const fw = (current) => ({ framework: { currentMinigame: current } });

test('no minigame open: inventory works', () => {
    assert.equal(inventoryBlockedByForcedMinigame(fw(null)), false);
});
test('an ordinary minigame open: not blocked (the overlay already covers the bar)', () => {
    assert.equal(inventoryBlockedByForcedMinigame(fw({ params: {} })), false);
});
test('a disableClose minigame open: blocked', () => {
    assert.equal(inventoryBlockedByForcedMinigame(fw({ params: { disableClose: true } })), true);
});
test('a disableClose minigame already ending: not blocked', () => {
    assert.equal(inventoryBlockedByForcedMinigame(fw({ params: { disableClose: true }, _ending: true })), false);
});
test('both inventory click handlers check the guard', () => {
    const inv = readFileSync(join(here, '../../public/break_escape/js/systems/inventory.js'), 'utf8');
    assert.equal((inv.match(/if \(inventoryBlockedByForcedMinigame\(\)\) return;/g) || []).length, 2);
});
