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
    // the no-locking-support case: the server reports locking, this client cannot ask for it
    sessions.lockSession = undefined;
    await open(loginPc());
    startBtn().click();
    assert.ok(document.getElementById('pc-start-signout'), 'the panel is open');
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
    assert.equal(alerts.length, 0, 'not an alert over the game world');
    assert.equal(document.querySelector('.pc-monitor .pc-taskbar-notice')?.textContent, 'This session cannot be locked', 'said inside the monitor');
    assert.equal(ended.length, 0, 'the desktop stays open');
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

// ── Review round 1 fixes (slice 6 fix 1) ─────────────────────────────────────

const FILE = { name: 'Hot desk PC', pcId: 'hot_desk' };
async function openReader({ withDesktop = true, setup = null } = {}) {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    if (setup) setup();
    const desktopItem = loginPc();
    if (withDesktop) rememberDesktop('hot_desk', { containerItem: desktopItem, places: [SHARE] });
    const mg = new TextFileMinigame(document.getElementById('mg'), { title: 'notes.txt', fileName: 'notes.txt', fileContent: 'hello', pcScreen: FILE });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    await mg.taskbarReady;
    return { mg, desktopItem };
}
const panelItem = (id) => { startBtn().click(); return document.getElementById(id); };

test('R1 m1: Take Container on a takeable desktop has a whole label and a short form for a narrow screen', async () => {
    base();
    await open(plainPc({ type: 'laptop' }), { contents: [], isTakeable: true });
    const bar = document.querySelector('.pc-taskbar');
    const take = document.getElementById('take-container-btn');
    assert.ok(bar.classList.contains('pc-taskbar-takeable'), 'the taskbar knows it holds the button (the narrow rule hides the computer name)');
    assert.equal(take.getAttribute('aria-label'), 'Take Container');
    assert.equal(take.querySelector('.pc-take-long').textContent, 'Take Container');
    assert.equal(take.querySelector('.pc-take-short').textContent, 'Take');
    take.click();
    // a desktop that cannot be taken has neither
    base();
    await open(plainPc(), { contents: [] });
    assert.equal(document.getElementById('take-container-btn'), null);
    assert.equal(document.querySelector('.pc-taskbar-takeable'), null);
});

test('R1 m2: Lock from a reader asks the server first; a refusal is said in the monitor and the reader stays', async () => {
    let release;
    await openReader({ setup: () => {
        sessions.lockingSupported = () => true;
        sessions.lockSession = () => new Promise((r) => { release = r; });
    } });
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    panelItem('pc-start-lock').click();
    await settle();
    assert.equal(ended.length, 0, 'still open while the server has not answered');
    release({ ok: false, reason: 'refused', message: 'This session cannot be locked' });
    await settle();
    assert.equal(ended.length, 0, 'a refusal leaves the reader open');
    assert.equal(document.querySelector('.pc-file-message')?.textContent, 'This session cannot be locked');
    assert.ok(document.querySelector('.pc-file-message-error'));
    assert.equal(alerts.length, 0, 'not an alert over the game world');
});

test('R1 m2: Lock from a reader closes it only once the server agrees', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    sessions.lockingSupported = () => true;
    const asked = [];
    sessions.lockSession = async (pcId) => { asked.push(pcId); return { ok: true }; };
    rememberDesktop('hot_desk', { containerItem: loginPc(), places: [] });
    const mg = new TextFileMinigame(document.getElementById('mg'), { title: 'notes.txt', fileName: 'notes.txt', fileContent: 'hello', pcScreen: FILE });
    window.MinigameFramework.currentMinigame = mg;
    mg.init(); mg.start(); await mg.taskbarReady;
    panelItem('pc-start-lock').click();
    assert.equal(ended.length, 0, 'not closed before the answer');
    await settle();
    assert.deepEqual(asked, ['hot_desk']);
    assert.equal(ended.length, 1, 'closed after a successful lock');
});

test('R1 m3: a reader with no remembered desktop does not offer Switch user; with one, it opens the sign-in screen', async () => {
    const bare = await openReader({ withDesktop: false });
    startBtn().click();
    assert.equal(document.getElementById('pc-start-switch'), null, 'nothing to come back to');
    assert.ok(document.getElementById('pc-start-signout'), 'Sign out stays');
    assert.deepEqual(bare.mg.taskbarModel.actions, ['signout']);
    const kept = await openReader();
    panelItem('pc-start-switch').click();
    assert.equal(signInScreens.length, 1);
    assert.equal(signInScreens[0][0], kept.desktopItem);
    assert.deepEqual(signInScreens[0][1], { switching: true });
    assert.equal(ended.length, 1, 'the reader gives way to the sign-in screen');
});

test('R1 m6: a reader\'s Sign out signs the PC out and leaves the reader', async () => {
    await openReader();
    const out = [];
    sessions.signOut = async (pcId) => { out.push(pcId); };
    panelItem('pc-start-signout').click();
    assert.deepEqual(out, ['hot_desk']);
    assert.equal(ended.length, 1);
});

test('R1 m6: the document capture listeners go back to none after the X, Esc and a reader, panel open or not', async () => {
    base();
    const held = new Set();
    const captured = { get size() { return held.size; } };
    const tag = new Map();
    const id = (fn) => { if (!tag.has(fn)) tag.set(fn, tag.size); return tag.get(fn); };
    const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
    const isCapture = (t, c) => ['keydown', 'pointerdown', 'mousedown'].includes(t) && (c === true || c?.capture === true);
    document.addEventListener = (t, fn, c) => { if (isCapture(t, c)) held.add(`${t}:${id(fn)}`); add(t, fn, c); };
    document.removeEventListener = (t, fn, c) => { if (isCapture(t, c)) held.delete(`${t}:${id(fn)}`); remove(t, fn, c); };
    try {
        await sessions.signIn('hot_desk', 'ishaw', 'x');
        const resting = captured.size;
        const desk = await open(loginPc());
        assert.equal(captured.size, resting, 'none at rest with the panel shut');
        startBtn().click();
        assert.equal(captured.size - resting, 3, 'three while the panel is open');
        startBtn().click();
        assert.equal(captured.size, resting, 'none after it shuts');
        for (let i = 0; i < 4; i++) { startBtn().click(); esc(); }
        assert.equal(captured.size, resting, 'none after five opens closed with Esc');
        startBtn().click();
        document.querySelector('#minigame-close')?.click();
        desk.cleanup(); // what the framework's endMinigame runs after the X
        assert.equal(ended.length, 1);
        assert.equal(captured.size, resting, 'none after the X with the panel open');
        // a reader
        const { mg } = await openReader();
        startBtn().click();
        assert.equal(captured.size - resting, 3);
        mg.cleanup();
        assert.equal(captured.size, resting, 'none after the reader closes with the panel open');
    } finally {
        document.addEventListener = add; document.removeEventListener = remove;
    }
});

test('R1 m5: no authored headshot means the silhouette, and the talk image is never fetched or cropped', async () => {
    base();
    const requested = [];
    const Base = fakeImage({});
    globalThis.Image = window.Image = class extends Base { set src(u) { requested.push(u); super.src = u; } get src() { return super.src; } };
    window.npcManager.npcs.set('ian', { id: 'ian', spriteSheet: 'ian_sprite', spriteTalk: 'assets/characters/ian_talk.png' });
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    await open(loginPc());
    await settle(12);
    const box = document.querySelector('.pc-taskbar-headshot');
    assert.equal(box.dataset.frame, 'silhouette');
    assert.ok(box.style.backgroundImage.includes(PC_SILHOUETTE_URL));
    assert.equal(requested.filter(u => /_talk\.png/.test(u)).length, 0, 'the talk image is not even loaded');
    assert.equal(document.querySelector('.pc-start-headshot').dataset.frame, 'silhouette');
});

test('R1 nit 1: Tab out of the panel closes it; moving between its entries does not', async () => {
    base();
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    await open(loginPc());
    startBtn().click();
    const items = [...document.querySelectorAll('.pc-start-panel [role="menuitem"]')];
    items[0].focus();
    items[1].focus();
    assert.equal(panelOpen(), true, 'focus inside the panel');
    const outside = document.querySelector('.desktop-background');
    outside.tabIndex = 0;
    outside.focus();
    assert.equal(panelOpen(), false, 'focus left the panel and Start');
    // and Start to the panel keeps it open
    startBtn().click();
    assert.equal(panelOpen(), true);
    startBtn().focus();
    assert.equal(panelOpen(), true, 'Start is part of the menu');
});

// UI slice 6 review R3 major 1: on a remote desktop the start panel overflowed and hid Switch
// user and Sign out. Only the Places list scrolls now; the actions sit outside it.
const R3_CSS = readFileSync(join(here, '../../public/break_escape/css/pc-monitor.css'), 'utf8');

test('R3 M1: the Places list is the only scroller; Lock, Switch user and Sign out sit outside it', () => {
    const model = pcTaskbarModel({ pcData: { lockType: 'login', name: 'Door controller', host: 'HB-DOOR-01' },
        session: { username: 'ishaw', displayName: 'Ian Shaw', via: 'password', remote: true }, lockSupported: true });
    const holder = document.createElement('div');
    holder.innerHTML = taskbarMod.pcStartPanelHtml(model);
    const panel = holder.querySelector('.pc-start-panel');
    const list = panel.querySelector('.pc-start-places-list');
    assert.ok(list.classList.contains('pixel-scroll'), 'the list takes the shared pixel scrollbar');
    assert.ok(list.querySelector('[data-place="desktop"]'), 'Desktop is in the list');
    assert.equal(list.querySelectorAll('[data-action]').length, 0, 'no action inside the scroller');
    const actions = [...panel.querySelectorAll('.pc-start-actions [data-action]')].map(b => b.dataset.action);
    assert.deepEqual(actions, ['lock', 'switch', 'signout']);
    assert.equal(list.closest('.pc-start-actions'), null);
    const more = panel.querySelector('.pc-start-more');
    assert.ok(more.hidden, 'the cue starts hidden');
    assert.equal(more.textContent.trim(), 'More below', 'the shared words');
    assert.equal(more.closest('.pc-start-actions'), null);
    // CSS: the panel is a flex column; the fixed parts never shrink; only the list scrolls
    const rule = (sel) => R3_CSS.match(new RegExp(sel.replace(/[.[\]]/g, '\\$&') + ' \\{[^}]*\\}'))?.[0] || '';
    assert.match(rule('.pc-monitor .pc-start-panel'), /display:\s*flex;[\s\S]*flex-direction:\s*column/);
    assert.match(R3_CSS.match(/\.pc-monitor \.pc-start-account,\s*\.pc-monitor \.pc-start-section,\s*\.pc-monitor \.pc-start-actions \{[^}]*\}/)[0], /flex:\s*0 0 auto/);
    assert.match(rule('.pc-monitor .pc-start-places-list'), /overflow-y:\s*auto/);
    assert.doesNotMatch(R3_CSS.match(/\.pc-monitor \.pc-start-more \{[^}]*\}/)[0], /gradient|shadow|radius/);
});

test('R3 M1: updatePlacesCue shows "More below" only while the list runs on', () => {
    const more = { hidden: true };
    const list = (scrollHeight, clientHeight, scrollTop = 0) => ({ scrollHeight, clientHeight, scrollTop });
    assert.equal(taskbarMod.updatePlacesCue(list(72, 40), more), true);
    assert.equal(more.hidden, false);
    assert.equal(taskbarMod.updatePlacesCue(list(72, 40, 32), more), false, 'scrolled to the end');
    assert.equal(more.hidden, true);
    assert.equal(taskbarMod.updatePlacesCue(list(41, 40), more), false, 'a pixel or two of rounding is not more below');
    assert.equal(taskbarMod.updatePlacesCue(null, more), false);
});

test('R3 M1: a cramped Places list makes the panel compact (x1 picture, no PC name line)', () => {
    const list = (scrollHeight, clientHeight) => ({ scrollHeight, clientHeight });
    assert.equal(taskbarMod.placesNeedRoom(list(72, 40)), true, 'three rows in 40 px');
    assert.equal(taskbarMod.placesNeedRoom(list(72, 72)), false, 'all rows on show');
    assert.equal(taskbarMod.placesNeedRoom(list(72, 72), { rows: 3 }), false);
    assert.equal(taskbarMod.placesNeedRoom(list(200, 80)), false, 'already three rows: it just scrolls');
    assert.equal(taskbarMod.placesNeedRoom(null), false);
    assert.match(R3_CSS, /\.pc-monitor \.pc-start-compact \.pc-start-pcname/);
});

test('R3 M1: opening the panel measures the list; compact is set and cleared by what fits', () => {
    const model = pcTaskbarModel({ pcData: { lockType: 'login', name: 'Door controller', host: 'HB-DOOR-01' },
        session: { username: 'ishaw', displayName: 'Ian Shaw', via: 'password', remote: true }, lockSupported: true });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const bar = taskbarMod.mountPcTaskbar(root, model);
    const list = bar.panel.querySelector('.pc-start-places-list');
    const more = bar.panel.querySelector('.pc-start-more');
    const size = (sh, ch) => { Object.defineProperty(list, 'scrollHeight', { value: sh, configurable: true }); Object.defineProperty(list, 'clientHeight', { value: ch, configurable: true }); };
    size(72, 40);
    bar.open();
    assert.ok(bar.panel.classList.contains('pc-start-compact'), 'cramped: compact');
    bar.close();
    size(72, 72);
    bar.open();
    assert.ok(!bar.panel.classList.contains('pc-start-compact'), 'room: back to the full picture');
    assert.equal(more.hidden, true);
    bar.close();
    size(120, 48);
    bar.open();
    assert.equal(more.hidden, false, 'more below shows');
    bar.destroy();
    root.remove();
});

// UI slice 6 review R4: Places must not hang out over the actions, and compact is decided again
// whenever the window resizes while the panel is open.
test('R4 M1: the Places section keeps its heading and a row of list, so the list cannot cover the actions', () => {
    const section = R3_CSS.match(/\.pc-monitor \.pc-start-section\.pc-start-places \{[^}]*\}/)[0];
    assert.doesNotMatch(section, /min-height:\s*0\b/, 'the section may not shrink to nothing');
    assert.match(section, /min-height:\s*52px/);
    const list = R3_CSS.match(/\.pc-monitor \.pc-start-places-list \{[^}]*\}/)[0];
    assert.match(list, /min-height:\s*24px/, 'one row');
    assert.match(R3_CSS, /\.pc-start-compact \.pc-start-section\.pc-start-places \{\s*min-height:\s*48px/, "compact has 4px less padding");
});

test('R4 N1: a resize while the panel is open re-decides compact and the picture', () => {
    const model = pcTaskbarModel({ pcData: { lockType: 'login', name: 'Door controller', host: 'HB-DOOR-01' },
        session: { username: 'ishaw', displayName: 'Ian Shaw', via: 'password', remote: true }, lockSupported: true });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const bar = taskbarMod.mountPcTaskbar(root, model);
    const list = bar.panel.querySelector('.pc-start-places-list');
    const more = bar.panel.querySelector('.pc-start-more');
    const size = (sh, ch) => { Object.defineProperty(list, 'scrollHeight', { value: sh, configurable: true }); Object.defineProperty(list, 'clientHeight', { value: ch, configurable: true }); };
    const resize = () => window.dispatchEvent(new window.Event('resize'));
    const scale = () => bar.panel.querySelector('.pc-start-headshot')?.dataset.scale;
    size(72, 72);
    bar.open();
    assert.ok(!bar.panel.classList.contains('pc-start-compact'));
    assert.equal(scale(), '2');
    size(72, 40);
    resize();
    assert.ok(bar.panel.classList.contains('pc-start-compact'), 'shrunk: compact');
    assert.equal(scale(), '1', 'and the x1 picture');
    assert.equal(more.hidden, false, 'the cue follows');
    size(72, 72);
    resize();
    assert.ok(!bar.panel.classList.contains('pc-start-compact'), 'enlarged: back to the full picture');
    assert.equal(scale(), '2');
    // A closed panel is left alone
    bar.close();
    size(72, 40);
    resize();
    assert.ok(!bar.panel.classList.contains('pc-start-compact'), 'closed: no decision');
    bar.destroy();
    size(72, 72);
    root.remove();
});

test('R4: a panel that would scroll as a whole goes compact even when its Places list fits', () => {
    assert.equal(taskbarMod.panelOverflows({ scrollHeight: 640, clientHeight: 624 }), true);
    assert.equal(taskbarMod.panelOverflows({ scrollHeight: 624, clientHeight: 624 }), false);
    assert.equal(taskbarMod.panelOverflows({ scrollHeight: 625, clientHeight: 624 }), false, 'a pixel of rounding');
    assert.equal(taskbarMod.panelOverflows(null), false);
    const model = pcTaskbarModel({ pcData: { lockType: 'login', name: 'Door controller', host: 'HB-DOOR-01' },
        session: { username: 'ishaw', displayName: 'Ian Shaw', via: 'password', remote: true }, lockSupported: true });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const bar = taskbarMod.mountPcTaskbar(root, model);
    const def = (el, k, v) => Object.defineProperty(el, k, { value: v, configurable: true });
    const list = bar.panel.querySelector('.pc-start-places-list');
    def(list, 'scrollHeight', 34); def(list, 'clientHeight', 34);
    def(bar.panel, 'scrollHeight', 640); def(bar.panel, 'clientHeight', 624);
    bar.open();
    assert.ok(bar.panel.classList.contains('pc-start-compact'));
    bar.close();
    def(bar.panel, 'scrollHeight', 624);
    bar.open();
    assert.ok(!bar.panel.classList.contains('pc-start-compact'));
    bar.destroy();
    root.remove();
});

test('R4: compact on a short screen drops the This PC heading but keeps Places', () => {
    assert.match(R3_CSS, /\.pc-monitor\[data-short\] \.pc-start-compact \.pc-start-section:not\(\.pc-start-places\) \.pc-start-heading \{\s*display:\s*none/);
});
