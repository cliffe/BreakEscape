// Shared harness for the A2b ring tests: the real NPCManager and the real phone-ringer-dom
// adapter (with phone-ringer.js and phone-ring-config.js) on a jsdom window, a fake clock and a
// fake MinigameFramework that calls the same hooks minigame-manager.js does.
// Not a test file (bin/test-js globs *.test.mjs). Copy list: npc-manager.js (npc-los.js,
// phone-chat-speaker.js), phone-ringer-dom.js (phone-ringer.js, phone-ring-config.js).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

console.log = () => {};
console.warn = () => {};

const here = dirname(fileURLToPath(import.meta.url));
export const jsRoot = join(here, '../../public/break_escape/js');
const sys = join(jsRoot, 'systems');
const chat = join(jsRoot, 'minigames/phone-chat');
const dir = mkdtempSync(join(tmpdir(), 'phone-ring-harness-'));
const copy = (from, to, fix = (s) => s) => writeFileSync(join(dir, to), fix(readFileSync(from, 'utf8')));
copy(join(sys, 'npc-los.js'), 'npc-los.mjs');
copy(join(chat, 'phone-chat-speaker.js'), 'phone-chat-speaker.mjs');
copy(join(sys, 'npc-manager.js'), 'npc-manager.mjs', (s) => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy(join(chat, 'phone-ringer.js'), 'phone-ringer.mjs');
copy(join(chat, 'phone-ring-config.js'), 'phone-ring-config.mjs');
copy(join(chat, 'phone-ringer-dom.js'), 'phone-ringer-dom.mjs', (s) => s.replace("'./phone-ringer.js'", "'./phone-ringer.mjs'")
    .replace("'./phone-ring-config.js'", "'./phone-ring-config.mjs'"));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
const win = dom.window;
globalThis.window = win;
globalThis.document = win.document;
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { installPhoneRinger } = await import(pathToFileURL(join(dir, 'phone-ringer-dom.mjs')).href);
export { NPCManager, installPhoneRinger };

export function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter((f) => f !== cb)); },
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach((cb) => cb(data)); },
    };
}

/** A world: fresh body, fake clock, framework, npcManager and ringer. */
export function makeWorld({ npcs = [] } = {}) {
    win.document.body.innerHTML = '';
    let now = 1000;
    let seq = 0;
    let timers = [];
    const fakeSet = (fn, ms) => { const id = ++seq; timers.push({ id, at: now + (ms || 0), fn, every: null }); return id; };
    const fakeInterval = (fn, ms) => { const id = ++seq; timers.push({ id, at: now + ms, fn, every: ms }); return id; };
    const fakeClear = (id) => { timers = timers.filter((t) => t.id !== id); };
    const saved = {
        setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
        setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
    };
    Object.assign(globalThis, { setTimeout: fakeSet, clearTimeout: fakeClear, setInterval: fakeInterval, clearInterval: fakeClear });
    win.setTimeout = fakeSet; win.clearTimeout = fakeClear; win.setInterval = fakeInterval; win.clearInterval = fakeClear;
    Object.defineProperty(win, 'performance', { value: { now: () => now }, configurable: true });
    win.queueMicrotask = (fn) => Promise.resolve().then(fn);

    const dispatcher = makeDispatcher();
    win.eventDispatcher = dispatcher;
    win.gameState = { globalVariables: {} };
    win.breakEscapeSessionOverlayShowing = false;
    win.playerIsKnockedOut = () => false;
    delete win.phoneRinger;
    delete win.lastPlayerHitAt;   // A2c: the hit stamp is per world
    for (const k of ['closeLaptop', 'closeLabWorkstation', 'openCryptoWorkstation', 'openLabWorkstation']) delete win[k];

    const calls = { started: [], ended: [] };
    const fw = {
        currentMinigame: null,
        startMinigame(type, container, params) {
            if (this.currentMinigame && !this.currentMinigame._ending) this.endMinigame(false, null);
            const mg = { _sceneType: type, params, _ending: false };
            this.currentMinigame = mg;
            calls.started.push({ type, params });
            win.phoneRinger?.onMinigameStarted?.(type, params);
            return mg;
        },
        endMinigame(success) {
            const ending = this.currentMinigame;
            if (!ending || ending._ending) return;
            ending._ending = true;
            calls.ended.push(ending);
            this.currentMinigame = null;
            win.phoneRinger?.onMinigameEnded?.(ending);
        },
    };
    win.MinigameFramework = fw;

    const nm = new NPCManager(dispatcher, null);
    win.npcManager = nm;
    for (const n of npcs) nm.npcs.set(n.id, { npcType: 'phone', phoneId: 'player_phone', currentKnot: 'start', homeKnot: 'start', ...n });

    const ringer = installPhoneRinger(win);

    /** Run the fake clock forward, firing timers in order, in 50 ms steps (the ringer's advance() drops longer gaps). */
    async function advance(ms) {
        let left = ms;
        while (left > 0) {
            const step = Math.min(50, left);
            now += step;
            left -= step;
            for (;;) {
                const due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at)[0];
                if (!due) break;
                if (due.every) due.at += due.every; else timers = timers.filter((t) => t !== due);
                due.fn();
            }
            await Promise.resolve();
        }
        await Promise.resolve();
    }
    const banner = () => win.document.querySelector('#phone-ring-layer .incoming-call');
    const click = (sel) => win.document.querySelector(sel).click();
    const restore = () => Object.assign(globalThis, saved);
    return { win, nm, fw, ringer, dispatcher, calls, advance, banner, click, restore, timersLeft: () => timers.length };
}

/** Make the call's minigame behave like phone-chat on the paths the ringer sees. */
export function endCall(world, flags = { _endedByCall: true }) {
    const m = world.fw.currentMinigame;
    Object.assign(m, flags);
    world.fw.endMinigame(true);
}
