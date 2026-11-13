// A5: the real adapter and NPCManager for outgoing calls: which contacts show the call button,
// what the button and #place_call dial, the params the call opens with, the rows its end leaves
// and the phone coming back (plan 2.5). The harness is the A2b one (jsdom, fake clock, fake framework).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const desk = { id: 'desk', displayName: 'Desk Sergeant', call: { knot: 'desk_call' } };

function openPhone(w, { thread = 'desk', params = {} } = {}) {
    const mg = {
        _sceneType: 'phone-chat', _ending: false, phoneId: 'player_phone', gameState: { isActive: true },
        params: { phoneId: 'player_phone', title: 'Phone', npcId: thread, ...params },
        currentNPCId: thread,
        showIncomingCall() {}, hideIncomingCall() {},
        callReopenState() { const p = { ...this.params }; delete p._closingForCall; return { params: p, thread: this.currentNPCId || null }; },
    };
    w.fw.currentMinigame = mg;
    w.win.phoneRinger.registerPhone(mg);
    return mg;
}
const rows = (w, id = 'desk') => (w.nm.conversationHistory.get(id) || []).filter((m) => m.type === 'call').map((m) => m.text);

test('the button shows for a contact with a call entry in the caller\'s own phone, "Call" with its aria label', () => {
    const w = makeWorld({ npcs: [desk] });
    try {
        const phone = openPhone(w);
        assert.deepEqual(w.ringer.callButtonFor('desk', phone), { label: 'Call', ariaLabel: 'Call Desk Sergeant', kind: 'connect' });
    } finally { w.restore(); }
});

test('no button: no call entry, a callId contact, a locked phone, a call screen, another phone, a closed ringer', () => {
    const w = makeWorld({ npcs: [desk, { id: 'plain', displayName: 'Plain' }, { ...desk, id: 'judged', callId: 'x' }] });
    try {
        const phone = openPhone(w, { thread: 'plain' });
        assert.equal(w.ringer.callButtonFor('plain', phone), null, 'no call entry');
        assert.equal(w.ringer.callButtonFor('judged', openPhone(w, { thread: 'judged' })), null, 'callId contact');
        const locked = openPhone(w, { params: { disableClose: true } });
        assert.equal(w.ringer.callButtonFor('desk', locked), null, 'disableClose');
        const callScreen = openPhone(w, { params: { ringerCall: { id: 'c1' } } });
        assert.equal(w.ringer.callButtonFor('desk', callScreen), null, 'a call cannot place a call');
        const stranger = openPhone(w);
        stranger.phoneId = 'desk_phone';
        assert.equal(w.ringer.callButtonFor('desk', stranger), null, 'a desk phone is not the caller\'s phone');
        const mine = openPhone(w);
        w.ringer.close();
        assert.equal(w.ringer.callButtonFor('desk', mine), null, 'closed ringer (the ending)');
    } finally { w.restore(); }
});

test('when and unavailable: no_answer keeps the button, hidden removes it, the global turns it on', () => {
    const w = makeWorld({ npcs: [
        { id: 'away', displayName: 'Away', call: { knot: 'k', when: 'globalVars.back', unavailable: 'no_answer' } },
        { id: 'gone', displayName: 'Gone', call: { knot: 'k', when: 'globalVars.back', unavailable: 'hidden' } },
    ] });
    try {
        const away = openPhone(w, { thread: 'away' });
        assert.equal(w.ringer.callButtonFor('away', away).kind, 'no_answer');
        const gone = openPhone(w, { thread: 'gone' });
        assert.equal(w.ringer.callButtonFor('gone', gone), null);
        w.win.gameState.globalVariables.back = true;
        assert.equal(w.ringer.callButtonFor('away', openPhone(w, { thread: 'away' })).kind, 'connect');
        assert.equal(w.ringer.callButtonFor('gone', openPhone(w, { thread: 'gone' })).kind, 'connect');
    } finally { w.restore(); }
});

test('placeCall from the button: the phone closes for the call and the call opens outgoing on the entry knot with the dial data', () => {
    const w = makeWorld({ npcs: [{ ...desk, callLabel: 'Front desk', call: [{ knot: 'desk_call', when: 'globalVars.open' }] }] });
    try {
        const phone = openPhone(w);
        w.win.gameState.globalVariables.open = true;
        assert.equal(w.ringer.placeCall('desk', {}), true);
        assert.equal(phone.params._closingForCall, true);
        const started = w.calls.started.at(-1);
        assert.equal(started.type, 'phone-chat');
        const p = started.params;
        assert.deepEqual([p.npcId, p.startKnot, p.voiced, p.callLabel, p.showCancel], ['desk', 'desk_call', true, 'Front desk', false]);
        assert.equal(p.ringerCall.direction, 'outgoing');
        assert.equal(p.ringerCall.callback, false);
        assert.deepEqual(p.dial, { when: 'globalVars.open', callback: false });
        assert.equal(w.nm.getNPC('desk').currentKnot, 'start', 'the contact\'s knot moves at the connect, not at the dial');
        assert.equal(w.ringer.callActive(), true);
    } finally { w.restore(); }
});

test('placeCall with a knot dials that entry, a button false one included; a knot that is not an entry dials nothing', () => {
    const w = makeWorld({ npcs: [{ ...desk, call: [{ knot: 'desk_call' }, { knot: 'extract_call', button: false }] }] });
    try {
        openPhone(w);
        assert.equal(w.ringer.placeCall('desk', { knot: 'nonsense' }), false);
        assert.equal(w.calls.started.length, 0);
        assert.equal(w.ringer.placeCall('desk', { knot: 'extract_call' }), true);
        assert.equal(w.calls.started.at(-1).params.startKnot, 'extract_call');
    } finally { w.restore(); }
});

test('the button never dials a button false entry, and a contact with only those has no button', () => {
    const w = makeWorld({ npcs: [{ ...desk, call: [{ knot: 'extract_call', button: false }] }] });
    try {
        const phone = openPhone(w);
        assert.equal(w.ringer.callButtonFor('desk', phone), null);
        assert.equal(w.ringer.placeCall('desk', {}), false);
    } finally { w.restore(); }
});

test('placeCall is refused for a callId contact, a locked phone, and outside a phone', () => {
    const w = makeWorld({ npcs: [{ ...desk, callId: 'x' }, { ...desk, id: 'free' }] });
    try {
        openPhone(w);
        assert.equal(w.ringer.placeCall('desk', {}), false, 'callId');
        w.fw.currentMinigame = null;
        assert.equal(w.ringer.placeCall('free', {}), false, 'no open minigame');
        openPhone(w, { thread: 'free', params: { disableClose: true } });
        assert.equal(w.ringer.placeCall('free', {}), false, 'locked');
    } finally { w.restore(); }
});

test('the end of a connected call adds "Outgoing call, m:ss", fires no event, and the phone reopens on the thread', async () => {
    const w = makeWorld({ npcs: [desk] });
    try {
        openPhone(w);
        w.ringer.placeCall('desk', {});
        const call = w.fw.currentMinigame;
        w.ringer.outgoingConnected('desk', call.params.ringerCall.id);
        await w.advance(65000);
        Object.assign(call, { _endedByCall: true });
        w.fw.endMinigame(true);
        await w.advance(100);
        assert.deepEqual(rows(w), ['Outgoing call, 1:05']);
        assert.equal(w.dispatcher.emitted.filter(([n]) => /phone_call_/.test(n)).length, 0, 'no phone_call event for an outgoing call');
        const reopened = w.calls.started.at(-1);
        assert.equal(reopened.type, 'phone-chat');
        assert.equal(reopened.params.npcId, 'desk', 'back on the thread');
        assert.equal(reopened.params.ringerCall, undefined);
        assert.equal(reopened.params._closingForCall, undefined);
    } finally { w.restore(); }
});

test('no answer adds a "No answer" row and the phone reopens; End while dialling adds no row', async () => {
    const w = makeWorld({ npcs: [desk] });
    try {
        openPhone(w);
        w.ringer.placeCall('desk', {});
        const call = w.fw.currentMinigame;
        Object.assign(call, { _endedByCall: true, _noAnswer: true });
        w.fw.endMinigame(true);
        await w.advance(100);
        assert.deepEqual(rows(w), ['No answer']);
        assert.equal(w.calls.started.at(-1).params.npcId, 'desk');
        // End while dialling
        w.fw.currentMinigame = null;
        openPhone(w);
        w.ringer.placeCall('desk', {});
        Object.assign(w.fw.currentMinigame, { _endedByCall: true });
        w.fw.endMinigame(true);
        await w.advance(100);
        assert.deepEqual(rows(w), ['No answer'], 'still one row');
    } finally { w.restore(); }
});

test('a reload mid-call saves no pending call (an outgoing call is never a missed call)', () => {
    const w = makeWorld({ npcs: [desk] });
    try {
        openPhone(w);
        w.ringer.placeCall('desk', {});
        w.ringer.outgoingConnected('desk', w.fw.currentMinigame.params.ringerCall.id);
        assert.equal(w.nm.getNPC('desk').pendingCall || null, null);
    } finally { w.restore(); }
});

test('NPCManager.callConditionHolds: the mapping grammar over globalVars; unsupported text does not hold', () => {
    const w = makeWorld({ npcs: [] });
    try {
        const g = w.win.gameState.globalVariables;
        assert.equal(w.nm.callConditionHolds(null), true);
        assert.equal(w.nm.callConditionHolds('globalVars.a'), false);
        g.a = true; g.b = false;
        assert.equal(w.nm.callConditionHolds('globalVars.a && !globalVars.b'), true);
        assert.equal(w.nm.callConditionHolds('globalVars.a && globalVars.b'), false);
        assert.equal(w.nm.callConditionHolds('globalVars.n >= 2'), false);
        g.n = 3;
        assert.equal(w.nm.callConditionHolds('globalVars.n >= 2'), true);
        assert.equal(w.nm.callConditionHolds('this is not a condition'), false);
    } finally { w.restore(); }
});
