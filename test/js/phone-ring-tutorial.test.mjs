// Sweep item 9 (from M8 R2 M1): the tutorial ring hold is bounded. The opening accept/skip modal holds
// the ring fully; while a step panel shows, the ring is held for at most 20 s of unpaused time from the
// offer, or until the current step completes, or the tutorial ends, whichever first. Then it rings, with
// the banner moved clear of SKIP TUTORIAL and the step counter. Forced calls follow the same rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra,
});
const tutorial = (w, state) => { w.win.getTutorialManager = () => state; };
const fire = (w, extra) => w.nm._handleEventMapping('caller', 'room_entered:main_office_area', ringConfig(extra), {});

test('item 9: the opening modal holds the ring fully, then it rings when the modal closes', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const state = { active: false, promptOpen: true };
        tutorial(w, state);
        fire(w);
        await w.advance(30000);
        assert.equal(w.banner(), null, 'the opening modal holds the ring fully, with no 20 s release');
        assert.notEqual(w.ringer.stateOf('caller'), 'ringing');
        state.promptOpen = false;            // the player accepted or skipped the opening prompt
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'it rings once the modal is gone');
        assert.ok(w.banner());
    } finally { w.restore(); }
});

test('item 9: an active step holds the ring for ~20 s, then it rings while the step is still up', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        tutorial(w, { active: true, promptOpen: false, currentStep: 0 });
        fire(w);
        await w.advance(15000);
        assert.equal(w.banner(), null, 'held at 15 s');
        assert.notEqual(w.ringer.stateOf('caller'), 'ringing');
        await w.advance(7000);               // past 20 s of unpaused time from the offer
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'rings after 20 s, the step still showing');
        assert.ok(w.banner(), 'the banner shows');
        assert.ok(w.banner().closest('#phone-ring-layer').classList.contains('under-tutorial'),
            'the banner is placed clear of the tutorial panel');
    } finally { w.restore(); }
});

test('item 9: the step completing releases the hold before 20 s', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const state = { active: true, promptOpen: false, currentStep: 0 };
        tutorial(w, state);
        fire(w);
        await w.advance(4000);
        assert.equal(w.banner(), null, 'held while the step is on its first value');
        state.currentStep = 1;               // the player finished the step (nextStep bumps currentStep)
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'the completed step lets it ring at once');
    } finally { w.restore(); }
});

test('item 9: the tutorial ending releases the hold', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const state = { active: true, promptOpen: false, currentStep: 0 };
        tutorial(w, state);
        fire(w);
        await w.advance(4000);
        assert.equal(w.banner(), null);
        state.active = false;                // complete() or skip
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'rings once the tutorial is over');
    } finally { w.restore(); }
});

test('item 9: a forced call follows the same rule — no auto-answer for ~20 s, then it rings and answers', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        tutorial(w, { active: true, promptOpen: false, currentStep: 0 });
        fire(w, { disableClose: true });
        await w.advance(15000);
        assert.equal(w.calls.started.length, 0, 'a forced call does not answer itself while the step holds');
        assert.notEqual(w.ringer.stateOf('caller'), 'ringing');
        await w.advance(8000);               // past 20 s, then the forced auto-answer beat
        assert.ok(w.ringer.stateOf('caller') === 'ringing' || w.calls.started.length > 0,
            'it rings (then auto-answers) once the 20 s hold is up');
    } finally { w.restore(); }
});

test('item 9: a step starting while a call rings requeues it; it rings again within 20 s', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const state = { active: false, promptOpen: false, currentStep: 0 };
        tutorial(w, state);
        fire(w);
        await w.advance(500);
        assert.ok(w.banner(), 'it rings with no tutorial up');
        state.active = true;                 // a tutorial step comes up
        await w.advance(1500);
        assert.equal(w.banner(), null, 'the banner is withdrawn while the step shows');
        await w.advance(21000);
        assert.ok(w.banner(), 'it rings again once the 20 s hold is up');
    } finally { w.restore(); }
});

test('item 9 (R1 n3): paused time does not build up the 20 s step hold', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        tutorial(w, { active: true, promptOpen: false, currentStep: 0 });
        fire(w);
        w.win.breakEscapeSessionOverlayShowing = true;   // the session overlay / Mission Brief / hidden tab
        await w.advance(30000);
        assert.equal(w.banner(), null, 'the hold does not accrue while paused, even past 20 s of wall time');
        assert.notEqual(w.ringer.stateOf('caller'), 'ringing');
        w.win.breakEscapeSessionOverlayShowing = false;  // back in the game
        await w.advance(21000);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'the 20 s counts only unpaused time');
    } finally { w.restore(); }
});

test('item 9 (R1 n3): hideBanner clears the under-tutorial class when the ring stops', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        tutorial(w, { active: true, promptOpen: false, currentStep: 0 });
        fire(w);
        await w.advance(22000);
        const layer = w.win.document.getElementById('phone-ring-layer');
        assert.ok(w.banner(), 'it rings with a step up');
        assert.ok(layer.classList.contains('under-tutorial'), 'the banner drops clear of the tutorial');
        w.ringer.decline('caller');                      // the ring stops: render hides the banner
        await w.advance(500);
        assert.equal(w.banner(), null, 'the banner is gone');
        assert.ok(!layer.classList.contains('under-tutorial'), 'hideBanner cleared the class');
    } finally { w.restore(); }
});

test('item 9: no tutorial manager on the window, or an inactive one, does not hold', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        delete w.win.getTutorialManager;
        fire(w);
        await w.advance(500);
        assert.ok(w.banner());
    } finally { w.restore(); }
});
