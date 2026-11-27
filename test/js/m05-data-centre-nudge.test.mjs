// m05 blind finding (part5): entering the data centre before Torres is named leaves the room
// looking empty, so HaX sends one in-character text. Fires once while torres_identified is
// not true, never after, and does not touch the mapping that reveals Torres.
// Run with: node --test test/js/m05-data-centre-nudge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function render() {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      d, _ = render_erb_to_json(${JSON.stringify(join(root, 'scenarios/m05_insider_trading/scenario.json.erb'))}, {}, include_rendered: true)
      puts JSON.generate(d)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const sys = join(root, 'public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'm05-nudge-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'), readFileSync(join(sys, 'npc-manager.js'), 'utf8')
    .replace("'./npc-los.js'", "'./npc-los.mjs'").replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

const scenario = skip ? null : render();
const allNpcs = scenario ? Object.values(scenario.rooms).flatMap(r => r.npcs || []).concat(scenario.startRoom ? [] : []) : [];
const hax = allNpcs.find(n => n.id === 'agent_0x99' || (n.eventMappings || []).some(m => m.eventPattern === 'conversation_closed:opening_briefing'));
const nudges = hax ? hax.eventMappings.map((m, i) => ({ m, i })).filter(x => x.m.eventPattern === 'room_entered:data_center' && x.m.sendTimedMessage) : [];
const std = nudges.find(x => /patricia_ko !== true/.test(x.m.condition || ''));
const ko = nudges.find(x => /patricia_ko === true/.test(x.m.condition || ''));
const nudgeIdx = std ? std.i : -1;

test('the nudges are on HaX, short, dash-free, and split on patricia_ko', { skip }, () => {
    assert.equal(nudges.length, 2, 'exactly two nudge mappings');
    assert.ok(std && ko, 'both variants present');
    for (const { m } of [std, ko]) {
        assert.ok(m.onceOnly);
        assert.match(m.condition, /torres_identified !== true/);
        assert.ok(m.sendTimedMessage.message.split(/\s+/).length <= 30);
        assert.doesNotMatch(m.sendTimedMessage.message, /[–—]/);
        assert.equal(m.sendTimedMessage.skipIfGlobal, 'torres_identified');
        assert.ok(!m.setVisible, 'does not touch Torres');
    }
    assert.match(std.m.sendTimedMessage.message, /Patricia/);
    assert.match(ko.m.sendTimedMessage.message, /Call me/);
    assert.doesNotMatch(ko.m.sendTimedMessage.message, /Patricia/);
});

function fresh() {
    const mgr = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    mgr.npcs.set('hax', { id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub' });
    mgr.gameStartTime = Date.now() - 600000;
    return mgr;
}
const timed = mgr => mgr.getConversationHistory('hax').filter(h => h.timed).map(h => h.text);

test('KO variant: only the matching branch fires', { skip }, () => {
    for (const [pko, want, other] of [[true, ko, std], [false, std, ko]]) {
        const mgr = fresh();
        window.gameState.globalVariables = { torres_identified: false, patricia_ko: pko };
        for (const x of [std, ko]) {
            const cfg = mgr._buildMappingConfig(x.m, x.i);
            mgr._handleEventMapping('hax', 'room_entered:data_center', cfg, {});
        }
        mgr.gameStartTime -= 3000;
        mgr._checkTimedMessages();
        assert.deepEqual(timed(mgr), [want.m.sendTimedMessage.message], `patricia_ko=${pko}`);
        assert.ok(!timed(mgr).includes(other.m.sendTimedMessage.message));
    }
    window.gameState.globalVariables = {};
});

test('reload does not resend a fired nudge or lose a pending one', { skip }, () => {
    const m = std.m;
    window.gameState.globalVariables = { torres_identified: false, patricia_ko: false };
    // Fired and delivered, then reload.
    const a = fresh();
    a._handleEventMapping('hax', 'room_entered:data_center', a._buildMappingConfig(m, std.i), {});
    a.gameStartTime -= 3000; a._checkTimedMessages();
    assert.equal(timed(a).length, 1);
    const trig = JSON.parse(JSON.stringify(a.exportTriggeredEvents()));
    assert.ok(Object.keys(trig).length > 0, 'trigger persisted');
    const b = fresh();
    b.restoreTriggeredEvents(trig);
    b._handleEventMapping('hax', 'room_entered:data_center', b._buildMappingConfig(m, std.i), {});
    b.gameStartTime -= 3000; b._checkTimedMessages();
    assert.deepEqual(timed(b), [], 'no resend after reload');
    // Fired but still counting down at reload: restored once, not duplicated.
    const c = fresh();
    c._handleEventMapping('hax', 'room_entered:data_center', c._buildMappingConfig(m, std.i), {});
    const tm = JSON.parse(JSON.stringify(c.exportTimedMessages()));
    const d = fresh();
    d.restoreTriggeredEvents(JSON.parse(JSON.stringify(c.exportTriggeredEvents())));
    d.restoreTimedMessages(tm);
    d._handleEventMapping('hax', 'room_entered:data_center', d._buildMappingConfig(m, std.i), {});
    d.gameStartTime -= 3000; d._checkTimedMessages();
    assert.deepEqual(timed(d), [m.sendTimedMessage.message], 'exactly one after restore');
    window.gameState.globalVariables = {};
});

test('flip: standard text fires, then patricia_ko turns true, re-entry gives exactly one KO text', { skip }, () => {
    const mgr = fresh();
    const enter = () => {
        for (const x of [std, ko]) {
            mgr._handleEventMapping('hax', 'room_entered:data_center', mgr._buildMappingConfig(x.m, x.i), {});
        }
        mgr.gameStartTime -= 3000;
        mgr._checkTimedMessages();
    };
    window.gameState.globalVariables = { torres_identified: false, patricia_ko: false };
    enter();
    assert.deepEqual(timed(mgr), [std.m.sendTimedMessage.message], 'standard text first');
    window.gameState.globalVariables = { torres_identified: false, patricia_ko: true };
    enter();
    assert.deepEqual(timed(mgr), [std.m.sendTimedMessage.message, ko.m.sendTimedMessage.message], 'one KO text, standard not repeated');
    enter();
    assert.equal(timed(mgr).length, 2, 'no further texts on another entry');
    window.gameState.globalVariables = {};
});

test('fires once while unidentified, not after naming', { skip }, () => {
    const m = std.m;
    const mgr = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    mgr.npcs.set('hax', { id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub' });
    mgr.gameStartTime = Date.now() - 600000;
    const texts = () => mgr.getConversationHistory('hax').filter(h => h.timed).map(h => h.text);
    const cfg = mgr._buildMappingConfig(m, nudgeIdx);

    window.gameState.globalVariables = { torres_identified: false };
    mgr._handleEventMapping('hax', 'room_entered:data_center', cfg, {});
    mgr._handleEventMapping('hax', 'room_entered:data_center', cfg, {});   // re-entry
    mgr.gameStartTime -= 3000;
    mgr._checkTimedMessages();
    assert.deepEqual(texts(), [m.sendTimedMessage.message], 'exactly one text');

    // A fresh manager, already identified: nothing is queued.
    const m2 = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    m2.npcs.set('hax', { id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub' });
    m2.gameStartTime = Date.now() - 600000;
    window.gameState.globalVariables = { torres_identified: true };
    m2._handleEventMapping('hax', 'room_entered:data_center', m2._buildMappingConfig(m, nudgeIdx), {});
    m2.gameStartTime -= 3000;
    m2._checkTimedMessages();
    assert.deepEqual(m2.getConversationHistory('hax').filter(h => h.timed), []);
    window.gameState.globalVariables = {};
});

test('Torres reveal mapping is unchanged and still needs torres_identified', { skip }, () => {
    const torres = Object.values(scenario.rooms).flatMap(r => r.npcs || []).find(n => n.id === 'david_torres');
    const reveal = torres.eventMappings.find(x => x.eventPattern === 'room_entered:data_center' && x.setVisible === true);
    assert.match(reveal.condition, /torres_identified === true/);
});
