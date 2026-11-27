// scripts/validate_privilege.rb privilege_cached_accounts (privilege plan S5b, unit 10): the cached
// accounts of a sign-in PC, the harvested hash proof, and the guards lifted from "not built yet".
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/validator-privilege-cached.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
const clean = () => JSON.parse(readFileSync(join(root, 'test/js/fixtures/privilege_cached_clean.json'), 'utf8'));

function run(scenario, call) {
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
const issues = sc => run(sc, 'check_privilege(data)');
const kind = (list, mark) => list.filter(s => s.startsWith(mark));
const errors = list => kind(list, '❌');
const warnings = list => kind(list, '⚠️');
const infos = list => kind(list, 'ℹ️');
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const pc = (sc, id) => sc.rooms.office.objects.find(o => o.id === id);
const npc = (sc, id) => sc.rooms.office.npcs.find(n => n.id === id);

test('the clean fixture gets no line at all', { skip }, () => {
    const out = issues(clean());
    assert.deepEqual(out, []);
    assert.ok(!has(out, 'Pass-'), 'no password in a message');
});

test('the old not-built guards for cachedAccounts and harvested are gone', { skip }, () => {
    assert.ok(!has(issues(clean()), 'S5b'));
});

test('a scenario with no S5b field gets no S5b line', { skip }, () => {
    const sc = clean();
    delete pc(sc, 'hot_desk').cachedAccounts;
    delete pc(sc, 'alex_pc').cachedAccounts;
    sc.credentials = {};
    assert.deepEqual(issues(sc), []);
});

test('a candidate with no hash record is an error', { skip }, () => {
    const sc = clean();
    delete sc.credentials.hot_priya;
    assertHas(errors(issues(sc)), "cached accounts are hashes: author one hash record per PC and account (PC 'hot_desk', account 'priya')");
});

test('two hash records for one candidate is an error', { skip }, () => {
    const sc = clean();
    sc.credentials.hot_priya_b = { kind: 'hash', account: 'priya', proof: { harvested: 'hot_desk' } };
    assertHas(errors(issues(sc)), "cached accounts are hashes");
});

test('a record whose proof names another PC does not count', { skip }, () => {
    const sc = clean();
    sc.credentials.hot_priya.proof.harvested = 'alex_pc';
    const out = errors(issues(sc));
    assertHas(out, "(PC 'hot_desk', account 'priya')");
    assertHas(out, "account 'priya' is not in the cachedAccounts of 'alex_pc'");
});

test('a candidate that is not an account holder is an error', { skip }, () => {
    const sc = clean();
    pc(sc, 'hot_desk').cachedAccounts.push({ npc: 'ghost' });
    assertHas(errors(issues(sc)), "cachedAccounts names 'ghost', which is not an account holder");
});

test('a repeated candidate is an error', { skip }, () => {
    const sc = clean();
    pc(sc, 'hot_desk').cachedAccounts.push({ npc: 'priya' });
    assertHas(errors(issues(sc)), "cachedAccounts names 'priya' more than once");
});

test('more than 8 candidates is an error', { skip }, () => {
    const sc = clean();
    const list = [];
    for (let i = 0; i < 9; i++) {
        const id = `p${i}`;
        sc.rooms.office.npcs.push({ id, npcType: 'person', creds: { username: `u${i}`, password: `Pw-${i}-xyz` } });
        sc.credentials[`h${i}`] = { kind: 'hash', account: id, proof: { harvested: 'hot_desk' } };
        list.push({ npc: id });
    }
    pc(sc, 'hot_desk').cachedAccounts = list;
    assertHas(errors(issues(sc)), 'cachedAccounts lists 9 accounts; the server reads at most 8');
});

test('an unknown after value is an error', { skip }, () => {
    const sc = clean();
    pc(sc, 'hot_desk').cachedAccounts[0].after = 'later';
    assertHas(errors(issues(sc)), "'after' must be \"borrow\" or absent");
});

test('after borrow on an owned PC is an error', { skip }, () => {
    const sc = clean();
    pc(sc, 'alex_pc').cachedAccounts[1].after = 'borrow';
    assertHas(errors(issues(sc)), "after \"borrow\" is only for a PC with no owner");
});

test('after borrow on a headless PC is an error', { skip }, () => {
    const sc = clean();
    pc(sc, 'hot_desk').headless = true;
    assertHas(errors(issues(sc)), "after \"borrow\" is not allowed on a headless PC");
});

test('after borrow with no matching borrow_session is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'sam').workarounds[0].pc = 'alex_pc';
    assertHas(errors(issues(sc)), "'sam' has no borrow_session workaround for PC 'hot_desk'");
});

test('a | in a PC id or an account id is an error', { skip }, () => {
    const sc = clean();
    pc(sc, 'hot_desk').id = 'hot|desk';
    sc.credentials.hot_priya.proof.harvested = 'hot|desk';
    sc.credentials.hot_sam.proof.harvested = 'hot|desk';
    npc(sc, 'sam').workarounds[0].pc = 'hot|desk';
    assertHas(errors(issues(sc)), "PC id 'hot|desk' holds a '|'");
    const sc2 = clean();
    npc(sc2, 'priya').id = 'pri|ya';
    pc(sc2, 'hot_desk').cachedAccounts[0].npc = 'pri|ya';
    sc2.credentials.hot_priya.account = 'pri|ya';
    assertHas(errors(issues(sc2)), "account id 'pri|ya' holds a '|'");
});

test('a PC id over 40 characters is an error', { skip }, () => {
    const sc = clean();
    const long = 'p'.repeat(41);
    pc(sc, 'hot_desk').id = long;
    sc.credentials.hot_priya.proof.harvested = long;
    sc.credentials.hot_sam.proof.harvested = long;
    npc(sc, 'sam').workarounds[0].pc = long;
    assertHas(errors(issues(sc)), 'is 41 characters; a cached-accounts PC id is at most 40');
});

test('cachedAccounts on an object that is not a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    sc.rooms.office.objects.push({ id: 'desk', type: 'desk', name: 'Desk', cachedAccounts: [{ npc: 'priya' }] });
    assertHas(errors(issues(sc)), 'cachedAccounts is only for a sign-in PC');
});

test('harvested on a kind other than hash is an error', { skip }, () => {
    const sc = clean();
    sc.credentials.odd = { kind: 'password', account: 'priya', proof: { harvested: 'hot_desk' } };
    assertHas(errors(issues(sc)), "credentials/odd: a harvested proof is only for a hash");
});

test('harvested naming something other than a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    sc.credentials.hot_priya.proof.harvested = 'nowhere';
    assertHas(errors(issues(sc)), "credentials/hot_priya: harvested names 'nowhere', which is not a sign-in PC");
});

test('harvested for an account the PC does not cache is an error', { skip }, () => {
    const sc = clean();
    sc.credentials.extra = { kind: 'hash', account: 'kemi', proof: { harvested: 'hot_desk' } };
    assertHas(errors(issues(sc)), "credentials/extra: account 'kemi' is not in the cachedAccounts of 'hot_desk'");
});

test('no admin path to a PC that caches accounts is a warning', { skip }, () => {
    const sc = clean();
    delete npc(sc, 'kemi').creds.admin;
    const out = warnings(issues(sc));
    assertHas(out, "PC 'hot_desk' caches accounts but no admin path reaches it");
    assertHas(out, "PC 'alex_pc' caches accounts but no admin path reaches it");
});

test('an owned, reached PC whose list leaves out its owner gets an info line', { skip }, () => {
    const sc = clean();
    pc(sc, 'alex_pc').cachedAccounts = [{ npc: 'kemi' }];
    delete sc.credentials.alex_alex;
    const out = issues(sc);
    assertHas(infos(out), "owner 'alex' of PC 'alex_pc' is not collectable here");
    assert.deepEqual(errors(out), []);
});

test('a cached account the PC cannot admit gets a collect-only info line', { skip }, () => {
    const sc = clean();
    pc(sc, 'hot_desk').access = { people: ['priya'] };
    const out = infos(issues(sc));
    assertHas(out, "account 'sam' is collect-only on PC 'hot_desk'");
    assert.ok(!has(out, "account 'priya' is collect-only"));
});
