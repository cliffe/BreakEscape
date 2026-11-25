// Ops core S3 (OPS_CORE_PLAN.md 5.4, 11.3): systems/pc-sessions.js and the access level of a session.
// `access` kept by load, publicSession and every sign-in path that can carry it, nothing added when
// absent; noteTechniqueSession (the meeting point of the network view and the mirror); remoteViewFoothold
// and heldAtKeyboard for each kind of copy; the locked screen look kept for a technique copy; and the two
// NPC events on a technique copy and on a remote password copy (nothing sent, nothing emitted, the desktop
// stays open) against a keyboard password copy, a claim and a guest claim (displaced as before).
// Run with: node test/js/pc-sessions-access.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
const { PcSessions } =
    await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8').split("'../utils/sync-before-fetch.js'").join(`'${dataUrl(readFileSync(join(js, 'utils/sync-before-fetch.js'), 'utf8'))}'`).split("'./mfa-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/mfa-client.js'), 'utf8'))}'`).split("'./helpdesk-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/helpdesk-client.js'), 'utf8'))}'`)));
const screenSrc = readFileSync(join(js, 'systems/screen-states.js'), 'utf8')
    .replace(/^import .*workstation-state\.js';$/m, 'const isWorkstation = () => true; const ownerOf = () => "owner";');
const { ScreenStates } = await import(dataUrl(screenSrc));

let events, calls, held;
function setup({ login } = {}) {
    events = []; calls = []; held = new Set(['f1']);
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.networkLinks = { get: (id) => (held.has(id) ? { id } : null) };
    window.ApiClient = {
        logout: async (pcId) => { calls.push(['logout', pcId]); return { success: true }; },
        login: async (pcId, fields) => login(pcId, fields),
        loginWithCredential: async (pcId, id, route) => login(pcId, { id, ...route })
    };
    return new PcSessions();
}
const named = (name) => events.filter(([n]) => n === name).map(([, d]) => d);
const settle = async () => { for (let i = 0; i < 3; i++) await new Promise(r => setTimeout(r, 0)); };
const TECH = { npcId: 'adm', username: 'adm', displayName: 'Admin', via: 'technique', remote: true, footholdId: 'f1', host: 'PC', access: 'admin' };

test('load and publicSession keep access "admin" and add nothing when it is absent', () => {
    const s = setup();
    s.load({ a: { ...TECH }, b: { ...TECH, access: undefined }, c: { npcId: 'x', username: 'x', displayName: 'X', via: 'password', access: 'user' } }, ['a', 'b', 'c']);
    assert.equal(s.get('a').access, 'admin');
    assert.equal('access' in s.get('b'), false);
    assert.equal('access' in s.get('c'), false, 'only admin is carried');
    assert.equal(s.list().find(x => x.pcId === 'a').access, 'admin');
});

test('noteTechniqueSession records a technique copy: pc_signed_in via technique, access kept, a null session ignored', () => {
    const s = setup();
    assert.equal(s.noteTechniqueSession('pc1', null), null);
    assert.equal(s.noteTechniqueSession('pc1', {}), null);
    assert.equal(s.has('pc1'), false);
    const out = s.noteTechniqueSession('pc1', { ...TECH });
    assert.equal(out.via, 'technique');
    assert.equal(out.access, 'admin');
    assert.equal(out.footholdId, 'f1');
    assert.equal(named('pc_signed_in').length, 1);
    assert.equal(named('pc_signed_in')[0].via, 'technique');
    assert.equal(s.remoteViewFoothold('pc1'), 'f1');
});

test('noteTechniqueSession drops the sessions the grant ended, with the token line for a token session (m1), and never the new one', async () => {
    const s = setup();
    s._replace('gone1', { npcId: 'a', username: 'a', displayName: 'A', via: 'password', remote: true, footholdId: 'f1', host: 'G1' });
    s._replace('gone2', { npcId: 'b', username: 'b', displayName: 'B', via: 'credential', kind: 'token', label: 'Token B', remote: true, footholdId: 'f1', host: 'G2' });
    events.length = 0;
    s.noteTechniqueSession('pc1', { ...TECH }, ['gone1', 'gone2', 'pc1'], ['gone2']);
    await settle();
    assert.equal(s.has('gone1'), false);
    assert.equal(s.has('gone2'), false);
    assert.equal(s.has('pc1'), true);
    const out = named('pc_signed_out');
    assert.deepEqual(out.map(d => d.pcId).sort(), ['gone1', 'gone2']);
    const reason = (id) => out.find(d => d.pcId === id).reason;
    assert.equal(reason('gone1'), 'link_dropped');
    assert.equal(reason('gone2'), 'token_expired', 'the token session ends with its own reason');
});

test('m2: a repeat grant of the same technique copy fires no sign-out and no second sign-in', () => {
    const s = setup();
    s.noteTechniqueSession('pc1', { ...TECH });
    events.length = 0;
    const out = s.noteTechniqueSession('pc1', { ...TECH });
    assert.equal(out.via, 'technique');
    assert.deepEqual(events, []);
    // a real step up at the same copy (not `already`) is a new grant: a sign-in fires, as before the fix round (R2-A1)
    s.noteTechniqueSession('pc1', { ...TECH, access: undefined });
    assert.equal(named('pc_signed_in').length, 1);
    assert.equal(s.get('pc1').access, undefined);
});

test('R2-A1: a step up from a technique user session to admin is not a repeat: sign-in event, endedPcIds honoured', async () => {
    const s = setup();
    s._replace('gone', { npcId: 'a', username: 'a', displayName: 'A', via: 'password', remote: true, footholdId: 'f1', host: 'G' });
    s.noteTechniqueSession('pc1', { ...TECH, access: undefined });
    events.length = 0;
    s.noteTechniqueSession('pc1', { ...TECH, access: 'admin' }, ['gone'], null, false);
    await settle();
    assert.equal(s.get('pc1').access, 'admin');
    assert.equal(named('pc_signed_in').length, 1);
    assert.equal(s.has('gone'), false, 'the answer\'s endedPcIds are dropped');
});

test('C1-3: a repeat grant at the same level (already: true) sets access in place and fires nothing, even after the level was dropped', async () => {
    const s = setup();
    s.noteTechniqueSession('pc1', { ...TECH, access: 'admin' });
    delete s.sessions.get('pc1').access;
    events.length = 0;
    s.noteTechniqueSession('pc1', { ...TECH, access: 'admin' }, ['other'], null, true);
    await settle();
    assert.equal(s.get('pc1').access, 'admin');
    assert.deepEqual(events, []);
});

test('m3: a credential sign-in and a claim copy the access level the server sent', async () => {
    const s = setup({ login: async (pcId, f) => (f.claim
        ? { success: true, npcId: 'o', username: 'o', displayName: 'O', via: 'claim', access: 'admin' }
        : { success: true, npcId: 'c', username: 'c', displayName: 'C', via: 'credential', access: 'admin' }) });
    const r = await s.signInWithCredential('pc1', 'cred1');
    assert.equal(r.ok, true);
    assert.equal(s.get('pc1').access, 'admin');
    const c = await s.claim('pc2');
    assert.equal(c.ok, true);
    assert.equal(s.get('pc2').access, 'admin');
});

test('remoteViewFoothold: the foothold for a technique copy that is still held; null once gone and for password, credential, claim and relay copies', () => {
    const s = setup();
    s._replace('t', { ...TECH });
    s._replace('p', { npcId: 'p', username: 'p', displayName: 'P', via: 'password', remote: true, footholdId: 'f1', host: 'P' });
    s._replace('cr', { npcId: 'c', username: 'c', displayName: 'C', via: 'credential', remote: true, footholdId: 'f1', host: 'C' });
    s._replace('cl', { npcId: 'o', username: 'o', displayName: 'O', via: 'claim' });
    s._replace('r', { npcId: 'h', username: 'h', displayName: 'H', via: 'credential', relay: true, host: 'R' });
    assert.equal(s.remoteViewFoothold('t'), 'f1');
    for (const id of ['p', 'cr', 'cl', 'r', 'nobody']) assert.equal(s.remoteViewFoothold(id), null, id);
    held.delete('f1');
    assert.equal(s.remoteViewFoothold('t'), null);
});

test('heldAtKeyboard is as today for every copy: any session but a relay', () => {
    const s = setup();
    s._replace('t', { ...TECH });
    s._replace('p', { npcId: 'p', username: 'p', displayName: 'P', via: 'password' });
    s._replace('r', { npcId: 'h', username: 'h', displayName: 'H', via: 'credential', relay: true, host: 'R' });
    assert.equal(s.heldAtKeyboard('t'), true);
    assert.equal(s.heldAtKeyboard('p'), true);
    assert.equal(s.heldAtKeyboard('r'), false);
    assert.equal(s.heldAtKeyboard('none'), false);
});

test('screen-states keeps the locked look on a PC the player holds a technique copy on, and lifts it for a password copy', () => {
    const s = setup();
    window.pcSessions = s;
    const sprite = { scenarioData: { id: 'pc1' }, texture: { key: 'pc' }, setTexture(k) { this.texture.key = k; },
        scene: { textures: { exists: () => true } } };
    window.rooms = { lab: { objects: { pc1: sprite } } };
    window.workstationState = { isLocked: () => true };
    const st = new ScreenStates();
    s._replace('pc1', { ...TECH });
    st.apply('pc1');
    assert.equal(sprite._screenLocked, true);
    s._replace('pc1', { npcId: 'p', username: 'p', displayName: 'P', via: 'password' });
    st.apply('pc1');
    assert.equal(sprite._screenLocked, false);
});

// The two NPC events, through the listeners (not a direct displaced() call)
async function fire(s, pattern, copy, { open = true } = {}) {
    const handlers = {};
    window.eventDispatcher.on = (p, cb) => { handlers[p] = cb; };
    window.npcManager = { getNPC: () => ({ displayName: 'Ian Shaw' }) };
    s.listen();
    s._replace('pc1', copy);
    const closed = [];
    if (open) s.registerDesktop('pc1', (m, why) => closed.push([m, why]));
    events.length = 0;
    handlers[pattern]({ npcId: 'ian', objectId: 'pc1', met: true });
    await settle();
    delete window.eventDispatcher.on;
    delete window.npcManager;
    return closed;
}
const PW_REMOTE = { npcId: 'p', username: 'p', displayName: 'P', via: 'password', remote: true, footholdId: 'f1', host: 'PC' };

test('npc_sat_at and npc_borrowed_session leave a technique copy and a remote password copy: no logout, no event, the desktop stays open', async () => {
    for (const pattern of ['npc_sat_at:*', 'npc_borrowed_session:*']) {
        for (const copy of [TECH, PW_REMOTE]) {
            const s = setup();
            const closed = await fire(s, pattern, { ...copy });
            assert.deepEqual(calls, [], `${pattern} ${copy.via}`);
            assert.deepEqual(named('pc_signed_out'), []);
            assert.deepEqual(closed, []);
            assert.equal(s.has('pc1'), true);
        }
    }
});

test('the same events displace a keyboard password copy, a claim and a guest claim as before: one logout, reason displaced', async () => {
    const copies = [
        { npcId: 'p', username: 'p', displayName: 'P', via: 'password' },
        { npcId: 'o', username: 'o', displayName: 'O', via: 'claim' },
        { npcId: 'g', username: 'g', displayName: 'G', via: 'claim', guest: true }
    ];
    for (const pattern of ['npc_sat_at:*', 'npc_borrowed_session:*']) {
        for (const copy of copies) {
            const s = setup();
            const closed = await fire(s, pattern, { ...copy });
            assert.deepEqual(calls, [['logout', 'pc1']], `${pattern} ${copy.via}`);
            assert.deepEqual(named('pc_signed_out').map(d => d.reason), ['displaced']);
            assert.equal(closed.length, 1);
            assert.equal(s.has('pc1'), false);
        }
    }
});
