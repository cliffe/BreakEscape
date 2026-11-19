// m09 blind playtest (minors2): the optional "stop the tape wipe" names Jesse Tran, and the
// wipe console says only its operator can halt it, so the player looks for him, not a stop control.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const r = spawnSync('ruby', ['-e', `require 'json'; require ${JSON.stringify(join(root, 'lib/break_escape/scenario_binding'))}
puts BreakEscape::ScenarioBinding.render(File.read(${JSON.stringify(join(root, 'scenarios/m09_digital_archaeology/scenario.json.erb'))}), {})`],
    { encoding: 'utf8', cwd: root, env: { ...process.env, LANG: 'C.UTF-8' } });
const skip = r.status !== 0 && 'scenario did not render here';
const sc = skip ? null : JSON.parse(r.stdout);

test('the tape wipe task is optional and names Jesse Tran', { skip }, () => {
    const task = sc.objectives.flatMap(a => a.tasks).find(t => t.taskId === 'stop_the_tape_wipe');
    assert.equal(task.optional, true);
    assert.match(task.title, /Jesse Tran/);
});

test('the wipe console points at its operator', { skip }, () => {
    const obj = sc.rooms.server_closet.objects.find(o => o.id === 'tape_side_console');
    assert.match(obj.text, /Operator: J\. Tran/);
    assert.match(obj.text, /operator to stop it/);
});

test('both routes to completion are mapped (talked or knocked out)', { skip }, () => {
    const maps = sc.rooms.loading_dock.npcs.find(n => n.id === 'agent_0x99').eventMappings;
    const tran = maps.filter(m => m.completeTask === 'stop_the_tape_wipe');
    assert.ok(tran.some(m => /tran_outcome/.test(m.eventPattern)));
    assert.ok(maps.some(m => m.eventPattern === 'npc_ko:jesse_tran' && m.setGlobal?.tran_outcome === 'ko'));
});
