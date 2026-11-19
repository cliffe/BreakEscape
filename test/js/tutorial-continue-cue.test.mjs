// Tutorial overlay: when a step's objective completes, Continue gets a "ready" state
// (words under the objective, a frame class) and Enter continues, unless something
// else owns the keyboard. No auto-advance; Space is not bound (the game jumps on it).
// Run with: node --test test/js/tutorial-continue-cue.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/tutorial.css'), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// Minimal DOM: the overlay's innerHTML is parsed for class names only
function el(cls) {
    const classes = new Set(cls ? cls.split(/\s+/) : []);
    return {
        textContent: '', style: {}, listeners: {},
        classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) },
        addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); },
        click() { (this.listeners.click || []).forEach(fn => fn()); }
    };
}
const docListeners = { keydown: [] };
let overlayParts = {};
let modalAttr = false;
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
    querySelector: () => (modalAttr ? {} : null)
};
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true, writable: true });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { innerWidth: 1280, gameState: { globalVariables: {} } };
globalThis.confirm = () => true;

// Run timers by hand so the 100 ms completion poll is deterministic
const realSetInterval = globalThis.setInterval;
let ticks = [];
globalThis.setInterval = (fn) => { ticks.push(fn); return ticks.length; };
globalThis.clearInterval = (id) => { ticks[id - 1] = null; };
const tick = () => ticks.slice().forEach(fn => fn && fn());

const { TutorialManager } = await import(dataUrl(readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8')));

async function begin() {
    ticks = []; modalAttr = false;
    window.MinigameFramework = undefined; window.currentConversationNPCId = undefined;
    window.currentConversationMinigameType = undefined; window.openModalCount = undefined;
    docListeners.keydown = [];
    const t = new TutorialManager();
    await t.start(() => { t.completedCalled = true; });
    return t;
}
const press = (key = 'Enter', extra = {}) => {
    const e = { key, repeat: false, target: { closest: () => null }, preventDefault() { this.prevented = true; }, ...extra };
    docListeners.keydown.forEach(fn => fn(e));
    return e;
};
const ready = () => overlayParts['.tutorial-ready'].textContent;

test('ready state does not fire before the objective completes', async () => {
    const t = await begin();
    tick(); tick();
    assert.ok(ready() === '', 'no ready text yet');
    assert.ok(!overlayParts['.tutorial-next'].classList.has('tutorial-next-ready'), 'no ready class yet');
    assert.ok(t.currentStep === 0, 'still step 0');
});

test('completion sets the words and frame class; no auto-advance', async () => {
    const t = await begin();
    t.notifyPlayerMoved();
    tick();
    assert.ok(ready() === 'Done. Press Continue (or Enter).', 'ready words set');
    assert.ok(overlayParts['.tutorial-next'].classList.has('tutorial-next-ready'), 'frame class set');
    assert.ok(overlayParts['.tutorial-next'].style.display === 'inline-block', 'Continue shown');
    tick(); tick();
    assert.ok(t.currentStep === 0, 'no auto-advance');
});

test('Enter does nothing before completion, advances after, and clears the ready state', async () => {
    const t = await begin();
    press();
    assert.ok(t.currentStep === 0, 'Enter ignored while step incomplete');
    t.notifyPlayerMoved(); tick();
    const e = press();
    assert.ok(t.currentStep === 1, 'Enter advanced');
    assert.ok(e.prevented === true, 'Enter default cancelled');
    assert.ok(ready() === '', 'ready text cleared on the next step');
    assert.ok(!overlayParts['.tutorial-next'].classList.has('tutorial-next-ready'), 'frame cleared');
    press();
    assert.ok(t.currentStep === 1, 'step 2 not complete so Enter ignored');
});

test('Space and other keys do not continue', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    press(' '); press('e'); press('Enter', { repeat: true }); press('Enter', { shiftKey: true });
    assert.ok(t.currentStep === 0, 'only a plain Enter advances');
});

test('Enter is ignored while something else owns the keyboard', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    window.MinigameFramework = { currentMinigame: {} };
    press(); assert.ok(t.currentStep === 0, 'minigame open');
    window.MinigameFramework = undefined;
    window.currentConversationNPCId = 'npc_a';
    press(); assert.ok(t.currentStep === 0, 'conversation open');
    window.currentConversationNPCId = undefined;
    window.openModalCount = () => 1;
    press(); assert.ok(t.currentStep === 0, 'modal stack open');
    window.openModalCount = undefined;
    modalAttr = true;
    press(); assert.ok(t.currentStep === 0, 'aria-modal dialog (game menu) open');
    modalAttr = false;
    press('Enter', { target: { closest: () => ({}) } });
    assert.ok(t.currentStep === 0, 'a control has focus (text input, button)');
    press();
    assert.ok(t.currentStep === 1, 'continues once nothing else holds the keys');
});

test('Skip Tutorial still ends it and removes the Enter handler', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    overlayParts['.tutorial-skip'].click();
    assert.ok(t.active === false, 'skipped');
    assert.ok(t.completedCalled === true, 'onComplete called');
    assert.ok(docListeners.keydown.length === 0, 'keydown handler removed');
});

test('reduced motion: CSS keeps the frame but drops the cue animation', () => {
    const base = css.match(/\.tutorial-next\.tutorial-next-ready \{[^}]*\}/)[0];
    assert.ok(/outline: 2px solid/.test(base), 'frame is a 2px outline');
    assert.ok(/steps\(1, end\) 3;/.test(base), 'cue is 3 hard-step iterations');
    assert.ok(!/radius|blur|gradient/.test(base), 'no radius, blur or gradient');
    const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    assert.ok(/\.tutorial-next\.tutorial-next-ready \{\s*animation: none !important;/.test(rm), 'cue off under reduced motion');
});

test('the ready words contain no dash characters', () => {
    const src = readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8');
    const line = src.match(/TUTORIAL_READY_TEXT = '([^']*)'/)[1];
    assert.ok(!/[–—]/.test(line), 'no em or en dash');
});
