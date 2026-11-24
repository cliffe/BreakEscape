/**
 * A readable note taken from a container opens the note viewer over it; when the viewer
 * closes the container comes back with what is left (AC1 UI sweep, m09 safe). A last item
 * closes to the world, and a note on the floor is untouched.
 * Run: node --max-old-space-size=2048 test/js/note-returns-to-container.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const root = mkdtempSync(join(tmpdir(), 'note-returns-'));
// minigame-manager.js imports '../../../js/core/player.js', which lands beside the app folder
const dir = join(root, 'app');
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
mkdirSync(join(root, 'js/core'), { recursive: true });
writeFileSync(join(root, 'js/core/player.js'), 'export function setPlayerInput() {}\n');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export const adds = [];\n' +
    'export async function addToInventory(sprite) { adds.push(sprite); return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js', 'utils/compromise-bolt.js',
    'utils/sync-before-fetch.js', 'utils/note-markdown.js', 'utils/test-state-text.js',
    'minigames/container/container-item-image.js', 'minigames/framework/base-minigame.js',
    'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js', 'systems/pc-sessions.js', 'systems/mfa-client.js',
    'minigames/framework/minigame-manager.js', 'minigames/notes/notes-minigame.js',
    'systems/test-bridge/minigames.js', 'systems/test-bridge/input.js', 'utils/overlay-open.js']) copy(rel);
put('systems/test-bridge/log.js', 'export const logAction = () => {};\n');
// The bridge's own summary needs the registry; a copy of the part it uses
put('systems/test-bridge/state.js',
    'export function activeMinigameSummary() {\n' +
    '  const fw = window.MinigameFramework; const mg = fw?.currentMinigame; if (!mg) return null;\n' +
    '  let id = null; for (const [k, C] of Object.entries(fw.registeredScenes || {})) { if (mg instanceof C) { id = k; break; } }\n' +
    '  return { id: id || mg.constructor.name };\n}\n');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
// jsdom has no layout: every element not display:none has a size, so the bridge's visibility
// test (isTestVisible) sees the items and the X
window.HTMLElement.prototype.getBoundingClientRect = function () {
    const shown = this.style.display !== 'none';
    return { width: shown ? 20 : 0, height: shown ? 20 : 0, left: 0, top: 0, right: 20, bottom: 20, x: 0, y: 0 };
};
// The framed game container is the one that scrolls (the grid has no overflow)
Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return this.classList.contains('minigame-game-container') ? 1000 : 0; } });
Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return this.classList.contains('minigame-game-container') ? 300 : 0; } });
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { ContainerMinigame, returnToContainerAfterNotes, startContainerMinigame, lastNoteClosesToWorld, scrollingAncestor } = await imp('minigames/container/container-minigame.js');
const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
const { NotesMinigame, startNotesMinigame } = await imp('minigames/notes/notes-minigame.js');
const { minigameBridge } = await imp('systems/test-bridge/minigames.js');
const { adds } = await imp('systems/inventory.js');

const settle = async (ms = 250) => { await new Promise(r => setTimeout(r, ms)); };
const note = (id, name) => ({ type: 'notes', id, name, takeable: true, readable: true, text: `Text of ${name}` });
const NOTES = [note('n1', 'Reading 1'), note('n2', 'Reading 2'), note('n3', 'Reading 3')];
const CARD = { type: 'key', id: 'card', name: 'Tape Card', takeable: true };
const SAFE = () => ({ scenarioData: { id: 'safe1', name: 'Floor Safe', type: 'safe', locked: false } });

let taken, fetches, worldAlerts, fetchDelayMs, expects, clears, events;

function setup(serverContents) {
    taken = new Set(); fetches = []; worldAlerts = []; fetchDelayMs = 0; expects = []; clears = 0; events = [];
    adds.length = 0;
    document.body.innerHTML = '';
    for (const k of Object.keys(MinigameFramework.registeredScenes)) delete MinigameFramework.registeredScenes[k];
    MinigameFramework.currentMinigame = null;
    MinigameFramework.mainGameScene = {};
    MinigameFramework.registerScene('container', ContainerMinigame);
    MinigameFramework.registerScene('notes', NotesMinigame);
    window.MinigameFramework = MinigameFramework;
    window.pendingContainerReturn = null;
    window.pendingTextFileReturn = null;
    window.pendingPhoneReturn = null;
    window.currentPlayerRoom = 'office';
    window.breakEscapeConfig = { gameId: 9 };
    window.inventory = { items: [] };
    window.gameState = { notes: [], globalVariables: {} };
    window.gameAlert = (m) => { worldAlerts.push(m); events.push('alert'); };
    // inventory.js is stubbed here: the real helper's wording is tested in container-note-toast.test.mjs
    window.noteAddedText = (n) => `Added "${n}" to your notes.`;
    window.announceNoteAdded = (n) => window.gameAlert(`Added "${n}" to your notes.`, 'info', 'Note Added', 3000);
    window.expectPanelWithin = (ms) => { expects.push(ms); events.push('expect'); };
    window.clearExpectedPanel = () => { clears++; events.push('clear'); };
    window.lastNoteClosesToWorld = lastNoteClosesToWorld;
    window.playUISound = () => {};
    window.addNote = (title, text) => { window.gameState.notes.push({ title, text }); return { title }; };
    window.eventDispatcher = { emit() {}, on() {}, off() {} };
    window.returnToContainerAfterNotes = returnToContainerAfterNotes;
    window.startNotesMinigame = startNotesMinigame;
    window.startContainerMinigame = (item, contents, takeable, desktop, npcOptions, extra) =>
        startContainerMinigame(item, contents, takeable, desktop, npcOptions, extra);
    // What the server answers on a reopen: the contents minus what was registered as taken
    window.fetch = globalThis.fetch = async (url) => {
        fetches.push(url);
        if (fetchDelayMs) await new Promise(r => setTimeout(r, fetchDelayMs));
        const left = serverContents.filter(i => !taken.has(i.id));
        return { ok: true, status: 200, statusText: 'OK', json: async () => JSON.parse(JSON.stringify({ contents: left })) };
    };
    // interactions.js for a readable note: take it (registers it) and open the viewer
    window.handleObjectInteraction = (sprite) => {
        const d = sprite.scenarioData;
        if (d.takeable) { d.takeable = false; taken.add(d.id); }
        window.startNotesMinigame(sprite, d.text, d.observations || '');
    };
}

const current = () => MinigameFramework.currentMinigame;
const slots = () => [...document.querySelectorAll('.container-content-item')];
async function openSafe(contents) {
    window.startContainerMinigame(SAFE(), contents.map(c => ({ ...c })), false, false);
    await settle(20);
}
const closeViewer = async () => { current().closeByPlayer(); await settle(); };

test('taking a note from a container with more items: the viewer opens, closes, the container returns with the rest', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    assert.equal(current()._sceneType, 'container');
    assert.equal(slots().length, 4);
    slots()[0].click();
    await settle(20);
    assert.equal(current()._sceneType, 'notes', 'the note opens on pickup');
    await closeViewer();
    assert.equal(current()?._sceneType, 'container', 'the container is back');
    assert.equal(slots().length, 3, 'the rest are listed');
    assert.ok(!slots().some(s => s.alt === 'Reading 1'), 'the read note is gone from the list');
    assert.equal(window.pendingContainerReturn, null, 'the return is spent');
    // A second and third take work without reopening the safe by hand
    slots()[0].click();
    await settle(20);
    assert.equal(current()._sceneType, 'notes');
    await closeViewer();
    assert.equal(current()?._sceneType, 'container');
    assert.equal(slots().length, 2);
});

test('the viewer closed with Escape also returns to the container', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    slots()[1].click();
    await settle(20);
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    // No closeByPlayer fallback: if Escape does nothing the viewer is still up and this fails
    assert.equal(current()?._sceneType, 'container', 'Escape closed the viewer and the container came back');
    assert.equal(slots().length, 3);
});

test('the last item in the container: no reopen, the player lands in the world', async () => {
    setup([NOTES[0]]);
    await openSafe([NOTES[0]]);
    slots()[0].click();
    await settle(20);
    assert.equal(current()._sceneType, 'notes');
    await closeViewer();
    assert.equal(current(), null, 'nothing reopens over an empty container');
    assert.equal(window.pendingContainerReturn, null);
});

test('a note read from the floor is unchanged: no container opens when it closes', async () => {
    setup([NOTES[0]]);
    const floor = note('floor', 'Floor note');
    window.handleObjectInteraction({ scenarioData: floor, name: 'notes', objectId: 'floor_1' });
    await settle(20);
    assert.equal(current()._sceneType, 'notes');
    await closeViewer();
    assert.equal(current(), null);
    assert.equal(fetches.length, 0, 'no container was fetched');
});

test('the container comes back at the same scroll position on the scrolling ancestor, with focus inside it', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    const grid = document.getElementById('container-contents-grid');
    const scroller = document.querySelector('.minigame-game-container');
    const css = document.createElement('style'); // the real stylesheet makes the framed container scroll
    css.textContent = '.minigame-game-container { overflow-y: auto; }';
    document.head.appendChild(css);
    assert.equal(scrollingAncestor(grid), scroller, 'the scroller is the framed container, not the grid');
    scroller.scrollTop = 40;
    slots()[0].click();
    await settle(20);
    await closeViewer();
    const grid2 = document.getElementById('container-contents-grid');
    const scroller2 = document.querySelector('.minigame-game-container');
    await settle(60);
    assert.equal(scroller2.scrollTop, 40, 'restored on the scrolling ancestor');
    assert.equal(grid2.scrollTop, 0, 'the grid itself never scrolls');
    assert.ok(current().container.contains(document.activeElement), 'focus is inside the container frame');
});

test('lastNoteClosesToWorld: only an ordinary, empty, non-takeable container closes to the world', () => {
    const base = () => ({
        itemToTake: NOTES[0], contents: [], isTakeable: false, npcOptions: null,
        containerItem: SAFE()
    });
    assert.equal(lastNoteClosesToWorld(base()), true, 'ordinary safe');
    assert.equal(lastNoteClosesToWorld({ ...base(), contents: [CARD] }), false, 'something left');
    assert.equal(lastNoteClosesToWorld({ ...base(), itemToTake: null }), false, 'no note taken');
    assert.equal(lastNoteClosesToWorld({ ...base(), isTakeable: true }), false, 'takeable container keeps its Take button');
    assert.equal(lastNoteClosesToWorld({ ...base(), npcOptions: { mode: 'npc', npcId: 'x' } }), false, 'NPC container');
    const withData = (extra, top = {}) => ({ ...base(), containerItem: { ...top, scenarioData: { ...SAFE().scenarioData, ...extra } } });
    assert.equal(lastNoteClosesToWorld(withData({ lockType: 'login' })), false, 'login PC');
    assert.equal(lastNoteClosesToWorld(withData({ name: 'Finance PC', type: 'pc' })), false, 'desktop-mode container');
    assert.equal(lastNoteClosesToWorld(withData({ networkShare: { footholdId: 'f1' } })), false, 'network share');
    assert.equal(lastNoteClosesToWorld(withData({}, { sourcePcId: 'pc1' })), false, 'folder on a PC');
    assert.equal(lastNoteClosesToWorld(withData({}, { parentLockable: SAFE() })), false, 'folder below a desktop');
});

test('a takeable container with one note left reopens (Take Container stays reachable)', async () => {
    setup([NOTES[0]]);
    window.startContainerMinigame(SAFE(), [{ ...NOTES[0] }], true, false);
    await settle(20);
    slots()[0].click();
    await settle(20);
    await closeViewer();
    assert.equal(current()?._sceneType, 'container', 'back in the container');
    assert.ok(document.getElementById('take-container-btn'), 'the Take Container button is there');
});

test('a login PC and an NPC container with a last note keep their own return', async () => {
    setup([NOTES[0]]);
    const pc = { scenarioData: { id: 'pc9', name: 'Desk PC', type: 'pc', locked: false, lockType: 'login' } };
    const st = { containerItem: pc, contents: [], isTakeable: false, itemToTake: NOTES[0], npcOptions: null };
    assert.equal(lastNoteClosesToWorld(st), false);
    assert.equal(lastNoteClosesToWorld({ ...st, containerItem: SAFE(), npcOptions: { mode: 'npc', npcId: 'n' } }), false);
});

test('the last note: "Added to your notes" is raised at once, with no panel expected', async () => {
    setup([NOTES[0]]);
    await openSafe([NOTES[0]]);
    slots()[0].click();
    await settle(20);
    await closeViewer();
    assert.equal(current(), null);
    assert.deepEqual(worldAlerts.filter(m => /to your notes/.test(m)), ['Added "Reading 1" to your notes.']);
    // The viewer's own close expects a panel (it normally reopens the container); the engine
    // clears that before the toast, so the toast is not held for the ~1 s window.
    const alertAt = events.lastIndexOf('alert');
    assert.ok(alertAt > 0 && events[alertAt - 1] === 'clear', `cleared right before the toast: ${events.join(',')}`);
});

test('a note with more left reopens the container with the notice in its window and no toast', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    slots()[0].click();
    await settle(20);
    await closeViewer();
    assert.equal(current()._sceneType, 'container');
    assert.deepEqual(worldAlerts.filter(m => /to your notes/.test(m)), [], `no toast: ${worldAlerts.join('|')}`);
    const msgs = [...document.querySelectorAll('.container-message-success')].map(m => m.textContent);
    assert.deepEqual(msgs, ['Added "Reading 1" to your notes.']);
    assert.ok(expects.length >= 1, 'the reopen still holds other toasts');
});

test('fallback: with no noteAddedText helper loaded, a note with more left toasts once, held for the container', async () => {
    setup([...NOTES, CARD]);
    delete window.noteAddedText;
    await openSafe([...NOTES, CARD]);
    slots()[0].click();
    await settle(20);
    await closeViewer();
    const alertAt = events.lastIndexOf('alert');
    assert.equal(events[alertAt - 1], 'expect', `the toast waits for the container reopening: ${events.join(',')}`);
    assert.equal(worldAlerts.filter(m => /to your notes/.test(m)).length, 1);
});

// ── test bridge: take() and close() across the slow reopen ─────────────────────────────
test('bridge: take A, close, take B at once, with a slow fetch: both work, no no-takeable-items', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    fetchDelayMs = 400; // the reopened container shows "Loading contents..." for this long
    const a = await minigameBridge.take('Reading 1');
    assert.equal(a.ok, true);
    assert.equal(a.openedViewer, 'notes');
    assert.equal(a.returnsToContainer, true);
    const c = await minigameBridge.close();
    assert.equal(c.nowActive, 'container');
    assert.equal(c.returnedToContainer, true);
    assert.ok(document.querySelector('.loading') === null, 'close() waited for the contents to load');
    const b = await minigameBridge.take('Reading 2');
    assert.equal(b.ok, true, JSON.stringify(b));
    assert.equal(b.took, 'Reading 2');
});

test('bridge: take() right after an Escape-less close waits for the loading container', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    await minigameBridge.take('Reading 1');
    fetchDelayMs = 600;
    current().closeByPlayer(); // not through the bridge: nothing waits for the reopen
    const b = await minigameBridge.take('Reading 2');
    assert.equal(b.ok, true, JSON.stringify(b));
});

test('bridge: take() with the note viewer on top answers note-open', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    await minigameBridge.take('Reading 1');
    const again = await minigameBridge.take('Reading 2');
    assert.equal(again.ok, false);
    assert.equal(again.reason, 'note-open');
    assert.equal(again.active.id, 'notes');
    assert.match(again.hint, /close\(\)/);
});

test('bridge: take() of the last note reports returnsToContainer false, and close() ends in the world', async () => {
    setup([NOTES[0]]);
    await openSafe([NOTES[0]]);
    const a = await minigameBridge.take('Reading 1');
    assert.equal(a.ok, true);
    assert.equal(a.returnsToContainer, false, 'the last item closes to the world');
    const c = await minigameBridge.close();
    assert.equal(c.nowActive, null);
    assert.equal(current(), null);
});
