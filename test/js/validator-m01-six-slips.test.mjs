// Step 4 integration fixture (plan "Tests"): a copy of m01 with six slips, every finding expected.
// This exercises the whole validator across stages at once: the unknown-field stage (a misspelt
// room field and a misspelt requires), the existing error checks (a setVariable typo, a task
// targetRoom to a missing room) and the step-4 reference stage (an eventMapping completeTask to a
// missing task, a triggerOnInteract unlock_door to a missing room). The fixture is built by
// rendering the real m01 scenario and injecting the six slips into the JSON, so it tracks m01.
// Run with: node --test test/js/validator-m01-six-slips.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

// Render the real m01 to JSON through the validator's own ERB path.
function renderM01() {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      d, _ = render_erb_to_json(${JSON.stringify(join(root, 'scenarios/m01_first_contact/scenario.json.erb'))}, {}, include_rendered: true)
      puts JSON.generate(d)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

// Run the full validator over a scenario written to a temp directory, return every reported line.
function validateFull(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'm01-six-slips-'));
    writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario, null, 2));
    copyFileSync(join(root, 'scenarios/m01_first_contact/mission.json'), join(dir, 'mission.json'));
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), join(dir, 'scenario.json.erb'), '--no-graph', '--skip-ink'],
        { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 * 1024 * 1024 });
    return r.stdout || '';
}

test('m01 with six slips reports every expected finding', { skip }, () => {
    const d = renderM01();
    const r0 = Object.keys(d.rooms)[0];
    const room = d.rooms[r0];

    // Slip 1: a misspelt room field.
    room.lockedd = true;
    // Slip 2: a misspelt `requires` on a PIN safe.
    room.objects = room.objects || [];
    room.objects.push({ id: 'slip_pin_safe', type: 'safe', name: 'Slip safe', locked: true, lockType: 'pin', requries: '1234' });
    // Slip 3: onRead.setGlobal where setVariable is meant.
    room.objects[0].onRead = { setGlobal: { slip_read_flag: true } };
    // Slip 4: an eventMapping completeTask naming a missing task.
    // Slip 5: a triggerOnInteract unlock_door to a missing room.
    room.objects[0].triggerOnInteract = (room.objects[0].triggerOnInteract || []).concat([
        { type: 'unlock_door', roomId: 'slip_ghost_room' },
    ]);
    const npc = (room.npcs && room.npcs[0]) || Object.values(d.rooms).flatMap((rm) => rm.npcs || [])[0];
    npc.eventMappings = (npc.eventMappings || []).concat([{ eventPattern: 'slip_event', completeTask: 'slip_ghost_task' }]);
    // Slip 6: a task targetRoom to a missing room.
    d.objectives[0].tasks.push({ taskId: 'slip_task', title: 'Slip', type: 'goto', status: 'active', targetRoom: 'slip_ghost_room' });

    const out = validateFull(d);
    const expect = [
        /lockedd/,                               // 1: unknown room field
        /requries/,                              // 2: unknown field (misspelt requires)
        /setGlobal/,                             // 3: unknown field (setVariable typo)
        /references task 'slip_ghost_task'/,     // 4: step-4 reference
        /references room 'slip_ghost_room'/,     // 5: step-4 reference (unlock_door roomId)
        /targetRoom 'slip_ghost_room'/,          // 6: existing error
    ];
    for (const re of expect) {
        assert.ok(re.test(out), `expected a finding matching ${re}\n--- validator output tail ---\n${out.split('\n').slice(-40).join('\n')}`);
    }
});
