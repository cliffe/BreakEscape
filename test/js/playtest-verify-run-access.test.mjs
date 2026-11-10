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

function verify(args, playerState = {}) {
  const r = spawnSync('ruby', ['-r', join(here, 'fixtures', 'verify-run-stub.rb'), join(root, 'tools/playtest/verify-run.rb'), ...args],
    { env: { ...process.env, STUB_FLAGS: '', STUB_PLAYER_STATE: JSON.stringify(playerState) }, encoding: 'utf8' });
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
  assert.equal(lines.length, 10, r.out);
  assert.match(r.out, /sessions\s+2: jake_pc = jake \(password\); it_pc = dana \(claim\)/);
  assert.match(r.out, /signedInPcs\s+2: jake_pc; it_pc/);
  assert.match(r.out, /serverClones\s+2: 4F00A1C2 from npc jake; EXEC-DF-01 from object exec_badge \(UID-only\)/);
  assert.match(r.out, /copiedItems\s+1: jake_payroll/);
  assert.match(r.out, /loginFailures\s+2: jake_pc\|jbrooks 3; jake_pc\|nobody 1/, 'counts per key, oldest seq first');
  assert.match(r.out, /loginLockouts\s+1: jake_pc\|ghost/);
  assert.doesNotMatch(r.out, /VERDICT|unlocked rooms|inventory/, 'nothing but the access section');
  assert.match(r.out, /footholds\s+0\n/);
  assert.match(r.out, /gainedFootholds\s+0\n/);
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
