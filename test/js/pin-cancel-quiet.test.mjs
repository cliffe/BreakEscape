// Cancelling the PIN pad must not read as a wrong PIN.
// Source-level checks (the modules need Phaser and the DOM to import).
// Run with: node test/js/pin-cancel-quiet.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = p => readFileSync(join(root, 'public/break_escape/js', p), 'utf8');

test('PinMinigame.complete flags a close with no verdict as cancelled', () => {
    const src = js('minigames/pin/pin-minigame.js');
    const m = src.match(/complete\(success\) \{([\s\S]*?)\n    \}/);
    assert.ok(m, 'complete() found');
    assert.match(m[1], /!success && !this\.gameResult/);
    assert.match(m[1], /cancelled: true/);
    // the max-attempts lockout sets its own gameResult, so it is not "cancelled"
    assert.match(src, /maxAttemptsReached: true/);
});

test('PIN starter shows no PIN Rejected alert for a cancelled result', () => {
    const src = js('systems/minigame-starters.js');
    const i = src.indexOf("window.MinigameFramework.startMinigame('pin'");
    assert.ok(i > 0);
    const block = src.slice(i, i + 2500);
    assert.match(block, /!result\?\.cancelled && !window\.minigameClosedByDamage/);
    assert.match(block, /PIN Rejected/);
});
