// scripts/validate_privilege.rb privilege_account_only, rule L9 (S5bc R1-L9): an account-only NPC's
// display name or username must not equal another NPC's id, display name or username, a PC name or host,
// a room name, a log source title or a word the answers carry (error); no authored string served to the
// browser may hold that name as a whole word (warning). One fixture per message, plus a clean one.
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/validator-privilege-l9.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
const fixture = name => JSON.parse(readFileSync(join(root, `test/js/fixtures/privilege_l9_${name}.json`), 'utf8'));

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
const l9 = list => list.filter(s => s.includes('account-only') && s.includes('also '));

test('the clean fixture gets no line at all', { skip }, () => {
    assert.deepEqual(issues(fixture('clean')), []);
});

const errorCases = [
    ['npc_id', "another NPC's id", 'dana'],
    ['npc_name', "another NPC's display name", 'dana kim'],
    ['npc_user', "another NPC's username", 'lee.m'],
    ['pc_name', 'a PC name', 'lab pc'],
    ['pc_host', 'a PC host', 'dom-pc-01'],
    ['room_name', 'a room name', 'open office'],
    ['log_title', 'a log source title', 'domain audit'],
    ['answer_word', 'a word the answers carry', 'guest'],
    ['key_word', 'a word the answers carry', 'hashid']
];
for (const [name, what, word] of errorCases) {
    test(`L9 error: equal to ${what} (${name}), any case`, { skip }, () => {
        const out = issues(fixture(name));
        const hit = out.filter(s => s.startsWith('❌') && s.includes(what) && s.toLowerCase().includes(`'${word}'`));
        assert.equal(hit.length, 1, out.join('\n'));
        assert.ok(hit[0].includes('svc'), 'names the account-only NPC');
        assert.equal(out.filter(s => s.startsWith('❌')).length, 1, out.join('\n'));
    });
}

test('L9 warning: an authored string served to the browser holds the name as a whole word', { skip }, () => {
    const out = issues(fixture('served_string'));
    const w = out.filter(s => s.startsWith('⚠️') && s.includes('whole word'));
    assert.equal(w.length, 1, out.join('\n'));
    assert.ok(w[0].includes('rooms.office.objects[2]'), w[0]);
    assert.equal(out.filter(s => s.startsWith('❌')).length, 0);
});

test('L9 warning: part of a longer word is not a whole word', { skip }, () => {
    const sc = fixture('served_string');
    sc.rooms.office.objects[2].text = 'The Backup services desk and backup_service2.';
    assert.deepEqual(issues(sc), []);
});

test('L9 warning: withheld keys and the account-only NPC itself are not served strings', { skip }, () => {
    const sc = fixture('clean');
    sc.rooms.office.npcs[0].role = 'Looks after the Backup service';
    sc.rooms.office.npcs[0].workarounds = [{ do: 'note', text: 'the backup service' }];
    assert.deepEqual(issues(sc), []);
});

test('no account-only NPC, no L9 line', { skip }, () => {
    const sc = fixture('served_string');
    sc.rooms.office.npcs = sc.rooms.office.npcs.filter(n => n.id !== 'svc');
    sc.rooms.office.objects.find(o => o.id === 'lab_pc').cachedAccounts = [{ npc: 'lee' }];
    delete sc.credentials.lab_svc;
    assert.deepEqual(l9(issues(sc)), []);
    assert.deepEqual(issues(sc), []);
});
