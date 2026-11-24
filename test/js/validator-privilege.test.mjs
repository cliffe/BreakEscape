// scripts/validate_privilege.rb check_privilege (privilege plan S5a, section 9): the admin-session
// profile collision warning, the USB-governed remove_item order warning, the two-PC needsSession
// warning, the "not built yet" errors for S5b and S5c fields, and the creds.admin schema entry.
// Run with: node test/js/validator-privilege.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function rubyRun(scenario, call) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_privilege.rb'))}
      require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(${call})`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = sc => rubyRun(sc, 'check_privilege(data)');
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

// Kemi (admin) and Omar (owner of desk_pc) both sign in at desk_pc. Omar's own profile and the
// IT profile each hold an item named "Notes"; no account is admitted by both profiles.
function base() {
    return {
        startRoom: 'office',
        accountProfiles: {
            omar_files: { for: { people: ['omar'] }, contents: [{ id: 'omar_notes', type: 'text_file', name: 'Notes', readable: true, text: 'a' }] },
            it_files: { for: { roles: ['it'] }, contents: [{ id: 'it_notes', type: 'text_file', name: 'Notes', readable: true, text: 'b' }] }
        },
        rooms: {
            office: {
                type: 'room_office', connections: {},
                objects: [
                    { id: 'desk_pc', type: 'pc', name: 'Desk PC', lockType: 'login', locked: true, owner: 'omar' },
                    { id: 'plain_desk', type: 'desk', name: 'Desk' }
                ],
                npcs: [
                    { id: 'omar', npcType: 'person', creds: { username: 'omar.k', password: 'Omar-Pass-1' } },
                    { id: 'kemi', npcType: 'person', role: 'it', creds: { username: 'kemi.a', password: 'Kemi-Pass-2', admin: true } }
                ]
            }
        }
    };
}
const objects = sc => sc.rooms.office.objects;
const npc = (sc, id) => sc.rooms.office.npcs.find(n => n.id === id);

test('a scenario with no creds.admin and no admin grant gets no line', { skip }, () => {
    const sc = base();
    delete npc(sc, 'kemi').creds.admin;
    assert.deepEqual(issues(sc), []);
});

test('a clean scenario with an admin account and distinct item names gets no line', { skip }, () => {
    const sc = base();
    sc.accountProfiles.it_files.contents[0].name = 'Runbook';
    assert.deepEqual(issues(sc), []);
});

test('(a) same-named items that meet only in an admin session warn', { skip }, () => {
    const out = warnings(issues(base()));
    assertHas(out, "profiles 'omar_files' and 'it_files' both hold a top-level item named 'notes'");
    assertHas(out, "admin session by 'kemi'");
    assert.ok(!has(out, 'Pass-'), 'no password in a message');
});

test('(a) an admin grant on the PC host also counts', { skip }, () => {
    const sc = base();
    delete npc(sc, 'kemi').creds.admin;
    sc.networks = { office_lan: { name: 'Office' } };
    Object.assign(objects(sc)[0], { network: 'office_lan', services: [{ name: 'files', port: 445, weaknesses: [
        { id: 'w1', class: 'unpatched', severity: 'high', summary: 'x', grants: { session: { account: 'kemi', access: 'admin' } } }] }] });
    assertHas(warnings(issues(sc)), "admin session by 'kemi'");
});

test('(a) no warning when no profile admits the PC owner', { skip }, () => {
    const sc = base();
    sc.accountProfiles.omar_files.for = { people: ['nobody'] };
    assert.deepEqual(issues(sc), []);
});

test('(a) no warning when one account is admitted by both profiles (they meet without admin)', { skip }, () => {
    const sc = base();
    sc.accountProfiles.it_files.for = { roles: ['it'], people: ['omar'] };
    assert.deepEqual(issues(sc), []);
});

test('(a) no warning when the admin account is not admitted at the PC', { skip }, () => {
    const sc = base();
    objects(sc)[0].access = { people: ['omar'] };
    assert.deepEqual(issues(sc), []);
});

// (b) a remove_item that is not first, on a governed (login) object or an ungoverned one.
const removeSecond = [{ type: 'confirm_action', text: 'Plug it in?', onConfirm: [
    { type: 'set_global', key: 'x', value: true }, { type: 'remove_item', itemId: 'kit' }] }];
const removeFirst = [{ type: 'confirm_action', text: 'Plug it in?', onConfirm: [
    { type: 'remove_item', itemId: 'kit' }, { type: 'set_global', key: 'x', value: true }] }];

test('(b) remove_item second in an onConfirm on a governed object warns', { skip }, () => {
    const sc = base();
    objects(sc)[0].triggerOnInteract = removeSecond;
    assertHas(warnings(issues(sc)), 'not the first action of its list on a USB-governed object');
});

test('(b) remove_item second in a top-level list on a governed object warns', { skip }, () => {
    const sc = base();
    objects(sc)[0].triggerOnInteract = [{ type: 'set_global', key: 'x', value: true }, { type: 'remove_item', itemId: 'kit' }];
    assertHas(warnings(issues(sc)), 'not the first action of its list');
});

test('(b) remove_item first on a governed object does not warn', { skip }, () => {
    const sc = base();
    objects(sc)[0].triggerOnInteract = removeFirst;
    assert.deepEqual(warnings(issues(sc)).filter(s => s.includes('remove_item')), []);
});

test('(b) remove_item second on an ungoverned object does not warn', { skip }, () => {
    const sc = base();
    objects(sc)[1].triggerOnInteract = removeSecond;
    assert.deepEqual(warnings(issues(sc)).filter(s => s.includes('remove_item')), []);
});

// (c) needsSession grants that name two PCs.
const grant = pc => ({ type: 'grant_foothold', pc, needsSession: true, needsHeld: 'kit' });

test('(c) two different PCs in one object warn', { skip }, () => {
    const sc = base();
    objects(sc)[1].triggerOnInteract = [{ type: 'confirm_action', text: 'Go?', onConfirm: [grant('desk_pc'), grant('other_pc')] }];
    const out = warnings(issues(sc));
    assertHas(out, 'needsSession grants name more than one PC (desk_pc, other_pc)');
});

test('(c) the same PC twice does not warn', { skip }, () => {
    const sc = base();
    objects(sc)[1].triggerOnInteract = [grant('desk_pc'), { type: 'confirm_action', text: 'Go?', onConfirm: [grant('desk_pc')] }];
    assert.deepEqual(warnings(issues(sc)).filter(s => s.includes('needsSession')), []);
});

// S5b is built (unit 10): its fields are no longer "not built yet" (the checks are in
// validator-privilege-cached.test.mjs).
test('S5b fields are no longer errors: cachedAccounts and a harvested proof', { skip }, () => {
    const sc = base();
    objects(sc)[0].cachedAccounts = [{ npc: 'kemi' }];
    sc.credentials = { c1: { kind: 'hash', account: 'kemi', proof: { harvested: 'desk_pc' } } };
    assert.ok(!has(issues(sc), 'is not built yet (privilege plan stage S5b)'));
});

// S5c is built (unit 18): its fields are no longer "not built yet" (the checks are in
// validator-privilege-kinds.test.mjs).
test('S5c fields are no longer errors: accountKind, localTo, domain, accountOnly', { skip }, () => {
    const sc = base();
    Object.assign(npc(sc, 'omar').creds, { accountKind: 'local', localTo: ['desk_pc'], domain: 'HQ' });
    npc(sc, 'omar').accountOnly = true;
    objects(sc)[0].domain = 'HQ';
    assert.ok(!has(issues(sc), 'is not built yet (privilege plan stage S5c)'));
});

test('creds.admin must be a boolean in the schema', { skip }, () => {
    const schema = JSON.stringify(join(root, 'scripts/scenario-schema.json'));
    const call = `validate_json(data, ${schema})`;
    const good = base();
    assert.ok(!has(rubyRun(good, call), 'admin'), 'admin: true is accepted');
    const bad = base();
    npc(bad, 'kemi').creds.admin = 'yes';
    assertHas(rubyRun(bad, call), 'admin');
});

test('validate_scenario.rb runs check_privilege', { skip }, () => {
    const src = spawnSync('grep', ['-c', "run.call('check_privilege')", join(root, 'scripts/validate_scenario.rb')], { encoding: 'utf8' });
    assert.equal(src.stdout.trim(), '1');
});
