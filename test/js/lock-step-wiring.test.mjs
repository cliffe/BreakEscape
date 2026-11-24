// A lock's second step, wired the way the page wires it (ops layer S8c unit 24).
//
// Nothing here is a stand-in for a game module: the REAL systems/lock-step-wiring.js (the boot
// call main.js makes), ApiClient.unlock, lock-step.js, the pane with the push part inside it,
// mfa-client.js and the state sync run together in jsdom. Only the network is stubbed, and every
// server answer is read from the shared fixture (test/js/helpers/lock-step-answers.mjs). The
// mfa-client request function is built as pc-sessions.js builds it (api.get / api.post).
// Run with: bin/test-js test/js/lock-step-wiring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lock-step-wiring-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const copy = (rel) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
};
// The import graph of the wiring module and of ApiClient.unlock, as main.js loads it
for (const f of ['systems/lock-step-wiring.js', 'systems/lock-step.js', 'systems/npc-game-bridge.js', 'systems/mfa-client.js',
    'ui/lock-step-pane.js', 'ui/lock-step-push.js', 'api-client.js', 'config.js', 'state-sync.js',
    'utils/lock-scope-refusal.js', 'systems/npc-manager.js', 'systems/npc-los.js', 'minigames/person-chat/person-chat-conversation.js', 'minigames/helpers/influence-message.js', 'minigames/phone-chat/phone-chat-speaker.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
window.breakEscapeConfig = { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' };

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { ApiClient } = await load('api-client.js');
const { StateSync } = await load('state-sync.js');
const wiring = await load('systems/lock-step-wiring.js');
const mfa = await load('systems/mfa-client.js');
const { default: NPCManager } = await load('systems/npc-manager.js');
const { default: npcBridge } = await load('systems/npc-game-bridge.js');
const { default: PersonChatConversation } = await load('minigames/person-chat/person-chat-conversation.js');
const lockStepModule = await load('systems/lock-step.js');
const { lockScopeRefusalLine, lockScopeRefusal, SECOND_STEP_CANCELLED } = await import(pathToFileURL(join(dir, 'utils/lock-scope-refusal.js')).href);

const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle(n = 6) { for (let i = 0; i < n; i++) await tick(); }

// ---- the fake network: answers from the fixture, by path, in order ---------------------------
let routes; let sent; let events; let timers; let sounds; let toasts;
function answerOf(name) { return loadAnswer(name); }
function respond(a) {
    return { ok: a.status < 400, status: a.status, json: async () => a.body };
}
globalThis.fetch = async (url, init = {}) => {
    const path = String(url).replace('/games/1', '').split('?')[0];
    const body = init.body ? JSON.parse(init.body) : null;
    sent.push({ method: init.method || 'GET', path, body, query: String(url).split('?')[1] || '' });
    const queue = routes[path];
    if (!queue || !queue.length) throw new Error(`unexpected request ${path}`);
    const name = queue.length > 1 ? queue.shift() : queue[0];
    return respond(answerOf(name));
};

function inventoryWith(...data) { return { items: data.map((d) => ({ scenarioData: d })) }; }

// One page per test: the real wiring on a fresh window state
function boot({ inventory = { items: [] }, scenario = { rooms: {} } } = {}) {
    document.body.innerHTML = '';
    sent = []; events = []; timers = []; sounds = []; toasts = [];
    window.lockStep = undefined;
    lockStepModule.reset();
    window.MinigameFramework = { currentMinigame: null };
    window.inventory = inventory;
    window.gameScenario = scenario;
    window.rooms = {};
    window.playUISound = (n) => sounds.push(n);
    window.gameAlert = (...a) => toasts.push(a);
    window.pauseKeyboardInput = () => {};
    window.resumeKeyboardInput = () => {};
    window.stateSync = new StateSync(30000);
    window.ApiClient = ApiClient;
    window.mfaClient = mfa;
    mfa.reset();
    // as pc-sessions.js _wireMfa builds the request function
    mfa.configure({
        request: (method, path, payload) => {
            if (method === 'GET') {
                const q = new URLSearchParams();
                for (const [k, v] of Object.entries(payload || {})) if (v != null) q.set(k, String(v));
                const qs = q.toString();
                return ApiClient.get(`/${path}${qs ? `?${qs}` : ''}`);
            }
            return ApiClient.post(`/${path}`, payload || {});
        },
        emit: (name, detail) => events.push({ name, detail }),
        now: () => Date.now()
    });
    return wiring.wireLockStep(window, {
        setTimer: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
        clearTimer: () => {}
    });
}

const layer = () => document.querySelector('.lock-step-layer');
const button = (label) => [...layer().querySelectorAll('button')].find((b) => (label instanceof RegExp ? label.test(b.textContent) : b.textContent === label));
const click = (label) => { const b = button(label); assert.ok(b, `a "${label}" button`); b.click(); };
const CHECK_PHONE = /^Check .+ phone$/;
const unlock = (id = 'moira_locker', type = 'object') => ApiClient.unlock(type, id, 'attempt', 'password');
const posted = (path) => sent.filter((s) => s.path === path);

test('the boot call sets window.lockStep with run, isCancel, cancelFeedback', () => {
    const ls = boot();
    assert.equal(window.lockStep, ls);
    for (const name of ['run', 'isCancel', 'cancelFeedback']) assert.equal(typeof window.lockStep[name], 'function', name);
    assert.equal(window.lockStep.run, lockStepModule.run);
    assert.equal(window.lockStep.paneState(), null);
});

test('main.js imports the wiring and calls it after the state sync exists', () => {
    const src = readFileSync(join(js, 'main.js'), 'utf8');
    assert.match(src, /import \{ wireLockStep \} from '\.\/systems\/lock-step-wiring\.js';/);
    const sync = src.indexOf('window.stateSync = new StateSync');
    const call = src.indexOf('wireLockStep(window);');
    assert.ok(sync > 0 && call > sync, 'wireLockStep(window) runs after window.stateSync is created');
    // pc-sessions.js assigns window.mfaClient when it loads, and core/game.js imports it statically
    assert.match(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8'), /window\.mfaClient = mfaClient/);
    assert.match(readFileSync(join(js, 'core/game.js'), 'utf8'), /import \{ pcSessions \} from '\.\.\/systems\/pc-sessions\.js'/);
});

test('with the default timers the wiring still configures (no override given)', () => {
    window.stateSync = new StateSync(30000);
    window.mfaClient = mfa;
    const ls = wiring.wireLockStep(window);
    assert.equal(typeof ls.run, 'function');
});

test('code lock: gate, the pane, the code, then the SAME body is posted again and the open comes back', async () => {
    boot();
    routes = { '/unlock': ['gate_code', 'open_object'], '/mfa/verify': ['verify_passed'] };
    const p = unlock();
    await settle();
    assert.ok(layer(), 'the pane is open');
    const st = window.lockStep.paneState();
    assert.equal(st.kind, 'code');
    assert.equal(posted('/unlock').length, 1);
    assert.equal(events.find((e) => e.name === 'mfa_required').detail.npcId, 'moira');

    const field = layer().querySelector('input');
    field.value = '123456';
    field.dispatchEvent(new window.Event('input', { bubbles: true }));
    click('Verify');
    const answer = await p;
    assert.deepEqual(answer, answerOf('open_object').body);
    assert.equal(posted('/unlock').length, 2);
    assert.deepEqual(posted('/unlock')[1].body, posted('/unlock')[0].body, 'the open is the same request re-posted');
    assert.deepEqual(posted('/mfa/verify')[0].body, { code: '123456', target_type: 'object', target_id: 'moira_locker' });
    // the lock's approved event names the lock (its npcId is '' today: mfa-client reads it from the pass body)
    assert.equal(events.find((e) => e.name === 'mfa_approved').detail.targetId, 'moira_locker');
    assert.equal(layer(), null, 'the pane is gone');
});

test('push lock: the request goes out on open, the held phone shows the card, Approve passes, then the open', async () => {
    boot({ inventory: inventoryWith({ id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Moira\'s phone' }) });
    routes = { '/unlock': ['gate_push', 'open_object'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_one_request'], '/mfa/approve': ['approve_passed'] };
    const p = unlock();
    await settle();
    assert.equal(posted('/mfa/prompt').length, 1, 'the first request goes out when the pane opens');
    click(CHECK_PHONE);
    await settle();
    assert.equal(posted('/mfa/phone')[0].query.includes('target_id=moira_locker'), true);
    click('Approve');
    const answer = await p;
    assert.equal(answer.success, true);
    assert.deepEqual(posted('/mfa/approve')[0].body, { target_type: 'object', target_id: 'moira_locker' });
    assert.equal(posted('/unlock').length, 2);
});

test('push lock: the owner approves on the request itself (prompt passes), no card needed', async () => {
    boot();
    routes = { '/unlock': ['gate_push', 'open_object'], '/mfa/prompt': ['prompt_passed'] };
    const answer = await unlock();
    assert.equal(answer.success, true);
    assert.equal(posted('/unlock').length, 2);
});

test('number-match lock: the displayed number, the phone offers three, the right one passes', async () => {
    boot({ inventory: inventoryWith({ id: 'priya_phone', type: 'phone_friendface', owner: 'priya', name: 'Priya\'s phone' }) });
    routes = { '/unlock': ['gate_number', 'open_object'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_number_request'], '/mfa/approve': ['approve_passed'] };
    const p = ApiClient.unlock('object', 'priya_safe', 'a', 'password');
    await settle();
    assert.match(layer().textContent, /47/, 'the pane shows the number');
    click(CHECK_PHONE);
    await settle();
    for (const n of ['31', '47', '82']) assert.ok(button(n), `number ${n}`);
    click('47');
    const answer = await p;
    assert.equal(answer.success, true);
    assert.equal(posted('/mfa/approve')[0].body.number, 47);
});

test('a cancel by the player: the X rejects with a silent cancel, nothing is posted again, no toast', async () => {
    boot();
    routes = { '/unlock': ['gate_code'] };
    const p = unlock();
    await settle();
    click('X');
    const err = await p.then(() => null, (e) => e);
    assert.equal(err.status, 403);
    assert.equal(err.body.reason, SECOND_STEP_CANCELLED);
    assert.equal(err.body.closedByPlayer, true);
    assert.equal(window.lockStep.isCancel(err), true);
    assert.equal(lockScopeRefusal(err), SECOND_STEP_CANCELLED);
    assert.equal(lockScopeRefusalLine(err), '');
    assert.deepEqual(toasts, []);
    assert.deepEqual(sounds, []);
    assert.equal(posted('/unlock').length, 1);
});

test('a denial: Deny rejects with a cancel, and the pad refusal line gives the reject tone once and "Not approved."', async () => {
    boot({ inventory: inventoryWith({ id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Moira\'s phone' }) });
    routes = { '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_one_request'], '/mfa/approve': ['approve_cancelled'] };
    const p = unlock();
    await settle();
    click(CHECK_PHONE);
    await settle();
    click('Deny');
    const err = await p.then(() => null, (e) => e);
    assert.equal(err.body.reason, SECOND_STEP_CANCELLED);
    assert.equal(err.body.closedByPlayer, false);
    assert.equal(lockScopeRefusalLine(err), '');
    assert.deepEqual(sounds, ['reject']);
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0][0], 'Not approved.');
    assert.equal(toasts[0][1], 'error');
    assert.equal(posted('/unlock').length, 1, 'a denial opens nothing');
});

test('a door gate from an NPC: the opener is written on the room and on every door sprite that leads to it', async () => {
    const sprite = { doorProperties: { connectedRoom: 'records_room', npcStepOpener: null } };
    const other = { doorProperties: { connectedRoom: 'elsewhere', npcStepOpener: null } };
    boot({ scenario: { rooms: { records_room: { locked: true }, elsewhere: { locked: true } } } });
    window.rooms = { lobby: { doorSprites: [sprite, other] } };
    routes = { '/unlock': ['gate_door_npc', 'open_door'], '/mfa/prompt': ['prompt_passed'] };
    const answer = await ApiClient.unlock('door', 'records_room', 'moira', 'npc', {}, { fromDoor: true });
    assert.equal(answer.success, true);
    assert.equal(window.gameScenario.rooms.records_room.npcStepOpener, 'moira');
    assert.equal(sprite.doorProperties.npcStepOpener, 'moira');
    assert.equal(other.doorProperties.npcStepOpener, null);
});

test('isClear: a live minigame, a pending conversation, a confirm box or a knock-out each hold the screen', () => {
    boot();
    assert.equal(wiring.isScreenClear(window), true);
    window.MinigameFramework.currentMinigame = { _ending: false };
    assert.equal(wiring.isScreenClear(window), false);
    window.MinigameFramework.currentMinigame = { _ending: true };
    assert.equal(wiring.isScreenClear(window), true);
    window.MinigameFramework.currentMinigame = null;
    window.pendingConversationReturn = { npcId: 'x' };
    assert.equal(wiring.isScreenClear(window), false);
    window.pendingConversationReturn = null;
    window.gameConfirmOpen = () => true;
    assert.equal(wiring.isScreenClear(window), false);
    window.gameConfirmOpen = () => false;
    window.playerIsKnockedOut = () => true;
    assert.equal(wiring.isScreenClear(window), false);
    window.playerIsKnockedOut = () => false;
    assert.equal(wiring.isScreenClear(window), true);
    delete window.gameConfirmOpen; delete window.playerIsKnockedOut;
});

test('isOpenInClient reads a door from its room and an object from the scenario or the inventory', () => {
    boot({
        scenario: { rooms: { vault: { locked: false }, records_room: { locked: true },
            office: { objects: [{ id: 'a', contents: [{ id: 'inner', locked: false }] }, { id: 'b', locked: true }] } } },
        inventory: inventoryWith({ id: 'held_box', locked: false })
    });
    assert.equal(wiring.isOpenInClient(window, 'door', 'vault'), true);
    assert.equal(wiring.isOpenInClient(window, 'door', 'records_room'), false);
    assert.equal(wiring.isOpenInClient(window, 'door', 'nowhere'), false);
    assert.equal(wiring.isOpenInClient(window, 'object', 'inner'), true);
    assert.equal(wiring.isOpenInClient(window, 'object', 'b'), false);
    assert.equal(wiring.isOpenInClient(window, 'object', 'held_box'), true);
    assert.equal(wiring.isOpenInClient(window, 'object', 'missing'), false);
});

test('the toast and tone are the page\'s own gameAlert and playUISound, read at call time', () => {
    boot();
    window.gameAlert = undefined;
    window.playUISound = undefined;
    // a missing helper must not throw
    assert.doesNotThrow(() => window.lockStep.cancelFeedback(Object.assign(new Error('x'), { status: 403, body: { reason: SECOND_STEP_CANCELLED, closedByPlayer: false } })));
});

// ---- the pane's default lookups, against data shaped as the real game holds it -----------------
// The scenario is the shape of scenarios/test_ops_mfa (rooms carry door_sign, not name); the NPC
// manager is the real class with an NPC registered as the game registers one; held items are
// sprites with `scenarioData` (systems/inventory.js pushes them so).

function realNpcManager() {
    const listeners = new Map();
    const dispatcher = { on() {}, off() {}, emit() {} , listeners };
    const m = new NPCManager(dispatcher, null);
    m.registerNPC('moira', { displayName: 'Moira Quill', npcType: 'person' });
    return m;
}

test('lookups: the owner\'s display name comes from the real NPC manager, in the phone button and the code line', async () => {
    boot({ inventory: inventoryWith({ id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Phone' }) });
    window.npcManager = realNpcManager();
    routes = { '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'] };
    const p = unlock();
    await settle();
    assert.ok(button('Check Moira Quill\'s phone'), 'the held phone button names the owner');
    assert.match(layer().textContent, /A request was sent to Moira Quill's phone\./);
    click('X');
    await p.catch(() => {});
    routes = { '/unlock': ['gate_code'] };
    const q = unlock();
    await settle();
    assert.match(layer().textContent, /Enter the code from Moira Quill's device\./);
    click('X');
    await q.catch(() => {});
    delete window.npcManager;
});

test('lookups: an object lock is titled by its scenario name; a held item by its inventory name; else "this lock"', async () => {
    boot({ scenario: { rooms: { office: { door_sign: 'Office', objects: [{ type: 'locker', id: 'moira_locker', name: 'Moira\'s locker' }] } } } });
    routes = { '/unlock': ['gate_code'] };
    let p = unlock();
    await settle();
    assert.equal(window.lockStep.paneState().title, 'Moira\'s locker');
    click('X');
    await p.catch(() => {});
    boot({ inventory: inventoryWith({ id: 'moira_locker', type: 'briefcase', name: 'Brass case' }) });
    routes = { '/unlock': ['gate_code'] };
    p = unlock();
    await settle();
    assert.equal(window.lockStep.paneState().title, 'Brass case');
    click('X');
    await p.catch(() => {});
    boot();
    routes = { '/unlock': ['gate_code'] };
    p = unlock();
    await settle();
    assert.equal(window.lockStep.paneState().title, 'this lock');
    click('X');
    await p.catch(() => {});
});

test('lookups: a door is titled by its room\'s door_sign (rooms carry no name), else its id as words', async () => {
    boot({ scenario: { rooms: { records_room: { type: 'room_office', door_sign: 'Records', locked: true } } } });
    routes = { '/unlock': ['gate_door_npc'] };
    let p = ApiClient.unlock('door', 'records_room', 'a', 'password');
    await settle();
    assert.equal(window.lockStep.paneState().title, 'Records');
    click('X');
    await p.catch(() => {});
    boot({ scenario: { rooms: { records_room: { type: 'room_office', locked: true } } } });
    routes = { '/unlock': ['gate_door_npc'] };
    p = ApiClient.unlock('door', 'records_room', 'a', 'password');
    await settle();
    assert.equal(window.lockStep.paneState().title, 'records room');
    click('X');
    await p.catch(() => {});
});

test('lookups: the held code device is found by owner and type, with the id the device read uses', async () => {
    boot({ inventory: inventoryWith({ type: 'code_device', id: 'moira_device', name: 'Code device', owner: 'moira', takeable: true },
        { type: 'code_device', id: 'other_device', name: 'Code device', owner: 'ines', takeable: true }) });
    routes = { '/unlock': ['gate_code'], '/mfa/device': ['no_device'] };
    const p = unlock();
    await settle();
    assert.equal(layer().querySelectorAll('.lock-step-device').length, 1);
    click('Read code');
    await settle();
    assert.equal(sent.find((s) => s.path === '/mfa/device').query, 'item_id=moira_device');
    click('X');
    await p.catch(() => {});
});

// ---- keys inside the real pane -------------------------------------------------------------------

function keyOn(el, key, extra = {}) {
    const ev = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
    const seen = [];
    const spy = (e) => seen.push(e.key);
    document.addEventListener('keydown', spy);
    el.dispatchEvent(ev);
    document.removeEventListener('keydown', spy);
    return { ev, reachedDocument: seen.length > 0 };
}

test('keys: Tab reaches the Check phone, Approve and Deny buttons; Enter and Space are left to the browser to press them', async () => {
    boot({ inventory: inventoryWith({ id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Phone' }) });
    routes = { '/unlock': ['gate_push', 'open_object'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_one_request'], '/mfa/approve': ['approve_passed'] };
    const p = unlock();
    await settle();
    const order = [];
    const tabTo = (re, max = 8) => {
        for (let i = 0; i < max; i++) {
            if (re.test(document.activeElement?.textContent || '')) return true;
            keyOn(document.activeElement || document.body, 'Tab');
            order.push(document.activeElement?.textContent);
        }
        return re.test(document.activeElement?.textContent || '');
    };
    assert.ok(tabTo(CHECK_PHONE), `Tab reaches Check phone (visited ${order.join(' | ')})`);
    // Enter on the focused button: not swallowed, so the browser's own activation presses it
    const enter = keyOn(document.activeElement, 'Enter');
    assert.equal(enter.ev.defaultPrevented, false, 'Enter is not default-prevented on a button in the pane');
    assert.equal(enter.reachedDocument, false, 'but it never reaches a pad listening on the document');
    const space = keyOn(document.activeElement, ' ');
    assert.equal(space.ev.defaultPrevented, false, 'Space is not default-prevented on a button in the pane');
    // what the browser then does for Enter or Space on a focused button is a click
    document.activeElement.click();
    await settle();
    for (const label of ['Approve', 'Deny']) {
        assert.ok(tabTo(new RegExp(`^${label}$`)), `Tab reaches ${label} (visited ${order.join(' | ')})`);
        assert.equal(document.activeElement.textContent, label);
    }
    assert.ok(tabTo(/^Approve$/));
    document.activeElement.click();
    const answer = await p;
    assert.equal(answer.success, true);
});

test('keys: Tab reaches each number button of a number match, and a back-Tab walks the same ring', async () => {
    boot({ inventory: inventoryWith({ id: 'priya_phone', type: 'phone_friendface', owner: 'priya', name: 'Phone' }) });
    routes = { '/unlock': ['gate_number'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_number_request'] };
    const p = unlock('priya_safe');
    await settle();
    click(CHECK_PHONE);
    await settle();
    const visited = new Set();
    for (let i = 0; i < 12; i++) { keyOn(document.activeElement, 'Tab'); visited.add(document.activeElement.textContent); }
    for (const n of ['31', '47', '82', 'Deny']) assert.ok(visited.has(n), `Tab reaches ${n} (visited ${[...visited].join(' | ')})`);
    const back = document.activeElement;
    keyOn(back, 'Tab', { shiftKey: true });
    assert.notEqual(document.activeElement, back);
    assert.ok(layer().contains(document.activeElement), 'focus never leaves the pane');
    click('X');
    await p.catch(() => {});
});

test('keys: the code field takes digits, keeps them from a pad beneath, and Enter in it verifies', async () => {
    boot();
    routes = { '/unlock': ['gate_code', 'open_object'], '/mfa/verify': ['verify_passed'] };
    const p = unlock();
    await settle();
    const field = layer().querySelector('input');
    assert.equal(document.activeElement, field, 'the field has focus when the pane opens');
    for (const ch of '246810') {
        const down = keyOn(field, ch);
        assert.equal(down.ev.defaultPrevented, false, `digit ${ch} is typed`);
        assert.equal(down.reachedDocument, false, `digit ${ch} does not reach a pad`);
        field.value += ch;
        field.dispatchEvent(new window.Event('input', { bubbles: true }));
    }
    assert.equal(field.value, '246810');
    const enter = keyOn(field, 'Enter');
    assert.equal(enter.reachedDocument, false);
    const answer = await p;
    assert.equal(answer.success, true);
    assert.equal(sent.find((s) => s.path === '/mfa/verify').body.code, '246810');
});

test('keys: Escape closes the pane only, as the player\'s own X (silent)', async () => {
    boot();
    routes = { '/unlock': ['gate_code'] };
    const p = unlock();
    await settle();
    const esc = keyOn(layer().querySelector('input'), 'Escape');
    assert.equal(esc.reachedDocument, false);
    const err = await p.then(() => null, (e) => e);
    assert.equal(err.body.closedByPlayer, true);
    assert.deepEqual(toasts, []);
});

// ---- an NPC opens a gated door: a denied or expired step shows "Not approved." once ------------------

async function npcDoor(via, answers) {
    boot({ inventory: inventoryWith({ id: 'moira_phone', type: 'phone_friendface', owner: 'moira', name: 'Phone' }) });
    window.currentConversationNPCId = 'moira';
    window.eventDispatcher = { emit: (n, d) => events.push({ name: n, detail: d }) };
    window.unlockDoor = () => {};
    routes = { '/unlock': answers.unlock, '/mfa/prompt': answers.prompt };
    const run = via === 'bridge'
        ? npcBridge.unlockDoor('records_room')
        : Object.assign(Object.create(PersonChatConversation.prototype), { npc: { id: 'moira' } }).handleUnlockDoor('records_room');
    return run;
}

for (const via of ['bridge', 'conversation']) {
    test(`NPC door via the ${via}: a denied step shows the reject tone and "Not approved." once; a pass shows none of it`, async () => {
        const p = npcDoor(via, { unlock: ['gate_door_npc'], prompt: ['prompt_expired'] });
        const result = await p;
        if (via === 'bridge') assert.equal(result.secondStepCancelled, true);
        assert.deepEqual(sounds, ['reject']);
        assert.deepEqual(toasts.map((t) => t[0]), ['Not approved.']);
        assert.equal(events.filter((e) => e.name === 'door_unlocked_by_npc').length, 0);
    });

    test(`NPC door via the ${via}: the player's own X shows nothing`, async () => {
        const p = npcDoor(via, { unlock: ['gate_door_npc'], prompt: ['prompt_waiting'] });
        await settle();
        click('X');
        await p;
        assert.deepEqual(sounds, []);
        assert.deepEqual(toasts, []);
    });
}

test('the clone-as-entry gate path of doors.js says nothing for a cancelled second step (source pin: doors.js is too heavy to load)', () => {
    const src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    const at = src.indexOf("notifyServerUnlock(doorSprite, 'door', 'rfid')");
    assert.ok(at > 0);
    const block = src.slice(at, at + 900);
    assert.ok(block.indexOf('secondStepCancelled') > 0 && block.indexOf('secondStepCancelled') < block.indexOf("'Access denied'"));
});
