// Access model step 8 (docs/achitechture/ACCESS_MODEL_PLAN.md 5.1, 5.3): a sign-in PC's
// desktop in the container minigame. A takeable file offers Open, Copy to inventory, Move
// to inventory and Cancel, and only Open once held; "transfer": "copy" offers no Move; the
// inventory add carries source_pc_id and transfer. The header names the account, with
// Switch user and Sign out (through pc-sessions.js); a container 403 drops the session with
// one pc_signed_out and no request, and reopens the sign-in screen.
// The real container-minigame.js, base-minigame.js and pc-sessions.js run against jsdom.
// Run with: node test/js/container-transfer-dialog.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'container-transfer-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/escape-html.js');
copy('utils/more-below.js');
copy('utils/computer-keywords.js');
copy('utils/pc-monitor.js');
copy('utils/npc-headshot.js');
copy('utils/pc-taskbar.js');
copy('utils/author-html.js');
copy('utils/remote-host-text.js');
copy('utils/compromise-bolt.js');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export const adds = [];\n' +
    'export async function addToInventory(sprite) { adds.push(sprite); globalThis.window.inventory.items.push({ scenarioData: sprite.scenarioData }); return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
copy('minigames/container/container-item-image.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/container/container-minigame.js');
copy('minigames/container/cached-accounts-panel.js');
copy('minigames/network-view/ops-model.js');
copy('systems/pc-sessions.js');
copy('systems/mfa-client.js');
copy('systems/helpdesk-client.js');
copy('utils/sync-before-fetch.js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { ContainerMinigame, transferChoices, claimLineText } = await imp('minigames/container/container-minigame.js');
const { adds } = await imp('systems/inventory.js');
const { PcSessions } = await imp('systems/pc-sessions.js');

const FILES = [
    { id: 'staff_handbook', type: 'text_file', name: 'Staff handbook.txt', takeable: false, text: 'handbook' },
    { id: 'ian_rota', type: 'text_file', name: 'Server rota.txt', takeable: true, text: 'rota' },
    { id: 'ian_vpn_notes', type: 'text_file', name: 'VPN notes.txt', takeable: true, text: 'vpn' },
    { id: 'ian_licence_keys', type: 'text_file', name: 'Licence keys.csv', takeable: true, transfer: 'copy', text: 'keys' }
];

let events, apiCalls, ended, alerts, signInScreens, sessions, status;
async function openDesktop({ answer = 200, contents = FILES, item, held, focusReturn = null } = {}) {
    events = []; apiCalls = []; ended = []; alerts = []; signInScreens = []; adds.length = 0;
    status = answer;
    document.body.innerHTML = '<div id="mg"></div>';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.openLoginSignIn = (lockable, opts) => signInScreens.push([lockable, opts]);
    window.ApiClient = {
        login: async () => ({ success: true, npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' }),
        logout: async (pcId) => { apiCalls.push(['logout', pcId]); return { success: true }; }
    };
    window.fetch = globalThis.fetch = async (url) => {
        apiCalls.push(['fetch', url]);
        return { ok: status === 200, status, statusText: String(status), json: async () => ({ contents: contents.map(c => ({ ...c })) }) };
    };
    sessions = new PcSessions();
    window.pcSessions = sessions;
    if (held) sessions.load({ hot_desk: held }, []);
    else await sessions.signIn('hot_desk', 'ishaw', 'x');
    events.length = 0; apiCalls.length = 0;
    window.MinigameFramework = { currentMinigame: null, endMinigame: (s, r) => ended.push([s, r]) };
    const containerItem = item || { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'A hot desk.' } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Hot desk PC', containerItem, contents: null, focusReturn });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    return mg;
}
const icon = (name) => [...document.querySelectorAll('.desktop-icon')].find(el => el.querySelector('.desktop-icon-label').textContent === name);
const dialogLabels = () => [...document.querySelectorAll('.desktop-transfer-dialog [data-choice]')].map(b => b.textContent);
const choose = (label) => [...document.querySelectorAll('.desktop-transfer-dialog [data-choice]')].find(b => b.textContent === label).click();
const settle = (ms = 0) => new Promise(r => setTimeout(r, ms));
// UX slice 6: Switch user and Sign out are in the start panel
const startAction = (id) => { document.querySelector('.pc-start-btn').click(); document.getElementById(`pc-start-${id}`).click(); };

test('transferChoices: both by default, Copy or Move only when restricted, only Open once held', () => {
    assert.deepEqual(transferChoices({}, false), ['open', 'copy', 'move', 'cancel']);
    assert.deepEqual(transferChoices({ transfer: 'both' }, false), ['open', 'copy', 'move', 'cancel']);
    assert.deepEqual(transferChoices({ transfer: 'copy' }, false), ['open', 'copy', 'cancel']);
    assert.deepEqual(transferChoices({ transfer: 'move' }, false), ['open', 'move', 'cancel']);
    assert.deepEqual(transferChoices({ transfer: 'copy' }, true), ['open', 'cancel']);
});

test('a claimed session says whose open screen it is and when it ends (UX access R1 finding 5)', async () => {
    assert.equal(claimLineText(null), null);
    assert.equal(claimLineText({ via: 'password', displayName: 'Dana Reyes' }), null);
    assert.equal(claimLineText({ via: 'claim', displayName: 'Dana Reyes', username: 'dreyes' }),
        "You're on Dana Reyes's open screen. It ends when they come back or the screen locks.");
    assert.equal(claimLineText({ via: 'claim', guest: true, displayName: 'Ian Shaw' }),
        "You're on the screen Ian Shaw left open. It ends when the screen locks.");
    const mg = await openDesktop();
    assert.ok(document.querySelector('.desktop-claim-line') === null, 'none for a password sign-in');
    sessions.sessions.get('hot_desk').via = 'claim';
    const html = mg.accountBarHtml();
    assert.match(html, /desktop-claim-line/);
    assert.match(html.replace(/<[^>]+>/g, ''), /Using Ian Shaw's session \(ishaw\)/);
    assert.doesNotMatch(html, /Signed in as/);
});

test('the desktop loads from container for the session and names the account, with Switch user and Sign out', async () => {
    const mg = await openDesktop();
    assert.deepEqual(apiCalls, [['fetch', '/break_escape/games/7/container/hot_desk']]);
    assert.equal(mg.desktopMode, true);
    // UX slice 6: the account is on the taskbar at the bottom of the screen, Switch user
    // and Sign out in the start panel; the description sits above the taskbar
    assert.ok(document.querySelector('.desktop-account-bar') === null, 'no top account bar in the monitor');
    const bar = document.querySelector('.pc-monitor .pc-monitor-screen .pc-taskbar');
    assert.ok(bar, 'the taskbar is on the monitor screen');
    assert.equal(bar.querySelector('.pc-taskbar-name').textContent, 'Ian Shaw');
    document.querySelector('.pc-start-btn').click();
    assert.ok(document.getElementById('pc-start-switch'));
    assert.ok(document.getElementById('pc-start-signout'));
    assert.ok(document.getElementById('pc-start-lock') === null, 'no Lock until the server supports it');
    assert.equal(document.querySelector('.pc-start-username').textContent, 'ishaw');
    assert.ok(document.querySelector('.pc-desktop-status, .desktop-taskbar-note') === null, 'the PC\'s observations are not repeated on its desktop');
    assert.equal(document.querySelector('.pc-monitor-name').textContent, mg.containerItem.scenarioData.name, 'the PC name on the bezel');
    assert.deepEqual(events.filter(([n]) => n === 'pc_desktop_opened').map(([, d]) => d),
        [{ pcId: 'hot_desk', npcId: 'ian', via: 'password', restored: false }]);
    assert.deepEqual(mg.getTestState().signedInAs, { username: 'ishaw', displayName: 'Ian Shaw' });
});

test('a takeable file offers Open, Copy, Move and Cancel; Copy keeps it listed and sends source_pc_id and transfer', async () => {
    const mg = await openDesktop();
    icon('Server rota.txt').click();
    assert.deepEqual(dialogLabels(), ['Open', 'Copy to inventory', 'Move to inventory', 'Cancel']);
    assert.deepEqual(mg.getTestState().transferDialog.choices, ['Open', 'Copy to inventory', 'Move to inventory', 'Cancel']);
    choose('Copy to inventory');
    await settle();
    assert.equal(adds.length, 1);
    assert.equal(adds[0].sourcePcId, 'hot_desk');
    assert.equal(adds[0].transfer, 'copy');
    assert.equal(adds[0].scenarioData.id, 'ian_rota');
    assert.ok(icon('Server rota.txt'), 'a copy stays on the desktop');
    // Held now: only Open
    icon('Server rota.txt').click();
    assert.deepEqual(dialogLabels(), ['Open', 'Cancel']);
    choose('Cancel');
    assert.ok(document.querySelector('.desktop-transfer-dialog') === null);
    assert.equal(adds.length, 1);
});

test('Move takes the file off the desktop with transfer move', async () => {
    await openDesktop();
    icon('VPN notes.txt').click();
    choose('Move to inventory');
    await settle();
    assert.equal(adds.length, 1);
    assert.equal(adds[0].transfer, 'move');
    assert.equal(adds[0].sourcePcId, 'hot_desk');
    assert.equal(icon('VPN notes.txt'), undefined);
});

test('"transfer": "copy" offers no Move', async () => {
    await openDesktop();
    icon('Licence keys.csv').click();
    assert.deepEqual(dialogLabels(), ['Open', 'Copy to inventory', 'Cancel']);
});

test('Open shows the file without taking it', async () => {
    await openDesktop();
    const opened = [];
    window.handleObjectInteraction = (sprite) => opened.push(sprite);
    icon('Server rota.txt').click();
    choose('Open');
    assert.equal(adds.length, 0);
    assert.equal(opened.length, 1);
    assert.equal(opened[0].scenarioData.id, 'ian_rota');
    assert.equal(opened[0].scenarioData.takeable, false, 'the viewer copy is not taken');
    assert.equal(ended.length, 1, 'the desktop closes for the viewer');
    // UX slice 2c R3 M2: the reader opens in this PC's monitor frame
    assert.ok(opened[0].pcScreen && opened[0].pcScreen.pcId, 'the PC screen is handed on');
});

test('keyring K3a R1 m2: Open, Copy and Move each mark the file opened for an "In file" tag; a click on a readable item does too', async () => {
    const opened = () => window.keyring.opened;
    const withKeyring = () => { window.keyring = { opened: [], noteOpened(id) { this.opened.push(id); } }; };
    // Open in the transfer dialog
    let mg = await openDesktop(); withKeyring();
    window.handleObjectInteraction = () => {};
    icon('Server rota.txt').click(); choose('Open');
    assert.deepEqual(opened(), ['ian_rota']);
    // Copy to inventory (a takeable file copied: the case that never called a hook)
    mg = await openDesktop(); withKeyring();
    icon('Server rota.txt').click(); choose('Copy to inventory'); await settle();
    assert.deepEqual(opened(), ['ian_rota'], 'copied');
    // Move to inventory
    mg = await openDesktop(); withKeyring();
    icon('VPN notes.txt').click(); choose('Move to inventory'); await settle();
    assert.deepEqual(opened(), ['ian_vpn_notes'], 'moved');
    // A file that is not takeable opens on a click
    mg = await openDesktop(); withKeyring();
    icon('Staff handbook.txt').click(); await settle();
    assert.deepEqual(opened(), ['staff_handbook'], 'a plain click on a readable item');
    // Cancel marks nothing
    mg = await openDesktop(); withKeyring();
    icon('Server rota.txt').click(); choose('Cancel');
    assert.deepEqual(opened(), []);
    window.keyring = undefined;
});

test('keyring K3a R1 t4: the account bar of a credential session names the saved connection, label escaped and kept whole', async () => {
    const mg = await openDesktop();
    sessions.sessions.get('hot_desk').via = 'credential';
    sessions.sessions.get('hot_desk').kind = 'saved_connection';
    sessions.sessions.get('hot_desk').label = '<b>HB-FIN-02.rdp</b>';
    const html = mg.accountBarHtml();
    assert.match(html, /<span class="desktop-account-credential">with the saved connection <span class="credential-label-nowrap">&lt;b&gt;HB-FIN-02\.rdp&lt;\/b&gt;<\/span><\/span>/);
    assert.equal(html.includes('<b>HB'), false);
    sessions.sessions.get('hot_desk').via = 'password';
    assert.equal(mg.accountBarHtml().includes('desktop-account-credential'), false);
});

test('a plain PC desktop (not a sign-in PC) keeps today\'s behaviour: no dialog, no source_pc_id', async () => {
    const plain = { scenarioData: { id: 'old_pc', type: 'pc', name: 'Old PC', locked: false } };
    await openDesktop({ item: plain });
    icon('VPN notes.txt').click();
    await settle();
    assert.ok(document.querySelector('.desktop-transfer-dialog') === null);
    assert.equal(adds.length, 1);
    assert.equal(adds[0].sourcePcId, undefined);
    assert.ok(document.querySelector('.desktop-account-bar') === null);
});

test('a folder opened from a sign-in desktop keeps the PC as the source of its files', async () => {
    await openDesktop();
    const sprite = { scenarioData: { id: 'ian_archive', type: 'zip_archive', name: 'Old configs.zip', locked: false, contents: [] }, sourcePcId: 'hot_desk' };
    const folder = new ContainerMinigame(document.getElementById('mg'), { containerItem: sprite, contents: null });
    assert.equal(folder.sourcePcId, 'hot_desk');
    assert.equal(folder.loginPcId, null);
    assert.equal(folder.offersTransfer({ takeable: true }), true);
});

// Code review R1, m3: the folder replaces the desktop minigame, whose cleanup unregisters it
test('a folder opened from a sign-in desktop closes with the message when the session ends', async () => {
    const desktop = await openDesktop();
    desktop.cleanup();
    const sprite = { scenarioData: { id: 'ian_archive', type: 'folder', name: 'Old configs', locked: false, contents: [] }, sourcePcId: 'hot_desk' };
    const folder = new ContainerMinigame(document.getElementById('mg'), { containerItem: sprite, contents: null });
    window.MinigameFramework.currentMinigame = folder;
    await folder.init();
    ended.length = 0; alerts.length = 0;
    await sessions.signOut('hot_desk');
    assert.equal(ended.length, 1, 'the folder closed');
    assert.ok(alerts.some(a => a[0] === 'Signed out'), 'with the message');
});

test('a folder from a sign-in desktop that closes first leaves nothing registered', async () => {
    const desktop = await openDesktop();
    desktop.cleanup();
    const sprite = { scenarioData: { id: 'ian_archive', type: 'folder', name: 'Old configs', locked: false, contents: [] }, sourcePcId: 'hot_desk' };
    const folder = new ContainerMinigame(document.getElementById('mg'), { containerItem: sprite, contents: null });
    await folder.init();
    folder.cleanup();
    assert.equal(sessions.desktops.has('hot_desk'), false);
});

test('Sign out: POST /logout, one pc_signed_out, and the desktop closes with "Signed out"', async () => {
    await openDesktop();
    startAction('signout');
    await settle();
    assert.deepEqual(apiCalls.filter(c => c[0] === 'logout'), [['logout', 'hot_desk']]);
    assert.deepEqual(events.filter(([n]) => n === 'pc_signed_out').map(([, d]) => d), [{ pcId: 'hot_desk', npcId: 'ian', reason: 'sign_out' }]);
    assert.equal(ended.length, 1);
    assert.ok(alerts.some(a => a[0] === 'Signed out'));
    assert.equal(sessions.has('hot_desk'), false);
});

test('Switch user opens the sign-in screen over the desktop and leaves the session alone', async () => {
    const mg = await openDesktop();
    startAction('switch');
    assert.equal(signInScreens.length, 1);
    assert.equal(signInScreens[0][0], mg.containerItem);
    assert.deepEqual(signInScreens[0][1], { switching: true });
    assert.equal(sessions.has('hot_desk'), true);
    assert.equal(events.filter(([n]) => n === 'pc_signed_out').length, 0);
});

test('a container 403 drops the session locally (one pc_signed_out, no request) and opens the sign-in screen', async () => {
    await openDesktop({ answer: 403 });
    await settle(80);
    assert.deepEqual(events.filter(([n]) => n === 'pc_signed_out').map(([, d]) => d), [{ pcId: 'hot_desk', npcId: 'ian', reason: 'no_session' }]);
    assert.deepEqual(apiCalls.filter(c => c[0] === 'logout'), [], 'no POST /logout');
    assert.equal(sessions.has('hot_desk'), false);
    assert.equal(ended.length, 1);
    assert.equal(signInScreens.length, 1);
    assert.ok(document.querySelector('.desktop-icon') === null);
});

// The inventory add's source_pc_id and transfer are checked by running inventory.js in
// access-signin-requests.test.mjs (code review R1, m9).

// ---- keyring K5: the session token's bar line, its minute refresh and the expired 403 ----

const TOKEN_SESSION = {
    npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'credential', kind: 'token', label: 'HB-FIN-02 sign-in token',
    remote: true, footholdId: 'drop_box', host: 'HB-FIN-02', expiresInS: 600
};
const barLine = () => document.querySelector('.pc-taskbar .pc-taskbar-credential, .pc-start-credential')?.textContent;
const startLine = () => document.querySelector('.pc-start-credential')?.textContent;

test('K5: the account bar and start panel of a token session name no label and say the minutes left', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const mg = await openDesktop({ held: TOKEN_SESSION });
        assert.equal(startLine(), 'with a session token, about 10 min left');
        assert.equal(mg.accountBarHtml().includes('credential-label-nowrap'), false, 'no label span on a token line');
        assert.match(mg.accountBarHtml(), /<span class="desktop-account-credential">with a session token, about 10 min left<\/span>/);
        mg.cleanup?.();
    } finally { mock.timers.reset(); }
});

test('K5: the token line steps down each minute from the client timer, with no request, and the interval stops on cleanup', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const mg = await openDesktop({ held: TOKEN_SESSION });
        apiCalls.length = 0;
        mock.timers.tick(60 * 1000);
        assert.equal(startLine(), 'with a session token, about 9 min left');
        mock.timers.tick(60 * 1000 * 8);
        assert.equal(startLine(), 'with a session token, about 1 min left');
        mock.timers.tick(60 * 1000);
        // 600 s are gone: the session's own timer closed the desktop with the token line
        assert.deepEqual(alerts.at(-1).slice(0, 2), ['HB-FIN-02 sign-in token expired. Your session on HB-FIN-02 ended.', 'info']);
        assert.equal(apiCalls.filter(c => c[0] === 'fetch').length, 0, 'no request for a refresh');
        assert.equal(mg._tokenLineTimer, null, 'the interval is cleared on close');
    } finally { mock.timers.reset(); }
});

test('K5 R1 m1: the line steps on the token\'s own minute boundary, not a mount-relative minute', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const mg = await openDesktop({ held: { ...TOKEN_SESSION, expiresInS: 125 } });
        assert.equal(startLine(), 'with a session token, about 3 min left');
        mock.timers.tick(60 * 1000);
        assert.equal(startLine(), 'with a session token, about 2 min left');
        // 49 s left: a mount-relative minute tick would still read "about 2 min"
        mock.timers.tick(6 * 1000 + 10 * 1000);
        assert.equal(startLine(), 'with a session token, under a minute left');
        mg.cleanup?.();
    } finally { mock.timers.reset(); }
});

test('K5: under a minute the line reads "under a minute left"; a password session has no timer', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const mg = await openDesktop({ held: { ...TOKEN_SESSION, expiresInS: 100 } });
        assert.equal(startLine(), 'with a session token, about 2 min left');
        mock.timers.tick(60 * 1000);
        assert.equal(startLine(), 'with a session token, under a minute left');
        mg.cleanup?.();
        const pw = await openDesktop();
        assert.equal(pw._tokenLineTimer ?? null, null);
        pw.cleanup?.();
    } finally { mock.timers.reset(); }
});

const stripToken = () => document.querySelector('.pc-desktop-topbar .desktop-token-line')?.textContent;

test('K5 R3: the top strip says the minutes left for a token session, steps each minute, and a password session has no such line', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const mg = await openDesktop({ held: TOKEN_SESSION });
        assert.equal(stripToken(), 'with a session token, about 10 min left');
        assert.equal(document.querySelectorAll('.pc-desktop-topbar .desktop-token-line').length, 1);
        mock.timers.tick(60 * 1000);
        assert.equal(stripToken(), 'with a session token, about 9 min left');
        mock.timers.tick(60 * 1000 * 8 + 20 * 1000);
        assert.equal(stripToken(), 'with a session token, under a minute left');
        mg.cleanup?.();
        const pw = await openDesktop();
        assert.ok(document.querySelector('.desktop-token-line') === null, 'none for a password session');
        pw.cleanup?.();
    } finally { mock.timers.reset(); }
});

test('K5 R3: the strip line is plain text; a hostile label or link name makes no element', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const hostile = '<img src=x onerror=alert(1)>';
        const mg = await openDesktop({ held: { ...TOKEN_SESSION, label: hostile } });
        const html = mg.sessionNoticesHtml();
        assert.doesNotMatch(html, /<img/);
        assert.ok(document.querySelector('.pc-desktop-topbar img') === null);
        assert.equal(stripToken(), 'with a session token, about 10 min left');
        assert.equal(stripToken().includes('onerror'), false);
        mg.cleanup?.();
    } finally { mock.timers.reset(); }
});

test('K5 R5 m3: sessionNoticesHtml draws the amber token line only when under 60 s are left at first draw', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
    try {
        const low = await openDesktop({ held: { ...TOKEN_SESSION, expiresInS: 45 } });
        const lowHtml = low.sessionNoticesHtml();
        assert.match(lowHtml, /class="desktop-claim-line desktop-token-line desktop-token-line-low"/, '45 s left is amber');
        assert.match(lowHtml, /under a minute left/);
        low.cleanup?.();
        const calm = await openDesktop({ held: { ...TOKEN_SESSION, expiresInS: 600 } });
        const calmHtml = calm.sessionNoticesHtml();
        assert.match(calmHtml, /desktop-token-line/);
        assert.doesNotMatch(calmHtml, /desktop-token-line-low/, '10 min left is neutral');
        calm.cleanup?.();
    } finally { mock.timers.reset(); }
});

test('K5: a remote desktop request refused 403 expired drops the local copy and says the token expired', async () => {
    const mg = await openDesktop({ held: TOKEN_SESSION });
    mg.cleanup?.();
    // A second desktop opened over the same session meets the server's refusal
    document.body.innerHTML = '<div id="mg2"></div>';
    window.fetch = globalThis.fetch = async (url) => {
        apiCalls.push(['fetch', url]);
        return { ok: false, status: 403, statusText: '403', json: async () => ({ error: 'Token expired', reason: 'expired' }) };
    };
    alerts.length = 0;
    const item = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'x', remote: { footholdId: 'drop_box' } } };
    const mg2 = new ContainerMinigame(document.getElementById('mg2'), { title: 'Hot desk PC', containerItem: item, contents: null });
    window.MinigameFramework.currentMinigame = mg2;
    await mg2.init();
    assert.equal(sessions.has('hot_desk'), false, 'the copy is dropped');
    assert.equal(mg2.exitReason, 'expired');
    await settle(80);
    assert.deepEqual(alerts.at(-1).slice(0, 2), ['HB-FIN-02 sign-in token has expired.', 'info']);
    assert.deepEqual(signInScreens, [], 'never the keyboard sign-in screen');
});

test('K5 R1 t3: a keyboard desktop refused 403 expired says the token line, never the sign-in screen', async () => {
    const mg = await openDesktop({ held: TOKEN_SESSION });
    mg.cleanup?.();
    document.body.innerHTML = '<div id="mg3"></div>';
    window.fetch = globalThis.fetch = async (url) => {
        apiCalls.push(['fetch', url]);
        return { ok: false, status: 403, statusText: '403', json: async () => ({ error: 'Token expired', reason: 'expired' }) };
    };
    alerts.length = 0;
    const item = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'x' } };
    const mg3 = new ContainerMinigame(document.getElementById('mg3'), { title: 'Hot desk PC', containerItem: item, contents: null });
    window.MinigameFramework.currentMinigame = mg3;
    signInScreens.length = 0;
    await mg3.init();
    assert.equal(sessions.has('hot_desk'), false, 'the copy is dropped');
    await settle(80); // the 50 ms timer that would open the sign-in screen has run
    assert.deepEqual(alerts.at(-1).slice(0, 2), ['HB-FIN-02 sign-in token has expired.', 'info']);
    assert.deepEqual(signInScreens, [], 'never the keyboard sign-in screen');
});

test('K5: the taskbar token line rounds as remote-host-text.js tokenMinutesLeft does, and an unknown time reads plainly', async () => {
    const { tokenSessionLine, credentialSessionLine, credentialLineHtml, refreshTokenLines } = await imp('utils/pc-taskbar.js');
    const text = await imp('utils/remote-host-text.js');
    for (const secs of [0, 1, 59, 60, 61, 119, 120, 600, 3599, 3600]) {
        const line = tokenSessionLine(secs);
        if (secs < 60) assert.equal(line, 'with a session token, under a minute left');
        else assert.equal(line, `with a session token, about ${text.tokenMinutesLeft(secs)} min left`);
    }
    for (const bad of [undefined, null, NaN, -1, '5']) assert.equal(tokenSessionLine(bad), 'with a session token');
    const t = { via: 'credential', kind: 'token', label: '<b>x</b>', tokenSecondsLeft: 300 };
    assert.equal(credentialSessionLine(t), 'with a session token, about 5 min left');
    assert.equal(credentialLineHtml(t), 'with a session token, about 5 min left', 'the label never appears');
    assert.equal(credentialSessionLine({ ...t, via: 'password' }), null);
    // refreshTokenLines rewrites text, never markup
    document.body.innerHTML = '<span class="desktop-account-credential">old</span><span class="pc-start-credential">old</span>';
    assert.equal(refreshTokenLines(document.body, t), true);
    assert.equal(refreshTokenLines(document.body, t), false, 'nothing to change the second time');
    assert.deepEqual([...document.querySelectorAll('span')].map(e => e.textContent), ['with a session token, about 5 min left', 'with a session token, about 5 min left']);
    assert.equal(refreshTokenLines(document.body, { ...t, kind: 'saved_connection' }), false);
    // R4 m1: the top-strip line is neutral, and amber (the -low class) only under a minute left
    document.body.innerHTML = '<div class="desktop-claim-line desktop-token-line">x</div>';
    const strip = document.querySelector('.desktop-token-line');
    refreshTokenLines(document.body, t);
    assert.equal(strip.classList.contains('desktop-token-line-low'), false, '5 min left is neutral');
    refreshTokenLines(document.body, { ...t, tokenSecondsLeft: 59 });
    assert.equal(strip.classList.contains('desktop-token-line-low'), true, 'under a minute is amber');
    assert.match(strip.textContent, /under a minute left/);
    refreshTokenLines(document.body, { ...t, tokenSecondsLeft: 600 });
    assert.equal(strip.classList.contains('desktop-token-line-low'), false, 'a longer figure goes neutral again');
});

// Icon labels R2 m2: keyboard focus through the Copy / Move dialog, a taken icon and the reader's return
const pressKey = (target, key) => target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

test('Icon labels R2 m2: Enter on an icon focuses the dialog\'s first button; closing it returns focus to that icon; a mouse click steals nothing', async () => {
    await openDesktop();
    const rota = icon('Server rota.txt');
    rota.focus();
    pressKey(rota, 'Enter');
    const first = document.querySelector('.desktop-transfer-dialog .desktop-transfer-btn');
    assert.equal(first.textContent, 'Open');
    assert.ok(document.activeElement === first, 'the first button has the focus');
    choose('Cancel');
    assert.ok(document.querySelector('.desktop-transfer-dialog') === null);
    assert.ok(document.activeElement === rota, 'focus is back on the icon that opened it');
    // a click (mouse) opens the dialog without moving focus into it
    document.activeElement.blur();
    icon('VPN notes.txt').click();
    assert.ok(document.activeElement.closest('.desktop-transfer-dialog') === null, 'a click does not focus a button');
    choose('Cancel');
});

test('Icon labels R2 m2: a moved icon passes focus to the next icon, the previous one, then the desktop', async () => {
    await openDesktop();
    const names = () => [...document.querySelectorAll('.desktop-icon-label')].map(l => l.textContent);
    const moveByKey = async (name) => {
        const el = icon(name);
        el.focus();
        pressKey(el, 'Enter');
        choose('Move to inventory');
        await settle();
    };
    await moveByKey('Server rota.txt'); // not the last: the next icon
    assert.equal(document.activeElement.querySelector('.desktop-icon-label').textContent, 'VPN notes.txt');
    await moveByKey('VPN notes.txt');
    assert.equal(document.activeElement.querySelector('.desktop-icon-label').textContent, 'Licence keys.csv', 'the next one again');
    assert.deepEqual(names().includes('VPN notes.txt'), false);
    // a Copy leaves the icon on the desktop
    const lic = icon('Licence keys.csv');
    lic.focus();
    pressKey(lic, 'Enter');
    choose('Copy to inventory');
    await settle();
    assert.ok(document.activeElement === lic, 'a copy leaves the icon, and focus stays on it');
});

test('Icon labels R2 m2: taking the last icon focuses the previous one; taking the only icon focuses the desktop', async () => {
    const two = [{ id: 'a', type: 'text_file', name: 'A.txt', takeable: true, text: 'a' }, { id: 'b', type: 'text_file', name: 'B.txt', takeable: true, text: 'b' }];
    await openDesktop({ contents: two });
    const b = icon('B.txt');
    b.focus();
    pressKey(b, 'Enter');
    choose('Move to inventory');
    await settle();
    assert.ok(document.activeElement === icon('A.txt'), 'the previous icon');
    const a = icon('A.txt');
    pressKey(a, 'Enter');
    choose('Move to inventory');
    await settle();
    assert.ok(document.activeElement.classList.contains('desktop-background'), 'the desktop');
});

test('Icon labels R3 m1/m2: the opened icon takes the focus again, from the hand-over, only after a key open; used once', async () => {
    const item = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'A hot desk.' } };
    await openDesktop({ item });
    window.handleObjectInteraction = () => {};
    const rota = icon('Server rota.txt');
    rota.focus();
    pressKey(rota, 'Enter');
    choose('Open'); // a keyboard-activated button: click detail 0
    const mark = window.pendingContainerReturn.focusReturn;
    assert.deepEqual(mark, { key: 'ian_rota', byKey: true }, 'the opened file rides on the hand-over');
    const mg = await openDesktop({ item, focusReturn: mark });
    assert.ok(document.activeElement === icon('Server rota.txt'), 'focus is back on that icon');
    assert.equal(mg.params.focusReturn, null, 'used once');
    // a plain reopen (nothing handed over) focuses nothing, however long ago a file was opened
    await openDesktop({ item });
    assert.ok(document.activeElement === document.body);
    // a mouse open: the icon is not focused
    await openDesktop({ item, focusReturn: { key: 'ian_rota', byKey: false } });
    assert.ok(document.activeElement === document.body, 'no focus after a mouse open');
    // the icon is gone (taken meanwhile): nothing is focused, nothing throws
    await openDesktop({ item, contents: FILES.filter(f => f.id !== 'ian_rota'), focusReturn: mark });
    assert.ok(document.activeElement === document.body);
    // a text field elsewhere keeps the focus (n1)
    window.pendingContainerReturn = null;
});

test('Icon labels R3 n1: a text field outside the icon grid keeps the focus', async () => {
    const item = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'A hot desk.' } };
    const mg = await openDesktop({ item });
    const field = document.createElement('input');
    document.body.appendChild(field);
    field.focus();
    mg.params = { ...mg.params, focusReturn: { key: 'ian_rota', byKey: true } };
    mg.focusReturnedIcon(document.getElementById('desktop-icons'));
    assert.ok(document.activeElement === field, 'the input still has the focus');
    field.remove();
});

test('Icon labels R4 m1: a returned icon keeps its clipped label open past the deferred refit, and blur closes it', async () => {
    const item = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'A hot desk.' } };
    const LONG = 'Server_rota_2009-2024_Archive_Final_Signed_Off.txt';
    const files = FILES.map(f => f.id === 'ian_rota' ? { ...f, name: LONG } : f);
    // Widths are stubbed on every label as it is built, so the name clips; jsdom has no layout
    const proto = dom.window.HTMLElement.prototype;
    const hold = (k) => Object.getOwnPropertyDescriptor(proto, k);
    const saved = { sw: hold('scrollWidth'), cw: hold('clientWidth'), sh: hold('scrollHeight'), ch: hold('clientHeight') };
    const isLabel = (el) => el.classList?.contains('desktop-icon-label');
    const over = (k, clipped, whole) => Object.defineProperty(proto, k, { configurable: true, get() { return isLabel(this) ? (this.classList.contains('desktop-icon-label-open') ? whole : clipped) : 0; } });
    over('scrollWidth', 400, 80); over('clientWidth', 80, 80); over('scrollHeight', 120, 40); over('clientHeight', 40, 40);
    // jsdom matches :focus-visible for any focused element, which would hold the label open on
    // its own; a browser does not after a mouse-opened reader, so only the returned-focus flag may
    const origMatches = proto.matches;
    proto.matches = function (q) { return q === ':focus-visible' ? false : origMatches.call(this, q); };
    const raf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
    try {
        await openDesktop({ item, contents: files, focusReturn: { key: 'ian_rota', byKey: true } });
        const rota = icon(LONG);
        const label = rota.querySelector('.desktop-icon-label');
        assert.ok(document.activeElement === rota, 'the returned icon has the focus');
        assert.ok(label.classList.contains('desktop-icon-label-open'), 'open at once');
        await new Promise(r => dom.window.requestAnimationFrame(() => setTimeout(r, 0)));
        assert.ok(label.classList.contains('desktop-icon-label-open'), 'still open after the deferred refit');
        rota.blur();
        assert.equal(label.classList.contains('desktop-icon-label-open'), false, 'blur closes it');
    } finally {
        globalThis.requestAnimationFrame = raf;
        delete proto.matches;
        for (const [k, d] of [['scrollWidth', saved.sw], ['clientWidth', saved.cw], ['scrollHeight', saved.sh], ['clientHeight', saved.ch]]) {
            if (d) Object.defineProperty(proto, k, d); else delete proto[k];
        }
    }
});
