// Pentest slice B1 (docs/achitechture/PHYSICAL_PENTEST_DEVICES_PLAN.md 5.4 and section 7):
// the patch-panel minigame. The layout rule for each row of the 5.4 table and 6 rows of 4; the
// port state mapping; the plant through gameConfirm with PLANT_LABEL and LEAVE_LABEL; a planted
// port opening the view atJack; Esc on a confirm over the open panel closing only the confirm,
// then a second Esc closing the panel; _applyJackLookById on a port with no sprite; the footer
// messages. The real patch-panel files, base-minigame.js, network-links.js, notifications.js
// (gameConfirm) and modal-stack.js run against jsdom.
// Run with: node --test test/js/patch-panel.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'patch-panel-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/conditional-text.js', 'utils/overlay-open.js',
    'utils/remote-host-text.js', 'systems/global-writer.js', 'systems/network-links.js', 'systems/notifications.js',
    'ui/modal-stack.js', 'minigames/framework/base-minigame.js',
    'minigames/patch-panel/patch-panel-model.js', 'minigames/patch-panel/patch-panel-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const model = await imp('minigames/patch-panel/patch-panel-model.js');
const { PatchPanelMinigame, UNPATCHED_MESSAGE, NO_DEVICE_FALLBACK, startPatchPanelMinigame, LEGEND } =
    await imp('minigames/patch-panel/patch-panel-minigame.js');
const { NetworkLinks, PLANT_LABEL, LEAVE_LABEL } = await imp('systems/network-links.js');
const { gameConfirm } = await imp('systems/notifications.js');
const { chooseLayout, portState, portLabel, vlanClass, entriesByPort, rowsOf, findJack, rangeLabel, rowHeightPx } = model;

const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

// ---- the layout rule ---------------------------------------------------------------------

test('chooseLayout gives each row of the 5.4 table its layout, scale, width and height', () => {
    const rows = [
        [1280, 720, 2, 12, 4, 688, 168, false],
        [800, 600, 2, 12, 4, 688, 168, false],
        [915, 412, 2, 12, 4, 688, 168, false],
        [640, 360, 2, 12, 3, 516, 128, false],
        [360, 740, 4, 6, 3, 264, 320, false]
    ];
    for (const [vw, vh, nRows, perRow, scale, width, height, scroll] of rows) {
        const l = chooseLayout(vw, vh);
        assert.deepEqual([l.rows, l.perRow, l.scale, l.width, l.height, l.scroll], [nRows, perRow, scale, width, height, scroll], `${vw}x${vh}`);
    }
    assert.equal(chooseLayout(1280, 720).W, 1200);
    assert.equal(chooseLayout(360, 740).W, 280);
});

test('chooseLayout falls back to 4 rows of 6 at scale 4, then 6 rows of 4, then a scrolling area', () => {
    // W = 400 fits 4 rows of 6 at scale 4 (352 wide) and 4 x 100 = 400 tall (H 426)
    let l = chooseLayout(480, 640);
    assert.deepEqual([l.rows, l.perRow, l.scale, l.scroll], [4, 6, 4, false]);
    // W = 260 is under the 264 that 4 rows of 6 need at scale 3: 6 rows of 4 (180 wide, 384 tall)
    l = chooseLayout(340, 620);
    assert.deepEqual([l.rows, l.perRow, l.scale, l.width, l.height, l.scroll], [6, 4, 3, 180, 384, false]);
    // Too short for any layout and W under 344: the same 6 x 4 in a scroll area
    l = chooseLayout(340, 400);
    assert.deepEqual([l.rows, l.perRow, l.scale, l.scroll], [6, 4, 3, true]);
});

test('when nothing fits by height, the widest shape that fits W scrolls (6 x 4 only below W 344)', () => {
    // 640x300: W 560 takes 2 rows of 12 at scale 3 (516 wide) in a scroll area
    let l = chooseLayout(640, 300);
    assert.deepEqual([l.rows, l.perRow, l.scale, l.width, l.scroll], [2, 12, 3, 516, true]);
    // 1000x200: W 920 takes 2 rows of 12 at scale 4
    l = chooseLayout(1000, 200);
    assert.deepEqual([l.rows, l.perRow, l.scale, l.scroll], [2, 12, 4, true]);
    // W 400, too short: 4 rows of 6 at scale 4 (352)
    l = chooseLayout(480, 250);
    assert.deepEqual([l.rows, l.perRow, l.scale, l.scroll], [4, 6, 4, true]);
    // W 344 is the edge: 4 rows of 6 at scale 3; W 343 gives 6 x 4
    l = chooseLayout(424, 200);
    assert.deepEqual([l.W, l.rows, l.perRow, l.scale, l.scroll], [344, 4, 6, 3, true]);
    l = chooseLayout(423, 200);
    assert.deepEqual([l.W, l.rows, l.perRow, l.scroll], [343, 6, 4, true]);
});

test('the 4 rows of 6 add a 16 px range label to each row; other shapes add none', () => {
    assert.equal(rowHeightPx(3, 12), 64);
    assert.equal(rowHeightPx(3, 6), 80);
    assert.equal(rowHeightPx(4, 6), 100);
    assert.equal(rowHeightPx(3, 4), 64);
    assert.equal(rangeLabel([7, 8, 9, 10, 11, 12]), '7-12');
    // 360x740 (H 526) still fits 4 rows of 6 with no More below
    const l = chooseLayout(360, 740);
    assert.ok(l.height <= l.H && !l.scroll);
});

test('overhead is 204 from W 480 and 214 below it', () => {
    assert.equal(chooseLayout(560, 700).H, 700 - 204);
    assert.equal(chooseLayout(559, 700).H, 700 - 214);
});

test('rowsOf numbers the ports 1-12 and 13-24, or 1-6 ... 19-24', () => {
    const two = rowsOf({ rows: 2, perRow: 12 });
    assert.equal(two[1][0], 13);
    assert.equal(two[1][11], 24);
    const four = rowsOf({ rows: 4, perRow: 6 });
    assert.deepEqual(four.map(r => [r[0], r[5]]), [[1, 6], [7, 12], [13, 18], [19, 24]]);
    assert.equal(rowsOf({ rows: 6, perRow: 4 }).flat().length, 24);
});

// ---- port state ------------------------------------------------------------------------

test('portState: empty, unpatched, patched, managed and held', () => {
    const jack = { id: 'j', networkJack: true };
    assert.equal(portState(null, null, null), 'empty');
    assert.equal(portState({ port: 3 }, null, null), 'unpatched');
    assert.equal(portState({ port: 3, jack: 'gone' }, null, null), 'unpatched');
    assert.equal(portState({ port: 3, jack: 'j' }, jack, null), 'patched');
    assert.equal(portState({ port: 3, jack: 'j' }, { ...jack, portSecurity: { allow: [] } }, null), 'managed');
    assert.equal(portState({ port: 3, jack: 'j' }, jack, { id: 'f' }), 'held');
});

test('labels: at most three characters, else the two-digit number; the VLAN class is the first letter', () => {
    assert.equal(portLabel({ label: 'D07' }, 7), 'D07');
    assert.equal(portLabel({ label: 'VLAN7' }, 7), 'VLA');
    assert.equal(portLabel(null, 5), '05');
    assert.equal(portLabel({ label: '' }, 24), '24');
    assert.equal(vlanClass('M12'), 'm');
    assert.equal(vlanClass('x01'), '');
    assert.equal(vlanClass('05'), '');
});

test('entriesByPort ignores bad port numbers and duplicates', () => {
    const e = entriesByPort([{ port: 1, label: 'D01' }, { port: 1, label: 'dup' }, { port: 25 }, { port: 0 }, {}]);
    assert.equal(e[1].label, 'D01');
    assert.equal(e.length, 25);
    assert.equal(e.filter(Boolean).length, 1);
});

// ---- the scene --------------------------------------------------------------------------

const box = { type: 'pc', id: 'kit_dropbox', name: 'Network drop box', rogueDevice: true };
const officeNet = { id: 'lw_voice', name: 'Voice network' };
const foothold = { id: 'jack_voice_port', via: 'jack', name: 'Drop box: voice', itemId: 'netlink_jack_voice_port',
    sourceId: 'voice_port', network: officeNet };
const PANEL = { id: 'p3_patch_panel', name: 'Patch panel', interactable: true, panelPorts: [
    { port: 1, label: 'D01', desk: 'Reception', jack: 'network_port' },
    { port: 2, label: 'V02', desk: 'Open desk 1', jack: 'voice_port' },
    { port: 3, label: 'G03', desk: 'Guest lounge', jack: 'guest_port' },
    { port: 4, label: 'M04', desk: 'Finance', jack: 'secured_port' },
    { port: 5, label: 'D05', desk: 'Spare' }
] };
const JACKS = {
    network_port: { id: 'network_port', name: 'Wall port', networkJack: true, jackConfirm: 'Plug the box into the data port?', requiresItemHint: 'Bring the drop box.' },
    voice_port: { id: 'voice_port', name: 'Voice port', networkJack: true, panelOf: 'p3_patch_panel', jackConfirm: 'Plug it into the voice port?' },
    guest_port: { id: 'guest_port', name: 'Guest port', networkJack: true, panelOf: 'p3_patch_panel' },
    secured_port: { id: 'secured_port', name: 'Managed port', networkJack: true, portSecurity: { allow: ['x'] }, portSecurityMessage: 'The switch only takes registered machines.' }
};
// What the live game holds (window.gameScenario is the bootstrap copy: rooms with no objects).
// panelOf jacks sit on rooms[id].panelJacks (core/rooms.js); world jacks keep their sprites.
const BOOTSTRAP = { rooms: { room_comms: { type: 'room_comms', connections: {}, door_sign: 'Comms', hasPresentNpc: false } } };
const liveRooms = () => ({
    room_comms: {
        objects: {
            p3_patch_panel: { scenarioData: PANEL },
            network_port: { scenarioData: JACKS.network_port },
            secured_port: { scenarioData: JACKS.secured_port }
        },
        panelJacks: { voice_port: JACKS.voice_port, guest_port: JACKS.guest_port }
    }
});

let toasts, started, events, plants, plantError, confirmTexts, links, opened, items, keepConfirmOpen;

function framework() {
    return {
        currentMinigame: null,
        mainGameScene: {},
        startMinigame(type, container, params) {
            if (this.currentMinigame) this.endMinigame(false, null);
            started.push([type, params]);
            let m;
            if (type === 'patch-panel') {
                const el = document.createElement('div');
                document.body.appendChild(el);
                m = new PatchPanelMinigame(el, params);
                m._sceneType = type;
                this.currentMinigame = m;
                m.init();
                m.start();
            } else {
                m = { _sceneType: type, params, cleanup() {} };
                this.currentMinigame = m;
            }
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
}

function setup({ hold = true, vw = 1280, vh = 720 } = {}) {
    started = []; events = []; plants = []; confirmTexts = []; opened = [];
    plantError = null;
    document.body.innerHTML = '';
    dom.window.innerWidth = vw;
    dom.window.innerHeight = vh;
    items = hold ? [{ scenarioData: box }] : [];
    window.inventory = { items };
    window.gameScenario = BOOTSTRAP;
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    toasts = [];
    window.gameAlert = (m) => { toasts.push(m); };
    window.ApiClient = {
        async networkPlant(jackId, deviceId) {
            plants.push([jackId, deviceId]);
            if (plantError) throw plantError;
            return { success: true, foothold, added: [], removed: [deviceId], first: true };
        }
    };
    window.rooms = liveRooms();
    window.gameConfirm = (...args) => { confirmTexts.push(args); return gameConfirm(...args); };
    window.MinigameFramework = framework();
    links = new NetworkLinks();
    window.networkLinks = links;
    links.load([], ['voice_port']);
    const realOpen = links.open.bind(links);
    links.open = (id, opts) => { opened.push([id, opts]); return realOpen(id, opts); };
    window.startNetworkViewMinigame = (footholdId) => window.MinigameFramework.startMinigame('network-view', null, { footholdId });
    return startPatchPanelMinigame(PANEL);
}

const port = (n) => document.querySelector(`[data-port="${n}"]`);
const footer = () => document.querySelector('.patch-panel-footer').textContent;
const confirmButton = (cls) => document.querySelector(`.game-confirm-${cls}`);
const esc = () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

test('the panel draws 24 ports with text labels, a legend row and the shared device frame', () => {
    const m = setup();
    assert.equal(document.querySelectorAll('.patch-panel-port').length, 24);
    assert.ok(document.querySelector('.device-frame .device-frame-title'));
    assert.equal(port(1).querySelector('.patch-panel-label').textContent, 'D01');
    assert.equal(port(9).querySelector('.patch-panel-label').textContent, '09', 'a blank port shows its two-digit number');
    assert.equal(port(1).dataset.state, 'patched');
    assert.equal(port(4).dataset.state, 'managed');
    assert.equal(port(5).dataset.state, 'unpatched');
    assert.equal(port(9).dataset.state, 'empty');
    assert.equal(document.querySelectorAll('.patch-panel-key').length, LEGEND.length);
    assert.equal(document.querySelector('.minigame-controls'), null, 'no Cancel');
    assert.equal(m.constructor.closeInsideFrame, true);
    assert.equal(m.closeAnchor(), document.querySelector('.device-frame'));
});

test('scenario text goes in as text, never markup', () => {
    const hostile = { ...PANEL, name: '<img src=x onerror=1>', panelPorts: [{ port: 1, label: '<b>', desk: '<i>x</i>' }] };
    setup();
    window.MinigameFramework.startMinigame('patch-panel', null, { panel: hostile });
    assert.equal(document.querySelector('.patch-panel img'), null);
    assert.equal(document.querySelector('.patch-panel i'), null);
    assert.match(document.querySelector('.patch-panel-title').textContent, /<img/);
    assert.equal(port(1).querySelector('.patch-panel-label').textContent, '<b>');
});

test('re-layout on resize swaps 2 rows of 12 for 4 rows of 6 and back', () => {
    const m = setup({ vw: 1280, vh: 720 });
    assert.equal(document.querySelectorAll('.patch-panel-strip').length, 2);
    dom.window.innerWidth = 360; dom.window.innerHeight = 740;
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    assert.equal(document.querySelectorAll('.patch-panel-strip').length, 4);
    assert.equal(m.layout.scale, 3);
    assert.ok(document.querySelector('.patch-panel-s3'));
    dom.window.innerWidth = 1280; dom.window.innerHeight = 720;
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    assert.equal(document.querySelectorAll('.patch-panel-strip').length, 2);
});

test('the More below cue follows overflow of the scroll area', () => {
    const m = setup({ vw: 340, vh: 400 });
    assert.equal(m.layout.scroll, true);
    const s = m.scroll;
    Object.defineProperty(s, 'scrollHeight', { configurable: true, value: 500 });
    Object.defineProperty(s, 'clientHeight', { configurable: true, value: 200 });
    assert.equal(m.updateScrollCue(), true);
    assert.equal(document.querySelector('.patch-panel-more').hidden, false);
    assert.match(document.querySelector('.patch-panel-more').textContent, /More below/);
    s.scrollTop = 300;
    assert.equal(m.updateScrollCue(), false);
    assert.equal(document.querySelector('.patch-panel-more').hidden, true);
});

test('an unpatched or empty port says nothing is at the other end', async () => {
    const m = setup();
    assert.equal((await m.clickPort(5)).action, 'unpatched');
    assert.equal(footer(), UNPATCHED_MESSAGE);
    assert.equal(UNPATCHED_MESSAGE, 'Nothing at the other end.');
    assert.equal((await m.clickPort(20)).action, 'unpatched');
    assert.equal(footer(), UNPATCHED_MESSAGE);
});

test('with no box held, the footer shows the jack hint, a refusal event goes out, and no confirm opens', async () => {
    const m = setup({ hold: false });
    const r = await m.clickPort(1);
    assert.deepEqual([r.action, r.reason], ['refused', 'no_device']);
    assert.equal(footer(), 'Bring the drop box.');
    await m.clickPort(2);
    assert.equal(footer(), NO_DEVICE_FALLBACK);
    const refusals = events.filter(([n]) => n === 'network_device_refused');
    assert.deepEqual(refusals[0][1], { jackId: 'network_port', reason: 'no_device' });
    assert.ok(events.some(([n]) => n === 'network_device_refused:network_port'));
    assert.equal(confirmTexts.length, 0);
    assert.equal(plants.length, 0);
});

test('the plant goes through gameConfirm with PLANT_LABEL and LEAVE_LABEL, then the view replaces the panel', async () => {
    const m = setup();
    const pending = m.clickPort(2);
    await settle();
    assert.equal(confirmTexts.length, 1);
    assert.equal(confirmTexts[0][0], 'Plug it into the voice port?');
    assert.equal(confirmTexts[0][1], PLANT_LABEL);
    assert.equal(confirmTexts[0][2], LEAVE_LABEL);
    assert.equal(confirmButton('ok').textContent, PLANT_LABEL);
    assert.equal(confirmButton('cancel').textContent, LEAVE_LABEL);
    confirmButton('ok').click();
    const r = await pending;
    assert.equal(r.action, 'planted');
    assert.deepEqual(plants, [['voice_port', 'kit_dropbox']]);
    assert.equal(window.MinigameFramework.currentMinigame._sceneType, 'network-view', 'the view replaced the panel');
    assert.deepEqual(opened[0][1].atJack, 'voice_port');
});

test('Leave it plants nothing and the panel stays', async () => {
    const m = setup();
    const pending = m.clickPort(2);
    await settle();
    confirmButton('cancel').click();
    assert.equal((await pending).action, 'cancelled');
    assert.equal(plants.length, 0);
    assert.equal(window.MinigameFramework.currentMinigame, m);
    assert.match(footer(), /left alone/);
});

test('a planted port opens the view atJack, with no confirm and no plant request', async () => {
    const m = setup();
    links.load([foothold], ['voice_port']);
    assert.equal(port(2).dataset.state, 'patched', 'drawn before the load');
    m.relayout();
    assert.equal(port(2).dataset.state, 'held');
    const r = await m.clickPort(2);
    assert.equal(r.action, 'opened');
    assert.equal(confirmTexts.length, 0);
    assert.equal(plants.length, 0);
    assert.equal(opened.length, 1);
    assert.equal(opened[0][0], 'jack_voice_port');
    assert.equal(opened[0][1].atJack, 'voice_port');
    assert.equal(window.MinigameFramework.currentMinigame._sceneType, 'network-view');
});

test('a held box opens its view even when the tray holds no device', async () => {
    const m = setup({ hold: false });
    links.load([foothold], ['voice_port']);
    const r = await m.clickPort(2);
    assert.equal(r.action, 'opened');
});

test('port security: the refusal shows the jack message in the footer and the panel stays', async () => {
    const m = setup();
    plantError = Object.assign(new Error('x'), { status: 422, body: { reason: 'port_security', error: 'server words' } });
    const pending = m.clickPort(4);
    await settle();
    confirmButton('ok').click();
    const r = await pending;
    assert.deepEqual([r.action, r.reason], ['refused', 'port_security']);
    assert.equal(footer(), 'The switch only takes registered machines.');
    assert.equal(window.MinigameFramework.currentMinigame, m);
    assert.ok(events.some(([n, d]) => n === 'network_device_refused' && d.reason === 'port_security'));
});

test('Esc on a confirm raised over the open panel closes the confirm only; a second Esc closes the panel', async () => {
    const m = setup();
    let completed = null;
    m.params.onComplete = (ok) => { completed = ok; };
    const pending = m.clickPort(2);
    await settle();
    assert.ok(confirmButton('ok'), 'the confirm is open');
    esc();
    const r = await pending;
    assert.equal(r.action, 'cancelled', 'the confirm resolved false');
    assert.equal(plants.length, 0, 'no plant request');
    assert.equal(document.querySelector('.game-confirm-overlay'), null);
    assert.equal(window.MinigameFramework.currentMinigame, m, 'the panel is still open');
    assert.equal(completed, null);
    esc();
    assert.equal(completed, false, 'the second Esc closes the panel');
    assert.equal(m.closedByPlayer, true);
});

test('_applyJackLookById is a no-op for a port with no sprite', () => {
    setup();
    window.rooms = { room_comms: { objects: {} } };
    assert.doesNotThrow(() => links._applyJackLookById('voice_port'));
    assert.doesNotThrow(() => links._applyJackLookById('no_such_port'));
});

test('findJack reads panelJacks and world-jack sprites; a bootstrap scenario alone finds nothing', () => {
    const rooms = liveRooms();
    assert.equal(findJack('voice_port', { rooms }).panelOf, 'p3_patch_panel');
    assert.equal(findJack('secured_port', { rooms }).portSecurityMessage, 'The switch only takes registered machines.');
    assert.equal(findJack('nope', { rooms }), null);
    assert.equal(findJack('voice_port', { scenario: BOOTSTRAP }), null);
    assert.equal(findJack('voice_port', {}), null);
    assert.equal(findJack('', { rooms }), null);
    // a full scenario is only a fallback
    const full = { rooms: { r: { objects: [JACKS.guest_port] } } };
    assert.equal(findJack('guest_port', { scenario: full }).id, 'guest_port');
});

test('with a bootstrap-shaped scenario every port the live engine holds reads patched, managed or unpatched', () => {
    setup();
    assert.equal(window.gameScenario.rooms.room_comms.objects, undefined);
    assert.deepEqual([1, 2, 3, 4, 5].map(n => port(n).dataset.state), ['patched', 'patched', 'patched', 'managed', 'unpatched']);
});

test('a reload that restores a planted port (heldAt) shows it held, from the same lookup', () => {
    setup();
    links.load([foothold], ['voice_port']);
    document.body.innerHTML = '';
    const m = startPatchPanelMinigame(PANEL);
    assert.equal(document.querySelector('[data-port="2"]').dataset.state, 'held');
    assert.ok(m);
});

test('the CSS never uses --pp-scale bare as a length (it is unitless)', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/patch-panel-minigame.css'), 'utf8');
    const uses = [...css.matchAll(/var\(--pp-scale\)/g)];
    assert.ok(uses.length > 0);
    for (const u of uses) {
        const before = css.slice(Math.max(0, u.index - 12), u.index);
        assert.match(before, /\d(\.\d+)?px \* $/, `bare var(--pp-scale) near: ${css.slice(Math.max(0, u.index - 40), u.index + 20)}`);
    }
});

test('registration and wiring sit in index.js and the page', () => {
    const idx = readFileSync(join(js, 'minigames/index.js'), 'utf8');
    assert.match(idx, /registerScene\('patch-panel', PatchPanelMinigame\)/);
    assert.match(idx, /window\.startPatchPanelMinigame = startPatchPanelMinigame/);
    const erb = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.ok(erb.indexOf('patch-panel-minigame.css') > erb.indexOf('device-frame.css'));
});

test('interactions.js opens the panel for an object with panelPorts, after the wifiAp branch and before network_link', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const branch = src.indexOf('Array.isArray(sprite.scenarioData.panelPorts)');
    assert.ok(branch > src.indexOf('sprite.scenarioData.wifiAp === true'));
    assert.ok(branch < src.indexOf("sprite.scenarioData.type === 'network_link'"));
    assert.match(src.slice(branch, branch + 160), /window\.startPatchPanelMinigame\?\.\(sprite\.scenarioData\);\s*return;/);
});

test('the 4 rows of 6 print a range label above each row', () => {
    setup({ vw: 480, vh: 640 });
    const ranges = [...document.querySelectorAll('.patch-panel-range')].map(n => n.textContent);
    assert.deepEqual(ranges, ['1-6', '7-12', '13-18', '19-24']);
    setup();
    assert.equal(document.querySelectorAll('.patch-panel-range').length, 0);
});

test('a port-security refusal shows once: in the footer, with no toast', async () => {
    const m = setup();
    plantError = Object.assign(new Error('x'), { status: 422, body: { reason: 'port_security', error: 'server words' } });
    const pending = m.clickPort(4);
    await settle();
    confirmButton('ok').click();
    const r = await pending;
    assert.equal(r.message, 'server words');
    assert.equal(footer(), 'The switch only takes registered machines.');
    assert.deepEqual(toasts, []);
});

test('a later plant (not the first) leaves the panel open and the footer says the box is in', async () => {
    const m = setup();
    window.ApiClient.networkPlant = async (jackId, deviceId) => {
        plants.push([jackId, deviceId]);
        return { success: true, foothold, added: [], removed: [deviceId], first: false };
    };
    const pending = m.clickPort(2);
    await settle();
    confirmButton('ok').click();
    const r = await pending;
    assert.equal(r.action, 'planted');
    assert.equal(window.MinigameFramework.currentMinigame, m, 'no view opened');
    assert.equal(port(2).dataset.state, 'held');
    assert.equal(footer(), 'V02, Open desk 1: your box is plugged in');
});

test('a click or a same-layout resize updates ports in place and keeps keyboard focus', async () => {
    const m = setup();
    const btn = port(2);
    btn.focus();
    assert.equal(document.activeElement, btn);
    m.relayout();
    assert.equal(port(2), btn, 'the same node');
    assert.equal(document.activeElement, btn);
    links.load([foothold], ['voice_port']);
    m.relayout();
    assert.equal(port(2), btn);
    assert.equal(btn.dataset.state, 'held');
    assert.match(btn.getAttribute('aria-label'), /your box is plugged in/);
    // a layout change does rebuild, and refocuses the same port number
    dom.window.innerWidth = 360; dom.window.innerHeight = 740;
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    assert.notEqual(port(2), btn);
    assert.equal(document.activeElement, port(2));
});
