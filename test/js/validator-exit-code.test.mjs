// The validator's exit code matches its output (SCENARIO_FORMAT_HARDENING_PLAN step 1).
// Every ❌ line fails the run unless the known-failures list covers it; every section prints after
// a schema or ink failure; a check that raises prints "could not run" and the run goes on; the run
// ends with "Result: <n> errors (<k> known), <m> warnings". Fixtures are written to a temp folder.
// Run with: node test/js/validator-exit-code.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

const npc = (extra = {}) => ({
  id: 'dana', displayName: 'Dana', npcType: 'person', position: { x: 3, y: 3 }, spriteSheet: 'hacker', ...extra
});

function scenario(mutate = () => {}) {
  const j = {
    scenario_id: 'test_exit_code', scenario_name: 'Exit code fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [], globalVariables: {},
    rooms: { r1: { type: 'room_office', connections: {}, objects: [], npcs: [] } }
  };
  mutate(j);
  return j;
}

// Each mutation adds one class of ❌ line from one module.
const pinMismatch = (j) => { Object.assign(j.rooms.r1, { locked: true, lockType: 'pin', requires: '72958', pinLength: 4 }); };
const MUTATIONS = {
  common: [pinMismatch, /❌ ERROR: 'rooms\/r1' has pinLength 4 but its PIN is 5 digits/],
  ink: [(j) => { j.rooms.r1.npcs.push(npc({ storyPath: 'ink/dana.json' })); }, /❌ ERROR: 'rooms\/r1\/npcs\[0\]' uses deprecated relative path 'ink\/dana\.json'/],
  schema: [(j) => { j.rooms.r1.type = 'room_nowhere'; }, /❌ ERROR: schema: #\/rooms\/r1\/type \(room 'r1'\): value "room_nowhere"/],
  habits: [(j) => { j.rooms.r1.npcs.push(npc({ awareness: 'bogus' })); }, /❌ ERROR: habits: NPC 'dana' awareness 'bogus'/],
  work: [(j) => { j.rooms.r1.npcs.push(npc({ needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 60 } }, workarounds: [{ bogus: 1 }] })); },
    /❌ ERROR: work: dana\.workarounds\[0\]\.at is nil/],
  social: [(j) => { j.rooms.r1.objects.push({ type: 'notes', id: 'same', name: 'A' }, { type: 'notes', id: 'same', name: 'B' }); },
    /❌ ERROR: SOCIAL: object id 'same' is used more than once/]
};

// Runs the validator on a fixture. `known` is a known-failures list (scenario paths may use the
// placeholder SCENARIO, replaced by the fixture's absolute path); `prelude` is Ruby run after the
// validator is loaded and before main (to make one check raise).
function run(json, { flags = ['--skip-ink'], known = null, prelude = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-exit-'));
  try {
    const sdir = join(dir, 'test_exit_code');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    writeFileSync(file, typeof json === 'string' ? json : JSON.stringify(json));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({
      display_name: 'Fixture', description: 'Fixture.', difficulty_level: 1, secgen_scenario: null
    }));
    const args = [file, '--no-graph', '--no-lint', ...flags];
    if (known) {
      const kf = join(dir, 'known.json');
      writeFileSync(kf, JSON.stringify(known.map((e) => ({ ...e, scenario: e.scenario === 'SCENARIO' ? file : e.scenario }))));
      args.push('--known-failures', kf);
    } else {
      args.push('--no-known-failures');
    }
    const r = prelude
      ? spawnSync('ruby', ['-e', `require ${JSON.stringify(VALIDATOR)}\n${prelude}\nARGV.replace(${JSON.stringify(args)})\nmain`],
        { encoding: 'utf8', env, cwd: root })
      : spawnSync('ruby', [VALIDATOR, ...args], { encoding: 'utf8', env, cwd: root });
    return { status: r.status, out: r.stdout || '', err: r.stderr || '' };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const result = (out) => (out.match(/^Result: .*$/m) || [''])[0];
const entry = (extra) => ({ scenario: 'SCENARIO', owner: 'labs track', added: '2026-11-12', reviewBy: '2026-12-10',
  approved: '2026-11-12: fixture', ...extra });

test('a fixture with only warnings exits 0 and says so in the Result line', { skip }, () => {
  const r = run(scenario());
  assert.equal(r.status, 0, r.out + r.err);
  assert.match(result(r.out), /^Result: 0 errors \(0 known\), \d+ warnings$/);
});

for (const [module, [mutate, line]] of Object.entries(MUTATIONS)) {
  test(`one ❌ line from the ${module} module exits 1`, { skip }, () => {
    const r = run(scenario(mutate), { flags: module === 'ink' ? [] : ['--skip-ink'] });
    assert.equal(r.status, 1, r.out + r.err);
    assert.match(r.out, line);
    assert.match(result(r.out), /^Result: [1-9]\d* errors \(0 known\)/);
  });
}

test('no line carries an old label (INVALID, ❌ SOCIAL)', { skip }, () => {
  const r = run(scenario((j) => Object.values(MUTATIONS).forEach(([m]) => m(j))), { flags: [] });
  assert.equal(r.status, 1);
  assert.doesNotMatch(r.out, /INVALID|❌ SOCIAL/);
  for (const l of r.out.split('\n').filter((x) => x.includes('❌'))) assert.match(l, /❌ ERROR: /, l);
});

test('a schema failure and a common issue both print, then the summary; exit 1', { skip }, () => {
  const r = run(scenario((j) => { MUTATIONS.schema[0](j); pinMismatch(j); }));
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, MUTATIONS.schema[1]);
  assert.match(r.out, MUTATIONS.common[1]);
  assert.match(r.out, /✓ Validation complete!/);
  assert.match(result(r.out), /^Result: 2 errors \(0 known\)/);
});

test('an ink-check failure and a common issue both print', { skip }, () => {
  const r = run(scenario((j) => { MUTATIONS.ink[0](j); pinMismatch(j); }), { flags: [] });
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, MUTATIONS.ink[1]);
  assert.match(r.out, MUTATIONS.common[1]);
});

test('rooms as a string: the schema error, a could-not-run line per check that raised, the summary, no stack trace', { skip }, () => {
  const r = run(scenario((j) => { j.rooms = 'lobby'; }));
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, /❌ ERROR: schema: #\/rooms: of type string did not match the following type: object/);
  assert.match(r.out, /❌ ERROR: \S+ could not run: /);
  assert.match(result(r.out), /^Result: [1-9]\d* errors/);
  assert.doesNotMatch(r.out + r.err, /\.rb:\d+:in /);
});

test('a check that raises prints could-not-run and the checks after it still report', { skip }, () => {
  const r = run(scenario(pinMismatch), { prelude: 'def check_lock_credentials(*); raise "boom"; end' });
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, /❌ ERROR: check_lock_credentials could not run: RuntimeError: boom/);
  assert.match(r.out, MUTATIONS.common[1]); // check_pin_locks runs after it in the same stage
  assert.match(result(r.out), /^Result: 2 errors \(0 known\)/);
});

test('a could-not-run line is never matched, even by a list entry aimed at it', { skip }, () => {
  const known = [entry({ stage: 'common', match: 'could not run', count: 1 })];
  const r = run(scenario(), { known, prelude: 'def check_lock_credentials(*); raise "boom"; end' });
  assert.equal(r.status, 1, r.out + r.err);
  assert.doesNotMatch(r.out, /could not run.*\(known:/);
});

test('the false-positive shapes pass: EHR medication warning strings and the log filter fields', { skip }, () => {
  const r = run(scenario((j) => {
    j.rooms.r1.objects.push({
      type: 'pc', id: 'ehr', name: 'EHR', minigameData: { patients: [{ medications: [{ name: 'X', interactionWarning: 'Check allergy' }] }] }
    }, {
      type: 'log_filter_terminal', id: 'logs', name: 'Logs',
      minigameData: { logEntries: [], nextTabPrompt: 'Next', nextTabButton: 'Go', completeBanner: 'Done' }
    });
  }));
  assert.doesNotMatch(r.out, /interactionWarning' must be an object/);
  assert.doesNotMatch(r.out, /undeclared field '(nextTabPrompt|nextTabButton|completeBanner)'/);
});

test('a listed failure exits 0 and prints its owner; the Result line counts it as known', { skip }, () => {
  const known = [entry({ stage: 'common', match: 'has pinLength 4', count: 1 })];
  const r = run(scenario(pinMismatch), { known });
  assert.equal(r.status, 0, r.out + r.err);
  assert.match(r.out, /has pinLength 4 .*\(known: labs track, since 2026-11-12\)/);
  assert.match(result(r.out), /^Result: 1 errors \(1 known\)/);
});

test('an entry in another stage or for another scenario does not match', { skip }, () => {
  const r1 = run(scenario(pinMismatch), { known: [entry({ stage: 'ink', match: 'has pinLength 4', count: 1 })] });
  assert.equal(r1.status, 1, r1.out);
  const r2 = run(scenario(pinMismatch), { known: [entry({ scenario: 'scenarios/m01_first_contact/scenario.json.erb', stage: 'common', match: 'has pinLength 4', count: 1 })] });
  assert.equal(r2.status, 1, r2.out);
});

test('a stale entry (the line is gone) and a count above the lines each exit 1', { skip }, () => {
  const gone = run(scenario(), { known: [entry({ stage: 'common', match: 'has pinLength 4', count: 1 })] });
  assert.equal(gone.status, 1, gone.out);
  assert.match(gone.out, /❌ ERROR: stale known failure: .* common 'has pinLength 4' now matches 0 of 1; update or remove it/);
  const over = run(scenario(pinMismatch), { known: [entry({ stage: 'common', match: 'has pinLength 4', count: 2 })] });
  assert.equal(over.status, 1, over.out);
  assert.match(over.out, /now matches 1 of 2/);
});

test('an extra unlisted line exits 1', { skip }, () => {
  const two = scenario((j) => {
    pinMismatch(j);
    j.rooms.r1.objects.push({ type: 'safe', id: 's', name: 'Safe', locked: true, lockType: 'pin', requires: '12345', pinLength: 4 });
  });
  const r = run(two, { known: [entry({ stage: 'common', match: 'has pinLength 4', count: 1 })] });
  assert.equal(r.status, 1, r.out);
  assert.match(result(r.out), /^Result: 2 errors \(1 known\)/);
});

test('a listed ink line under --skip-ink exits 0 and prints the not-checked note; with ink on and the line fixed it is stale', { skip }, () => {
  const known = [entry({ stage: 'ink', match: 'uses deprecated relative path', count: 1 })];
  const skipped = run(scenario(), { known, flags: ['--skip-ink'] });
  assert.equal(skipped.status, 0, skipped.out);
  assert.match(result(skipped.out), /; 1 known failure\(s\) not checked \(ink skipped\)$/);
  const listed = run(scenario(MUTATIONS.ink[0]), { known, flags: [] });
  assert.equal(listed.status, 0, listed.out);
  const fixed = run(scenario(), { known, flags: [] });
  assert.equal(fixed.status, 1, fixed.out);
  assert.match(fixed.out, /stale known failure: .* ink /);
});

test('--strict-social is still accepted and changes nothing', { skip }, () => {
  const plain = run(scenario(MUTATIONS.social[0]));
  const strict = run(scenario(MUTATIONS.social[0]), { flags: ['--skip-ink', '--strict-social'] });
  assert.equal(plain.status, 1);
  assert.equal(strict.status, 1);
  const clean = run(scenario(), { flags: ['--skip-ink', '--strict-social'] });
  assert.equal(clean.status, 0, clean.out);
});

test('a broken known-failures file is an error, never a silent pass', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'validator-exit-kf-'));
  try {
    const kf = join(dir, 'known.json');
    writeFileSync(kf, '{ not json');
    const sdir = join(dir, 'test_exit_code');
    mkdirSync(sdir);
    writeFileSync(join(sdir, 'scenario.json.erb'), JSON.stringify(scenario()));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({ display_name: 'F', description: 'F.', difficulty_level: 1, secgen_scenario: null }));
    const r = spawnSync('ruby', [VALIDATOR, join(sdir, 'scenario.json.erb'), '--no-graph', '--skip-ink', '--known-failures', kf],
      { encoding: 'utf8', env, cwd: root });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /❌ ERROR: known-failures list could not run/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
