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
    for (let i = 0; i < 300; i++) s.rooms.lobby.objects.push({ id: `pc_${i}`, type: 'pc', name: `PC ${i}`, locked: true, lockType: 'login' });
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

// R1 m7: a source with no maxRows has the default 50.
test('warning: a source with no maxRows is checked against the default 50 (R1 m7)', { skip }, () => {
    const events = `{
      ${Array.from({ length: 51 }, (_, i) => `'tst_e_${i}' => { label: 'E', places: [], results: %w[ok] }`).join(',\n')}
    }`;
    const s = clean();
    s.logSources = { many: { title: 'Many', events: ['tst_e_*'] } };
    assertHas(warnings(issues(s, events)), 'a protected row may be evicted');
});

// R1 m8: only sign-in PCs count as pc places, a room filter narrows objects and pcs by the holding room,
// and rooms, objects and places are a union.
test('warning: limited places are counted by the sign-in PCs and the source\'s own filter (R1 m8)', { skip }, () => {
    const s = clean();
    s.logSources = { signins: { title: 'Sign-ins', events: ['tst_signin'], maxRows: 10, where: { rooms: ['vault'] } } };
    s.rooms.lobby.objects.push(...Array.from({ length: 300 }, (_, i) => ({ id: `lobby_pc_${i}`, type: 'pc', name: 'PC', locked: true, lockType: 'login' })));
    s.rooms.lobby.objects.push(...Array.from({ length: 300 }, (_, i) => ({ id: `lobby_desk_${i}`, type: 'desk', name: 'Desk' })));
    s.rooms.vault.objects.push({ id: 'vault_pc', type: 'pc', name: 'Vault PC', locked: true, lockType: 'login' });
    assert.deepEqual(warnings(issues(s)).filter(w => w.includes('save-counter') || w.includes('protected')), []);
    s.logSources.signins.where = { rooms: ['vault'], places: ['pc:recep_pc'] };
    s.logSources.signins.maxRows = 10;
    assert.deepEqual(warnings(issues(s)).filter(w => w.includes('save-counter')), []);
    const out = warnings(issues(s)).filter(w => w.includes('protected'));
    assert.equal(out.length, 0, out.join('\n')); // 1 event + 2 pcs (vault_pc, recep_pc) = 3, under 10
    s.logSources.signins.maxRows = 10;
    s.rooms.vault.objects.push(...Array.from({ length: 10 }, (_, i) => ({ id: `vault_pc_${i}`, type: 'pc', name: 'PC', locked: true, lockType: 'login' })));
    assertHas(warnings(issues(s)), 'protected row'); // 1 + 12 pcs over 10
});

// R1 m9: the secret-collision warning uses the guard's own secret set.
test('warning: a card id equal to an rfid lock requires is not a secret collision (R1 m9)', { skip }, () => {
    const card = clean();
    card.rooms.vault.objects.push({ id: 'vault_door_lock', type: 'safe', locked: true, lockType: 'rfid', requires: 'lobby' });
    assert.deepEqual(warnings(issues(card)).filter(w => w.includes('equals a username')), []);
    for (const [lock, extra] of [['combination', { requires: [12, 'lobby', 5] }], ['cryptex', { requires: 'lobby' }]]) {
        const s = clean();
        s.rooms.vault.objects.push({ id: 'vault_safe', type: 'safe', locked: true, lockType: lock, ...(lock === 'combination' ? { requires: 'lobby' } : extra) });
        assertHas(warnings(issues(s)), 'equals a username');
    }
    const npc = clean();
    npc.npcs = [{ id: 'phone_friend', creds: { username: 'pf', password: 'lobby' } }];
    assertHas(warnings(issues(npc)), 'equals a username');
});

// R1 m10: a kind with no lister is not existence-checked.
test('error: where.places of a kind the validator cannot list is not refused (R1 m10)', { skip }, () => {
    const kinds = "{ 'door' => {}, 'object' => {}, 'pc' => {}, 'host' => {}, 'network' => {} }";
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      events = ${EVENTS}
      puts JSON.generate(check_log_rows(JSON.parse(STDIN.read), events: events, kinds: ${kinds}))`;
    const s = withSource({ where: { places: ['host:db_server', 'network:corp', 'door:nowhere'] } });
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(s), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    const out = errors(JSON.parse(r.stdout.trim().split('\n').pop()));
    assert.equal(out.length, 1, out.join('\n'));
    assertHas(out, 'door:nowhere');
});

// R1 m11: author-note keys.
test('a "_" note key inside logSources is not a source (R1 m11)', { skip }, () => {
    const s = clean();
    s.logSources._note = { author: 'a note that looks like a source' };
    s.logSources._todo = 'text';
    assert.deepEqual(errors(issues(s)).concat(warnings(issues(s))), []);
});

// R1 m12: the stored-id check covers the ids a row can hold, not every id in the scenario.
test('an objective id over 40 characters is not a stored id (R1 m12)', { skip }, () => {
    const s = clean();
    s.objectives = [{ aimId: 'a'.repeat(60), title: 'x', tasks: [{ taskId: 't'.repeat(60), title: 'y' }] }];
    s.startItemsInventory = [{ id: 'weird id'.repeat(8) }];
    assert.deepEqual(errors(issues(s)), []);
    const room = clean(); room.rooms.lobby.objects.push({ id: 'k'.repeat(41), type: 'pc', name: 'Long' });
    assertHas(errors(issues(room)), 'is over 40 characters');
    const net = clean(); net.networks = { ['n'.repeat(41)]: { name: 'Net' } };
    assertHas(errors(issues(net)), 'is over 40 characters');
});

test('error: an accountProfiles id over 40 characters or with other characters (S5a R1 F6)', { skip }, () => {
    const long = clean(); long.accountProfiles = { ['p'.repeat(41)]: { for: { people: ['a'] }, contents: [] } };
    assertHas(errors(issues(long)), 'is over 40 characters');
    const odd = clean(); odd.accountProfiles = { 'has space': { for: { people: ['a'] }, contents: [] } };
    assertHas(errors(issues(odd)), 'holds characters outside');
    const ok = clean(); ok.accountProfiles = { fine_profile: { for: { people: ['a'] }, contents: [] } };
    assert.deepEqual(errors(issues(ok)), []);
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

// R2 N2 and N3: the authored combination and cryptexConfig.answer copies, and a flag station's literal
// answers, are in the validator's secret list (a reference with a colon is not).
test('warning: authored answer copies and station literal flags are secrets (R2 N2, N3)', { skip }, () => {
    const cases = [
        { id: 'c1', type: 'safe', locked: true, lockType: 'combination', requires: '12-30-05', combination: 'lobby' },
        { id: 'c2', type: 'safe', locked: true, lockType: 'cryptex', requires: 'OTHERWORD', cryptexConfig: { answer: 'lobby' } },
        { id: 'c3', type: 'flag-station', flags: ['lobby'] }
    ];
    for (const object of cases) {
        const s = clean();
        s.rooms.vault.objects.push(object);
        assertHas(warnings(issues(s)), 'equals a username');
    }
    const ref = clean();
    ref.rooms.vault.objects.push({ id: 'c4', type: 'flag-station', flags: ['lobby:flag_a'] });
    assert.deepEqual(warnings(issues(ref)).filter(w => w.includes('equals a username')), []);
});

// Plan section 9: the reader checks (L2a R2, S2 and N5).
const withReader = (patch, source = 'door_log') => {
    const s = clean();
    s.rooms.lobby.objects.push({ id: 'door_reader', type: 'ops_log_terminal', name: 'Door log', minigameData: { logSource: source }, ...patch });
    return s;
};

test('a well-formed ops_log_terminal raises no error', { skip }, () => {
    assert.deepEqual(errors(issues(withReader({}))), []);
});

test('error: an ops_log_terminal with no id', { skip }, () => {
    assertHas(errors(issues(withReader({ id: undefined }))), 'needs an id');
});

test('error: an ops_log_terminal naming an undeclared source, with or without logSources', { skip }, () => {
    assertHas(errors(issues(withReader({}, 'no_such_source'))), 'is not a declared source');
    const s = withReader({}); delete s.logSources; delete s.gameClock;
    assertHas(errors(issues(s)), 'is not a declared source');
});

test('error: an ops_log_terminal with lockType login', { skip }, () => {
    assertHas(errors(issues(withReader({ locked: true, lockType: 'login' }))), 'cannot have lockType login');
});

test('error: an ops_log_terminal nested in a PC desktop is reached by the same checks (R3-8)', { skip }, () => {
    const s = clean();
    s.rooms.lobby.objects.push({ id: 'desk_pc', type: 'pc', name: 'Desk PC', contents: [
        { id: 'nested_reader', type: 'ops_log_terminal', name: 'Nested log', minigameData: { logSource: 'no_such_source' } }
    ] });
    assertHas(errors(issues(s)), 'is not a declared source');
    s.rooms.lobby.objects[s.rooms.lobby.objects.length - 1].contents[0].minigameData.logSource = 'door_log';
    assert.deepEqual(errors(issues(s)), []);
});

// Seed rows and an anomaly's row (L2b, plan sections 4.2 and 9): one fixture per error and warning.
const SEED_EVENTS = `{
  'badge_swipe'  => { label: 'BADGE', places: %w[door object], results: %w[ok denied], detail: { 'flagged' => { count: 1, show: false } } },
  'signin_fail'  => { label: 'SIGN_IN', places: %w[pc], results: %w[fail] },
  'signin_ok'    => { label: 'SIGN_IN', places: %w[pc], results: %w[ok], detail: { 'method' => %w[password credential], 'tries' => { count: 5 }, 'host' => { id: 'pc' }, 'tag' => { alias: 'x' } } },
  'tst_note'     => { label: 'NOTE', places: [], results: %w[ok] }
}`;
const seedRow = (patch = {}) => ({ id: 's1', at: 'Mon 23:58', event: 'badge_swipe', as: 'guard', where: { kind: 'door', id: 'vault' }, result: 'ok', ...patch });
function withSeeds(rows, { start = 'Tue 09:00', events = ['badge_swipe', 'signin_fail', 'signin_ok', 'tst_note'] } = {}) {
    const s = clean();
    s.gameClock = { start };
    s.logSources = { door_log: { title: 'Door controller', events, seedRows: rows } };
    return s;
}
const seedIssues = (rows, opts) => issues(withSeeds(rows, opts), SEED_EVENTS);
const two = [seedRow(), seedRow({ id: 's2', at: '07:12', event: 'signin_fail', as: 'j.price', where: { kind: 'pc', id: 'recep_pc' }, result: 'fail' })];

test('seed rows: the plan example shape raises no error or warning', { skip }, () => {
    const out = seedIssues(two);
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('seed rows: no seedRows key is not checked, an empty list is fine', { skip }, () => {
    assert.deepEqual(errors(seedIssues([])), []);
});

test('error: seedRows that is not an array, a row that is not an object, more than 100 rows', { skip }, () => {
    const s = withSeeds([]); s.logSources.door_log.seedRows = 'nope';
    assertHas(errors(issues(s, SEED_EVENTS)), 'seedRows must be an array');
    assertHas(errors(seedIssues(['x'])), 'must be an object');
    const many = Array.from({ length: 101 }, (_, i) => seedRow({ id: `s${i}`, at: 'Mon 10:00' }));
    assertHas(errors(seedIssues(many)), 'more than 100 seed rows');
});

test('error: seed rows with no gameClock.start', { skip }, () => {
    const s = withSeeds(two); s.gameClock = { startTime: '09:00' };
    assertHas(errors(issues(s, SEED_EVENTS)), 'seedRows need gameClock.start');
});

test('error: a seed row id that does not match, or repeats', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ id: 'row1' })])), 'id must match');
    assertHas(errors(seedIssues([seedRow(), seedRow({ at: 'Mon 23:59' })])), 'id is used twice');
});

test('error: a seed row with an unknown key', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ seq: 4 })])), 'unknown keys');
});

test('error: a bad at, a day with no start day, a row after the start', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ at: '25:00' })])), 'at must be HH:MM');
    assertHas(errors(seedIssues([seedRow({ at: '7:12' })])), 'at must be HH:MM');
    assertHas(errors(seedIssues([seedRow()], { start: '09:00' })), 'names a day but gameClock.start has none');
    assertHas(errors(seedIssues([seedRow({ at: 'Tue 09:01' })])), 'after the mission\'s start time');
    assertHas(errors(seedIssues([seedRow({ at: '09:01' })])), 'after the mission\'s start time');
    assert.deepEqual(errors(seedIssues([seedRow({ at: 'Tue 09:00' })])), []);
});

test('error: seed rows that do not ascend, including across a day', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ at: '07:12' }), seedRow({ id: 's2', at: 'Mon 23:58' })])), 'must ascend');
    assertHas(errors(seedIssues([seedRow({ at: 'Mon 23:58' }), seedRow({ id: 's2', at: 'Mon 23:10' })])), 'must ascend');
    assert.deepEqual(errors(seedIssues([seedRow({ at: 'Mon 23:58' }), seedRow({ id: 's2', at: 'Mon 23:58' })])), []);
});

test('error: an unknown event, and a result the event does not allow', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ event: 'no_such_event' })])), 'is not registered');
    assertHas(errors(seedIssues([seedRow({ result: 'fail' })])), 'is not one of ok, denied');
});

test('warning: a seed row of an event the source does not record', { skip }, () => {
    assertHas(warnings(seedIssues([seedRow()], { events: ['signin_fail'] })), 'is not one the source records');
});

test('error: where missing, wrong kind, a room or PC that does not exist', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ where: undefined })])), 'where is missing');
    assertHas(errors(seedIssues([seedRow({ where: { kind: 'pc', id: 'recep_pc' } })])), 'is not one badge_swipe allows');
    assertHas(errors(seedIssues([seedRow({ where: { kind: 'door', id: 'nowhere' } })])), 'names a room that does not exist');
    assertHas(errors(seedIssues([seedRow({ id: 's1', event: 'signin_fail', result: 'fail', where: { kind: 'pc', id: 'ghost_pc' } })])), 'names a pc that does not exist');
    assertHas(errors(seedIssues([seedRow({ where: { kind: 'door' } })])), 'where must be');
});

test('error: as that is not an NPC id, a typed name on a non-signin row, a long or odd username', { skip }, () => {
    assertHas(errors(seedIssues([seedRow({ as: 'stranger' })])), 'only a signin_* row can name a typed username');
    const signin = patch => seedRow({ event: 'signin_fail', result: 'fail', where: { kind: 'pc', id: 'recep_pc' }, ...patch });
    assert.deepEqual(errors(seedIssues([signin({ as: 'j.price' })])), []);
    assertHas(errors(seedIssues([signin({ as: 'x'.repeat(33) })])), 'neither an NPC id nor a plain username');
    assertHas(errors(seedIssues([signin({ as: 'a b<c>' })])), 'neither an NPC id nor a plain username');
    assertHas(errors(seedIssues([signin({ as: 7 })])), 'as must be an NPC id');
});

test('error: detail the event does not allow, a hidden key, a value out of range, a missing thing', { skip }, () => {
    const ok = patch => seedRow({ event: 'signin_ok', result: 'ok', where: { kind: 'pc', id: 'recep_pc' }, ...patch });
    assert.deepEqual(errors(seedIssues([ok({ detail: { method: 'password', tries: 3, host: 'recep_pc', tag: 'a1' } })])), []);
    assertHas(errors(seedIssues([ok({ detail: { colour: 'red' } })])), 'is not registered for the event');
    assertHas(errors(seedIssues([ok({ detail: { method: 'magic' } })])), 'detail.method is not one of');
    assertHas(errors(seedIssues([ok({ detail: { tries: 6 } })])), 'must be a count from 0 to 5');
    assertHas(errors(seedIssues([ok({ detail: { host: 'ghost_pc' } })])), 'names a pc that does not exist');
    assertHas(errors(seedIssues([ok({ detail: { tag: 'zzz' } })])), 'is not a server-made alias');
    assertHas(errors(seedIssues([seedRow({ detail: { flagged: 1 } })])), 'is stored-only');
    assertHas(errors(seedIssues([ok({ detail: { a: 1, b: 2, c: 3, d: 4, e: 5 } })])), 'at most 4 keys');
});

test('error: a seed row whose text equals a declared password, without quoting it', { skip }, () => {
    const s = withSeeds([seedRow({ as: 'Gate-Pass-77', event: 'signin_fail', result: 'fail', where: { kind: 'pc', id: 'recep_pc' } })]);
    const out = errors(issues(s, SEED_EVENTS));
    assertHas(out, 'holds text equal to a declared password');
    assert.ok(!out.join('\n').includes('Gate-Pass-77'));
});

// An anomaly's row (a reader's minigameData.anomaly.rowId).
const withAnomaly = (rowId, rows = two, extra = {}) => {
    const s = withSeeds(rows);
    s.rooms.lobby.objects.push({ id: 'door_reader', type: 'ops_log_terminal', name: 'Door log', minigameData: { logSource: 'door_log', anomaly: { rowId }, ...extra } });
    return s;
};

test('an anomaly naming one of two seed rows raises no error or warning', { skip }, () => {
    const out = issues(withAnomaly('s1', two, { flagActions: [{ type: 'set_global', key: 'k', value: true }] }), SEED_EVENTS);
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('error: an anomaly row id that is not a seed row of the source (a play row id, an unknown id)', { skip }, () => {
    assertHas(errors(issues(withAnomaly('a3f9c01b22'), SEED_EVENTS)), 'is not one of source "door_log"\'s seed rows');
    assertHas(errors(issues(withAnomaly('s9'), SEED_EVENTS)), 'a play row cannot be an anomaly');
});

test('error: an anomaly on a source with no seed rows, and one that is not { rowId }', { skip }, () => {
    const s = withSeeds([]); s.rooms.lobby.objects.push({ id: 'r', type: 'ops_log_terminal', name: 'x', minigameData: { logSource: 'door_log', anomaly: { rowId: 's1' } } });
    assertHas(errors(issues(s, SEED_EVENTS)), 'is not one of source');
    assertHas(errors(issues(withAnomaly('s1', two, { anomaly: 's1' }), SEED_EVENTS)), 'anomaly must be');
});

test('warning (N-1): an anomaly whose actions set no global to true', { skip }, () => {
    const out = issues(withAnomaly('s1', two, { flagActions: [{ type: 'set_global', key: 'k', value: 'x' }], completionActions: [{ type: 'complete_task', taskId: 't' }] }), SEED_EVENTS);
    assert.deepEqual(errors(out), []);
    assertHas(warnings(out), 'do not last past a reload');
});

test('warning (N-1): an anomaly with no actions at all', { skip }, () => {
    const out = issues(withAnomaly('s1'), SEED_EVENTS);
    assert.deepEqual(errors(out), []);
    assertHas(warnings(out), 'flagging does nothing');
});

test('warning: an anomaly on a source with a single seed row', { skip }, () => {
    const out = issues(withAnomaly('s1', [seedRow()]), SEED_EVENTS);
    assert.deepEqual(errors(out), []);
    assertHas(warnings(out), 'has one seed row');
});

test('warning (L3 F2): shares plus share folders over 200 could pass the log\'s once-only limit', { skip }, () => {
    const many = n => {
        const s = clean();
        s.resources = {};
        for (let i = 0; i < n; i++) s.resources[`share${i}`] = { kind: 'file_share', name: `S${i}`, contents: [{ id: `f${i}`, type: 'folder', contents: [] }] };
        return s;
    };
    const small = issues(many(100)); // 200 in all: at the limit, no warning
    assert.deepEqual(warnings(small).filter(w => w.includes('once-only')), []);
    const out = issues(many(101)); // 202
    assert.deepEqual(errors(out), []);
    assertHas(warnings(out), 'once-only limit of the log could be passed');
    assertHas(warnings(out), '202');
});
