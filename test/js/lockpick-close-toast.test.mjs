// Closing the lockpick minigame without a failed attempt showed two "Failed to pick
// the lock" toasts (one from minigame-starters.js, one from unlock-system.js). Closing
// is not a failure: no toast. A real failed attempt (the no-framework fallback) still
// toasts once. Both files need Phaser to import, so the two callbacks are lifted out of
// the source and run against a stubbed window.
// Run with: node --test test/js/lockpick-close-toast.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const starters = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
const unlock = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');

// The first arrow function `marker` after `anchor`, up to its matching closing brace.
function arrowAt(src, marker, anchor = '') {
    const start = src.indexOf(marker, src.indexOf(anchor));
    assert.ok(start >= 0, `marker not found: ${marker}`);
    const open = src.indexOf('{', src.indexOf('=>', start));
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    throw new Error('unbalanced');
}

const onCompleteSrc = arrowAt(starters, 'onComplete: (success, result) =>', "startMinigame('lockpicking'").replace(/^onComplete: /, '');
const unlockCbSrc = arrowAt(unlock, 'async (success, outcome) =>');

function harness({ hitByDamage = false } = {}) {
    const toasts = [];
    const window = {
        gameAlert: (msg, kind) => toasts.push({ msg, kind }),
        minigameClosedByDamage: () => hitByDamage,
    };
    const make = (src) => new Function('window', 'callback', `return (${src});`);
    const unlockCb = make(unlockCbSrc)(window, null);
    const onComplete = make(onCompleteSrc)(window, unlockCb);
    return { toasts, onComplete, unlockCb };
}

test('closing the lockpick minigame shows no failure toast', async () => {
    const h = harness();
    h.onComplete(false, undefined);
    await new Promise(r => setImmediate(r));
    assert.deepEqual(h.toasts.filter(t => t.kind === 'error'), []);
});

test('a real failed attempt toasts once', async () => {
    const h = harness();
    await h.unlockCb(false, { failed: true });
    assert.equal(h.toasts.filter(t => t.kind === 'error').length, 1);
    assert.match(h.toasts[0].msg, /Failed to pick the lock/);
});

test('a failure after a hit stays quiet (player-damage-interrupt shows its own notice)', async () => {
    const h = harness({ hitByDamage: true });
    await h.unlockCb(false, { failed: true });
    assert.equal(h.toasts.length, 0);
});

test('the no-framework fallback reports a failure without its own toast', () => {
    const fn = starters.slice(starters.indexOf('if (!window.MinigameFramework) {'), starters.indexOf('// Use the advanced minigame framework'));
    assert.match(fn, /callback\(false, \{ failed: true \}\)/);
    assert.doesNotMatch(fn, /Failed to pick the lock/);
});
