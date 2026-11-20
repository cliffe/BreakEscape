/**
 * Taking a readable note out of a container (it goes to the Notepad) says so with the
 * world pickup's toast, once: Added "<name>" to your notes. / Note Added (m09 blind
 * playtest: "silently collected to the Notepad, no toast"). A normal item keeps its own
 * feedback. Uses the real inventory.js helper and the real container code.
 * Run: node --max-old-space-size=2048 test/js/container-note-toast.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'container-note-toast-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel, rewrites = []) => {
    let code = readFileSync(join(js, rel), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    put(rel, code);
};
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
// The container's inventory is a stub that accepts every take; the real inventory.js is
// loaded separately (real/) for the toast helper
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js',
    'utils/sync-before-fetch.js', 'minigames/container/container-item-image.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'systems/pc-sessions.js']) copy(rel);
put('real/rooms.mjs', 'export const rooms = {};');
put('real/ink.mjs', 'export default class InkEngine {}');
put('real/config.mjs', "export const CSRF_TOKEN = 'x';");
put('real/info-label.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js'); copy('systems/consumables.js');
put('real/forced-minigame-guard.mjs', readFileSync(join(js, 'systems/forced-minigame-guard.js'), 'utf8'));
put('real/consumables.mjs', readFileSync(join(js, 'systems/consumables.js'), 'utf8'));
put('real/inventory.mjs', readFileSync(join(js, 'systems/inventory.js'), 'utf8')
    .replace("'../core/rooms.js'", "'./rooms.mjs'").replace("'./ink/ink-engine.js'", "'./ink.mjs'")
    .replace("'../config.js'", "'./config.mjs'").replace("'../ui/info-label.js'", "'./info-label.mjs'")
    .replace("'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'").replace("'./consumables.js'", "'./consumables.mjs'"));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
await import(pathToFileURL(join(dir, 'real/inventory.mjs'))); // sets window.announceNoteAdded
const { ContainerMinigame, returnToContainerAfterNotes } = await import(pathToFileURL(join(dir, 'minigames/container/container-minigame.js')));

const alerts = [];
function setup() {
    alerts.length = 0;
    document.body.innerHTML = '<div id="mg"></div>';
    window.gameAlert = (...a) => alerts.push(a);
    window.expectPanelWithin = () => {};
    window.clearExpectedPanel = () => {};
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit() {} };
    window.playUISound = () => {};
    window.pendingContainerReturn = null;
    window.startContainerMinigame = () => {};
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [] }) });
}

test('a note taken from a container toasts once, with the world pickup wording', () => {
    setup();
    const note = { type: 'notes', id: 'n1', name: 'Candidate Assessment', readable: true, text: 'x', takeable: false };
    window.pendingContainerReturn = {
        containerItem: { scenarioData: { id: 'safe1', type: 'safe', name: 'Floor Safe', locked: false } },
        contents: [note], isTakeable: false, itemToTake: note, itemElement: null, npcOptions: null
    };
    returnToContainerAfterNotes({ reopen: false });
    assert.ok(alerts.length === 1, `one toast, got ${alerts.length}`);
    assert.deepEqual(alerts[0], ['Added "Candidate Assessment" to your notes.', 'info', 'Note Added', 3000]);
});

test('the toast text is the helper the world pickup uses (one wording)', () => {
    setup();
    assert.ok(typeof window.announceNoteAdded === 'function', 'inventory.js exposes announceNoteAdded');
    window.announceNoteAdded('Memo');
    assert.deepEqual(alerts[0], ['Added "Memo" to your notes.', 'info', 'Note Added', 3000]);
});

test('a normal item take keeps its in-window message and raises no note toast', async () => {
    setup();
    const key = { type: 'key', id: 'k1', name: 'Brass Key', takeable: true };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [{ ...key }] }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: { scenarioData: { id: 'safe1', type: 'safe', name: 'Floor Safe', locked: false } },
        contents: [{ ...key }], isTakeable: false });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    const slot = document.querySelector('.container-content-slot');
    slot.querySelector('img, .container-content-item').click();
    await new Promise(r => setTimeout(r, 50));
    const msgs = [...document.querySelectorAll('.container-message')].map(m => m.textContent);
    assert.ok(msgs.includes('Added Brass Key to inventory'), `message kept: ${msgs.join('|')}`);
    assert.ok(alerts.every(a => !/your notes/.test(a[0])), 'no note toast for a key');
});
