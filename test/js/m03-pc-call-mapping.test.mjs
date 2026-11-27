// m03 R2 m1: HaX's "You're on her machine" call fires once, on whichever of the draft or the roster is
// opened first (draft_seen / roster_seen), not on the optional decode task. The mappings are read from the
// rendered m03 scenario and run through NPCManager's real mapping path.
// Run with: node test/js/m03-pc-call-mapping.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const sys = join(root, 'public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'm03-pc-call-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

const script = `$stdout = File.open(File::NULL, 'w'); $stderr = File.open(File::NULL, 'w')
  require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
  json, = render_erb_to_json(File.join(${JSON.stringify(root)}, 'scenarios/m03_ghost_in_the_machine/scenario.json.erb'))
  STDOUT.puts JSON.generate(json)`;
const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', maxBuffer: 1 << 26 });
assert.equal(r.status, 0, r.stderr);
const scenario = JSON.parse(r.stdout.trim().split('\n').pop());
const owner = Object.values(scenario.rooms).flatMap(rm => rm.npcs || [])
    .find(n => (n.eventMappings || []).some(m => m.setGlobal && m.setGlobal.pc_call_done));
assert.ok(owner, 'an NPC carries the pc_call_done mappings');

function makeDispatcher() {
    const l = new Map();
    return {
        on(n, cb) { l.set(n, [...(l.get(n) || []), cb]); },
        off(n, cb) { l.set(n, (l.get(n) || []).filter(f => f !== cb)); },
        emit(n, d) { (l.get(n) || []).slice().forEach(cb => cb(d)); }
    };
}
function setup() {
    window.gameState.globalVariables = {};
    window.eventDispatcher = null;
    window.npcConversationStateManager = null;
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set(owner.id, { id: owner.id, npcType: 'phone' });
    m._setupEventMappings(owner.id, owner.eventMappings);
    const calls = () => m.timedMessages.filter(t => t.targetKnot === 'on_victoria_computer_accessed');
    const emit = async (ev, data) => { m.eventDispatcher.emit(ev, data); await new Promise(r => setImmediate(r)); };
    return { m, calls, emit, g: () => window.gameState.globalVariables };
}
const quiet = console.log;
test.before(() => { console.log = () => {}; });
test.after(() => { console.log = quiet; });

test('opening only the roster brings the call, once', async () => {
    const t = setup();
    await t.emit('global_variable_changed:roster_seen', { name: 'roster_seen', value: true });
    assert.equal(t.calls().length, 1);
    assert.equal(t.g().pc_call_done, true);
    await t.emit('global_variable_changed:roster_seen', { name: 'roster_seen', value: true });
    await t.emit('global_variable_changed:draft_seen', { name: 'draft_seen', value: true });
    assert.equal(t.calls().length, 1, 'no second call after pc_call_done');
});

test('opening only the draft brings the call, once', async () => {
    const t = setup();
    await t.emit('global_variable_changed:draft_seen', { name: 'draft_seen', value: true });
    await t.emit('global_variable_changed:roster_seen', { name: 'roster_seen', value: true });
    assert.equal(t.calls().length, 1);
});

test('the roster mapping stays quiet when pc_call_done is already set, and on a false value', async () => {
    const t = setup();
    await t.emit('global_variable_changed:roster_seen', { name: 'roster_seen', value: false });
    assert.equal(t.calls().length, 0);
    t.g().pc_call_done = true;
    await t.emit('global_variable_changed:roster_seen', { name: 'roster_seen', value: true });
    assert.equal(t.calls().length, 0);
});

test('completing the optional decode task no longer drives the call', async () => {
    const t = setup();
    await t.emit('objective_task_completed:decode_client_roster', { taskId: 'decode_client_roster' });
    assert.equal(t.calls().length, 0);
});
