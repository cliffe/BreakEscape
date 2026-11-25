// S5 ruling A (unit 06): pcPolicy.portPc, and plantAdmin reading it after the session grant.
// Run with: node test/js/pc-policy-port.test.mjs
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
const { default: pcPolicy, portPc } = await import(dataUrl(readFileSync(join(js, 'systems/pc-policy.js'), 'utf8')));

const ADMIN = { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password', access: 'admin' };

test('portPc: a non-empty string is the PC; every other value is null', () => {
    assert.equal(portPc({ portOf: 'sam_pc' }), 'sam_pc');
    for (const junk of [undefined, null, '', '   ', 0, 7, true, false, {}, [], ['sam_pc']]) {
        assert.equal(portPc({ portOf: junk }), null, JSON.stringify(junk));
    }
    for (const o of [null, undefined, 'sam_pc', 5, [], {}]) assert.equal(portPc(o), null);
    assert.equal(pcPolicy.portPc, portPc, 'on the frozen export and window.pcPolicy');
    assert.equal(window.pcPolicy.portPc, portPc);
    assert.equal(Object.isFrozen(pcPolicy), true);
});

test('plantAdmin: a port is admin when its PC holds an admin session, remote or not; false when locked or user', () => {
    const s = new PcSessions();
    const port = { id: 'usb_port', portOf: 'sam_pc', policy: 'locked_down' };
    assert.equal(s.plantAdmin(port), false, 'no session');
    s.sessions.set('sam_pc', { ...ADMIN, remote: true, footholdId: 'f1', host: 'PC' });
    assert.equal(s.plantAdmin(port), true, 'a remote admin session at the port PC counts for a stick');
    s.sessions.set('sam_pc', { ...ADMIN });
    assert.equal(s.plantAdmin(port), true);
    s.sessions.set('sam_pc', { ...ADMIN, access: undefined });
    assert.equal(s.plantAdmin(port), false, 'user level');
    s.sessions.set('sam_pc', { ...ADMIN, access: 'user' });
    assert.equal(s.plantAdmin(port), false, 'only a strict admin counts');
    s.sessions.set('sam_pc', { ...ADMIN, locked: true });
    assert.equal(s.plantAdmin(port), false, 'locked');
    s.sessions.set('sam_pc', { ...ADMIN });
    assert.equal(s.plantAdmin({ id: 'usb_port', portOf: '' }), false, 'junk portOf names no PC');
    assert.equal(s.plantAdmin({ id: 'usb_port', portOf: ['sam_pc'] }), false);
});

test('plantAdmin: the grant PC is read first and decides alone; the port PC is only the fallback', () => {
    const s = new PcSessions();
    s.sessions.set('sam_pc', { ...ADMIN, remote: true, footholdId: 'f1', host: 'PC' });
    const both = { id: 'dock', portOf: 'sam_pc', triggerOnInteract: [{ type: 'grant_foothold', needsSession: true, pc: 'sam_pc' }] };
    assert.equal(s.plantAdmin(both), false, 'a session-shaped device still needs the keyboard');
    s.sessions.set('sam_pc', { ...ADMIN });
    assert.equal(s.plantAdmin(both), true);
});
