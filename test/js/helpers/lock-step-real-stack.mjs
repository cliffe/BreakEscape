// The real client stack for a lock's second step, for the S8c unit 27 tests: ApiClient, lock-step.js,
// the pane with the push part, mfa-client.js, the wiring, the state sync, unlock-system.js, doors.js,
// minigame-starters.js and the real PIN pad on the real base scene, copied into a temp folder and
// loaded in jsdom. Only the heavy art and minigame modules that no lock step touches are empty
// stand-ins (listed below), and the network is `globalThis.fetch`, answered from the shared fixture.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { loadAnswer } from './lock-step-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const js = join(here, '../../../public/break_escape/js');

// Real modules copied as they are
const REAL = [
    'systems/lock-step-wiring.js', 'systems/lock-step.js', 'systems/npc-game-bridge.js', 'systems/mfa-client.js',
    'ui/lock-step-pane.js', 'ui/lock-step-push.js', 'api-client.js', 'config.js', 'state-sync.js',
    'utils/lock-scope-refusal.js', 'systems/test-bridge/lock-step.js', 'systems/test-bridge/input.js',
    'systems/npc-manager.js', 'systems/npc-los.js', 'minigames/person-chat/person-chat-conversation.js',
    'minigames/helpers/influence-message.js', 'minigames/phone-chat/phone-chat-speaker.js',
    'systems/unlock-system.js', 'systems/doors.js', 'systems/minigame-starters.js', 'systems/interaction-repeat.js',
    'systems/room-ready.js', 'systems/ui-sounds.js', 'systems/key-lock-system.js', 'systems/lockpick-catch.js',
    'systems/global-writer.js', 'utils/key-cut-calculator.js', 'utils/constants.js', 'utils/locked-hint.js',
    'utils/remote-host-text.js', 'utils/lock-titles.js', 'utils/conditional-text.js', 'utils/flag-wording.js',
    'utils/display-dashes.js', 'utils/escape-html.js',
    // the tray menu and the overlay it opens (a carried locked item is opened from here: S8c R1-CLIENT1)
    'systems/inventory-menu.js', 'systems/item-drop.js', 'systems/table-drop.js', 'systems/consumables.js',
    'ui/interaction-menu.js', 'ui/modal-stack.js',
    'minigames/framework/base-minigame.js', 'minigames/pin/pin-minigame.js',
    'minigames/password/password-minigame.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js', 'utils/npc-headshot.js'
];
// Stand-ins for modules a lock step never reaches: art, other minigames, the room loader
const STUBS = {
    'core/rooms.js': 'export const rooms = {};',
    'utils/helpers.js': 'export function makeDraggable() {}',
    'minigames/biometrics/fingerprint-reader-minigame.js': 'export function startFingerprintReader() {}',
    'minigames/ble-scanner/ble-scanner-minigame.js': 'export function applyBlePairEffects() {}',
    'utils/dispense-on-unlock.js': 'export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async () => {};',
    'minigames/framework/social-overlay.js': 'export function socialOverlayParams() { return {}; }',
    'systems/triage-starter.js': 'export function startInboxTriageMinigame() {}',
    'systems/episode-starter.js': 'export function startEpisodeRunner() {}',
    'systems/ink-minigame-launch.js': '',
    'systems/mapping-minigame.js': ''
};

export const copyList = [...REAL, ...Object.keys(STUBS)];

export async function buildStack() {
    const dir = mkdtempSync(join(tmpdir(), 'lock-step-real-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
    for (const f of REAL) put(f, readFileSync(join(js, f), 'utf8'));
    for (const [f, text] of Object.entries(STUBS)) put(f, text);

    const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    for (const k of ['KeyboardEvent', 'MouseEvent', 'Event']) globalThis[k] = dom.window[k];
    globalThis.PointerEvent = dom.window.PointerEvent || class PointerEvent extends dom.window.MouseEvent {};
    globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
    window.requestAnimationFrame = globalThis.requestAnimationFrame;
    window.breakEscapeConfig = { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' };

    const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
    const m = {
        dir, load,
        api: (await load('api-client.js')).ApiClient,
        StateSync: (await load('state-sync.js')).StateSync,
        wiring: await load('systems/lock-step-wiring.js'),
        mfa: await load('systems/mfa-client.js'),
        lockStep: await load('systems/lock-step.js'),
        bridge: (await load('systems/test-bridge/lock-step.js')).lockStepBridge,
        pane: await load('ui/lock-step-pane.js'),
        unlockSystem: await load('systems/unlock-system.js'),
        doors: await load('systems/doors.js'),
        starters: await load('systems/minigame-starters.js'),
        pin: await load('minigames/pin/pin-minigame.js'),
        password: await load('minigames/password/password-minigame.js'),
        refusal: await load('utils/lock-scope-refusal.js'),
        inventoryMenu: await load('systems/inventory-menu.js')
    };
    return m;
}

// ---- the fake network: fixture answers by path, in order --------------------------------------
// routes: { '/unlock': ['gate_push', 'open_object'], ... }. A name is a fixture answer; an object
// { name, patch(body) } is a fixture answer with named fields changed on a copy. The last entry repeats.
export function makeNetwork() {
    const net = { routes: {}, sent: [], hits: {} };
    net.reset = (routes = {}) => { net.routes = routes; net.sent = []; net.hits = {}; };
    net.posted = (path) => net.sent.filter((s) => s.path === path);
    globalThis.fetch = async (url, init = {}) => {
        const [raw, query = ''] = String(url).replace('/games/1', '').split('?');
        net.sent.push({ method: init.method || 'GET', path: raw, body: init.body ? JSON.parse(init.body) : null, query });
        const queue = net.routes[raw];
        if (!queue || !queue.length) throw new Error(`unexpected request ${raw}`);
        const at = Math.min(net.hits[raw] || 0, queue.length - 1);
        net.hits[raw] = (net.hits[raw] || 0) + 1;
        const entry = queue[at];
        const a = loadAnswer(typeof entry === 'string' ? entry : entry.name);
        if (entry && entry.patch) entry.patch(a.body);
        return { ok: a.status < 400, status: a.status, json: async () => a.body };
    };
    return net;
}

export const tick = () => new Promise((r) => setTimeout(r, 0));
export async function settle(n = 8) { for (let i = 0; i < n; i++) await tick(); }

// ---- one page per test --------------------------------------------------------------------------
// Shorten the real waits the pad and the unlock system take (2 s success hold, 500 ms container wait)
const realSetTimeout = globalThis.setTimeout;
export function quickTimers() {
    globalThis.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, ms >= 100 ? 1 : ms, ...a);
}

// A stand-in for the minigame framework only: it starts the REAL pad and hands its result to the
// starter's own onComplete, as MinigameManager.endMinigame does.
export function installFramework(S) {
    const fw = { currentMinigame: null, mainGameScene: {}, started: [], ended: [] };
    fw.startMinigame = (name, _container, params) => {
        const Pad = name === 'pin' ? S.pin.PinMinigame : name === 'password' ? S.password.PasswordMinigame : null;
        if (!Pad) throw new Error(`the stack only runs the PIN and password pads (asked for ${name})`);
        const container = document.createElement('div');
        container.className = 'minigame-container';
        document.body.appendChild(container);
        const pad = new Pad(container, params);
        pad._testContainer = container;
        pad._testParams = params;
        fw.currentMinigame = pad;
        fw.started.push(pad);
        pad.init();
        pad.start();
        return pad;
    };
    fw.endMinigame = (success, result) => {
        const pad = fw.currentMinigame;
        if (!pad) return;
        fw.currentMinigame = null;
        pad._ending = true;
        pad._testContainer.remove();
        fw.ended.push({ success, result });
        pad._testParams.onComplete?.(success, result);
    };
    return fw;
}

// Boot the page as main.js does for a lock's second step, on a fresh window state.
// options.inventory: { items: [...] }, options.scenario: window.gameScenario.
export function bootPage(S, { inventory = { items: [] }, scenario = scenarioFromPayloads() } = {}) {
    // a pane the last test left open still holds its key listeners on window: close it as a player would
    document.querySelector('.lock-step-x')?.click();
    document.body.innerHTML = '';
    const log = { toasts: [], sounds: [], events: [], timers: [], mfaEvents: [], expected: [] };
    window.lockStep = undefined;
    S.lockStep.reset();
    window.inventory = inventory;
    window.gameScenario = scenario;
    window.rooms = {};
    window.roomDataCache = new Map();
    window.DISABLE_LOCKS = false;
    window.playUISound = (n) => log.sounds.push(n);
    window.gameAlert = (...a) => log.toasts.push(a);
    window.pauseKeyboardInput = () => {};
    window.resumeKeyboardInput = () => {};
    window.expectContainerAfterUnlock = (...a) => log.expected.push(a);
    window.lockRef = (d) => d.card_id || d.id || d.name;
    window.eventDispatcher = { emit: (name, data) => log.events.push([name, data]) };
    window.stateSync = new S.StateSync(30000);
    window.ApiClient = S.api;
    window.mfaClient = S.mfa;
    window.MinigameFramework = installFramework(S);
    window.handleUnlock = S.unlockSystem.handleUnlock;
    // as inventory-menu.js installs them on import (the module is loaded once, the window is new)
    window.openInventoryItemMenu = S.inventoryMenu.openInventoryItemMenu;
    window.inventoryMenuFor = S.inventoryMenu.inventoryMenuFor;
    window.handleObjectInteraction = () => { log.interactions = (log.interactions || 0) + 1; };
    S.mfa.reset();
    // as pc-sessions.js builds the request function
    S.mfa.configure({
        request: (method, path, payload) => {
            if (method === 'GET') {
                const q = new URLSearchParams();
                for (const [k, v] of Object.entries(payload || {})) if (v != null) q.set(k, String(v));
                const qs = q.toString();
                return S.api.get(`/${path}${qs ? `?${qs}` : ''}`);
            }
            return S.api.post(`/${path}`, payload || {});
        },
        emit: (name, detail) => log.mfaEvents.push({ name, detail }),
        now: () => Date.now()
    });
    log.lockStep = S.wiring.wireLockStep(window, {
        setTimer: (fn, ms) => { log.timers.push({ fn, ms }); return log.timers.length; },
        clearTimer: () => {}
    });
    // the page's test bridge, as test-bridge.js installs it
    window.__test = { lockStep: S.bridge };
    return log;
}

export const payloads = JSON.parse(readFileSync(join(here, '../fixtures/lock_step_room_payloads.json'), 'utf8'));
export const deep = (v) => JSON.parse(JSON.stringify(v));
export const reasonOf = (e) => e && e.body && e.body.reason;

// window.gameScenario as the page holds it after the bootstrap and the start room's load: the bootstrap's
// rooms, with the start room's own payload (objects, npcs) merged over its bootstrap entry.
export function scenarioFromPayloads() {
    const rooms = deep(payloads.bootstrapRooms);
    Object.assign(rooms.office, deep(payloads.startRoom));
    return { startRoom: 'office', rooms };
}
