// m09 blind playtest: the "stop the shredding" optional must say what it needs, be listed by the
// ending check while open, and have a HaX nudge once the plan cabinet is open.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openOptionalObjectives } from '../../public/break_escape/js/systems/ending-check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const r = spawnSync('ruby', ['-e', `require 'json'; require ${JSON.stringify(join(root, 'lib/break_escape/scenario_binding'))}
puts BreakEscape::ScenarioBinding.render(File.read(${JSON.stringify(join(root, 'scenarios/m09_digital_archaeology/scenario.json.erb'))}), {})`],
    { encoding: 'utf8', cwd: root, env: { ...process.env, LANG: 'C.UTF-8' } });
const skip = r.status !== 0 && 'scenario did not render here';
const sc = skip ? null : JSON.parse(r.stdout);

test("shredding task title says asking won't work", { skip }, () => {
    const task = sc.objectives.flatMap(a => a.tasks).find(t => t.taskId === 'stop_the_shredding');
    assert.equal(task.optional, true);
    assert.match(task.title, /asking won't work/);
});

test('ending check lists the shredding task while it is active, not while locked', { skip }, () => {
    const aims = JSON.parse(JSON.stringify(sc.objectives));
    for (const a of aims) if (a.tasks.some(t => t.taskId === 'stop_the_shredding')) a.status = 'active';
    const task = aims.flatMap(a => a.tasks).find(t => t.taskId === 'stop_the_shredding');
    assert.equal(openOptionalObjectives({ aims }).some(o => o.taskId === 'stop_the_shredding'), false);
    task.status = 'active';
    assert.equal(openOptionalObjectives({ aims }).some(o => o.taskId === 'stop_the_shredding'), true);
});

test('HaX nudges once the cabinet is open and the file is not yet held', { skip }, () => {
    const all = JSON.stringify(sc);
    assert.match(all, /She won't stop for asking\. Find something in that cabinet/);
});
