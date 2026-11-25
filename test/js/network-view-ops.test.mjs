// The network view's ops loop, S1 (ops core plan 5.3, 5.5, 11.3): Sweep on an unswept discovery
// block, Scan on a host row, service tiles, the one `perform` path with its pending guard and
// its two no-op hooks, the unplug guard folded into it, getTestState. The real view, base
// minigame and network-links.js run against jsdom; the API client is a stub that records calls.
// S2 (check, confirm, the findings panel) is in the second half; S3 adds its actions to this file.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'network-view-ops-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/more-below.js', 'utils/author-html.js', 'utils/conditional-text.js',
    'systems/global-writer.js', 'utils/remote-host-text.js', 'utils/sync-before-fetch.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/network-view/ops-model.js',
    'minigames/network-view/view-texts.js', 'minigames/network-view/view-controls.js', 'minigames/network-view/network-view-panels.js',
    'minigames/network-view/terminal-grammar.js',
    'minigames/network-view/terminal-format.js',
    'minigames/network-view/skin-choice.js',
    'minigames/network-view/network-view-terminal.js',
    'minigames/network-view/cli-gen/defaults.js',
    'minigames/network-view/cli-gen/scanner-output.js',
    'minigames/network-view/cli-gen/framework-console.js',
    'minigames/network-view/cli-gen/registry.js',
    'minigames/network-view/network-view-minigame.js', 'utils/compromise-bolt.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const V = await imp('minigames/network-view/network-view-minigame.js');
const { NetworkViewMinigame } = V;
const M = await imp('minigames/network-view/ops-model.js');
const { NetworkLinks } = await imp('systems/network-links.js');

const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const net = { id: 'lab_net', name: 'Lab network' };
const foothold = { id: 'jack_a', via: 'jack', name: 'Drop box: lab', itemId: 'netlink_jack_a', sourceId: 'port_a', network: net };
const PRINTER = { id: 'print01', kind: 'device', name: 'Second floor printer', sprite: 'pnw_portable_printer1' };
const SWEPT_PRINTER = { ...PRINTER, scanned: true,
    services: [{ name: 'web', label: 'web', port: 80, product: 'Brackley PrintPanel', version: '2.0' }] };
const PC = { id: 'desk_pc', kind: 'pc', name: 'Desk PC', host: 'LAB-01', sprite: 'pc_desktop', headless: false, remoteSignIn: true };

let calls, answer, events, scanImpl, checkImpl, confirmImpl, jacks;
const view = () => window.MinigameFramework.currentMinigame;
const q = (sel) => document.querySelector(sel);
const sweepBtn = () => q('[data-network-id] [data-action="sweep"]');
const scanBtn = (id) => q(`[data-host-id="${id}"] [data-action="scan"]`);
const named = (n) => events.filter(([e]) => e === n).map(([, d]) => d);

function framework() {
    return {
        currentMinigame: null, mainGameScene: {},
        startMinigame(type, container, params) {
            if (this.currentMinigame) this.endMinigame(false, null);
            const el = document.createElement('div');
            document.body.appendChild(el);
            const m = new NetworkViewMinigame(el, params);
            m._sceneType = type;
            this.currentMinigame = m;
            m.init(); m.start();
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

// `entry` is the foothold's GET /network entry fields beyond the foothold itself
function setup(entry = {}, { unplug = false } = {}) {
    window.MinigameFramework?.endMinigame?.(false, null);
    calls = []; events = []; scanImpl = null; checkImpl = null; confirmImpl = null;
    answer = { footholds: [{ ...foothold, hosts: [], networks: [], ...entry }] };
    document.body.innerHTML = '';
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameAlert = () => {};
    window.gameState = { globalVariables: {} };
    window.applyInventoryDelta = () => {};
    window.inventory = { items: [] };
    window.ApiClient = {
        network: async (id) => { calls.push(['network', id]); return JSON.parse(JSON.stringify(answer)); },
        networkScan: async (fid, params) => {
            calls.push(['scan', fid, params]);
            if (scanImpl) return scanImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkCheck: async (fid, params) => {
            calls.push(['check', fid, params]);
            if (checkImpl) return checkImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkConfirm: async (fid, params) => {
            calls.push(['confirm', fid, params]);
            if (confirmImpl) return confirmImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkUnplug: async (jackId) => { calls.push(['unplug', jackId]); return { success: true, added: [], removed: ['netlink_jack_a'], endedPcIds: [] }; }
    };
    window.MinigameFramework = framework();
    window.startNetworkViewMinigame = (footholdId, { unplugJack = null } = {}) =>
        window.MinigameFramework.startMinigame('network-view', null, { title: 'Link', footholdId, unplugJack });
    window.networkLinks = new NetworkLinks();
    window.networkLinks.load([foothold], ['port_a']);
    if (unplug) window.networkLinks.trip = { footholdId: 'jack_a', atJack: 'port_a' };
}
async function open(unplugJack = null) {
    window.startNetworkViewMinigame('jack_a', { unplugJack });
    await settle();
}
after(() => { window.MinigameFramework?.endMinigame?.(false, null); });
const deferred = () => { let resolve, reject; const p = new Promise((a, b) => { resolve = a; reject = b; }); return { p, resolve, reject }; };

const DISCOVERY = () => ({ hosts: [], networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts: [], swept: false }] });
const SWEPT = (hosts) => ({ hosts, networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts, swept: true, ops: true }] });

test('a view built from an existing answer carries no ops attribute, control or tile', async () => {
    setup({ hosts: [PC, { id: 'share1', kind: 'file_share', name: 'Docs', host: 'LAB-01', open: true }],
        networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts: [PC] }] });
    await open();
    assert.ok(q('[data-host-id="desk_pc"] [data-action="sign-in"]'));
    assert.equal(document.querySelectorAll('[data-network-id], [data-action="sweep"], [data-action="scan"], .network-service, [data-service]').length, 0);
    const st = view().getTestState();
    assert.deepEqual(Object.keys(st.rows[0]).sort(), ['action', 'host', 'id', 'kind', 'name', 'selector', 'session']);
    assert.equal('ownNetwork' in st, false);
    assert.equal('pending' in st, false);
});

test('an unswept discovery network opens empty with Sweep, and a sweep lists the rows', async () => {
    setup(DISCOVERY());
    await open();
    assert.ok(sweepBtn(), 'Sweep is offered');
    assert.equal(sweepBtn().textContent, V.SWEEP_TEXT);
    assert.equal(document.querySelectorAll('[data-host-id]').length, 0);
    assert.equal(document.querySelectorAll('[data-action="scan"]').length, 0, 'no Scan before a sweep');
    scanImpl = async () => { answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([PRINTER, PC]) };
        return { success: true, network: { id: 'lab_net', swept: true, hosts: [PRINTER, PC] } }; };
    sweepBtn().click();
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'scan'), [['scan', 'jack_a', { networkId: 'lab_net' }]]);
    assert.equal(sweepBtn(), null, 'swept: no Sweep');
    assert.ok(q('[data-host-id="print01"]'));
    assert.ok(q('[data-host-id="desk_pc"]'));
    assert.ok(scanBtn('print01') && scanBtn('desk_pc'), 'Scan on each host row of the ops block');
    assert.deepEqual(named('network_swept'), [{ networkId: 'lab_net' }]);
    assert.deepEqual(events.filter(([e]) => e === 'network_swept:lab_net').length, 1);
    assert.ok(calls.filter(c => c[0] === 'network').length >= 2, 'the refetch ran after the success');
    const st = view().getTestState();
    assert.deepEqual(st.ownNetwork, { id: 'lab_net', swept: true, ops: true });
    const printer = st.rows.find(r => r.id === 'print01');
    assert.equal(printer.kind, 'device');
    assert.equal(printer.scanned, false);
    assert.equal(printer.scan, '[data-host-id="print01"] [data-action="scan"]');
    assert.equal(q('[data-host-id="print01"] .network-row-icon').getAttribute('src'), '/break_escape/assets/objects/pnw_portable_printer1.png');
});

test('a device row with no sprite, or a hostile one, gets the plain device icon', async () => {
    setup(SWEPT([{ id: 'd1', kind: 'device', name: 'Box' }, { id: 'd2', kind: 'device', name: 'Odd', sprite: '"><img src=x onerror=1>' }]));
    await open();
    for (const id of ['d1', 'd2']) assert.equal(q(`[data-host-id="${id}"] .network-row-icon`).getAttribute('src'), '/break_escape/assets/objects/network_rack1.png');
    assert.equal(document.querySelectorAll('img[onerror]').length, 0);
});

test('a host scan shows service tiles, one Scan press, and the scanned row offers no second Scan', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    scanImpl = async () => { answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([SWEPT_PRINTER]) }; return { success: true, host: SWEPT_PRINTER }; };
    scanBtn('print01').click();
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'scan'), [['scan', 'jack_a', { hostId: 'print01' }]]);
    const tile = q('[data-host-id="print01"] [data-service="web"]');
    assert.ok(tile);
    assert.equal(tile.querySelector('.network-service-line').textContent, 'web · 80 · Brackley PrintPanel 2.0');
    assert.equal(scanBtn('print01'), null);
    assert.deepEqual(named('network_host_scanned'), [{ hostId: 'print01' }]);
    const row = view().getTestState().rows.find(r => r.id === 'print01');
    assert.equal(row.scanned, true);
    assert.deepEqual(row.services, [{ name: 'web', label: 'web', port: 80, product: 'Brackley PrintPanel', version: '2.0' }]);
    assert.equal('scan' in row, false);
});

test('a sign-in PC in an ops block offers Scan beside its own action; a powered-down host offers none', async () => {
    setup(SWEPT([PC, { ...PC, id: 'off_pc', host: 'LAB-02', responding: false }]));
    await open();
    assert.ok(q('[data-host-id="desk_pc"] [data-action="sign-in"]'));
    assert.ok(scanBtn('desk_pc'));
    assert.equal(scanBtn('off_pc'), null);
});

test('hostile strings in names, services, products and notices are text', async () => {
    const HOSTILE = '<img src=x onerror=alert(1)>"&';
    const bad = { id: 'h1', kind: 'device', name: HOSTILE, scanned: true,
        services: [{ name: HOSTILE, label: HOSTILE, port: 1, product: HOSTILE, version: HOSTILE }] };
    setup(SWEPT([bad, { id: 'h2', kind: 'device', name: 'Two' }]));
    await open();
    assert.equal(document.querySelectorAll('img[onerror]').length, 0);
    assert.ok(q('[data-host-id="h1"]').textContent.includes(HOSTILE));
    assert.ok([...document.querySelectorAll('.network-service')].some(t => t.textContent.includes(HOSTILE)));
    scanImpl = async () => ({ success: false, reason: HOSTILE });
    scanBtn('h2').click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, M.UNKNOWN_REFUSAL_TEXT, 'an unknown code shows the neutral line, not the code');
    assert.equal(document.querySelectorAll('img[onerror]').length, 0);
});

test('guard: the control is disabled in the same tick, a second press makes no call, other targets are separate', async () => {
    setup(SWEPT([PRINTER, PC]));
    await open();
    const d = deferred();
    scanImpl = () => d.p;
    scanBtn('print01').click();
    assert.equal(scanBtn('print01').disabled, true, 'disabled before any await');
    assert.equal(scanBtn('print01').textContent, V.SCANNING_TEXT);
    assert.deepEqual([...view().pending], [M.pendingKey('scan', 'print01')]);
    q('[data-host-id="print01"] [data-action="scan"]').click();
    view().perform({ action: 'scan', target: 'print01' });
    await settle();
    assert.equal(calls.filter(c => c[0] === 'scan').length, 1, 'one press is one request');
    // another host's Scan is its own key
    scanBtn('desk_pc').click();
    await settle();
    assert.equal(calls.filter(c => c[0] === 'scan').length, 2);
    d.resolve({ success: true, host: SWEPT_PRINTER });
    await settle();
    assert.equal(view().pending.size, 0);
});

test('guard: a refetch that lands while a request is pending keeps that control disabled', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const d = deferred();
    scanImpl = () => d.p;
    scanBtn('print01').click();
    answer.footholds[0].name = 'Drop box: lab (renamed)';
    answer.footholds[0].hosts = [{ ...PRINTER, name: 'Renamed printer' }];
    answer.footholds[0].networks[0].hosts = answer.footholds[0].hosts;
    await view().refetch({ sync: false });
    assert.equal(q('[data-host-id="print01"]').textContent.includes('Renamed printer'), true, 'the refetch did redraw');
    assert.equal(scanBtn('print01').disabled, true, 'still disabled');
    assert.equal(scanBtn('print01').textContent, V.SCANNING_TEXT);
    d.resolve({ success: true, host: SWEPT_PRINTER });
    await settle();
    assert.equal(view().pending.size, 0);
});

test('a refusal is drawn from REFUSAL_TEXT, the control comes back, and no event or refetch follows', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    for (const [reason, status] of [['not_responding', 403], ['not_needed', 422], ['not_found', 404]]) {
        scanImpl = async () => { throw Object.assign(new Error('x'), { status, body: { success: false, reason } }); };
        const before = calls.filter(c => c[0] === 'network').length;
        scanBtn('print01').click();
        await settle();
        assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT[reason], reason);
        assert.equal(scanBtn('print01').disabled, false);
        assert.equal(scanBtn('print01').textContent, V.SCAN_TEXT);
        assert.equal(calls.filter(c => c[0] === 'network').length, before, 'no refetch after a refusal');
    }
    assert.equal(named('network_host_scanned').length, 0);
    // pressing again clears the previous line first
    scanImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_needed' } }); };
    const d = deferred(); scanImpl = () => d.p;
    scanBtn('print01').click();
    assert.equal(q('.network-view-notice').textContent, '', 'cleared when the next press goes in');
    d.resolve({ success: true, host: SWEPT_PRINTER });
    await settle();
});

test('a request that throws, and one with no usable reply, end with the no-answer line', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    scanImpl = async () => { throw new TypeError('down'); };
    scanBtn('print01').click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.no_answer);
    assert.equal(scanBtn('print01').disabled, false);
    assert.equal(calls.filter(c => c[0] === 'scan').length, 1, 'no retry');
});

test('perform turns away a press with no such control, calling neither hook', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const seen = [];
    view().onSent = () => seen.push('sent'); view().onEnded = () => seen.push('ended');
    for (const offer of [{ action: 'check', target: 'x' }, { action: 'scan' }, { action: 'unplug', target: 'port_a' }, { action: 'sweep', target: '' }]) {
        assert.deepEqual(await view().perform(offer), { sent: false });
    }
    assert.deepEqual(seen, []);
    assert.equal(calls.filter(c => c[0] === 'scan').length, 0);
});

test('hooks: onSent once before the request, then onEnded, then the key gone, then the result drawn', async () => {
    const cases = [
        ['an answer', async () => ({ success: true, host: SWEPT_PRINTER }), (a) => a.success === true],
        ['a refusal', async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_needed' } }); }, (a) => a.reason === 'not_needed'],
        ['a throw', async () => { throw new TypeError('down'); }, (a) => a === null]
    ];
    for (const [label, impl, check] of cases) {
        setup(SWEPT([PRINTER]));
        await open();
        const m = view();
        const key = M.pendingKey('scan', 'print01');
        const log = [];
        const echo = { typed: 'scan 10.0.0.2' };
        m.onSent = (offer, e) => log.push(['onSent', offer, e, m.pending.has(key), scanBtn('print01').disabled, calls.filter(c => c[0] === 'scan').length]);
        m.onEnded = (offer, a) => log.push(['onEnded', offer, a, m.pending.has(key), calls.filter(c => c[0] === 'scan').length]);
        const realShow = m.showResult.bind(m);
        m.showResult = (offer, a) => { log.push(['showResult', m.pending.has(key), scanBtn('print01')?.disabled]); realShow(offer, a); };
        scanImpl = impl;
        const offer = { action: 'scan', target: 'print01' };
        const out = await m.perform(offer, { echo });
        assert.equal(out.sent, true, label);
        assert.deepEqual(log.map(l => l[0]), ['onSent', 'onEnded', 'showResult'], label);
        const [sent, ended, shown] = log;
        assert.deepEqual(sent.slice(1), [offer, echo, true, false, 0], `${label}: onSent has the key in pending, the control not yet redrawn, no request yet`);
        assert.deepEqual(ended[1], offer);
        assert.ok(check(ended[2]), `${label}: onEnded answer`);
        assert.deepEqual([ended[3], ended[4]], [true, 1], `${label}: onEnded runs with the key still held, after the request`);
        assert.equal(shown[1], false, `${label}: the key is gone before the result is drawn`);
        if (label === 'an answer') assert.equal(out.answer.success, true);
        if (label === 'a throw') assert.equal(out.answer, null);
    }
});

test('hooks: a throwing hook still lets the request go, clears the key and draws the result; echo and hooks change no request', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const m = view();
    scanImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_needed' } }); };
    scanBtn('print01').click();
    await settle();
    const plain = calls.filter(c => c[0] === 'scan')[0];
    calls.length = 0;
    m.onSent = () => { throw new Error('boom'); };
    await m.perform({ action: 'scan', target: 'print01' }, { echo: { any: 1 } });
    assert.deepEqual(calls.filter(c => c[0] === 'scan'), [plain], 'same route and body with an echo and a throwing onSent');
    assert.equal(m.pending.size, 0);
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.not_needed);
    m.onSent = () => {}; m.onEnded = () => { throw new Error('boom'); };
    q('.network-view-notice').textContent = '';
    await m.perform({ action: 'scan', target: 'print01' });
    assert.equal(m.pending.size, 0, 'the key is cleared');
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.not_needed, 'the result is drawn');
});

test('unplug goes through perform: same label and notice, hooks run, and the tail runs before the view closes', async () => {
    setup({}, { unplug: true });
    await open('port_a');
    const m = view();
    const order = [];
    m.onSent = (o) => order.push(['onSent', o]); m.onEnded = (o, a) => order.push(['onEnded', a?.action]);
    const realComplete = m.complete.bind(m);
    m.complete = (...a) => { order.push(['complete', m.pending.size]); return realComplete(...a); };
    const realShow = m.showResult.bind(m);
    m.showResult = (o, a) => { order.push(['showResult']); realShow(o, a); };
    const btn = q('[data-unplug]');
    btn.click();
    assert.equal(q('[data-unplug]').disabled, true);
    assert.equal(q('[data-unplug]').textContent, V.UNPLUGGING_TEXT);
    q('[data-unplug]').click();
    await settle(10);
    assert.deepEqual(calls.filter(c => c[0] === 'unplug'), [['unplug', 'port_a']], 'a second press made no call');
    assert.deepEqual(order.map(o => o[0]), ['onSent', 'onEnded', 'showResult', 'complete']);
    assert.deepEqual(order[0][1], { action: 'unplug', target: 'port_a' });
    assert.deepEqual(order[1], ['onEnded', 'unplugged']);
    assert.deepEqual(order[3], ['complete', 0], 'the key was cleared before complete');
});

test('unplug: a request that throws ends in the tail with the existing sentence and the button back', async () => {
    setup({}, { unplug: true });
    await open('port_a');
    window.networkLinks.unplugFromView = async () => { throw new Error('lost'); };
    const ended = [];
    view().onEnded = (o, a) => ended.push(a);
    q('[data-unplug]').click();
    await settle(8);
    assert.deepEqual(ended, [null]);
    assert.equal(q('[data-unplug]').disabled, false);
    assert.equal(q('[data-unplug]').textContent, V.UNPLUG_TEXT);
    assert.equal(q('.network-view-unplug-notice').textContent, 'The port did not respond. Try again.');
    assert.equal(view().pending.size, 0);
});

test('getTestState lists the pending keys while a request is out', async () => {
    setup(DISCOVERY());
    await open();
    const d = deferred(); scanImpl = () => d.p;
    sweepBtn().click();
    assert.deepEqual(view().getTestState().pending, ['sweep:lab_net']);
    assert.equal(sweepBtn().textContent, V.SWEEPING_TEXT);
    assert.equal(view().getTestState().ownNetwork.sweep, '[data-network-id="lab_net"] [data-action="sweep"]');
    d.resolve({ success: true, network: { id: 'lab_net', swept: true, hosts: [] } });
    await settle();
});

test('a further network block offers its own Sweep and Scan, found by the block and row hooks', async () => {
    const far = { id: 'far_net', name: 'Far network', route: 'up', via: { hostId: 'desk_pc', host: 'LAB-01' }, hosts: [], swept: false };
    setup({ hosts: [PC], networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts: [PC] }, far] });
    await open();
    const btn = q('[data-network-id="far_net"] [data-action="sweep"]');
    assert.ok(btn);
    assert.equal(document.querySelectorAll('[data-network-id="lab_net"]').length, 0, 'the plain own block carries no ops hook');
    scanImpl = async () => ({ success: true, network: { id: 'far_net', swept: true, hosts: [PRINTER] } });
    answer.footholds[0].networks[1] = { ...far, swept: true, ops: true, hosts: [PRINTER] };
    btn.click();
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'scan')[0], ['scan', 'jack_a', { networkId: 'far_net' }]);
    assert.ok(q('[data-network-id="far_net"] [data-host-id="print01"] [data-action="scan"]'));
    assert.equal(view().getTestState().networks.length, 1, 'the own block is not a further block');
    assert.equal(view().getTestState().networks[0].swept, true);
    assert.equal('swept' in view().getTestState().rows[0] || 'ownNetwork' in view().getTestState(), false, 'the plain own block adds no ops key');
});

// ---- S1 client R1 fixes ----

test('M1: a slow refetch that started before a scan cannot overwrite the scan result', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const before = calls.filter(c => c[0] === 'network').length;
    // the timed refetch: asked now, so it carries the unscanned view, and lands only after the scan's answer
    const slow = deferred();
    const realNetwork = window.ApiClient.network;
    let first = true;
    window.ApiClient.network = async (id) => {
        if (!first) return realNetwork(id);
        first = false;
        calls.push(['network', id]);
        const snapshot = JSON.parse(JSON.stringify(answer));
        await slow.p;
        return snapshot;
    };
    const timed = view().refetch({ sync: false });
    scanImpl = async () => {
        answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([SWEPT_PRINTER]) };
        return { success: true, host: SWEPT_PRINTER };
    };
    const moved = view().perform({ action: 'scan', target: 'print01' });
    await settle(30);
    assert.equal(document.querySelectorAll('[data-service]').length, 1, 'the answer drew the tile at once');
    await new Promise(r => setTimeout(r, 50));
    slow.resolve();
    await timed;
    await moved;
    await settle();
    assert.equal(document.querySelectorAll('[data-service]').length, 1, 'the late old answer did not wipe the tile');
    assert.equal(scanBtn('print01'), null, 'Scan is not offered again');
    assert.equal(calls.filter(c => c[0] === 'network').length - before, 2, 'the late one, then a fresh refetch');
});

test('m1: a redraw that throws does not leave the key pending, and the result is still drawn', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const m = view();
    const realRedraw = m.redraw.bind(m);
    m.redraw = () => { throw new Error('bad row'); };
    scanImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_needed' } }); };
    const out = await m.perform({ action: 'scan', target: 'print01' });
    assert.equal(out.sent, true);
    assert.equal(m.pending.size, 0, 'the key is cleared');
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.not_needed, 'the result is drawn');
    m.redraw = realRedraw;
    scanImpl = async () => ({ success: true, host: SWEPT_PRINTER });
    assert.equal((await m.perform({ action: 'scan', target: 'print01' })).sent, true, 'the control works again');
});

test('m2 and T1: a request that gives no reply ends with answer null in the hook and the result', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const m = view();
    const seen = [];
    m.onEnded = (offer, a) => seen.push(a);
    scanImpl = async () => undefined;
    const out = await m.perform({ action: 'scan', target: 'print01' });
    assert.deepEqual(seen, [null]);
    assert.equal(out.answer, null);
    assert.equal(out.sent, true);
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.no_answer);
    assert.equal(m.pending.size, 0);
});

test('T1: a 400 bad_request is drawn from the table', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    scanImpl = async () => { throw Object.assign(new Error('x'), { status: 400, body: { success: false, reason: 'bad_request' } }); };
    scanBtn('print01').click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.bad_request);
    assert.equal(scanBtn('print01').disabled, false);
    assert.equal(named('network_host_scanned').length, 0);
});

test('m3: an answer that lands after the view has closed draws nothing', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    const m = view();
    const d = deferred();
    scanImpl = () => d.p;
    const moved = m.perform({ action: 'scan', target: 'print01' });
    window.MinigameFramework.endMinigame(false, null);
    let renders = 0;
    const realRender = m.render.bind(m);
    m.render = () => { renders++; realRender(); };
    d.resolve({ success: true, host: SWEPT_PRINTER });
    await moved;
    await settle();
    assert.equal(renders, 0, 'no redraw of a closed view');
});

test('m4: after a successful scan focus stays in the row or moves to the next control', async () => {
    setup(SWEPT([PC, PRINTER]));
    await open();
    scanImpl = async () => { answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([PC, SWEPT_PRINTER]) };
        return { success: true, host: SWEPT_PRINTER }; };
    scanBtn('print01').focus();
    assert.equal(document.activeElement, scanBtn('print01'));
    const top = view().gameContainer.scrollTop;
    await view().perform({ action: 'scan', target: 'print01' });
    await settle();
    assert.equal(document.querySelectorAll('[data-service]').length, 1);
    assert.ok(document.activeElement?.closest?.('[data-action]'), 'a control has focus, not the page body');
    assert.equal(view().gameContainer.scrollTop, top);
});

test('m5: device rows get their own group after the computers and before the shares', async () => {
    setup(SWEPT([{ id: 'share1', kind: 'file_share', name: 'Docs', host: 'LAB-01', open: true }, PRINTER, PC]));
    await open();
    const heads = [...document.querySelectorAll('.network-row-group')].map(e => e.textContent);
    assert.deepEqual(heads, ['Computers', 'Devices', 'File shares']);
});

test('m6: a refusal key is dropped when another notice replaces it, and when the refetch no longer lists its target', async () => {
    setup(SWEPT([PRINTER, { id: 'share1', kind: 'file_share', name: 'Docs', host: 'LAB-01', open: true, observations: 'A share.' }]));
    await open();
    const m = view();
    scanImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_needed' } }); };
    await m.perform({ action: 'scan', target: 'print01' });
    assert.equal(m.noticeKey, M.pendingKey('scan', 'print01'));
    m.showNotice('Look text', 'share1');
    assert.equal(m.noticeKey, null, 'another notice clears the key');
    await m.perform({ action: 'scan', target: 'print01' });
    assert.ok(q('.network-view-notice').textContent);
    answer.footholds[0].hosts = [];
    answer.footholds[0].networks[0].hosts = [];
    await m.refetch({ sync: false });
    assert.equal(m.noticeKey, null);
    assert.equal(q('.network-view-notice').textContent, '', 'the line goes with its target');
});

test('m7: a block whose route is down never offers Sweep, even with swept false', async () => {
    const down = { id: 'far_net', name: 'Far network', route: 'down', via: { hostId: 'desk_pc', host: 'LAB-01' }, hosts: [], swept: false };
    setup({ hosts: [PC], networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts: [PC] }, down] });
    await open();
    assert.equal(document.querySelectorAll('[data-action="sweep"]').length, 0);
    assert.equal(q('[data-network-id="far_net"]'), null);
    assert.equal(M.offersSweep(down), false);
    assert.equal('sweep' in (view().getTestState().networks[0] || {}), false);
    assert.equal(await view().perform({ action: 'sweep', target: 'far_net' }).then(r => r.sent), true, 'perform itself is the server\'s to refuse');
});

test('R2 N1: a scan\'s own refetch dropped by a later refused press is asked for again at once', async () => {
    const OTHER = { id: 'print02', kind: 'device', name: 'Hall printer', sprite: 'pnw_portable_printer1' };
    setup(SWEPT([PRINTER, OTHER]));
    await open();
    const hold = deferred();
    const realNetwork = window.ApiClient.network;
    let first = true;
    window.ApiClient.network = async (id) => {
        if (!first) return realNetwork(id);
        first = false;
        calls.push(['network', id]);
        const snapshot = JSON.parse(JSON.stringify(answer));
        await hold.p;
        return snapshot;
    };
    const before = calls.filter(c => c[0] === 'network').length;
    scanImpl = async (fid, params) => {
        if (params.hostId === 'print01') {
            answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([SWEPT_PRINTER, OTHER]) };
            return { success: true, host: SWEPT_PRINTER };
        }
        throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_needed' } });
    };
    const a = view().perform({ action: 'scan', target: 'print01' });
    await settle(30);
    assert.equal(calls.filter(c => c[0] === 'network').length - before, 1, 'the scan\'s refetch is out');
    const b = view().perform({ action: 'scan', target: 'print02' });
    await settle(30);
    hold.resolve();
    await a; await b;
    await settle();
    assert.equal(calls.filter(c => c[0] === 'network').length - before, 2, 'a fresh refetch followed the dropped one');
});

// ---------------------------------------------------------------------------------------------
// S2: Check, Confirm and the findings panel (ops core plan 5.3, 5.5, 11.3)
// ---------------------------------------------------------------------------------------------

const HOSTILE2 = '<img src=x onerror=alert(2)>"&';
const F1 = { id: 'print01.web.factory_login', alias: 'f1', hostId: 'print01', service: 'web', class: 'default_creds',
    severity: 'high', summary: 'The admin page still accepts the factory account.', status: 'unconfirmed' };
const F2 = { id: 'print01.web.old_banner', alias: 'f2', hostId: 'print01', service: 'web', class: 'unpatched',
    severity: 'medium', summary: 'A setting may have been left in an unsafe state.', status: 'unconfirmed' };
const withFindings = (findings) => ({ ...SWEPT_PRINTER, findings });
const checkBtn = (host = 'print01', svc = 'web') => q(`[data-host-id="${host}"] [data-service="${svc}"] [data-action="check"]`);
const confirmBtn = (alias) => q(`[data-finding="${alias}"] [data-action="confirm"]`);
const put2 = (row) => { answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([row]) }; };

test('S2: a scanned tile offers Check; a press sends one request and the answer draws its findings at once', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    assert.ok(checkBtn());
    checkImpl = async () => { put2(withFindings([F1, F2])); return { success: true, hostId: 'print01', service: 'web', findings: [F1, F2] }; };
    checkBtn().click();
    assert.equal(checkBtn().disabled, true, 'disabled in the same tick');
    checkBtn().click();
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'check'), [['check', 'jack_a', { hostId: 'print01', service: 'web' }]]);
    assert.equal(document.querySelectorAll('[data-finding]').length, 2);
    const f1 = q('[data-finding="f1"]');
    assert.match(f1.textContent, /f1/); assert.match(f1.textContent, /Default login/); assert.match(f1.textContent, /High/);
    assert.match(f1.textContent, /Unconfirmed/); assert.match(f1.textContent, /factory account/);
    assert.match(q('[data-finding="f2"]').textContent, /A setting may have been left in an unsafe state\./, 'the server\'s line is drawn as sent');
    assert.ok(confirmBtn('f1') && confirmBtn('f2'), 'one Confirm per unconfirmed finding');
    assert.equal(document.querySelectorAll('[data-action="confirm"]').length, 2);
    assert.deepEqual(named('network_service_checked'), [{ hostId: 'print01', service: 'web' }]);
    assert.equal(events.some(([n]) => n === 'network_service_checked:print01.web'), true);
    assert.equal(calls.filter(c => c[0] === 'network').length >= 2, true, 'the refetch followed');
});

test('S2: a check that finds nothing says so and still emits the event', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    checkImpl = async () => ({ success: true, hostId: 'print01', service: 'web', findings: [] });
    checkBtn().click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, V.NO_FINDINGS_TEXT);
    assert.equal(document.querySelectorAll('[data-finding]').length, 0);
    assert.equal(named('network_service_checked').length, 1);
});

test('S2: confirm settles a real finding with its needs, and a decoy with its reason', async () => {
    setup(SWEPT([withFindings([F1, F2])]));
    await open();
    const real = { ...F1, status: 'confirmed', needs: [
        { kind: 'item', label: 'Printer manual', met: false }, { kind: 'credential', label: 'Admin login', met: true }], fixed: true };
    confirmImpl = async () => { put2(withFindings([real, F2])); return { success: true, finding: real }; };
    confirmBtn('f1').click();
    assert.equal(confirmBtn('f1').disabled, true);
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'confirm'), [['confirm', 'jack_a', { findingId: 'print01.web.factory_login' }]]);
    assert.equal(confirmBtn('f1'), null, 'no Confirm once settled');
    const needs = [...document.querySelectorAll('[data-finding="f1"] .network-need')];
    assert.deepEqual(needs.map(n => [n.dataset.met, n.textContent.replace(/^\S+\s/, '')]), [['false', 'Printer manual: no'], ['true', 'Admin login: yes']]);
    assert.match(needs[0].textContent, /\u2717/); assert.match(needs[1].textContent, /\u2713/);
    assert.match(q('[data-finding="f1"]').textContent, /Fixed/);
    assert.deepEqual(named('network_finding_confirmed'), [{ findingId: 'print01.web.factory_login', status: 'confirmed' }]);
    const decoy = { ...F2, status: 'false', falseBecause: 'The build number is cosmetic.' };
    confirmImpl = async () => { put2(withFindings([real, decoy])); return { success: true, finding: decoy }; };
    confirmBtn('f2').click();
    await settle();
    assert.match(q('[data-finding="f2"]').textContent, /The build number is cosmetic\./);
    assert.match(q('[data-finding="f2"]').textContent, /False positive/);
    assert.doesNotMatch(q('[data-finding="f2"]').textContent, /Fixed/);
    assert.equal(q('[data-finding="f2"] .network-need'), null);
    const st = view().getTestState().rows.find(r => r.id === 'print01');
    assert.deepEqual(st.findings.map(f => [f.alias, f.status, f.fixed, f.needs.length, f.reason]),
        [['f1', 'confirmed', true, 2, null], ['f2', 'false', false, 0, 'The build number is cosmetic.']]);
    assert.equal('confirm' in st.findings[0], false);
});

test('S2: Fixed is drawn only on a confirmed finding that carries fixed', async () => {
    const un = { ...F1, fixed: true };
    const conf = { ...F2, status: 'confirmed', needs: [] };
    setup(SWEPT([withFindings([un, conf])]));
    await open();
    assert.doesNotMatch(q('[data-finding="f1"]').textContent, /Fixed/);
    assert.doesNotMatch(q('[data-finding="f2"]').textContent, /Fixed/);
    assert.equal(view().getTestState().rows[0].findings[0].fixed, false);
});

test('S2: a refusal says its words from REFUSAL_TEXT; no answer says the link did not answer; the key clears', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    checkImpl = async () => { throw Object.assign(new Error('x'), { status: 403, body: { success: false, reason: 'not_responding' } }); };
    checkBtn().click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.not_responding);
    assert.equal(view().pending.size, 0);
    checkImpl = async () => { throw new Error('down'); };
    checkBtn().click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT.no_answer);
    assert.equal(checkBtn().disabled, false);
});

test('S2: a double press of Check or Confirm makes one call; another finding makes its own', async () => {
    setup(SWEPT([withFindings([F1, F2])]));
    await open();
    const gate = deferred();
    confirmImpl = async (fid, p) => { await gate.p; return { success: true, finding: { ...(p.findingId.endsWith('login') ? F1 : F2), status: 'confirmed', needs: [] } }; };
    confirmBtn('f1').click(); confirmBtn('f1').click();
    confirmBtn('f2').click();
    await settle();
    assert.equal(calls.filter(c => c[0] === 'confirm').length, 2, 'f1 once, f2 once');
    assert.equal(confirmBtn('f1').disabled, true);
    assert.deepEqual(view().getTestState().pending.sort(), ['confirm:print01.web.factory_login', 'confirm:print01.web.old_banner']);
    gate.resolve();
    await settle();
    assert.equal(view().pending.size, 0);
});

test('S2: the guard turns away a check or confirm with no control (unknown service, settled finding, powered-down host)', async () => {
    const settled = { ...F1, status: 'confirmed', needs: [] };
    setup(SWEPT([withFindings([settled]), { ...SWEPT_PRINTER, id: 'off01', responding: false, findings: [{ ...F2, id: 'off01.web.x', hostId: 'off01', alias: 'f9' }] }]));
    await open();
    const m = view();
    for (const offer of [{ action: 'check', target: 'print01:nope' }, { action: 'check', target: 'off01:web' },
        { action: 'check', target: 'print01' }, { action: 'confirm', target: settled.id }, { action: 'confirm', target: 'off01.web.x' },
        { action: 'confirm', target: 'f1' }, { action: 'confirm', target: 'zzz' }]) {
        assert.deepEqual(await m.perform(offer), { sent: false }, JSON.stringify(offer));
    }
    assert.equal(calls.filter(c => c[0] === 'check' || c[0] === 'confirm').length, 0);
    assert.equal(checkBtn('off01'), null);
});

test('S2: hooks fire for check and confirm in order, with echo only on onSent', async () => {
    setup(SWEPT([withFindings([F1])]));
    await open();
    const m = view();
    const log = [];
    m.onSent = (o, e) => log.push(['sent', o, e, calls.filter(c => c[0] === 'confirm').length]);
    m.onEnded = (o, a) => log.push(['ended', o, a?.finding?.status]);
    confirmImpl = async () => ({ success: true, finding: { ...F1, status: 'confirmed', needs: [] } });
    const offer = { action: 'confirm', target: F1.id };
    await m.perform(offer, { echo: { typed: 'confirm f1' } });
    assert.deepEqual(log, [['sent', offer, { typed: 'confirm f1' }, 0], ['ended', offer, 'confirmed']]);
});

test('S2: hostile finding summary, need label, decoy reason and alias are text', async () => {
    const f1 = { ...F1, summary: HOSTILE2 };
    const f2 = { ...F2, alias: 'f2', status: 'confirmed', needs: [{ kind: 'global', label: HOSTILE2, met: false }] };
    const f3 = { ...F2, id: 'print01.web.z', alias: 'f3', status: 'false', falseBecause: HOSTILE2 };
    setup(SWEPT([withFindings([f1, f2, f3])]));
    await open();
    assert.equal(document.querySelectorAll('img[onerror]').length, 0);
    assert.ok(q('[data-finding="f1"] .network-finding-summary').textContent.includes(HOSTILE2));
    assert.ok(q('[data-finding="f2"] .network-need-text').textContent.includes(HOSTILE2));
    assert.ok(q('[data-finding="f3"] .network-finding-reason').textContent.includes(HOSTILE2));
});

test('S2: a cli object on a finding is drawn nowhere', async () => {
    const f = { ...F1, cli: { title: 'CLITITLE', module: 'CLIMODULE', output: 'CLIOUT' } };
    setup(SWEPT([withFindings([f])]));
    await open();
    assert.doesNotMatch(document.body.textContent, /CLITITLE|CLIMODULE|CLIOUT/);
});

test('S2: ops controls only carry data-action on the ops controls; a view with no findings has no finding markup', async () => {
    setup(SWEPT([PC]));
    await open();
    assert.equal(document.querySelectorAll('[data-finding], .network-findings, [data-action="check"], [data-action="confirm"]').length, 0);
    assert.equal('findings' in view().getTestState().rows[0], false);
    assert.equal('checks' in view().getTestState().rows[0], false);
});

test('S2: getTestState carries the Check selector per service and a Confirm selector per unconfirmed finding', async () => {
    setup(SWEPT([withFindings([F1])]));
    await open();
    const row = view().getTestState().rows[0];
    assert.deepEqual(row.checks, { web: '[data-host-id="print01"] [data-service="web"] [data-action="check"]' });
    assert.equal(row.findings[0].confirm, '[data-host-id="print01"] [data-finding="f1"] [data-action="confirm"]');
    assert.equal(row.findings[0].summary, F1.summary);
    assert.ok(q(row.checks.web)); assert.ok(q(row.findings[0].confirm));
});

test('S2: focus stays on the tile after a check', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    checkImpl = async () => { put2(withFindings([F1])); return { success: true, hostId: 'print01', service: 'web', findings: [F1] }; };
    checkBtn().focus();
    checkBtn().click();
    await settle();
    assert.ok(q('[data-service="web"]').contains(document.activeElement), 'focus is inside the tile');
});

test('R3-2: _refetchDropped is set in the constructor', async () => {
    setup(SWEPT([PRINTER]));
    await open();
    assert.equal(view()._refetchDropped, false);
    assert.match(readFileSync(join(js, 'minigames/network-view/network-view-minigame.js'), 'utf8'), /this\._refetchDropped = false;\n\s+\/\/ Counts/);
});

// ---------------------------------------------------------------------------------------------
// S2 client R1 fixes (M1, m1, m3, m4, m5, m6, m7, m9)
// ---------------------------------------------------------------------------------------------

test('R1 M1: focus on the list itself (no control) cannot strand a pending key, break a refetch redraw or a result', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    const area = view().gameContainer;
    area.setAttribute('tabindex', '-1');
    area.focus();
    assert.equal(document.activeElement, area, 'focus is in the list but on no control');
    assert.equal(view().focusedControl(), null);
    // a refetch with a changed answer redraws without throwing
    answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([{ ...SWEPT_PRINTER, name: 'Renamed printer' }]) };
    await view().refetch({ sync: false });
    assert.match(area.textContent, /Renamed printer/, 'the changed refetch redrew');
    // perform with focus there: the request goes, the key clears, the findings draw
    area.focus();
    checkImpl = async () => { put2(withFindings([F1])); return { success: true, hostId: 'print01', service: 'web', findings: [F1] }; };
    const r = await view().perform({ action: 'check', target: 'print01:web' });
    assert.equal(r.sent, true);
    assert.equal(calls.filter(c => c[0] === 'check').length, 1);
    assert.equal(view().pending.size, 0, 'the key cleared');
    assert.ok(q('[data-finding="f1"]'), 'the result was drawn');
    assert.equal(checkBtn().disabled, false);
    // and a second press works (nothing stuck)
    area.focus();
    assert.equal((await view().perform({ action: 'check', target: 'print01:web' })).sent, true);
});

test('R1 M1: a focus lookup that throws inside perform still clears the key', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    const m = view();
    const real = m.focusedControl;
    let boom = true;
    m.focusedControl = function () { if (boom) { boom = false; throw new Error('focus'); } return real.call(this); };
    checkImpl = async () => ({ success: true, hostId: 'print01', service: 'web', findings: [] });
    await m.perform({ action: 'check', target: 'print01:web' }).catch(() => {});
    assert.equal(m.pending.size, 0, 'no key stranded by a throw between add and finally');
});

test('R1 m1: only falseBecause is a decoy\'s reason; because and reason keys draw nothing', async () => {
    const a = { ...F1, status: 'false', because: 'BECAUSE-KEY', reason: 'REASON-KEY' };
    const b = { ...F2, status: 'false', falseBecause: 'The real key.' };
    setup(SWEPT([withFindings([a, b])]));
    await open();
    assert.equal(q('[data-finding="f1"] .network-finding-reason'), null);
    assert.doesNotMatch(document.body.textContent, /BECAUSE-KEY|REASON-KEY/);
    assert.equal(q('[data-finding="f2"] .network-finding-reason').textContent, 'The real key.');
    assert.equal(view().getTestState().rows[0].findings[0].reason, null);
});

test('R1 m3: a check answer without fixed over a held fixed finding leaves no Fixed in the view', async () => {
    const fixed = { ...F1, status: 'confirmed', needs: [], fixed: true, cli: { title: 'X' } };
    setup(SWEPT([withFindings([fixed])]));
    await open();
    assert.match(q('[data-finding="f1"]').textContent, /Fixed/);
    const again = { ...F1, status: 'confirmed', needs: [] };
    checkImpl = async () => ({ success: true, already: true, hostId: 'print01', service: 'web', findings: [again] });
    // the refetch (answer) is slow to change: the answer alone must clear Fixed
    const hold = deferred();
    window.ApiClient.network = async () => { await hold.p; throw new Error('refetch fails'); };
    const run = view().perform({ action: 'check', target: 'print01:web' });
    await settle(20);
    assert.doesNotMatch(q('[data-finding="f1"]').textContent, /Fixed/, 'the answer alone cleared Fixed');
    hold.resolve();
    await run.catch(() => {});
    assert.equal(document.querySelectorAll('[data-finding]').length, 1, 'no second row for a repeat');
});

test('R1 m4: the empty-check line is keyed and goes at the next press', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    checkImpl = async () => ({ success: true, hostId: 'print01', service: 'web', findings: [] });
    checkBtn().click();
    await settle();
    assert.equal(q('.network-view-notice').textContent, V.NO_FINDINGS_TEXT);
    checkImpl = async () => { put2(withFindings([F1])); return { success: true, hostId: 'print01', service: 'web', findings: [F1] }; };
    checkBtn().click();
    await settle();
    assert.ok(q('[data-finding="f1"]'));
    assert.doesNotMatch(document.body.textContent, /Nothing was found on that service/, 'the stale line is gone');
});

test('R1 m5: a changed refetch redraws while a confirm is out, and the control stays disabled and reads Confirming', async () => {
    setup(SWEPT([withFindings([F1])]));
    await open();
    const gate = deferred();
    confirmImpl = async () => { await gate.p; return { success: true, finding: { ...F1, status: 'confirmed', needs: [] } }; };
    confirmBtn('f1').click();
    await settle();
    answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([{ ...withFindings([F1]), name: 'Renamed printer' }]) };
    await view().refetch({ sync: false });
    await settle();
    assert.match(q('[data-host-id="print01"]').textContent, /Renamed printer/, 'a redraw happened');
    assert.equal(confirmBtn('f1').disabled, true);
    assert.match(confirmBtn('f1').textContent, /Confirming/);
    gate.resolve();
    await settle();
});

test('R1 m5: the same for a pending Check', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    const gate = deferred();
    checkImpl = async () => { await gate.p; return { success: true, hostId: 'print01', service: 'web', findings: [] }; };
    checkBtn().click();
    await settle();
    answer.footholds[0] = { ...answer.footholds[0], ...SWEPT([{ ...SWEPT_PRINTER, name: 'Renamed printer' }]) };
    await view().refetch({ sync: false });
    await settle();
    assert.match(q('[data-host-id="print01"]').textContent, /Renamed printer/);
    assert.equal(checkBtn().disabled, true);
    assert.match(checkBtn().textContent, /Checking/);
    gate.resolve();
    await settle();
});

test('R1 m6a: a slow refetch answering without findings after the check answer does not wipe them', async () => {
    setup(SWEPT([SWEPT_PRINTER]));
    await open();
    const slow = deferred();
    let first = true;
    window.ApiClient.network = async (id) => {
        if (!first) throw new Error('the follow-up refetch fails: only the stale answer can wipe the findings');
        first = false;
        calls.push(['network', id]);
        const snapshot = JSON.parse(JSON.stringify(answer));
        await slow.p;
        return snapshot;
    };
    const stale = view().refetch({ sync: false });
    await settle(10);
    checkImpl = async () => { put2(withFindings([F1])); return { success: true, hostId: 'print01', service: 'web', findings: [F1] }; };
    const run = view().perform({ action: 'check', target: 'print01:web' });
    await settle(20);
    assert.ok(q('[data-finding="f1"]'), 'the findings are drawn');
    slow.resolve();
    await stale; await run; await settle();
    assert.ok(q('[data-finding="f1"]'), 'the stale answer did not wipe them');
});

test('R1 m6b: hooks for check and confirm fire on a refusal and a throw too, and a throwing hook strands nothing', async () => {
    setup(SWEPT([withFindings([F1])]));
    await open();
    const m = view();
    const log = [];
    m.onSent = (o) => log.push(['sent', o.action]);
    m.onEnded = (o, a) => log.push(['ended', o.action, a === null ? 'null' : a.reason]);
    checkImpl = async () => { throw Object.assign(new Error('x'), { status: 403, body: { success: false, reason: 'not_responding' } }); };
    confirmImpl = async () => { throw new Error('down'); };
    await m.perform({ action: 'check', target: 'print01:web' });
    await m.perform({ action: 'confirm', target: F1.id });
    assert.deepEqual(log, [['sent', 'check'], ['ended', 'check', 'not_responding'], ['sent', 'confirm'], ['ended', 'confirm', 'null']]);
    m.onEnded = () => { throw new Error('hook'); };
    await m.perform({ action: 'check', target: 'print01:web' }).catch(() => {});
    assert.equal(m.pending.size, 0);
});

test('R1 m6c: an unconfirmed finding carrying needs and falseBecause draws the same as one without, in the DOM and getTestState', async () => {
    const leaky = { ...F1, needs: [{ kind: 'item', label: 'LEAKNEED', met: true }], falseBecause: 'LEAKREASON', fixed: true };
    setup(SWEPT([withFindings([leaky])]));
    await open();
    const withLeak = q('[data-finding="f1"]').outerHTML;
    assert.doesNotMatch(document.body.textContent, /LEAKNEED|LEAKREASON|Fixed/);
    assert.equal(q('[data-finding="f1"] .network-need'), null);
    const st = view().getTestState().rows[0].findings[0];
    assert.deepEqual([st.needs, st.reason, st.fixed], [[], null, false]);
    setup(SWEPT([withFindings([F1])]));
    await open();
    assert.equal(q('[data-finding="f1"]').outerHTML, withLeak);
});

test('R1 m6d and m7: an unknown class is drawn as sent; an unknown or spaced severity adds no class and is still text', async () => {
    const odd = { ...F1, class: 'odd_class', severity: 'high network-finding-confirmed' };
    setup(SWEPT([withFindings([odd])]));
    await open();
    assert.match(q('[data-finding="f1"] .network-finding-class').textContent, /odd_class/);
    const chip = q('[data-finding="f1"] .network-finding-severity');
    assert.deepEqual([...chip.classList], ['network-finding-severity'], 'no class from the sender');
    assert.equal(chip.textContent, 'high network-finding-confirmed');
    assert.equal(q('[data-finding="f1"]').classList.contains('network-finding-unconfirmed'), true);
    setup(SWEPT([withFindings([F1])]));
    await open();
    assert.ok(q('[data-finding="f1"] .network-severity-high'));
});

test('R1 m6e: focus stays in the tile after a confirm, and scroll is kept after a check and a confirm', async () => {
    setup(SWEPT([withFindings([F1, F2])]));
    await open();
    const area = view().gameContainer;
    confirmImpl = async (fid, p) => ({ success: true, finding: { ...(p.findingId.endsWith('login') ? F1 : F2), status: 'confirmed', needs: [] } });
    area.scrollTop = 37;
    confirmBtn('f1').focus();
    confirmBtn('f1').click();
    await settle();
    assert.ok(q('[data-service="web"]').contains(document.activeElement), 'focus is inside the tile');
    assert.equal(area.scrollTop, 37);
    checkImpl = async () => ({ success: true, already: true, hostId: 'print01', service: 'web', findings: [] });
    area.scrollTop = 21;
    checkBtn().focus();
    checkBtn().click();
    await settle();
    assert.equal(area.scrollTop, 21);
});

test('R1 m6f: a repeat check and a repeat confirm (already) keep the alias and add no row', async () => {
    setup(SWEPT([withFindings([F1])]));
    await open();
    checkImpl = async () => ({ success: true, already: true, hostId: 'print01', service: 'web', findings: [F1] });
    await view().perform({ action: 'check', target: 'print01:web' });
    assert.equal(document.querySelectorAll('[data-finding]').length, 1);
    assert.ok(q('[data-finding="f1"]'));
    const conf = { ...F1, status: 'confirmed', needs: [] };
    confirmImpl = async () => { put2(withFindings([conf])); return { success: true, already: true, finding: conf }; };
    await view().perform({ action: 'confirm', target: F1.id });
    await view().perform({ action: 'confirm', target: F1.id });
    assert.equal(document.querySelectorAll('[data-finding]').length, 1);
    assert.equal(q('[data-finding="f1"]').dataset.status, 'confirmed');
});

test('R1 m6g: the guard turns away check and confirm when the API function is missing', async () => {
    setup(SWEPT([withFindings([F1])]));
    await open();
    delete window.ApiClient.networkCheck;
    assert.deepEqual(await view().perform({ action: 'check', target: 'print01:web' }), { sent: false });
    delete window.ApiClient.networkConfirm;
    assert.deepEqual(await view().perform({ action: 'confirm', target: F1.id }), { sent: false });
    assert.equal(view().pending.size, 0);
});
