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

test('"More below" follows the mounted skin at once: hidden on a switch to the Terminal, measured again on the way back', async () => {
    const h = await mount(opsBody(), { params: { skin: 'gui' } });
    const v = h.view();
    // jsdom has no layout: say the list runs past the bottom edge
    Object.defineProperty(v.gameContainer, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(v.gameContainer, 'clientHeight', { configurable: true, value: 100 });
    v.updateScrollCue();
    assert.equal(v.moreElement.hidden, false, 'shown in Panels');
    switchBtn(h).click();
    await settle();
    assert.equal(v.moreElement.hidden, true, 'hidden as the Terminal is mounted');
    switchBtn(h).click();
    await settle();
    assert.equal(v.moreElement.hidden, false, 'back in Panels');
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

const dropOps = (body) => { for (const b of body.footholds[0].networks) { delete b.ops; delete b.swept; } };
// the refetch itself is the one 'network' call; anything else is a move
const moves = (h) => h.calls.filter(c => c[0] !== 'network');
const typeLine = async (h, text) => {
    const input = q(h, '.network-term-input');
    input.value = text;
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
};

test('B1: a refetch that leaves no ops block keeps the Terminal, its log and the switch for the life of the view', async () => {
    const body = opsBody();
    const h = await mount(body, { params: { skin: 'cli' } });
    assert.ok(switchBtn(h));
    const before = lines(h).slice();
    // `swept` is served only for a discovery network, itself part of the ops layer: a view with neither has none
    dropOps(body);
    await h.view().refetch({ sync: false });
    await settle();
    assert.ok(switchBtn(h), 'the switch stays');
    assert.ok(q(h, '.network-term'), 'the Terminal stays mounted');
    assert.equal(h.view().getTestState().skin, 'cli');
    assert.deepEqual(lines(h).slice(0, before.length), before, 'the log keeps its lines');
    assert.equal(document.activeElement, q(h, '.network-term-input'), 'the prompt has the focus');
    assert.deepEqual(moves(h), [], 'nothing was sent');
    h.end();
});

test('B1: the same refetch from Panels keeps the switch and a press still reaches the Terminal', async () => {
    const body = opsBody();
    const h = await mount(body, { params: { skin: 'gui' } });
    dropOps(body);
    await h.view().refetch({ sync: false });
    await settle();
    assert.ok(switchBtn(h), 'the switch stays');
    assert.equal(h.view().getTestState().skin, 'gui');
    switchBtn(h).click();
    await settle();
    assert.equal(h.view().getTestState().skin, 'cli');
    assert.ok(q(h, '.network-term'));
    assert.deepEqual(moves(h), []);
    h.end();
});

test('B1: typed show and unplug still work on a view that has lost its ops block', async () => {
    const body = opsBody();
    const h = await mount(body, { unplug: true, params: { skin: 'cli' } });
    dropOps(body);
    await h.view().refetch({ sync: false });
    await settle();
    const n = lines(h).length;
    await typeLine(h, 'show');
    assert.ok(lines(h).length > n, 'show wrote lines');
    assert.deepEqual(moves(h), [], 'show sends nothing');
    await typeLine(h, 'unplug');
    assert.equal(moves(h).length, 1, 'unplug was sent');
    h.end();
});

test('B1: a view opened afresh with no ops block is Panels with no switch', async () => {
    const body = opsBody();
    const first = await mount(body, { params: { skin: 'cli' } });
    dropOps(body);
    await first.view().refetch({ sync: false });
    await settle();
    first.end();
    const h = await mount(noOpsBody(), { params: { skin: 'cli' } });
    assert.equal(switchBtn(h), null);
    assert.equal(q(h, '.network-term'), null);
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

test('R2-9: a sweep that lists hosts with no services leaves the player in the Terminal, log kept', async () => {
    const body = clone(loadFixture('discovery_unswept'));
    const h = await mount(body, { params: { skin: 'cli' }, hold: true });
    q(h, '[data-network-id] [data-action="sweep"]').click();
    await settle(2);
    const net = body.footholds[0].networks[0];
    net.swept = true;
    net.hosts = [
        { id: 'quiet01', kind: 'pc', name: 'Quiet one', host: 'QUIET01', sprite: 'pc_desktop', headless: true, remoteSignIn: false },
        { id: 'quiet02', kind: 'pc', name: 'Quiet two', host: 'QUIET02', sprite: 'pc_desktop', headless: true, remoteSignIn: false }
    ];
    await h.release({ success: true, network: { id: net.id, swept: true, hosts: net.hosts } });
    await settle(4);
    assert.equal(h.view().getTestState().skin, 'cli', 'still the Terminal');
    assert.ok(q(h, '.network-term'));
    assert.ok(switchBtn(h), 'the switch is still there');
    assert.ok(lines(h).length > 1, 'the log is kept');
    h.end();
});

test('a view with no ops block and no sweep offer never builds the Terminal (viewHasOps)', () => {
    assert.equal(scene.viewHasOps(noOpsBody().footholds[0]), false);
    assert.equal(scene.viewHasOps(clone(loadFixture('discovery_unswept')).footholds[0]), true);
});

test('R1-C5: a ; line with local output and a move writes its echo first, once', async () => {
    const t = await mount(opsBody(), { params: { skin: 'cli' } });
    const input = q(t, '.network-term-input');
    input.value = 'show; nmap -sV print02';
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    const log = lines(t);
    const echoes = log.map((l, i) => [l, i]).filter(([l]) => l.startsWith('$ show; nmap -sV print02'));
    assert.equal(echoes.length, 1, JSON.stringify(log));
    const listing = log.findIndex(l => l.includes('HOST'));
    assert.ok(listing > echoes[0][1], 'the listing comes after the echo');
    assert.ok(t.record().calls.length >= 1, 'the move was sent');
    t.end();
});

test('R1-C7: a typed panels line leaves the focus on the switch, not on the page body', async () => {
    const h = await mount(opsBody(), { params: { skin: 'cli' } });
    const input = q(h, '.network-term-input');
    input.focus();
    input.value = 'panels';
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    assert.equal(h.view().getTestState().skin, 'gui');
    assert.equal(document.activeElement, switchBtn(h));
    h.end();
});

test('R1-C10: the no-reply row sentence lasts in the Terminal only as long as it does on a Panels row', async () => {
    const NO_REPLY = TEXTS.REQUEST_FAILED_TEXT;
    const h = await mount(opsBody(), { params: { skin: 'cli' }, hold: true });
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    await h.release(new Error('no reply'));
    await settle();
    const showText = async () => {
        const input = q(h, '.network-term-input');
        const before = lines(h).length;
        input.value = 'show';
        input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
        await settle();
        return lines(h).slice(before).join('\n');
    };
    assert.ok((await showText()).includes(NO_REPLY), 'still held right after the failure');
    // a switch and a return draws the list again: the sentence is gone, as a Panels redraw removes its node
    switchBtn(h).click(); await settle();
    switchBtn(h).click(); await settle();
    assert.ok(!(await showText()).includes(NO_REPLY), 'gone after the next draw');
    h.end();
});

test('R1-C16: a hand-over keeps the log on the same trip number and drops it on the next trip', async () => {
    const id = (h) => h.view().footholdId;
    let h = await mount(opsBody(), { params: { skin: 'gui' }, tripSeq: 7 });
    const fid = id(h);
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    h.view().exitReason = 'handover';
    h.end();
    assert.ok(FMT.logFor(fid), 'kept for the return');
    h = await mount(opsBody(), { params: { skin: 'cli' }, tripSeq: 7 });
    assert.ok(lines(h).some(l => l.includes('print02')), 'same trip: the earlier move is shown');
    h.view().exitReason = 'handover';
    h.end();
    h = await mount(opsBody(), { params: { skin: 'cli' }, tripSeq: 8 });
    assert.ok(!lines(h).some(l => l.includes('print02')), 'a later trip starts with its own log');
    h.end();
});

test('R1-C16: a request that gets no reply draws its row sentence in Panels through the real press path', async () => {
    const h = await mount(opsBody(), { params: { skin: 'gui' }, hold: true });
    q(h, '[data-host-id="print02"] [data-action="scan"]').click();
    await settle();
    await h.release(new Error('no reply'));
    await settle();
    const row = q(h, '[data-host-id="print02"] .network-row-notice') || q(h, '.network-row-notice');
    assert.ok(row, 'the row sentence');
    assert.equal(row.textContent, TEXTS.REQUEST_FAILED_TEXT);
    h.end();
});

test('R1-C17: a sign-in that opens nothing leaves no echo line', async () => {
    const body = opsBody();
    const h = await mount(body, { params: { skin: 'cli' } });
    const row = [...h.view().allRows()].find(r => r.kind === 'pc');
    assert.ok(row, 'the fixture has a computer');
    window.openRemoteSignIn = undefined;
    const before = lines(h).length;
    const done = h.view().dispatch({ action: 'sign-in', target: row.id, ids: { hostId: row.id } }, `sign in ${row.id}`);
    await settle();
    assert.equal(done, false);
    assert.equal(lines(h).length, before, JSON.stringify(lines(h).slice(before)));
    h.end();
});

test('E7: a typed sign-in the grammar refuses prints its echo and the row sentence, and sends nothing (the brief: a typed line that does not resolve logs echo and reply)', async () => {
    const body = opsBody();
    for (const r of body.footholds[0].hosts) if (r.kind === 'pc') r.remoteSignIn = false;
    const h = await mount(body, { params: { skin: 'cli' } });
    const row = [...h.view().allRows()].find(r => r.kind === 'pc' && r.remoteSignIn === false);
    assert.ok(row, 'a host with remote sign-in off');
    const input = q(h, '.network-term-input');
    const before = lines(h).length;
    input.value = `signin ${row.id}`;
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    const added = lines(h).slice(before);
    assert.ok(added[0].startsWith('$') && added[0].includes(`signin ${row.id}`), JSON.stringify(added));
    assert.equal(added.length, 2, JSON.stringify(added));
    assert.equal(added[1], 'There is nothing more to find out here.', 'the reply is the refusal sentence the model gives');
    assert.deepEqual(h.record().calls, [], 'no request');
    h.end();
});
