// vm-launcher console unlock (handover_launcher_unlock.md):
// When the vm-launcher minigame opens in Hacktivity mode, it POSTs to
// /break_escape/games/:id/unlock_vm_console so the server sets the reached VM's console to
// its default (attack VMs on, "*server*" targets stay locked). Standalone mode must never
// call it. The server re-verifies room access and the console value; these tests cover the
// client's side of the contract: whether, where and how it asks.
//
// Run with: node test/js/vm-launcher-console-unlock.test.mjs
import test from 'node:test';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

globalThis.window = {};
globalThis.document = { querySelector: () => null };

// Load the real minigame module with stubbed siblings (Object.create skips the constructor
// and all DOM), as the flag-station tests do.
const root = mkdtempSync(join(tmpdir(), 'vm-launcher-'));
const mg = join(root, 'minigames');
mkdirSync(join(mg, 'vm-launcher'), { recursive: true });
mkdirSync(join(mg, 'framework'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(mg, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'utils', 'helpers.js'), 'export function makeDraggable() {}\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(join(js, 'utils/escape-html.js'), 'utf8'));
writeFileSync(join(mg, 'vm-launcher', 'vm-launcher-minigame.js'),
    readFileSync(join(js, 'minigames/vm-launcher/vm-launcher-minigame.js'), 'utf8'));
const { VmLauncherMinigame } = await import(pathToFileURL(join(mg, 'vm-launcher', 'vm-launcher-minigame.js')).href);

function launcher(extra = {}) {
    const s = Object.create(VmLauncherMinigame.prototype);
    Object.assign(s, { hacktivityMode: true, gameId: 42, vm: { title: 'kali' } }, extra);
    return s;
}

function captureFetch() {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
        calls.push({ url, opts });
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };
    globalThis.document = {
        querySelector: (q) => (q === 'meta[name="csrf-token"]' ? { getAttribute: () => 'csrf-xyz' } : null)
    };
    return calls;
}

test('requestConsoleUnlock POSTs to the game-scoped endpoint with the vm title and CSRF', async () => {
    const calls = captureFetch();
    await launcher().requestConsoleUnlock();
    assert.equal(calls.length, 1, 'one request');
    const { url, opts } = calls[0];
    assert.equal(url, '/break_escape/games/42/unlock_vm_console?vm_title=kali');
    assert.equal(opts.method, 'POST');
    assert.equal(opts.headers['X-CSRF-Token'], 'csrf-xyz');
    assert.equal(opts.headers['Content-Type'], 'application/json');
});

test('the vm title is URL-encoded in the query', async () => {
    const calls = captureFetch();
    await launcher({ vm: { title: 'kali attack/01' } }).requestConsoleUnlock();
    assert.equal(calls[0].url, '/break_escape/games/42/unlock_vm_console?vm_title=kali%20attack%2F01');
});

test('standalone mode never calls the endpoint', async () => {
    const calls = captureFetch();
    await launcher({ hacktivityMode: false }).requestConsoleUnlock();
    assert.equal(calls.length, 0, 'no request in standalone mode');
});

test('a missing game id is a no-op (no request, no throw)', async () => {
    const calls = captureFetch();
    await launcher({ gameId: undefined }).requestConsoleUnlock();
    assert.equal(calls.length, 0);
});

test('a fetch failure is swallowed so the panel still loads', async () => {
    globalThis.fetch = async () => { throw new Error('network down'); };
    globalThis.document = { querySelector: () => ({ getAttribute: () => 't' }) };
    await assert.doesNotReject(() => launcher().requestConsoleUnlock());
});

test('buildUI triggers the unlock in Hacktivity mode only (source contract)', () => {
    const src = readFileSync(join(js, 'minigames/vm-launcher/vm-launcher-minigame.js'), 'utf8');
    // buildUI gates the call on hacktivityMode and a set that is not released (D144); standalone falls through untouched.
    assert.match(src, /buildUI\(\)\s*\{[\s\S]*?if \(this\.hacktivityMode && !this\.vmSetReleased\) \{\s*this\.requestConsoleUnlock\(\);/);
});

test('flagNote shows under the VM steps, as literal text, and only when set (blind m03 m5)', () => {
    const dom = new JSDOM('<!doctype html><body></body>');
    const saved = globalThis.document;
    globalThis.document = dom.window.document;
    try {
        const vm = { title: 'kali', ip: '10.0.0.2' };
        const render = (flagNote) => {
            const box = dom.window.document.createElement('div');
            box.appendChild(launcher({ hacktivityMode: false, vm, vmPanelRefused: false, flagNote }).buildVmDisplay());
            return box;
        };
        const withNote = render('Flags go back to <b>the Drop-Site</b>.');
        assert.ok(withNote.querySelector('.vm-flag-note'));
        assert.equal(withNote.querySelector('.vm-flag-note p').textContent, 'Flags go back to <b>the Drop-Site</b>.');
        assert.ok(withNote.querySelector('.vm-flag-note b') === null, 'no element made from the note');
        assert.ok(render('').querySelector('.vm-flag-note') === null);
    } finally {
        globalThis.document = saved;
    }
});
