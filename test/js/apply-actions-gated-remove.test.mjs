// Unit 10 of S5a (privilege plan P478-541): gated removes in systems/apply-actions.js, and the
// container desktop's refusal reaching pcSessions.noteDesktopRefused.
// Run: PATH=... bin/test-js test/js/apply-actions-gated-remove.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const real = (rel) => dataUrl(readFileSync(join(js, rel), 'utf8'));

const alerts = [];
const emitted = [];
globalThis.window = {
    gameState: { globalVariables: {} },
    gameScenario: {},
    lockRef: (i) => i?.opens_lock,
    eventDispatcher: { on() {}, off() {}, emit: (n, d) => emitted.push([n, d]) },
    gameAlert: (...a) => alerts.push(a),
    breakEscapeConfig: { gameId: 7 }
};
globalThis.document = { querySelector: () => null };
const { applyActions, sendInventoryRemove, plantsInFlight, itemsInFlight } = await import(dataUrl(readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(k, v) { window.gameState.globalVariables[k] = v; }')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`)));
const { default: pcPolicy } = await import(real('systems/pc-policy.js'));
window.pcPolicy = pcPolicy;

const quiet = async (fn) => {
    const l = console.log, w = console.warn, e = console.error; console.log = console.warn = console.error = () => {};
    try { return await fn(); } finally { console.log = l; console.warn = w; console.error = e; }
};
const tick = () => new Promise(r => setTimeout(r, 5));

const stick = (id, usbClass = 'storage') => ({ scenarioData: { id, type: 'usb', name: id, usbClass } });
const sock = { id: 'sock', policy: 'locked', requiresItem: 'usb' };
let held, removed, posts, plantAdminAnswer, responses;

function setup(items, scenario = { policies: { locked: { usb: 'blocked' } } }) {
    held = items.slice(); removed = []; posts = []; alerts.length = 0; emitted.length = 0; plantAdminAnswer = false;
    window.gameScenario = scenario;
    window.inventory = { get items() { return held; } };
    window.removeFromInventory = (it) => { removed.push(it.scenarioData.id); held = held.filter(h => h !== it); };
    window.pcSessions = { plantAdmin: () => plantAdminAnswer };
    window.gameConfirm = undefined;
    window.__ran = [];
    globalThis.fetch = async (url, init) => {
        posts.push(JSON.parse(init.body));
        const r = responses.shift();
        if (r instanceof Error) throw r;
        return r;
    };
}
const resp = (status, body) => ({ ok: status < 400, status, json: async () => { if (body === undefined) throw new Error('no body'); return body; } });
const marker = { type: 'set_global', key: 'after', value: true };
const ran = () => window.gameState.globalVariables.after === true;

test('gated remove under a lapsed override: the item stays, the rest never runs, the server line shows', async () => {
    setup([stick('s1')]); window.gameState.globalVariables.after = false;
    responses = [resp(422, { success: false, reason: 'usb_refused', error: 'The port is locked down.', message: 'Inventory error: boom' })];
    await quiet(async () => {
        applyActions([{ type: 'remove_item', item: 'usb' }, marker], { objectId: 'sock', objectData: sock });
        assert.ok(plantsInFlight.has('sock') && itemsInFlight.has('s1'), 'both sets filled from the send');
        await tick();
    });
    assert.deepEqual(removed, []);
    assert.equal(ran(), false);
    assert.deepEqual(alerts.map(a => a[0]), ['The port is locked down.']);
    assert.equal(emitted.filter(e => e[0] === 'usb_refused:sock').length, 1);
    assert.equal(plantsInFlight.size + itemsInFlight.size, 0, 'the sets empty on a refusal');
    assert.equal(posts[0].used_on, 'sock');
});

test('gated remove success: removes from the tray and runs the rest by a new call', async () => {
    setup([stick('s1')]); window.gameState.globalVariables.after = false;
    responses = [resp(200, { success: true })];
    await quiet(async () => {
        applyActions([{ type: 'remove_item', item: 'usb' }, marker], { objectId: 'sock', objectData: sock });
        assert.equal(ran(), false, 'nothing after it runs before the answer');
        await tick();
    });
    assert.deepEqual(removed, ['s1']);
    assert.equal(ran(), true);
    assert.equal(alerts.length, 0);
    assert.equal(plantsInFlight.size + itemsInFlight.size, 0);
});

test('the gate runs inside a confirm onConfirm (objectData is threaded)', async () => {
    setup([stick('s1')]); window.gameState.globalVariables.after = false;
    responses = [resp(422, { reason: 'usb_refused', error: 'No.' })];
    window.gameConfirm = () => Promise.resolve(true);
    await quiet(async () => {
        applyActions([{ type: 'confirm_action', text: 'go', onConfirm: [{ type: 'remove_item', item: 'usb' }, marker] }], { objectId: 'sock', objectData: sock });
        await tick(); await tick();
    });
    assert.equal(posts.length, 1);
    assert.deepEqual(removed, []);
    assert.equal(ran(), false);
    assert.deepEqual(alerts.map(a => a[0]), ['No.']);
});

test('two matching items, one refused and one accepted: the accepted one is spent', async () => {
    setup([stick('bad', 'storage'), stick('ok', 'charge')], { policies: { locked: { usb: 'storage_blocked' } } });
    responses = [resp(200, { success: true })];
    await quiet(async () => { applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'sock', objectData: sock }); await tick(); });
    assert.equal(posts[0].item.id, 'ok');
    assert.deepEqual(removed, ['ok']);
});

test('under an admin session the first match is picked', async () => {
    setup([stick('bad', 'storage'), stick('ok', 'charge')], { policies: { locked: { usb: 'storage_blocked' } } });
    plantAdminAnswer = true;
    responses = [resp(200, { success: true })];
    await quiet(async () => { applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'sock', objectData: sock }); await tick(); });
    assert.equal(posts[0].item.id, 'bad');
});

test('another refusal shows its error; a refusal with only a message, a 500 and a network failure show the generic line', async () => {
    const generic = 'That did not go through. Try again.';
    const cases = [
        [[resp(403, { error: 'Not yours.' })], 'Not yours.'],
        [[resp(422, { message: 'Inventory error: x' })], generic],
        [[resp(422)], generic],
        [[resp(500, { message: 'Inventory error: secret trace' }), resp(500, { message: 'Inventory error: secret trace' })], generic],
        [[new Error('net'), new Error('net')], generic]
    ];
    for (const [rs, line] of cases) {
        setup([stick('s1')]); window.gameState.globalVariables.after = false;
        responses = rs;
        await quiet(async () => { applyActions([{ type: 'remove_item', item: 'usb' }, marker], { objectId: 'sock', objectData: sock }); await tick(); await tick(); });
        assert.deepEqual(alerts.map(a => a[0]), [line]);
        assert.deepEqual(removed, []);
        assert.equal(ran(), false);
        assert.equal(emitted.filter(e => e[0].startsWith('usb_refused')).length, 0);
        assert.equal(plantsInFlight.size + itemsInFlight.size, 0);
        assert.ok(!alerts.some(a => /Inventory error/.test(a[0])));
    }
});

test('a second remove_item for an object in flight sends nothing', async () => {
    setup([stick('s1'), stick('s2')]);
    const releases = [];
    globalThis.fetch = (url, init) => { posts.push(JSON.parse(init.body)); return new Promise(r => { releases.push(() => r(resp(200, { success: true }))); }); };
    await quiet(async () => {
        applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'sock', objectData: sock });
        applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'sock', objectData: sock });
        assert.equal(posts.length, 1);
        // an item in flight is left out of another object's pick
        applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'other', objectData: { id: 'other', policy: 'locked' } });
        assert.equal(posts.length, 2);
        assert.equal(posts[1].item.id, 's2', 'the in-flight item is skipped');
        releases.forEach(f => f()); await tick();
    });
});

test('an in-flight remove_item stops the rest of its list: nothing runs before the answer; a refusal runs none', async () => {
    for (const [status, body, expectAfter] of [[422, { success: false, reason: 'usb_refused', error: 'USB devices are disabled on this PC.' }, false], [200, { success: true }, true]]) {
        setup([stick('s1')]);
        window.gameState.globalVariables = {};
        const sets = [];
        window.gameState.globalVariables.count = 0;
        const releases = [];
        globalThis.fetch = (url, init) => { posts.push(JSON.parse(init.body)); return new Promise(r => { releases.push(() => r(resp(status, body))); }); };
        const list = () => [{ type: 'remove_item', item: 'usb' }, { type: 'set_global', key: 'after', value: true }];
        await quiet(async () => {
            applyActions(list(), { objectId: 'sock', objectData: sock });
            applyActions(list(), { objectId: 'sock', objectData: sock });
            assert.equal(posts.length, 1);
            assert.equal(window.gameState.globalVariables.after, undefined, 'nothing after the remove ran, from either pass');
            releases.forEach(f => f()); await tick();
        });
        assert.equal(window.gameState.globalVariables.after === true, expectAfter, `status ${status}`);
        assert.equal(removed.length, expectAfter ? 1 : 0);
    }
});

test('a rejection after the answer (a throwing alert) is caught, not unhandled', async () => {
    setup([stick('s1')]);
    responses = [resp(422, { success: false, reason: 'usb_refused', error: 'No.' })];
    window.gameAlert = () => { throw new Error('alert boom'); };
    const seen = [];
    const onRej = (e) => seen.push(e);
    process.on('unhandledRejection', onRej);
    await quiet(async () => { applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'sock', objectData: sock }); await tick(); await tick(); });
    process.off('unhandledRejection', onRej);
    window.gameAlert = (...a) => alerts.push(a);
    assert.deepEqual(seen, []);
});

test('an ungoverned remove keeps today order and its fire-and-forget send', async () => {
    setup([stick('s1')]); window.gameState.globalVariables.after = false;
    responses = [resp(200, { success: true })];
    await quiet(async () => {
        applyActions([{ type: 'remove_item', item: 'usb' }, marker], { objectId: 'wall_port', objectData: { id: 'wall_port' } });
        assert.deepEqual(removed, ['s1'], 'removed at once');
        assert.equal(ran(), true, 'the rest ran in the same call');
        assert.equal(plantsInFlight.size, 0);
        await tick();
    });
    assert.equal(posts[0].used_on, 'wall_port');
    // and with no objectData at all
    setup([stick('s1')]); responses = [resp(200, {})];
    await quiet(async () => { applyActions([{ type: 'remove_item', item: 'usb' }], { objectId: 'sock' }); await tick(); });
    assert.deepEqual(removed, ['s1']);
});

test('sendInventoryRemove: withBody absent behaves as before; withBody returns the body', async () => {
    setup([]);
    responses = [resp(422, { error: 'x' })];
    assert.equal(await quiet(() => sendInventoryRemove('a', { gameId: 1 })), false);
    responses = [resp(422, { error: 'x' })];
    assert.deepEqual(await quiet(() => sendInventoryRemove('a', { gameId: 1, withBody: true })), { error: 'x' });
    responses = [resp(200, {})];
    assert.equal(await quiet(() => sendInventoryRemove('a', { gameId: 1, withBody: true })), true);
    responses = [resp(502, { error: 'x' }), resp(502, { error: 'x' })];
    assert.equal(await quiet(() => sendInventoryRemove('a', { gameId: 1, withBody: true })), false);
    assert.equal(posts.filter(p => p).length, 5);
});

// ---- the container desktop's refusal reaches pcSessions.noteDesktopRefused ----
async function containerClass() {
    let src = readFileSync(join(js, 'minigames/container/container-minigame.js'), 'utf8');
    const names = [];
    src = src.replace(/^import\s+\{([^}]*)\}\s+from\s+'[^']*';?\s*$/gm, (m, list) => { names.push(...list.split(',').map(s => s.trim()).filter(Boolean)); return ''; });
    const stubs = names.filter(n => n !== 'MinigameScene').map(n => `const ${n} = (...a) => ''; `).join('');
    const code = `class MinigameScene {} ${stubs}\n${src}`;
    return (await import(dataUrl(code))).ContainerMinigame;
}
test('a refused desktop reports its reason to pcSessions on every branch that keeps the session', async () => {
    const Cls = await containerClass();
    const calls = [];
    window.pcSessions = { noteDesktopRefused: (...a) => calls.push(a), dropLocal() {}, get() { return {}; }, takeEndedMessage() {} };
    window.gameId = 3;
    const run = async (reason, extra) => {
        const m = Object.create(Cls.prototype);
        Object.assign(m, { loginPcId: 'pc1', containerItem: { scenarioData: {} }, params: {}, complete() {}, noticeToToast() {}, networkDetail: () => ({ host: 'h' }) }, extra);
        globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ reason }) });
        return quiet(() => m.loadLoginDesktop());
    };
    await run('off', {});
    await run('not_responding', { remote: { footholdId: 'f1' } });
    await run('not_responding', { fromRoute: { fromPcId: 'pc0' } });
    assert.deepEqual(calls, [['pc1', 'off'], ['pc1', 'not_responding'], ['pc1', 'not_responding']]);
});

test('with the real mirror: off and not_responding clear access, another reason does not', async () => {
    const Cls = await containerClass();
    const { PcSessions } = await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8')
        .split("'../utils/sync-before-fetch.js'").join(`'${dataUrl('export async function syncBeforeFetch() {}')}'`)
        .split("'./mfa-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/mfa-client.js'), 'utf8'))}'`).split("'./helpdesk-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/helpdesk-client.js'), 'utf8'))}'`)));
    window.eventDispatcher = { emit() {} };
    const run = async (reason, extra) => {
        const sessions = new PcSessions();
        sessions.load({ pc1: { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password', access: 'admin' } }, ['pc1']);
        window.pcSessions = sessions;
        const m = Object.create(Cls.prototype);
        Object.assign(m, { loginPcId: 'pc1', containerItem: { scenarioData: {} }, params: {}, complete() {}, noticeToToast() {}, networkDetail: () => ({ host: 'h' }) }, extra);
        globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ reason }) });
        await quiet(() => m.loadLoginDesktop());
        return sessions.get('pc1')?.access;
    };
    assert.equal(await run('off', {}), undefined);
    assert.equal(await run('not_responding', { fromRoute: { fromPcId: 'pc0' } }), undefined);
    assert.equal(await run('unreachable', { fromRoute: { fromPcId: 'pc0' } }), 'admin');
});
