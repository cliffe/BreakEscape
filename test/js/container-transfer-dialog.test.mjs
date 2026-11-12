// Access model step 8 (docs/achitechture/ACCESS_MODEL_PLAN.md 5.1, 5.3): a sign-in PC's
// desktop in the container minigame. A takeable file offers Open, Copy to inventory, Move
// to inventory and Cancel, and only Open once held; "transfer": "copy" offers no Move; the
// inventory add carries source_pc_id and transfer. The header names the account, with
// Switch user and Sign out (through pc-sessions.js); a container 403 drops the session with
// one pc_signed_out and no request, and reopens the sign-in screen.
// The real container-minigame.js, base-minigame.js and pc-sessions.js run against jsdom.
// Run with: node test/js/container-transfer-dialog.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'container-transfer-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/escape-html.js');
copy('utils/author-html.js');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export const adds = [];\n' +
    'export async function addToInventory(sprite) { adds.push(sprite); globalThis.window.inventory.items.push({ scenarioData: sprite.scenarioData }); return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
copy('minigames/container/container-item-image.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/container/container-minigame.js');
copy('systems/pc-sessions.js');

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
async function openDesktop({ answer = 200, contents = FILES, item } = {}) {
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
    await sessions.signIn('hot_desk', 'ishaw', 'x');
    events.length = 0; apiCalls.length = 0;
    window.MinigameFramework = { currentMinigame: null, endMinigame: (s, r) => ended.push([s, r]) };
    const containerItem = item || { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'A hot desk.' } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Hot desk PC', containerItem, contents: null });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    return mg;
}
const icon = (name) => [...document.querySelectorAll('.desktop-icon')].find(el => el.querySelector('.desktop-icon-label').textContent === name);
const dialogLabels = () => [...document.querySelectorAll('.desktop-transfer-dialog [data-choice]')].map(b => b.textContent);
const choose = (label) => [...document.querySelectorAll('.desktop-transfer-dialog [data-choice]')].find(b => b.textContent === label).click();
const settle = (ms = 0) => new Promise(r => setTimeout(r, ms));

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
    assert.equal(document.querySelector('.desktop-claim-line'), null, 'none for a password sign-in');
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
    assert.match(document.querySelector('.desktop-account-bar').textContent.replace(/\s+/g, ' '), /Signed in as Ian Shaw \(ishaw\)/);
    assert.ok(document.getElementById('desktop-switch-user'));
    assert.ok(document.getElementById('desktop-sign-out'));
    // the account bar sits above the observations
    const info = document.querySelector('.container-info');
    assert.ok(info.querySelector('.desktop-account-bar').compareDocumentPosition(info.querySelector('p')) & window.Node.DOCUMENT_POSITION_FOLLOWING);
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
    assert.equal(document.querySelector('.desktop-transfer-dialog'), null);
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
});

test('a plain PC desktop (not a sign-in PC) keeps today\'s behaviour: no dialog, no source_pc_id', async () => {
    const plain = { scenarioData: { id: 'old_pc', type: 'pc', name: 'Old PC', locked: false } };
    await openDesktop({ item: plain });
    icon('VPN notes.txt').click();
    await settle();
    assert.equal(document.querySelector('.desktop-transfer-dialog'), null);
    assert.equal(adds.length, 1);
    assert.equal(adds[0].sourcePcId, undefined);
    assert.equal(document.querySelector('.desktop-account-bar'), null);
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
    document.getElementById('desktop-sign-out').click();
    await settle();
    assert.deepEqual(apiCalls.filter(c => c[0] === 'logout'), [['logout', 'hot_desk']]);
    assert.deepEqual(events.filter(([n]) => n === 'pc_signed_out').map(([, d]) => d), [{ pcId: 'hot_desk', npcId: 'ian', reason: 'sign_out' }]);
    assert.equal(ended.length, 1);
    assert.ok(alerts.some(a => a[0] === 'Signed out'));
    assert.equal(sessions.has('hot_desk'), false);
});

test('Switch user opens the sign-in screen over the desktop and leaves the session alone', async () => {
    const mg = await openDesktop();
    document.getElementById('desktop-switch-user').click();
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
    assert.equal(document.querySelector('.desktop-icon'), null);
});

// The inventory add's source_pc_id and transfer are checked by running inventory.js in
// access-signin-requests.test.mjs (code review R1, m9).
