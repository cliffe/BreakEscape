// scripts/validate_scenario.rb check_desktop_users (q94): a PC's desktopUser must be an object with a
// non-empty string name, and character (if set) a string; a character with no headshot asset is a
// warning (the desktop frame falls back to a silhouette). desktopUser is a known item field.
// Run with: node --test test/js/validator-desktop-user.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
const charsDir = join(root, 'public/break_escape/assets/characters');
const knownKey = existsSync(charsDir)
    ? (readdirSync(charsDir).find((f) => f.endsWith('_headshot.png')) || '').replace(/_headshot\.png$/, '')
    : '';

function run(fn, objects) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(${fn}(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ rooms: { office: { objects } } }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const check = (objects) => run('check_desktop_users', objects);
const pc = (extra) => ({ type: 'pc', id: 'desk_pc', name: 'Desk PC', host: 'DESK-PC-01', ...extra });

test('a well-formed desktopUser, with or without a known character, is clean', { skip }, () => {
    assert.ok(knownKey, 'expected at least one headshot asset');
    assert.deepEqual(check([pc({ desktopUser: { name: 'Sam Lee' } })]), []);
    assert.deepEqual(check([pc({ desktopUser: { name: 'Sam Lee', character: knownKey } })]), []);
    assert.deepEqual(check([pc({})]), []);
});

test('a bad desktopUser shape is an error', { skip }, () => {
    const notObject = check([pc({ desktopUser: 'Sam Lee' })]);
    assert.equal(notObject.length, 1);
    assert.match(notObject[0], /^❌ ERROR: .*desk_pc.*desktopUser must be an object/);

    const noName = check([pc({ desktopUser: { character: knownKey } })]);
    assert.equal(noName.length, 1);
    assert.match(noName[0], /^❌ ERROR: .*non-empty string 'name'/);

    assert.match(check([pc({ desktopUser: { name: '  ' } })])[0], /^❌ ERROR: .*'name'/);
    assert.match(check([pc({ desktopUser: { name: 'Sam', character: 7 } })])[0], /^❌ ERROR: .*'character' must be a non-empty string/);
});

test('a character with no headshot asset is a warning, not an error', { skip }, () => {
    const out = check([pc({ desktopUser: { name: 'Sam Lee', character: 'no_such_character_q94' } })]);
    assert.equal(out.length, 1);
    assert.match(out[0], /^⚠️ WARNING: .*no_such_character_q94.*silhouette/);
});

test('desktopUser nested in contents is checked too', { skip }, () => {
    const out = check([{ type: 'safe', id: 'box', contents: [pc({ desktopUser: {} })] }]);
    assert.equal(out.length, 1);
    assert.match(out[0], /contents\[0\]/);
});

test('desktopUser and host are known item fields (no unknown-field warning)', { skip }, () => {
    const out = run('check_unknown_fields', [pc({ desktopUser: { name: 'Sam Lee' } })]);
    assert.deepEqual(out.filter((w) => /desktopUser|'host'/.test(w)), []);
});

test('an unknown key inside desktopUser is reported once, by the schema', { skip }, () => {
    const objs = [pc({ desktopUser: { name: 'Sam Lee', rank: 'admin' } })];
    assert.deepEqual(check(objs), []);
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(validate_json(JSON.parse(STDIN.read), ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ rooms: { office: { objects: objs } } }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    const errs = JSON.parse(r.stdout.trim().split('\n').pop()).filter((e) => /desktopUser/.test(e) && /rank/.test(e));
    assert.equal(errs.length, 1, errs.join('\n'));
});

test('desktopUser on an NPC itemsHeld object is checked', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_desktop_users(JSON.parse(STDIN.read)))`;
    const scen = {
        rooms: { office: { objects: [], npcs: [{ id: 'npc_a', itemsHeld: [pc({ desktopUser: 'Sam Lee' })] }] } },
        npcs: [{ id: 'npc_b', itemsHeld: [pc({ desktopUser: { name: '' } })] }]
    };
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scen), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.equal(out.length, 2);
    assert.match(out[0], /npc_a.*itemsHeld\[0\].*must be an object/);
    assert.match(out[1], /npc_b.*itemsHeld\[0\].*'name'/);
});

test('desktopUser on a lockType login PC warns once', { skip }, () => {
    const login = check([pc({ lockType: 'login', desktopUser: { name: 'Sam Lee' } })]);
    assert.equal(login.length, 1);
    assert.match(login[0], /^⚠️ WARNING: .*sign-in PC/);
    assert.deepEqual(check([pc({ lockType: 'login' })]), []);
});

test('an rfid-locked PC with an access list and a desktopUser gets no sign-in warning', { skip }, () => {
    assert.deepEqual(check([pc({ lockType: 'rfid', access: { roles: ['staff'] }, desktopUser: { name: 'Sam Lee' } })]), []);
});
