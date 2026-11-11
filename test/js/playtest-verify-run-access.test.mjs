// tools/playtest/verify-run.rb's access model section and its --access flag (access model
// plan, step 6), with BreakEscape::Game stubbed (test/js/fixtures/verify-run-stub.rb) so no
// Rails or database is needed.
// Run with: bin/test-js test/js/playtest-verify-run-access.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

function verify(args, playerState = {}, env = {}) {
  const r = spawnSync('ruby', ['-r', join(here, 'fixtures', 'verify-run-stub.rb'), join(root, 'tools/playtest/verify-run.rb'), ...args],
    { env: { ...process.env, STUB_FLAGS: '', STUB_PLAYER_STATE: JSON.stringify(playerState), ...env }, encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr };
}

const ACCESS_STATE = {
  sessions: { jake_pc: { id: 'jake', via: 'password' }, it_pc: { id: 'dana', via: 'claim' } },
  signedInPcs: ['jake_pc', 'it_pc'],
  serverClones: {
    '4F00A1C2': { source: { npc: 'jake' }, uidOnly: false },
    'EXEC-DF-01': { source: { object: 'exec_badge' }, uidOnly: true }
  },
  copiedItems: ['jake_payroll'],
  loginFailures: { 'jake_pc|nobody': { n: 1, seq: 2 }, 'jake_pc|jbrooks': { n: 3, seq: 1 } },
  loginLockouts: ['jake_pc|ghost']
};

// Networks (ACCESS_MODEL_SLICE_9_3_PLAN.md, step 6): a remote session through a held foothold.
const NETWORK_STATE = {
  ...ACCESS_STATE,
  sessions: { ...ACCESS_STATE.sessions, lena_pc: { id: 'lena', via: 'password', foothold: 'jack_comms_port' } },
  footholds: {
    jack_lobby_port: { via: 'jack', network: 'office_lan', source: 'lobby_port', device: { id: 'kit_b' }, seq: 2 },
    jack_comms_port: { via: 'jack', network: 'office_lan', source: 'comms_port', device: { id: 'kit_dropbox', type: 'pc' }, seq: 1 }
  },
  gainedFootholds: ['comms_port', 'lobby_port', 'store_port']
};

test('--access prints only the access section, one line per key, and exits 0', () => {
  const r = verify(['1', '--access'], ACCESS_STATE);
  assert.equal(r.status, 0, r.out);
  const lines = r.out.trim().split('\n');
  assert.match(lines[0], /^game\s+1\s+\(mission stub\)/);
  assert.equal(lines[1], 'access model');
  assert.equal(lines.length, 13, r.out);   // npcFrustration: slice 9.2; guestSessions, sharedLogins: 9.2 H
  assert.match(r.out, /sessions\s+2: jake_pc = jake \(password\); it_pc = dana \(claim\)/);
  assert.match(r.out, /signedInPcs\s+2: jake_pc; it_pc/);
  assert.match(r.out, /serverClones\s+2: 4F00A1C2 from npc jake; EXEC-DF-01 from object exec_badge \(UID-only\)/);
  assert.match(r.out, /copiedItems\s+1: jake_payroll/);
  assert.match(r.out, /loginFailures\s+2: jake_pc\|jbrooks 3; jake_pc\|nobody 1/, 'counts per key, oldest seq first');
  assert.match(r.out, /loginLockouts\s+1: jake_pc\|ghost/);
  assert.doesNotMatch(r.out, /VERDICT|unlocked rooms|inventory/, 'nothing but the access section');
  assert.match(r.out, /footholds\s+0\n/);
  assert.match(r.out, /gainedFootholds\s+0\n/);
  assert.match(r.out, /npcFrustration\s+0/);
  assert.match(r.out, /guestSessions\s+0\n/);
  assert.match(r.out, /sharedLogins\s+0\n/);
});

test('--access prints the PCs a check recorded an NPC locked out at (slice 9.2 L)', () => {
  const r = verify(['1', '--access'], { ...ACCESS_STATE, npcFrustration: { jake: { level: 60, handed: { 0: {} }, done: [], lockedOut: ['jake_pc'] }, dana: { level: 20 } } });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /npcFrustration\s+2: dana level 20, handed 0, done \[\]; jake level 60, handed 1, done \[\], locked out at jake_pc/);
});

test('--access prints footholds, gainedFootholds, and remote and foothold beside a session', () => {
  const r = verify(['1', '--access'], NETWORK_STATE);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /sessions\s+3: jake_pc = jake \(password\); it_pc = dana \(claim\); lena_pc = lena \(password, remote, foothold jack_comms_port\)/);
  assert.match(r.out, /footholds\s+2: jack_comms_port = jack comms_port, device kit_dropbox \(network office_lan\); jack_lobby_port = jack lobby_port, device kit_b \(network office_lan\)/,
    'oldest seq first');
  assert.match(r.out, /gainedFootholds\s+3: comms_port; lobby_port; store_port/);
});

test('the full report shows the access section when only a foothold is recorded', () => {
  const r = verify(['1'], { gainedFootholds: ['comms_port'] });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /access model\n/);
  assert.match(r.out, /gainedFootholds\s+1: comms_port/);
});

test('--access works before or after the game id, and on a game with no access keys', () => {
  const r = verify(['--access', '1']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /sessions\s+0\n/);
  assert.match(r.out, /loginLockouts\s+0\n/);
});

test('the full report carries the access section when anything is recorded', () => {
  const r = verify(['1'], ACCESS_STATE);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /unlocked rooms/);
  assert.match(r.out, /access model\n\s+sessions\s+2:/);
  assert.match(r.out, /VERDICT: progress recorded/);
});

test('the full report says so in one line when nothing is recorded', () => {
  const r = verify(['1'], { sessions: {}, signedInPcs: [], serverClones: {}, copiedItems: [], loginFailures: {}, loginLockouts: [] });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /access model\s+nothing recorded/);
  assert.doesNotMatch(r.out, /signedInPcs/);
});

// Slice 9.1 step 6: the habits block, values only, from the saved scenario.
const HABITS_SCENARIO = {
  rooms: {
    office: {
      objects: [
        { id: 'dana_pc', type: 'pc', lockType: 'login' },
        { id: 'priya_pc', type: 'pc', lockType: 'login', lockChance: 1 },
        { id: 'omar_pc', type: 'pc', lockType: 'login' },
        { id: 'plain', type: 'notes' }
      ],
      npcs: [
        { id: 'dana', needsHome: 'dana_pc', habits: { locksScreen: 'never' }, screenHabit: { lockChance: 0 },
          creds: { username: 'dreyes', password: 'Dana-Secret-PW' } },
        { id: 'priya', needsHome: 'priya_pc', habits: { locksScreen: 'never' }, screenHabit: { lockChance: 0 } },
        { id: 'omar', needsHome: 'omar_pc', habits: { locksScreen: 'always', writesDown: true }, screenHabit: { lockChance: 1 } }
      ]
    }
  }
};

test('--access prints the habits block of values for a game with expanded habits', () => {
  const r = verify(['1', '--access'], ACCESS_STATE, { STUB_SCENARIO: JSON.stringify(HABITS_SCENARIO), STUB_POSTIT: 'omar_pc' });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /\nhabits\n/);
  assert.match(r.out, /npc dana\s+locksScreen=never\s+screenHabit \{"lockChance":0\}/);
  assert.match(r.out, /npc omar\s+locksScreen=always writesDown=true\s+screenHabit \{"lockChance":1\}/);
  assert.match(r.out, /pc\s+dana_pc\s+owner dana\s+no lock field\s+alwaysLocks false\s+hasPostit false/);
  assert.match(r.out, /pc\s+priya_pc\s+owner priya\s+lockChance 1\s+alwaysLocks true\s+hasPostit false/);
  assert.match(r.out, /pc\s+omar_pc\s+owner omar\s+no lock field\s+alwaysLocks true\s+hasPostit true/);
  assert.doesNotMatch(r.out, /plain/);
  assert.doesNotMatch(r.out, /Dana-Secret-PW|dreyes/, 'no sign-in details');
});

test('the habits block is absent for a game without habits', () => {
  const r = verify(['1', '--access'], ACCESS_STATE, { STUB_SCENARIO: JSON.stringify({ rooms: { office: { objects: [{ id: 'pc', lockType: 'login' }], npcs: [{ id: 'a', needsHome: 'pc' }] } } }) });
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /\nhabits\n/);
});

// Slice 9.1 step 5: one line per gate with a noHold, values only.
test('--access prints a line per gate with a noHold, and none for a gate without', () => {
  const sc = structuredClone(HABITS_SCENARIO);
  sc.rooms.office.npcs.push({ id: 'sara', habits: { locksScreen: 'always', holdsDoors: false } },
    { id: 'gary', habits: { locksScreen: 'never', holdsDoors: true } });
  sc.rooms.office.doors = [
    { connectedRoom: 'store_a', direction: 'north', gate: { openFor: ['gary'] } },
    { connectedRoom: 'store_b', direction: 'south', gate: { openFor: ['sara', 'gary'], noHold: ['sara'] } }
  ];
  const r = verify(['1', '--access'], ACCESS_STATE, { STUB_SCENARIO: JSON.stringify(sc) });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /npc sara\s+locksScreen=always holdsDoors=false/);
  assert.match(r.out, /gate rooms\/office\/doors\/1 \(into store_b\)\s+openFor sara,gary\s+noHold sara/);
  assert.doesNotMatch(r.out, /gate rooms\/office\/doors\/0/);
});

test('a gate with an authored noHold prints its line even when no NPC has a habits object', () => {
  const sc = { rooms: { office: { objects: [], npcs: [{ id: 'sara' }],
    doors: [{ connectedRoom: 'store_b', direction: 'south', gate: { openFor: 'sara', noHold: ['sara'] } }] } } };
  const r = verify(['1', '--access'], ACCESS_STATE, { STUB_SCENARIO: JSON.stringify(sc) });
  assert.match(r.out, /\nhabits\n\s+gate rooms\/office\/doors\/0 \(into store_b\)\s+openFor sara\s+noHold sara/);
});

// Review R2 nit 1: an authored empty noHold (the author's opt-out) says so.
test('an authored empty noHold prints "(none, authored)"', () => {
  const sc = { rooms: { office: { objects: [], npcs: [{ id: 'sara' }],
    doors: [{ connectedRoom: 'store_b', direction: 'south', gate: { openFor: 'sara', noHold: [] } }] } } };
  const r = verify(['1', '--access'], ACCESS_STATE, { STUB_SCENARIO: JSON.stringify(sc) });
  assert.match(r.out, /gate rooms\/office\/doors\/0 \(into store_b\)\s+openFor sara\s+noHold \(none, authored\)/);
});

// Slice 9.2 B: with --log, the workaround events found in the session log's drained event logs.
test('--access --log lists the workaround phases, start lines by topic and propped doors from drains', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'vr-'));
  const log = join(dir, 'session.jsonl');
  const ev = (event, data) => ({ seq: 1, t: 1, kind: 'event', event, data });
  const rows = [
    { seq: 1, dir: 'in', cmd: { cmd: 'drain' } },
    { seq: 2, dir: 'out', ok: true, result: { log: [
      ev('npc_mutter:tom', { npcId: 'tom', topic: 'wk_prop_door', line: 'Right, that does it.', picture: null }),
      ev('npc_workaround:tom', { npcId: 'tom', index: 0, do: 'prop_door', phase: 'started' }),
      ev('npc_moved:tom', {}),
      { kind: 'action', action: 'walk' }
    ] } },
    'not json',
    { seq: 3, dir: 'out', ok: true, result: { log: [
      ev('npc_workaround:tom', { npcId: 'tom', index: 0, do: 'prop_door', phase: 'done' }),
      ev('door_propped:store_room', { roomId: 'store_room', npcId: 'tom' }),
      ev('npc_mutter:mei', { npcId: 'mei', topic: 'fail_work', line: null, picture: 'work' })
    ] } }
  ];
  writeFileSync(log, rows.map(r => (typeof r === 'string' ? r : JSON.stringify(r))).join('\n') + '\n');
  const r = verify(['1', '--access', '--log', log]);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /workaround events in the log\n\s+tom\s+said wk_prop_door, prop_door\[0\] started, prop_door\[0\] done\n\s+mei\s+said fail_work \(picture\)\n\s+door_propped\s+store_room by tom/);
  assert.doesNotMatch(r.out, /that does it/, 'topics only, never the line');
});

test('--access --log on a log with no workaround events says none', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const log = join(mkdtempSync(join(tmpdir(), 'vr-')), 's.jsonl');
  writeFileSync(log, JSON.stringify({ seq: 1, dir: 'out', ok: true }) + '\n');
  const r = verify(['1', '--access', '--log', log]);
  assert.match(r.out, /workaround events in the log\n\s+none/);
});
