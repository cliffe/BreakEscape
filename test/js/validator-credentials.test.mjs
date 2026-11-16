// Credential keyring K1 (CREDENTIAL_KEYRING_PLAN.md, section 6.3/6.4): the standing regression
// harness for check_credentials in scripts/validate_scenario.rb. One fixture per error and warning
// (and the one info line), run through the real Ruby validator. The Ruby side is also checked by
// hand; this file pins each finding so a later edit cannot drop one silently.
// Run with: node test/js/validator-credentials.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function issues(scenario) {
  const script = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
puts JSON.generate(check_credentials(JSON.parse(STDIN.read)))`;
  const r = spawnSync('ruby', ['-e', script], {
    input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 << 20
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = (l) => l.filter((s) => s.startsWith('❌'));
const warnings = (l) => l.filter((s) => s.startsWith('⚠️'));
const infos = (l) => l.filter((s) => s.startsWith('ℹ️'));
const has = (l, frag) => l.some((s) => s.includes(frag));
const assertErr = (l, frag) => assert.ok(has(errors(l), frag), `expected error "${frag}" in:\n${l.join('\n')}`);
const assertWarn = (l, frag) => assert.ok(has(warnings(l), frag), `expected warning "${frag}" in:\n${l.join('\n')}`);
const assertInfo = (l, frag) => assert.ok(has(infos(l), frag), `expected info "${frag}" in:\n${l.join('\n')}`);

// Reusable building blocks: one account holder, one sign-in PC that admits it, one foothold source.
const ACC = { id: 'lena', displayName: 'Lena Fox', creds: { username: 'lfox', password: 'Ledger-Lena-9' } };
const PC = () => ({ id: 'lena_pc', type: 'pc', lockType: 'login', name: 'Lena PC', access: { people: ['lena'] } });
const JACK = { id: 'jack1', type: 'network_jack', networkJack: true };

// A scenario with the given registry and overrides. Objects and NPCs default to the valid pair.
function sc(credentials, { npcs = [ACC], objects = [PC()], top = {} } = {}) {
  return { rooms: { office: { npcs, objects } }, credentials, ...top };
}
const grant = (item) => ({ timers: [{ id: 't', actions: [{ type: 'give_item', item }] }] });

const PW_OK = { kind: 'password', account: 'lena', proof: { session: 'lena_pc' }, foundIn: 'note1' };

// ── baseline ─────────────────────────────────────────────────────────────────────────────────────

test('a well-formed password credential raises nothing', { skip }, () => {
  const l = issues(sc({ lena_pw: PW_OK }));
  assert.deepEqual(errors(l), []);
  assert.deepEqual(warnings(l), []);
});

// ── errors ───────────────────────────────────────────────────────────────────────────────────────

test('E: more than 64 entries', { skip }, () => {
  const reg = {};
  for (let i = 0; i < 65; i++) reg[`cred${i}`] = PW_OK;
  assertErr(issues(sc(reg)), 'more than 64 entries');
});

test('E: credential id outside the pattern', { skip }, () => {
  assertErr(issues(sc({ Bad_Id: PW_OK })), "credential id 'Bad_Id' is outside the pattern");
});

test('E: unknown kind', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'wat', account: 'lena', proof: { session: 'lena_pc' } } })),
    "has an unknown kind 'wat'");
});

test('E: a kind that is not built yet (token)', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'token', account: 'lena', connectsTo: 'lena_pc', proof: { foothold: 'jack_jack1' } }, _j: PW_OK },
    { objects: [PC(), JACK] })), "kind 'token' is not supported until K5");
});

test('E: account is not an account holder', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'password', account: 'ghost', proof: { session: 'lena_pc' }, foundIn: 'n' } })),
    "account 'ghost' is not an account holder");
});

test('E: a password must not set connectsTo', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'password', account: 'lena', connectsTo: 'lena_pc', proof: { session: 'lena_pc' }, foundIn: 'n' } })),
    'is a password and must not set connectsTo');
});

test('E: a connecting kind must set connectsTo', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', proof: { held: 'x' } } })),
    'is a connecting kind and must set connectsTo');
});

test('E: connectsTo is not a sign-in PC', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'nope', proof: { held: 'x' } } })),
    "connectsTo 'nope' is not a sign-in PC");
});

test('E: an assist_invite connectsTo a headless PC', { skip }, () => {
  const l = issues(sc({ c1: { kind: 'assist_invite', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'x' } } },
    { objects: [{ ...PC(), headless: true }] }));
  assertErr(l, "connectsTo 'lena_pc' is headless");
});

test('E: a password must set foundIn', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'password', account: 'lena', proof: { session: 'lena_pc' } } })),
    'is a password and must set foundIn');
});

test('E: foundIn only on a password', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'x' }, foundIn: 'n' } })),
    'sets foundIn, which is only allowed on a password');
});

test('E: endsOnGlobal only on an assist_invite', { skip }, () => {
  assertErr(issues(sc({ c1: { ...PW_OK, endsOnGlobal: 'g' } })),
    'sets endsOnGlobal, which is only allowed on an assist_invite');
});

test('E: endsOnGlobal names no declared globalVariable', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'assist_invite', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'inv' }, endsOnGlobal: 'ghost' } })),
    "endsOnGlobal 'ghost' names no declared globalVariable");
});

test('E: proof must name exactly one kind', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'password', account: 'lena', foundIn: 'n', proof: {} } })),
    'proof must name exactly one of');
});

test('E: a session proof names no sign-in PC', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'password', account: 'lena', foundIn: 'n', proof: { session: 'ghost' } } })),
    "proof session 'ghost' is not a sign-in PC");
});

test('E: a held proof names no item in the held scope', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'ghost' } } })),
    "proof held 'ghost' names no item in the held scope");
});

test('E: a held item can never hold', { skip }, () => {
  const item = { id: 'locked_file', type: 'text_file', name: 'conn.rdp', credential: 'c1' };
  const l = issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'locked_file' } } },
    { objects: [{ ...PC(), contents: [item] }, JACK] }));
  assertErr(l, "proof held 'locked_file' can never hold");
});

test('E: a held item of a notes-family type', { skip }, () => {
  const item = { id: 'noteitem', type: 'notes', name: 'note', takeable: true };
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'noteitem' } } },
    { objects: [PC(), item, JACK] })), "is a notes-family type ('notes')");
});

test('E: a held item of an always-allowed type', { skip }, () => {
  const item = { id: 'paditem', type: 'notepad', name: 'pad', takeable: true };
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'paditem' } } },
    { objects: [PC(), item, JACK] })), "is an always-allowed type ('notepad')");
});

test('E: a foothold proof names no foothold', { skip }, () => {
  assertErr(issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { foothold: 'ghost' } } })),
    "proof foothold 'ghost' names no foothold");
});

test('a foothold proof naming an implant-created foothold is accepted (R1 m4)', { skip }, () => {
  // A grant_foothold action on lena_pc grants the runtime foothold "implant_lena_pc" through
  // POST /network/implant; a proof naming it must not draw the "names no foothold" error.
  const l = issues(sc(
    { c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { foothold: 'implant_lena_pc' } } },
    { top: { timers: [{ id: 't', actions: [{ type: 'grant_foothold', pc: 'lena_pc' }] }] } }
  ));
  assert.ok(!has(errors(l), 'names no foothold'), `unexpected foothold error in:\n${l.join('\n')}`);
});

test('W: a foothold proof naming a bare source id warns (never fires live) (R2 m1)', { skip }, () => {
  // The jack's source id is 'jack1'; the runtime keys the foothold by 'jack_jack1', so a proof
  // naming the bare id can never fire. It must warn, not pass and not error.
  const l = issues(sc(
    { c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { foothold: 'jack1' } } },
    { objects: [PC(), JACK] }
  ));
  assertWarn(l, "proof foothold 'jack1' names a bare source id");
  assert.ok(!has(errors(l), 'names no foothold'), `unexpected foothold error in:\n${l.join('\n')}`);
});

test('E: a policy accepts an unknown kind', { skip }, () => {
  const l = issues(sc({ c1: PW_OK }, { objects: [{ ...PC(), policy: 'p1' }], top: { policies: { p1: { accepts: ['wat', 'password'] } } } }));
  assertErr(l, "policy 'p1' accepts an unknown kind 'wat'");
});

test('E: an item names a credential that is not a registry id', { skip }, () => {
  const item = { id: 'f', type: 'text_file', name: 'x', credential: 'ghost' };
  assertErr(issues(sc({}, { objects: [PC(), item] })), "names credential 'ghost', which is not a registry id");
});

test('E: an item carries a credential but is a notes-family type', { skip }, () => {
  const item = { id: 'f', type: 'notes', name: 'x', credential: 'c1' };
  assertErr(issues(sc({ c1: PW_OK }, { objects: [PC(), item] })),
    "carries a credential but is a notes-family type ('notes')");
});

test('E: an item carries a credential but is an always-allowed type', { skip }, () => {
  const item = { id: 'f', type: 'notepad', name: 'x', credential: 'c1' };
  assertErr(issues(sc({ c1: PW_OK }, { objects: [PC(), item] })),
    "carries a credential but is an always-allowed type ('notepad')");
});

// ── warnings ─────────────────────────────────────────────────────────────────────────────────────

test('W: a policy accepts a list without password', { skip }, () => {
  const l = issues(sc({ c1: PW_OK }, { objects: [{ ...PC(), policy: 'p1' }], top: { policies: { p1: { accepts: ['saved_connection'] } } } }));
  assertWarn(l, "policy 'p1' accepts a list without 'password'");
});

test('W: a policy sets accepts but no PC uses it', { skip }, () => {
  const l = issues(sc({ c1: PW_OK }, { top: { policies: { p1: { accepts: ['password'] } } } }));
  assertWarn(l, "policy 'p1' sets 'accepts' but no PC uses it");
});

test('W: an unlock_object task targets an assist_invite connectsTo', { skip }, () => {
  const l = issues(sc({ c1: { kind: 'assist_invite', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'inv' } } },
    { top: { objectives: [{ id: 'o', tasks: [{ type: 'unlock_object', targetObject: 'lena_pc' }] }] } }));
  assertWarn(l, "an unlock_object task targets 'lena_pc', an assist_invite's connectsTo");
});

test('W: a session proof on an invite\'s own connectsTo', { skip }, () => {
  const l = issues(sc({ c1: { kind: 'assist_invite', account: 'lena', connectsTo: 'lena_pc', proof: { session: 'lena_pc' } } }));
  assertWarn(l, "proof is a session on the invite's own connectsTo");
});

test('W: a held item does not carry the credential id', { skip }, () => {
  const item = { id: 'itemA', type: 'text_file', name: 'conn.rdp', takeable: true };
  const l = issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'itemA' } } },
    { objects: [PC(), item, JACK] }));
  assertWarn(l, 'does not carry credential');
});

test('W: an assist_invite code is a declared grant', { skip }, () => {
  const item = { id: 'inv_code', type: 'text_file', name: 'Invite', credential: 'c1' };
  const l = issues(sc({ c1: { kind: 'assist_invite', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'inv_code' } } },
    { top: grant(item) }));
  assertWarn(l, 'is an assist_invite whose code is a declared grant');
});

test('W: a saved_connection placed only by a declared grant', { skip }, () => {
  const item = { id: 'conn_file', type: 'text_file', name: 'conn.rdp', credential: 'c1' };
  const l = issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'conn_file' } } },
    { objects: [PC(), JACK], top: grant(item) }));
  assertWarn(l, 'is a saved_connection placed only by a declared grant');
});

test('W: a connectsTo whose access list does not admit the account', { skip }, () => {
  const item = { id: 'conn_file', type: 'text_file', name: 'conn.rdp', credential: 'c1', takeable: true };
  const l = issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'conn_file' } } },
    { objects: [{ ...PC(), access: { people: ['bob'] } }, item, JACK] }));
  assertWarn(l, "access list does not admit account 'lena'");
});

test('W: a credential accepted by no machine', { skip }, () => {
  const l = issues(sc({ c1: { kind: 'password', account: 'lena', proof: { session: 'lena_pc' }, foundIn: 'n' } },
    { objects: [{ ...PC(), access: { people: ['bob'] } }] }));
  assertWarn(l, 'is accepted by no machine');
});

test('W: a saved_connection no foothold can reach', { skip }, () => {
  const item = { id: 'conn_file', type: 'text_file', name: 'conn.rdp', credential: 'c1', takeable: true };
  const l = issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'conn_file' } } },
    { objects: [PC(), item] }));
  assertWarn(l, 'no foothold or access point can reach its connectsTo');
});

test('W: an item carries a credential whose proof is not held on it', { skip }, () => {
  const item = { id: 'f', type: 'text_file', name: 'x', credential: 'c1' };
  const l = issues(sc({ c1: PW_OK }, { objects: [PC(), item] }));
  assertWarn(l, "that entry's proof is not held on this item");
});

// ── info ─────────────────────────────────────────────────────────────────────────────────────────

test('I: a saved_connection PC whose policy sets maxAttempts', { skip }, () => {
  const item = { id: 'conn_file', type: 'text_file', name: 'conn.rdp', credential: 'c1', takeable: true };
  const l = issues(sc({ c1: { kind: 'saved_connection', account: 'lena', connectsTo: 'lena_pc', proof: { held: 'conn_file' } } },
    { objects: [{ ...PC(), policy: 'p1' }, item, JACK], top: { policies: { p1: { maxAttempts: 3, accepts: ['saved_connection', 'password'] } } } }));
  assertInfo(l, 'whose policy sets maxAttempts');
});
