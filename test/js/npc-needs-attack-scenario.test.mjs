// SIMS-1 (OFFICE_LIFE_SIMS_BUILD_PLAN 5.1): scenarios/test_needs_attack static checks.
// The validator passes with 0 errors; Ben's cooler and Ava's tray sit outside their post
// rooms (the point of the probe: a need and an errand that leave the home room); Eli's only
// need target is his own post object; and every task and mapping condition in the scenario
// passes through the real safeEvaluateCondition (via NPCManager._mappingWouldFire), with a
// sample payload, without throwing.
// Run with: node test/js/npc-needs-attack-scenario.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const scenarioPath = join(root, 'scenarios/test_needs_attack/scenario.json.erb');
const scenario = JSON.parse(readFileSync(scenarioPath, 'utf8'));

// A need/interest target's room, and an NPC's post (needsHome) room.
function objectRoom(objectId) {
    for (const [roomId, room] of Object.entries(scenario.rooms)) {
        if ((room.objects || []).some(o => o.id === objectId)) return roomId;
    }
    return null;
}
function npc(id) {
    for (const room of Object.values(scenario.rooms)) {
        const n = (room.npcs || []).find(x => x.id === id);
        if (n) return n;
    }
    return null;
}

test('the validator gives 0 errors on test_needs_attack', () => {
    if (spawnSync('ruby', ['--version']).status !== 0) { console.log('skip: ruby not found'); return; }
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), scenarioPath, '--skip-ink', '--no-graph'],
        { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    // The validator exits 1 on any unexpected error (scripts/validator_known_failures.json).
    assert.equal(r.status, 0, `validator reported errors:\n${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /0 errors/, r.stdout);
});

test("Ben's cooler and Ava's tray are outside their post rooms", () => {
    const ben = npc('ben');
    assert.equal(objectRoom(ben.needsHome), 'office', 'ben posts in the office');
    assert.equal(objectRoom('water_cooler'), 'kitchen', 'the only thirst source is in the kitchen');
    assert.notEqual(objectRoom(ben.needsHome), objectRoom('water_cooler'));

    const ava = npc('ava');
    assert.equal(objectRoom(ava.needsHome), 'office', 'ava posts in the office');
    assert.equal(objectRoom('washing_up_tray'), 'kitchen', 'the tray she carries mugs to is in the kitchen');
    assert.ok(ava.interests && ava.interests.dirty_mugs, 'ava has the dirty_mugs interest');
});

test("Eli's only need target is his own post object", () => {
    const eli = npc('eli');
    assert.equal(eli.needsHome, 'eli_mug');
    assert.deepEqual(Object.keys(eli.needs), ['caffeine'], 'eli has one need');
    // eli_mug is the only object that satisfies caffeine inside Eli's leashed room (office).
    const officeCaffeine = scenario.rooms.office.objects.filter(o => {
        const a = o.affordance;
        if (!a || typeof a !== 'object') return false;
        const sat = a.satisfies;
        return sat === 'caffeine' || (Array.isArray(sat) && sat.includes('caffeine'));
    }).map(o => o.id);
    assert.ok(officeCaffeine.includes('eli_mug'), 'eli_mug satisfies caffeine');
    assert.deepEqual(eli.needsRooms, ['office'], 'eli is leashed to the office');
    // eli_mug is private to eli, so no other NPC shares it.
    const mug = scenario.rooms.office.objects.find(o => o.id === 'eli_mug');
    assert.equal(mug.private, true);
    assert.deepEqual(mug.owner, ['eli']);
});

// ── Every task and mapping condition through the real safeEvaluateCondition ──
// safeEvaluateCondition is module-private, so it is exercised through
// NPCManager._mappingWouldFire (as test/js/npc-condition-dotted-paths.test.mjs does).
const sysDir = join(root, 'public/break_escape/js/systems');
const tmp = mkdtempSync(join(tmpdir(), 'needs-attack-cond-'));
writeFileSync(join(tmp, 'npc-los.mjs'), readFileSync(join(sysDir, 'npc-los.js'), 'utf8'));
writeFileSync(join(tmp, 'phone-chat-speaker.mjs'),
    readFileSync(join(sysDir, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(tmp, 'npc-manager.mjs'),
    readFileSync(join(sysDir, 'npc-manager.js'), 'utf8')
        .replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: { ...scenario.globalVariables } } };
const { default: NPCManager } = await import(pathToFileURL(join(tmp, 'npc-manager.mjs')).href);
const mgr = new NPCManager(null, null);
mgr.npcs.set('probe', { id: 'probe', npcType: 'person' });

let idx = 0;
function fires(condition, eventData) {
    const err = console.error; console.error = () => {};
    try {
        return mgr._mappingWouldFire('probe', 'probe_event',
            { handlerIndex: idx++, condition, cooldown: 0 }, eventData).fire;
    } finally { console.error = err; }
}

// Collect every mapping condition declared in the scenario.
const conditions = [];
for (const room of Object.values(scenario.rooms)) {
    for (const n of room.npcs || []) {
        for (const m of n.eventMappings || []) {
            if (m.condition) conditions.push(m.condition);
        }
    }
}

test('every mapping condition evaluates through safeEvaluateCondition without throwing', () => {
    assert.ok(conditions.length >= 7, `expected the probe's conditions, got ${conditions.length}`);
    const sample = {
        objectName: 'Meeting Note',
        objectId: 'eli_page',
        npcId: 'gil',
        lockable: { scenarioData: { id: 'dee_drawer' } }
    };
    for (const c of conditions) {
        assert.equal(typeof fires(c, sample), 'boolean', `condition did not evaluate cleanly: ${c}`);
    }
});

test('the key conditions hold on the payloads the engine sends them', () => {
    // Ben's protection mapping, on the Meeting Note interaction.
    assert.equal(fires("data.objectName === 'Meeting Note'", { objectName: 'Meeting Note' }), true);
    assert.equal(fires("data.objectName === 'Meeting Note'", { objectName: 'Break Time' }), false);
    // Dee's sight catch, on the lockpick-in-view payload.
    assert.equal(fires("data.lockable.scenarioData.id === 'dee_drawer'",
        { lockable: { scenarioData: { id: 'dee_drawer' } } }), true);
    assert.equal(fires("data.lockable.scenarioData.id === 'dee_drawer'",
        { lockable: { scenarioData: { id: 'other' } } }), false);
    // Eli's print, gated on the ask and on him not being knocked out.
    globalThis.window.gameState.globalVariables.eli_asked = true;
    globalThis.window.gameState.globalVariables.eli_ko = false;
    assert.equal(fires('globalVars.eli_asked === true && globalVars.eli_ko !== true', {}), true);
    globalThis.window.gameState.globalVariables.eli_ko = true;
    assert.equal(fires('globalVars.eli_asked === true && globalVars.eli_ko !== true', {}), false);
    // Eli's page reveal task.
    assert.equal(fires("data.objectId === 'eli_page'", { objectId: 'eli_page' }), true);
    assert.equal(fires("data.objectId === 'eli_page'", { objectId: 'other_page' }), false);
    // Gil's solo-break task, gated on Fran being down.
    globalThis.window.gameState.globalVariables.fran_ko = true;
    assert.equal(fires('globalVars.fran_ko === true', {}), true);
    globalThis.window.gameState.globalVariables.fran_ko = false;
    assert.equal(fires('globalVars.fran_ko === true', {}), false);
    // The coupling conditions, on the use-start payload.
    assert.equal(fires("data.npcId === 'gil'", { npcId: 'gil' }), true);
    assert.equal(fires("data.npcId === 'fran'", { npcId: 'gil' }), false);
});
