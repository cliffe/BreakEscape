// Mock authenticator / push stream (SE design 11 N11, packet P7-M).
// The real timeline model and scene run in jsdom, started through the real minigame framework.
// Playback uses an injected no-op scheduler so the timeline is advanced by hand.
// Run with: bundle exec node --test test/js/social-authenticator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-authenticator-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const events = [];
window.eventDispatcher = { emit(name, data) { events.push({ name, data }); } };
let kbPaused = 0;
window.pauseKeyboardInput = () => { kbPaused += 1; };
window.resumeKeyboardInput = () => { kbPaused -= 1; };

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { AuthenticatorMinigame } = await load('minigames/authenticator/authenticator-minigame.js');
const M = await load('minigames/authenticator/authenticator-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('authenticator', AuthenticatorMinigame);

// A scheduler that never fires on its own, so advance() is driven from the test.
const noopSched = { schedule: () => 0, clearScheduled: () => {}, stepMs: 1 };

const EP = () => ({
    mode: 'attacker',
    pushes: [
        { id: 'p1', at: '06:45', app: 'SecureAuth', account: 'r.okafor', location: 'Lagos, NG', device: 'Chrome / Windows' },
        { id: 'p2', at: '06:47', app: 'SecureAuth', account: 'r.okafor', location: 'Lagos, NG', device: 'Chrome / Windows' },
        { id: 'p3', at: '03:12', app: 'SecureAuth', account: 'r.okafor', location: 'Lagos, NG', device: 'Chrome / Windows' }
    ],
    approvesAt: '06:50'
});

// The starter (P7-W3) builds params with socialOverlayParams, so requiresKeyboardInput and
// disableClose reach startMinigame before it decides to pause the player controller.
const open = (params) => {
    events.length = 0;
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    return FW.startMinigame('authenticator', null, {
        requiresKeyboardInput: true, disableClose: true, ...params, deps: noopSched
    });
};
const named = (n) => events.filter((e) => e.name === n);

test('buildTimeline: orders pushes by time, keeps author order on a tie, approval last on a tie', () => {
    const { events: evs, pushCount } = M.buildTimeline({
        pushes: [{ id: 'a', at: '06:47' }, { id: 'b', at: '03:12' }, { id: 'c', at: '06:47' }],
        approvesAt: '06:47'
    });
    assert.equal(pushCount, 3);
    assert.deepEqual(evs.map((e) => e.id), ['b', 'a', 'c', 'approve']);
    assert.equal(evs[3].type, 'approve');
    assert.deepEqual(evs.map((e) => e.order), [0, 1, 2, 3]);
});

test('timeKey and displayTime handle HH:MM, numbers and junk', () => {
    assert.equal(M.timeKey('06:45'), 6 * 60 + 45);
    assert.equal(M.timeKey(90), 90);
    assert.equal(M.timeKey('nope'), Number.POSITIVE_INFINITY);
    assert.equal(M.displayTime('06:45'), '06:45');
    assert.equal(M.displayTime(90), '90');
});

test('no approvesAt: the timeline is pushes only', () => {
    const { events: evs } = M.buildTimeline({ pushes: [{ at: '01:00' }] });
    assert.equal(evs.length, 1);
    assert.equal(evs[0].type, 'push');
});

test('timeline plays in order and the target approves at approvesAt', () => {
    const scene = open(EP());
    assert.equal(scene.getTestState().authenticator.sent, 0);
    assert.equal(scene.getTestState().authenticator.approvedAt, null);

    // the odd-hour push (03:12) comes first, then the two morning pushes, then the approval
    assert.equal(scene.advance().id, 'p3');
    assert.equal(scene.advance().id, 'p1');
    assert.equal(scene.advance().id, 'p2');
    assert.equal(scene.getTestState().authenticator.sent, 3);
    assert.equal(scene.getTestState().authenticator.approvedAt, null);

    const approve = scene.advance();
    assert.equal(approve.type, 'approve');
    assert.equal(scene.getTestState().authenticator.approvedAt, '06:50');
    assert.equal(scene.getTestState().authenticator.finished, true);
    assert.equal(scene.advance(), null); // nothing left

    assert.equal(scene.container.querySelectorAll('.auth-card').length, 3);
    assert.ok(scene.container.querySelector('.auth-banner').textContent.length > 0);
    assert.ok(scene.container.textContent.includes('03:12'));
    scene.close();
});

test('a learner-sent push joins the stream and is counted; it is blocked after approval', () => {
    const scene = open(EP());
    const btn = scene.container.querySelector('.auth-send');
    btn.click();
    btn.click();
    assert.equal(scene.getTestState().authenticator.sent, 2);
    assert.equal(scene.container.querySelectorAll('.auth-card-manual').length, 2);
    // play to approval, then the send button is disabled and sends nothing more
    while (scene.advance()) { /* drain */ }
    assert.equal(btn.disabled, true);
    const after = scene.getTestState().authenticator.sent;
    btn.click();
    assert.equal(scene.getTestState().authenticator.sent, after);
    scene.close();
});

test('overlay rules: requiresKeyboardInput and disableClose are set, and keyboard is paused', () => {
    const scene = open(EP());
    assert.equal(scene.params.requiresKeyboardInput, true);
    assert.equal(scene.params.disableClose, true);
    assert.ok(kbPaused > 0, 'the player controller keyboard is paused while the overlay is open');
    assert.equal(scene.container.querySelector('.minigame-close-button').style.display, 'none');
    assert.ok(scene.container.querySelector('.se-overlay-close'), 'own Close control is drawn');
    scene.close();
});

test('Close is a normal exit: minigame_completed, no minigame_failed, result carries the state', () => {
    const scene = open(EP());
    scene.advance(); // one push sent
    scene.container.querySelector('.se-overlay-close').click();
    assert.equal(named('minigame_failed').length, 0);
    assert.equal(named('minigame_completed').length, 1);
    const result = named('minigame_completed')[0].data.result;
    assert.deepEqual(result, { approvedAt: null, sent: 1, mode: 'attacker' });
});

test('Esc is a normal exit and never emits minigame_failed', () => {
    const scene = open(EP());
    while (scene.advance()) { /* reach approval */ }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(named('minigame_failed').length, 0);
    assert.equal(named('minigame_completed').length, 1);
    assert.equal(named('minigame_completed')[0].data.result.approvedAt, '06:50');
});

test('getTestState exposes the authenticator snapshot alongside the generic controls', () => {
    const scene = open(EP());
    scene.advance();
    const ts = scene.getTestState();
    assert.equal(ts.available, true);
    assert.deepEqual(ts.authenticator.played, ['p3']);
    assert.equal(ts.authenticator.mode, 'attacker');
    assert.ok(Array.isArray(ts.controls));
    scene.close();
});
