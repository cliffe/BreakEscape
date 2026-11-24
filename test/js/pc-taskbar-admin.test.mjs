// Privilege S5a unit 09 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md P685-686): the Administrator marker on the
// taskbar, beside the account name, only for a session whose server `access` is 'admin'.
// Run with: node test/js/pc-taskbar-admin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'pc-taskbar-admin-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/npc-headshot.js', 'utils/pc-taskbar.js',
    'utils/sync-before-fetch.js', 'systems/pc-sessions.js', 'systems/mfa-client.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { pcTaskbarModel, pcTaskbarHtml, ADMIN_TAG_TEXT } = await imp('utils/pc-taskbar.js');

const PC = { id: 'pc1', lockType: 'login', name: 'PC' };
const bar = (session) => { const host = document.createElement('div'); host.innerHTML = pcTaskbarHtml(pcTaskbarModel({ pcData: PC, session })); return host; };

test('an admin session shows the marker beside the name; a user session shows none', () => {
    const admin = bar({ npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password', access: 'admin' });
    const tag = admin.querySelector('.pc-taskbar-account .pc-taskbar-admin');
    assert.ok(tag);
    assert.equal(tag.textContent, ADMIN_TAG_TEXT);
    assert.equal(ADMIN_TAG_TEXT, 'Administrator');
    assert.equal(bar({ npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'password' }).querySelector('.pc-taskbar-admin'), null);
    assert.equal(bar({ npcId: 'sam', displayName: 'Sam', via: 'password', access: 'user' }).querySelector('.pc-taskbar-admin'), null);
    assert.equal(bar(null).querySelector('.pc-taskbar-admin'), null);
});

test('a locked entry shows no marker even if it still carried access', () => {
    assert.equal(bar({ npcId: 'sam', displayName: 'Sam', via: 'password', access: 'admin', locked: true }).querySelector('.pc-taskbar-admin'), null);
});

test('a hostile display name renders as text beside the marker', () => {
    const host = bar({ npcId: 'x', displayName: '<img src=x onerror=alert(1)>', username: 'x', via: 'password', access: 'admin' });
    assert.equal(host.querySelector('.pc-taskbar-account img'), null);
    assert.equal(host.querySelector('.pc-taskbar-name').textContent, '<img src=x onerror=alert(1)>');
    assert.ok(host.querySelector('.pc-taskbar-admin'));
});

test('a session whose npcId the client never loaded still renders', () => {
    const host = bar({ npcId: 'never_loaded_npc', displayName: 'Ghost', via: 'password', access: 'admin' });
    assert.equal(host.querySelector('.pc-taskbar-name').textContent, 'Ghost');
    assert.ok(host.querySelector('.pc-taskbar-admin'));
});

test('the model carries admin only for admin', () => {
    assert.equal(pcTaskbarModel({ pcData: PC, session: { npcId: 'a', displayName: 'A', access: 'admin' } }).account.admin, true);
    assert.equal('admin' in pcTaskbarModel({ pcData: PC, session: { npcId: 'a', displayName: 'A' } }).account, false);
});

test('the account title names the level when the marker is shown, so a clipped marker is not lost', () => {
    const html = pcTaskbarHtml({ account: { name: 'Sam', admin: true } });
    assert.match(html, /class="pc-taskbar-account" title="Sam, [^"]+"/);
    assert.match(pcTaskbarHtml({ account: { name: 'Sam' } }), /class="pc-taskbar-account" title="Sam"/);
});
