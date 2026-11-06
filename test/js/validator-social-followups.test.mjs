// The validator follow-ups from MECHANICS_AUDIT "Follow-ups found during M3 and M4":
//  - influence.start must match the influence global's declared value, and (with no global
//    declared) each channel story's VAR default (validate_social.rb characters);
//  - an OSINT showIf is one global name: an array is an error (validate_social/osint.rb);
//  - the schema: intelBoard.readyToast is accepted, engagement.client is gone (`_client` is a note);
//  - the OSINT clean fixture (so_clean.json) passes the schema;
//  - the pretext keys only the validator reads are listed as such in README "Reserved keys".
// The lints are called in-process (never the bare CLI, which rewrites graphs and compiled ink).
// Run with: bundle exec node --test test/js/validator-social-followups.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function rubyJson(script, input) {
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(input), maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

// ---- influence.start against the global and the VAR default ---------------------------------

// A scratch repo root with one person-channel story declaring VAR pat_influence = <inkDefault>.
const inkRoot = mkdtempSync(join(tmpdir(), 'social-followups-'));
test.after(() => rmSync(inkRoot, { recursive: true, force: true }));
function storyWith(inkDefault) {
  const dir = mkdtempSync(join(inkRoot, 'r-'));
  mkdirSync(join(dir, 'ink'));
  writeFileSync(join(dir, 'ink', 'pat.ink'), `VAR pat_influence = ${inkDefault}\n=== start ===\nHello.\n-> END\n`);
  return dir;
}

function characterScenario({ start, declared }) {
  const j = {
    globalVariables: {},
    rooms: { office: { npcs: [{ id: 'pat_npc', storyPath: 'ink/pat.json' }] } },
    social: { characters: { pat: { channels: { person: 'pat_npc' },
      influence: { global: 'pat_influence', min: -100, max: 100, start } } } }
  };
  if (declared !== undefined) j.globalVariables.pat_influence = declared;
  return j;
}

function characters(json, repo) {
  return rubyJson(`require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    j = JSON.parse($stdin.read)
    ctx = ValidateSocial::Context.new(json: j, repo_root: ${JSON.stringify(repo)}, social: j['social'], imports: nil)
    puts JSON.generate(ValidateSocial.characters(ctx))`, json);
}
const startHits = (out) => out.filter((s) => /influence start/.test(s));

test('influence.start equal to the global and the VAR raises nothing', { skip }, () => {
  assert.deepEqual(characters(characterScenario({ start: 0, declared: 0 }), storyWith('0')), []);
});

test('influence.start differing from the declared global is an error (the lab had -10 against 0)', { skip }, () => {
  const out = characters(characterScenario({ start: 0, declared: -10 }), storyWith('-10'));
  const hits = startHits(out);
  assert.equal(hits.length, 1, out.join('\n'));
  assert.match(hits[0], /^❌ SOCIAL: social\.characters\.pat\.influence start \(0\) does not match globalVariables pat_influence \(-10\)/);
});

test('with no global declared, influence.start differing from the VAR default is an error', { skip }, () => {
  const out = characters(characterScenario({ start: 0 }), storyWith('-10'));
  const hits = startHits(out);
  assert.equal(hits.length, 1, out.join('\n'));
  assert.match(hits[0], /^❌ SOCIAL: ink\/pat\.ink VAR pat_influence = -10 but social\.characters\.pat\.influence start is 0 \(channel 'person', pat_npc\)/);
  assert.deepEqual(startHits(characters(characterScenario({ start: -10 }), storyWith('-10'))), []);
});

test('no influence.start: nothing to compare', { skip }, () => {
  const j = characterScenario({ start: 0, declared: 5 });
  delete j.social.characters.pat.influence.start;
  assert.deepEqual(startHits(characters(j, storyWith('5'))), []);
});

// ---- OSINT showIf takes one global name ----------------------------------------------------

const soClean = () => JSON.parse(readFileSync(join(root, 'test/js/fixtures/social_osint/so_clean.json'), 'utf8'));
function osint(json) {
  return rubyJson(`require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    j = JSON.parse($stdin.read)
    ctx = ValidateSocial::Context.new(json: j, repo_root: ${JSON.stringify(root)}, social: j['social'], imports: nil)
    puts JSON.generate(ValidateSocial::Osint.check(ctx))`, json);
}

test('an OSINT showIf string naming a declared global passes; an array or a non-string is an error', { skip }, () => {
  const g = Object.keys(soClean().globalVariables).find((k) => k.startsWith('se_intel_'));
  const withShowIf = (v) => { const j = soClean(); j.social.osint.sites[0].pages[0].blocks[0].showIf = v; return j; };
  assert.deepEqual(osint(withShowIf(g)).filter((s) => /showIf/.test(s)), []);
  for (const bad of [[g], [g, g], 7]) {
    const hits = osint(withShowIf(bad)).filter((s) => /showIf/.test(s));
    assert.equal(hits.length, 1, `${JSON.stringify(bad)}: ${hits.join('\n')}`);
    assert.match(hits[0], /^❌ SOCIAL: social\.osint\.sites\[0\]\.pages\[0\]\.blocks\[0\]\.showIf must be one global name \(a string\)/);
  }
  const undeclared = osint(withShowIf('no_such_global')).filter((s) => /showIf/.test(s));
  assert.equal(undeclared.length, 1);
  assert.match(undeclared[0], /showIf 'no_such_global' is not a global declared in globalVariables/);
});

// ---- schema: readyToast, engagement.client, the so_clean fixture ---------------------------

function schemaRun(list) {
  return rubyJson(`require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    JSON::Validator.use_multi_json = false
    out = JSON.parse($stdin.read).map do |j|
      social, other = ValidateSocial.split_schema_errors(validate_json(j, ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
      { social: social, other: other }
    end
    puts JSON.generate(out)`, list);
}
const base = () => JSON.parse(readFileSync(join(root, 'test/js/fixtures/social_schema/base.json'), 'utf8'));

test('schema: intelBoard.readyToast takes a non-empty string', { skip }, () => {
  const ok = base(); ok.social.intelBoard.readyToast = 'Call the service desk.';
  const empty = base(); empty.social.intelBoard.readyToast = '';
  const num = base(); num.social.intelBoard.readyToast = 3;
  const [a, b, c] = schemaRun([ok, empty, num]);
  assert.deepEqual(a, { social: [], other: [] });
  assert.ok(b.social.some((e) => e.includes('#/social/intelBoard/readyToast')), b.social.join('\n'));
  assert.ok(c.social.some((e) => e.includes('#/social/intelBoard/readyToast')), c.social.join('\n'));
});

test('schema: engagement.client is gone; _client is a note', { skip }, () => {
  const noted = base();
  assert.ok('_client' in noted.social.engagement, 'the base fixture keeps the client as a note');
  const old = base(); old.social.engagement.client = 'Ledgerwell Ltd (fictional)';
  const [a, b] = schemaRun([noted, old]);
  assert.deepEqual(a, { social: [], other: [] });
  assert.ok(b.social.some((e) => e.includes('#/social/engagement') && e.includes('client')), b.social.join('\n'));
});

test('the lab authors _client, not client', () => {
  const src = readFileSync(join(root, 'scenarios/lab_social_engineering/scenario.json.erb'), 'utf8');
  assert.doesNotMatch(src, /"client"\s*:/);
  assert.match(src, /"_client"\s*:/);
});

test('the OSINT clean fixture passes the schema', { skip }, () => {
  const [r] = schemaRun([soClean()]);
  assert.deepEqual(r, { social: [], other: [] });
});

// ---- validator-only pretext keys are documented ---------------------------------------------

test('README "Reserved keys" lists the pretext keys only the validator reads', () => {
  const readme = readFileSync(join(root, 'README_scenario_design.md'), 'utf8');
  const start = readme.indexOf('### Reserved keys (authored but not read)');
  assert.ok(start > 0, 'Reserved keys section found');
  const section = readme.slice(start, readme.indexOf('\n### ', start + 10));
  for (const key of ['tuning.feedbackMode', 'tuning.showTechniqueNames', 'tells.bands']) {
    const row = section.split('\n').find((l) => l.startsWith('|') && l.includes(key));
    assert.ok(row, `${key} has a row`);
    assert.match(row, /validator only/, `${key}: ${row}`);
  }
  assert.doesNotMatch(section, /`engagement\.client`/);
});

test('the runtime reads none of the validator-only pretext keys', () => {
  const files = ['systems/pretext-judge.js', 'ui/pretext-chrome.js', 'minigames/person-chat/person-chat-pretext.js',
    'minigames/pretext-prep/pretext-card.js'];
  for (const f of files) {
    const src = readFileSync(join(root, 'public/break_escape/js', f), 'utf8');
    assert.doesNotMatch(src, /feedbackMode|showTechniqueNames|tells\??\.bands/, f);
  }
});
