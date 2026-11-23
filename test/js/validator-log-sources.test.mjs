// scripts/validate_log_rows.rb check_log_rows (OPS_LOG_ROWS_PLAN.md sections 4.1 and 9, stage L1a):
// the `logSources` block. One fixture per error and warning, a clean fixture that raises none, and the
// schema's event-name pattern against every registered event. The registry is passed in, because the
// shipped one (lib/break_escape/ops_log_events.rb) is empty at L1a.
// Run with: node test/js/validator-log-sources.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

// A small registry: a door swipe, a sign-in with a save limit, a place-less note.
const EVENTS = `{
  'tst_door'   => { label: 'DOOR', places: %w[door object], results: %w[ok denied] },
  'tst_signin' => { label: 'SIGN_IN', places: %w[pc], results: %w[ok denied blocked], save_limit: { 'denied' => 10 } },
  'tst_note'   => { label: 'NOTE', places: [], results: %w[ok] }
}`;

function issues(scenario, eventsRuby = EVENTS) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      events = ${eventsRuby}
      puts JSON.generate(check_log_rows(JSON.parse(STDIN.read), events: events))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const assertHas = (list, frag) => assert.ok(list.some(s => s.includes(frag)), `expected "${frag}" in:\n${list.join('\n')}`);

function clean() {
    return {
        startRoom: 'lobby',
        gameClock: { startTime: '09:00', secondsPerGameMinute: 6 },
        logSources: {
            door_log: { title: 'Door controller', events: ['tst_door'], where: { rooms: ['lobby'] } },
            signins: { title: 'Sign-in audit', events: ['tst_signin'], where: { objects: ['recep_pc'] }, maxRows: 40 },
            notes: { title: 'Notes', events: ['tst_note'], showCardHolder: false }
        },
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'vault' },
                objects: [{ id: 'recep_pc', type: 'pc', name: 'Reception PC', locked: true, lockType: 'login' }],
                npcs: [{ id: 'guard', displayName: 'Guard', npcType: 'person', creds: { username: 'guard1', password: 'Gate-Pass-77' } }]
            },
            vault: { type: 'room_office', connections: { south: 'lobby' }, objects: [] }
        }
    };
}
const withSource = (patch, id = 'extra') => { const s = clean(); s.logSources[id] = { title: 'Extra', events: ['tst_note'], ...patch }; return s; };

test('the clean fixture raises no error or warning', { skip }, () => {
    const out = issues(clean());
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('a scenario without logSources is not checked', { skip }, () => {
    const s = clean(); delete s.logSources; delete s.gameClock;
    assert.deepEqual(issues(s), []);
});

test('error: logSources without a gameClock', { skip }, () => {
    const s = clean(); delete s.gameClock;
    assertHas(errors(issues(s)), 'needs a gameClock');
});

test('error: a source id that does not match the pattern', { skip }, () => {
    const s = clean(); s.logSources.Bad_Id = { title: 'x', events: ['tst_note'] };
    assertHas(errors(issues(s)), 'id must match');
});

test('error: an empty events list, a bad name, an unknown event and an unknown prefix', { skip }, () => {
    assertHas(errors(issues(withSource({ events: [] }))), 'events must be a non-empty array');
    assertHas(errors(issues(withSource({ events: ['Not An Event'] }))), 'is not an event name or a prefix');
    assertHas(errors(issues(withSource({ events: ['tst_missing'] }))), '"tst_missing" is not registered');
    assertHas(errors(issues(withSource({ events: ['nope_*'] }))), 'no registered event starts with that prefix');
});

test('error: the shipped registry is empty at L1a, so any event is unknown', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_log_rows(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(clean()), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    assertHas(errors(JSON.parse(r.stdout.trim().split('\n').pop())), 'is not registered');
});

test('error: a where room, object or place that does not exist, or is malformed', { skip }, () => {
    assertHas(errors(issues(withSource({ where: { rooms: ['nowhere'] } }))), 'is not a room');
    assertHas(errors(issues(withSource({ where: { objects: ['ghost'] } }))), 'is not an object');
    assertHas(errors(issues(withSource({ where: { places: ['door:nowhere'] } }))), 'names a room that does not exist');
    assertHas(errors(issues(withSource({ where: { places: ['pc:ghost'] } }))), 'does not exist in the scenario');
    assertHas(errors(issues(withSource({ where: { places: ['nokind:x'] } }))), 'must be "kind:id"');
    assertHas(errors(issues(withSource({ where: { rooms: [] } }))), 'non-empty array');
    assertHas(errors(issues(withSource({ where: { floors: ['a'] } }))), 'unknown keys');
});

test('error: maxRows out of range, and a sum over 300', { skip }, () => {
    assertHas(errors(issues(withSource({ maxRows: 5 }))), 'maxRows must be an integer from 10 to 150');
    assertHas(errors(issues(withSource({ maxRows: 151 }))), 'maxRows must be an integer from 10 to 150');
    assertHas(errors(issues(withSource({ maxRows: 'many' }))), 'maxRows must be an integer');
    const s = clean();
    for (const id of ['a', 'b', 'c']) s.logSources[id] = { title: id, events: ['tst_note'], maxRows: 150 };
    assertHas(errors(issues(s)), 'add up to');
});

test('error: a title that is empty, too long or holds control characters', { skip }, () => {
    assertHas(errors(issues(withSource({ title: '' }))), 'title must be a string');
    assertHas(errors(issues(withSource({ title: 'x'.repeat(41) }))), 'title must be a string');
    assertHas(errors(issues(withSource({ title: 'a\u0007b' }))), 'control characters');
});

test('error: more than 30 sources', { skip }, () => {
    const s = clean();
    for (let i = 0; i < 31; i++) s.logSources[`s${i}`] = { title: 'x', events: ['tst_note'], maxRows: 10 };
    assertHas(errors(issues(s)), 'more than 30 sources');
});

test('error: a stored id over 40 characters or with other characters, and a username over 32', { skip }, () => {
    const long = clean(); long.rooms.lobby.objects.push({ id: 'o'.repeat(41), type: 'pc', name: 'Long' });
    assertHas(errors(issues(long)), 'is over 40 characters');
    const odd = clean(); odd.rooms.lobby.objects.push({ id: 'has space', type: 'pc', name: 'Odd' });
    assertHas(errors(issues(odd)), 'holds characters outside');
    const user = clean(); user.rooms.lobby.npcs[0].creds.username = 'u'.repeat(33);
    assertHas(errors(issues(user)), 'account username');
});

test('warning: a prefix wildcard with no where', { skip }, () => {
    assertHas(warnings(issues(withSource({ events: ['tst_*'] }))), 'prefix wildcard');
    assert.deepEqual(warnings(issues(withSource({ events: ['tst_*'], where: { rooms: ['lobby'] } }))), []);
});

test('warning: maxRows below the events a source takes plus its limited places', { skip }, () => {
    const events = `{
      ${Array.from({ length: 12 }, (_, i) => `'tst_e_${i}' => { label: 'E', places: %w[object], results: %w[ok] }`).join(',\n')}
    }`;
    const s = clean();
    s.logSources = { many: { title: 'Many', events: ['tst_e_*'], maxRows: 10, where: { rooms: ['lobby'] } } };
    assertHas(warnings(issues(s, events)), 'a protected row may be evicted');
    s.logSources.many.maxRows = 12;
    assert.deepEqual(warnings(issues(s, events)).filter(w => w.includes('protected')), []);
});

test('warning: more possible save-counter keys than 256', { skip }, () => {
    const s = clean();
    s.logSources = { signins: { title: 'Sign-ins', events: ['tst_signin'], maxRows: 150 } };
    for (let i = 0; i < 300; i++) s.rooms.lobby.objects.push({ id: `pc_${i}`, type: 'pc', name: `PC ${i}` });
    assertHas(warnings(issues(s)), 'save-counter keys');
});

test('warning: a declared secret equal to a username, an id or an event code', { skip }, () => {
    const s = clean();
    s.rooms.vault.objects.push({ id: 'vault_safe', type: 'safe', locked: true, lockType: 'pin', requires: 'lobby' });
    assertHas(warnings(issues(s)), 'equals a username, an id or a registered event code');
    const code = clean();
    code.rooms.vault.objects.push({ id: 'vault_safe', type: 'safe', locked: true, lockType: 'pin', requires: 'denied' });
    assertHas(warnings(issues(code)), 'equals a username');
});

test('the check is hooked into the validator', { skip }, () => {
    const source = readFileSync(join(root, 'scripts/validate_scenario.rb'), 'utf8');
    assert.match(source, /run\.call\('check_log_rows'\) \{ check_log_rows\(json_data\) \}/);
});

test('schema: logSources is declared, closed, and every registered event passes its name pattern', { skip }, () => {
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    const block = schema.properties.logSources;
    assert.ok(block, 'logSources is a declared top-level key');
    assert.equal(block.additionalProperties.additionalProperties, false);
    assert.equal(block.additionalProperties.properties.where.additionalProperties, false);
    const pattern = new RegExp(block.additionalProperties.properties.events.items.pattern);
    const r = spawnSync('ruby', ['-e', `require 'json'; require ${JSON.stringify(join(root, 'lib/break_escape/ops_log_events.rb'))}
      puts JSON.generate(BreakEscape::OpsLogEvents::EVENTS.keys)`], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    for (const name of JSON.parse(r.stdout.trim().split('\n').pop()).concat(['tst_door', 'signin_*', 'a_b9'])) {
        assert.match(name, pattern, `${name} passes the schema's name pattern`);
    }
    assert.doesNotMatch('Bad Name', pattern);
    assert.doesNotMatch('x', pattern);
});
