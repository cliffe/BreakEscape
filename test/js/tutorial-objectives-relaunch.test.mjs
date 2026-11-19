// Tutorial and the objectives panel: the tutorial collapses the panel only on the compact
// phone layout, remembers it did, and gives it back when the run ends or a relaunch switches
// to desktop steps. A panel the player collapsed stays collapsed.
// Run with: node --test test/js/tutorial-objectives-relaunch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// Minimal DOM: the overlay's innerHTML is parsed for class names only
function el(cls) {
    const classes = new Set(cls ? cls.split(/\s+/) : []);
    return {
        textContent: '', style: {}, listeners: {},
        classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) },
        addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); },
        click() { (this.listeners.click || []).forEach(fn => fn()); },
        blur() { this.blurred = true; }
    };
}
const docListeners = { keydown: [] };
let overlayParts = {};
// Dialogs in the DOM: the real page always has hidden aria-modal panels (game menu,
// session restart confirm), so a hidden one is the default; tests flip `shown`.
const modalSel = '[aria-modal="true"]';
const mkDialog = (sel) => ({ sel, shown: false, checkVisibility() { return this.shown; } });
let hiddenModal = mkDialog(modalSel);
let extraDialogs = [];
globalThis.document = {
    createElement: () => ({
        className: '',
        set innerHTML(html) {
            overlayParts = {};
            for (const [, c] of html.matchAll(/class="([^"]+)"/g)) overlayParts['.' + c.split(' ')[0]] = el(c);
        },
        querySelector: (sel) => overlayParts[sel] || null
    }),
    body: { appendChild(o) { this.last = o; }, removeChild() {} },
    addEventListener: (t, fn) => docListeners[t].push(fn),
    removeEventListener: (t, fn) => { docListeners[t] = docListeners[t].filter(f => f !== fn); },
    querySelectorAll: (s) => {
        const wanted = String(s).split(',').map(x => x.trim());
        return [hiddenModal, ...extraDialogs].filter(d => wanted.includes(d.sel));
    }
};
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true, writable: true });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { innerWidth: 1280, innerHeight: 800, gameScenario: { objectives: [{ id: 'a' }] }, gameState: { globalVariables: {} }, matchMedia: undefined };
globalThis.confirm = () => true;

// Run timers by hand so the 100 ms completion poll is deterministic
const realSetInterval = globalThis.setInterval;
let ticks = [];
globalThis.setInterval = (fn) => { ticks.push(fn); return ticks.length; };
globalThis.clearInterval = (id) => { ticks[id - 1] = null; };
const tick = () => ticks.slice().forEach(fn => fn && fn());

const { TutorialManager } = await import(dataUrl(readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8')));


const WIN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36';
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1';
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';

function fakePanel(collapsed) {
    return {
        isCollapsed: collapsed, userToggles: 0,
        setCollapsed(c) { this.isCollapsed = !!c; },
        toggleCollapse() { this.userToggles++; this.isCollapsed = !this.isCollapsed; }
    };
}
// device: { ua, width, height, coarse, fine }
function setDevice({ ua, width, height = 800, coarse, fine }) {
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: ua }, configurable: true, writable: true });
    window.innerWidth = width;
    window.innerHeight = height;
    window.matchMedia = (q) => ({ matches: q === '(pointer: coarse)' ? coarse : (q === '(any-pointer: fine)' ? fine : false) });
    ticks = [];
    docListeners.keydown = [];
    window.gameMenu = { isOpen: false };
}
const PHONE = { ua: PHONE_UA, width: 390, height: 844, coarse: true, fine: false };
const IPAD = { ua: MAC_UA, width: 1024, height: 768, coarse: true, fine: false };
const DESKTOP = { ua: WIN_UA, width: 1280, height: 800, coarse: false, fine: true };
const hasObjStep = (t) => t.steps.some(s => s.title === 'Objectives');
async function launch(device, panel) {
    setDevice(device);
    window.objectivesPanel = panel;
    const t = new TutorialManager(); t.promptOpen = false;
    await t.start(() => {});
    return t;
}

test('narrow phone still collapses an open panel and drops the objectives step', async () => {
    const panel = fakePanel(false);
    const t = await launch(PHONE, panel);
    assert.ok(panel.isCollapsed === true, 'panel collapsed on a phone');
    assert.ok(hasObjStep(t) === false, 'no objectives step on a phone');
    assert.ok(panel.userToggles === 0, 'collapse is not recorded as a player toggle');
});

test('wide touch device keeps the panel open and keeps the objectives step', async () => {
    const panel = fakePanel(false);
    const t = await launch(IPAD, panel);
    assert.ok(panel.isCollapsed === false, 'panel left open on a wide iPad');
    assert.ok(hasObjStep(t) === true, 'objectives step kept');
    assert.ok(!/W, A, S, D/.test(t.steps[0].instruction), 'still the touch steps');
});

test('relaunch from phone to desktop restores a panel the tutorial collapsed', async () => {
    const panel = fakePanel(false);
    const t = await launch(PHONE, panel);
    assert.ok(panel.isCollapsed === true, 'collapsed by the phone run');
    setDevice(DESKTOP);
    t.relaunch();
    await new Promise(r => setImmediate(r));
    assert.ok(/W, A, S, D/.test(t.steps[0].instruction), 'desktop steps after relaunch');
    assert.ok(hasObjStep(t) === true, 'desktop run has the objectives step');
    assert.ok(panel.isCollapsed === false, 'panel restored for the desktop run');
});

test('relaunch from phone to desktop leaves a panel the player collapsed alone', async () => {
    const panel = fakePanel(true);
    const t = await launch(PHONE, panel);
    assert.ok(panel.isCollapsed === true, 'already collapsed by the player');
    setDevice(DESKTOP);
    t.relaunch();
    await new Promise(r => setImmediate(r));
    assert.ok(panel.isCollapsed === true, 'player collapse is not undone');
});

test('finishing or skipping a phone run restores only what the tutorial collapsed', async () => {
    let panel = fakePanel(false);
    let t = await launch(PHONE, panel);
    t.skip();
    assert.ok(panel.isCollapsed === false, 'skip restores');
    panel = fakePanel(false);
    t = await launch(PHONE, panel);
    t.complete();
    assert.ok(panel.isCollapsed === false, 'complete restores');
    panel = fakePanel(true);
    t = await launch(PHONE, panel);
    t.complete();
    assert.ok(panel.isCollapsed === true, 'player collapse stays after complete');
});

test('a player who reopens the panel mid-run is not collapsed again at the end', async () => {
    const panel = fakePanel(false);
    const t = await launch(PHONE, panel);
    panel.isCollapsed = false; // player reopened it
    t.complete();
    assert.ok(panel.isCollapsed === false, 'left open');
});
