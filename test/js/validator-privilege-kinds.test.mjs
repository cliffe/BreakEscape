// scripts/validate_privilege.rb privilege_account_kinds (privilege plan S5c, unit 18): account kinds,
// PC domains and account-only accounts, and the lifted "not built yet" guards.
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/validator-privilege-kinds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
const clean = () => JSON.parse(readFileSync(join(root, 'test/js/fixtures/privilege_kinds_clean.json'), 'utf8'));

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_privilege.rb'))}
      require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_privilege(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const kind = (list, mark) => list.filter(s => s.startsWith(mark));
const errors = list => kind(list, '❌');
const warnings = list => kind(list, '⚠️');
const infos = list => kind(list, 'ℹ️');
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const obj = (sc, id) => sc.rooms.office.objects.find(o => o.id === id);
const npc = (sc, id) => sc.rooms.office.npcs.find(n => n.id === id);

test('the clean fixture gets no line at all', { skip }, () => {
    const out = issues(clean());
    assert.deepEqual(out, []);
    assert.ok(!has(out, 'Pass-'), 'no password in a message');
});

test('the old not-built guards are gone', { skip }, () => {
    assert.ok(!has(issues(clean()), 'S5c'));
    assert.ok(!has(issues(clean()), 'not built yet'));
});

test('a scenario with no S5c field gets no S5c line', { skip }, () => {
    const sc = clean();
    delete obj(sc, 'dom_pc').domain;
    delete npc(sc, 'dana').creds.accountKind;
    delete npc(sc, 'dana').creds.domain;
    delete npc(sc, 'lee').creds.accountKind;
    delete npc(sc, 'lee').creds.localTo;
    sc.rooms.office.npcs = sc.rooms.office.npcs.filter(n => n.id !== 'svc');
    obj(sc, 'lab_pc').cachedAccounts = obj(sc, 'lab_pc').cachedAccounts.filter(c => c.npc !== 'svc');
    delete sc.credentials.lab_svc;
    assert.deepEqual(issues(sc), []);
});

// ---- PC domain ----
test('a domain on an object that is not a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'notes').domain = 'corp';
    assertHas(errors(issues(sc)), 'domain is only for a sign-in PC');
});

test('a PC domain outside the pattern is an error', { skip }, () => {
    for (const bad of ['', 'has space', 'x'.repeat(33), 5]) {
        const sc = clean();
        obj(sc, 'dom_pc').domain = bad;
        assertHas(errors(issues(sc)), 'domain must be 1 to 32 letters, digits, dots or hyphens');
    }
});

test('a PC domain that no account uses is a warning', { skip }, () => {
    const sc = clean();
    obj(sc, 'dom_pc').domain = 'other.example';
    const out = issues(sc);
    assertHas(warnings(out), "domain 'other.example' is used by no account's creds.domain");
    assertHas(errors(out), "creds.domain 'corp' is the domain of no sign-in PC");
});

// ---- account kind ----
test('an unknown accountKind is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'lee').creds.accountKind = 'forest';
    assertHas(errors(issues(sc)), 'creds.accountKind must be "local" or "domain"');
});

test('a creds.domain outside the pattern is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'dana').creds.domain = 'bad domain!';
    assertHas(errors(issues(sc)), 'creds.domain must be 1 to 32 letters, digits, dots or hyphens');
});

test('creds.domain without accountKind domain is a warning', { skip }, () => {
    const sc = clean();
    npc(sc, 'bo').creds.domain = 'corp';
    assertHas(warnings(issues(sc)), 'creds.domain does nothing without accountKind "domain"');
});

test('creds.localTo without accountKind local is a warning', { skip }, () => {
    const sc = clean();
    npc(sc, 'bo').creds.localTo = ['lab_pc'];
    assertHas(warnings(issues(sc)), 'creds.localTo does nothing without accountKind "local"');
});

test('a domain account with no creds.domain is an error', { skip }, () => {
    const sc = clean();
    delete npc(sc, 'dana').creds.domain;
    assertHas(errors(issues(sc)), 'a domain account needs creds.domain');
});

test('a domain that no sign-in PC has is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'dana').creds.domain = 'nowhere';
    assertHas(errors(issues(sc)), "creds.domain 'nowhere' is the domain of no sign-in PC");
});

test('a local account with no localTo is an error', { skip }, () => {
    for (const value of [undefined, [], 'lab_pc', [5]]) {
        const sc = clean();
        if (value === undefined) delete npc(sc, 'lee').creds.localTo;
        else npc(sc, 'lee').creds.localTo = value;
        assertHas(errors(issues(sc)), 'a local account needs creds.localTo, a list of sign-in PC ids');
    }
});

test('a localTo id that is not a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'lee').creds.localTo = ['lab_pc', 'notes'];
    assertHas(errors(issues(sc)), "creds.localTo names 'notes', which is not a sign-in PC");
});

test('a localTo PC whose access list refuses the account is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'dom_pc').access = { people: ['dana'] };
    npc(sc, 'lee').creds.localTo = ['lab_pc', 'dom_pc'];
    assertHas(errors(issues(sc)), "creds.localTo names 'dom_pc', but that PC's access list refuses the account");
});

test('a shared local administrator is an info line', { skip }, () => {
    const sc = clean();
    npc(sc, 'lee').creds.localTo = ['lab_pc', 'dom_pc'];
    const out = issues(sc);
    assertHas(infos(out), 'a shared local administrator (it opens 2 PCs once cracked)');
    assert.equal(errors(out).length, 0, errors(out).join('\n'));
});

test('an owner whose kind refuses its own PC is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'dom_pc').domain = 'elsewhere';
    const out = errors(issues(sc));
    assertHas(out, "its owner 'dana' has an account kind that refuses this PC");
});

test('a borrower whose kind refuses the PC is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'bo').creds.accountKind = 'local';
    npc(sc, 'bo').creds.localTo = ['lab_pc'];
    assertHas(errors(issues(sc)), "its borrow_session at PC 'dom_pc' needs an account that the account kind refuses there");
});

// ---- account only ----
test('accountOnly must be true or false', { skip }, () => {
    const sc = clean();
    npc(sc, 'svc').accountOnly = 'yes';
    assertHas(errors(issues(sc)), 'accountOnly must be true or false');
});

test('an account-only NPC needs creds.username', { skip }, () => {
    const sc = clean();
    delete npc(sc, 'svc').creds.username;
    assertHas(errors(issues(sc)), 'an account-only NPC needs creds.username');
});

test('an account-only NPC needs staff set to true or false', { skip }, () => {
    const sc = clean();
    delete npc(sc, 'svc').staff;
    assertHas(errors(issues(sc)), 'an account-only NPC needs staff set to true or false');
});

test('an account-only NPC may carry only the allowed keys', { skip }, () => {
    for (const key of ['itemsHeld', 'storyPath', 'habits', 'awareness', 'position']) {
        const sc = clean();
        npc(sc, 'svc')[key] = key === 'storyPath' ? 'x.json' : [];
        assertHas(errors(issues(sc)), `an account-only NPC may not carry '${key}'`);
    }
    const sc = clean();
    npc(sc, 'svc')._note = 'a comment key is fine';
    npc(sc, 'svc').role = 'service';
    assert.deepEqual(issues(sc), []);
});

test('an account-only NPC cannot have workarounds', { skip }, () => {
    const sc = clean();
    npc(sc, 'svc').workarounds = [{ do: 'borrow_session', pc: 'dom_pc' }];
    assertHas(errors(issues(sc)), 'an account-only NPC cannot have workarounds');
});

test('an account-only owner is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'lab_pc').owner = 'svc';
    assertHas(errors(issues(sc)), "its owner 'svc' is an account-only NPC");
});

test('an account-only candidate after borrow is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'lab_pc').cachedAccounts.find(c => c.npc === 'svc').after = 'borrow';
    assertHas(errors(issues(sc)), "cachedAccounts names account-only 'svc' after \"borrow\"");
});

test('share_login naming an account-only colleague is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'bo').workarounds.push({ do: 'share_login', with: 'svc' });
    assertHas(errors(issues(sc)), "share_login names account-only 'svc' as the colleague");
});

test('an account-only account may be a start candidate and carry a hash', { skip }, () => {
    const out = issues(clean());
    assert.ok(!has(out, 'svc'));
});

test('long ids are cut in messages', { skip }, () => {
    const sc = clean();
    npc(sc, 'lee').creds.localTo = ['lab_pc', 'z'.repeat(200)];
    const out = errors(issues(sc)).join('\n');
    assert.ok(!out.includes('z'.repeat(61)));
});
