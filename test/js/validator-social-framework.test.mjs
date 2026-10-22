// scripts/validate_social.rb: the social lint framework (IMPLEMENTATION_PLAN 0.7, P0-J).
// Fixtures under test/js/fixtures/social_framework/scenarios. The lints are called
// in-process (never the bare CLI, which rewrites graphs and compiled ink); the
// --strict-social exit codes use --no-graph --skip-ink --no-lint, which write nothing.
// Run with: bundle exec node --test test/js/validator-social-framework.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/social_framework/scenarios');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

// Under CI a missing Ruby is a failure, not a skip (00 S11)
if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

// Every file under the fixture folder, path and content, so the last test can show
// that no run (the CLI ones included) wrote or changed anything there
function folderHash(base) {
  const h = createHash('sha256');
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { h.update(relative(base, p)); h.update('\0'); h.update(readFileSync(p)); h.update('\0'); }
    }
  };
  walk(base);
  return h.digest('hex');
}
const fixturesBefore = folderHash(fx);

// types: asset stems that "exist" for the sprite lint (null skips the lint)
function lint(scenario, types = []) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j, = render_erb_to_json(${JSON.stringify(join(fx, scenario, 'scenario.json.erb'))}, {}, include_rendered: true)
    imports = prepare_carry_over_globals(j)
    types = ${types === null ? 'nil' : `Set.new(${JSON.stringify(types)})`}
    puts JSON.generate(ValidateSocial.check(j, repo_root: ${JSON.stringify(root)}, valid_item_types: types, imports: imports))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function cli(scenario, ...flags) {
  const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'),
    join(fx, scenario, 'scenario.json.erb'), '--no-graph', '--skip-ink', '--no-lint', ...flags],
  { encoding: 'utf8', env, cwd: root });
  return r;
}

const SPRITES = ['notes', 'mail_terminal', 'kiosk'];

test('a clean social scenario raises nothing', { skip }, () => {
  assert.deepEqual(lint('sf_clean', SPRITES), []);
});

test('the broken character: each data lint fires', { skip }, () => {
  const issues = lint('sf_broken', SPRITES);
  const has = (re, n = 1) => {
    const hits = issues.filter(s => re.test(s));
    assert.equal(hits.length, n, `${re}: ${hits.length} hit(s)\n${issues.join('\n')}`);
  };
  // declared and not imported
  has(/❌.*'bob_influence' \(influence of social\.characters\.bob\) is imported/);
  has(/❌.*'bob_latched' .* is not declared/);
  has(/❌.*'bob_count' \(band flag of threshold 'wary'/);
  has(/❌.*'bob_lockout_until' .* is not declared/);
  has(/❌.*'bob_lockout_channel' .* is not declared/);
  has(/'bob_wary'.* is not declared/, 0);
  // synced variables declared
  has(/❌.*syncedVars lists 'bob_ghost'/);
  has(/syncedVars lists 'bob_influence'/, 0);
  // VARs in the channel story
  has(/❌.*does not declare VAR bob_influence/);
  has(/❌.*VAR bob_mood is number but globalVariables declares "calm"/);
  has(/⚠️.*VAR bob_calm, a declared global, but .*syncedVars does not list it/);
  // thresholds ordered, bounds
  has(/❌.*thresholds are not ordered: "below"/);
  has(/❌.*influence start \(500\) lies outside min\.\.max/);
  // clearOnRearm only on booleans
  has(/❌.*clearOnRearm on 'bob_wary'/);
  has(/❌.*clearOnRearm on 'bob_count'/);
  // lockout
  has(/❌.*lockout with no expiry/);
  has(/❌.*lockout recoverTo -45 is below -30 /);
  // influence.display
  has(/❌.*influence\.display has the key 'glow'/);
  has(/❌.*influence\.display\.number must be true or false/);
  has(/⚠️.*social\.influenceDisplay sets number: true beside bar: false/);
});

test('EXTERNAL needs a same-name, same-arity ink fallback; comments are ignored', { skip }, () => {
  const issues = lint('sf_broken', SPRITES);
  const ext = issues.filter(s => /EXTERNAL/.test(s));
  assert.equal(ext.length, 2, ext.join('\n'));
  assert.ok(ext.some(s => /bob\.ink:1 declares EXTERNAL se_influence but the story has no/.test(s)), ext.join('\n'));
  assert.ok(ext.some(s => /bob\.ink:2 EXTERNAL pretext_say takes 1 argument\(s\) but its fallback function takes 2/.test(s)), ext.join('\n'));
  assert.ok(!ext.some(s => /pretext_ask|commented_out/.test(s)));
});

test('a fallback in an INCLUDEd file counts (clean fixture)', { skip }, () => {
  assert.deepEqual(lint('sf_clean', SPRITES).filter(s => /EXTERNAL/.test(s)), []);
});

test('aim unlockCondition keys and object id uniqueness apply to every scenario', { skip }, () => {
  const issues = lint('sf_nosocial', null);
  assert.equal(issues.length, 2, issues.join('\n'));
  assert.ok(issues.some(s => /❌.*aim 'a2'\) unlockCondition key 'greaterThan' is not supported/.test(s)));
  assert.ok(issues.some(s => /❌.*object id 'same' is used more than once \(a\/objects\[0\], b\/objects\[0\]\)/.test(s)));
  // the social-only lints (sprites) do not run without a `social` key
  assert.ok(!issues.some(s => /mail_terminal/.test(s)));
  // the allowed keys pass
  assert.deepEqual(lint('sf_clean', SPRITES).filter(s => /unlockCondition/.test(s)), []);
});

test('object name collisions are a warning, never an error', { skip }, () => {
  const issues = lint('sf_names', ['notes']).filter(s => /looked up by/.test(s));
  assert.ok(issues.every(s => s.startsWith('⚠️')), issues.join('\n'));
  assert.equal(issues.length, 2, issues.join('\n'));
  // no id: found by name 'Desk', but a/objects[2] has that name first
  assert.ok(issues.some(s => /b\/objects\[0\] is looked up by 'Desk'.*a\/objects\[2\]/.test(s)));
  // id 'Cabinet' matches a/objects[1] by name first
  assert.ok(issues.some(s => /b\/objects\[1\] is looked up by 'Cabinet'.*a\/objects\[1\]/.test(s)));
  // an object with a unique id is fine even when its name repeats ('fine' vs 'Wall safe')
  assert.ok(!issues.some(s => /b\/objects\[2\]/.test(s)));
  // a clean scenario and the same-id duplicate case raise no collision warning
  assert.deepEqual(lint('sf_clean', ['notes', 'mail_terminal', 'kiosk']).filter(s => /looked up by/.test(s)), []);
  assert.deepEqual(lint('sf_nosocial', null).filter(s => /looked up by/.test(s)), []);
});

test('a missing sprite for a social object type is an error, only with a social key', { skip }, () => {
  const none = lint('sf_broken', ['notes']).filter(s => /assets\/objects/.test(s));
  assert.equal(none.length, 2, none.join('\n'));
  assert.ok(none.some(s => /\/rooms\/a\/objects\[0\].*'mail_terminal'.*mail_terminal\.png does not exist/.test(s)));
  assert.ok(none.some(s => /\/rooms\/b\/objects\[0\].*'kiosk'/.test(s)));
  assert.deepEqual(lint('sf_broken', SPRITES).filter(s => /assets\/objects/.test(s)), []);
  assert.deepEqual(lint('sf_broken', null).filter(s => /assets\/objects/.test(s)), []);
});

test('--strict-social: exit 1 on a social lint error, 0 on a clean or social-free scenario', { skip }, () => {
  const broken = cli('sf_broken', '--strict-social');
  assert.equal(broken.status, 1, broken.stdout + broken.stderr);
  assert.match(broken.stdout, /--strict-social: \d+ social lint error/);
  // the same scenario without the flag keeps the old behaviour: findings print, exit 0
  const plain = cli('sf_broken');
  assert.equal(plain.status, 0, plain.stdout + plain.stderr);
  assert.match(plain.stdout, /SOCIAL:/);
  const clean = cli('sf_clean', '--strict-social');
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  // no `social` key: lint errors print but the flag never fails the run
  const nosocial = cli('sf_nosocial', '--strict-social');
  assert.equal(nosocial.status, 0, nosocial.stdout + nosocial.stderr);
  assert.match(nosocial.stdout, /SOCIAL: object id 'same'/);
});

test('each area has a stub file returning an empty list', { skip }, () => {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    ctx = ValidateSocial::Context.new(json: {}, repo_root: '.', social: {})
    puts JSON.generate(ValidateSocial::AREAS.map { |a| [a.name, a.check(ctx)] })`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  const areas = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.deepEqual(areas.map(a => a[0].split('::')[1]),
    ['Mail', 'Osint', 'Board', 'Triage', 'Pretext', 'Landing', 'Lab', 'Options', 'Awareness']);
  assert.ok(areas.every(a => a[1].length === 0));
});

test('a missing social sprite on its own is the only error, and fails --strict-social alone', { skip }, () => {
  // in-process: the fixture is sf_clean plus one osint-workstation object
  assert.deepEqual(lint('sf_sprite', SPRITES.concat('osint-workstation')), []);
  const issues = lint('sf_sprite', SPRITES);
  assert.equal(issues.length, 1, issues.join('\n'));
  assert.match(issues[0], /❌.*'osint-workstation' but assets\/objects\/osint-workstation\.png does not exist/);
  // CLI, against the real assets folder: meaningful only while that sprite is missing
  if (existsSync(join(root, 'public/break_escape/assets/objects/osint-workstation.png'))) return;
  const strict = cli('sf_sprite', '--strict-social');
  assert.equal(strict.status, 1, strict.stdout + strict.stderr);
  assert.match(strict.stdout, /--strict-social: 1 social lint error/);
  const plain = cli('sf_sprite');
  assert.equal(plain.status, 0, plain.stdout + plain.stderr);
});

test('edge cases: until.global route, "above" order, underscore keys, equals alone, no-paren fallback, recoverTo default', { skip }, () => {
  const issues = lint('sf_edges', SPRITES);
  const errors = issues.filter(i => i.startsWith('❌'));
  assert.equal(errors.length, 3, issues.join('\n'));
  // "above" thresholds must ascend
  assert.ok(errors.some(e => /thresholds are not ordered: "above" thresholds must run from the lowest at to the highest \(got 20, 10\)/.test(e)));
  // equals with no globalVariable is always met in the engine
  assert.ok(errors.some(e => /aim 'a3'\) unlockCondition has 'equals' without 'globalVariable'/.test(e)));
  // until.global must be declared; a declared one is a valid expiry route
  assert.ok(errors.some(e => /threshold 'burned' lockout until\.global 'lena_undeclared' is not declared/.test(e)));
  assert.ok(!issues.some(i => /lockout with no expiry/.test(i)), 'until.global counts as an expiry');
  // _comment is a note, not an unlock key
  assert.ok(!issues.some(i => /_comment/.test(i)));
  // `=== function lena_mood ===` is a fallback for EXTERNAL lena_mood()
  assert.ok(!issues.some(i => /EXTERNAL/.test(i)), issues.join('\n'));
  // no influence.start: recoverTo defaults to the declared global (-20), as the engine does
  assert.ok(!issues.some(i => /recoverTo/.test(i)), issues.join('\n'));
});

// Keep last: the runs above must not have written to the fixture folder
test('the fixture folder is unchanged by the runs', () => {
  assert.equal(folderHash(fx), fixturesBefore);
});
