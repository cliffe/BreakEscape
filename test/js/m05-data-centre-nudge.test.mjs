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
const nudgeIdx = hax ? hax.eventMappings.findIndex(m => m.eventPattern === 'room_entered:data_center' && m.sendTimedMessage) : -1;

test('the nudge is on HaX, is short, and uses no dashes', { skip }, () => {
    assert.ok(nudgeIdx >= 0, 'nudge mapping present on the HaX phone NPC');
    const m = hax.eventMappings[nudgeIdx];
    assert.ok(m.onceOnly);
    assert.ok(m.sendTimedMessage.message.split(/\s+/).length <= 30);
    assert.doesNotMatch(m.sendTimedMessage.message, /[–—]/);
    assert.equal(m.sendTimedMessage.skipIfGlobal, 'torres_identified');
    assert.ok(!m.setVisible, 'does not touch Torres');
});

test('fires once while unidentified, not after naming', { skip }, () => {
    const m = hax.eventMappings[nudgeIdx];
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
