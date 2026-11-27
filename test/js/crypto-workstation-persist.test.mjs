// Closing the crypto workstation keeps the CyberChef iframe loaded, and reopening
// doesn't reload it, so the player's recipe and input survive.
// Run with: node --test test/js/crypto-workstation-persist.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
// Copy the source to a temp .mjs so it loads as an ES module in isolation.
const dir = mkdtempSync(join(tmpdir(), 'cryptows-'));
// The module imports ../systems/global-writer.js, so mirror both folders.
mkdirSync(join(dir, 'utils')); mkdirSync(join(dir, 'systems'));
const jsRoot = join(here, '../../public/break_escape/js');
writeFileSync(join(dir, 'utils/crypto-workstation.mjs'), readFileSync(join(jsRoot, 'utils/crypto-workstation.js'), 'utf8').replace("global-writer.js'", "global-writer.mjs'"));
writeFileSync(join(dir, 'systems/global-writer.mjs'), readFileSync(join(jsRoot, 'systems/global-writer.js'), 'utf8'));
const mod = await import(pathToFileURL(join(dir, 'utils/crypto-workstation.mjs')).href);

function setup() {
    const state = { srcSets: 0, attr: '', opened: [], liveHref: null };
    const frame = {
        getAttribute: (n) => (n === 'src' ? state.attr : null),
        set src(v) { state.srcSets++; state.attr = v; },
        get src() { return state.attr; },
        contentWindow: { location: { get href() { if (state.liveHref === 'throw') throw new Error('x'); return state.liveHref; } } },
    };
    const popup = { style: { display: 'none' } };
    globalThis.document = { getElementById: (id) => ({ 'cyberchef-frame': frame, 'laptop-popup': popup })[id] };
    globalThis.window = { open: (u, t) => state.opened.push([u, t]) };
    return { state, frame, popup };
}

test('close hides the popup and keeps the iframe src', () => {
    const { state, popup } = setup();
    mod.openCryptoWorkstation();
    const loaded = state.attr;
    assert.match(loaded, /CyberChef_v10\.19\.4\.html$/);
    assert.equal(popup.style.display, 'block');
    mod.closeLaptop();
    assert.equal(popup.style.display, 'none');
    assert.equal(state.attr, loaded);
});

test('reopen does not reload the frame; first open loads it once', () => {
    const { state, popup } = setup();
    mod.openCryptoWorkstation();
    mod.closeLaptop();
    mod.openCryptoWorkstation();
    mod.closeLaptop();
    mod.openCryptoWorkstation();
    assert.equal(state.srcSets, 1);
    assert.equal(popup.style.display, 'block');
});

test('new tab opens the live frame location (recipe hash), else the base URL', () => {
    const { state } = setup();
    mod.openCryptoWorkstation();
    state.liveHref = 'http://h/break_escape/assets/cyberchef/CyberChef_v10.19.4.html#recipe=To_Hex()&input=YWJj';
    mod.openCryptoWorkstationInNewTab();
    assert.equal(state.opened[0][0], state.liveHref);
    state.liveHref = 'throw';
    mod.openCryptoWorkstationInNewTab();
    assert.equal(state.opened[1][0], '/break_escape/assets/cyberchef/CyberChef_v10.19.4.html');
});

// ---- decode watch (blind m03 m4/m7): tasks tick when the output shows the decode ----
test('matchDecodeWatches: marker found ignoring case and whitespace, fired ones skipped', () => {
    const watches = [
        { contains: 'ZERO DAY: ACTIVE CLIENT ROSTER', setVariable: 'roster_decoded' },
        { contains: 'NIGHT TEAM: CATALOGUE', setVariable: 'whiteboard_decoded' },
    ];
    assert.deepEqual(mod.matchDecodeWatches('5a45524f', watches), []);
    const hit = mod.matchDecodeWatches('zero day:\n  active   client roster (export)', watches);
    assert.deepEqual(hit.map((w) => w.setVariable), ['roster_decoded']);
    assert.deepEqual(mod.matchDecodeWatches('ZERO DAY: ACTIVE CLIENT ROSTER', watches, new Set(['roster_decoded'])), []);
    assert.deepEqual(mod.matchDecodeWatches('', watches), []);
    assert.deepEqual(mod.matchDecodeWatches('x', null), []);
});

test('readCyberChefOutput reads the output pane, and is empty when the frame is unreadable', () => {
    const doc = { querySelector: (s) => (s === '#output-text .cm-content' ? { innerText: 'decoded text' } : null) };
    assert.equal(mod.readCyberChefOutput({ contentDocument: doc }), 'decoded text');
    assert.equal(mod.readCyberChefOutput({ get contentDocument() { throw new Error('cross-origin'); } }), '');
    assert.equal(mod.readCyberChefOutput(null), '');
});

test('opening the workstation with a decodeWatch sets the global once the output shows the marker', async () => {
    const { frame } = setup();
    const events = [];
    const out = { text: 'hex only' };
    frame.contentDocument = { querySelector: () => ({ innerText: out.text }) };
    globalThis.window.gameState = { globalVariables: {} };
    globalThis.window.eventDispatcher = { emit: (n, d) => events.push([n, d.value]) };
    globalThis.window.inventory = { items: [{ scenarioData: { type: 'workstation',
        decodeWatch: [{ contains: 'CLIENT ROSTER', setVariable: 'roster_decoded' }] } }] };
    mod.openCryptoWorkstation();
    try {
        await new Promise((r) => setTimeout(r, mod.DECODE_WATCH_INTERVAL_MS + 150));
        assert.equal(events.length, 0);
        out.text = 'Zero Day: Active Client Roster';
        await new Promise((r) => setTimeout(r, mod.DECODE_WATCH_INTERVAL_MS + 150));
        assert.deepEqual(events, [['global_variable_changed:roster_decoded', true]]);
        assert.equal(globalThis.window.gameState.globalVariables.roster_decoded, true);
    } finally {
        mod.closeLaptop();
    }
});

test('a decode lands through writeGlobal: the open chat story gets the value, the event fires once', async () => {
    const { frame } = setup();
    const events = [];
    const out = { text: 'Night Team: Catalogue' };
    frame.contentDocument = { querySelector: () => ({ innerText: out.text }) };
    const chatWrites = [];
    const chatStory = { variablesState: { _defaultGlobalVariables: new Map([['whiteboard_decoded', false]]), $: (n, v) => chatWrites.push([n, v]) } };
    const w = globalThis.window;
    w.gameState = { globalVariables: {} };
    w.eventDispatcher = { emit: (n, d) => events.push([n, d.value]) };
    w.npcConversationStateManager = { broadcastGlobalVariableChange: () => {}, isGlobalVariable: () => true };
    w.MinigameFramework = { currentMinigame: { npcId: 'hax', inkEngine: { story: chatStory } } };
    w.inventory = { items: [{ scenarioData: { type: 'workstation',
        decodeWatch: [{ contains: 'NIGHT TEAM: CATALOGUE', setVariable: 'whiteboard_decoded' }] } }] };
    mod.openCryptoWorkstation();
    try {
        await new Promise((r) => setTimeout(r, mod.DECODE_WATCH_INTERVAL_MS * 2 + 200));
        assert.equal(w.gameState.globalVariables.whiteboard_decoded, true);
        assert.deepEqual(chatWrites, [['whiteboard_decoded', true]]);
        assert.deepEqual(events, [['global_variable_changed:whiteboard_decoded', true]]);
    } finally {
        mod.closeLaptop();
    }
});
