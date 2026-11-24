/**
 * Container keyboard play, post-release fixes:
 * a note opened from a desktop icon comes back with the focus on the icon now at its place;
 * (the share fix has its own file, container-share-enter-focus.test.mjs).
 * Run: node --max-old-space-size=2048 test/js/container-note-focus-return.test.mjs
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
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js', 'systems/pc-sessions.js', 'systems/mfa-client.js']) copy(rel);

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

test('D1: a note opened from a desktop icon by key comes back with the focus on an icon, not the body', async () => {
    await openDesktop([DOC, NOTE, DOC2]);
    await wire([DOC, DOC2]);
    const ic = icons();
    ic[1].focus(); key(ic[1], 'Enter'); await settle();
    const mark = window.pendingContainerReturn.focusReturn;
    assert.ok(mark, 'the hand-over carries a focus return');
    assert.equal(mark.byKey, true);
    returnToContainerAfterNotes();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.notEqual(document.activeElement, document.body, 'focus is not on the body');
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Plan.txt', 'the icon now at the note\'s place');
    releaseHeldEnter();
});

test('D1: a note that was the last icon returns the focus to the one before; none left, the desktop', async () => {
    await openDesktop([DOC, NOTE]);
    await wire([DOC]);
    let ic = icons();
    ic[1].focus(); key(ic[1], 'Enter'); await settle();
    returnToContainerAfterNotes();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Rota.txt');
    releaseHeldEnter();
    await openDesktop([NOTE]);
    await wire([]);
    ic = icons();
    ic[0].focus(); key(ic[0], 'Enter'); await settle();
    returnToContainerAfterNotes({ reopen: true });
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.ok(document.querySelector('.empty-desktop'), 'the desktop reopened empty');
    assert.ok(document.activeElement.classList.contains('desktop-background'), 'no icon left: the desktop itself has the focus');
    releaseHeldEnter();
});

test('D1: a note opened with the mouse takes no focus', async () => {
    await openDesktop([DOC, NOTE, DOC2]);
    await wire([DOC, DOC2]);
    icons()[1].click(); await settle();
    assert.notEqual(window.pendingContainerReturn.focusReturn?.byKey, true, 'no keyboard mark');
    returnToContainerAfterNotes();
    await window.MinigameFramework.currentMinigame.ready; await settle();
    assert.equal(document.activeElement.classList.contains('desktop-icon'), false);
    assert.equal(document.activeElement, document.body, 'the focus was not taken');
});


test('m2: the empty desktop shows a square 2px focus-visible outline', async () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/container-minigame.css'), 'utf8');
    const m = css.match(/\.desktop-background:focus-visible\s*\{([^}]*)\}/);
    assert.ok(m, 'a :focus-visible rule exists');
    assert.match(m[1], /outline:\s*2px solid/);
    assert.match(m[1], /border-radius:\s*0/);
    // equal specificity: the focus-visible rule must come after `:focus { outline: none }`
    const focusAt = css.search(/\.desktop-background:focus\s*\{/);
    assert.ok(focusAt >= 0, 'the :focus rule exists');
    assert.ok(css.search(/\.desktop-background:focus-visible\s*\{/) > focusAt, 'focus-visible comes after :focus, so it wins the cascade');
});

test('empty share ring: a dark 2px ring on the white share pane only', async () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/container-minigame.css'), 'utf8');
    const m = css.match(/\.container-contents-grid\.share-folder-files#container-contents-grid:focus-visible\s*\{([^}]*)\}/);
    assert.ok(m, 'a share-pane-scoped focus-visible rule exists');
    assert.match(m[1], /outline:\s*2px solid #000080/);
    assert.match(m[1], /border-radius:\s*0/);
    const plain = css.search(/^#container-contents-grid:focus-visible\s*\{/m);
    assert.ok(css.search(/\.container-contents-grid\.share-folder-files#container-contents-grid:focus-visible/) > plain, 'after the general rule');
});
