// scripts/validate_social/pretext.rb: the Phase 4 lints (P4-F).
//   06 N10 (pretext data, ink ids and blanks, per-call globals, tells, route to "got it",
//   a `reports` threshold on every character with call data, callId pointers) and 06 N12
//   (no once-only choice in a call knot).
// Fixtures under test/js/fixtures/social_pretext/scenarios. The lints are called in-process (never the
// bare CLI, which rewrites graphs and compiled ink); the CLI run uses --no-graph --skip-ink --no-lint.
// Most runs use a scratch copy of the fixture tree as the repo root, with its own
// scripts/minigame-data-schemas.json, so the callId schema lint does not depend on the live shared file.
// Run with: bundle exec node --test test/js/validator-social-pretext.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureRel = 'test/js/fixtures/social_pretext';
const fx = join(root, fixtureRel, 'scenarios');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

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
const fixturesBefore = folderHash(join(root, fixtureRel));

// A scratch repo root holding a copy of the fixtures and a schemas file.
function scratchRoot(schemas) {
  const dir = mkdtempSync(join(tmpdir(), 'sp-root-'));
  cpSync(join(root, fixtureRel), join(dir, fixtureRel), { recursive: true });
  mkdirSync(join(dir, 'scripts'));
  writeFileSync(join(dir, 'scripts', 'minigame-data-schemas.json'), JSON.stringify(schemas));
  return dir;
}
const withSchema = scratchRoot({ phone: { required: [], optional: ['callId'] } });
const withoutSchema = scratchRoot({});
test.after(() => { rmSync(withSchema, { recursive: true, force: true }); rmSync(withoutSchema, { recursive: true, force: true }); });

const TYPES = ['notes', 'phone'];

// Run the whole social check on a fixture scenario, or on its JSON after `mutate(json)`.
function lint(scenario, { repo = withSchema, mutate } = {}) {
  const file = join(fx, scenario, 'scenario.json.erb');
  const json = JSON.parse(readFileSync(file, 'utf8'));
  if (mutate) mutate(json);
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j = JSON.parse(STDIN.read)
    imports = prepare_carry_over_globals(j)
    puts JSON.generate(ValidateSocial.check(j, repo_root: ${JSON.stringify(repo)}, valid_item_types: Set.new(${JSON.stringify(TYPES)}), imports: imports))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(json) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function cli(scenario, ...flags) {
  return spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'),
    join(fx, scenario, 'scenario.json.erb'), '--no-graph', '--skip-ink', '--no-lint', ...flags],
  { encoding: 'utf8', env, cwd: root });
}

const call = (j) => j.social.pretextNpcs[0];
const hits = (issues, re) => issues.filter((s) => re.test(s));
const one = (issues, re) => assert.equal(hits(issues, re).length, 1, `${re}\n${issues.join('\n')}`);
const none = (issues, re) => assert.equal(hits(issues, re).length, 0, `${re}\n${issues.join('\n')}`);

test('a clean pretext call raises nothing', { skip }, () => {
  assert.deepEqual(lint('sp_clean'), []);
});

test('a scenario without pretextNpcs is not touched by the pretext lints', { skip }, () => {
  const issues = lint('sp_clean', {
    mutate: (j) => {
      delete j.social.pretextNpcs;
      j.rooms.desk.objects = j.rooms.desk.objects.filter((o) => o.type !== 'phone');
    },
  });
  assert.deepEqual(issues, []);
});

test('the broken call: every ink-side lint fires', { skip }, () => {
  const issues = lint('sp_broken');
  // ids that ink passes exist in the JSON; commented-out calls are ignored
  one(issues, /dev_desk\.ink:23: pretext_say\("ghost_line"\) but .* has no line 'ghost_line'/);
  one(issues, /dev_desk\.ink:29: pretext_ask\("ghost_ask"\) but .* has no ask 'ghost_ask'/);
  one(issues, /⚠️.*pretext_say\(chosen_line\) does not pass a string literal/);
  none(issues, /also_ghost/);
  // lines and asks the channel never calls
  one(issues, /⚠️.*never calls pretext_say\("urgent_payslip"\)/);
  one(issues, /⚠️.*never calls pretext_say\("double_down"\)/);
  one(issues, /⚠️.*never calls pretext_ask\("payslip_date"\)/);
  none(issues, /never calls pretext_say\("open_buddy"\)/);
  // blanks in the ink choice match the JSON
  one(issues, /dev_desk\.ink:17: line 'open_buddy' declares a blank for 'team' in the JSON but the choice .* never shows \{pretext_team_name\}/);
  one(issues, /dev_desk\.ink:20: the choice that calls line 'repair_team' shows \{pretext_intern_name\}, but the JSON declares no blank for 'intern'/);
  one(issues, /dev_desk\.ink:17: line 'open_buddy' has a blank that feeds 'team' but the story declares no VAR pretext_team_name/);
  one(issues, /uses pretext_team_name\/_value but declares no VAR for it/);
  // N12: one once-only choice in a call knot; the `* -> END` fallback and the choice in a non-call knot pass
  const once = hits(issues, /once-only choice/);
  assert.equal(once.length, 1, issues.join('\n'));
  assert.match(once[0], /dev_desk\.ink:32: .* in knot 'buddy'/);
  assert.ok(!once.some((s) => /side_chat|-> END/.test(s)), once.join('\n'));
  // the story must not declare the call's state key
  one(issues, /dev_desk\.ink declares VAR pretext_service_desk_call_state/);
});

test('the broken call: the data lints fire', { skip }, () => {
  const issues = lint('sp_broken');
  // claims
  one(issues, /❌.*claims\[2\]\.from 'blank:floor' names no blank of the line/);
  one(issues, /⚠️.*claims\[2\]: fact 'floor' is not in knows/);
  one(issues, /⚠️.*claims\[3\]: fact 'nickname' is not in knows/);
  none(issues, /nickname2/); // marked "unverifiable": true
  // vocabulary, grades, references
  one(issues, /❌.*susceptibility has the key 'bribery'/);
  one(issues, /❌.*lines\.urgent_payslip uses technique 'flattery'/);
  one(issues, /❌.*lines\.double_down\.doublesDown names 'manager', which is not in knows/);
  one(issues, /❌.*asks\.portal_name\.grants\.intel 'no_such_fact' is not a social\.intelFacts id/);
  one(issues, /❌.*asks\.payslip_date\.verification names 'startDate', which is not in knows/);
  one(issues, /❌.*asks\.payslip_date\.verification needs 'startDate', but no line has a claim on it/);
  one(issues, /❌.*tuning\.tellDetail 'verbose' is not one of/);
  // output and report globals declared and not imported
  assert.equal(hits(issues, /'pretext_call_done' \(grants\.setGlobal of ask/).length, 2, issues.join('\n'));
  one(issues, /'pretext_call_reported' \(setGlobal of outcome 'reported'\) is imported/);
  one(issues, /'dev_reported' \(report global of social\.characters\.dev\) is not declared/);
  // the per-call keys
  one(issues, /'pretext_service_desk_call_outcome' is not declared in globalVariables/);
  one(issues, /'pretext_service_desk_call_lowest' must be declared as an integer/);
  none(issues, /pretext_service_desk_call_state' is not declared/);
  // pointers
  one(issues, /objects\[2\] has callId 'no_such_call'/);
});

test('empty and missing tells are errors; unknown placeholders warn', { skip }, () => {
  const issues = lint('sp_broken');
  one(issues, /❌.*tells\.intern\.failCategory is missing/);
  one(issues, /❌.*tells\.team\.unknown is empty/);
  one(issues, /❌.*tells\.techniques\.urgency is empty/);
  one(issues, /❌.*tells\.techniques\.flattery is missing/);
  one(issues, /❌.*tells\.repair is empty/);
  one(issues, /❌.*tells\.ask\.refused is empty/);
  one(issues, /❌.*tells\.bands\.wary is missing/);
  one(issues, /⚠️.*tells\.team\.fail uses \{typed\}/);
  // the clean call has every block
  assert.deepEqual(lint('sp_clean').filter((s) => /tells/.test(s)), []);
  // an empty string on a block that is present is caught even when tellDetail is "none"
  const i2 = lint('sp_clean', { mutate: (j) => { call(j).tuning.tellDetail = 'none'; call(j).tells.bands.calm = ''; } });
  one(i2, /tells\.bands\.calm is empty/);
});

test('a character with call data needs a `reports` threshold', { skip }, () => {
  const issues = lint('sp_clean', {
    mutate: (j) => { j.social.characters.dev.thresholds = j.social.characters.dev.thresholds.filter((t) => t.id !== 'reports'); },
  });
  one(issues, /❌.*social\.characters\.dev has call data but no threshold with the id 'reports'/);
  // a mail-only character with no call data is not asked for one (the lab's Pierce and Lord)
  assert.deepEqual(lint('sp_clean', {
    mutate: (j) => {
      j.social.characters.pierce = { displayName: 'P', channels: { email: 'x' }, influence: { global: 'pierce_influence', start: 0 }, thresholds: [] };
      j.globalVariables.pierce_influence = 0;
      j.globalVariables.pierce_latched = '';
    },
  }).filter((s) => /reports/.test(s)), []);
  // an unknown character
  one(lint('sp_clean', { mutate: (j) => { call(j).character = 'nobody'; } }), /character 'nobody' is not an entry in social\.characters/);
});

test("a character's recoverTo is checked against A + rearmMargin (the generic lint covers call characters)", { skip }, () => {
  const issues = lint('sp_clean', {
    mutate: (j) => {
      j.social.characters.dev.thresholds.find((t) => t.id === 'reports').effects.find((e) => e.type === 'lockout').recoverTo = -45;
    },
  });
  one(issues, /lockout recoverTo -45 is below -30/);
});

test('a lockout without an expiry or a route is an error; a lockout released by a global needs a setter', { skip }, () => {
  const permanent = lint('sp_clean', {
    mutate: (j) => { delete j.social.characters.dev.thresholds.find((t) => t.id === 'reports').effects.find((e) => e.type === 'lockout').until; },
  });
  one(permanent, /lockout with no expiry/);
  const byGlobal = (extra) => lint('sp_clean', {
    mutate: (j) => {
      j.globalVariables.desk_cleared = false;
      j.social.characters.dev.thresholds.find((t) => t.id === 'reports').effects.find((e) => e.type === 'lockout').until = { global: 'desk_cleared' };
      if (extra) extra(j);
    },
  });
  one(byGlobal(), /⚠️.*released by global 'desk_cleared', but nothing in the scenario sets it/);
  const withSetter = byGlobal((j) => {
    j.objectives[0].tasks = [{ taskId: 't', title: 'T', type: 'manual', onComplete: { setGlobal: { desk_cleared: true } } }];
  });
  none(withSetter, /desk_cleared/);
});

test('a route to "got it" must exist under the tuning', { skip }, () => {
  // no asks
  one(lint('sp_clean', { mutate: (j) => { call(j).asks = {}; } }), /❌.*has no asks/);
  // the floors are above anything the start value plus the best line can reach
  const high = lint('sp_clean', {
    mutate: (j) => { for (const a of Object.values(call(j).asks)) a.floor = 150; },
  });
  one(high, /❌.*no ask can be granted under this tuning/);
  // start -10, the only ask has floor -5: reachable only if a line can raise influence
  const raise = (j) => {
    call(j).asks = { portal_name: { pressure: 0, floor: -5, verification: [], grants: { intel: ['lord_portal_name'], setGlobal: { pretext_call_done: true } } } };
  };
  assert.deepEqual(lint('sp_clean', { mutate: raise }).filter((s) => /no ask can be granted/.test(s)), []);
  const stuck = lint('sp_clean', {
    mutate: (j) => {
      raise(j);
      // nothing can raise influence: no claim on a known fact, no positive technique, no repair
      call(j).lines = { urgent_payslip: { technique: 'urgency', claims: [] } };
      call(j).susceptibility = { urgency: -10 };
    },
  });
  one(stuck, /❌.*no ask can be granted under this tuning.*no line can raise it/);
  // a pressure that drops the player to the report line
  const crushed = lint('sp_clean', {
    mutate: (j) => { for (const a of Object.values(call(j).asks)) { a.pressure = -200; delete a.floor; } },
  });
  one(crushed, /no ask can be granted under this tuning/);
  // maxRefusals must be a positive integer
  one(lint('sp_clean', { mutate: (j) => { call(j).tuning.maxRefusals = 0; } }), /tuning\.maxRefusals must be a positive integer/);
});

test('callId pointers: the schema entry, the channel record and the NPC id', { skip }, () => {
  // no `phone` schema entry listing callId
  one(lint('sp_clean', { repo: withoutSchema }), /minigame-data-schemas\.json has no 'phone' entry that lists callId/);
  // a phone pointer needs a phone channel; an NPC pointer opens the person channel
  const noPhone = lint('sp_clean', {
    mutate: (j) => { j.social.characters.dev.channels = { person: 'dev_service_desk' }; },
  });
  one(noPhone, /callId 'service_desk_call' but social\.characters\.dev\.channels has no 'phone' record/);
  const npc = lint('sp_clean', {
    mutate: (j) => {
      j.rooms.desk.objects = j.rooms.desk.objects.filter((o) => o.type !== 'phone');
      j.rooms.desk.npcs[0].callId = 'service_desk_call';
    },
  });
  one(npc, /channels has no 'person' record to open/);
  const wrongId = lint('sp_clean', {
    mutate: (j) => {
      j.rooms.desk.objects = j.rooms.desk.objects.filter((o) => o.type !== 'phone');
      j.social.characters.dev.channels = { person: 'dev_service_desk', phone: 'dev_service_desk' };
      j.rooms.desk.npcs.push({ id: 'dev_other', displayName: 'Dev', npcType: 'phone', callId: 'service_desk_call' });
    },
  });
  one(wrongId, /⚠️.*\(dev_other\) has callId 'service_desk_call' but its id is not/);
});

test('--strict-social: the broken call exits 1, the call lints run beside the others', { skip }, () => {
  const r = cli('sp_broken', '--strict-social');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /--strict-social: \d+ social lint error/);
  assert.match(r.stdout, /pretext_say\("ghost_line"\)/);
  // without the flag the findings still print and the exit stays 0
  const plain = cli('sp_broken');
  assert.equal(plain.status, 0, plain.stdout + plain.stderr);
  assert.match(plain.stdout, /ghost_line/);
});

test('no run wrote or changed anything under the fixtures', { skip }, () => {
  assert.equal(folderHash(join(root, fixtureRel)), fixturesBefore);
});

test('P3 N9: lines[].requires names held intel facts; an unknown id or a non-array is refused', { skip }, () => {
  const first = (j) => Object.keys(call(j).lines)[0];
  const known = (j) => Object.keys(j.social.intelFacts || {})[0];
  none(lint('sp_clean', { mutate: (j) => { if (known(j)) call(j).lines[first(j)].requires = [known(j)]; } }), /requires/);
  one(lint('sp_clean', { mutate: (j) => { call(j).lines[first(j)].requires = ['no_such_fact'] } }), /requires 'no_such_fact' is not a social\.intelFacts id/);
  one(lint('sp_clean', { mutate: (j) => { call(j).lines[first(j)].requires = 'org_chart' } }), /requires must be an array/);
});
