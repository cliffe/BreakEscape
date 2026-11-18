// Focus follows the ring layer: when the focused ring button is removed (banner to pill, or the
// ring taken down) keyboard focus must not drop to <body>, and a mouse-focused button must not
// pass focus on (focus trap R2 m4, R3 M1/m1/m2/m3/n4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { makeWorld, jsRoot } from './phone-ring-harness.mjs';

// The real manager's focusable list, so the ring tests see its rules (hidden, disabled, negative tabindex)
const { MinigameFramework: MF } = await import(pathToFileURL(join(jsRoot, 'minigames/framework/minigame-manager.js')).href);

const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const other = { id: 'other', displayName: 'Other One', avatar: 'assets/y.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra,
});

// jsdom does not track :focus-visible: a flag stands in (true = focused by keyboard, false = by mouse)
let focusVisible = true;
const first = makeWorld({ npcs: [] });
const Elem = first.win.Element.prototype;
const realMatches = Elem.matches;
Elem.matches = function (sel) { return sel === ':focus-visible' ? focusVisible : realMatches.call(this, sel); };
first.restore();

async function ringOverKeypad({ extra = {}, realTrap = true } = {}) {
    focusVisible = true;
    const w = makeWorld({ npcs: [npc, other] });
    const doc = w.win.document;
    const container = doc.createElement('div');
    container.innerHTML = '<button id="minigame-close">X</button><button id="kp-1">1</button><button id="kp-off" disabled>0</button>';
    doc.body.appendChild(container);
    w.fw.startMinigame('keypad', null, {});
    w.fw.currentMinigame.container = container;
    if (realTrap) w.fw._trapFocusables = (root, inc) => MF._trapFocusables(root, inc);
    w.nm._handleEventMapping('caller', 'door_unlock_attempt', ringConfig(extra), {});
    await w.advance(300);
    return w;
}
const hangOf = (doc) => doc.querySelector('#phone-ring-layer .incoming-call-hold button');

test('m4: Answer on a keyboard-focused banner button moves focus to the new pill Hang up button', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.ok(hangOf(doc), 'pill has Hang up');
        assert.equal(doc.activeElement, hangOf(doc), 'focus is on Hang up, not body');
    } finally { w.restore(); }
});

test('M1: a mouse-focused Answer does not hand focus to Hang up; focus drops to body', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        focusVisible = false;
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.ok(hangOf(doc), 'pill shown');
        assert.notEqual(doc.activeElement, hangOf(doc), 'Hang up does not take focus after a mouse click');
        assert.equal(doc.activeElement, doc.body);
    } finally { w.restore(); }
});

test('M1: a mouse-focused ring button taken down does not move focus into the minigame', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-decline').focus();
        focusVisible = false;
        w.click('.incoming-call-decline');
        await w.advance(100);
        assert.equal(doc.activeElement, doc.body);
    } finally { w.restore(); }
});

test('m4: without focus in the layer, the pill does not take focus', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.getElementById('kp-1').focus();
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.equal(doc.activeElement.id, 'kp-1');
    } finally { w.restore(); }
});

test('m4/n4: taking the focused ring down hands focus to the first control that is not the X', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        w.click('.incoming-call-answer');
        await w.advance(100);
        hangOf(doc).focus();
        hangOf(doc).click();
        await w.advance(100);
        assert.equal(doc.querySelector('#phone-ring-layer .incoming-call'), null, 'ring gone');
        assert.equal(doc.activeElement.id, 'kp-1', 'not #minigame-close, not the disabled key');
    } finally { w.restore(); }
});

test('n4: when the X is the only control it still gets focus', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.getElementById('kp-1').remove();
        doc.querySelector('.incoming-call-decline').focus();
        w.click('.incoming-call-decline');
        await w.advance(100);
        assert.equal(doc.activeElement.id, 'minigame-close');
    } finally { w.restore(); }
});

test('m4: with no minigame open nothing is forced', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        focusVisible = true;
        const doc = w.win.document;
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        doc.querySelector('.incoming-call-decline').focus();
        w.click('.incoming-call-decline');
        await w.advance(100);
        assert.equal(doc.querySelector('#phone-ring-layer .incoming-call'), null);
        assert.equal(doc.activeElement, doc.body);
    } finally { w.restore(); }
});

test('m2/m3: the hide microtask skips when focus has moved elsewhere', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-decline').focus();
        w.click('.incoming-call-decline');
        // synchronously after the hide, before the microtask: something else takes focus
        doc.getElementById('minigame-close').focus();
        await w.advance(100);
        assert.equal(doc.activeElement.id, 'minigame-close', 'not moved on to kp-1');
    } finally { w.restore(); }
});

test('m2: a pending loss never takes focus from an element that gained it in between', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-decline').focus();
        w.click('.incoming-call-decline');
        doc.getElementById('kp-1').focus();           // gained focus after the removal
        w.nm._handleEventMapping('other', 'door_unlock_attempt', ringConfig(), {});
        await w.advance(300);
        assert.ok(doc.querySelector('#phone-ring-layer .incoming-call'), 'the next call rings');
        assert.equal(doc.activeElement.id, 'kp-1');
    } finally { w.restore(); }
});

test('m1/m3: a banner re-render keeps the same control focused for the same caller', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        const old = doc.querySelector('.incoming-call-decline');
        old.focus();
        // closing the keypad changes the banner's key (no longer over a minigame): showBanner runs again
        w.fw.endMinigame(false);
        await w.advance(100);
        const now = doc.querySelector('.incoming-call-decline');
        assert.ok(now && now !== old, 'the banner was rebuilt');
        assert.equal(doc.activeElement, now, 'Decline kept keyboard focus');
    } finally { w.restore(); }
});

test('m1: Answer keeps Answer on a same-caller re-render; a different caller gets Decline', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        w.fw.endMinigame(false);
        await w.advance(100);
        assert.ok(doc.activeElement.classList.contains('incoming-call-answer'), 'same caller: Answer');
        // decline from Answer's neighbour: queue another caller, then answer-focus and decline the first
        w.nm._handleEventMapping('other', 'room_entered', ringConfig(), {});
        await w.advance(300);
        doc.querySelector('.incoming-call-decline').focus();
        w.click('.incoming-call-decline');
        await w.advance(300);
        const b = w.banner();
        assert.equal(b?.dataset.npcId, 'other', 'the next caller rings');
        assert.ok(doc.activeElement.classList.contains('incoming-call-decline'), 'different caller: Decline, never Answer');
    } finally { w.restore(); }
});

test('M1: a mouse-focused control is not passed on by a banner re-render', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        focusVisible = false;
        w.fw.endMinigame(false);
        await w.advance(100);
        assert.equal(doc.activeElement, doc.body);
    } finally { w.restore(); }
});

test('M1: held Enter (keydown repeat) on a ring button is ignored', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        const answer = doc.querySelector('.incoming-call-answer');
        const rep = new w.win.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true });
        answer.dispatchEvent(rep);
        assert.equal(rep.defaultPrevented, true);
        const first = new w.win.KeyboardEvent('keydown', { key: 'Enter', repeat: false, bubbles: true, cancelable: true });
        answer.dispatchEvent(first);
        assert.equal(first.defaultPrevented, false);
    } finally { w.restore(); }
});
