// Sweep item 8 follow-up (M5 R2 cross-track): a ring mapping's own `setGlobal` runs at offer time, so
// a term in its `condition` that reads the latch it sets (recruiter_texted, revelation_ring_offered,
// nightshade_rang, torres_rang) would drop the ring on its own latch at the first re-check. The
// re-check must ignore those self-set terms and re-check only the rest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'recruiter', displayName: 'Recruiter', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'first_call', conversationMode: 'phone-chat', ring: { onMissed: 'callback' },
    once: true, cooldown: 0, ...extra,
});

// ---- _ringRecheckCondition: the shapes from m05, m03, m09 -------------------------------------
test('item 8 self-latch: the re-check drops the term the mapping sets and keeps the rest', () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const nm = w.nm;
        // m05 Recruiter
        assert.equal(
            nm._ringRecheckCondition(
                'globalVars.torres_identified === true && globalVars.recruiter_texted !== true',
                { recruiter_texted: true }),
            'globalVars.torres_identified === true');
        // m03 game_loaded revelation twin
        assert.equal(
            nm._ringRecheckCondition(
                'globalVars.flag_distcc_submitted === true && globalVars.revelation_ring_offered !== true && globalVars.revelation_heard !== true',
                { revelation_ring_offered: true }),
            'globalVars.flag_distcc_submitted === true && globalVars.revelation_heard !== true');
        // m09 Nightshade / Torres: a single latch term, nothing else left
        assert.equal(nm._ringRecheckCondition('globalVars.nightshade_rang !== true', { nightshade_rang: true }), null);
        // No setGlobal: the condition passes through untouched
        assert.equal(nm._ringRecheckCondition('globalVars.go === true', null), 'globalVars.go === true');
    } finally { w.restore(); }
});

// ---- integration: the Recruiter rings in a normal run ----------------------------------------
test('item 8 self-latch: a self-latching ring is not dropped by its own setGlobal', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.win.gameState.globalVariables.torres_identified = true;
        w.nm._handleEventMapping('recruiter', 'conversation_closed:agent_0x99', ringConfig({
            condition: 'globalVars.torres_identified === true && globalVars.recruiter_texted !== true',
            setGlobal: { recruiter_texted: true },
        }), {});
        await w.advance(1000);
        assert.equal(w.win.gameState.globalVariables.recruiter_texted, true, 'the latch was set at the offer');
        assert.equal(w.ringer.stateOf('recruiter'), 'ringing', 'she still rings');
        assert.ok(w.banner(), 'the banner shows');
    } finally { w.restore(); }
});

// ---- item 8 is preserved: a non-self term that goes false still drops the ring ---------------
test('item 8 self-latch: a non-self term going false mid-ring still drops the ring quietly', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.win.gameState.globalVariables.go = true;
        w.nm._handleEventMapping('recruiter', 'conversation_closed:agent_0x99', ringConfig({
            condition: 'globalVars.go === true && globalVars.recruiter_texted !== true',
            setGlobal: { recruiter_texted: true },
        }), {});
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('recruiter'), 'ringing', 'rings while the non-self term holds');
        w.win.gameState.globalVariables.go = false;      // the kept term stops holding
        await w.advance(1000);
        assert.equal(w.ringer.stateOf('recruiter'), null, 'the ring is dropped once the kept term fails');
        assert.equal(w.banner(), null, 'no banner');
        assert.equal((w.nm.conversationHistory.get('recruiter') || []).filter((m) => m.type === 'call').length, 0,
            'dropped quietly: no Missed call row');
    } finally { w.restore(); }
});

// ---- M4 R3 m1: negated and mixed conditions are re-checked on their global terms ---------------
test('item 8: `!globalVars.x` terms and the global half of a mixed condition are re-checked', () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const nm = w.nm;
        const g = w.win.gameState.globalVariables;
        g.esd_authorized = true;
        // m04's dial ring: an event term plus a global term. The global term now fails, so it drops.
        assert.equal(nm.ringConditionHolds('value === true && globalVars.esd_authorized !== true'), false);
        g.esd_authorized = false;
        assert.equal(nm.ringConditionHolds('value === true && globalVars.esd_authorized !== true'), true);
        // A negated global term (m03, m07 shape)
        g.revelation_heard = true;
        assert.equal(nm.ringConditionHolds('globalVars.flag_distcc_submitted && !globalVars.revelation_heard'), false);
        g.revelation_heard = false; g.flag_distcc_submitted = true;
        assert.equal(nm.ringConditionHolds('globalVars.flag_distcc_submitted && !globalVars.revelation_heard'), true);
        // Only event terms: nothing to re-check, keeps ringing
        assert.equal(nm.ringConditionHolds('data.npcId === "x" && value === true'), true);
        // An OR is not split: keeps ringing
        assert.equal(nm.ringConditionHolds('globalVars.a === true || globalVars.b === true'), true);
        // A string literal in a global term is not mistaken for event data
        g.team_assignment = 'fracture';
        assert.equal(nm.ringConditionHolds('globalVars.team_assignment === "trojan_horse"'), false);
    } finally { w.restore(); }
});

// ---- M5 R3 n1 / M4 R3 m2: the ring banner falls back to the contact's callLabel ----------------
test('ring banner: no mapping callLabel shows the contact-level callLabel', async () => {
    const hax = { id: 'hax', displayName: 'Agent HaX', avatar: 'assets/x.png', callLabel: 'SAFETYNET secure line' };
    const w = makeWorld({ npcs: [hax] });
    try {
        w.nm._handleEventMapping('hax', 'room_entered:x',
            { handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 }, {});
        await w.advance(1500);
        assert.ok(w.banner(), 'it rings');
        assert.match(w.banner().textContent, /SAFETYNET secure line/);
    } finally { w.restore(); }
});
