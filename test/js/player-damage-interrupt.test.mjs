// Taking damage closes an open minigame (player-damage-interrupt.js).
// Run with: node --test test/js/player-damage-interrupt.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/systems/player-damage-interrupt.js');
const dir = mkdtempSync(join(tmpdir(), 'player-damage-interrupt-'));
writeFileSync(join(dir, 'interrupt.mjs'), readFileSync(src, 'utf8'));
const { closeMinigameOnDamage } = await import(pathToFileURL(join(dir, 'interrupt.mjs')).href);

// A framework whose endMinigame mirrors the real one: complete(false) -> endMinigame
function makeFramework(withMinigame = true) {
    const fw = { currentMinigame: null, ended: [], forced: 0 };
    fw.endMinigame = (success) => { fw.ended.push(success); fw.currentMinigame = null; };
    fw.forceCloseMinigame = () => { fw.forced++; fw.endMinigame(false); };
    if (withMinigame) {
        fw.currentMinigame = { complete(success) { fw.endMinigame(success); } };
    }
    return fw;
}

test('damage closes an open minigame as a failure and shows a notice', () => {
    const fw = makeFramework();
    const notes = [];
    const closed = closeMinigameOnDamage(10, { framework: fw, notify: (...a) => notes.push(a) });
    assert.equal(closed, true);
    assert.deepEqual(fw.ended, [false]);
    assert.equal(fw.currentMinigame, null);
    assert.equal(notes.length, 1);
    assert.match(notes[0][0], /attacked/i);
});

test('no damage leaves the minigame open', () => {
    const fw = makeFramework();
    const notes = [];
    for (const amount of [0, -5, NaN, undefined, '10']) {
        assert.equal(closeMinigameOnDamage(amount, { framework: fw, notify: (...a) => notes.push(a) }), false);
    }
    assert.ok(fw.currentMinigame);
    assert.deepEqual(fw.ended, []);
    assert.equal(notes.length, 0);
});

test('damage with no minigame open is a no-op', () => {
    const fw = makeFramework(false);
    const notes = [];
    assert.equal(closeMinigameOnDamage(10, { framework: fw, notify: (...a) => notes.push(a) }), false);
    assert.deepEqual(fw.ended, []);
    assert.equal(notes.length, 0);
    assert.equal(closeMinigameOnDamage(10, { framework: null, notify: () => {} }), false);
});

test('a minigame already ending is not closed twice', () => {
    const fw = makeFramework();
    fw.currentMinigame._ending = true;
    assert.equal(closeMinigameOnDamage(10, { framework: fw, notify: () => {} }), false);
    assert.deepEqual(fw.ended, []);
});

test('falls back to forceCloseMinigame when complete() is missing or throws', () => {
    const fw = makeFramework();
    fw.currentMinigame = {};
    assert.equal(closeMinigameOnDamage(10, { framework: fw, notify: () => {} }), true);
    assert.equal(fw.forced, 1);

    const fw2 = makeFramework();
    fw2.currentMinigame = { complete() { throw new Error('boom'); } };
    const origErr = console.error; console.error = () => {};
    try { assert.equal(closeMinigameOnDamage(10, { framework: fw2, notify: () => {} }), true); }
    finally { console.error = origErr; }
    assert.equal(fw2.forced, 1);
});

// CF-F: the failure toasts stay quiet when the close came from damage.
test('minigameClosedByDamage is true just after a damage close, false later', async () => {
    const { minigameClosedByDamage } = await import(pathToFileURL(join(dir, 'interrupt.mjs')).href);
    const fw = makeFramework();
    closeMinigameOnDamage(5, { framework: fw, notify: () => {}, now: 1_000_000 });
    assert.equal(minigameClosedByDamage(1500, 1_000_500), true);
    assert.equal(minigameClosedByDamage(1500, 1_002_000), false);
});

test('lockpick failure toasts check minigameClosedByDamage', () => {
    const starters = readFileSync(join(here, '../../public/break_escape/js/systems/minigame-starters.js'), 'utf8');
    const unlock = readFileSync(join(here, '../../public/break_escape/js/systems/unlock-system.js'), 'utf8');
    for (const [name, text, msg] of [['minigame-starters', starters, "'Failed to pick the lock.', 'error', 'Lockpicking'"], ['unlock-system', unlock, "'Failed to pick the lock. Try again.'"]]) {
        const i = text.indexOf(msg);
        assert.ok(i > 0, `${name}: toast present`);
        assert.match(text.slice(i - 200, i), /minigameClosedByDamage/, `${name}: toast guarded`);
    }
});

// F2: the other failure toasts on close paths (wrong key, PIN, password) are guarded too.
test('key, PIN and password failure toasts check minigameClosedByDamage', () => {
    const starters = readFileSync(join(here, '../../public/break_escape/js/systems/minigame-starters.js'), 'utf8');
    for (const msg of ["'Wrong Key', 4000", '"Failed to enter correct PIN."', '"Failed to enter correct password."']) {
        const i = starters.indexOf(msg);
        assert.ok(i > 0, `${msg}: toast present`);
        assert.match(starters.slice(i - 220, i), /minigameClosedByDamage/, `${msg}: toast guarded`);
    }
});

// m07 U12 (2026-10-17): a hit leaves the phone open, so HaX's fight texts can be
// read. Attacks carry on (npc-attack-pause.test.mjs), so the phone is no shield.
test('a hit leaves the phone open, with an HP notice that every hit refreshes', async () => {
    const { PHONE_HIT_NOTICE_MS } = await import(pathToFileURL(join(dir, 'interrupt.mjs')).href);
    const fw = makeFramework();
    fw.currentMinigame._sceneType = 'phone-chat';
    fw.currentMinigame.params = {};
    // A stand-in toast column: notify() returns the toast element, as showNotification does
    const column = { children: [], removeChild(el) { this.children.splice(this.children.indexOf(el), 1); el.parentNode = null; } };
    const notes = [];
    const notify = (...a) => { notes.push(a); const el = { text: a[0], parentNode: column }; column.children.push(el); return el; };
    assert.equal(closeMinigameOnDamage(4, { framework: fw, notify, hp: 52, maxHP: 100 }), false);
    assert.ok(fw.currentMinigame, 'still open');
    assert.deepEqual(fw.ended, []);
    assert.equal(notes.length, 1);
    assert.match(notes[0][0], /You're being hit! HP 52\/100\. Close the phone \(Esc\) to fight back\./);
    assert.equal(notes[0][1], 'warning', 'warnings are not held behind an open minigame');
    assert.equal(notes[0][3], PHONE_HIT_NOTICE_MS);
    assert.ok(PHONE_HIT_NOTICE_MS > 2000, 'outlasts the gap between hits (default cooldown 2 s)');
    // The next hit, a second later: a new notice with the new HP replaces the old one
    closeMinigameOnDamage(4, { framework: fw, notify, hp: 48, maxHP: 100 });
    assert.equal(notes.length, 2, 'not throttled');
    assert.equal(column.children.length, 1, 'one notice at a time');
    assert.match(column.children[0].text, /48\/100/);
    // A notify that holds the toast (returns null) doesn't break the next hit
    closeMinigameOnDamage(4, { framework: fw, notify: () => null, hp: 44, maxHP: 100 });
    assert.equal(column.children.length, 0, 'the last shown notice is removed');
    closeMinigameOnDamage(4, { framework: fw, notify, hp: 40, maxHP: 100 });
    assert.equal(column.children.length, 1);
});

test('a knockout or a phone cutscene still closes the phone', () => {
    const fw = makeFramework();
    fw.currentMinigame._sceneType = 'phone-chat';
    fw.currentMinigame.params = {};
    assert.equal(closeMinigameOnDamage(10, { framework: fw, notify: () => {}, ko: true }), true);
    assert.deepEqual(fw.ended, [false]);

    const fw2 = makeFramework();
    fw2.currentMinigame._sceneType = 'phone-chat';
    fw2.currentMinigame.params = { cutscene: true };
    assert.equal(closeMinigameOnDamage(10, { framework: fw2, notify: () => {} }), true);
});

test('player-health tells the interrupt when a hit is a knockout', () => {
    const src = readFileSync(join(here, '../../public/break_escape/js/systems/player-health.js'), 'utf8');
    assert.match(src, /closeMinigameOnDamage\(amount, \{ ko: state\.currentHP <= 0 \}\)/);
});
