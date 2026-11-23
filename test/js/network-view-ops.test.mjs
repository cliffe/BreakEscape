// The network view's ops loop, S1 (ops core plan 5.3, 5.5, 11.3): Sweep on an unswept discovery
// block, Scan on a host row, service tiles, the one `perform` path with its pending guard and
// its two no-op hooks, the unplug guard folded into it, getTestState. The real view, base
// minigame and network-links.js run against jsdom; the API client is a stub that records calls.
// S2 and S3 add their actions to this file.
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
    'minigames/network-view/network-view-minigame.js']) copy(f);

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

let calls, answer, events, scanImpl, jacks;
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
    calls = []; events = []; scanImpl = null;
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
    assert.equal(tile.textContent, 'web · 80 · Brackley PrintPanel 2.0');
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
