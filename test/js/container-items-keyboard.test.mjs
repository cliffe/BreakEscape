/**
 * Keyboard access to a container's contents grid (a safe, drawer or box; AC1 UI sweep).
 * Each item is a button stop named by the item, Enter and Space take it as a click does,
 * and after a take the focus moves on: the next item, the one before, Take Container, the X.
 * Never the body. Items with nothing to do are reachable and marked unavailable.
 * Run: node --max-old-space-size=2048 test/js/container-items-keyboard.test.mjs
 */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'container-kbd-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export const adds = [];\n' +
    'export const hooks = { gate: null, fail: false, throws: false };\n' +
    'export async function addToInventory(sprite) { adds.push(sprite.scenarioData.id); if (hooks.throws) throw new Error("boom"); if (hooks.gate) await hooks.gate; return hooks.fail ? { ok: false, reason: "no" } : { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js', 'utils/compromise-bolt.js',
    'utils/sync-before-fetch.js', 'minigames/container/container-item-image.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { ContainerMinigame, swallowHeldKey, releaseHeldEnter, returnToContainerAfterNotes } = await import(pathToFileURL(join(dir, 'minigames/container/container-minigame.js')));
const { adds, hooks } = await import(pathToFileURL(join(dir, 'systems/inventory.js')));

const item = (id, name, extra = {}) => ({ type: 'key', id, name, takeable: true, ...extra });
async function open(contents, { isTakeable = false } = {}) {
    adds.length = 0;
    document.body.innerHTML = '<div id="mg"></div>';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit() {} };
    window.playUISound = () => {};
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ contents: contents.map(c => ({ ...c })) }) });
    window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
    const containerItem = { scenarioData: { id: 'safe1', type: 'safe', name: 'Floor Safe', locked: false } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Floor Safe', containerItem, contents: contents.map(c => ({ ...c })), isTakeable });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    return mg;
}
const slots = () => [...document.querySelectorAll('.container-content-slot')];
const key = (el, k, init = {}) => {
    const ev = new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(ev);
    return ev;
};
const keyup = (el, k) => el.dispatchEvent(new window.KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
const settle = () => new Promise(r => setTimeout(r, 10));
const A = item('a', 'Brass Key'), B = item('b', 'Red Folder'), C = item('c', 'Tape Card');

test('every item is a tab stop, named by the item', async () => {
    await open([A, B, C]);
    const s = slots();
    assert.equal(s.length, 3);
    assert.deepEqual(s.map(e => e.tabIndex), [0, 0, 0]);
    assert.deepEqual(s.map(e => e.getAttribute('role')), ['button', 'button', 'button']);
    assert.deepEqual(s.map(e => e.getAttribute('aria-label')), ['Brass Key', 'Red Folder', 'Tape Card']);
});

test('Enter takes the item as a click does', async () => {
    await open([A, B, C]);
    const s = slots();
    s[0].focus();
    key(s[0], 'Enter'); await settle();
    assert.deepEqual(adds, ['a']);
    assert.equal(slots().length, 2);
});

test('Space takes the item', async () => {
    await open([A, B, C]);
    const s = slots();
    s[1].focus();
    key(s[1], ' '); await settle();
    assert.deepEqual(adds, ['b']);
    assert.deepEqual(slots().map(e => e.getAttribute('aria-label')), ['Brass Key', 'Tape Card']);
});

test('after a take the focus moves to the next item, or the one before when it was last', async () => {
    await open([A, B, C]);
    let s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    assert.ok(document.activeElement === slots()[0], 'next item');
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Red Folder');
    s = slots();
    s[1].focus(); key(s[1], 'Enter'); await settle();
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Red Folder', 'the one before when the last was taken');
});

test('the last take moves the focus to Take Container, else the X, never the body', async () => {
    await open([A], { isTakeable: true });
    let s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    assert.equal(document.activeElement.id, 'take-container-btn');

    await open([A]);
    s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    assert.equal(document.activeElement.id, 'minigame-close');
    assert.ok(document.activeElement !== document.body);
});

test('a click still takes the item, and an item with nothing to do is reachable but unavailable', async () => {
    await open([A, { type: 'notes', id: 'junk', name: 'Receipt', takeable: false }]);
    const s = slots();
    s[0].querySelector('img').click(); await settle();
    assert.deepEqual(adds, ['a']);
    const dead = slots()[0];
    assert.equal(dead.tabIndex, 0);
    assert.equal(dead.getAttribute('aria-disabled'), 'true');
    dead.focus(); key(dead, 'Enter'); await settle();
    assert.deepEqual(adds, ['a'], 'nothing taken');
    assert.equal(slots().length, 1);
});

test('a repeated keydown takes nothing', async () => {
    await open([A, B]);
    const s = slots();
    s[0].focus();
    key(s[0], 'Enter', { repeat: true }); key(s[0], ' ', { repeat: true }); await settle();
    assert.deepEqual(adds, []);
    assert.equal(slots().length, 2);
});

test('Enter and Space are default-prevented, and a document listener never sees them from a slot', async () => {
    await open([A, B]);
    const seen = [];
    const onDoc = (e) => seen.push(e.key);
    document.addEventListener('keydown', onDoc);
    try {
        const s = slots();
        s[0].focus();
        assert.equal(key(s[0], 'Enter').defaultPrevented, true);
        assert.equal(key(s[1], ' ').defaultPrevented, true);
        await settle();
        assert.deepEqual(seen, []);
        keyup(document.body, 'Enter');
    } finally { document.removeEventListener('keydown', onDoc); }
});

test('a keydown from a child of the slot is ignored', async () => {
    await open([A, B]);
    const img = slots()[0].querySelector('img');
    const ev = key(img, 'Enter'); await settle();
    assert.deepEqual(adds, []);
    assert.equal(ev.defaultPrevented, false);
});

test('focus is not moved when it went elsewhere during the server round trip', async () => {
    await open([A, B, C]);
    let release;
    hooks.gate = new Promise(r => { release = r; });
    try {
        const s = slots();
        s[0].focus(); key(s[0], 'Enter'); await settle();
        const other = document.createElement('button');
        document.body.appendChild(other);
        other.focus();
        release(); await settle();
        assert.equal(slots().length, 2, 'taken');
        assert.ok(document.activeElement === other, 'focus left alone');
    } finally { hooks.gate = null; }
});

test('after a take by Enter, repeated Enter keydowns are swallowed until the key is let go', async () => {
    await open([A], { isTakeable: true });
    const s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    const btn = document.getElementById('take-container-btn');
    assert.ok(document.activeElement === btn);
    let clicks = 0;
    btn.addEventListener('click', () => clicks++);
    const bubbled = [];
    const onDoc = (e) => bubbled.push(e.repeat);
    document.addEventListener('keydown', onDoc);
    try {
        const ev = key(btn, 'Enter', { repeat: true });
        assert.equal(ev.defaultPrevented, true);
        assert.deepEqual(bubbled, [], 'the repeat never reaches the page');
        keyup(btn, 'Enter');
        key(btn, 'Enter', { repeat: true });
        assert.deepEqual(bubbled, [true], 'swallowing stops at keyup');
    } finally { document.removeEventListener('keydown', onDoc); }
    assert.equal(clicks, 0);
});

test('the Enter swallow is removed when the minigame closes mid-hold', async () => {
    const mg = await open([A, B]);
    const s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    mg.cleanup();
    const bubbled = [];
    const onDoc = (e) => bubbled.push(e.repeat);
    document.addEventListener('keydown', onDoc);
    try {
        key(document.body, 'Enter', { repeat: true });
        assert.deepEqual(bubbled, [true], 'no leaked listener');
    } finally { document.removeEventListener('keydown', onDoc); }
});

test('a take already in progress is not started again, and a failed one can be retried', async () => {
    await open([A, B]);
    let release;
    hooks.gate = new Promise(r => { release = r; });
    try {
        const s = slots();
        s[0].focus();
        key(s[0], 'Enter'); await settle();
        key(s[0], 'Enter'); s[0].querySelector('img').click(); await settle();
        assert.deepEqual(adds, ['a'], 'one add inside the round trip');
        assert.equal(s[0].dataset.taking, '1');
        hooks.fail = true;
        release(); await settle();
        assert.equal(s[0].dataset.taking, undefined, 'cleared on failure');
        assert.equal(slots().length, 2, 'still there');
    } finally { hooks.gate = null; hooks.fail = false; }
    const s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    assert.deepEqual(adds, ['a', 'a'], 'retry works');
    assert.equal(slots().length, 1);
});

test('a share slot carries its path as a title and in its name', async () => {
    await open([{ type: 'network_share', id: 'sh', name: 'Public Files (\\\\fs01\\public)', takeable: false }]);
    const sl = slots()[0];
    assert.equal(sl.title, '\\\\fs01\\public');
    assert.equal(sl.getAttribute('aria-label'), 'Public Files, \\\\fs01\\public');
});

// ---- R2 fixes: held-key guard (Enter and Space), note return focus, take bookkeeping ----

// Whether a repeat keydown of k, sent to the page, is stopped before it reaches the bubble phase
function repeatSwallowed(k, init = {}) {
    let seen = false;
    const on = () => { seen = true; };
    document.addEventListener('keydown', on);
    try { document.body.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, repeat: true, ...init })); }
    finally { document.removeEventListener('keydown', on); }
    return !seen;
}
const NOTE = { type: 'notes', id: 'n1', name: 'Sticky Note', takeable: true, readable: true, text: 'hello' };

// Reopen as startMinigame would: a new ContainerMinigame built from the params, contents from the "server"
async function wireReturn(serverContents) {
    window.pendingContainerReturn = null;
    window.handleObjectInteraction = () => {};
    window.addToInventory = () => {};
    window.expectPanelWithin = () => {};
    window.clearExpectedPanel = () => {};
    window.gameAlert = () => {};
    const params = [];
    const host = document.getElementById('mg');
    window.MinigameFramework.mainGameScene = {};
    window.MinigameFramework.init = () => {};
    window.MinigameFramework.startMinigame = (name, _c, p) => {
        params.push(p);
        window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ contents: serverContents.map(c => ({ ...c })) }) });
        host.innerHTML = '';
        const mg = new ContainerMinigame(host, p);
        window.MinigameFramework.currentMinigame = mg;
        mg.ready = mg.init();
        return mg;
    };
    return params;
}

test('a note taken by Enter comes back with the focus on the next slot', async () => {
    releaseHeldEnter();
    await open([A, NOTE, C]);
    const params = await wireReturn([A, C]);
    const s = slots();
    s[1].focus(); key(s[1], 'Enter'); await settle();
    assert.equal(window.pendingContainerReturn.slotReturn.index, 1);
    returnToContainerAfterNotes();
    assert.equal(params.length, 1);
    assert.deepEqual(params[0].slotReturn, { index: 1, byKey: true }, 'slotReturn reaches the reopened minigame');
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Tape Card');
    releaseHeldEnter();
});

test('a last note taken by Enter returns the focus to the last slot left (clamped)', async () => {
    releaseHeldEnter();
    await open([A, B, NOTE]);
    const params = await wireReturn([A, B]);
    const s = slots();
    s[2].focus(); key(s[2], 'Enter'); await settle();
    returnToContainerAfterNotes();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(params[0].slotReturn.index, 2);
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Red Folder');
    releaseHeldEnter();
});

test('a note taken with the mouse returns the focus to the grid, not a slot', async () => {
    releaseHeldEnter();
    await open([A, NOTE, C]);
    const params = await wireReturn([A, C]);
    slots()[1].querySelector('img').click(); await settle();
    returnToContainerAfterNotes();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(params[0].slotReturn, null);
    assert.equal(document.activeElement.id, 'container-contents-grid');
});

test('Space on the last item: repeats and the ending keyup are swallowed, then the guard lets go', async () => {
    releaseHeldEnter();
    await open([A], { isTakeable: true });
    const s = slots();
    s[0].focus(); key(s[0], ' '); await settle();
    assert.equal(document.activeElement.id, 'take-container-btn');
    assert.equal(repeatSwallowed(' '), true, 'Space repeat');
    assert.equal(repeatSwallowed('Enter'), false, 'other keys pass');
    let up = 0;
    const onUp = () => up++;
    document.addEventListener('keyup', onUp);
    let ev;
    try {
        ev = new window.KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true });
        document.body.dispatchEvent(ev);
    } finally { document.removeEventListener('keyup', onUp); }
    assert.equal(up, 0, 'the Space keyup never reaches the button');
    assert.equal(ev.defaultPrevented, true, 'so the native click does not fire');
    assert.equal(repeatSwallowed(' '), false, 'released after that keyup');
});

test('a fresh press of the armed key releases the guard', async () => {
    releaseHeldEnter();
    swallowHeldKey('Enter');
    assert.equal(repeatSwallowed('Enter'), true);
    assert.equal(repeatSwallowed('Enter', { repeat: false }), false, 'a fresh press goes through');
    assert.equal(repeatSwallowed('Enter'), false, 'and the guard is gone');
    swallowHeldKey(' ');
    assert.equal(repeatSwallowed(' ', { repeat: false }), false);
    assert.equal(repeatSwallowed(' '), false);
});

test('the guard gives up after 2 seconds', () => {
    releaseHeldEnter();
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        swallowHeldKey('Enter');
        mock.timers.tick(1999);
        assert.equal(repeatSwallowed('Enter'), true, 'still armed at 1999ms');
        // each swallowed repeat restarts the clock: a long hold never leaks a repeat
        for (let i = 0; i < 5; i++) {
            mock.timers.tick(1999);
            assert.equal(repeatSwallowed('Enter'), true, `still held after ${(i + 2) * 1999}ms`);
        }
        // no repeats and no keyup (the keyup was lost): released 2s after the last repeat
        mock.timers.tick(2000);
        assert.equal(repeatSwallowed('Enter'), false, 'released 2s after the last repeat');
    } finally { mock.timers.reset(); releaseHeldEnter(); }
});

test('a keydown inside IME composition is left alone, and a window blur releases the guard', () => {
    releaseHeldEnter();
    swallowHeldKey('Enter');
    assert.equal(repeatSwallowed('Enter', { isComposing: true }), false);
    assert.equal(repeatSwallowed('Enter'), true, 'still armed');
    window.dispatchEvent(new window.Event('blur'));
    assert.equal(repeatSwallowed('Enter'), false, 'blur releases');
});

test('a close that hands over to a note viewer keeps the guard alive; any other close removes it', async () => {
    releaseHeldEnter();
    const mg = await open([A, NOTE]);
    const s = slots();
    s[0].focus(); key(s[0], 'Enter'); await settle();
    mg.exitReason = 'item';
    mg.cleanup();
    assert.equal(repeatSwallowed('Enter'), true, 'alive into the next view');
    keyup(document.body, 'Enter');
    assert.equal(repeatSwallowed('Enter'), false, 'Enter keyup ends it');
    const mg2 = await open([A, B]);
    slots()[0].focus(); key(slots()[0], 'Enter'); await settle();
    mg2.exitReason = 'close';
    mg2.cleanup();
    assert.equal(repeatSwallowed('Enter'), false);
});

test('dataset.taking is cleared after a copy and after a throw', async () => {
    releaseHeldEnter();
    const mg = await open([A, B]);
    mg.sourcePcId = 'pc1';
    let slot = slots()[0];
    await mg.takeItem(A, slot.querySelector('img'), 'copy');
    assert.deepEqual(adds, ['a']);
    assert.equal(slot.dataset.taking, undefined, 'cleared after a copy');
    assert.ok(slot.isConnected, 'a copy stays');
    hooks.throws = true;
    try {
        slot = slots()[1];
        await assert.rejects(() => mg.takeItem(B, slot.querySelector('img')), /boom/);
        assert.equal(slot.dataset.taking, undefined, 'cleared after a throw');
    } finally { hooks.throws = false; }
});

test('Copy / Move chosen by key arms the guard; chosen by mouse does not', async () => {
    releaseHeldEnter();
    const mg = await open([A]);
    const dlg = (item, element) => { mg.transferDialog = { item, element, choices: ['move', 'cancel'], el: document.createElement('div'), opener: null }; };
    dlg(A, slots()[0].querySelector('img'));
    mg.chooseTransfer('move', true); await settle();
    assert.equal(slots().length, 0, 'moved');
    assert.equal(repeatSwallowed('Enter'), true, 'a held Enter cannot press what the focus lands on');
    releaseHeldEnter();
    const mg2 = await open([A]);
    mg2.transferDialog = { item: A, element: slots()[0].querySelector('img'), choices: ['move', 'cancel'], el: document.createElement('div'), opener: null };
    mg2.chooseTransfer('move', false); await settle();
    assert.equal(repeatSwallowed('Enter'), false);
});

test('Enter or Space on a desktop icon arms the guard', async () => {
    releaseHeldEnter();
    document.body.innerHTML = '<div id="mg"></div>';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit() {} };
    window.playUISound = () => {};
    window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
    const files = [{ type: 'text_file', id: 'f1', name: 'Rota.txt', takeable: false, text: 'x' }];
    const containerItem = { scenarioData: { id: 'pc1', type: 'pc', name: 'PC' } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'PC', containerItem, contents: files, isTakeable: false, desktopMode: true });
    window.MinigameFramework.currentMinigame = mg;
    mg.openFileInPlace = () => {};
    await mg.init();
    const icon = document.querySelector('.desktop-icon');
    assert.ok(icon, 'an icon');
    key(icon, 'Enter');
    assert.equal(repeatSwallowed('Enter'), true, 'Enter armed');
    releaseHeldEnter();
    key(icon, ' ');
    assert.equal(repeatSwallowed(' '), true, 'Space armed');
    releaseHeldEnter();
    key(icon, 'Enter', { repeat: true });
    assert.equal(repeatSwallowed('Enter'), false, 'a repeat arms nothing');
});

test('an aria-disabled slot dims only its picture in CSS', () => {
    const css = readFileSync(join(js, '../css/container-minigame.css'), 'utf8');
    const block = css.match(/\.container-content-slot\[aria-disabled="true"\],\s*\.container-content-slot\[aria-disabled="true"\]:hover \{[^}]*\}/)[0];
    assert.doesNotMatch(block, /opacity/);
    assert.match(block, /border-style: dashed/);
    assert.match(css, /\.container-content-slot\[aria-disabled="true"\] \.container-content-item \{\s*opacity: 0\.6;/);
});
