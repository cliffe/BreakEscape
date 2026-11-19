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
        click() { (this.listeners.click || []).forEach(fn => fn()); },
        blur() { this.blurred = true; }
    };
}
const docListeners = { keydown: [] };
let overlayParts = {};
// Dialogs in the DOM: the real page always has hidden aria-modal panels (game menu,
// session restart confirm), so a hidden one is the default; tests flip `shown`.
let hiddenModal = { shown: false, checkVisibility() { return this.shown; } };
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
    querySelectorAll: () => [hiddenModal, ...extraDialogs]
};
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true, writable: true });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
let touchFirst = false;
const mediaFor = (q) => ({ matches: q === '(pointer: coarse)' ? touchFirst : (q === '(any-pointer: fine)' ? !touchFirst : false) });
globalThis.window = { innerWidth: 1280, gameState: { globalVariables: {} }, matchMedia: mediaFor };
globalThis.confirm = () => true;

// Run timers by hand so the 100 ms completion poll is deterministic
const realSetInterval = globalThis.setInterval;
let ticks = [];
globalThis.setInterval = (fn) => { ticks.push(fn); return ticks.length; };
globalThis.clearInterval = (id) => { ticks[id - 1] = null; };
const tick = () => ticks.slice().forEach(fn => fn && fn());

const { TutorialManager } = await import(dataUrl(readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8')));

async function begin() {
    ticks = [];
    hiddenModal = { shown: false, checkVisibility() { return this.shown; } }; extraDialogs = [];
    touchFirst = false; window.gameMenu = { isOpen: false }; window.gameConfirmOpen = undefined;
    window.MinigameFramework = undefined; window.currentConversationNPCId = undefined;
    window.currentConversationMinigameType = undefined; window.openModalCount = undefined;
    docListeners.keydown = [];
    const t = new TutorialManager();
    t.promptOpen = false;
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
    hiddenModal.shown = true;
    press(); assert.ok(t.currentStep === 0, 'aria-modal dialog shown');
    hiddenModal.shown = false;
    press('Enter', { target: { closest: () => ({}) } });
    assert.ok(t.currentStep === 0, 'a control has focus (text input, button)');
    press();
    assert.ok(t.currentStep === 1, 'continues once nothing else holds the keys');
});

test('B1: Enter advances with the hidden aria-modal panel present and the game menu closed; ignored once shown', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    assert.ok(document.querySelectorAll().length >= 1, 'a hidden aria-modal element is in the DOM');
    window.gameMenu = { isOpen: true };
    press(); assert.ok(t.currentStep === 0, 'game menu open: ignored');
    window.gameMenu = { isOpen: false };
    hiddenModal.shown = true;
    press(); assert.ok(t.currentStep === 0, 'aria-modal shown: ignored');
    hiddenModal.shown = false;
    press(); assert.ok(t.currentStep === 1, 'hidden panel does not block Enter');
});

test('other keyboard owners block Enter: confirm, prompt, conversation minigame, preferences modal', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    window.gameConfirmOpen = () => true;
    press(); assert.ok(t.currentStep === 0, 'game confirm open');
    window.gameConfirmOpen = undefined;
    t.promptOpen = true;
    press(); assert.ok(t.currentStep === 0, 'tutorial prompt open');
    t.promptOpen = false;
    window.currentConversationMinigameType = 'phone-chat';
    press(); assert.ok(t.currentStep === 0, 'conversation minigame open');
    window.currentConversationMinigameType = undefined;
    const prefs = { shown: false, checkVisibility() { return this.shown; } };
    extraDialogs = [prefs];
    press(); assert.ok(t.currentStep === 1, 'a hidden preferences modal does not block');
    t.notifyPlayerMoved(); t.currentStep = 1; // step 2 is its own objective; reuse the ready flag directly
    t.stepReady = true;
    prefs.shown = true;
    press(); assert.ok(t.currentStep === 1, 'preferences modal shown blocks Enter');
});

test('Enter listener: one after relaunch twice, none after the last step completes', async () => {
    const t = await begin();
    assert.ok(docListeners.keydown.length === 1, 'one listener after start');
    t.relaunch(); t.relaunch();
    assert.ok(docListeners.keydown.length === 1, 'one listener after two relaunches');
    t.active = true; t.currentStep = t.steps.length - 1; t.stepReady = true;
    press();
    assert.ok(docListeners.keydown.length === 0, 'listener removed after complete()');
});

test('touch-first devices are not told to press Enter; others are', async () => {
    let t = await begin();
    touchFirst = true;
    t.notifyPlayerMoved(); tick();
    assert.ok(ready() === 'Done. Press Continue.', 'touch wording');
    touchFirst = false;
    t = await begin();
    t.notifyPlayerMoved(); tick();
    assert.ok(ready() === 'Done. Press Continue (or Enter).', 'pointer wording');
    touchFirst = true;
    window.matchMedia = (q) => ({ matches: true });
    t = await begin();
    t.notifyPlayerMoved(); tick();
    assert.ok(ready() === 'Done. Press Continue (or Enter).', 'coarse primary with a fine pointer available keeps Enter');
    window.matchMedia = mediaFor;
});

test('Skip then Cancel blurs the Skip button and keeps the tutorial going', async () => {
    const t = await begin();
    globalThis.confirm = () => false;
    overlayParts['.tutorial-skip'].click();
    globalThis.confirm = () => true;
    assert.ok(overlayParts['.tutorial-skip'].blurred === true, 'Skip blurred');
    assert.ok(t.active === true, 'still active');
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
    for (const m of src.matchAll(/TUTORIAL_READY_TEXT(?:_TOUCH)? = '([^']*)'/g)) {
        assert.ok(!/[–—]/.test(m[1]), 'no em or en dash');
    }
});
