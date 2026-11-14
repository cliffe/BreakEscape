// SIMS-3 (OFFICE_LIFE_SIMS_BUILD_PLAN 5.3): scenarios/test_needs_sims static checks for the IT
// room and Neil. The validator passes with 0 errors; Neil's only need target is his own post
// object (neil_mug), leashed to it_room, private to him; it_copier is the only new preset object;
// and every new task and mapping condition passes through the real safeEvaluateCondition with a
// sample payload without throwing.
// Run with: node test/js/npc-needs-sims-validator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const scenarioPath = join(root, 'scenarios/test_needs_sims/scenario.json.erb');
const scenario = JSON.parse(readFileSync(scenarioPath, 'utf8'));

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

test('the validator gives 0 errors on test_needs_sims', () => {
    if (spawnSync('ruby', ['--version']).status !== 0) { console.log('skip: ruby not found'); return; }
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), scenarioPath, '--skip-ink', '--no-graph'],
        { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, `validator reported errors:\n${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /0 errors/, r.stdout);
});

test('the IT room and manager office are wired as SIMS-3 declares', () => {
    assert.ok(scenario.rooms.it_room, 'it_room exists');
    assert.equal(scenario.rooms.it_room.type, 'room_it');
    assert.deepEqual(scenario.rooms.it_room.needsPrivateTo, ['neil']);
    assert.equal(scenario.rooms.office.connections.north, 'it_room');
    assert.equal(scenario.rooms.it_room.connections.south, 'office');
    assert.equal(scenario.rooms.it_room.connections.west, 'manager_office');
    assert.ok(scenario.rooms.manager_office, 'manager_office exists');
    assert.equal(scenario.rooms.manager_office.type, 'room_ceo');
    assert.deepEqual(scenario.rooms.manager_office.objects, [], 'manager office is empty in SIMS-3');
});

test("Neil's only need target is his own post object, standing and leashed", () => {
    const neil = npc('neil');
    assert.equal(neil.needsHome, 'neil_mug');
    assert.deepEqual(Object.keys(neil.needs), ['caffeine'], 'neil has one need');
    assert.deepEqual(neil.needsRooms, ['it_room'], 'neil is leashed to the IT room');
    assert.equal(neil.swivel, false, 'neil does not swivel');
    assert.equal(neil.globalVarOnKO, 'neil_ko');
    // neil_mug is the only object that satisfies caffeine inside the IT room.
    const itCaffeine = scenario.rooms.it_room.objects.filter(o => {
        const a = o.affordance;
        if (!a || typeof a !== 'object') return false;
        const sat = a.satisfies;
        return sat === 'caffeine' || (Array.isArray(sat) && sat.includes('caffeine'));
    }).map(o => o.id);
    assert.deepEqual(itCaffeine, ['neil_mug'], 'neil_mug is the only caffeine source in IT');
    const mug = scenario.rooms.it_room.objects.find(o => o.id === 'neil_mug');
    assert.equal(mug.private, true);
    assert.deepEqual(mug.owner, ['neil']);
    assert.equal(mug.affordance.seat, 'stand', 'neil sips standing');
    assert.equal(mug.takeable, false, 'the mug is not takeable');
});

test('it_copier is the only preset-bearing new object, with six tray slots', () => {
    const cop = scenario.rooms.it_room.objects.find(o => o.id === 'it_copier');
    assert.equal(cop.type, 'photocopier1', 'it_copier gets the copier preset by type');
    assert.equal(cop.affordance.uncollectedAfterSeconds, 180);
    const slots = scenario.rooms.it_room.objects.filter(o => o.outputOf === 'it_copier');
    assert.equal(slots.length, 6, 'six reveal slots feed it_copier');
    assert.ok(slots.every(o => o.takeable === true), 'every IT slot is takeable');
    assert.ok(slots.every(o => o.needsTag === 'printout'));
    // No printout carries an actual account, address, password value or code (6.2).
    const banned = /\bpassword\s*[:=]|passwd|account (?:no|number)|sort code|\b\d{4,}\b|@[a-z0-9.]+\.[a-z]/i;
    for (const o of slots) assert.ok(!banned.test(o.text || ''), `slot ${o.id} text must stay neutral: ${o.text}`);
});

test("Neil's print mapping targets it_copier and forgets the page", () => {
    const neil = npc('neil');
    const m = (neil.eventMappings || []).find(x => x.eventPattern === 'conversation_closed:neil');
    assert.ok(m, 'neil has a conversation_closed:neil mapping');
    assert.equal(m.onceOnly, true);
    assert.equal(m.delayMs, 6000);
    assert.equal(m.needs.print.producer, 'it_copier');
    assert.equal(m.needs.print.forget, true);
    assert.ok(!('fetchAfterSeconds' in m.needs.print), 'a forgotten print schedules no fetch');
});

// ── Every new task and mapping condition through the real safeEvaluateCondition ──
const sysDir = join(root, 'public/break_escape/js/systems');
const tmp = mkdtempSync(join(tmpdir(), 'needs-sims-cond-'));
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

// Every mapping condition declared anywhere in test_needs_sims evaluates cleanly.
const conditions = [];
for (const room of Object.values(scenario.rooms)) {
    for (const n of room.npcs || []) {
        for (const m of n.eventMappings || []) {
            if (m.condition) conditions.push(m.condition);
        }
    }
}

test('every mapping condition evaluates through safeEvaluateCondition without throwing', () => {
    assert.ok(conditions.length >= 10, `expected the showcase's conditions, got ${conditions.length}`);
    const sample = {
        objectName: 'Activity Board', objectId: 'it_out_a', npcId: 'neil',
        producerId: 'it_copier', tag: 'printout', need: 'work', avoidedId: 'marek',
        reason: 'off', key: 'drink_gulp', how: 'leave', answeredBy: 'amara', targetId: 'office_coffee'
    };
    for (const c of conditions) {
        assert.equal(typeof fires(c, sample), 'boolean', `condition did not evaluate cleanly: ${c}`);
    }
});

test("the new SIMS-3 conditions hold on the payloads the engine sends them", () => {
    // Neil's print, gated on the ask and on him not being knocked out.
    globalThis.window.gameState.globalVariables.neil_print_asked = true;
    globalThis.window.gameState.globalVariables.neil_ko = false;
    assert.equal(fires('globalVars.neil_print_asked === true && globalVars.neil_ko !== true', {}), true);
    globalThis.window.gameState.globalVariables.neil_ko = true;
    assert.equal(fires('globalVars.neil_print_asked === true && globalVars.neil_ko !== true', {}), false);
    globalThis.window.gameState.globalVariables.neil_ko = false;
    globalThis.window.gameState.globalVariables.neil_print_asked = false;
    assert.equal(fires('globalVars.neil_print_asked === true && globalVars.neil_ko !== true', {}), false);
    // see_neils_page: the reveal must come from the IT copier and be produced by Neil.
    assert.equal(fires("data.producerId === 'it_copier' && data.npcId === 'neil'",
        { producerId: 'it_copier', npcId: 'neil' }), true);
    assert.equal(fires("data.producerId === 'it_copier' && data.npcId === 'neil'",
        { producerId: 'office_copier', npcId: 'neil' }), false);
    assert.equal(fires("data.producerId === 'it_copier' && data.npcId === 'neil'",
        { producerId: 'it_copier', npcId: 'sanjay' }), false);
});
