// Code review R1, m9: the requests and the routing behind the sign-in PCs, run for real
// rather than read as source text (access model 5.1, 5.3 and 5.4).
// - api-client.js: login, logout and loginAccounts send the right method, path and body,
//   and a GET error carries its status;
// - inventory.js: a file taken from a sign-in desktop names its PC and Copy or Move, and
//   a plain add names neither;
// - interactions.js: a sign-in PC goes to interactLoginPc (or handleUnlock without it)
//   and stops there, before the workstation call and the generic flow.
// Run with: node test/js/access-signin-requests.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'access-signin-requests-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const stub = (out, code) => { writeFileSync(join(dir, out), code); return pathToFileURL(join(dir, out)).href; };
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) {
        assert.ok(code.includes(a), `${src} has ${a}`);
        code = code.split(a).join(b);
    }
    return stub(out, code);
};

globalThis.window = {};
globalThis.document = { getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {}, appendChild() {}, addEventListener() {} }) };

stub('config-stub.mjs', "export function getApiBase() { return '/break_escape/games/9'; } export function getCsrfToken() { return 'csrf'; } export const CSRF_TOKEN = 'csrf';");
const { ApiClient } = await import(copy('api-client.js', 'api-client.mjs', [["'./config.js'", "'./config-stub.mjs'"]]));

stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
copy('systems/consumables.js', 'consumables.mjs');
const { addToInventory } = await import(copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"]
]));

let requests;
function stubFetch(answer = { status: 200, body: { success: true } }) {
    requests = [];
    globalThis.fetch = async (url, init = {}) => {
        requests.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
        return { ok: answer.status < 400, status: answer.status, statusText: String(answer.status), json: async () => answer.body };
    };
}

// ── api-client.js ────────────────────────────────────────────────────────────

test('login posts the fields and the pc_id to /login', async () => {
    stubFetch({ status: 200, body: { success: true, npcId: 'jake' } });
    const body = await ApiClient.login('jake_pc', { username: 'jbrooks', password: 'pw' });
    assert.deepEqual(body, { success: true, npcId: 'jake' });
    assert.deepEqual(requests, [{ url: '/break_escape/games/9/login', method: 'POST', body: { username: 'jbrooks', password: 'pw', pc_id: 'jake_pc' } }]);
    stubFetch();
    await ApiClient.login('dana_pc', { claim: 'owner', globals: { dana_pc_owner_away: true } });
    assert.deepEqual(requests[0].body, { claim: 'owner', globals: { dana_pc_owner_away: true }, pc_id: 'dana_pc' });
});

test('logout posts the pc_id to /logout', async () => {
    stubFetch();
    await ApiClient.logout('jake_pc');
    assert.deepEqual(requests, [{ url: '/break_escape/games/9/logout', method: 'POST', body: { pc_id: 'jake_pc' } }]);
});

test('loginAccounts gets /login_accounts with the pc_id encoded', async () => {
    stubFetch({ status: 200, body: { loginAccounts: [] } });
    await ApiClient.loginAccounts("Jake's PC & co");
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[0].url, `/break_escape/games/9/login_accounts?pc_id=${encodeURIComponent("Jake's PC & co")}`);
});

test('a GET error carries its status', async () => {
    stubFetch({ status: 403, body: {} });
    await assert.rejects(ApiClient.loginAccounts('jake_pc'), (err) => err.status === 403);
});

// ── inventory.js ─────────────────────────────────────────────────────────────

function resetInventory() {
    stubFetch({ status: 200, body: { success: true } });
    Object.assign(window, {
        breakEscapeConfig: { gameId: 9 },
        lockRef: (item) => item?.opens_lock || item?.key_id || null,
        inventory: { items: [], _initialItemsProcessed: true },
        gameState: { notes: [], globalVariables: {} }
    });
}
const rota = { type: 'text_file', id: 'ian_rota', name: 'Server rota.txt', takeable: true, text: 'rota' };

test('a file from a sign-in desktop names its PC and the choice: copy', async () => {
    resetInventory();
    await addToInventory({ name: 'text_file', objectId: 'desk_rota', scenarioData: rota, sourcePcId: 'hot_desk', transfer: 'copy' });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/break_escape/games/9/inventory');
    assert.equal(requests[0].body.action_type, 'add');
    assert.equal(requests[0].body.item.id, 'ian_rota');
    assert.equal(requests[0].body.source_pc_id, 'hot_desk');
    assert.equal(requests[0].body.transfer, 'copy');
});

test('a file from a sign-in desktop with no choice named is a move', async () => {
    resetInventory();
    await addToInventory({ name: 'text_file', objectId: 'desk_rota', scenarioData: rota, sourcePcId: 'hot_desk' });
    assert.equal(requests[0].body.source_pc_id, 'hot_desk');
    assert.equal(requests[0].body.transfer, 'move');
});

test('a plain pickup names no PC and no transfer', async () => {
    resetInventory();
    await addToInventory({ name: 'text_file', objectId: 'room_rota', scenarioData: rota });
    assert.equal(requests.length, 1);
    assert.equal('source_pc_id' in requests[0].body, false);
    assert.equal('transfer' in requests[0].body, false);
});

// ── interactions.js: the sign-in PC branch of handleObjectInteraction ───────

function loginBranch() {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const start = src.indexOf("if (sprite.scenarioData.lockType === 'login') {");
    assert.ok(start > 0, 'sign-in branch found');
    // It runs before the workstation call and the generic triggerOnInteract flow
    assert.ok(start < src.indexOf('window.workstationState.onInteract(sprite.scenarioData.id)'));
    assert.ok(start < src.indexOf('if (Array.isArray(sprite.scenarioData.triggerOnInteract))'));
    let depth = 0, i = src.indexOf('{', start);
    const open = i;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    const body = `if (sprite.scenarioData.lockType === 'login') ${src.slice(open, i + 1)}\nreturn 'fallthrough';`;
    return new Function('sprite', 'window', 'playUISound', 'handleUnlock', body);
}

test('a sign-in PC goes to interactLoginPc, with the lock sound, and nothing after it runs', () => {
    const calls = [];
    const win = { interactLoginPc: (s) => calls.push(['interactLoginPc', s.scenarioData.id]) };
    const sprite = { scenarioData: { id: 'hot_desk', type: 'pc', lockType: 'login', locked: true } };
    const out = loginBranch()(sprite, win, (s) => calls.push(['sound', s]), () => calls.push(['handleUnlock']));
    assert.equal(out, undefined, 'the branch returns');
    assert.deepEqual(calls, [['sound', 'lock'], ['interactLoginPc', 'hot_desk']]);
});

test('without interactLoginPc a sign-in PC falls back to handleUnlock and still stops', () => {
    const calls = [];
    const sprite = { scenarioData: { id: 'hot_desk', type: 'pc', lockType: 'login', locked: true } };
    const out = loginBranch()(sprite, {}, () => calls.push(['sound']), (s, type) => calls.push(['handleUnlock', s.scenarioData.id, type]));
    assert.equal(out, undefined);
    assert.deepEqual(calls, [['handleUnlock', 'hot_desk', 'item']]);
});

test('any other object falls through the branch', () => {
    const calls = [];
    const sprite = { scenarioData: { id: 'old_pc', type: 'pc', lockType: 'password', locked: true } };
    const out = loginBranch()(sprite, { interactLoginPc: () => calls.push('x') }, () => calls.push('sound'), () => calls.push('unlock'));
    assert.equal(out, 'fallthrough');
    assert.deepEqual(calls, []);
});
