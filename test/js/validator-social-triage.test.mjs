// scripts/validate_social/triage.rb and the defender half of board.rb (P3-E):
//   05 N5  triage set lints (shape, stage parameter, call/push/Verify rules, result globals,
//          task keyed on <prefix>done, parallel-form balance, authored strings, flags, playerSentAuth)
//   03 N6  defender mode (factMitigations, reduceNote, onCompleteGlobal, steps)
// Fixtures under test/js/fixtures/social/triage. The lints are called in-process (never the bare CLI,
// which rewrites graphs and compiled ink); the CLI runs use --no-graph --skip-ink --no-lint.
// Run with: bundle exec node --test test/js/validator-social-triage.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/social/triage');
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
const fixturesBefore = folderHash(fx);

const TYPES = ['notes', 'mail_terminal', 'case-file', 'triage-workstation'];
function lint(scenario) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j, = render_erb_to_json(${JSON.stringify(join(fx, scenario, 'scenario.json.erb'))}, {}, include_rendered: true)
    imports = prepare_carry_over_globals(j)
    puts JSON.generate(ValidateSocial.check(j, repo_root: ${JSON.stringify(root)}, valid_item_types: Set.new(${JSON.stringify(TYPES)}), imports: imports))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

// Runs the triage and board lints on an inline scenario (a JS object) with optional imports.
function lintJson(json, imports = null) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    imports = ${imports ? `JSON.parse(${JSON.stringify(JSON.stringify(imports))})` : 'nil'}
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: imports)
    puts JSON.generate(ValidateSocial::Triage.check(ctx) + ValidateSocial::Board.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function cli(path, ...flags) {
  return spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), path,
    '--no-graph', '--skip-ink', '--no-lint', ...flags], { encoding: 'utf8', env, cwd: root });
}

const count = (arr, re) => arr.filter((s) => re.test(s)).length;
function expectIn(arr, re, n = 1) {
  const hits = count(arr, re);
  assert.equal(hits, n, `${re}: ${hits} hit(s)\n${arr.filter((s) => /triage|defender|workstation|global '/.test(s)).join('\n')}`);
}

// A minimal scenario holding one valid set; tests mutate a copy.
function mini() {
  const msg = (id, phish, flags, auth) => ({
    id, from: { name: 'N', address: `${id}@ledgerwell.example` }, to: 'you@ledgerwell.example', subject: `S ${id}`,
    time: '09:00', body: 'Body', links: [], attachments: [], auth,
    truth: phish
      ? { isPhish: true, flags, perFlagNote: Object.fromEntries(flags.map((f) => [f, 'n'])) }
      : { isPhish: false, flags: [], whyFine: { default: 'fine' } },
  });
  return {
    globalVariables: { triage_percent: 0, triage_reportRate: 0, triage_done: false, triage_pass: false },
    rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 's' } }] } },
    social: {
      mailClient: { accounts: [{ id: 'guest' }] },
      triageSets: [{
        id: 's', stage: 'mission', scoringProfile: 'analyst', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
        messages: [msg('a', false, [], { spf: 'pass', dkim: 'pass', dmarc: 'pass' }),
          msg('b', true, ['senderTrust'], { spf: 'pass', dkim: 'pass', dmarc: 'pass' })],
      }],
    },
  };
}

test('a clean triage and defender scenario raises nothing', { skip }, () => {
  assert.deepEqual(lint('tr_clean'), []);
});

test('the minimal inline scenario is clean (guards the mutation tests below)', { skip }, () => {
  assert.deepEqual(lintJson(mini()), []);
});

test('without a social key the triage lints do not run', { skip }, () => {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    ctx = ValidateSocial::Context.new(json: {}, repo_root: '.', social: nil)
    puts JSON.generate([ValidateSocial::Triage.check(ctx), ValidateSocial::Board.check(ctx)])`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout.trim().split('\n').pop()), [[], []]);
});

const broken = skip ? [] : lint('tr_broken');
const has = (re, n = 1) => expectIn(broken, re, n);

test('05 N5: set shape, enums, bands, chips and the outcome block', { skip }, () => {
  has(/❌.*bad_shape\] has a 'mailbox' field/);
  has(/❌.*bad_shape\]\.stage 'later' must be one of/);
  has(/❌.*bad_shape\]\.feedbackMode 'later'/);
  has(/❌.*bad_shape\]\.title is empty/);
  has(/❌.*bad_shape\]\.outcome\.setGlobalPrefix '\{foo\}_' holds a brace other than the \{stage\} token/);
  has(/❌.*bad_shape\]\.outcome\.passPercent must be a whole number/);
  has(/❌.*made_up_tell' is not one of 00 section 2's channel tells/);
  has(/❌.*made_up_tell.*/, 1);
  has(/❌.*lookalike_domain.*not/, 0); // a known channel tell is accepted
  has(/❌.*flagChips has the key 'bogus'/);
  has(/❌.*flagChips\.senderTrust is empty/);
  has(/❌.*bands\[1\]\.headline is empty/);
  has(/❌.*bands has no band with min 0/);
  has(/❌.*bands repeats a min value/);
  has(/❌.*bad_shape\.pairedWith names the set itself|❌.*bad_shape\]\.pairedWith names the set itself/);
  // a set holds its messages inline: no mailbox, and outcome.passPercent 0 is a warning on mission and training sets only
  has(/⚠️.*bad_msgs\]\.outcome\.passPercent is 0 on a mission set/);
  has(/⚠️.*pair_y\]\.outcome\.passPercent is 0 on a training set/);
  has(/passPercent is 0 on a (pre|post) set/, 0);
});

test('05 N5: call, push and Verify belong to awareness sets', { skip }, () => {
  has(/❌.*bad_shape\]: an analyst set cannot enable verifyVerdict/);
  has(/❌.*bad_shape\]\.messages\[c1\]: a call message belongs in an awareness set with verifyVerdict/);
  has(/❌.*bad_shape\]\.messages\[c2\]: a push message belongs in an awareness set/);
  has(/❌.*messages\[c3\]\.kind 'fax' must be one of/);
  has(/❌.*bad_shape\]\.messages: id 'r1a' is used more than once/);
  // an awareness set with verifyVerdict accepts a call and a push message
  const j = mini();
  j.social.triageSets[0].scoringProfile = 'awareness';
  j.social.triageSets[0].verifyVerdict = true;
  j.social.triageSets[0].channelTells = ['vish_callback_pressure', 'unrequested_mfa_push'];
  j.social.triageSets[0].messages.push(
    { kind: 'call', id: 'c', truth: { isPhish: true, flags: ['vish_callback_pressure'], perFlagNote: { vish_callback_pressure: 'n' } } },
    { kind: 'push', id: 'p', truth: { isPhish: true, flags: ['unrequested_mfa_push'], perFlagNote: { unrequested_mfa_push: 'n' } } });
  assert.deepEqual(lintJson(j), []);
  // a call without verifyVerdict is refused even in an awareness set
  j.social.triageSets[0].verifyVerdict = false;
  expectIn(lintJson(j), /call message belongs in an awareness set with verifyVerdict/);
});

test('05 N5: authored strings, links, auth and truth', { skip }, () => {
  has(/❌.*messages\[e1\]\.subject is empty or missing/);
  has(/❌.*messages\[e2\]\.links\[0\]\.text is empty/);
  has(/❌.*messages\[e2\]\.links\[0\]\.destination is empty/);
  has(/❌.*messages\[e2\]\.links: id 'used' is used more than once/);
  has(/❌.*messages\[e2\]\.body uses \{\{link:nope\}\}/);
  has(/⚠️.*messages\[e2\]\.links: 'unused' is not used/);
  has(/❌.*messages\[e2\]\.attachments\[0\]\.label is empty/);
  has(/❌.*messages\[e3\]\.auth\.spf 'maybe'/);
  has(/❌.*messages\[e3\]\.auth\.replyTo is empty/);
  has(/❌.*messages\[e4\]: a phish needs at least one truth\.flags id/);
  has(/❌.*messages\[e5\]\.truth\.perFlagNote\.senderTrust is missing or empty/);
  has(/❌.*messages\[e5\]\.truth\.perFlagNote\.addressedTo is missing or empty/);
  has(/⚠️.*messages\[e5\]\.truth\.perFlagNote\.urgencyCalibrated has no matching/);
  has(/❌.*messages\[e6\]\.truth\.flags: 'bogus_flag' is not in 00 section 2/);
  has(/❌.*messages\[e6\]\.truth\.flags lists the same id twice/);
  has(/❌.*messages\[e7\]: real mail must have no truth\.flags/);
  has(/❌.*messages\[e8\]\.truth\.whyFine is missing or empty/);
  has(/❌.*messages\[e9\] has domainFrom; it belongs to playerSent entries only/);
  has(/⚠️.*messages\[e10\]: truth\.flags names senderAuth but the header panel shows/);
  has(/❌.*messages\[e11\]\.truth is missing/);
  has(/❌.*messages\[e12\]\.truth\.isPhish must be true or false/);
  has(/❌.*messages\[e13\]\.truth\.reportReply is empty/);
  // a channel tell the set enables is a valid flag id; one it does not enable is refused (c1, c2 above)
  has(/❌.*bad_shape\]\.messages\[c1\]\.truth\.flags: 'vish_callback_pressure' is not in/);
  // the clean message of each set raised nothing
  has(/messages\[r1a\]\.(subject|truth|auth)/, 0);
});

test('05 N5: playerSent entries and the playerSentAuth table', { skip }, () => {
  has(/❌.*messages\[s1\]\.targetId is missing/);
  has(/❌.*bad_sent\]\.messages\[s2\]\.targetId 'nobody' is not a social\.phishTargets id|❌.*messages\[s2\]\.targetId 'nobody'/);
  has(/❌.*messages\[s3\]\.domainFrom 'other' must be "landing_domain"/);
  has(/⚠️.*messages\[s3\] has 'subject'/);
  has(/❌.*messages\[s1\]\.notes is missing/);
  has(/❌.*messages\[s3\]\.notes\.perFlagNote has the key 'bogus'/);
  has(/❌.*messages\[s3\]\.notes\.perFlagNote\.urgencyCalibrated is empty/);
  has(/❌.*messages\[s3\]\.notes\.headerNote is empty/);
  has(/❌.*messages\[s4\]\.notes\.perFlagNote is missing or empty/);
  has(/❌.*playerSentAuth\.accounts has no row for account 'jed_pc'/);
  has(/⚠️.*playerSentAuth\.accounts\.stray is not a known account id/);
  has(/❌.*accounts\.guest\.envelopeFrom uses \{who\}; only \{account_address\} and \{domain\}/);
  has(/⚠️.*accounts\.guest: \{domain\} in an account row cannot be filled/);
  has(/❌.*accounts\.freemail\.spf 'maybe'/);
  has(/❌.*accounts\.freemail\.envelopeFrom has an unmatched brace/);
  has(/❌.*accounts\.freemail\.replyTo is empty or missing/);
  has(/❌.*playerSentAuth\.domains has no rows, but a playerSent entry uses domainFrom/);
  has(/❌.*sent_notable\]\.messages\[s1\]: a playerSent entry has no set-level playerSentAuth/);
  has(/❌.*sent_notable\]\.playerSentAuth must be an object/);
  // {account_address} and {domain} are the only placeholders and the clean fixture's rows use them
  assert.deepEqual(lint('tr_clean'), []);
});

test('05 N5: playerSentAuth needs a row per landing-page domain id when the scenario has a menu', { skip }, () => {
  const j = mini();
  const set = j.social.triageSets[0];
  set.messages.push({ kind: 'playerSent', id: 'own', targetId: 't', domainFrom: 'landing_domain',
    notes: { perFlagNote: { senderTrust: 'n' } } });
  j.social.phishTargets = [{ id: 't' }];
  const row = { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'bounce.{domain}', replyTo: 'n@{domain}' };
  set.playerSentAuth = { accounts: { guest: { spf: 'fail', dkim: 'none', dmarc: 'fail', envelopeFrom: 'w.example', replyTo: 'g@w.example' } },
    domains: { d_one: row } };
  j.social.landingPages = [{ id: 'p', domainMenu: [{ id: 'd_one' }, { id: 'd_two' }] }];
  const out = lintJson(j);
  expectIn(out, /playerSentAuth\.domains has no row for landing-page domain 'd_two'/);
  expectIn(out, /domains has no row for landing-page domain 'd_one'/, 0);
  set.playerSentAuth.domains.d_two = row;
  assert.deepEqual(lintJson(j), []);
});

test('05 N5: the stage launch parameter, workstation pointers and the four result globals', { skip }, () => {
  has(/❌.*objects\[4\]: minigameData\.stage is set but set 'bad_msgs' has setGlobalPrefix 'bm_' with no \{stage\} token/);
  has(/❌.*objects\[5\]: minigameData\.stage 'later' must be pre or post/);
  has(/❌.*minigameData\.triageSetId 'ghost_set' is not a social\.triageSets id/);
  has(/❌.*\(triage-workstation\) has no minigameData\.triageSetId/);
  // the four globals for the stage a workstation launches
  has(/❌.*global 'undecl_pre_(percent|reportRate|done|pass)'/, 4);
  has(/❌.*global 'bm_(percent|reportRate|done|pass)'/, 4);
  has(/❌.*global 'wrongtype_done' \(set 'pair_y'\) must be declared as a boolean, not 0/);
  has(/wrongtype_(percent|reportRate|pass)/, 0);
  // a {stage} set launched as post declares triage_post_*, which the clean fixture declares
  has(/triage_post_/, 0);
  // a {stage} set with no stage anywhere cannot fill its token
  const j = mini();
  j.social.triageSets[0].outcome.setGlobalPrefix = 'triage_{stage}_';
  delete j.social.triageSets[0].stage;
  expectIn(lintJson(j), /has a \{stage\} prefix but no usable stage/);
  j.rooms.r.objects[0].minigameData.stage = 'post';
  const out = lintJson(j);
  expectIn(out, /global 'triage_post_(percent|reportRate|done|pass)'/, 4);
  // declaring them, with the right types, clears it
  Object.assign(j.globalVariables, { triage_post_percent: 0, triage_post_reportRate: 0, triage_post_done: false, triage_post_pass: false });
  assert.deepEqual(lintJson(j), []);
});

test('05 N5: a name the mission imports is skipped, an own declaration is not', { skip }, () => {
  const j = mini();
  delete j.globalVariables.triage_percent;
  expectIn(lintJson(j), /global 'triage_percent'/);
  // imported: the import is the declaration, so there is no undeclared error and no collision lint
  const out = lintJson(j, [{ from: 'm01_x', var: 'y', as: 'triage_percent' }]);
  expectIn(out, /global 'triage_percent'/, 0);
  // a name the scenario merged into globalVariables from an import is not re-checked for its type
  j.globalVariables.triage_percent = 'imported';
  expectIn(lintJson(j, [{ from: 'm01_x', var: 'y', as: 'triage_percent' }]), /triage_percent/, 0);
});

test('05 N5: a task keyed on <prefix>done warns when the set has a non-zero passPercent', { skip }, () => {
  has(/⚠️.*eventMapping on 'tr_lab_done' \(host\) completes a task on the round being done, but set 'lab' has a non-zero passPercent/);
  // a check set (passPercent 0) keyed on done raises nothing; so does the pass global
  has(/⚠️.*eventMapping on 'triage_pre_pass'/, 0);
  has(/⚠️.*eventMapping on 'wrongtype_done'/, 0);
  const j = mini();
  j.rooms.r.npcs = [{ id: 'n', eventMappings: [{ eventPattern: 'global_variable_changed:triage_done', completeTask: 't' }] }];
  expectIn(lintJson(j), /eventMapping on 'triage_done'/);
  j.social.triageSets[0].outcome.passPercent = 0;
  j.social.triageSets[0].stage = 'pre';
  expectIn(lintJson(j), /eventMapping on 'triage_done'/, 0);
  j.social.triageSets[0].outcome.passPercent = 60;
  j.rooms.r.npcs[0].eventMappings[0].eventPattern = 'global_variable_changed:triage_pass';
  expectIn(lintJson(j), /eventMapping on/, 0);
});

test('05 N5: conclusionTaskId must be a task a host NPC mapping completes', { skip }, () => {
  has(/❌.*objects\[9\]: conclusionTaskId 'ghost_task' is not a task id/);
  has(/❌.*objects\[9\]: no NPC eventMapping completes 'ghost_task'/);
  has(/conclusionTaskId 't2'/, 0);
  has(/no NPC eventMapping completes 't2'/, 0);
});

test('05 N5: parallel forms match on size, phish count and factors, and teach pass-but-bad and fail-but-fine', { skip }, () => {
  has(/⚠️.*pair_x\] and \[pair_y\]: a pair should run as one pre and one post/);
  has(/❌.*pair_x\] and \[pair_y\]: sizes differ \(4 and 3 messages\)/);
  has(/❌.*pair_x\] and \[pair_y\]: factor 'urgencyCalibrated' appears 1 time\(s\) in 'pair_x' and 0 in 'pair_y'/);
  has(/❌.*pair_x\] and \[pair_y\]: factor 'senderTrust'/, 0);
  has(/❌.*social\.triageSets\[pair_y\] has no pass-but-bad message/);
  has(/❌.*social\.triageSets\[pair_y\] has no fail-but-fine message/);
  has(/❌.*social\.triageSets\[pair_x\] has no (pass-but-bad|fail-but-fine)/, 0);
  has(/❌.*both forms hold the same message \(same@ledgerwell\.example, "same"\)/);
  // pairedWith that names a missing set; a pair holding playerSent entries; a one-way pair
  has(/❌.*bad_sent\]\.pairedWith 'ghost_set' is not a social\.triageSets id/);
  has(/❌.*sent_notable\] holds playerSent entries, so it cannot be one half of a pairedWith pair/);
  // the clean pre_a and post_b pair is balanced and not flagged
  has(/pre_a\] and \[post_b|post_b\] and \[pre_a/, 0);
});

test('05 N5: a pair that is not mutual is a warning', { skip }, () => {
  const j = mini();
  const a = j.social.triageSets[0];
  a.id = 'a'; a.stage = 'pre'; a.pairedWith = 'b';
  const b = JSON.parse(JSON.stringify(a));
  b.id = 'b'; b.stage = 'post'; delete b.pairedWith;
  j.social.triageSets = [a, b];
  j.rooms.r.objects.push({ type: 'triage-workstation', id: 'ws2', minigameData: { triageSetId: 'b' } });
  const out = lintJson(j);
  expectIn(out, /⚠️.*pairedWith is not mutual/);
});

test('05 N5: a set no workstation launches is a warning', { skip }, () => {
  has(/⚠️.*triageSets\[lab\] is not launched by any triage-workstation object/);
  has(/⚠️.*triageSets\[(pre_a|post_b)\] is not launched/, 0);
});

test('03 N6 defender: factMitigations, reduceNote, options and completion globals', { skip }, () => {
  const d = 'social\\.engagement\\.defender';
  has(new RegExp(`❌.*global 'undeclared_done' \\(${d}\\.onCompleteGlobal\\) is not declared`));
  has(/❌.*global 'nope_a' \(.*steps\[a\]\.onCompleteGlobal\) is not declared/);
  has(/❌.*defender\.steps: id 'a' is used more than once/);
  has(/❌.*defender\.steps\[b\] has no onCompleteGlobal/);
  has(/❌.*factMitigations\[ghost\]\.intel: 'ghost' is not a social\.intelFacts id/);
  has(/❌.*factMitigations\[careers_attachment\]\.intel: fact 'careers_attachment' has no reduceNote/);
  has(/❌.*factMitigations\[hampshire_careers\]\.options needs at least two options/);
  has(/❌.*factMitigations names fact 'hampshire_careers' more than once/);
  has(/❌.*options: id 'a' is used more than once/);
  has(/❌.*options\[a\]\.text is empty/);
  has(/❌.*options\[a\]\.why is empty/);
  has(/❌.*options\[a\]\.good must be true or false/);
  has(/❌.*factMitigations\[hampshire_careers\]\.options has no option with good: true/);
  has(/⚠️.*factMitigations\[pierce_role\]\.options: every option is good/);
  has(/❌.*factMitigations\[5\] has no intel/);
  has(/❌.*factMitigations\[6\] must be an object/);
  has(/❌.*defender\.indicators must be an array/);
  has(/⚠️.*more than one defender-mode case-file/);
  // the clean fixture's defender block (two facts, each with a good and a wrong pick) raised nothing
  assert.deepEqual(lint('tr_clean'), []);
});

test('03 N6 defender: the block must exist and be completable', { skip }, () => {
  const board = () => ({
    globalVariables: { se_board_state: {}, profile_done: false },
    rooms: { r: { objects: [{ type: 'case-file', id: 'b', minigameData: { mode: 'defender' } }] } },
    social: { intelFacts: { f: { text: 't', subject: 'p', reduceNote: 'reduce it' } },
      engagement: { defender: { onCompleteGlobal: 'profile_done',
        factMitigations: [{ intel: 'f', options: [{ id: 'g', text: 'Good', good: true, why: 'w' }, { id: 'x', text: 'Bad', good: false, why: 'w' }] }] } } },
  });
  assert.deepEqual(lintJson(board()), []);

  let j = board();
  delete j.social.engagement;
  expectIn(lintJson(j), /case-file in defender mode, but social\.engagement\.defender is missing/);

  j = board();
  j.social.engagement.defender.factMitigations = [];
  expectIn(lintJson(j), /factMitigations is missing or empty/);

  j = board();
  delete j.social.engagement.defender.onCompleteGlobal;
  expectIn(lintJson(j), /defender\.onCompleteGlobal is missing/);

  j = board();
  delete j.globalVariables.se_board_state;
  expectIn(lintJson(j), /global 'se_board_state'/);

  // a recon-only board with no defender block is untouched
  j = board();
  j.rooms.r.objects[0].minigameData.mode = 'recon';
  delete j.social.engagement;
  assert.deepEqual(lintJson(j), []);

  // a reduceNote with no factMitigations entry is allowed (00 section 1: required only on a named fact)
  j = board();
  j.social.intelFacts.other = { text: 't', subject: 'p', reduceNote: 'also reducible' };
  assert.deepEqual(lintJson(j), []);
});

test('R0: the shipped slice and a scenario with no triage data raise no new lint', { skip }, () => {
  const r = cli('scenarios/test_social_slice/scenario.json.erb', '--strict-social');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /triageSets|defender|triage-workstation/);
  // the earlier mail fixtures hold no triage data and stay clean under the new area
  for (const s of ['sm_clean', 'sm_nosocial']) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      j, = render_erb_to_json(${JSON.stringify(join(root, 'test/js/fixtures/social_mail/scenarios', s, 'scenario.json.erb'))}, {}, include_rendered: true)
      ctx = ValidateSocial::Context.new(json: j, repo_root: '.', social: j['social'])
      puts JSON.generate(j['social'].is_a?(Hash) ? ValidateSocial::Triage.check(ctx) : [])`;
    const o = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
    assert.equal(o.status, 0, o.stderr);
    assert.deepEqual(JSON.parse(o.stdout.trim().split('\n').pop()), []);
  }
});

test('the CLI under --strict-social exits 1 on the broken fixture and 0 on the clean one', { skip }, () => {
  const bad = cli(join(fx, 'tr_broken/scenario.json.erb'), '--strict-social');
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  assert.match(bad.stdout, /triageSets\[bad_shape\]/);
  // The clean fixture raises no triage or defender lint. The only strict-social error it may show is the
  // missing triage-workstation sprite, which the wiring packet (P3-W) adds; that check is not this area's.
  const good = cli(join(fx, 'tr_clean/scenario.json.erb'), '--strict-social');
  const social = good.stdout.split('\n').filter((l) => /❌ SOCIAL|⚠️ SOCIAL/.test(l));
  assert.deepEqual(social.filter((l) => !/assets\/objects\/.*\.png does not exist/.test(l)), []);
});

test('the fixtures were not rewritten by any run', { skip }, () => {
  assert.equal(folderHash(fx), fixturesBefore);
});
