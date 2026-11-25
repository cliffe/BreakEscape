// Ops S5c unit 25: a session for an account-only account (no person behind it, so the client never
// loaded an NPC for it) shows its display name and the generic headshot (the pixel silhouette) on
// the desktop's taskbar and start panel. The session answers are the real server answers recorded
// in ops_privilege_answers.json (privilege-answers.mjs), not hand-written ones.
// Run with: node test/js/account-only-session.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { privilegeAnswer } from './support/privilege-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'account-only-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js', 'utils/compromise-bolt.js', 'minigames/container/container-item-image.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js',
    'minigames/text-file/text-file-minigame.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'utils/sync-before-fetch.js']) copy(rel);
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return d?.type; }\n');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { ContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const taskbarMod = await imp('utils/pc-taskbar.js');
const { resetTaskbarHeadshots, resetRememberedDesktops, PC_SILHOUETTE_URL } = taskbarMod;

const settle = async (n = 10) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
// Every image load fails: no authored headshot exists, so only the generic one can show
const failingImage = class { set src(u) { this._s = u; setTimeout(() => this.onerror?.(), 0); } get src() { return this._s; } };

let sessions;
function base(loginBody) {
    document.body.innerHTML = '<div id="mg"></div>';
    resetTaskbarHeadshots();
    resetRememberedDesktops();
    globalThis.Image = window.Image = failingImage;
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.networkLinks = { get: () => null, landed: () => {} };
    window.openLoginSignIn = () => {};
    window.startContainerMinigame = () => {};
    // The client never loaded this account: no NPC record for it
    window.npcManager = { npcs: new Map(), getNPC() { return undefined; } };
    window.ApiClient = { login: async () => structuredClone(loginBody), logout: async () => ({ success: true }) };
    sessions = new PcSessions();
    window.pcSessions = sessions;
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => { window.MinigameFramework.currentMinigame = null; } };
}

async function open(pcId) {
    // The recorded desktop answer of the session held at that PC, and the PC object the room answer holds
    const desktop = privilegeAnswer(pcId === 'desk_a' ? 'desktop_admin_desk_a' : 'desktop_deskadmin_desk_b');
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, statusText: '200', json: async () => desktop });
    const pc = privilegeAnswer('room_it_room').room.objects.find(o => o.id === pcId);
    assert.ok(pc, `the recorded it_room answer holds ${pcId}`);
    const item = { scenarioData: pc };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'PC', containerItem: item, contents: null, isTakeable: false, desktopMode: true });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    mg.start();
    await settle();
    return mg;
}
const text = (sel) => document.querySelector(sel)?.textContent.trim().replace(/\s+/g, ' ') ?? null;

test('the recorded account-only session answer has no portrait, avatar or person behind it', () => {
    const body = privilegeAnswer('signin_deskadmin_desk_b');
    assert.equal(body.npcId, 'deskadmin');
    assert.equal(body.displayName, 'Desk administrator');
    assert.equal(body.portrait, undefined);
    assert.equal(body.avatar, undefined);
});

test('an account-only session shows its display name and the generic headshot, at x1 and x2', async () => {
    const body = privilegeAnswer('signin_deskadmin_desk_b');
    base(body);
    const r = await sessions.signIn('desk_b', body.username, 'x');
    assert.equal(r.ok, true);
    await open('desk_b');
    assert.equal(text('.pc-taskbar-name'), 'Desk administrator');
    assert.equal(text('.pc-start-name'), 'Desk administrator');
    assert.equal(text('.pc-start-username'), 'deskadmin');
    const small = document.querySelector('.pc-taskbar-headshot');
    const big = document.querySelector('.pc-start-headshot');
    assert.equal(small.dataset.frame, 'silhouette');
    assert.ok(small.style.backgroundImage.includes(PC_SILHOUETTE_URL));
    assert.equal(small.style.backgroundSize, '32px 32px');
    assert.equal(big.dataset.frame, 'silhouette');
    assert.equal(big.style.backgroundSize, '64px 64px');
});

test('a person account with a portrait still shows that portrait (the answer differs, not the code path)', async () => {
    const body = privilegeAnswer('signin_admin_desk_a');
    assert.ok(body.portrait);
    base(body);
    await sessions.signIn('desk_a', body.username, 'x');
    await open('desk_a');
    assert.equal(text('.pc-taskbar-name'), 'Adel Wick');
    assert.notEqual(document.querySelector('.pc-taskbar-headshot').dataset.frame, undefined);
});

test('a hostile display name in a session answer is text, not markup', async () => {
    const body = { ...privilegeAnswer('signin_deskadmin_desk_b'), displayName: '<img src=x onerror="window.__pwned=1">Desk' };
    base(body);
    await sessions.signIn('desk_b', body.username, 'x');
    await open('desk_b');
    assert.equal(document.querySelector('.pc-taskbar-name img'), null);
    assert.equal(text('.pc-taskbar-name'), body.displayName);
    assert.equal(window.__pwned, undefined);
});
