// A2b: the ring layer, the adapter's wiring to the window, and the hooks (plan 2.4, 2.9).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, endCall, jsRoot } from './phone-ring-harness.mjs';

const read = (p) => readFileSync(join(jsRoot, p), 'utf8');
const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra,
});

test('the layer is a body child outside the bark container, and phone-ring.css puts it at z-index 2300', () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const layer = w.win.document.getElementById('phone-ring-layer');
        assert.equal(layer.parentElement, w.win.document.body);
        assert.equal(layer.getAttribute('role'), 'region');
        assert.equal(layer.getAttribute('aria-live'), 'assertive');
        assert.equal(layer.closest('#npc-bark-container'), null);
        const css = readFileSync(join(jsRoot, '../css/phone-ring.css'), 'utf8');
        assert.match(css, /#phone-ring-layer \{[^}]*z-index: 2300;/);
        assert.match(read('../../../app/views/break_escape/games/show.html.erb'), /css\/phone-ring\.css/);
    } finally { w.restore(); }
});

test('a ring mapping offers the call; the banner has Answer and Decline with aria-labels', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig({ callLabel: 'Test caller' }), {});
        await w.advance(300);
        const b = w.banner();
        assert.ok(b, 'banner shown');
        assert.match(b.textContent, /Caller One/);
        assert.match(b.textContent, /Test caller/);
        assert.equal(b.querySelector('.incoming-call-answer').getAttribute('aria-label'), 'Answer call from Caller One');
        assert.equal(b.querySelector('.incoming-call-decline').getAttribute('aria-label'), 'Decline call');
        assert.equal(w.calls.started.length, 0, 'ringing opens nothing');
    } finally { w.restore(); }
});

test('Answer opens a voiced phone-chat after the 500 ms delay with ringerCall, no Cancel, and phone_call_answered', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(400);
        assert.equal(w.calls.started.length, 0, 'not yet');
        await w.advance(200);
        assert.equal(w.calls.started.length, 1);
        const p = w.calls.started[0].params;
        assert.equal(w.calls.started[0].type, 'phone-chat');
        assert.equal(p.voiced, true);
        assert.equal(p.startKnot, 'ring_call');
        assert.equal(p.showCancel, false);
        assert.equal(p.ringerCall.direction, 'incoming');
        assert.ok(p.ringerCall.id);
        assert.ok(w.dispatcher.emitted.some(([n]) => n === 'phone_call_answered:caller'));
        assert.equal(w.ringer.callActive(), true);
        assert.equal(w.banner(), null, 'banner gone');
        assert.equal(w.calls.ended.length, 0, 'no endMinigame on Answer');
        assert.ok(!w.dispatcher.emitted.some(([n]) => n === 'minigame_failed'));
    } finally { w.restore(); }
});

test('Decline emits phone_call_declined; a forced banner has no Decline and auto-answers', async () => {
    const w = makeWorld({ npcs: [npc, { id: 'boss', displayName: 'Boss' }] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-decline');
        assert.ok(w.dispatcher.emitted.some(([n]) => n === 'phone_call_declined:caller'));
        assert.equal(w.banner(), null);
        w.nm._handleEventMapping('boss', 'room_entered', ringConfig({ disableClose: true, handlerIndex: 1 }), {});
        await w.advance(300);
        assert.ok(w.banner());
        assert.equal(w.banner().querySelector('.incoming-call-decline'), null, 'forced: no Decline');
        await w.advance(6500);
        assert.equal(w.calls.started.length, 1, 'auto-answered and opened');
        assert.equal(w.calls.started[0].params.disableClose, true);
    } finally { w.restore(); }
});

test('an unanswered ring times out after 20 s and emits phone_call_missed', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(19000);
        assert.ok(w.banner());
        await w.advance(1500);
        assert.equal(w.banner(), null);
        assert.ok(w.dispatcher.emitted.some(([n]) => n === 'phone_call_missed:caller'));
    } finally { w.restore(); }
});

test('delayed ring mappings fire with a minigame open and are queued; other delayed mappings still wait', async () => {
    const w = makeWorld({ npcs: [npc, { id: 'other', displayName: 'Other', npcType: 'person' }] });
    try {
        w.fw.currentMinigame = { _sceneType: 'lockpicking', params: {}, _ending: false };
        w.nm.eventDispatcher = w.dispatcher;
        w.nm._scheduleDelayedMapping('caller', 'door_unlock_attempt', ringConfig({ delayMs: 1000 }), {});
        w.nm._scheduleDelayedMapping('other', 'door_unlock_attempt',
            { handlerIndex: 0, knot: 'x', conversationMode: 'person-chat', once: true, cooldown: 0, delayMs: 1000 }, {});
        await w.advance(1200);
        assert.equal(w.ringer.stateOf('caller'), 'queued', 'the ring mapping fired and queued behind the minigame');
        assert.equal(w.banner(), null, 'nothing rings over an open minigame in A2b');
        assert.equal(w.nm._scriptedCallQueue.length, 0);
        assert.equal(w.calls.started.length, 0, 'the person-chat mapping kept waiting');
        // the minigame closes: the queued call rings at once
        w.fw.currentMinigame = null;
        w.ringer.onMinigameEnded({});
        await w.advance(100);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
    } finally { w.restore(); }
});

test('a popup blocks ringing; closing it (the popup hook) lets the queued call ring', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const popup = w.win.document.createElement('div');
        popup.id = 'laptop-popup';
        popup.style.display = 'block';
        w.win.document.body.appendChild(popup);
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'queued');
        popup.style.display = 'none';
        w.ringer.onPopupClosed();
        await w.advance(50);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
    } finally { w.restore(); }
});

test('a timed ring conversation offers the call, sets its global at the first ring, and holds the opening brief', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.scheduleTimedConversation({ npcId: 'caller', targetKnot: 'ring_call', delay: 0, ring: true, opening: true, setGlobalOnStart: 'caller_started' });
        const conv = w.nm.timedConversations[0];
        conv.delivered = true;
        w.fw.currentMinigame = { _sceneType: 'notes', params: {}, _ending: false };
        w.nm._deliverTimedConversation(conv);
        assert.equal(w.ringer.stateOf('caller'), 'queued');
        assert.equal(w.nm.hasPendingOpeningConversation(), true, 'row 30');
        assert.notEqual(w.win.gameState.globalVariables.caller_started, true);
        w.fw.currentMinigame = null;
        w.ringer.onMinigameEnded({});
        await w.advance(100);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        assert.equal(w.win.gameState.globalVariables.caller_started, true);
        assert.equal(w.nm.hasPendingOpeningConversation(), true, 'still pending while ringing');
    } finally { w.restore(); }
});

test('a ring mapping persists its trigger when offered (once-only), and a dropped offer falls through to nothing', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        const saved = w.nm.exportTriggeredEvents();
        assert.equal(Object.keys(saved).length, 1, 'persisted at offer, before the call closes');
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig({ cooldown: 0, once: false, handlerIndex: 1 }), {});
        await w.advance(100);
        assert.equal(w.nm._scriptedCallQueue.length, 0, 'the same-knot repeat is dropped, not queued as a scripted call');
        assert.equal(w.ringer.queueLength(), 0);
    } finally { w.restore(); }
});

test('wiring: the minigame-manager start and end hooks, popup hooks, the bark hold and the notification sound', () => {
    const mm = read('minigames/framework/minigame-manager.js');
    assert.match(mm, /this\.currentMinigame\.start\(\);\s*\n[^\n]*\n\s*try \{ window\.phoneRinger\?\.onMinigameStarted\?\.\(sceneType, params\)/);
    assert.match(mm, /\} finally \{[\s\S]{0,400}ending\._suspendedForChild !== true[\s\S]{0,120}window\.phoneRinger\?\.onMinigameEnded\?\.\(ending\)/);
    assert.match(read('utils/crypto-workstation.js'), /closeLaptop\(\)[\s\S]*phoneRinger\?\.onPopupClosed\?\.\(\)/);
    assert.match(read('utils/lab-workstation.js'), /closeLabWorkstation\(\)[\s\S]*phoneRinger\?\.onPopupClosed\?\.\(\)/);
    assert.match(read('systems/npc-barks.js'), /if \(window\.phoneRinger\?\.callActive\?\.\(\)\) return true;/);
    assert.match(read('systems/sound-manager.js'), /soundName\.includes\('phone_ringtone'\)/);
    assert.match(read('main.js'), /installPhoneRinger\(window\);/);
});

test('answering over nothing never calls endMinigame; the call ends once and the end hook reports it', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(700);
        assert.equal(w.ringer.callActive(), true);
        endCall(w);
        await w.advance(100);
        assert.equal(w.ringer.callActive(), false);
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.equal(w.calls.ended.length, 1);
        assert.equal(w.dispatcher.emitted.filter(([n]) => n === 'phone_call_missed:caller').length, 0, 'an own-path end is not a miss');
    } finally { w.restore(); }
});

test('A2b R1 M1: the brief stays held between Answer and the call opening (the open delay), and after it', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm.scheduleTimedConversation({ npcId: 'caller', targetKnot: 'ring_call', delay: 0, ring: true, opening: true });
        const conv = w.nm.timedConversations[0];
        conv.delivered = true;
        w.nm._deliverTimedConversation(conv);
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        w.click('.incoming-call-answer');
        await w.advance(200);
        assert.equal(w.ringer.stateOf('caller'), 'connected');
        assert.equal(w.calls.started.length, 0, 'in the gap: connected, no minigame yet');
        assert.equal(w.nm.hasPendingOpeningConversation(), true, 'the Mission Brief must not open in the gap');
        await w.advance(500);
        assert.equal(w.calls.started.length, 1);
        assert.equal(w.nm.hasPendingOpeningConversation(), true, 'and while the call is open');
        endCall(w);
        await w.advance(100);
        assert.equal(w.nm.hasPendingOpeningConversation(), false, 'released after the call');
    } finally { w.restore(); }
});

test('A2b R1 M2: a declined or missed timed ring call leaves npc.currentKnot on the thread, not the call knot', async () => {
    for (const how of ['decline', 'ringout']) {
        const w = makeWorld({ npcs: [npc] });
        try {
            w.nm.scheduleTimedConversation({ npcId: 'caller', targetKnot: 'ring_call', delay: 0, ring: true });
            const conv = w.nm.timedConversations[0];
            conv.delivered = true;
            w.nm._deliverTimedConversation(conv);
            await w.advance(300);
            assert.equal(w.ringer.stateOf('caller'), 'ringing', how);
            assert.equal(w.nm.getNPC('caller').currentKnot, 'start', `${how}: not moved at offer`);
            if (how === 'decline') w.click('.incoming-call-decline'); else await w.advance(30000);
            await w.advance(200);
            assert.equal(w.ringer.stateOf('caller'), null, how);
            assert.equal(w.nm.getNPC('caller').currentKnot, 'start', `${how}: the thread opens on its own knot`);
        } finally { w.restore(); }
    }
});

test('A2b R2 M1: a mapping ring leaves npc.currentKnot on the thread when declined, rung out or queued; Answer sets the call knot at open', async () => {
    for (const how of ['decline', 'ringout', 'answer']) {
        const w = makeWorld({ npcs: [npc] });
        try {
            w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
            await w.advance(300);
            assert.equal(w.ringer.stateOf('caller'), 'ringing', how);
            assert.equal(w.nm.getNPC('caller').currentKnot, 'start', `${how}: not moved at offer`);
            if (how === 'answer') {
                w.click('.incoming-call-answer');
                await w.advance(700);
                assert.equal(w.calls.started[0].params.startKnot, 'ring_call');
                assert.equal(w.nm.getNPC('caller').currentKnot, 'ring_call', 'set when the call opens');
                continue;
            }
            if (how === 'decline') w.click('.incoming-call-decline'); else await w.advance(30000);
            await w.advance(200);
            assert.equal(w.ringer.stateOf('caller'), null, how);
            assert.equal(w.nm.getNPC('caller').currentKnot, 'start', `${how}: the thread opens on its own knot`);
        } finally { w.restore(); }
    }
});

test('A2b R2 M1: a ring queued behind a call does not move currentKnot either', async () => {
    const other = { id: 'other', displayName: 'Other', avatar: 'assets/x.png' };
    const w = makeWorld({ npcs: [npc, other] });
    try {
        w.nm._handleEventMapping('other', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig({ handlerIndex: 1 }), {});
        await w.advance(300);
        assert.equal(w.nm.getNPC('caller').currentKnot, 'start', 'queued or replaced: unmoved');
    } finally { w.restore(); }
});

// A8: the ringtone loops through the sound manager and stops on every outcome.
function fakeSoundManager(win, { withRingtone = true } = {}) {
    const log = [];
    win.soundManager = {
        sounds: withRingtone ? { phone_ringtone: {}, phone_vibrate: {} } : { phone_vibrate: {} },
        play(name, opts) { log.push(['play', name, opts?.loop === true]); },
        stop(name) { log.push(['stop', name]); },
    };
    return log;
}
const playing = (log) => log.filter((e) => e[0] === 'play' && e[1] === 'phone_ringtone').length
    - log.filter((e) => e[0] === 'stop' && e[1] === 'phone_ringtone').length;

test('A8: wiring: the ringtone is loaded beside phone_vibrate and the file exists', () => {
    const sm = read('systems/sound-manager.js');
    assert.match(sm, /load\.audio\('phone_ringtone', 'sounds\/phone_ringtone\.mp3'\)/);
    assert.match(sm, /'phone_vibrate', 'phone_ringtone'/);
    assert.ok(readFileSync(join(jsRoot, '../assets/sounds/phone_ringtone.mp3')).length > 1000);
});

test('A8: the ringtone starts looped when the call rings and stops on Answer', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const log = fakeSoundManager(w.win);
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        assert.deepEqual(log.filter((e) => e[1] === 'phone_ringtone'), [['play', 'phone_ringtone', true]]);
        assert.equal(playing(log), 1);
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.equal(playing(log), 0, 'stopped on Answer');
        await w.advance(2500);
        assert.equal(log.filter((e) => e[1] === 'phone_ringtone' && e[0] === 'play').length, 1, 'no restart');
    } finally { w.restore(); }
});

test('A8: the ringtone stops on Decline and on timeout', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const log = fakeSoundManager(w.win);
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        assert.equal(playing(log), 1);
        w.click('.incoming-call-decline');
        assert.equal(playing(log), 0, 'stopped on Decline');
    } finally { w.restore(); }
    const w2 = makeWorld({ npcs: [npc] });
    try {
        const log = fakeSoundManager(w2.win);
        w2.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w2.advance(300);
        assert.equal(playing(log), 1);
        await w2.advance(21000);
        assert.equal(w2.banner(), null);
        assert.equal(playing(log), 0, 'stopped on timeout');
    } finally { w2.restore(); }
});

test('A8: with the ringtone not loaded the banner falls back to phone_vibrate every 2 s and stops it', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const log = fakeSoundManager(w.win, { withRingtone: false });
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(4300);
        assert.ok(log.filter((e) => e[1] === 'phone_vibrate').length >= 2);
        w.click('.incoming-call-decline');
        const n = log.length;
        await w.advance(5000);
        assert.equal(log.length, n, 'no more vibrates after Decline');
    } finally { w.restore(); }
});

// A2b R2 m1: plan 2.4, "stops on any outcome and while paused". The exits the A8 tests did not cover.
async function ringing(opts = {}) {
    const w = makeWorld({ npcs: [npc] });
    const log = fakeSoundManager(w.win);
    w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
    await w.advance(300);
    assert.equal(playing(log), 1, 'rings');
    return { w, log };
}

test('A2b R2 m1: the ringtone stops when a minigame, a workstation popup or a knockout takes the ring away', async () => {
    {
        const { w, log } = await ringing();
        try {
            w.fw.startMinigame('notes', null, { title: 'Notes' });
            await w.advance(300);
            assert.equal(playing(log), 0, 'a minigame opened over the ring');
        } finally { w.restore(); }
    }
    {
        const { w, log } = await ringing();
        try {
            const pop = w.win.document.createElement('div'); pop.id = 'laptop-popup'; pop.style.display = 'block';
            w.win.document.body.appendChild(pop);
            await w.advance(600);
            assert.equal(playing(log), 0, 'a workstation popup opened');
        } finally { w.restore(); }
    }
    {
        const { w, log } = await ringing();
        try {
            w.win.playerIsKnockedOut = () => true;
            await w.advance(600);
            assert.equal(playing(log), 0, 'knockout');
        } finally { w.restore(); }
    }
});

test('A2b R2 m1: the ringtone stops on close() and while paused (menu, hidden tab), and restarts after the menu closes', async () => {
    {
        const { w, log } = await ringing();
        try {
            w.win.phoneRinger.close();
            assert.equal(playing(log), 0, 'close()');
            assert.equal(w.banner(), null);
        } finally { w.restore(); }
    }
    {
        const { w, log } = await ringing();
        try {
            const menu = w.win.document.createElement('div'); menu.className = 'game-menu-overlay visible';
            w.win.document.body.appendChild(menu);
            await w.advance(600);
            assert.equal(playing(log), 0, 'pause menu');
            assert.ok(w.banner(), 'the banner is kept');
            menu.remove();
            await w.advance(600);
            assert.equal(playing(log), 1, 'restarts when the menu closes');
        } finally { w.restore(); }
    }
    {
        const { w, log } = await ringing();
        try {
            Object.defineProperty(w.win.document, 'hidden', { value: true, configurable: true });
            await w.advance(600);
            assert.equal(playing(log), 0, 'hidden tab');
        } finally {
            Object.defineProperty(w.win.document, 'hidden', { value: false, configurable: true });
            w.restore();
        }
    }
});
