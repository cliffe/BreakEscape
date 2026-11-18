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
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js',
    'utils/sync-before-fetch.js', 'utils/note-markdown.js', 'utils/test-state-text.js',
    'minigames/container/container-item-image.js', 'minigames/framework/base-minigame.js',
    'minigames/container/container-minigame.js', 'systems/pc-sessions.js',
    'minigames/framework/minigame-manager.js', 'minigames/notes/notes-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { ContainerMinigame, returnToContainerAfterNotes, startContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
const { NotesMinigame, startNotesMinigame } = await imp('minigames/notes/notes-minigame.js');
const { adds } = await imp('systems/inventory.js');

const settle = async (ms = 250) => { await new Promise(r => setTimeout(r, ms)); };
const note = (id, name) => ({ type: 'notes', id, name, takeable: true, readable: true, text: `Text of ${name}` });
const NOTES = [note('n1', 'Reading 1'), note('n2', 'Reading 2'), note('n3', 'Reading 3')];
const CARD = { type: 'key', id: 'card', name: 'Tape Card', takeable: true };
const SAFE = () => ({ scenarioData: { id: 'safe1', name: 'Floor Safe', type: 'safe', locked: false } });

let taken, fetches, worldAlerts;

function setup(serverContents) {
    taken = new Set(); fetches = []; worldAlerts = [];
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
    window.gameAlert = (m) => worldAlerts.push(m);
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
    if (current()?._sceneType === 'notes') { current().closeByPlayer(); await settle(); }
    assert.equal(current()?._sceneType, 'container');
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

test('the container comes back at the same scroll position with focus inside it', async () => {
    setup([...NOTES, CARD]);
    await openSafe([...NOTES, CARD]);
    document.getElementById('container-contents-grid').scrollTop = 40;
    slots()[0].click();
    await settle(20);
    await closeViewer();
    const grid = document.getElementById('container-contents-grid');
    assert.equal(grid.scrollTop, 40);
    assert.ok(current().container.contains(document.activeElement), 'focus is inside the container frame');
});
