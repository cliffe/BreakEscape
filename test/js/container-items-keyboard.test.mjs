/**
 * Keyboard access to a container's contents grid (a safe, drawer or box; AC1 UI sweep).
 * Each item is a button stop named by the item, Enter and Space take it as a click does,
 * and after a take the focus moves on: the next item, the one before, Take Container, the X.
 * Never the body. Items with nothing to do are reachable and marked unavailable.
 * Run: node --max-old-space-size=2048 test/js/container-items-keyboard.test.mjs
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
    'export async function addToInventory(sprite) { adds.push(sprite.scenarioData.id); return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js',
    'utils/sync-before-fetch.js', 'minigames/container/container-item-image.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'systems/pc-sessions.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { ContainerMinigame } = await import(pathToFileURL(join(dir, 'minigames/container/container-minigame.js')));
const { adds } = await import(pathToFileURL(join(dir, 'systems/inventory.js')));

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
const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
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
    assert.equal(document.activeElement, slots()[0], 'next item');
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
    assert.notEqual(document.activeElement, document.body);
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
