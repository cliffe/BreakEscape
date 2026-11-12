// ring.ringWhile (M1 R4): the ringer re-checks only the author's opt-in `ring.ringWhile` while the call
// is queued or ringing, never a mapping's trigger `condition`. A failing `ringWhile` drops the call
// quietly and restores the mapping's own `setGlobal` writes (R1 m2), so a twin can still ring. A call
// the player has answered or put on hold is never dropped. The real npc-manager + phone-ringer-dom
// adapter on the shared harness.
// Copy list (shared with phone-ring-harness.mjs): npc-manager.js (npc-los.js, phone-chat-speaker.js),
// phone-ringer-dom.js (phone-ringer.js, phone-ring-config.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'recruiter', displayName: 'Recruiter', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', targetKnot: 'ring_call', conversationMode: 'phone-chat',
    ring: { onMissed: 'callback' }, once: true, cooldown: 0, ...extra,
});

// ---- ringConditionHolds: the globalVars-only evaluator for ringWhile -------------------------
test('ringConditionHolds re-checks globalVars terms, including negated, and keeps ringing otherwise', () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const nm = w.nm;
        const g = w.win.gameState.globalVariables;
        g.esd_authorized = true;
        assert.equal(nm.ringConditionHolds('globalVars.esd_authorized !== true && globalVars.mission_complete !== true'), false);
        g.esd_authorized = false;
        assert.equal(nm.ringConditionHolds('globalVars.esd_authorized !== true && globalVars.mission_complete !== true'), true);
        // A negated global term
        g.revelation_heard = true;
        assert.equal(nm.ringConditionHolds('globalVars.flag_distcc_submitted && !globalVars.revelation_heard'), false);
        g.revelation_heard = false; g.flag_distcc_submitted = true;
        assert.equal(nm.ringConditionHolds('globalVars.flag_distcc_submitted && !globalVars.revelation_heard'), true);
        // A string literal in a global term is not mistaken for a stray identifier
        g.team_assignment = 'fracture';
        assert.equal(nm.ringConditionHolds('globalVars.team_assignment === "trojan_horse"'), false);
        // An OR is not split: keeps ringing. An empty condition holds.
        assert.equal(nm.ringConditionHolds('globalVars.a === true || globalVars.b === true'), true);
        assert.equal(nm.ringConditionHolds(''), true);
    } finally { w.restore(); }
});

// ---- the trigger condition is NOT re-checked (m09 Torres shape) -------------------------------
test('M1 R4: a ring with no ringWhile is never dropped, even when its trigger guard flips (m09 Torres)', async () => {
    const torres = { id: 'torres', displayName: 'Torres', avatar: 'assets/x.png' };
    const w = makeWorld({ npcs: [torres] });
    try {
        const g = w.win.gameState.globalVariables;
        g.hl_box_opened = false;
        // The lid ring: a trigger-time guard, no ringWhile.
        w.nm._handleEventMapping('torres', 'object_interacted:lid', ringConfig({
            condition: 'globalVars.hl_box_opened !== true', setGlobal: { torres_rang: true },
        }), {});
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('torres'), 'ringing', 'the lid ring rings');
        // The box is opened while it rings: the trigger guard flips, but the ring is not re-checked.
        g.hl_box_opened = true;
        await w.advance(2000);
        assert.equal(w.ringer.stateOf('torres'), 'ringing', 'it keeps ringing (no implicit re-check)');
    } finally { w.restore(); }
});

// ---- a self-latching ring with no ringWhile still rings (m05 Recruiter / m09 Nightshade) ------
test('M1 R4: a self-latching ring with no ringWhile rings normally', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.win.gameState.globalVariables.torres_identified = true;
        w.nm._handleEventMapping('recruiter', 'conversation_closed:agent_0x99', ringConfig({
            condition: 'globalVars.torres_identified === true && globalVars.recruiter_texted !== true',
            setGlobal: { recruiter_texted: true },
        }), {});
        await w.advance(1000);
        assert.equal(w.win.gameState.globalVariables.recruiter_texted, true, 'the latch is set at the offer');
        assert.equal(w.ringer.stateOf('recruiter'), 'ringing', 'she still rings (no ringWhile to drop her)');
        assert.ok(w.banner(), 'the banner shows');
    } finally { w.restore(); }
});

// ---- ringWhile drops the m04 dial ring once the ESD is live ----------------------------------
test('ringWhile: the m04-shape dial ring drops quietly once its condition fails', async () => {
    const hax = { id: 'hax', displayName: 'Agent HaX', avatar: 'assets/x.png', callLabel: 'SAFETYNET secure line' };
    const w = makeWorld({ npcs: [hax] });
    try {
        const g = w.win.gameState.globalVariables;
        g.esd_authorized = false; g.mission_complete = false;
        w.nm._handleEventMapping('hax', 'global_variable_changed:anomaly_detected', ringConfig({
            condition: 'value === true && globalVars.esd_authorized !== true',
            ring: { onMissed: 'callback', ringWhile: 'globalVars.esd_authorized !== true && globalVars.mission_complete !== true' },
        }), { value: true });
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('hax'), 'ringing', 'the dial ring rings');
        g.esd_authorized = true;                      // the ESD goes live while it rings
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('hax'), null, 'dropped quietly once the ESD is authorised');
        assert.equal((w.nm.conversationHistory.get('hax') || []).filter((m) => m.type === 'call').length, 0, 'no Missed call row');
    } finally { w.restore(); }
});

// ---- R1 m2: a ringWhile drop restores the mapping's own latch, so a twin can still ring -------
test('R1 m2: a ringWhile ring dropped quietly restores its own setGlobal latch for the twin', async () => {
    const nightshade = { id: 'nightshade', displayName: 'Nightshade', avatar: 'assets/x.png' };
    const w = makeWorld({ npcs: [nightshade] });
    try {
        const g = w.win.gameState.globalVariables;
        g.flag1_read_heard = false;
        // The cage ring: ringWhile guards on the non-latch state; the mapping's setGlobal is its latch.
        w.nm._handleEventMapping('nightshade', 'cage_opened', ringConfig({
            knot: 'cage_ring', targetKnot: 'cage_ring',
            ring: { onMissed: 'callback', ringWhile: 'globalVars.flag1_read_heard !== true' },
            setGlobal: { nightshade_rang: true },
        }), {});
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('nightshade'), 'ringing', 'the cage ring rings');
        assert.equal(g.nightshade_rang, true, 'its latch is set at the offer');
        g.flag1_read_heard = true;                    // the read-out is heard while it rings
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('nightshade'), null, 'the cage ring is dropped');
        assert.ok(!g.nightshade_rang, 'R1 m2: the latch is restored to its pre-offer value');
        // The twin (room_entered), blocked before the fix, can now ring.
        w.nm._handleEventMapping('nightshade', 'room_entered:archive', ringConfig({
            knot: 'room_ring', targetKnot: 'room_ring', condition: 'globalVars.nightshade_rang !== true',
            setGlobal: { nightshade_rang: true },
        }), {});
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('nightshade'), 'ringing', 'the twin rings after the quiet drop');
    } finally { w.restore(); }
});

// ---- the ring banner falls back to the contact's callLabel (M5 R3 n1 / M4 R3 m2) --------------
test('ring banner: no mapping callLabel shows the contact-level callLabel', async () => {
    const hax = { id: 'hax', displayName: 'Agent HaX', avatar: 'assets/x.png', callLabel: 'SAFETYNET secure line' };
    const w = makeWorld({ npcs: [hax] });
    try {
        w.nm._handleEventMapping('hax', 'room_entered:x',
            { handlerIndex: 0, knot: 'ring_call', targetKnot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 }, {});
        await w.advance(1500);
        assert.ok(w.banner(), 'it rings');
        assert.match(w.banner().textContent, /SAFETYNET secure line/);
    } finally { w.restore(); }
});
