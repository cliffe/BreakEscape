// UX slice 6 (docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md, "Slice 6"; start menu option C):
// the taskbar along the bottom of a PC's screen and its start panel, on the desktop, a share
// window opened from it and a file read from either. Who shows: a sign-in PC's live session,
// never `desktopUser`; a straight-to-desktop PC's `desktopUser`, else nobody. The headshot
// falls back to a pixel silhouette; Take Container stays on the taskbar; Esc closes the panel
// before the PC; Lock is hidden until the server reports support.
// The real container-minigame.js, text-file-minigame.js, base-minigame.js, pc-sessions.js and
// pc-taskbar.js run against jsdom.
// Run with: node test/js/pc-taskbar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'pc-taskbar-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'minigames/container/container-item-image.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js',
    'minigames/text-file/text-file-minigame.js', 'systems/pc-sessions.js']) copy(rel);
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
const { TextFileMinigame } = await imp('minigames/text-file/text-file-minigame.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const taskbarMod = await imp('utils/pc-taskbar.js');
const { pcTaskbarModel, desktopUserOf, pcHostName, resetTaskbarHeadshots, resetRememberedDesktops, rememberDesktop, PC_SILHOUETTE_URL } = taskbarMod;

const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

/** An Image whose loads answer from `sizes` (url -> [w, h]); any other url fails. */
function fakeImage(sizes = {}) {
    return class {
        set src(url) {
            this._src = url;
            const size = sizes[url];
            setTimeout(() => {
                if (size) { this.naturalWidth = size[0]; this.naturalHeight = size[1]; this.onload?.(); } else this.onerror?.();
            }, 0);
        }
        get src() { return this._src; }
    };
}

let sessions, ended, starts, signInScreens;
const SHARE = { id: 'scanned_inbox', type: 'network_share', name: 'Scanned-Inbox (\\\\HB-FS01\\Scanned-Inbox)' };

function base({ images = {} } = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    ended = []; starts = []; signInScreens = [];
    resetTaskbarHeadshots();
    resetRememberedDesktops();
    globalThis.Image = window.Image = fakeImage(images);
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.networkLinks = { get: (id) => (id === 'jack_comms_port' ? { name: 'Drop box: Comms room' } : null), landed: () => {} };
    window.openLoginSignIn = (lockable, opts) => signInScreens.push([lockable, opts]);
    window.startContainerMinigame = (...a) => starts.push(a);
    window.npcManager = { npcs: new Map([['ian', { id: 'ian', spriteSheet: 'ian_sprite' }]]), getNPC(id) { return this.npcs.get(id); } };
    window.ApiClient = {
        login: async () => ({ success: true, npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' }),
        logout: async () => ({ success: true })
    };
    sessions = new PcSessions();
    window.pcSessions = sessions;
    window.MinigameFramework = { currentMinigame: null, endMinigame: (s, r) => { ended.push([s, r]); window.MinigameFramework.currentMinigame = null; } };
}

async function open(containerItem, { contents = [SHARE], isTakeable = false } = {}) {
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, statusText: '200', json: async () => ({ contents: contents.map(c => ({ ...c })) }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'PC', containerItem, contents: null, isTakeable, desktopMode: true });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    mg.start();
    await settle();
    return mg;
}

const loginPc = (extra = {}) => ({ scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', host: 'HB-DESK-03', locked: true, lockType: 'login', observations: 'A hot desk.', ...extra } });
const plainPc = (extra = {}) => ({ scenarioData: { id: 'kevin_pc', type: 'pc', name: "Kevin's Workstation", host: 'KEVIN-WS', locked: false, observations: 'A desk PC.', desktopUser: { name: 'Kevin Park', character: 'male_nerd_v2' }, ...extra } });
const text = (sel) => document.querySelector(sel)?.textContent.trim().replace(/\s+/g, ' ') ?? null;
const startBtn = () => document.querySelector('.pc-start-btn');
const panelOpen = () => document.querySelector('.pc-start-panel')?.hidden === false;
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

// ── The model ───────────────────────────────────────────────────────────────

test('who shows: the session on a sign-in PC, never desktopUser; desktopUser only straight to the desktop', () => {
    const du = { name: 'Kevin Park', character: 'male_nerd_v2' };
    const signed = pcTaskbarModel({ pcData: { lockType: 'login', name: 'Hot desk', desktopUser: du }, session: { username: 'ishaw', displayName: 'Ian Shaw', via: 'password' } });
    assert.deepEqual(signed.account, { kind: 'session', name: 'Ian Shaw', username: 'ishaw', npcId: null, claimed: false });
    assert.deepEqual(signed.actions, ['switch', 'signout']);
    const noSession = pcTaskbarModel({ pcData: { lockType: 'login', name: 'Hot desk', desktopUser: du } });
    assert.equal(noSession.account, null, 'a sign-in PC with no session shows nobody, not desktopUser');
    assert.deepEqual(noSession.actions, []);
    const straight = pcTaskbarModel({ pcData: { lockType: 'password', name: "Kevin's Workstation", host: 'KEVIN-WS', desktopUser: du } });
    assert.deepEqual(straight.account, { kind: 'desktopUser', name: 'Kevin Park', character: 'male_nerd_v2' });
    assert.deepEqual(straight.actions, [], 'no Switch user or Sign out without a session');
    assert.equal(pcTaskbarModel({ pcData: { name: 'Kiosk' } }).account, null, 'no desktopUser: nobody');
    const claimed = pcTaskbarModel({ pcData: { lockType: 'login' }, session: { username: 'dreyes', displayName: 'Dana Reyes', via: 'claim' } });
    assert.equal(claimed.account.claimed, true);
    // Lock only for a password sign-in (integration ruling): a claimed or guest session could
    // not be unlocked by a password sign-in, so the server refuses it and the panel hides Lock
    assert.deepEqual(pcTaskbarModel({ pcData: { lockType: 'login' }, session: { username: 'a', via: 'password' }, lockSupported: true }).actions, ['lock', 'switch', 'signout']);
    assert.deepEqual(pcTaskbarModel({ pcData: { lockType: 'login' }, session: { username: 'a', via: 'claim' }, lockSupported: true }).actions, ['switch', 'signout']);
    assert.deepEqual(pcTaskbarModel({ pcData: { lockType: 'login' }, session: { username: 'a', via: 'claim', guest: true }, lockSupported: true }).actions, ['switch', 'signout']);
    assert.deepEqual(pcTaskbarModel({ pcData: { lockType: 'login' }, session: { username: 'a', via: 'password' }, lockSupported: false }).actions, ['switch', 'signout']);
});

test('the computer name: a remote session\'s host, else host, else the PC name; desktopUser must be well formed', () => {
    assert.equal(pcHostName({ host: 'HB-FIN-02', name: 'Finance PC' }, { remote: true, host: 'HB-FIN-02r' }), 'HB-FIN-02r');
    assert.equal(pcHostName({ host: 'KEVIN-WS', name: "Kevin's" }), 'KEVIN-WS');
    assert.equal(pcHostName({ name: 'Reception PC' }), 'Reception PC');
    assert.equal(desktopUserOf({ desktopUser: { name: '  ' } }), null);
    assert.equal(desktopUserOf({ desktopUser: 'Kevin' }), null);
    assert.deepEqual(desktopUserOf({ desktopUser: { name: 'Alex Moore' } }), { name: 'Alex Moore', character: null });
});

// ── Mounted ─────────────────────────────────────────────────────────────────

test('a signed-in desktop: the taskbar names the account and the computer; the panel has its sections', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const mg = await open(loginPc({ desktopUser: { name: 'Kevin Park' } }));
    assert.ok(document.querySelector('.pc-monitor-screen .pc-desktop > .pc-taskbar'), 'inside the monitor screen');
    assert.equal(text('.pc-taskbar-name'), 'Ian Shaw');
    assert.equal(text('.pc-taskbar-host'), 'HB-DESK-03');
    assert.doesNotMatch(document.body.textContent, /Kevin Park/, 'desktopUser never shows on a sign-in PC');
    startBtn().click();
    assert.ok(panelOpen());
    assert.equal(startBtn().getAttribute('aria-expanded'), 'true');
    assert.equal(document.activeElement?.dataset.place, 'desktop', 'focus on the first entry');
    assert.equal(text('.pc-start-name'), 'Ian Shaw');
    assert.equal(text('.pc-start-username'), 'ishaw');
    assert.deepEqual([...document.querySelectorAll('.pc-start-heading')].map(e => e.textContent), ['This PC', 'Places']);
    assert.deepEqual([...document.querySelectorAll('.pc-start-places .pc-start-item')].map(e => e.textContent.trim()), ['Desktop', 'Scanned-Inbox']);
    assert.deepEqual([...document.querySelectorAll('.pc-start-actions .pc-start-item')].map(e => e.textContent.trim()), ['Switch user', 'Sign out']);
    assert.deepEqual(mg.getTestState().taskbar, { host: 'HB-DESK-03', account: { kind: 'session', name: 'Ian Shaw' }, panelOpen: true, places: ['Desktop', SHARE.name], actions: ['switch', 'signout'] });
    // ArrowDown moves between the entries
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    assert.equal(document.activeElement?.dataset.place, 'share');
    // A place opens the share as the desktop icon does, with the desktop as its parent
    document.activeElement.click();
    assert.equal(panelOpen(), false);
    assert.equal(starts.length, 1);
    assert.equal(starts[0][0].parentLockable, mg.containerItem);
    assert.equal(starts[0][0].scenarioData.id, 'scanned_inbox');
});

test('a claimed session: the taskbar shows the owner and the claim line stays at the top', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    sessions.sessions.get('hot_desk').via = 'claim';
    await open(loginPc());
    assert.equal(text('.pc-taskbar-name'), 'Ian Shaw');
    assert.match(text('.pc-desktop-topbar .desktop-claim-line'), /Ian Shaw's open screen/);
});

test('a remote desktop: Remote on the taskbar, the link in the panel, the remote host as the computer name', async () => {
    base();
    sessions.sessions.set('lena_pc', { npcId: 'lena', username: 'lfox', displayName: 'Lena Fox', via: 'password', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02' });
    await open({ scenarioData: { id: 'lena_pc', type: 'pc', name: "Lena's PC", locked: true, lockType: 'login', remote: { footholdId: 'jack_comms_port' } } });
    assert.equal(text('.pc-taskbar-remote'), 'Remote');
    assert.equal(text('.pc-taskbar-host'), 'HB-FIN-02');
    assert.equal(text('.pc-taskbar-name'), 'Lena Fox');
    assert.equal(text('.pc-start-remote'), 'Remote through Drop box: Comms room');
    assert.match(text('.pc-desktop-topbar .desktop-remote-line'), /Remote session through Drop box: Comms room/);
});

test('a PC with no sign-in and no desktopUser: Start and the computer name only', async () => {
    base();
    await open(plainPc({ desktopUser: undefined, host: undefined, name: 'Reception PC' }), { contents: [] });
    assert.equal(document.querySelector('.pc-taskbar-account'), null);
    assert.equal(text('.pc-taskbar-host'), 'Reception PC');
    startBtn().click();
    assert.equal(document.querySelector('.pc-start-account'), null);
    assert.equal(document.querySelector('.pc-start-actions'), null, 'no Switch user or Sign out');
});

test('desktopUser on a straight-to-desktop PC, with its authored headshot', async () => {
    base({ images: { '/break_escape/assets/characters/male_nerd_v2_headshot.png': [32, 32] } });
    await open(plainPc(), { contents: [] });
    await settle();
    assert.equal(text('.pc-taskbar-name'), 'Kevin Park');
    assert.equal(text('.pc-taskbar-host'), 'KEVIN-WS');
    const box = document.querySelector('.pc-taskbar-headshot');
    assert.equal(box.dataset.frame, 'headshot');
    assert.match(box.style.backgroundImage, /male_nerd_v2_headshot\.png/);
    assert.equal(box.style.backgroundSize, '32px 32px');
});

test('a missing headshot shows the pixel silhouette, at x1 and x2, looked up once', async () => {
    base();
    await open(plainPc({ desktopUser: { name: 'Alex Moore', character: 'no_such_sprite' } }), { contents: [] });
    await settle(10);
    const small = document.querySelector('.pc-taskbar-headshot');
    const big = document.querySelector('.pc-start-headshot');
    assert.equal(small.dataset.frame, 'silhouette');
    assert.equal(small.hidden, false);
    assert.ok(small.style.backgroundImage.includes(PC_SILHOUETTE_URL));
    assert.equal(small.style.backgroundSize, '32px 32px');
    assert.equal(big.dataset.frame, 'silhouette');
    assert.equal(big.style.backgroundSize, '64px 64px');
    assert.equal(taskbarMod.taskbarHeadshotCount(), 1, 'one cached entry for the account');
    // A short screen (915x412): the panel's picture at x1, so the panel fits without scrolling
    document.querySelector('.pc-monitor').setAttribute('data-short', '');
    startBtn().click();
    assert.equal(big.dataset.scale, '1');
    assert.equal(big.style.backgroundSize, '32px 32px');
});

test('Take Container stays on the taskbar', async () => {
    base();
    await open(plainPc({ type: 'laptop' }), { contents: [], isTakeable: true });
    const take = document.getElementById('take-container-btn');
    assert.ok(take, 'Take Container is there');
    assert.ok(take.closest('.pc-taskbar'), 'on the taskbar');
});

test('Esc closes the panel first, then the PC; a press outside closes the panel; the X closes the PC', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const mg = await open(loginPc());
    startBtn().click();
    esc();
    assert.equal(panelOpen(), false, 'the first Esc closes the panel');
    assert.equal(ended.length, 0, 'the PC stays open');
    assert.equal(document.activeElement, startBtn(), 'focus back on Start');
    esc();
    assert.equal(ended.length, 1, 'the second Esc closes the PC');
    // a press outside the panel
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const mg2 = await open(loginPc());
    startBtn().click();
    document.querySelector('.desktop-background').dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    assert.equal(panelOpen(), false);
    assert.equal(ended.length, 0);
    startBtn().click();
    document.querySelector('#minigame-close')?.click();
    assert.equal(ended.length, 1, 'the X closes the PC with the panel open');
    assert.ok(mg && mg2);
});

test('Lock shows only when the server reports locking, the client can lock, and the session is a password one', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    sessions.lockingSupported = () => true;
    await open(loginPc());
    assert.equal(document.getElementById('pc-start-lock'), null, 'reported, but no lockSession()');
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const locked = [];
    sessions.lockingSupported = () => true;
    sessions.lockSession = async (pcId) => { locked.push(pcId); return { ok: true }; };
    await open(loginPc());
    startBtn().click();
    document.getElementById('pc-start-lock').click();
    await settle();
    assert.deepEqual(locked, ['hot_desk']);
    // a claimed session: no Lock
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    sessions.sessions.get('hot_desk').via = 'claim';
    sessions.lockingSupported = () => true;
    sessions.lockSession = async () => ({ ok: true });
    await open(loginPc());
    startBtn().click();
    assert.equal(document.getElementById('pc-start-lock'), null, 'hidden for a claimed session');
    // a refusal is said
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    sessions.lockingSupported = () => true;
    sessions.lockSession = async () => ({ ok: false, reason: 'refused', message: 'This session cannot be locked' });
    await open(loginPc());
    startBtn().click();
    document.getElementById('pc-start-lock').click();
    await settle();
    assert.equal(alerts[0]?.[0], 'This session cannot be locked');
});

test('a share window opened from the desktop keeps the account in view and goes back through Desktop', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const desk = await open(loginPc());
    const share = { scenarioData: { ...SHARE, locked: false }, name: 'network_share', objectId: 'share_scanned_inbox', sourcePcId: 'hot_desk', parentLockable: desk.containerItem };
    document.body.innerHTML = '<div id="mg"></div>';
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [] }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Share', containerItem: share, contents: null });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    mg.start();
    assert.equal(text('.pc-share .pc-taskbar-name'), 'Ian Shaw', 'E11: the account while the share is open');
    assert.equal(text('.pc-taskbar-window'), 'Scanned-Inbox');
    startBtn().click();
    document.querySelector('[data-place="desktop"]').click();
    assert.equal(ended.length, 1);
    assert.equal(mg.closedByPlayer, true, 'as its own Close: the desktop reopens');
    assert.equal(mg.exitReason, 'close');
});

test('a file read from the desktop: the taskbar under it, and Desktop reopens the desktop', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    const desktopItem = loginPc();
    rememberDesktop('hot_desk', { containerItem: desktopItem, places: [SHARE] });
    const mg = new TextFileMinigame(document.getElementById('mg'), { title: 'notes.txt', fileName: 'notes.txt', fileContent: 'hello', pcScreen: { name: 'Hot desk PC', pcId: 'hot_desk' } });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    await mg.taskbarReady;
    assert.ok(document.querySelector('.pc-file > .pc-taskbar'), 'the taskbar under the file window');
    assert.equal(text('.pc-taskbar-name'), 'Ian Shaw');
    assert.equal(text('.pc-taskbar-window'), 'notes.txt');
    startBtn().click();
    esc();
    assert.equal(ended.length, 0, 'Esc closed the panel only');
    startBtn().click();
    document.querySelector('[data-place="desktop"]').click();
    assert.equal(ended.length, 1);
    assert.equal(starts.length, 1);
    assert.equal(starts[0][0], desktopItem, 'the desktop opens again');
});

test('a share opened from the network view has no PC, so no taskbar', async () => {
    base();
    const share = { scenarioData: { ...SHARE, locked: false, networkShare: { footholdId: 'jack_comms_port' } }, name: 'network_share', objectId: 'scanned_inbox' };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [] }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Share', containerItem: share, contents: null });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    assert.equal(document.querySelector('.pc-taskbar'), null);
});
