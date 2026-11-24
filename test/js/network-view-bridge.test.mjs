// window.__test.network (Ops S6 unit 18): the network view's test bridge, driven over the real scene with both
// the real Panels and the real Terminal. Every move is a click or a typed line on the mounted skin.
// Run with: bin/test-js test/js/network-view-bridge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mount, loadFixture, settle, imp } from './support/network-view-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// The bridge file with the two modules it imports, in a folder of its own
const dir = mkdtempSync(join(tmpdir(), 'network-bridge-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const f of ['systems/test-bridge/network.js', 'systems/test-bridge/input.js', 'minigames/network-view/skin-choice.js']) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), readFileSync(join(js, f), 'utf8'));
}
for (const n of ['PointerEvent', 'MouseEvent', 'KeyboardEvent', 'Event']) globalThis[n] = window[n] || window.MouseEvent;
globalThis.requestAnimationFrame = (fn) => window.requestAnimationFrame(fn);
const stored = new Map();
Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (k) => (stored.has(k) ? stored.get(k) : null), setItem: (k, v) => { stored.set(k, String(v)); }, removeItem: (k) => { stored.delete(k); }
} });
const { networkBridge: net } = await import(pathToFileURL(join(dir, 'systems/test-bridge/network.js')));
const choice = await imp('minigames/network-view/skin-choice.js');

const clone = (v) => JSON.parse(JSON.stringify(v));
const opsBody = () => clone(loadFixture('swept_hosts'));
const techBody = () => clone(loadFixture('techniques'));
const q = (h, sel) => h.view().container.querySelector(sel);
const rejects = (p, re) => assert.rejects(p, re);

test.beforeEach(() => { choice.forgetPress(); stored.clear(); delete window.gameScenario; });

test('state() is equal in both skins apart from the skin, and run names a path', async () => {
    const states = {};
    for (const skin of ['gui', 'cli']) {
        const h = await mount(opsBody(), { params: { skin } });
        states[skin] = net.state();
        assert.equal(states[skin].skin, skin);
        assert.equal(states[skin].hasSwitch, true);
        assert.equal(net.skin(), skin);
        assert.ok(states[skin].offers.length > 0);
        assert.ok(states[skin].offers.every(o => typeof o.command === 'string'), 'the Terminal line is there in both');
        h.end();
    }
    assert.deepEqual({ ...states.gui, skin: null }, { ...states.cli, skin: null });
    assert.equal(net.skin(), null);
    assert.deepEqual(net.state().offers, []);
});

test('run: a scan by button and by typed line sends the same request in either skin', async () => {
    const sent = {};
    for (const [skin, path] of [['gui', undefined], ['gui', 'button'], ['cli', 'button'], ['cli', undefined], ['cli', 'typed']]) {
        const h = await mount(opsBody(), { params: { skin } });
        const offer = net.state().offers.find(o => o.action === 'scan' && o.ids.hostId === 'print02');
        const out = await net.run(offer, path ? { path } : {});
        assert.equal(out.ok, true);
        assert.equal(out.sent, true);
        assert.equal(out.path, path || (skin === 'cli' ? 'typed' : 'button'));
        assert.ok(out.answer && typeof out.answer === 'object', 'the server\'s answer');
        sent[`${skin}-${path}`] = h.record().calls;
        h.end();
    }
    const first = Object.values(sent)[0];
    assert.equal(first.length, 1);
    for (const [k, v] of Object.entries(sent)) assert.deepEqual(v, first, k);
});

test('run rejects a path of the other skin, an offer not in the list and a pending offer, and records no call', async () => {
    for (const skin of ['gui', 'cli']) {
        const h = await mount(opsBody(), { params: { skin } });
        const offer = net.state().offers.find(o => o.action === 'scan');
        await rejects(net.run(offer, { path: skin === 'gui' ? 'typed' : 'select' }), /does not belong to the/);
        await rejects(net.run({ action: 'scan', target: 'nowhere', ids: { hostId: 'nowhere' } }), /not in the list/);
        await rejects(net.run({ action: 'scan', target: 'nowhere' }, { path: 'button' }), /not in the list/);
        assert.deepEqual(h.record().calls, [], `${skin}: nothing sent`);
        assert.deepEqual(h.opened, []);
        h.end();
    }
    // Pending: the first press is held, the second is refused
    const h = await mount(opsBody(), { params: { skin: 'gui' }, hold: true });
    const offer = net.state().offers.find(o => o.action === 'scan');
    const first = net.run(offer, { timeoutMs: 2000 });
    await settle();
    const now = net.state().offers.find(o => o.action === 'scan' && o.target === offer.target);
    assert.equal(now.pending, true);
    await rejects(net.run(now), /is pending/);
    assert.equal(h.record().calls.length, 1, 'only the first press was sent');
    await h.release();
    assert.equal((await first).sent, true);
    h.end();
});

test('run unfolds a folded strip first', async () => {
    const h = await mount(opsBody(), { params: { skin: 'cli' } });
    q(h, '.network-term-fold').click();
    assert.equal(h.view().getTestState().folded, true);
    const offer = net.state().offers.find(o => o.action === 'scan');
    await net.run(offer, { path: 'button' });
    assert.equal(h.view().getTestState().folded, false);
    assert.equal(h.record().calls.length, 1);
    h.end();
});

test('run drives a use in both skins (select path in Panels; button and typed in the Terminal)', async () => {
    const calls = {};
    for (const [skin, path] of [['gui', 'select'], ['gui', undefined], ['cli', 'button'], ['cli', 'typed']]) {
        const h = await mount(techBody(), { params: { skin } });
        const offer = net.state().offers.find(o => o.action === 'use');
        assert.ok(offer, 'a use offer');
        const out = await net.run(offer, path ? { path } : {});
        assert.equal(out.sent, true);
        calls[`${skin}-${path}`] = h.record().calls;
        h.end();
    }
    const first = Object.values(calls)[0];
    assert.equal(first.length, 1);
    assert.equal(first[0][0], 'technique');
    for (const [k, v] of Object.entries(calls)) assert.deepEqual(v, first, k);
});

test('setSkin presses the header switch and sends nothing; skin() and log() follow', async () => {
    const h = await mount(opsBody(), { params: { skin: 'gui' } });
    assert.deepEqual(net.log(), []);
    assert.equal((await net.setSkin('cli')).skin, 'cli');
    assert.equal(net.skin(), 'cli');
    assert.ok(net.log().length >= 1, 'the Terminal log');
    assert.equal((await net.setSkin('cli')).changed, false);
    assert.equal((await net.setSkin('gui')).skin, 'gui');
    assert.deepEqual(net.log(), []);
    await rejects(net.setSkin('green'), /not a skin/);
    assert.deepEqual(h.record().calls, []);
    h.end();
    const p = await mount(clone(loadFixture('plain')), { params: { skin: 'cli' } });
    assert.equal(net.state().hasSwitch, false);
    await rejects(net.setSkin('cli'), /no switch/);
    p.end();
});

test('type() types a line and presses Enter; the log shows it', async () => {
    const h = await mount(opsBody(), { params: { skin: 'cli' } });
    await net.type('help');
    assert.ok(net.log().some(l => l.includes('help')), 'the echo');
    assert.deepEqual(h.record().calls, []);
    await net.type('scan print02');
    assert.equal(h.record().calls.length, 1);
    h.end();
    const g = await mount(opsBody(), { params: { skin: 'gui' } });
    await rejects(net.type('help'), /Terminal is not on screen/);
    g.end();
});

test('storePick writes the key and presses nothing, with or without a view open', async () => {
    assert.equal(net.skin(), null);
    assert.deepEqual(net.storePick('cli'), { ok: true, name: 'cli' });
    assert.equal(stored.get(choice.STORAGE_KEY), 'cli');
    assert.equal(choice.pressed(), null, 'no press recorded');
    assert.equal(net.storePick('green').ok, false);
    const h = await mount(opsBody(), { params: { skin: 'gui' } });
    assert.equal(net.storePick('gui').ok, true);
    assert.equal(stored.get(choice.STORAGE_KEY), 'gui');
    assert.equal(net.skin(), 'gui', 'the view did not change');
    assert.equal(choice.pressed(), null);
    assert.deepEqual(h.record(), { calls: [], opened: [], toasts: [], events: [] });
    h.end();
});

test('the bridge names no server call or core function', () => {
    const src = readFileSync(join(js, 'systems/test-bridge/network.js'), 'utf8');
    for (const word of ['fetch(', 'ApiClient', 'APIClient', 'networkLinks', '.perform(', 'pendingKey', 'innerHTML'])
        assert.ok(!src.includes(word), word);
    const idx = readFileSync(join(js, 'systems/test-bridge/index.js'), 'utf8');
    assert.match(idx, /import \{ networkBridge \} from '\.\/network\.js';/);
    assert.match(idx, /\bnetwork: networkBridge,/);
});
