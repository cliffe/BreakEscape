// The validator's exit code matches its output (SCENARIO_FORMAT_HARDENING_PLAN step 1).
// Every ❌ line fails the run unless the known-failures list covers it; every section prints after
// a schema or ink failure; a check that raises prints "could not run" and the run goes on; the run
// ends with "Result: <n> errors (<k> known), <m> warnings". Fixtures are written to a temp folder.
// Run with: node test/js/validator-exit-code.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
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
// validator is loaded and before main (to make one check raise). `json` may be a function of the
// fixture's folder (for a storyPath into it); `files` are written into that folder; `mission`
// patches mission.json; `graph: true` leaves out --no-graph.
function run(json, { flags = ['--skip-ink'], known = null, prelude = null, files = {}, mission = {}, graph = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-exit-'));
  try {
    const sdir = join(dir, 'test_exit_code');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    const data = typeof json === 'function' ? json(sdir) : json;
    writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data));
    for (const [name, text] of Object.entries(files)) writeFileSync(join(sdir, name), text);
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({
      display_name: 'Fixture', description: 'Fixture.', difficulty_level: 1, secgen_scenario: null, ...mission
    }));
    const args = [file, ...(graph ? [] : ['--no-graph']), '--no-lint', ...flags];
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
    return { status: r.status, out: r.stdout || '', err: r.stderr || '', left: readdirSync(sdir) };
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

// ── review R1 fixes ──────────────────────────────────────────────────────────────────────────

const notes = (text) => (j) => { j.rooms.r1.objects.push({ type: 'notes', id: 'checklist', name: 'Checklist', readable: true, text }); };
const errorCount = (out) => Number((result(out).match(/^Result: (\d+) errors/) || [])[1]);

test('a ❌ inside author content is not an error: plain, -o and -v runs agree (m1)', { skip }, () => {
  const fixture = scenario(notes('❌ door left open'));
  for (const flags of [['--skip-ink'], ['--skip-ink', '-o'], ['--skip-ink', '-v']]) {
    const r = run(fixture, { flags });
    assert.equal(r.status, 0, `${flags.join(' ')}\n${r.out}`);
    assert.match(result(r.out), /^Result: 0 errors/, flags.join(' '));
  }
  assert.match(run(fixture, { flags: ['--skip-ink', '-o'] }).out, /"text": "❌ door left open"/);
  // The -v dump prints after a schema failure: only the schema line counts, not the dumped ❌.
  const broken = scenario((j) => { notes('❌ door left open')(j); j.rooms.r1.type = 'room_nowhere'; });
  const v = run(broken, { flags: ['--skip-ink', '-v'] });
  assert.equal(v.status, 1);
  assert.match(v.out, /Full JSON structure:/);
  assert.equal(errorCount(v.out), 1, v.out);
});

// The graph generator is stubbed (the real one would also write files next to the fixture).
const stubGraph = (code) => `module Kernel
  alias_method :__orig_system, :system
  def system(*a)
    return __orig_system('ruby', '-e', 'warn "graph: boom"; exit ${code}') if a.any? { |x| x.to_s.include?('generate_dungeon_graph') }
    __orig_system(*a)
  end
end`;

test('a dungeon graph abort fails the run (m2)', { skip }, () => {
  const abort = run(scenario(), { graph: true, prelude: stubGraph(1) });
  assert.equal(abort.status, 1, abort.out + abort.err);
  assert.match(abort.out, /❌ ERROR: dungeon graph could not run \(exit 1\)/);
  assert.doesNotMatch(abort.out, /non-fatal/);
  const ok = run(scenario(), { graph: true, prelude: stubGraph(0) });
  assert.equal(ok.status, 0, ok.out + ok.err);
});

// A scenario folder under the temp dir, reached from the repository's scenarios/ folder.
const storyIn = (sdir, name) => `scenarios/${relative(join(root, 'scenarios'), join(sdir, name))}`;
const inkNpc = (name) => (sdir) => scenario((j) => { j.rooms.r1.npcs.push(npc({ storyPath: storyIn(sdir, name) })); });

test('an ink compile failure cannot be listed: with it and another ink entry listed, the run still fails (m3)', { skip }, () => {
  const files = { 'bad.ink': '=== start ===\nHello\n-> nowhere_knot\n' };
  const known = [entry({ stage: 'ink', match: 'fails to compile', count: 1 }),
    entry({ stage: 'ink', match: 'some other ink line', count: 1, approved: '2026-11-12: other' })];
  const r = run(inkNpc('bad.json'), { flags: [], known, files });
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, /fails to compile/);
  assert.doesNotMatch(r.out, /fails to compile.*\(known:/);
});

test('ink compiles through a private temp file that never stays behind (n2)', { skip }, () => {
  const files = { 'good.ink': '=== start ===\nHello there.\n-> END\n' };
  const r = run(inkNpc('good.json'), { flags: [], files });
  assert.doesNotMatch(r.out, /fails to compile|invalid JSON|output file was not created/, r.out);
  assert.ok(r.left.includes('good.json'), r.left.join(', '));
  assert.deepEqual(r.left.filter((f) => f.includes('.tmp-')), []);
  const bad = run(inkNpc('bad.json'), { flags: [], files: { 'bad.ink': 'Hello\n-> nowhere_knot\n' } });
  assert.match(bad.out, /fails to compile/);
  assert.deepEqual(bad.left.filter((f) => f.includes('.tmp-') || f === 'bad.json'), []);
});

for (const [name, prelude] of [
  ['format_schema_error', 'def format_schema_error(*); raise "boom"; end'],
  ['split_schema_errors', 'def ValidateSocial.split_schema_errors(*); raise "boom"; end']
]) {
  test(`${name} raising: the schema line still prints, and so do the checks after it (m7)`, { skip }, () => {
    const r = run(scenario((j) => { j.rooms.r1.type = 'room_nowhere'; pinMismatch(j); }), { prelude });
    assert.equal(r.status, 1, r.out + r.err);
    assert.match(r.out, /❌ ERROR: schema report could not run: RuntimeError: boom/);
    assert.match(r.out, /❌ ERROR: schema: .*room_nowhere/);
    assert.match(r.out, MUTATIONS.common[1]);
    assert.doesNotMatch(r.out, /validator could not run/);
  });
}

test('print_issue_list raising: could-not-run, and the later sections still print (m7)', { skip }, () => {
  const r = run(scenario(pinMismatch), { prelude: 'def print_issue_list_unguarded(*); raise "boom"; end' });
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, /❌ ERROR: print_issue_list could not run: RuntimeError: boom/);
  assert.match(r.out, MUTATIONS.common[1]); // the common list is printed directly, not by print_issue_list
  assert.doesNotMatch(r.out, /validator could not run/);
});

test('the --strict-social count line raising is a could-not-run line, not a crash (m7)', { skip }, () => {
  const r = run(scenario((j) => { j.social = {}; pinMismatch(j); }), {
    flags: ['--skip-ink', '--strict-social'], prelude: 'def ValidateSocial.errors(*); raise "boom"; end'
  });
  assert.equal(r.status, 1, r.out + r.err);
  assert.match(r.out, /❌ ERROR: strict-social count could not run: RuntimeError: boom/);
  assert.match(r.out, /✓ Validation complete!/);
  assert.doesNotMatch(r.out, /validator could not run/);
});

test('a bad mission.json scoring prints once and counts once (n1)', { skip }, () => {
  const r = run(scenario(), { mission: { scoring: 'bogus' } });
  assert.equal(r.status, 1, r.out + r.err);
  const lines = r.out.split('\n').filter((l) => /❌/.test(l) && /scoring/.test(l));
  assert.equal(lines.length, 1, lines.join('\n'));
  assert.equal(errorCount(r.out), 1, r.out);
});
