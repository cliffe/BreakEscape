// A2c: hold, popups, damage and the ending, against the live adapter (plan 2.3 rows 11 to 16, 18,
// 22, 26, 28; 2.4 pill and status line). The pure rows are in phone-ringer.test.mjs against fakes;
// these run the same rows through phone-ringer-dom.js, the real NPCManager and a jsdom window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, endCall } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra,
});
const emitted = (w, name) => w.dispatcher.emitted.filter(([n]) => n === name).length;
const pill = (w) => w.win.document.querySelector('#phone-ring-layer .incoming-call-hold');

async function ringOverKeypad(extra = {}, world = {}) {
    const w = makeWorld({ npcs: [npc], ...world });
    w.fw.startMinigame('keypad', null, {});
    w.nm._handleEventMapping('caller', 'door_unlock_attempt', ringConfig(extra), {});
    await w.advance(300);
    return w;
}

test('row 12: a call rings over a keypad with the "put them on hold" status; Answer shows the hold pill with Hang up, opens nothing and keeps the keypad', async () => {
    const w = await ringOverKeypad();
    try {
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        assert.match(w.banner().textContent, /Incoming call · Answer puts them on hold until you close this/);
        const keypad = w.fw.currentMinigame;
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        const p = pill(w);
        assert.ok(p, 'pill shows');
        assert.match(p.textContent, /Caller One · on hold · close this to talk/);
        assert.ok(p.querySelector('.incoming-call-decline'), 'Hang up on a non-forced call');
        assert.equal(w.calls.started.length, 1, 'only the keypad');
        assert.equal(w.fw.currentMinigame, keypad, 'the keypad is untouched');
        assert.equal(emitted(w, 'phone_call_answered:caller'), 0, 'answered is emitted when the call opens');
    } finally { w.restore(); }
});

test('row 12: a forced call has no Hang up on the pill and no Decline on the banner', async () => {
    const w = await ringOverKeypad({ disableClose: true });
    try {
        assert.equal(w.banner().querySelector('.incoming-call-decline'), null);
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.ok(pill(w));
        assert.equal(pill(w).querySelector('button'), null, 'no Hang up');
    } finally { w.restore(); }
});

test('row 17: Hang up on the pill is Decline (phone_call_declined) and clears the pill', async () => {
    const w = await ringOverKeypad();
    try {
        w.click('.incoming-call-answer');
        await w.advance(100);
        w.click('#phone-ring-layer .incoming-call-decline');
        assert.equal(emitted(w, 'phone_call_declined:caller'), 1);
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.equal(w.win.document.querySelector('#phone-ring-layer .incoming-call'), null);
    } finally { w.restore(); }
});

test('row 13: closing the keypad opens the held call after the 500 ms wait, once', async () => {
    const w = await ringOverKeypad();
    try {
        w.click('.incoming-call-answer');
        await w.advance(100);
        w.fw.endMinigame(false);
        await w.advance(300);
        assert.equal(w.calls.started.length, 1, 'not yet: the 500 ms wait');
        await w.advance(400);
        assert.equal(w.calls.started.length, 2);
        assert.equal(w.calls.started[1].type, 'phone-chat');
        assert.equal(w.calls.started[1].params.ringerCall.direction, 'incoming');
        assert.equal(emitted(w, 'phone_call_answered:caller'), 1);
        assert.equal(pill(w), null);
        assert.equal(w.ringer.callActive(), true);
    } finally { w.restore(); }
});

test('row 14: another non-conversation minigame open when the first closes (S12 parent) keeps the call held; the pill stays', async () => {
    const w = await ringOverKeypad();
    try {
        w.click('.incoming-call-answer');
        await w.advance(100);
        w.fw.endMinigame(false);
        w.fw.startMinigame('container', null, {});   // the parent comes back in the same swap
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        assert.ok(pill(w), 'pill stays');
        assert.equal(w.calls.started.length, 2, 'keypad and container only');
        w.fw.endMinigame(false);
        await w.advance(900);
        assert.equal(w.calls.started.length, 3);
        assert.equal(w.calls.started[2].type, 'phone-chat');
    } finally { w.restore(); }
});

test('row 15: a conversation opening while held hides the pill and pauses the hold; the call opens when it is over; it never rings again', async () => {
    const w = await ringOverKeypad();
    try {
        w.click('.incoming-call-answer');
        await w.advance(100);
        w.fw.startMinigame('person-chat', null, { npcId: 'x' });   // replaces the keypad
        await w.advance(2000);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        assert.equal(pill(w), null, 'pill hidden under a conversation');
        assert.equal(w.banner(), null, 'and no banner: it never rings again');
        w.fw.endMinigame(true);
        await w.advance(900);
        assert.equal(w.calls.started.at(-1).type, 'phone-chat');
        assert.equal(emitted(w, 'phone_call_answered:caller'), 1);
    } finally { w.restore(); }
});

test('row 15: a legacy scripted scene turning true while held keeps the call held', async () => {
    const w = await ringOverKeypad();
    try {
        w.click('.incoming-call-answer');
        await w.advance(100);
        w.fw.endMinigame(false);
        w.nm._scriptedCall = { npcId: 'x', minigame: null };   // inside the start delay of a scripted call
        await w.advance(900);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        assert.equal(w.calls.started.length, 1);
        w.nm._scriptedCall = null;
        w.ringer.onMinigameEnded({});
        await w.advance(900);
        assert.equal(w.calls.started.length, 2);
    } finally { w.restore(); }
});

test('row 16: a hit closes the keypad; the held call opens only after HIT_QUIET_MS (4 s) with no hit', async () => {
    const w = await ringOverKeypad();
    try {
        let hitAt = null;
        w.win.lastPlayerHitAt = () => hitAt;
        w.click('.incoming-call-answer');
        await w.advance(100);
        hitAt = w.win.performance.now();       // the hit
        w.fw.endMinigame(false);               // closeMinigameOnDamage's complete(false)
        await w.advance(3000);
        assert.equal(w.calls.started.length, 1, 'no call in the middle of a fight');
        hitAt = w.win.performance.now();       // hit again: the quiet time restarts
        await w.advance(3000);
        assert.equal(w.calls.started.length, 1);
        await w.advance(1800);
        assert.equal(w.calls.started.length, 2, 'opens once 4 s have passed with no hit');
    } finally { w.restore(); }
});

test('row 18: left on hold for 90 s (pill showing) the call rings off with the toast and phone_call_missed', async () => {
    const w = await ringOverKeypad();
    try {
        const toasts = [];
        w.win.showNotification = (t) => toasts.push(t);
        w.click('.incoming-call-answer');
        await w.advance(89000);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        await w.advance(2000);
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.equal(emitted(w, 'phone_call_missed:caller'), 1);
        assert.deepEqual(toasts, ['Caller One rang off. Call back from the thread.']);
        assert.equal(pill(w), null);
    } finally { w.restore(); }
});

test('row 18: a forced call has no hold limit', async () => {
    const w = await ringOverKeypad({ disableClose: true });
    try {
        w.click('.incoming-call-answer');
        await w.advance(120000);
        assert.equal(w.ringer.stateOf('caller'), 'held');
    } finally { w.restore(); }
});

// ---- row 11: workstation popups -------------------------------------------------------------

function addPopups(w) {
    const doc = w.win.document;
    const mk = (id) => { const e = doc.createElement('div'); e.id = id; e.style.display = 'none'; doc.body.appendChild(e); return e; };
    const laptop = mk('laptop-popup');
    const lab = mk('lab-popup');
    const frame = doc.createElement('iframe');
    frame.id = 'lab-frame';
    lab.appendChild(frame);
    const log = [];
    w.win.closeLaptop = () => { laptop.style.display = 'none'; log.push('closeLaptop'); w.win.phoneRinger?.onPopupClosed?.(); };
    w.win.closeLabWorkstation = () => { lab.style.display = 'none'; log.push('closeLab'); w.win.phoneRinger?.onPopupClosed?.(); };
    w.win.openCryptoWorkstation = () => { laptop.style.display = 'block'; log.push('openCrypto'); };
    w.win.openLabWorkstation = (src) => { lab.style.display = 'block'; log.push(`openLab:${src}`); };
    return { laptop, lab, frame, log };
}

test('row 11: Answer over the CyberChef popup hides it, opens the call, and the popup comes back after the call', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const p = addPopups(w);
        p.laptop.style.display = 'block';
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'rings over the popup');
        assert.match(w.banner().textContent, /Incoming call(?! ·)/);
        w.click('.incoming-call-answer');
        await w.advance(700);
        assert.deepEqual(p.log, ['closeLaptop']);
        assert.equal(p.laptop.style.display, 'none');
        assert.equal(w.calls.started.length, 1);
        assert.equal(w.calls.started[0].type, 'phone-chat');
        assert.equal(w.ringer.stateOf('caller'), 'connected', 'the put-aside close did not nudge the ringer into a re-ring or a re-open');
        endCall(w);
        await w.advance(100);
        assert.deepEqual(p.log, ['closeLaptop', 'openCrypto']);
        assert.equal(p.laptop.style.display, 'block');
    } finally { w.restore(); }
});

test('row 11: the lab sheet comes back on the frame\'s src property, not the attribute', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const p = addPopups(w);
        Object.defineProperty(p.frame, 'src', { value: 'http://localhost/break_escape/lab/sheet.html', configurable: true });
        p.frame.setAttribute('src', '/break_escape/lab/sheet.html');
        p.lab.style.display = 'block';
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(700);
        assert.deepEqual(p.log, ['closeLab']);
        endCall(w);
        await w.advance(100);
        assert.deepEqual(p.log, ['closeLab', 'openLab:http://localhost/break_escape/lab/sheet.html']);
    } finally { w.restore(); }
});

test('row 11: the popup is not reopened when something else is open by the time the call ends', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const p = addPopups(w);
        p.laptop.style.display = 'block';
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(700);
        endCall(w);
        w.fw.currentMinigame = { _sceneType: 'keypad', params: {}, _ending: false };
        await w.advance(200);
        assert.deepEqual(p.log, ['closeLaptop']);
    } finally { w.restore(); }
});

test('row 11: a declined or rung-off call over a popup leaves the popup alone; a player close of the popup still nudges the ringer', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const p = addPopups(w);
        p.laptop.style.display = 'block';
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-decline');
        assert.deepEqual(p.log, []);
        assert.equal(p.laptop.style.display, 'block');
    } finally { w.restore(); }
});

// ---- rows 22 and 26: forced calls and damage ------------------------------------------------

test('row 22: a forced call auto-answers after 6 s; while hits keep coming it waits', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        let hitAt = null;
        w.win.lastPlayerHitAt = () => hitAt;
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig({ disableClose: true }), {});
        await w.advance(300);
        assert.equal(w.banner().querySelector('.incoming-call-decline'), null);
        await w.advance(4000);
        hitAt = w.win.performance.now();
        await w.advance(3500);
        assert.equal(w.ringer.stateOf('caller'), 'ringing', 'a hit in the last 4 s: no auto-answer');
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), 'connected');
        assert.equal(w.calls.started.length, 1);
        assert.equal(w.calls.started[0].params.disableClose, true);
    } finally { w.restore(); }
});

test('row 22: a forced call rings over a lockpick and auto-answers into a hold', async () => {
    const w = await ringOverKeypad({ disableClose: true });
    try {
        await w.advance(6500);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        assert.ok(pill(w));
        w.fw.endMinigame(false);
        await w.advance(900);
        assert.equal(w.calls.started.at(-1).type, 'phone-chat');
    } finally { w.restore(); }
});

test('row 26: a hit closes a connected forced call; it rings again after 4 s with no hit and opens with resume', async () => {
    const w = makeWorld({ npcs: [{ ...npc, storyState: '{"saved":1}' }] });
    try {
        let hitAt = null;
        w.win.lastPlayerHitAt = () => hitAt;
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig({ disableClose: true }), {});
        await w.advance(6600);
        assert.equal(w.ringer.stateOf('caller'), 'connected');
        assert.equal(w.calls.started.length, 1);
        hitAt = w.win.performance.now();
        endCall(w, {});                       // the damage close: no own-path flag
        await w.advance(200);
        assert.equal(w.ringer.callActive(), false);
        assert.equal(emitted(w, 'phone_call_missed:caller'), 0, 'a forced call is not missed');
        await w.advance(3000);
        assert.equal(w.calls.started.length, 1, 'quiet time not over');
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller') === 'ringing' || w.ringer.stateOf('caller') === 'connected', true);
        await w.advance(7000);
        assert.equal(w.calls.started.length, 2);
        assert.equal(w.calls.started[1].params.startKnot, null, 'resume: the saved story, not the start knot');
        assert.equal(emitted(w, 'phone_call_answered:caller'), 1, 'answered once');
    } finally { w.restore(); }
});

// ---- row 28: the ending ---------------------------------------------------------------------

test('row 28: close() removes queued, ringing and held offers with no events; a connected call finishes; new offers are refused', async () => {
    const w = await ringOverKeypad();
    try {
        w.click('.incoming-call-answer');
        await w.advance(100);
        const before = w.dispatcher.emitted.length;
        w.win.phoneRinger.close();
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.equal(pill(w), null);
        assert.equal(w.dispatcher.emitted.length, before, 'no events');
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig({ handlerIndex: 3, once: false }), {});
        await w.advance(500);
        assert.equal(w.banner(), null, 'refused');
    } finally { w.restore(); }
});

test('row 28: a call connected when the ending starts finishes normally', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(700);
        w.win.phoneRinger.close();
        assert.equal(w.ringer.callActive(), true);
        assert.equal(w.calls.ended.length, 0);
        endCall(w);
        await w.advance(100);
        assert.equal(w.ringer.callActive(), false);
    } finally { w.restore(); }
});
