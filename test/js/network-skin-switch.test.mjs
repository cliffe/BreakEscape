// The scene with two skins (Ops S6 unit 15), driven with the real scene, the real Terminal renderer and the
// real skin-choice.js: the switch, a switch of skin sending nothing, the same offers sent from either skin,
// the log surviving a switch, the header body cleared, and a view with no ops block never building the Terminal.
// Run with: node test/js/network-skin-switch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mount, loadFixture, settle, imp } from './support/network-view-harness.mjs';

const NV = 'minigames/network-view/';
const { TerminalRenderer } = await imp(`${NV}network-view-terminal.js`);
const choice = await imp(`${NV}skin-choice.js`);
const FMT = await imp(`${NV}terminal-format.js`);
const TEXTS = await imp(`${NV}view-texts.js`);
const scene = await imp(`${NV}network-view-minigame.js`);

const clone = (v) => JSON.parse(JSON.stringify(v));

// Counts what the Terminal is asked to do: a mount, and a construction (its id counter moves once per new one)
let mounts = 0;
const realMount = TerminalRenderer.prototype.mount;
TerminalRenderer.prototype.mount = function (...a) { mounts += 1; return realMount.apply(this, a); };
const built = () => Number(new TerminalRenderer()._id.split('-').pop());

/** An ops view: the swept_hosts fixture with its printers, and a second, unscanned one to scan. */
const opsBody = () => clone(loadFixture('swept_hosts'));
const noOpsBody = () => clone(loadFixture('plain'));
const q = (h, sel) => h.view().container.querySelector(sel);
const qa = (h, sel) => [...h.view().container.querySelectorAll(sel)];
const lines = (h) => h.view().getTestState().log;
const switchBtn = (h) => q(h, '[data-skin-switch]');

test.beforeEach(() => { choice.forgetPress(); delete window.gameScenario; });

test('open in each skin: the skin, the switch with the other skin\'s name, and the renderer that is there', async () => {
    const g = await mount(opsBody(), { params: { skin: 'gui' } });
    assert.equal(g.view().getTestState().skin, 'gui');
    assert.equal(switchBtn(g).textContent, TEXTS.SKIN_LABELS.cli);
    assert.equal(switchBtn(g).dataset.skinSwitch, 'cli');
    assert.ok(q(g, '[data-host-id]'), 'rows');
    assert.equal(q(g, '.network-term'), null);
    g.end();

    const c = await mount(opsBody(), { params: { skin: 'cli' } });
    const st = c.view().getTestState();
    assert.equal(st.skin, 'cli');
    assert.ok(Array.isArray(st.log) && st.log.length >= 1, 'the opening line');
    assert.equal(switchBtn(c).textContent, TEXTS.SKIN_LABELS.gui);
    assert.ok(q(c, '.network-term'));
    assert.equal(q(c, '.network-view-header-body').textContent, '', 'the header body is cleared');
    c.end();
});

test('a scene handed no skin is Panels only with no switch', async () => {
    const h = await mount(opsBody());
    assert.equal(switchBtn(h), null);
    assert.equal(h.view().getTestState().skin, 'gui');
    h.end();
});

test('a view with no ops block: no switch, Panels whatever the choice, the Terminal never built, today\'s state keys', async () => {
    const before = built();
    const mountsBefore = mounts;
    const h = await mount(noOpsBody(), { params: { skin: 'cli' } });
    assert.equal(switchBtn(h), null);
    assert.equal(q(h, '.network-term'), null);
    assert.ok(!('skin' in h.view().getTestState()), 'no skin key');
    h.end();
    assert.equal(mounts, mountsBefore, 'the Terminal was not mounted');
    assert.equal(built(), before + 1, 'the Terminal was not constructed (only the probe above)');
});

test('switch both ways and back: the same rows, one renderer at a time, and nothing sent or emitted', async () => {
    const h = await mount(opsBody(), { params: { skin: 'gui' } });
    const rows = clone(h.view().getTestState().rows);
    for (const want of ['cli', 'gui', 'cli', 'gui']) {
        switchBtn(h).click();
        await settle();
        const st = h.view().getTestState();
        assert.equal(st.skin, want);
        assert.deepEqual(st.rows.map(r => r.id), rows.map(r => r.id));
        assert.equal(qa(h, '.network-term').length, want === 'cli' ? 1 : 0);
        assert.equal(switchBtn(h).dataset.skinSwitch, want === 'cli' ? 'gui' : 'cli');
        assert.equal(qa(h, '[data-skin-switch]').length, 1);
    }
    assert.deepEqual(h.calls, [], 'no request');
    assert.deepEqual(h.events, [], 'no event');
    assert.deepEqual(h.opened, []);
    assert.equal(h.view().status, 'ready');
    assert.equal(h.view()._reported, undefined, 'the trip is not ended');
    h.end();
});

test('a press of the switch is remembered for this page (skin-choice.js)', async () => {
    const h = await mount(opsBody(), { params: { skin: 'gui' } });
    assert.equal(choice.pressed(), null);
    switchBtn(h).click();
    assert.equal(choice.pressed(), 'cli');
    h.end();
});

test('the same press sends the same request from either skin, by a button and by a typed line', async () => {
    const sent = {};
    for (const skin of ['gui', 'cli']) {
        const h = await mount(opsBody(), { params: { skin } });
        q(h, '[data-host-id="print02"] [data-action="scan"]').click();
        await settle();
        sent[skin] = h.record().calls;
        h.end();
    }
    assert.equal(sent.gui.length, 1);
    assert.deepEqual(sent.cli, sent.gui);

    // Typed in the Terminal, and the press made after a switch from Panels
    const t = await mount(opsBody(), { params: { skin: 'cli' } });
    const input = q(t, '.network-term-input');
    input.value = 'scan print02';
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    assert.deepEqual(t.record().calls, sent.gui, 'typed');
    t.end();

    const s = await mount(opsBody(), { params: { skin: 'gui' } });
    switchBtn(s).click();
    await settle();
    q(s, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    assert.deepEqual(s.record().calls, sent.gui, 'after a switch');
    s.end();
});

test('a sweep is the same request in both skins', async () => {
    const body = opsBody();
    body.footholds[0].networks[0].swept = false;
    const sent = {};
    for (const skin of ['gui', 'cli']) {
        const h = await mount(clone(body), { params: { skin } });
        q(h, '[data-network-id="lab_net"] [data-action="sweep"]').click();
        await settle();
        sent[skin] = h.record().calls;
        h.end();
    }
    assert.equal(sent.gui.length, 1);
    assert.deepEqual(sent.cli, sent.gui);
});

test('the log survives a switch both ways, whichever skin made each move', async () => {
    // Both printers unscanned, so each has a Scan
    const body = opsBody();
    for (const list of [body.footholds[0].hosts, body.footholds[0].networks[0].hosts]) {
        const p1 = list.find(r => r.id === 'print01');
        delete p1.scanned; delete p1.services;
    }
    const h = await mount(body, { params: { skin: 'gui' }, hold: false });
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    switchBtn(h).click();
    await settle();
    const first = lines(h);
    assert.ok(first.some(l => l.includes('print02')), 'a move made in Panels is in the Terminal\'s log');
    // A move made in the Terminal, then back to Panels and to the Terminal again
    const before = first.length;
    q(h, '[data-host-id="print01"] [data-action="scan"]').click();
    await settle();
    assert.ok(lines(h).some(l => l.includes('print01')), 'a move made in the Terminal');
    switchBtn(h).click();
    await settle();
    switchBtn(h).click();
    await settle();
    const after = lines(h);
    assert.ok(after.length > before);
    assert.ok(after.some(l => l.includes('print01')) && after.some(l => l.includes('print02')));
    for (const l of first) assert.ok(after.includes(l), `kept: ${l}`);
    h.end();
});

test('a Panels press writes the offer\'s command into the log (the same line the Terminal would echo)', async () => {
    const h = await mount(opsBody(), { params: { skin: 'gui' } });
    const log = FMT.logFor(h.view().footholdId);
    assert.ok(log, 'the log exists from the first ops view, in Panels');
    const before = log.lines.length;
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    const text = log.lines.slice(before).map(l => l.map(s => s.text).join(''));
    assert.ok(text.some(t => t === '$ nmap -sV print02'), JSON.stringify(text));
    h.end();
});

test('a typed move leaves the same echo line as a press', async () => {
    const h = await mount(opsBody(), { params: { skin: 'cli' } });
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    assert.equal(lines(h).filter(l => l === '$ nmap -sV print02').length, 1);
    h.end();
});

test('the pending set carries across a switch and the answer lands in the skin then mounted', async () => {
    const h = await mount(opsBody(), { params: { skin: 'cli' }, hold: true });
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    assert.equal(h.calls.length, 1);
    const pendingKeys = h.view().getTestState().pending;
    assert.equal(pendingKeys.length, 1);
    switchBtn(h).click();
    await settle();
    assert.deepEqual(h.view().getTestState().pending, pendingKeys, 'still pending in Panels');
    assert.equal(h.calls.length, 1, 'no second request');
    // The scan button is disabled while pending, so a second press sends nothing
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    assert.equal(h.calls.length, 1);
    await h.release({ success: false, reason: 'not_found' });
    assert.equal(h.view().getTestState().pending, undefined);
    assert.equal(h.view().getTestState().skin, 'gui');
    h.end();
});

test('Panels\' header lines come back when Panels is mounted again; the Terminal draws none of them', async () => {
    const h = await mount(opsBody(), { unplug: true, params: { skin: 'gui' } });
    assert.ok(q(h, '[data-unplug]'), 'Panels: Unplug in the header');
    switchBtn(h).click();
    await settle();
    assert.equal(q(h, '.network-view-header-body').textContent.trim(), '', 'header body cleared');
    assert.equal(qa(h, '[data-unplug]').length, 1, 'the Terminal\'s own Unplug command');
    assert.ok(q(h, '.network-term [data-unplug]'));
    switchBtn(h).click();
    await settle();
    assert.ok(q(h, '.network-view-header-body [data-unplug]'), 'Unplug in the header again');
    assert.deepEqual(h.calls, []);
    h.end();
});

test('a refetch that leaves no ops block removes the switch and falls back to Panels', async () => {
    const body = opsBody();
    const h = await mount(body, { params: { skin: 'cli' } });
    assert.ok(switchBtn(h));
    for (const b of body.footholds[0].networks) delete b.ops;
    await h.view().refetch({ sync: false });
    await settle();
    assert.equal(switchBtn(h), null);
    assert.equal(q(h, '.network-term'), null);
    assert.ok(q(h, '[data-host-id]'));
    assert.ok(!('skin' in h.view().getTestState()));
    h.end();
});

test('a refetch that changes the rows adds the change line in the Terminal, and none when nothing changed', async () => {
    const body = opsBody();
    const h = await mount(body, { params: { skin: 'cli' } });
    const n = lines(h).length;
    await h.view().refetch({ sync: false });
    await settle();
    assert.equal(lines(h).length, n, 'nothing changed');
    body.footholds[0].hosts.push({ id: 'new_pc', kind: 'pc', name: 'New PC', host: 'LAB-09', sprite: 'pc_desktop', headless: false, remoteSignIn: true });
    body.footholds[0].networks[0].hosts.push(body.footholds[0].hosts[body.footholds[0].hosts.length - 1]);
    await h.view().refetch({ sync: false });
    await settle();
    assert.equal(lines(h).length, n + 1);
    assert.equal(lines(h)[n], FMT.CHANGE_LINE_TEXT);
    h.end();
});

test('the log is gone after the trip ends, and stays through a hand-over', async () => {
    let h = await mount(opsBody(), { params: { skin: 'gui' } });
    const id = h.view().footholdId;
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    h.view().exitReason = 'handover';
    h.end();
    assert.ok(FMT.logFor(id), 'kept for the return');
    h = await mount(opsBody(), { params: { skin: 'cli' } });
    assert.ok(lines(h).some(l => l.includes('print02')), 'the return shows the earlier move');
    h.end();
    assert.equal(FMT.logFor(id), null, 'ended with the trip');
});

test('the starter works the skin out and passes it to the scene', async () => {
    let params = null;
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (t, c, p) => { params = p; return null; } };
    window.networkLinks = { get: () => ({ name: 'Box' }) };
    scene.startNetworkViewMinigame('f1');
    assert.equal(params.skin, 'gui', 'nothing chosen');
    window.gameScenario = { networkView: { defaultSkin: 'cli' } };
    scene.startNetworkViewMinigame('f1');
    assert.equal(params.skin, 'cli', 'the scenario default');
    choice.rememberPress('gui', { storage: null });
    scene.startNetworkViewMinigame('f1');
    assert.equal(params.skin, 'gui', 'a press beats the default');
    assert.equal(scene.startingSkin(), 'gui');
});

test('before the first sweep (no block marked ops yet) the Terminal is there, with the sweep, and stays after the answer', async () => {
    const body = clone(loadFixture('discovery_unswept'));
    assert.ok(!body.footholds[0].networks.some(b => b.ops === true), 'the fixture has no ops block yet');
    const h = await mount(body, { params: { skin: 'cli' }, hold: true });
    assert.equal(h.view().getTestState().skin, 'cli');
    assert.ok(q(h, '.network-term'), 'the Terminal is mounted');
    assert.ok(switchBtn(h), 'the switch is drawn');
    const sweep = q(h, '[data-network-id] [data-action="sweep"]');
    assert.ok(sweep, 'the sweep quick command');
    sweep.click();
    await settle(2);
    await h.release({ success: true, network: { id: 'lab_net', swept: true, hosts: [] } });
    await settle(2);
    assert.equal(h.view().getTestState().skin, 'cli');
    assert.ok(q(h, '.network-term'));
    h.end();
});

test('a view with no ops block and no sweep offer never builds the Terminal (viewHasOps)', () => {
    assert.equal(scene.viewHasOps(noOpsBody().footholds[0]), false);
    assert.equal(scene.viewHasOps(clone(loadFixture('discovery_unswept')).footholds[0]), true);
});
