// RFID reader: "Access Denied" stays until the player taps or 3 s pass, and a refused card
// at a door is reported as door_unlock_failed (via unlock-system's emitDoorUnlockFailed).
// Run with: node --test test/js/rfid-denial-hold.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'rfid-denial-'));
function copy(p, rewrites = {}) {
    let code = readFileSync(src(p), 'utf8');
    for (const [from, to] of Object.entries(rewrites)) code = code.split(from).join(to);
    const out = join(tmp, basename(p).replace(/\.js$/, '.mjs'));
    writeFileSync(out, code);
    return pathToFileURL(out).href;
}
// Only the controller is under test; its collaborators are stubbed.
writeFileSync(join(tmp, 'base-minigame.mjs'), 'export class MinigameScene { constructor() {} init() {} start() {} complete() {} cleanup() {} }');
for (const n of ['rfid-ui', 'rfid-data', 'rfid-animations', 'rfid-attacks']) {
    const cls = { 'rfid-ui': 'RFIDUIRenderer', 'rfid-data': 'RFIDDataManager', 'rfid-animations': 'RFIDAnimations', 'rfid-attacks': 'MIFAREAttackManager' }[n];
    writeFileSync(join(tmp, `${n}.mjs`), `export class ${cls} {}`);
}
writeFileSync(join(tmp, 'rfid-protocols.mjs'), 'export const detectProtocol = () => "EM4100";');
const url = copy('minigames/rfid/rfid-minigame.js', {
    "'../framework/base-minigame.js'": "'./base-minigame.mjs'",
    "'./rfid-ui.js'": "'./rfid-ui.mjs'", "'./rfid-data.js'": "'./rfid-data.mjs'",
    "'./rfid-animations.js'": "'./rfid-animations.mjs'", "'./rfid-attacks.js'": "'./rfid-attacks.mjs'",
    "'./rfid-protocols.js'": "'./rfid-protocols.mjs'",
});

// Fake clock, so the 3 s hold runs instantly
let now = 0, timers = [], nextId = 1;
globalThis.setTimeout = (fn, ms = 0) => { const id = nextId++; timers.push({ id, at: now + ms, fn }); return id; };
globalThis.clearTimeout = (id) => { timers = timers.filter(t => t.id !== id); };
function advance(ms) {
    const until = now + ms;
    for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const t = timers[0];
        if (!t || t.at > until) break;
        timers.shift(); now = t.at; t.fn();
    }
    now = until;
}

const mk = (tag) => ({ tag, children: [], listeners: {}, className: '', textContent: '',
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(x => x !== f); } });
const events = [];
globalThis.window = { lockRef: (d) => d?.card_id, eventDispatcher: { emit: (n, d) => events.push([n, d]) } };
globalThis.document = { createElement: mk };

const { RFIDMinigame, DENIAL_HOLD_MS } = await import(url);
const unlockSrc = readFileSync(src('systems/unlock-system.js'), 'utf8');

function setup(params = {}) {
    const screen = mk('div');
    const calls = [];
    const refused = [];
    const m = new RFIDMinigame(mk('div'), { mode: 'unlock', requiredCardIds: ['exec_card'], onRefused: (r) => refused.push(r), ...params });
    m.ui = { getScreen: () => screen,
        showError: (msg) => { screen.children = []; calls.push(['error', msg]); },
        showSuccess: (msg) => calls.push(['success', msg]),
        showTapInterface: () => calls.push(['tap']),
        showSavedCards: () => calls.push(['saved']) };
    m.animations = { showTapFailure() {}, showTapSuccess() {}, showEmulationFailure() {}, showEmulationSuccess() {}, cleanup() {} };
    m.attackManager = { cleanup() {} };
    m.complete = (ok) => calls.push(['complete', ok]);
    events.length = 0;
    return { m, screen, calls, refused };
}
const tapScreen = (screen) => (screen.listeners.click || []).slice().forEach(f => f({ stopPropagation() {} }));
const wrongCard = { scenarioData: { name: 'Staff Access Badge', card_id: 'staff_badge' } };

test('hold is 3 s', () => assert.equal(DENIAL_HOLD_MS, 3000));

test('a wrong physical card: denial holds past the old 1.5 s, returns at 3 s', () => {
    const { m, calls, screen } = setup();
    m.handleCardTap(wrongCard);
    assert.deepEqual(calls, [['error', 'Access Denied']]);
    assert.ok(screen.children.some(c => c.textContent === 'Tap to continue'));
    advance(1500);
    assert.deepEqual(calls, [['error', 'Access Denied']], 'still showing at 1.5 s');
    advance(1499);
    assert.equal(calls.length, 1);
    advance(1);
    assert.deepEqual(calls.at(-1), ['tap']);
    advance(10000);
    assert.equal(calls.filter(c => c[0] === 'tap').length, 1, 'returns once');
});

test('a tap on the screen ends the denial early, once', () => {
    const { m, calls, screen } = setup();
    m.handleCardTap(wrongCard);
    tapScreen(screen);   // the click that tapped the card arrives before the listener is armed
    assert.equal(calls.length, 1, 'the tapping click itself does not dismiss');
    advance(0);
    tapScreen(screen);
    assert.deepEqual(calls.at(-1), ['tap']);
    advance(5000);
    assert.equal(calls.filter(c => c[0] === 'tap').length, 1);
    assert.equal((screen.listeners.click || []).length, 0, 'listener removed');
});

test('a wrong saved card: denial holds, then the saved list', () => {
    const { m, calls } = setup();
    m.handleEmulate({ name: 'Visitor', card_id: 'visitor', rfid_protocol: 'EM4100' });
    advance(2999);
    assert.deepEqual(calls.map(c => c[0]), ['error']);
    advance(1);
    assert.deepEqual(calls.at(-1), ['saved']);
});

test('refusals at a door are reported through onRefused with a reason', () => {
    let s = setup();
    s.m.handleCardTap(wrongCard);
    assert.deepEqual(s.refused, ['wrong_card']);
    s = setup();
    s.m.handleEmulate({ name: 'Visitor', card_id: 'visitor', rfid_protocol: 'EM4100' });
    assert.deepEqual(s.refused, ['wrong_card']);
    assert.ok(events.some(([n, d]) => n === 'card_emulated' && d.success === false), 'card_emulated still emitted');
    s = setup({ requiredCardIds: ['desfire_card'] });
    s.m.handleEmulate({ name: 'D', card_id: 'desfire_card', rfid_protocol: 'MIFARE_DESFire', rfid_data: {} });
    assert.deepEqual(s.refused, ['uid_only']);
});

test('the right card is not a refusal; browsing (no lock) never reports', () => {
    let s = setup();
    s.m.handleCardTap({ scenarioData: { name: 'Exec', card_id: 'exec_card' } });
    assert.deepEqual(s.refused, []);
    advance(1500);
    assert.deepEqual(s.calls.at(-1), ['complete', true]);
    s = setup({ requiredCardIds: [] });
    s.m.handleEmulate({ name: 'Visitor', card_id: 'visitor' });
    assert.deepEqual(s.refused, []);
});

test('closing the minigame mid-denial cancels the return', () => {
    const { m, calls } = setup();
    m.handleCardTap(wrongCard);
    m.cleanup();
    advance(5000);
    assert.deepEqual(calls, [['error', 'Access Denied']]);
});

test('unlock-system wires the reader to door_unlock_failed, and reports no card at all', () => {
    assert.match(unlockSrc, /onRefused: emitDoorUnlockFailed/);
    assert.match(unlockSrc, /Requires RFID keycard[^\n]*\n\s*emitDoorUnlockFailed\('no_card'\)/);
    // the helper emits the generic and the per-room event
    assert.match(unlockSrc, /emit\('door_unlock_failed', payload\)/);
    assert.match(unlockSrc, /emit\(`door_unlock_failed:\$\{doorAttemptData\.connectedRoom\}`, payload\)/);
});
