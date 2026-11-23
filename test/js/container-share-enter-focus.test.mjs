/**
 * Container keyboard play, post-release fixes:
 * Enter on a share icon lands the focus on the share's first item, never the body.
 * Run: node --max-old-space-size=2048 test/js/container-share-enter-focus.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'container-post-'));
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
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'systems/pc-sessions.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { ContainerMinigame, swallowHeldKey, releaseHeldEnter, returnToContainerAfterNotes, startContainerMinigame } = await import(pathToFileURL(join(dir, 'minigames/container/container-minigame.js')));
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
const DOC_N = { type: 'text_file', id: 'f1', name: 'Rota.txt', takeable: false, text: 'x' };
const A = item('a', 'Brass Key'), B = item('b', 'Red Folder'), C = item('c', 'Tape Card');


const icons = () => [...document.querySelectorAll('.desktop-icon')];
const NOTE = { type: 'notes', id: 'n1', name: 'Sticky Note', takeable: true, readable: true, text: 'hello' };
const DOC = { type: 'text_file', id: 'f1', name: 'Rota.txt', takeable: false, text: 'x' };
const DOC2 = { type: 'text_file', id: 'f2', name: 'Plan.txt', takeable: false, text: 'y' };

async function wire(serverContents) {
    window.pendingContainerReturn = null;
    window.handleObjectInteraction = () => {};
    window.addToInventory = () => {};
    window.expectPanelWithin = () => {};
    window.clearExpectedPanel = () => {};
    window.gameAlert = () => {};
    const host = document.getElementById('mg');
    window.MinigameFramework.mainGameScene = {};
    window.MinigameFramework.init = () => {};
    window.MinigameFramework.startMinigame = (name, _c, p) => {
        window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ contents: serverContents.map(c => ({ ...c })) }) });
        host.innerHTML = '';
        const mg = new ContainerMinigame(host, p);
        window.MinigameFramework.currentMinigame = mg;
        mg.ready = mg.init();
        return mg;
    };
}

async function openDesktop(files) {
    releaseHeldEnter();
    document.body.innerHTML = '<div id="mg"></div>';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit() {} };
    window.playUISound = () => {};
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ contents: files.map(f => ({ ...f })) }) });
    window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
    const containerItem = { scenarioData: { id: 'pc1', type: 'pc', name: 'PC', locked: false } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'PC', containerItem, contents: files.map(f => ({ ...f })), isTakeable: false, desktopMode: true });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    return mg;
}

test('D2: Enter on a share icon lands the focus on the share\'s first item', async () => {
    releaseHeldEnter();
    const SHARE = { type: 'network_share', id: 'sh1', name: 'Public (\\\\fs01\\public)', takeable: false };
    const F1 = { type: 'key', id: 'k1', name: 'Brass Key', takeable: true };
    const F2 = { type: 'key', id: 'k2', name: 'Red Folder', takeable: true };
    await openDesktop([DOC, SHARE]);
    await wire([F1, F2]);
    window.startContainerMinigame = startContainerMinigame;
    const ic = icons();
    ic[1].focus(); key(ic[1], 'Enter'); await settle();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.notEqual(document.activeElement, document.body, 'not the body');
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Brass Key');
    releaseHeldEnter();
});

test('D2: an empty share puts the focus on its grid, a click puts it nowhere new', async () => {
    releaseHeldEnter();
    const SHARE = { type: 'network_share', id: 'sh1', name: 'Public (\\\\fs01\\public)', takeable: false };
    await openDesktop([SHARE]);
    await wire([]);
    window.startContainerMinigame = startContainerMinigame;
    const ic = icons();
    ic[0].focus(); key(ic[0], 'Enter'); await settle();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement.id, 'container-contents-grid', 'the empty share puts the focus on its grid');
    releaseHeldEnter();
    await openDesktop([SHARE]);
    await wire([{ type: 'key', id: 'k1', name: 'Brass Key', takeable: true }]);
    icons()[0].click(); await settle();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement, document.body, 'a mouse open leaves the focus alone');
});

test('m1: a share that loads slowly does not take back a focus the player moved to the X', async () => {
    releaseHeldEnter();
    const SHARE = { type: 'network_share', id: 'sh1', name: 'Public (\\\\fs01\\public)', takeable: false };
    await openDesktop([DOC_N, SHARE]);
    await wire([{ type: 'key', id: 'k1', name: 'Brass Key', takeable: true }]);
    let release;
    const gate = new Promise(r => { release = r; });
    const wired = window.MinigameFramework.startMinigame;
    window.MinigameFramework.startMinigame = (name, c, p) => {
        const mg = wired(name, c, p);
        const real = window.fetch;
        window.fetch = globalThis.fetch = async (...a) => { await gate; return real(...a); };
        return mg;
    };
    window.startContainerMinigame = startContainerMinigame;
    const ic = icons();
    ic[1].focus(); key(ic[1], 'Enter'); await settle();
    // The X is already on screen while the contents load: the player tabs to it
    const x = document.createElement('button');
    x.id = 'minigame-close';
    document.body.appendChild(x);
    x.focus();
    release();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement, x, 'focus stays on the X');
    releaseHeldEnter();
});

test('Places: opening a share from the Start panel by key lands on its first item; a mouse click does not', async () => {
    releaseHeldEnter();
    const SHARE = { type: 'network_share', id: 'sh1', name: 'Public (\\\\fs01\\public)', takeable: false };
    const mg = await openDesktop([DOC_N, SHARE]);
    await wire([{ type: 'key', id: 'k1', name: 'Brass Key', takeable: true }]);
    window.startContainerMinigame = startContainerMinigame;
    mg.taskbarPlace({ kind: 'share', item: SHARE, byKey: true });
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Brass Key');
    releaseHeldEnter();
    const mg2 = await openDesktop([DOC_N, SHARE]);
    await wire([{ type: 'key', id: 'k1', name: 'Brass Key', takeable: true }]);
    mg2.taskbarPlace({ kind: 'share', item: SHARE, byKey: false });
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement, document.body, 'a mouse open leaves the focus alone');
    releaseHeldEnter();
});
