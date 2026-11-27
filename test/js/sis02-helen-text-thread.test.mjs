// sis02: Helen Marsh is met in person (npcType "person"), which gives her no phone thread, so her
// guidance texts were toasts the player could not reread. Her texts now belong to a phone twin,
// helen_marsh_phone, on the site phone (the m04 robert_vance_phone pattern). This checks the
// scenario wiring, and that the NPC manager lists the twin on the phone and delivers a timed text
// into its thread (the conversation history the phone's Messages list reads).
// Run with: bin/test-js test/js/sis02-helen-text-thread.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const src = readFileSync(join(root, 'scenarios/sis02_energy/scenario.json.erb'), 'utf8')
    .replace(/<%[#=]?[\s\S]*?%>/g, '')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
const scenario = JSON.parse(src);

const allNpcs = [];
const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') {
        if (typeof o.id === 'string' && typeof o.npcType === 'string') allNpcs.push(o);
        Object.values(o).forEach(walk);
    }
};
walk(scenario);
const byId = (id) => allNpcs.find(n => n.id === id);

test('Helen has a phone twin on the site phone, listed in its npcIds', () => {
    const twin = byId('helen_marsh_phone');
    assert.ok(twin, 'helen_marsh_phone exists');
    assert.equal(twin.npcType, 'phone');
    assert.equal(twin.phoneId, 'site_phone');
    assert.notEqual(twin.displayName, byId('helen_marsh').displayName, 'distinct name keeps ink prefixes on the person');
    const phone = scenario.startItemsInInventory.find(i => i.phoneId === 'site_phone');
    assert.ok(phone.npcIds.includes('helen_marsh_phone'));
    assert.ok(existsSync(join(root, twin.storyPath)), 'twin ink compiled');
});

test('every Helen text sits on the twin, none on the person NPC', () => {
    const person = byId('helen_marsh');
    assert.equal(person.phoneId, undefined);
    assert.ok(!(person.eventMappings || []).some(m => m.sendTimedMessage), 'person has no sendTimedMessage left');
    // Handler indices are saved state keys: the 17 mappings stay in place, the pure-text ones as stubs
    assert.equal(person.eventMappings.length, 41, 'Helen eventMappings keep their count and order');
    assert.ok(!(person.timedMessages || []).length);
    const texts = byId('helen_marsh_phone').eventMappings.filter(m => m.sendTimedMessage);
    assert.equal(texts.length, 17);
    for (const m of texts) {
        assert.ok(m.sendTimedMessage.message && m.sendTimedMessage.delay > 0);
        assert.equal(m.onceOnly, true);
    }
    const events = new Set(texts.map(m => m.eventPattern));
    for (const e of ['global_variable_changed:anomaly_detected', 'global_variable_changed:historian_flatline_found',
        'global_variable_changed:jump_server_confirmed', 'global_variable_changed:esd_activated',
        'global_variable_changed:hydrogen_alarm', 'global_variable_changed:facility_safe_state']) {
        assert.ok(events.has(e), `text on ${e}`);
    }
});

test('Trent Water aim opens only through Tom on jump_server_confirmed; alarm lamp label is plain ASCII', () => {
    const aim = scenario.objectives.find(o => o.aimId === 'trent_water_notification');
    assert.equal(aim.unlockCondition, undefined);
    const tom = byId('tom_hadley');
    assert.ok(tom.eventMappings.some(m => m.eventPattern === 'global_variable_changed:jump_server_confirmed' && m.unlockAim === 'trent_water_notification'));
    assert.ok(src.includes('"label": "H2 GAS"'));
    assert.ok(!src.includes('"label": "H₂ GAS"'), 'Press Start 2P has no subscript two');
});

test('a Helen text lands in the twin thread and the twin is a phone contact', async () => {
    for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
    globalThis.window = dom.window; globalThis.document = dom.window.document;
    const { default: NPCManager } = await import(join(root, 'public/break_escape/js/systems/npc-manager.js')).catch(() => ({}));
    assert.ok(NPCManager, 'NPCManager imports');
    const mgr = new NPCManager({ emit() {}, on() {} }, {});
    const twin = byId('helen_marsh_phone');
    mgr.registerNPC(twin.id, { ...twin });
    assert.deepEqual(mgr.getNPCsByPhone('site_phone').map(n => n.id), ['helen_marsh_phone']);
    mgr.addMessage('helen_marsh_phone', 'npc', 'Fifty-one on that dial?');
    assert.ok((mgr.getConversationHistory('helen_marsh_phone') || []).length >= 1);
});
