// scripts/validate_mfa.rb check_mfa (MFA plan S8a, unit 10): errors, warnings, "not built yet"
// lines and information lines, the schema entries, and the habit keys in validate_npc_habits.rb.
// Run with: node test/js/validator-mfa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function rubyRun(scenario, call) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(${call})`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = sc => rubyRun(sc, 'check_mfa(data)');
const habitIssues = sc => rubyRun(sc, `begin
  copy, report = BreakEscape::NpcHabits.expanded_copy(data)
  ValidateNpcHabits.check(data, expanded: copy, report: report)
end`);
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const infos = list => list.filter(s => s.startsWith('ℹ️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

// Omar signs in at desk_pc under a code policy and carries his own code device on the desk.
function base(kind = 'code') {
    return {
        startRoom: 'office',
        defaultPolicy: 'strict',
        policies: { strict: { mfa: kind } },
        rooms: {
            office: {
                type: 'room_office', connections: {},
                objects: [
                    { id: 'desk_pc', type: 'pc', name: 'Desk PC', lockType: 'login', locked: true, owner: 'omar' },
                    { id: 'omar_fob', type: 'code_device', name: 'Fob', owner: 'omar', takeable: true }
                ],
                npcs: [
                    { id: 'omar', npcType: 'person', creds: { username: 'omar.k', password: 'Omar-Pass-1' } }
                ]
            }
        }
    };
}
const room = sc => sc.rooms.office;
const omar = sc => room(sc).npcs[0];

test('a scenario with none of the fields gets no line', { skip }, () => {
    const sc = base();
    delete sc.policies; delete sc.defaultPolicy;
    room(sc).objects = [room(sc).objects[0]];
    assert.deepEqual(issues(sc), []);
});

test('a clean code scenario has no error or warning and gives information lines', { skip }, () => {
    const out = issues(base());
    assert.deepEqual(errors(out), []);
    assert.deepEqual(warnings(out), []);
    assertHas(infos(out), "code_device 'omar_fob'");
    assertHas(infos(out), "PC 'desk_pc' (policy 'strict', code)");
});

test('error: an unknown mfa value', { skip }, () => {
    const sc = base('sms');
    assertHas(errors(issues(sc)), "policy 'strict' has mfa \"sms\"");
});

test('error: kind code where an admitted enrolled account has no code_device', { skip }, () => {
    const sc = base();
    room(sc).objects.pop();
    assertHas(errors(issues(sc)), "NPC 'omar' is admitted and enrolled but has no code_device");
});

test('an exempt account needs no code_device', { skip }, () => {
    const sc = base();
    room(sc).objects.pop();
    omar(sc).creds.mfa = false;
    assert.deepEqual(errors(issues(sc)), []);
    assertHas(warnings(issues(sc)), 'it does nothing');
});

test('error: two code devices for one owner', { skip }, () => {
    const sc = base();
    room(sc).objects.push({ id: 'second_fob', type: 'code_device', name: 'Fob 2', owner: 'omar' });
    assertHas(errors(issues(sc)), "2 code_devices belong to 'omar'");
});

test('error: a code_device with no owner, or an owner that is not an account', { skip }, () => {
    let sc = base();
    delete room(sc).objects[1].owner;
    assertHas(errors(issues(sc)), "code_device 'omar_fob' has no owner");
    sc = base();
    room(sc).objects[1].owner = 'nobody';
    assertHas(errors(issues(sc)), "owner 'nobody' is not an account");
});

test('error: a push kind where an admitted enrolled NPC has phone false', { skip }, () => {
    const sc = base('push');
    omar(sc).phone = false;
    assertHas(errors(issues(sc)), '"phone": false');
});

test('error: creds.mfa other than false', { skip }, () => {
    const sc = base();
    omar(sc).creds.mfa = true;
    assertHas(errors(issues(sc)), 'creds.mfa must be false');
    omar(sc).creds.mfa = 'false';
    assertHas(errors(issues(sc)), 'creds.mfa must be false');
});

test('the S8b fields are errors with the fixed line', { skip }, () => {
    const sc = base();
    sc.helpdesks = {};
    omar(sc).creds.recovery = {};
    omar(sc).creds.resetPassword = true;
    sc.social = { pretextNpcs: [{ id: 'c', asks: { a: { helpdesk: true } } }] };
    const out = errors(issues(sc));
    assertHas(out, '"helpdesks" is not built yet (MFA plan stage S8b)');
    assertHas(out, 'creds."recovery" is not built yet (MFA plan stage S8b)');
    assertHas(out, 'creds."resetPassword" is not built yet (MFA plan stage S8b)');
    assertHas(out, 'asks.a: "helpdesk" is not built yet (MFA plan stage S8b)');
});

test('warning: a code_device nobody can get, and one that is not gated', { skip }, () => {
    let sc = base();
    // held by a knock-out-immune NPC that never offers it
    room(sc).objects.pop();
    room(sc).npcs.push({ id: 'guard', npcType: 'person', koImmune: true, itemsHeld: [{ id: 'omar_fob', type: 'code_device', name: 'Fob', owner: 'omar' }] });
    assertHas(warnings(issues(sc)), "code_device 'omar_fob' cannot be held");
    sc = base();
    room(sc).objects.pop();
    omar(sc).itemsHeld = [{ id: 'omar_fob', type: 'code_device', name: 'Fob', owner: 'omar' }];
    omar(sc).storyPath = 'scenarios/none.ink.json';
    omar(sc).note = '#give_npc_inventory_items';
    assertHas(warnings(issues(sc)), "code_device 'omar_fob' is not gated");
    omar(sc).note = '#give_npc_inventory_items:code_device';
    assert.ok(!has(warnings(issues(sc)), 'not gated'));
});

test('warning: a loose owned phone', { skip }, () => {
    const sc = base();
    room(sc).objects.push({ id: 'omar_phone', type: 'phone_friendface', name: 'Phone', owner: 'omar', takeable: true });
    assertHas(warnings(issues(sc)), "Friendface phone 'omar_phone' (omar's) lies loose");
    room(sc).objects.pop();
    assert.ok(!has(warnings(issues(sc)), 'loose'));
});

test('warning: a code step that can lock for good', { skip }, () => {
    const sc = base();
    sc.policies.strict.maxAttempts = 3;
    assertHas(warnings(issues(sc)), 'can lock the sign-in for good');
    sc.policies.strict.maxAttempts = null;
    assert.ok(!has(warnings(issues(sc)), 'lock the sign-in'));
    const push = base('push');
    push.policies.strict.maxAttempts = 3;
    assert.ok(!has(warnings(issues(push)), 'lock the sign-in'));
});

test('warning: a saved connection that must be typed', { skip }, () => {
    const sc = base();
    sc.credentials = { omar_link: { kind: 'saved_connection', account: 'omar', connectsTo: 'desk_pc', proof: { session: 'omar' } } };
    assertHas(warnings(issues(sc)), "credentials/omar_link: a saved connection to PC 'desk_pc'");
    omar(sc).creds.mfa = false;
    assert.ok(!has(warnings(issues(sc)), 'credentials/omar_link'));
});

test('warning: a push step nobody passes, and the ways that fix it', { skip }, () => {
    const sc = base('push');
    room(sc).objects.pop();
    assertHas(warnings(issues(sc)), 'nobody passes this push step');
    // a phone lying in the room can be held
    room(sc).objects.push({ id: 'omar_phone', type: 'phone_friendface', name: 'Phone', owner: 'omar', takeable: true });
    assert.ok(!has(warnings(issues(sc)), 'nobody passes'));
    room(sc).objects.pop();
    // an owner who approves when pestered
    omar(sc).awareness = 'low';
    assert.ok(!has(warnings(issues(sc)), 'nobody passes'));
    omar(sc).awareness = 'high';
    assertHas(warnings(issues(sc)), 'nobody passes');
    omar(sc).habits = { approvesPrompts: 'always' };
    assert.ok(!has(warnings(issues(sc)), 'nobody passes'));
});

test('warning: patience with no effect', { skip }, () => {
    const sc = base('push');
    omar(sc).habits = { promptPatience: 4 };
    assertHas(warnings(issues(sc)), 'habits.promptPatience has no effect');
    omar(sc).awareness = 'low';
    assert.ok(!has(warnings(issues(sc)), 'has no effect'));
});

test('information line names the ways through for a technique session', { skip }, () => {
    const sc = base('push');
    const out = infos(issues(sc));
    assertHas(out, "NPC 'omar' through");
});

test('R1-S8: the information line lists the owner approving, and a device nobody can hold is not listed', { skip }, () => {
    let sc = base('push');
    omar(sc).awareness = 'low';
    assertHas(infos(issues(sc)), "NPC 'omar' through the owner approves (pestered or always)");
    sc = base('push');
    omar(sc).habits = { approvesPrompts: 'never' };
    assert.ok(!has(infos(issues(sc)), 'the owner approves'));
    sc = base();
    room(sc).objects.pop();
    room(sc).npcs.push({ id: 'guard', npcType: 'person', koImmune: true, itemsHeld: [{ id: 'omar_fob', type: 'code_device', name: 'Fob', owner: 'omar' }] });
    const out = issues(sc);
    assertHas(warnings(out), "code_device 'omar_fob' cannot be held");
    assert.ok(!has(infos(out), "through the account's code device"), out.join('\n'));
});

test('R1-S10: an all-digit two-digit PC id or username under number matching is an error', { skip }, () => {
    let sc = base('push_number_match');
    assert.ok(!has(errors(issues(sc)), 'two-digit'));
    room(sc).objects[0].id = '42';
    assertHas(errors(issues(sc)), "PC '42'");
    sc = base('push_number_match');
    omar(sc).creds.username = '73';
    assertHas(errors(issues(sc)), 'username');
    sc = base('push');
    omar(sc).creds.username = '73';
    assert.ok(!has(errors(issues(sc)), 'two-digit'));
});

test('habit keys: valid values pass, invalid ones and non-room NPCs are errors', { skip }, () => {
    const sc = base('push');
    omar(sc).awareness = 'low';
    omar(sc).habits = { approvesPrompts: 'pestered', promptPatience: 4 };
    assert.deepEqual(errors(habitIssues(sc)), []);
    omar(sc).habits = { approvesPrompts: 'sometimes', promptPatience: 1 };
    let out = errors(habitIssues(sc));
    assertHas(out, 'habits.approvesPrompts has value "sometimes"');
    assertHas(out, 'habits.promptPatience has value 1');
    omar(sc).habits = { promptPatience: 10 };
    assertHas(errors(habitIssues(sc)), 'habits.promptPatience has value 10');
    omar(sc).habits = { promptPatience: 2.5 };
    assertHas(errors(habitIssues(sc)), 'habits.promptPatience has value 2.5');
    delete omar(sc).habits;
    sc.npcs = [{ id: 'far', npcType: 'phone', habits: { approvesPrompts: 'never' } }];
    out = errors(habitIssues(sc));
    assertHas(out, "'npcs[0]' has habits.approvesPrompts, which is allowed only on room NPCs");
});

test('schema: the new fields are declared', () => {
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    assert.deepEqual(schema.properties.policies.additionalProperties.properties.mfa.enum, ['none', 'push', 'push_number_match', 'code']);
    const walk = (node, key, out = []) => {
        if (node && typeof node === 'object') {
            if (node[key] && typeof node[key] === 'object') out.push(node[key]);
            Object.values(node).forEach(v => walk(v, key, out));
        }
        return out;
    };
    const creds = walk(schema, 'creds').find(c => c.properties && c.properties.admin);
    assert.equal(creds.properties.mfa.type, 'boolean');
    assert.equal(creds.properties.mfa['x-serverOnly'], true);
    const habits = walk(schema, 'habits').find(h => h.properties && h.properties.locksScreen);
    assert.deepEqual(habits.properties.approvesPrompts.enum, ['never', 'pestered', 'always']);
    assert.equal(habits.properties.promptPatience.minimum, 2);
    assert.equal(habits.properties.promptPatience.maximum, 9);
});
