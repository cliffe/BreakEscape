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

const { TutorialManager } = await import(dataUrl(readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8')
    .split("'../ui/hud-lanes.js'").join(`'${dataUrl(readFileSync(join(js, 'ui/hud-lanes.js'), 'utf8'))}'`)));

async function begin(touch = false) {
    ticks = [];
    hiddenModal = mkDialog(modalSel); extraDialogs = [];
    touchFirst = touch; window.gameMenu = { isOpen: false }; window.gameConfirmOpen = undefined;
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
    assert.ok(document.querySelectorAll(modalSel).length >= 1, 'a hidden aria-modal element is in the DOM');
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
    const prefs = mkDialog('#player-preferences-modal');
    extraDialogs = [prefs];
    press(); assert.ok(t.currentStep === 1, 'a hidden preferences modal does not block');
    t.notifyPlayerMoved(); t.currentStep = 1; // step 2 is its own objective; reuse the ready flag directly
    t.stepReady = true;
    prefs.shown = true;
    press(); assert.ok(t.currentStep === 1, 'preferences modal shown blocks Enter');
});

test('m1: without checkVisibility, a shown-looking panel inside a hidden parent does not block Enter', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    // Old browser: no checkVisibility; own display is block, but the parent is display:none
    const panel = { sel: modalSel, style: {}, rects: 0, getClientRects() { return { length: this.rects }; } };
    hiddenModal = panel;
    const realGcs = window.getComputedStyle;
    window.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    press(); assert.ok(t.currentStep === 1, 'hidden by ancestor: Enter advances');
    t.stepReady = true;
    panel.rects = 1;
    press(); assert.ok(t.currentStep === 1, 'rendered panel blocks Enter');
    window.getComputedStyle = realGcs;
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
    let t = await begin(true);
    t.notifyPlayerMoved(); tick();
    assert.ok(ready() === 'Done. Tap Continue.', 'touch wording');
    t = await begin(false);
    t.notifyPlayerMoved(); tick();
    assert.ok(ready() === 'Done. Press Continue (or Enter).', 'pointer wording');
    window.matchMedia = (q) => ({ matches: true });
    t = await begin(true);
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

// Fake layout: rect(top, bottom) per element, panel scrollHeight/clientHeight
const rect = (top, bottom) => () => ({ top, bottom });
function setLayout({ panelTop = 0, panelBottom = 310, lineTop, btnTop, btnBottom, scrollH = 387, clientH = 310, clientTop }) {
    const panel = overlayParts['.tutorial-panel'];
    panel.getBoundingClientRect = rect(panelTop, panelBottom);
    panel.scrollHeight = scrollH; panel.clientHeight = clientH; panel.scrollTop = 0;
    if (clientTop !== undefined) panel.clientTop = clientTop;
    overlayParts['.tutorial-ready'].getBoundingClientRect = rect(lineTop, lineTop + 16);
    overlayParts['.tutorial-next'].getBoundingClientRect = rect(btnTop, btnBottom);
    return panel;
}

test('clipped Continue: the panel scrolls just enough to show it', async () => {
    const t = await begin();
    const panel = setLayout({ lineTop: 330, btnTop: 349, btnBottom: 385 });
    t.notifyPlayerMoved(); tick();
    assert.ok(panel.scrollTop === 79, 'scrolled by the hidden part of the button plus the outline: ' + panel.scrollTop);
});

test('m2: a 2px border is excluded from the scrollport, so the button border is not clipped', async () => {
    const t = await begin();
    // border box 0..314, 2px border: scrollport 2..312
    const panel = setLayout({ panelBottom: 314, lineTop: 330, btnTop: 349, btnBottom: 385, clientH: 310, clientTop: 2 });
    t.notifyPlayerMoved(); tick();
    assert.ok(panel.scrollTop === 385 + 4 - 312, 'bottom edge is the scrollport, not the border box: ' + panel.scrollTop);
});

test('18px themed frame: Continue and its outline clear the inner edge', async () => {
    const t = await begin();
    // border box 0..346, 18px frame: scrollport 18..328 (live 844x390 numbers, Continue 349..385 before scrolling)
    const panel = setLayout({ panelBottom: 346, lineTop: 254 + 39, btnTop: 349, btnBottom: 385, clientH: 310, clientTop: 18, scrollH: 387 });
    t.notifyPlayerMoved(); tick();
    assert.ok(panel.scrollTop === 61, 'scrolled to clear the frame: ' + panel.scrollTop);
    assert.ok(385 + 4 - panel.scrollTop <= 18 + 310, 'button plus outline inside the scrollport');
});

test('m3: removed or hidden panel: no scroll, no throw', async () => {
    const t = await begin();
    const panel = setLayout({ lineTop: 330, btnTop: 349, btnBottom: 385 });
    const nextBtn = overlayParts['.tutorial-next'];
    t.tutorialOverlay = null;
    t.revealReadyCue(overlayParts['.tutorial-ready'], nextBtn);
    assert.ok(panel.scrollTop === 0, 'removed overlay: untouched');
    t.tutorialOverlay = { querySelector: () => ({ scrollHeight: 0, clientHeight: 0, scrollTop: 0, getBoundingClientRect: rect(0, 0) }) };
    t.revealReadyCue(overlayParts['.tutorial-ready'], nextBtn);
    assert.ok(panel.scrollTop === 0, 'hidden panel with no layout: untouched');
});

test('m1: the panel scrolls back to the top when the next step shows', async () => {
    const t = await begin();
    const panel = setLayout({ lineTop: 330, btnTop: 349, btnBottom: 385 });
    t.notifyPlayerMoved(); tick();
    assert.ok(panel.scrollTop > 0, 'scrolled for the ready cue: ' + panel.scrollTop);
    press('Enter');
    assert.ok(t.currentStep === 1, 'advanced');
    assert.ok(panel.scrollTop === 0, 'next step starts at the top: ' + panel.scrollTop);
});

test('visible Continue: no scroll', async () => {
    const t = await begin();
    const panel = setLayout({ lineTop: 250, btnTop: 270, btnBottom: 300 });
    t.notifyPlayerMoved(); tick();
    assert.ok(panel.scrollTop === 0, 'untouched');
    const p2 = setLayout({ lineTop: 330, btnTop: 349, btnBottom: 385, scrollH: 310 });
    t.clearStepReady(); t.setStepReady(overlayParts['.tutorial-next']);
    assert.ok(p2.scrollTop === 0, 'no overflow, no scroll');
});

test('scroll never pushes the ready line above the panel top', async () => {
    const t = await begin();
    const panel = setLayout({ lineTop: 40, btnTop: 60, btnBottom: 500 });
    t.notifyPlayerMoved(); tick();
    assert.ok(panel.scrollTop === 40, 'capped at the line: ' + panel.scrollTop);
});

test('no layout API (test environments): ready state still works, no throw', async () => {
    const t = await begin();
    t.notifyPlayerMoved(); tick();
    assert.ok(ready() === 'Done. Press Continue (or Enter).', 'ready set without layout');
    const panel = overlayParts['.tutorial-panel'];
    panel.getBoundingClientRect = rect(0, 310); panel.scrollHeight = 387; panel.clientHeight = 310;
    t.clearStepReady();
    t.setStepReady(overlayParts['.tutorial-next']);
    assert.ok(t.stepReady === true, 'no throw when the button has no rect');
    assert.ok(panel.scrollTop === 0, 'and the panel is not scrolled');
});

test('the reveal uses no smooth scrolling, focus or window scroll', () => {
    const src = readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8');
    const body = src.slice(src.indexOf('revealReadyCue(readyLine'), src.indexOf('clearStepReady() {'));
    assert.ok(!/smooth|\.focus\(|scrollTo\(|scrollBy\(|scrollIntoView/.test(body), 'instant, panel only');
});
