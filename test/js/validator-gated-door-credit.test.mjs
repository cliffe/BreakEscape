// scripts/validate_scenario.rb check_gated_door_credit (GATED_DOOR_SERVER_CHECK_PLAN.md §12,
// Chunk E). The server owns the credit for passing a split gated door; these checks keep an author
// from writing a scenario where that ownership is defeated or where a credit can never fire.
// Run with: node --test test/js/validator-gated-door-credit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_gated_door_credit(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

// A worn, server-owned pass: the gate's playerMayPassIf names a wearable's worn global, so the gate
// splits on a global a client sync_state cannot write.
const wearableLanyard = {
    type: 'hook', id: 'lanyard', triggerOnInteract: [
        { type: 'give_item', item: { id: 'lanyard_worn', wearable: { costume: 'visitor', global: 'visitor_pass' } } }
    ]
};
const cloner = { type: 'rfid_cloner', id: 'kit' };

// A well-formed split gated door: worn-pass viaPass, cloner viaCredential, both crediting a declared
// server-credit global; the room's rfid lock is requires-only.
function cleanScenario(overrides = {}) {
    return {
        globalVariables: { visitor_pass: false, staff_entered: false },
        objectives: [{ aimId: 'a', tasks: [{ taskId: 'enter_staff', type: 'enter_room', targetRoom: 'staff' }] }],
        rooms: {
            office: {
                doors: [{ connectedRoom: 'staff', direction: 'north', requires: 'staff_badge',
                    gate: { openFor: ['sam'], playerMayPassIf: 'visitor_pass',
                        creditOnPass: {
                            viaPass: { setGlobal: { staff_entered: true } },
                            viaCredential: { setGlobal: { staff_entered: true } }
                        } } }],
                npcs: [{ id: 'sam', eventMappings: [{ eventPattern: 'sam_never', unlockDoor: 'staff' }] }],
                objects: [wearableLanyard, cloner]
            },
            staff: { locked: true, lockType: 'rfid', requires: 'staff_badge',
                objects: [{ id: 'notice', readable: true, text: 'STAFF ONLY. You made it in.' }] }
        },
        ...overrides
    };
}

test('a well-formed split gated door raises nothing', { skip }, () => {
    assert.deepEqual(issues(cleanScenario()), []);
});

test('a split gate with a client-writable playerMayPassIf is an error', { skip }, () => {
    const s = cleanScenario();
    s.rooms.office.doors[0].gate.playerMayPassIf = 'free_pass';   // declared but client-writable
    s.globalVariables.free_pass = false;
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*client-writable global/.test(m)), out.join('\n'));
});

test('a non-splitting gate that names creditOnPass warns (credit can never fire)', { skip }, () => {
    // No worn/server-owned pass and no cloner => does not split.
    const s = cleanScenario();
    s.rooms.office.doors[0].gate.playerMayPassIf = undefined;
    delete s.rooms.office.doors[0].gate.playerMayPassIf;
    s.rooms.office.objects = [wearableLanyard];  // drop the cloner
    // remove the worn pass so it cannot split via pass either
    s.rooms.office.doors[0].gate = { openFor: ['sam'],
        creditOnPass: { viaPass: { setGlobal: { staff_entered: true } } } };
    const out = issues(s);
    assert.ok(out.some(m => /WARNING.*does not split/.test(m)), out.join('\n'));
});

test('a creditOnPass completeTask that no objective defines is an error', { skip }, () => {
    const s = cleanScenario();
    s.rooms.office.doors[0].gate.creditOnPass.viaPass.completeTask = 'no_such_task';
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*names task 'no_such_task'/.test(m)), out.join('\n'));
});

test('a creditOnPass completeTask naming a submit_flags task is an error', { skip }, () => {
    const s = cleanScenario();
    s.objectives[0].tasks.push({ taskId: 'flag_it', type: 'submit_flags' });
    s.rooms.office.doors[0].gate.creditOnPass.viaCredential.completeTask = 'flag_it';
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*submit_flags task 'flag_it'/.test(m)), out.join('\n'));
});

test('a creditOnPass setGlobal of an undeclared global is an error', { skip }, () => {
    const s = cleanScenario();
    s.rooms.office.doors[0].gate.creditOnPass.viaPass.setGlobal = { undeclared_flag: true };
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*'undeclared_flag'.*not declared/.test(m)), out.join('\n'));
});

test('a credit global still written by a client set_global mapping warns (half-done migration)', { skip }, () => {
    const s = cleanScenario();
    s.rooms.office.npcs[0].eventMappings.push({ eventPattern: 'x', setGlobal: { staff_entered: true } });
    const out = issues(s);
    assert.ok(out.some(m => /WARNING.*credit global 'staff_entered' is still written by a client setter/.test(m)), out.join('\n'));
});

test('an unlock_door reward targeting a split gated room is an error (second unlock route)', { skip }, () => {
    const s = cleanScenario();
    s.rooms.office.objects.push({ id: 'flag', flagRewards: [{ type: 'unlock_door', target_room: 'staff' }] });
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*unlock_door reward\/action targets split gated room 'staff'/.test(m)), out.join('\n'));
});

test('a non-openFor NPC unlockDoor mapping for a split room is an error; the openFor NPC is fine', { skip }, () => {
    const s = cleanScenario();
    // Sam (openFor) keeps his unlockDoor mapping: no error from him.
    assert.ok(!issues(s).some(m => /unlockDoor mapping/.test(m)));
    s.rooms.staff.npcs = [{ id: 'intruder', eventMappings: [{ eventPattern: 'y', unlockDoor: 'staff' }] }];
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*NPC 'intruder'.*unlockDoor mapping for split gated room 'staff'/.test(m)), out.join('\n'));
});

test('a split gate whose rfid room lock has an access ACL is an error (must be requires-only)', { skip }, () => {
    const s = cleanScenario();
    s.rooms.staff.access = { roles: ['staff'] };
    const out = issues(s);
    assert.ok(out.some(m => /ERROR.*rfid lock with an 'access' ACL list/.test(m)), out.join('\n'));
});

test('Q5: a server-enforced lock code in a split room readable warns', { skip }, () => {
    const s = cleanScenario();
    // A pin lock code 7041 placed in the split room's readable text.
    s.rooms.vault = { locked: true, lockType: 'pin', requires: '7041' };
    s.rooms.staff.objects[0].text = 'Archive safe: combination 7041. Do not forget it.';
    const out = issues(s);
    assert.ok(out.some(m => /WARNING.*readable 'notice' in split gated room 'staff' contains a server-enforced lock code/.test(m)), out.join('\n'));
});
