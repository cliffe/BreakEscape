// A6 R1: NPCManager.runVoicemail (m2) and the hold while the contact's own thread is open (M1): a
// voicemail that lands while the thread is open waits for conversation_closed:<npcId>, is checked again
// just before it runs, then runs into the saved story and shows its toast. A held voicemail is saved in
// the contact's slot so a reload still delivers it. Real NPCManager and ringer (harness), real ink and
// real PhoneChatConversation (copies, as phone-voicemail-run.test.mjs), a fake open phone-chat.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'voicemail-hold-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    (s) => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: Conversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const json = JSON.parse(readFileSync(join(here, 'fixtures/phone_voicemail.json'), 'utf8').replace(/^﻿/, ''));

const npc = { id: 'caller', displayName: 'Caller One', storyJSON: json };
const rows = (w) => (w.nm.conversationHistory.get('caller') || []).map((m) => (m.type === 'call' ? `[${m.text}]` : m.text));
const cfg = (extra = {}) => ({ handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra });

/** A world whose NPCManager runs voicemails with the real conversation, recording tags and toasts. */
function world() {
    const w = makeWorld({ npcs: [{ ...npc }] });
    const applied = [];
    const toasts = [];
    w.win.showNotification = (text) => toasts.push(text);
    w.nm._voicemailDeps = async () => ({ Conversation, InkEngine, processGameActionTags: (tags) => applied.push(...tags) });
    return { ...w, applied, toasts };
}
/** The contact's thread is the open phone-chat; `save()` is its own story saving over npc.storyState. */
function openThread(w, id = 'caller') {
    const mg = { _sceneType: 'phone-chat', _ending: false, isConversationActive: true, currentNPCId: id, conversation: {},
        params: { npcId: id }, gameState: { isActive: true }, _refreshCallButton() {} };
    w.fw.currentMinigame = mg;
    return mg;
}
function closeThread(w, mg) {
    mg.currentNPCId = null; mg.isConversationActive = false; mg._ending = true;
    w.fw.currentMinigame = null;
    w.dispatcher.emit('conversation_closed:caller', { npcId: 'caller' });
}
async function openStory(w) {
    const conv = new Conversation('caller', w.nm, new InkEngine('caller'));
    await conv.loadStory(json);
    conv.goToKnot('start');
    conv.continue();
    w.nm.getNPC('caller').storyState = conv.saveState();
    return conv;
}
async function reopened(w) {
    const conv = new Conversation('caller', w.nm, new InkEngine('caller'));
    await conv.loadStory(json);
    assert.equal(conv.restoreState(w.nm.getNPC('caller').storyState), true);
    return conv;
}
const settle = async (w, n = 20) => { for (let i = 0; i < n; i++) await w.advance(50); };

// ---- m2: NPCManager.runVoicemail with nothing open ----------------------------------------------------

test('m2: a voicemail shows "New voicemail from <name>"; withheld shows "New voicemail"; quiet shows nothing', async () => {
    for (const [opts, expected] of [[{}, ['New voicemail from Caller One']], [{ withheld: true }, ['New voicemail']], [{ quiet: true }, []]]) {
        const w = world();
        try {
            const p = w.nm.runVoicemail('caller', 'ring_vm', opts);
            await settle(w);
            assert.equal(await p, true);
            assert.deepEqual(w.toasts, expected, JSON.stringify(opts));
            assert.deepEqual(rows(w), [opts.withheld ? '[Voicemail]' : '[Voicemail]', 'voice: You let it ring.', 'voice: Call me when you can.']);
            assert.deepEqual(w.applied, ['set_global:vm_heard:true']);
        } finally { w.restore(); }
    }
});

test('m2: an unknown contact, a missing knot or a knot that does not exist resolves false with no row and no toast', async () => {
    const w = world();
    try {
        assert.equal(await w.nm.runVoicemail('nobody', 'ring_vm'), false);
        assert.equal(await w.nm.runVoicemail('caller', ''), false);
        const p = w.nm.runVoicemail('caller', 'not_a_knot');
        await settle(w);
        assert.equal(await p, false);
        assert.deepEqual(rows(w), []);
        assert.deepEqual(w.toasts, []);
    } finally { w.restore(); }
});

test('m1: a voicemail with no lines writes only its row and redraws nothing of the thread (the live redraw is gone: nothing runs while the thread is open)', async () => {
    const w = world();
    try {
        w.nm.addMessage('caller', 'npc', 'An older text.');
        assert.equal(typeof w.nm._drawVoicemailLive, 'undefined', 'no slice(-0) path left');
        const mg = openThread(w, 'someone_else');
        mg.ui = { addMessage: () => assert.fail('nothing is drawn into another thread') };
        const p = w.nm.runVoicemail('caller', 'empty_vm', {});
        await settle(w);
        assert.equal(await p, true);
        assert.deepEqual(rows(w), ['An older text.', '[Voicemail]']);
    } finally { w.restore(); }
});

// ---- M1: the hold --------------------------------------------------------------------------------------

test('M1: a voicemail while the contact\'s thread is open waits for conversation_closed, then runs into the saved story and toasts', async () => {
    const w = world();
    try {
        const open = await openStory(w);
        const mg = openThread(w);
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        assert.deepEqual(rows(w), [], 'held: no row, no lines while the thread is open');
        assert.deepEqual(w.toasts, [], 'no toast yet');
        assert.deepEqual(w.applied, [], 'the knot has not run');
        // the open thread saves itself (a choice, a call): it must not be what overwrites the voicemail
        w.nm.getNPC('caller').storyState = open.saveState();
        closeThread(w, mg);
        assert.equal(await p, true);
        assert.deepEqual(rows(w), ['[Voicemail]', 'voice: You let it ring.', 'voice: Call me when you can.']);
        assert.deepEqual(w.toasts, ['New voicemail from Caller One'], 'the toast follows the close');
        assert.deepEqual(w.applied, ['set_global:vm_heard:true']);
        const conv = await reopened(w);
        assert.equal(conv.getVariable('heard_vm'), true, 'the ink VAR is in the saved story');
        assert.equal(conv.continue().text.trim(), 'Home line one.', 'the thread opens on its home knot');
    } finally { w.restore(); }
});

test('M1: a close of another contact\'s thread does not release it; a thread that is not the open phone-chat does not hold it', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        w.dispatcher.emit('conversation_closed:other', { npcId: 'other' });
        await settle(w);
        assert.deepEqual(rows(w), [], 'still held');
        closeThread(w, mg);
        assert.equal(await p, true);

        const w2 = world();
        try {
            // the phone open on a different contact's thread, or ending, is no obstacle
            openThread(w2, 'someone_else');
            assert.equal(await w2.nm.runVoicemail('caller', 'ring_vm', {}).then((r) => r), true);
            assert.equal(rows(w2).length, 3);
        } finally { w2.restore(); }
    } finally { w.restore(); }
});

test('M1: a thread that is ending, or closed, does not hold a voicemail', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        mg._ending = true;
        assert.equal(await w.nm.runVoicemail('caller', 'ring_vm', {}), true, 'ran at once: nothing to wait for');
        assert.equal(rows(w).length, 3);
    } finally { w.restore(); }
});

test('M1: the thread opens while the story loads: the result is dropped, no row twice, and a fresh run follows the close', async () => {
    const w = world();
    try {
        let mg = null;
        const deps = w.nm._voicemailDeps;
        w.nm._voicemailDeps = async (...a) => { const d = await deps(...a); if (!mg) mg = openThread(w); return d; };
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        assert.deepEqual(rows(w), [], 'checked again just before the run: nothing written');
        assert.deepEqual(w.toasts, []);
        closeThread(w, mg);
        assert.equal(await p, true);
        assert.deepEqual(rows(w), ['[Voicemail]', 'voice: You let it ring.', 'voice: Call me when you can.'], 'exactly one run');
        assert.deepEqual(w.toasts, ['New voicemail from Caller One']);
    } finally { w.restore(); }
});

test('M1: two voicemails for one contact held behind its open thread run in order after the close', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        const a = w.nm.runVoicemail('caller', 'ring_vm', {});
        const b = w.nm.runVoicemail('caller', 'other_vm', {});
        await settle(w);
        assert.deepEqual(rows(w), []);
        closeThread(w, mg);
        assert.deepEqual([await a, await b], [true, true]);
        assert.equal(rows(w).filter((r) => r === '[Voicemail]').length, 2);
        assert.equal(rows(w).at(-1), 'voice: I already left one.');
    } finally { w.restore(); }
});

test('M1: a held voicemail is in the contact\'s saved slot (voicemails list) until it runs, then the slot clears', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        const p = w.nm.runVoicemail('caller', 'ring_vm', { withheld: true });
        await settle(w);
        const slot = w.nm.getNPC('caller').pendingCall;
        assert.deepEqual(slot.voicemails, [{ knot: 'ring_vm', withheld: true }]);
        assert.equal(slot.live, undefined, 'a held voicemail is in the list, not in live');
        closeThread(w, mg);
        await p;
        assert.equal(w.nm.getNPC('caller').pendingCall, null, 'delivered: nothing left to resume');
    } finally { w.restore(); }
});

test('M1: a reload while a voicemail is held delivers it after the load, quietly, without a second "Missed call" row', async () => {
    const w = world();
    let w2;
    try {
        openThread(w);
        w.nm.addCallRow('caller', 'missed');
        w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        const saved = JSON.parse(JSON.stringify(w.nm.exportPhoneState()));
        assert.deepEqual(saved.caller.pendingCall.voicemails.map((v) => v.knot), ['ring_vm']);

        w2 = world();
        w2.nm.restorePhoneState(saved);
        w2.dispatcher.emit('game_loaded', {});
        await settle(w2);
        assert.deepEqual(rows(w2), ['[Missed call]', '[Voicemail]', 'voice: You let it ring.', 'voice: Call me when you can.']);
        assert.deepEqual(w2.toasts, [], 'a reload is quiet');
        assert.equal(w2.nm.getNPC('caller').pendingCall, null);
    } finally { w.restore(); w2?.restore(); }
});

test('M1: the ringer path: Decline of a voicemail call while its thread is open shows the missed row at once and the voicemail after the close', async () => {
    const w = world();
    try {
        w.nm._handleEventMapping('caller', 'room_entered', cfg({ ring: { onMissed: 'voicemail', voicemailKnot: 'ring_vm' } }), {});
        await w.advance(300);
        const mg = openThread(w);
        w.click('.incoming-call-decline');
        await settle(w);
        assert.deepEqual(rows(w), ['[Missed call]'], 'the missed row now, the voicemail later');
        closeThread(w, mg);
        await settle(w);
        assert.deepEqual(rows(w), ['[Missed call]', '[Voicemail]', 'voice: You let it ring.', 'voice: Call me when you can.']);
        assert.deepEqual(w.toasts, ['New voicemail from Caller One']);
    } finally { w.restore(); }
});

// ---- A6 R2 M1: the slot keeps every held voicemail and the callback --------------------------------------

const reloadFrom = async (w) => {
    const saved = JSON.parse(JSON.stringify(w.nm.exportPhoneState()));
    const w2 = world();
    w2.nm.restorePhoneState(saved);
    w2.dispatcher.emit('game_loaded', {});
    await settle(w2, 60);
    return { saved, w2 };
};
const vmCfg = (i) => cfg({ handlerIndex: i, ring: { onMissed: 'voicemail', voicemailKnot: i === 0 ? 'ring_vm' : 'other_vm' } });

test('M1 P1: a held voicemail and a newer ring of the same contact both survive a reload', async () => {
    const w = world(); let w2;
    try {
        w.nm._handleEventMapping('caller', 'room_entered', vmCfg(0), {});
        await w.advance(300);
        openThread(w);
        w.click('.incoming-call-decline');
        await settle(w);
        w.nm._handleEventMapping('caller', 'item_picked_up', vmCfg(1), {});
        await w.advance(300);
        const r = await reloadFrom(w);
        w2 = r.w2;
        assert.deepEqual(r.saved.caller.pendingCall.voicemails.map((v) => v.knot), ['ring_vm']);
        assert.ok(r.saved.caller.pendingCall.live, 'the newer offer rides in live');
        assert.ok(rows(w2).includes('voice: You let it ring.'), 'ring_vm ran after the reload');
        assert.ok(rows(w2).includes('voice: I already left one.'), 'the second voicemail saw the first');
    } finally { w.restore(); w2?.restore(); }
});

test('M1 P2: two held voicemails both survive a reload, in order, each delivered once', async () => {
    const w = world(); let w2;
    try {
        openThread(w);
        w.nm.runVoicemail('caller', 'ring_vm', {});
        w.nm.runVoicemail('caller', 'other_vm', {});
        await settle(w);
        const r = await reloadFrom(w);
        w2 = r.w2;
        assert.deepEqual(r.saved.caller.pendingCall.voicemails.map((v) => v.knot), ['ring_vm', 'other_vm']);
        const lines = rows(w2).filter((t) => t.startsWith('voice:'));
        assert.deepEqual(lines, ['voice: You let it ring.', 'voice: Call me when you can.', 'voice: I already left one.']);
        assert.equal(rows(w2).filter((t) => t === '[Voicemail]').length, 2);
        assert.equal(w2.nm.getNPC('caller').pendingCall, null);
        // a second reload from the cleared slot delivers nothing more
        const r2 = await reloadFrom(w2);
        assert.equal(r2.saved.caller?.pendingCall ?? null, null);
        assert.equal(rows(r2.w2).filter((t) => t === '[Voicemail]').length, 2);
        r2.w2.restore();
    } finally { w.restore(); w2?.restore(); }
});

test('M1 P3: a held voicemail and a callback for the same contact both survive a reload', async () => {
    const w = world(); let w2;
    try {
        openThread(w);
        w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        w.ringer.restoreCallback('caller', { knot: 'ring_call', state: 'missed', onMissed: 'callback' });
        await settle(w);
        const r = await reloadFrom(w);
        w2 = r.w2;
        assert.deepEqual(r.saved.caller.pendingCall.voicemails.map((v) => v.knot), ['ring_vm']);
        assert.equal(r.saved.caller.pendingCall.callback.knot, 'ring_call');
        assert.ok(rows(w2).includes('voice: You let it ring.'));
        assert.equal(w2.ringer.callbackFor('caller')?.knot, 'ring_call');
    } finally { w.restore(); w2?.restore(); }
});

test('M1: a slot saved before the list existed (a held voicemail in live) still delivers', async () => {
    let w2;
    try {
        w2 = world();
        w2.nm.restorePhoneState({ caller: { history: [], pendingCall: { forced: [], live: { knot: 'ring_vm', state: 'missed', onMissed: 'voicemail', voicemailKnot: 'ring_vm' } } } });
        w2.dispatcher.emit('game_loaded', {});
        await settle(w2, 60);
        assert.ok(rows(w2).includes('voice: You let it ring.'));
    } finally { w2?.restore(); }
});

// ---- A6 R2 m1: the thread holds the voicemail whatever isConversationActive says -----------------------

test('m1: a thread that is still loading (isConversationActive false) holds the voicemail until it closes', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        mg.isConversationActive = false;
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        assert.deepEqual(rows(w), [], 'nothing runs while the thread is on screen');
        closeThread(w, mg);
        assert.equal(await p, true);
        assert.ok(rows(w).includes('voice: You let it ring.'));
    } finally { w.restore(); }
});

test('m1: an ended thread (isConversationActive false, still the open phone-chat) holds the voicemail', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        mg.isConversationActive = false;
        assert.equal(w.nm._threadOpenOn('caller'), true);
        mg._ending = true;
        assert.equal(w.nm._threadOpenOn('caller'), false, 'the ending clears it');
        mg._ending = false;
        mg.currentNPCId = 'other';
        assert.equal(w.nm._threadOpenOn('caller'), false, 'another contact does not hold it');
        const second = openThread(w);
        second.isConversationActive = false;
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        assert.deepEqual(rows(w), []);
        closeThread(w, second);
        assert.equal(await p, true);
    } finally { w.restore(); }
});

test('m1: two windows on one contact: the second thread opened during the hold keeps holding', async () => {
    const w = world();
    try {
        const first = openThread(w);
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        closeThread(w, first);
        const second = openThread(w);       // reopened in the same tick as the close
        second.isConversationActive = false;
        await settle(w);
        // the run may only complete after the second thread closes, or it re-holds
        if (rows(w).length) assert.fail('the voicemail ran into an open thread');
        closeThread(w, second);
        assert.equal(await p, true);
    } finally { w.restore(); }
});

// ---- A6 R2 nits ------------------------------------------------------------------------------------------

test('n3: a voicemail released when the ending starts (ringer closed) shows no toast', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        w.ringer.close?.();
        closeThread(w, mg);
        assert.equal(await p, true);
        assert.deepEqual(w.toasts, [], 'no toast once the phone is closed for the ending');
    } finally { w.restore(); }
});

test('n4: giving up after 20 blocked tries is logged, and the voicemail is released after the warning', async () => {
    const w = world();
    const warned = [];
    const orig = console.warn; console.warn = (...a) => warned.push(a.join(' '));
    try {
        const real = Conversation.runVoicemail;
        let calls = 0;
        const stub = { ...Conversation };
        w.nm._voicemailDeps = async () => ({ Conversation: { runVoicemail: async () => { calls++; return { blocked: true }; } }, InkEngine,
            processGameActionTags: () => {} });
        const ok = await w.nm.runVoicemail('caller', 'ring_vm', {});
        assert.equal(ok, false);
        assert.equal(calls, 20);
        assert.ok(warned.some((m) => /voicemail/i.test(m) && /ring_vm/.test(m)), 'a warning names it');
        void real; void stub;
        assert.equal(w.nm.getNPC('caller').pendingCall ?? null, null, 'the slot is released, not kept');
    } finally { console.warn = orig; w.restore(); }
});

// ---- A6 R3 nits ------------------------------------------------------------------------------------------

test('n-a: a phone-chat on the contact with no conversation yet (preload, dial) does not hold a voicemail', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        mg.conversation = null;
        assert.equal(w.nm._threadOpenOn('caller'), false);
        assert.equal(await w.nm.runVoicemail('caller', 'ring_vm', {}), true, 'ran at once: its close would emit nothing');
        assert.equal(rows(w).length, 3);
        mg.conversation = {};
        assert.equal(w.nm._threadOpenOn('caller'), true, 'once it has a conversation it holds again');
    } finally { w.restore(); }
});

test('n-b: a callback beside a withheld live offer with no voicemail survives a reload', async () => {
    let w2;
    try {
        w2 = world();
        w2.nm.restorePhoneState({ caller: { history: [], pendingCall: { forced: [],
            live: { knot: 'ring_call', state: 'ringing', onMissed: 'callback', withheld: true },
            callback: { knot: 'ring_call', callLabel: 'Boss' } } } });
        w2.dispatcher.emit('game_loaded', {});
        await settle(w2, 60);
        assert.equal(w2.ringer.callbackFor('caller')?.knot, 'ring_call', 'the saved callback stands');
    } finally { w2?.restore(); }
});

test('n-c: a voicemail released while the phone is suspended shows no toast', async () => {
    const w = world();
    try {
        const mg = openThread(w);
        const p = w.nm.runVoicemail('caller', 'ring_vm', {});
        await settle(w);
        w.ringer.suspend(true);
        closeThread(w, mg);
        assert.equal(await p, true);
        assert.deepEqual(w.toasts, [], 'no toast while suspended');
    } finally { w.restore(); }
});
