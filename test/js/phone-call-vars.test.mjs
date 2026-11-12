// A2b: the engine-written call VARs (plan 2.11): call_answer_seconds from unpaused ring time,
// the channel rules of the 'phone-call' writer, and the run-scoped names. call_is_callback is
// always false until A5/A6 dial callbacks.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, endCall } from './phone-ring-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const stateSrc = readFileSync(join(here, '../../public/break_escape/js/systems/npc-conversation-state.js'), 'utf8');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
globalThis.window = globalThis.window || {};
const { default: stateManager } = await import(dataUrl(stateSrc));

const npcs = [{ id: 'caller', displayName: 'Caller One' }, { id: 'other', displayName: 'Other' }];
const ring = { handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: false, cooldown: 0 };

// The real manager (npc-conversation-state.js) holds the writer the adapter registers
function writerFor(w) {
    w.win.npcConversationStateManager = stateManager;
    w.dispatcher.emit('game_loaded', {});
    const writer = stateManager.engineVariableWriters.get('phone-call');
    assert.equal(typeof writer, 'function', 'the phone-call writer is registered');
    return (npcId, channel) => writer({ npcId, channel, story: {} });
}

async function answerAfter(w, ringMs) {
    w.nm._handleEventMapping('caller', 'room_entered', ring, {});
    await w.advance(ringMs);
    w.click('.incoming-call-answer');
    await w.advance(700);
}

test('answered at once: call_answer_seconds is 0; after 12 s of ringing it is 12', async () => {
    for (const [ms, want] of [[300, 0], [12100, 12]]) {
        const w = makeWorld({ npcs });
        try {
            const write = writerFor(w);
            await answerAfter(w, ms);
            const vars = write('caller', 'phone-chat');
            assert.equal(vars.call_answer_seconds, want, `after ${ms} ms`);
            assert.equal(vars.call_is_callback, false);
        } finally { w.restore(); }
    }
});

test('time paused and time queued do not count; auto-answer is at most 6', async () => {
    const w = makeWorld({ npcs });
    try {
        const write = writerFor(w);
        w.nm._handleEventMapping('caller', 'room_entered', ring, {});
        await w.advance(3000);
        w.win.breakEscapeSessionOverlayShowing = true;
        await w.advance(8000);
        w.win.breakEscapeSessionOverlayShowing = false;
        await w.advance(2000);
        w.click('.incoming-call-answer');
        await w.advance(700);
        const v = write('caller', 'phone-chat').call_answer_seconds;
        assert.ok(v >= 4 && v <= 6, `about 5 s of unpaused ringing, got ${v}`);
    } finally { w.restore(); }
    const f = makeWorld({ npcs });
    try {
        const write = writerFor(f);
        f.nm._handleEventMapping('caller', 'room_entered', { ...ring, disableClose: true }, {});
        await f.advance(7500);
        const v = write('caller', 'phone-chat').call_answer_seconds;
        assert.ok(v <= 6, `auto-answer counts at most AUTO_ANSWER_MS, got ${v}`);
    } finally { f.restore(); }
});

test('channel: live values only for phone-chat with the call open for that contact; defaults elsewhere', async () => {
    const w = makeWorld({ npcs });
    try {
        const write = writerFor(w);
        await answerAfter(w, 12100);
        assert.equal(write('caller', 'phone-chat').call_answer_seconds, 12);
        for (const channel of ['phone-preload', 'person-chat', 'email']) {
            assert.deepEqual(write('caller', channel), { call_answer_seconds: 0, call_is_callback: false }, channel);
        }
        assert.deepEqual(write('other', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: false }, 'another contact');
        // a contact-list preview while the call is not the open minigame
        const call = w.fw.currentMinigame;
        w.fw.currentMinigame = { _sceneType: 'phone-chat', params: {}, _ending: false };
        assert.deepEqual(write('caller', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: false }, 'a preview');
        w.fw.currentMinigame = call;
    } finally { w.restore(); }
});

test('both are cleared when the call ends, so the next thread open reads 0 and false', async () => {
    const w = makeWorld({ npcs });
    try {
        const write = writerFor(w);
        await answerAfter(w, 12100);
        endCall(w);
        await w.advance(100);
        w.fw.currentMinigame = { _sceneType: 'phone-chat', params: { npcId: 'caller' }, _ending: false };
        assert.deepEqual(write('caller', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: false });
    } finally { w.restore(); }
});

test('isRunScopedVariable: both names, still false for call_started and call_done; email_ unchanged', () => {
    assert.equal(stateManager.isRunScopedVariable('call_answer_seconds'), true);
    assert.equal(stateManager.isRunScopedVariable('call_is_callback'), true);
    assert.equal(stateManager.isRunScopedVariable('call_started'), false);
    assert.equal(stateManager.isRunScopedVariable('call_done'), false);
    assert.equal(stateManager.isRunScopedVariable('email_subject'), true);
});
