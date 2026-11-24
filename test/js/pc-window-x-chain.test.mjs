// PC window X chain: on a PC desktop, a click on an open file window's X closes only that window
// (the desktop comes back), then the desktop's own X closes the minigame; Esc does the same in
// the same order. Runs the real MinigameFramework with the real desktop and reader against jsdom,
// so a close that the framework drops (a stale instance, a displaced scene) shows up here.
// Run with: node test/js/pc-window-x-chain.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = (name) => readFileSync(join(here, '../../public/break_escape/css', name), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'pc-monitor-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js', 'export async function addToInventory() { return { ok: true }; }\nexport function removeFromInventory() {}\nexport function inventoryImageKey(d) { return d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/computer-keywords.js', 'utils/author-html.js', 'utils/lock-scope-refusal.js',
    'utils/pc-monitor.js', 'utils/more-below.js', 'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'minigames/framework/base-minigame.js',
    'minigames/container/container-item-image.js', 'minigames/container/container-minigame.js',
    'utils/remote-host-text.js', 'utils/compromise-bolt.js', 'minigames/password/password-minigame.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js', 'utils/sync-before-fetch.js', 'minigames/text-file/text-file-minigame.js',
    'minigames/notes/notes-minigame.js', 'minigames/framework/minigame-manager.js', 'utils/note-markdown.js', 'utils/test-state-text.js']) copy(rel);


const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
const { ContainerMinigame, startContainerMinigame, returnToContainerAfterNotes } = await imp('minigames/container/container-minigame.js');
const { TextFileMinigame } = await imp('minigames/text-file/text-file-minigame.js');
const settle = (ms = 0) => new Promise(r => setTimeout(r, ms));

const FILES = [
    { id: 'f1', type: 'text_file', name: 'IT Security Anomaly Report', takeable: false, readable: true, text: 'Line one', observations: 'obs' },
    { id: 'f2', type: 'text_file', name: 'Recovered Email', takeable: false, readable: true, text: 'Mail', observations: 'obs2' }
];

async function boot() {
    document.body.innerHTML = '';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit: () => {} };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: FILES }) });
    MinigameFramework.currentMinigame = null;
    MinigameFramework.registerScene('container', ContainerMinigame);
    MinigameFramework.registerScene('text-file', TextFileMinigame);
    window.MinigameFramework = MinigameFramework;
    window.pauseKeyboardInput = () => {};
    window.resumeKeyboardInput = () => {};
    window.startContainerMinigame = startContainerMinigame;
    window.returnToContainerAfterNotes = returnToContainerAfterNotes;
    window.pendingContainerReturn = null;
    window.handleObjectInteraction = (sprite) => {
        const d = sprite.scenarioData;
        MinigameFramework.startMinigame('text-file', null, { title: 'Text File', fileName: d.name, itemId: d.id, fileContent: d.text, observations: d.observations, lockable: sprite, onComplete: () => {} });
    };
    const containerItem = { scenarioData: { id: 'derek_computer', type: 'pc', name: "Derek's Computer", host: 'DEREK-PC', locked: false, postitNote: 'Anniversary', showPostit: true } };
    startContainerMinigame(containerItem, FILES, false, true);
    await settle(50);
}

const current = () => MinigameFramework.currentMinigame?.constructor?.name || null;
const containers = () => document.querySelectorAll('.minigame-container').length;
const clickable = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

async function openFirstFile() {
    const icon = document.querySelector('.desktop-icon');
    assert.ok(icon, 'the desktop lists the files');
    clickable(icon);
    await settle(50);
    assert.equal(current(), 'TextFileMinigame', 'the file opens in the reader');
    assert.equal(containers(), 1, 'one scene in the page');
}

test('the file window X closes only that window, then the desktop X closes the minigame', async () => {
    await boot();
    assert.equal(current(), 'ContainerMinigame');
    await openFirstFile();
    const winX = document.querySelector('.pc-file-window .share-folder-titlebar > .pc-window-close');
    assert.ok(winX, 'the file window has its X');
    clickable(winX);
    await settle(250);
    assert.equal(current(), 'ContainerMinigame', 'the window X lands back on the desktop');
    assert.equal(containers(), 1, 'one scene in the page');
    assert.equal(document.querySelectorAll('.pc-window-close').length, 0, 'no file window is left');
    assert.ok(document.querySelector('.desktop-icon'), 'the desktop is showing its files');
    const bezelX = document.querySelector('.pc-monitor-bezel > #minigame-close');
    assert.ok(bezelX, 'the desktop has its own X');
    clickable(bezelX);
    await settle(250);
    assert.equal(current(), null, 'the desktop X closes the minigame');
    assert.equal(containers(), 0, 'nothing is left in the page');
    assert.equal(window.pendingContainerReturn, null);
});

test('the bezel X on an open file closes the whole PC, nothing reopens', async () => {
    await boot();
    await openFirstFile();
    clickable(document.querySelector('.pc-monitor-bezel > #minigame-close'));
    await settle(250);
    assert.equal(current(), null);
    assert.equal(containers(), 0);
});

test('Esc in the reader goes back to the desktop, Esc on the desktop closes it', async () => {
    await boot();
    await openFirstFile();
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle(250);
    assert.equal(current(), 'ContainerMinigame', 'Esc in the reader lands on the desktop');
    assert.equal(containers(), 1);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle(250);
    assert.equal(current(), null, 'Esc on the desktop closes the minigame');
    assert.equal(containers(), 0);
});

test('a second file opens and closes the same way after the first', async () => {
    await boot();
    await openFirstFile();
    clickable(document.querySelector('.pc-window-close'));
    await settle(250);
    const icons = document.querySelectorAll('.desktop-icon');
    assert.equal(icons.length, 2);
    clickable(icons[1]);
    await settle(50);
    assert.equal(current(), 'TextFileMinigame');
    clickable(document.querySelector('.pc-window-close'));
    await settle(250);
    assert.equal(current(), 'ContainerMinigame');
    clickable(document.querySelector('.pc-monitor-bezel > #minigame-close'));
    await settle(250);
    assert.equal(current(), null);
});
