// Slice 9.3a step 8 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.3 and 4.5): shares in the
// container minigame. A share stub fetches its contents on open; the inventory add from a mapped
// share carries source_pc_id, from a share opened in the view source_resource_id; the remote
// desktop fetch carries the foothold; a share stub never calls handleObjectInteraction or
// /unlock; a text file read from a remote desktop reopens it when closed, and one read from an
// ordinary container still closes to the world; a folder opened below a network screen reopens
// its parent (the round 3 review's R3-M1); network_share_opened says how the share was reached.
// The real container-minigame.js, base-minigame.js, text-file-minigame.js and pc-sessions.js
// run against jsdom.
// Run with: node test/js/container-shares.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'container-shares-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export const adds = [];\n' +
    'export async function addToInventory(sprite) { adds.push(sprite); return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['minigames/container/container-item-image.js', 'minigames/framework/base-minigame.js',
    'minigames/container/container-minigame.js', 'systems/pc-sessions.js',
    'minigames/framework/minigame-manager.js']) copy(rel);
// The text-file reader with its own imports cut to what cleanup needs
put('minigames/text-file/text-file-minigame.js', readFileSync(join(js, 'minigames/text-file/text-file-minigame.js'), 'utf8'));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { ContainerMinigame, isNetworkScreenContainer, networkScreenKind, networkReturnArmed, disarmNetworkReturn,
    returnToContainerAfterNotes } = await imp('minigames/container/container-minigame.js');
const { adds } = await imp('systems/inventory.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
let TextFileMinigame = null;
try { ({ TextFileMinigame } = await imp('minigames/text-file/text-file-minigame.js')); } catch (e) { TextFileMinigame = null; }

const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const LETTER = { id: 'inbox_letter', type: 'text_file', name: 'scan_0412.pdf', takeable: true, text: 'A letter.' };
const NOTE = { id: 'it_handover', type: 'text_file', name: 'IT handover.txt', takeable: true, transfer: 'copy', text: 'A note.' };
const YEAR_END = { id: 'ledger_yearend', type: 'safe', name: 'Year-end', takeable: false, locked: true, lockType: 'pin' };
const STUB = { id: 'ledger_archive', type: 'network_share', name: 'Ledger-Archive (\\\\HB-FS01\\Ledger-Archive)', takeable: false, locked: false, hasContents: true };
const ANSWERS = {
    lena_pc: { contents: [STUB], session: { npcId: 'lena', username: 'lfox', via: 'password', remote: true, footholdId: 'jack_comms_port', host: 'HB-FIN-02' } },
    sam_pc: { contents: [{ ...STUB, id: 'scanned_inbox', name: 'Scanned-Inbox' }], session: { npcId: 'sam', username: 'sokafor', via: 'password' } },
    ledger_archive: { contents: [NOTE, YEAR_END] },
    scanned_inbox: { contents: [LETTER] },
    ledger_yearend: { contents: [] },
    cabinet: { contents: [LETTER] }
};

let fetches, events, interactions, unlocks, landings, started, sessions;

function setup() {
    fetches = []; events = []; interactions = []; unlocks = []; landings = []; started = []; adds.length = 0;
    document.body.innerHTML = '';
    disarmNetworkReturn();
    window.pendingContainerReturn = null;
    window.pendingTextFileReturn = null;
    window.breakEscapeConfig = { gameId: 9 };
    window.inventory = { items: [] };
    const listeners = new Map();
    window.eventDispatcher = {
        emit: (n, d) => { events.push([n, d]); [...(listeners.get(n) || [])].forEach(fn => fn(d)); },
        on: (n, fn) => { if (!listeners.has(n)) listeners.set(n, new Set()); listeners.get(n).add(fn); },
        off: (n, fn) => listeners.get(n)?.delete(fn)
    };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.ApiClient = {
        unlock: async (...a) => { unlocks.push(a); return { success: true }; },
        login: async (pcId, f) => ({ success: true, npcId: pcId === 'sam_pc' ? 'sam' : 'lena', username: 'u', displayName: 'U', via: 'password',
            ...(f.foothold ? { remote: true, footholdId: f.foothold, host: 'HB-FIN-02' } : {}) }),
        logout: async () => ({ success: true })
    };
    window.fetch = globalThis.fetch = async (url) => {
        fetches.push(url);
        const id = decodeURIComponent(url.split('/container/')[1].split('?')[0]);
        const body = ANSWERS[id];
        return { ok: !!body, status: body ? 200 : 404, statusText: body ? 'OK' : 'Not Found', json: async () => JSON.parse(JSON.stringify(body || { error: 'Container not found' })) };
    };
    window.handleObjectInteraction = (sprite) => interactions.push(sprite);
    window.networkLinks = { landed: (...a) => { landings.push(a); return { landing: 'view' }; } };
    window.openRemoteDesktop = (pcId, footholdId) => window.startContainerMinigame(
        { scenarioData: { id: pcId, name: "Lena's PC", host: 'HB-FIN-02', type: 'pc', lockType: 'login', locked: true, remote: { footholdId } } }, null, false, true);
    sessions = new PcSessions();
    window.pcSessions = sessions;
    window.MinigameFramework = {
        currentMinigame: null,
        mainGameScene: {},
        startMinigame(type, container, params) {
            if (this.currentMinigame) this.endMinigame(false, null);
            started.push([type, params]);
            const el = document.createElement('div');
            document.body.appendChild(el);
            const Cls = type === 'container' ? ContainerMinigame : (type === 'text-file' && TextFileMinigame ? TextFileMinigame : null);
            const m = Cls ? new Cls(el, params) : { params, cleanup() {}, container: el };
            m._sceneType = type;
            this.currentMinigame = m;
            if (Cls) { m.init(); m.start(); }
            return m;
        },
        endMinigame(success, result) {
            const m = this.currentMinigame;
            if (!m || m._ending) return;
            m._ending = true;
            m.cleanup();
            m.params?.onComplete?.(success, result);
            if (this.currentMinigame === m) this.currentMinigame = null;
            m.container?.remove?.();
        }
    };
    window.startContainerMinigame = (item, contents, takeable, desktop) =>
        window.MinigameFramework.startMinigame('container', null, { title: item.scenarioData.name, containerItem: item, contents, isTakeable: takeable, desktopMode: desktop, cancelText: 'Close', showCancel: true });
}

const current = () => window.MinigameFramework.currentMinigame;
const named = (n) => events.filter(([e]) => e === n).map(([, d]) => d);
const icon = (name) => [...document.querySelectorAll('.desktop-icon')].find(el => el.textContent.includes(name));
const remoteDesktop = () => ({ scenarioData: { id: 'lena_pc', name: "Lena's PC", host: 'HB-FIN-02', type: 'pc', lockType: 'login', locked: true, remote: { footholdId: 'jack_comms_port' } } });
const viewShare = () => ({ scenarioData: { id: 'scanned_inbox', type: 'network_share', name: 'Scanned-Inbox', locked: false, networkShare: { footholdId: 'jack_comms_port' } }, sourceResourceId: 'scanned_inbox' });

async function openRemote() {
    await sessions.signIn('lena_pc', 'lfox', 'x', { foothold: 'jack_comms_port' });
    window.startContainerMinigame(remoteDesktop(), null, false, true);
    await settle();
}

test('the remote desktop fetch carries the foothold; a keyboard one does not', async () => {
    setup();
    await openRemote();
    assert.equal(fetches[0], '/break_escape/games/9/container/lena_pc?foothold=jack_comms_port');
    await sessions.signIn('sam_pc', 'sokafor', 'x');
    window.startContainerMinigame({ scenarioData: { id: 'sam_pc', name: "Sam's PC", type: 'pc', lockType: 'login', locked: true } }, null, false, true);
    await settle();
    assert.equal(fetches.at(-1), '/break_escape/games/9/container/sam_pc');
});

test('a share stub opens as a folder fetched from /container, never through handleObjectInteraction or /unlock', async () => {
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    assert.equal(fetches.at(-1), '/break_escape/games/9/container/ledger_archive');
    assert.equal(interactions.length, 0);
    assert.equal(unlocks.length, 0);
    assert.equal(current().containerItem.scenarioData.id, 'ledger_archive');
    assert.deepEqual(named('network_share_opened'), [{ resourceId: 'ledger_archive', via: 'session', pcId: 'lena_pc' }]);
    assert.deepEqual(landings, [['desktop', 'share', { pcId: 'lena_pc', host: 'HB-FIN-02' }]], 'the desktop handed over');
});

test('a mapped share closed by its Close reopens the desktop it came from', async () => {
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    document.querySelector('#minigame-cancel').click();
    await settle();
    assert.equal(current().loginPcId, 'lena_pc');
    assert.equal(fetches.at(-1), '/break_escape/games/9/container/lena_pc?foothold=jack_comms_port');
    assert.equal(landings.filter(l => l[1] === 'close').length, 0, 'no landing: the share went back to its desktop');
});

test('the inventory add from a mapped share carries source_pc_id; from a share opened in the view, source_resource_id', async () => {
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    await current().takeItem(NOTE, icon('IT handover'), 'copy');
    assert.equal(adds.at(-1).sourcePcId, 'lena_pc');
    assert.equal(adds.at(-1).sourceResourceId, undefined);
    window.startContainerMinigame(viewShare(), null, false, true);
    await settle();
    assert.deepEqual(named('network_share_opened').at(-1), { resourceId: 'scanned_inbox', via: 'foothold', pcId: null, footholdId: 'jack_comms_port' });
    await current().takeItem(LETTER, icon('scan_0412'), 'copy');
    assert.equal(adds.at(-1).sourceResourceId, 'scanned_inbox');
    assert.equal(adds.at(-1).sourcePcId, undefined);
    assert.equal(adds.at(-1).transfer, 'copy');
    assert.deepEqual(current().offersTransfer(LETTER), true, 'a share from the view offers Open, Copy, Move');
});

test('a share opened from the view reports share/close to the trip when closed', async () => {
    setup();
    window.startContainerMinigame(viewShare(), null, false, true);
    await settle();
    document.querySelector('#minigame-cancel').click();
    assert.deepEqual(landings, [['share', 'close', {}]]);
});

test('a text file read from a remote desktop folder reopens that folder when the reader closes', async (t) => {
    if (!TextFileMinigame) { t.skip('text-file minigame did not load here'); return; }
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    current().openFileInPlace(NOTE);
    assert.deepEqual(landings.at(-1), ['desktop', 'item', { pcId: 'lena_pc', host: 'HB-FIN-02' }]);
    assert.ok(window.pendingContainerReturn, 'the share is recorded for the reader');
    window.MinigameFramework.startMinigame('text-file', null, { fileName: 'IT handover.txt', fileContent: 'A note.' });
    window.MinigameFramework.endMinigame(false, null);
    await new Promise(r => setTimeout(r, 80));
    await settle();
    assert.equal(current()?.containerItem?.scenarioData?.id, 'ledger_archive', 'back in the share');
    assert.equal(window.pendingContainerReturn, null);
});

test('a text file read from an ordinary container still closes to the world', async (t) => {
    if (!TextFileMinigame) { t.skip('text-file minigame did not load here'); return; }
    setup();
    window.startContainerMinigame({ scenarioData: { id: 'cabinet', name: 'Cabinet', type: 'safe', locked: false } }, null, false, false);
    await settle();
    current().handleInteractiveItem({ ...LETTER, takeable: false }, null);
    assert.equal(isNetworkScreenContainer(window.pendingContainerReturn.containerItem), false);
    window.MinigameFramework.startMinigame('text-file', null, { fileName: 'scan_0412.pdf', fileContent: 'A letter.' });
    window.MinigameFramework.endMinigame(false, null);
    await new Promise(r => setTimeout(r, 80));
    assert.equal(current(), null);
    assert.equal(window.pendingContainerReturn, null);
    assert.equal(landings.length, 0, 'an ordinary container reports nothing');
});

test('a locked folder opened below a network screen carries its parent, and reopens it on Close (R3-M1)', async () => {
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    const share = current().containerItem;
    current().handleInteractiveItem(YEAR_END, null);
    const stand = interactions.at(-1);
    assert.equal(stand.parentLockable, share);
    assert.equal(stand.sourcePcId, 'lena_pc');
    assert.equal(networkScreenKind(stand), 'desktop');
    // The PIN screen opened the folder with the same stand-in
    window.startContainerMinigame({ ...stand, scenarioData: { ...YEAR_END, locked: false } }, null, false, true);
    await settle();
    assert.equal(window.pendingContainerReturn, null, 'a stale return is cleared when a container opens');
    document.querySelector('#minigame-cancel').click();
    await settle();
    assert.equal(current().containerItem, share, 'back in the share');
});

test('a folder below a share from the view is a share screen; an ordinary nested folder is no network screen', () => {
    setup();
    const share = viewShare();
    assert.equal(networkScreenKind({ scenarioData: { id: 'f' }, sourceResourceId: 'scanned_inbox', parentLockable: share }), 'share');
    assert.equal(networkScreenKind({ scenarioData: { id: 'f' }, sourcePcId: 'sam_pc' }), null);
    assert.equal(isNetworkScreenContainer({ scenarioData: { id: 'f' } }), false);
});

// A stand-in lock screen (the PIN pad): it ends as base-minigame's complete() does, emitting
// minigame_completed or minigame_failed before the framework ends it.
function openPinPad() {
    return window.MinigameFramework.startMinigame('pin', null, { title: 'PIN' });
}
function endPinPad(success) {
    window.eventDispatcher.emit(success ? 'minigame_completed' : 'minigame_failed', { minigameName: 'PinMinigame', success });
    window.MinigameFramework.endMinigame(success, null);
}

test('a cancelled PIN pad on a folder in a mapped share returns to the share, with no stale return (review R1 M1)', async () => {
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    const share = current().containerItem;
    window.handleObjectInteraction = (sprite) => { interactions.push(sprite); openPinPad(); };
    current().handleInteractiveItem(YEAR_END, null);
    assert.equal(current()._sceneType, 'pin', 'the PIN pad is open');
    assert.equal(networkReturnArmed(), true);
    await settle();
    assert.equal(current()._sceneType, 'pin', 'the pad is not covered while open');
    endPinPad(false);
    await settle();
    assert.equal(current()?.containerItem, share, 'back in the share');
    assert.equal(window.pendingContainerReturn, null, 'the return is spent');
    assert.equal(networkReturnArmed(), false);
});

test('a cancelled PIN pad on a folder in a share from the view returns to that share; a world text file afterwards closes to the world', async (t) => {
    setup();
    window.startContainerMinigame(viewShare(), null, false, true);
    await settle();
    window.handleObjectInteraction = (sprite) => { interactions.push(sprite); openPinPad(); };
    current().handleInteractiveItem({ ...YEAR_END }, null);
    assert.deepEqual(landings.at(-1), ['share', 'item', {}], 'the share handed over');
    endPinPad(false);
    await settle();
    assert.equal(current()?.containerItem?.scenarioData?.id, 'scanned_inbox', 'back in the share');
    assert.equal(current().desktopMode, true, 'in its desktop layout');
    assert.equal(window.pendingContainerReturn, null);
    if (!TextFileMinigame) { t.skip('text-file minigame did not load here'); return; }
    window.MinigameFramework.endMinigame(false, null);
    await settle();
    window.MinigameFramework.startMinigame('text-file', null, { fileName: 'memo.txt', fileContent: 'A memo in a room.' });
    window.MinigameFramework.endMinigame(false, null);
    await new Promise(r => setTimeout(r, 80));
    assert.equal(current(), null, 'the world text file closes to the world');
});

test('a key-locked folder without the key (an alert, no minigame) returns to the remote desktop at once', async () => {
    setup();
    await openRemote();
    const desktop = current().containerItem;
    window.handleObjectInteraction = (sprite) => { interactions.push(sprite); /* the "Requires key" alert only */ };
    current().handleInteractiveItem({ id: 'hr_folder', type: 'safe', name: 'HR', locked: true, lockType: 'key' }, null);
    assert.equal(current(), null);
    await settle();
    assert.equal(current()?.containerItem, desktop, 'back on the desktop');
    assert.equal(window.pendingContainerReturn, null);
    assert.equal(networkReturnArmed(), false);
});

test('a PIN pad that unlocks its folder hands over to the folder, not back to the share', async () => {
    setup();
    await openRemote();
    icon('Ledger-Archive').click();
    await settle();
    const share = current().containerItem;
    window.handleObjectInteraction = (sprite) => { interactions.push(sprite); openPinPad(); };
    current().handleInteractiveItem(YEAR_END, null);
    const stand = interactions.at(-1);
    endPinPad(true);
    await settle();
    assert.equal(current(), null, 'nothing is reopened while the unlock opens its folder');
    assert.equal(networkReturnArmed(), true);
    window.startContainerMinigame({ ...stand, scenarioData: { ...YEAR_END, locked: false } }, null, false, true);
    await settle();
    assert.equal(networkReturnArmed(), false, 'the folder opening spends the return');
    assert.equal(current().containerItem.scenarioData.id, 'ledger_yearend');
    document.querySelector('#minigame-cancel').click();
    await settle();
    assert.equal(current().containerItem, share, 'and its Close is back in the share');
});

test('a hand-over from an ordinary container arms no return', async () => {
    setup();
    window.startContainerMinigame({ scenarioData: { id: 'cabinet', name: 'Cabinet', type: 'safe', locked: false } }, null, false, false);
    await settle();
    window.handleObjectInteraction = (sprite) => { interactions.push(sprite); openPinPad(); };
    current().handleInteractiveItem({ ...YEAR_END }, null);
    assert.equal(networkReturnArmed(), false);
    endPinPad(false);
    await settle();
    assert.equal(current(), null, 'the world, as before');
});

test('a note read from a share from the view is added with its share; the share comes back in its desktop layout (review R1 minor 4)', async () => {
    setup();
    window.startContainerMinigame(viewShare(), null, false, true);
    await settle();
    const memo = { id: 'memo', type: 'notes', name: 'Memo', readable: true, text: 'A memo.' };
    current().handleInteractiveItem(memo, null);
    assert.equal(window.pendingContainerReturn.sourceExtras.sourceResourceId, 'scanned_inbox');
    window.addToInventory = (sprite) => adds.push(sprite);
    window.expectPanelWithin = () => {};
    returnToContainerAfterNotes();
    await settle();
    assert.equal(adds.at(-1).sourceResourceId, 'scanned_inbox');
    assert.equal(current()?.containerItem?.scenarioData?.id, 'scanned_inbox');
    assert.equal(current().desktopMode, true);
});

// The jsdom mock above ends a minigame as minigame-manager.js does today; this one drives a
// trip through the real manager (and base-minigame's complete()), so the two cannot drift
// apart unnoticed (review R1 minor 5).
test('through the real minigame manager: desktop, share, a cancelled PIN pad, back to the share, its Close back to the desktop', async () => {
    setup();
    const { MinigameFramework: MF } = await imp('minigames/framework/minigame-manager.js');
    const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
    class PinPad extends MinigameScene {}
    MF.registeredScenes = {};
    MF.registerScene = MF.registerScene || function (t, C) { this.registeredScenes[t] = C; };
    MF.registeredScenes.container = ContainerMinigame;
    MF.registeredScenes.pin = PinPad;
    MF.currentMinigame = null;
    MF.mainGameScene = {};
    window.resumeKeyboardInput = () => {};
    window.pauseKeyboardInput = () => {};
    window.MinigameFramework = MF;
    try {
        await openRemote();
        const desktop = current().containerItem;
        icon('Ledger-Archive').click();
        await settle();
        const share = current().containerItem;
        assert.equal(share.scenarioData.id, 'ledger_archive');
        window.handleObjectInteraction = (sprite) => { interactions.push(sprite); MF.startMinigame('pin', null, { title: 'PIN' }); };
        current().handleInteractiveItem(YEAR_END, null);
        assert.ok(current() instanceof PinPad);
        current().complete(false); // the pad's Close
        await settle();
        assert.equal(current()?.containerItem, share, 'back in the share');
        assert.equal(window.pendingContainerReturn, null);
        current().complete(false); // the share's Close
        await settle();
        assert.equal(current()?.containerItem?.scenarioData?.id, desktop.scenarioData.id, 'back on the desktop');
        assert.equal(named('minigame_failed').length, 4, 'desktop, share, pad and share each ended once');
    } finally {
        if (MF.currentMinigame) MF.endMinigame(false, null);
    }
});

// Review R3 nit 2: a desktop left open when its PC is switched off closes, and so does a share
// opened from it; the session is kept. At the keyboard: "This PC is off."; remotely: not_responding.
const samDesktop = () => ({ scenarioData: { id: 'sam_pc', name: "Sam's PC", type: 'pc', lockType: 'login', locked: true,
    affordance: { offWhen: 'sam_pc_off' } } });

function switchSamOff() {
    window.gameState.globalVariables.sam_pc_off = true;
    window.eventDispatcher.emit('global_variable_changed:sam_pc_off', { name: 'sam_pc_off', value: true, oldValue: false });
}

test('a keyboard desktop open when its PC goes off closes with "This PC is off." and keeps the session', async () => {
    setup();
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    window.gameState = { globalVariables: { sam_pc_off: false } };
    await sessions.signIn('sam_pc', 'sokafor', 'x');
    window.startContainerMinigame(samDesktop(), null, false, true);
    await settle();
    assert.equal(current()?.loginPcId, 'sam_pc');
    window.eventDispatcher.emit('global_variable_changed:sam_pc_off', { name: 'sam_pc_off', value: false });
    assert.equal(current()?.loginPcId, 'sam_pc', 'a change that leaves it on keeps it open');
    switchSamOff();
    await settle();
    assert.equal(current(), null, 'the desktop closed');
    assert.deepEqual(alerts.map(a => a[0]), ['This PC is off.']);
    assert.ok(sessions.get('sam_pc'), 'the session is kept');
});

test('a share opened from that desktop closes too when the PC goes off', async () => {
    setup();
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    window.gameState = { globalVariables: { sam_pc_off: false } };
    await sessions.signIn('sam_pc', 'sokafor', 'x');
    window.startContainerMinigame(samDesktop(), null, false, true);
    await settle();
    icon('Scanned-Inbox').click();
    await settle();
    assert.equal(current().containerItem.scenarioData.id, 'scanned_inbox');
    switchSamOff();
    await settle();
    assert.equal(current(), null, 'the share closed rather than stay open on an off PC');
    assert.deepEqual(alerts.map(a => a[0]), ['This PC is off.']);
});

test('a share clicked on a desktop whose PC is already off says "This PC is off.", not a load error', async () => {
    setup();
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    window.gameState = { globalVariables: { sam_pc_off: false } };
    await sessions.signIn('sam_pc', 'sokafor', 'x');
    window.startContainerMinigame(samDesktop(), null, false, true);
    await settle();
    // The global changed with no event (a server-side or silent write), and the share is refused
    window.gameState.globalVariables.sam_pc_off = true;
    const saved = ANSWERS.scanned_inbox;
    delete ANSWERS.scanned_inbox;
    try {
        icon('Scanned-Inbox').click();
        await settle();
    } finally { ANSWERS.scanned_inbox = saved; }
    assert.equal(current(), null);
    assert.deepEqual(alerts.map(a => a[0]), ['This PC is off.'], 'no "Could not load container contents"');
});
