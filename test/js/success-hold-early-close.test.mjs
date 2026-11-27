// A success already shown ("Access Granted") and held before the minigame closes itself must
// still unlock if the player closes it first (X, Esc, click outside, a forced end): the
// unlock callback runs once. A failure then a close commits nothing. (m03/m04 playtests.)
// Run with: node --test test/js/success-hold-early-close.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'success-hold-'));
const put = (name, code) => { writeFileSync(join(tmp, name), code); };
put('display-dashes.mjs', 'export const displayDashes = (s) => s;');
put('escape-html.mjs', 'export const escapeHtml = (s) => String(s);');
put('base-minigame.mjs', readFileSync(js('minigames/framework/base-minigame.js'), 'utf8')
    .replace("'../../utils/display-dashes.js'", "'./display-dashes.mjs'")
    .replace("'../../utils/escape-html.js'", "'./escape-html.mjs'"));
put('minigame-manager.mjs', readFileSync(js('minigames/framework/minigame-manager.js'), 'utf8')
    .replace("'./base-minigame.js'", "'./base-minigame.mjs'"));

const noop = () => {};
const node = () => ({ remove: noop, appendChild: noop, hasAttribute: () => false, style: {}, classList: { add: noop, remove: noop } });
globalThis.document = { querySelector: () => null, querySelectorAll: () => [], createElement: node, addEventListener: noop, removeEventListener: noop };
globalThis.window = { resumeKeyboardInput: noop, settleAfterPanelClose: noop };
const { MinigameScene } = await import(pathToFileURL(join(tmp, 'base-minigame.mjs')).href);
const { MinigameFramework } = await import(pathToFileURL(join(tmp, 'minigame-manager.mjs')).href);
window.MinigameFramework = MinigameFramework;

// A reader shaped like the RFID one: decides, shows "Access Granted", completes after 2 s
class Reader extends MinigameScene {
    constructor(onComplete) {
        super(null, {});
        this.params = { onComplete };
        this.gameState = { isActive: true };
        this.messageContainer = { appendChild: noop };
        this.cleanup = noop;
    }
    grant() {
        this.gameResult = { success: true, cardName: 'Staff badge' };
        this.holdSuccess(2000);
    }
}
function open() {
    const calls = [];
    const r = new Reader((ok, res) => calls.push([ok, res && res.cardName]));
    MinigameFramework.currentMinigame = r;
    MinigameFramework._ending = false;
    return { r, calls };
}
const setup = () => mock.timers.enable({ apis: ['setTimeout'] });

test('success then an early close (X) commits the unlock once', () => {
    setup();
    const { r, calls } = open();
    r.grant();
    mock.timers.tick(300);
    r.closeByPlayer();
    mock.timers.tick(5000);
    assert.deepEqual(calls, [[true, 'Staff badge']]);
    mock.timers.reset();
});

test('success then a forced end (click outside, hit) commits the unlock once', () => {
    setup();
    const { r, calls } = open();
    r.grant();
    mock.timers.tick(300);
    MinigameFramework.forceCloseMinigame();
    mock.timers.tick(5000);
    assert.deepEqual(calls, [[true, 'Staff badge']]);
    mock.timers.reset();
});

test('success then waiting out the hold commits once, after 2 s and not before', () => {
    setup();
    const { r, calls } = open();
    r.grant();
    mock.timers.tick(1999);
    assert.equal(calls.length, 0);
    mock.timers.tick(1);
    assert.deepEqual(calls, [[true, 'Staff badge']]);
    r.closeByPlayer();
    mock.timers.tick(5000);
    assert.equal(calls.length, 1, 'a close after the commit does not repeat it');
    mock.timers.reset();
});

test('failure then close commits nothing', () => {
    setup();
    const { r, calls } = open();
    r.gameResult = { success: false };
    r.closeByPlayer();
    mock.timers.tick(5000);
    assert.deepEqual(calls, [[false, undefined]]);
    mock.timers.reset();
});

test('showSuccess with autoClose holds the same way (PIN, password)', () => {
    setup();
    const { r, calls } = open();
    r.gameResult = { success: true, cardName: 'PIN' };
    r.showSuccess('PIN Correct', true, 2000);
    r.closeByPlayer();
    mock.timers.tick(5000);
    assert.deepEqual(calls, [[true, 'PIN']]);
    mock.timers.reset();
});

test('RFID tap and emulate paths hold through holdSuccess, and complete() resolves an early close', () => {
    const src = readFileSync(js('minigames/rfid/rfid-minigame.js'), 'utf8');
    assert.equal((src.match(/this\.holdSuccess\((1500|2000)\)/g) || []).length, 2);
    assert.match(src, /complete\(success\) \{[^}]*resolveEarlyClose\(success\)/);
});

test('access-list "unlocked" path holds through holdSuccess, not a bare setTimeout', () => {
    const src = readFileSync(js('minigames/rfid/rfid-minigame.js'), 'utf8');
    assert.match(src, /this\.holdSuccess\(emulated \? 2000 : 1500\)/);
    assert.doesNotMatch(src, /setTimeout\(\(\) => \{\s*if \(this\._isLive\(\)\) this\.complete\(true\)/);
});

test('access-list hold: X 250 ms after the grant commits once, the full hold commits once', () => {
    for (const closeAt of [250, null]) {
        setup();
        const { r, calls } = open();
        r.gameResult = { success: true, cardName: 'Staff badge', serverResponse: { ok: true } };
        r.holdSuccess(1500);
        if (closeAt !== null) { mock.timers.tick(closeAt); r.closeByPlayer(); }
        mock.timers.tick(1500);
        assert.deepEqual(calls, [[true, 'Staff badge']]);
        mock.timers.tick(5000);
        assert.equal(calls.length, 1);
        mock.timers.reset();
    }
});
