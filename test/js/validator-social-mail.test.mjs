// scripts/validate_social/mail.rb and board.rb: the Phase 1a lints (P1-H).
//   04 N3 (empty strings, factorStrings shape), 04 N11 (the fixed pre-send line), 04 N10 subset,
//   01 N18 (accounts, mailboxes, seeded mail, contacts, mail_terminal accountIds),
//   03 N6 (readinessSlots), and the channels.email vs room NPC id clash (P0-R R-12).
// Fixtures under test/js/fixtures/social_mail/scenarios. The lints are called in-process (never the
// bare CLI, which rewrites graphs and compiled ink); the CLI runs use --no-graph --skip-ink --no-lint.
// Run with: bundle exec node --test test/js/validator-social-mail.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/social_mail/scenarios');
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

const TYPES = ['notes', 'mail_terminal'];
function lint(scenario) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j, = render_erb_to_json(${JSON.stringify(join(fx, scenario, 'scenario.json.erb'))}, {}, include_rendered: true)
    imports = prepare_carry_over_globals(j)
    puts JSON.generate(ValidateSocial.check(j, repo_root: ${JSON.stringify(root)}, valid_item_types: Set.new(${JSON.stringify(TYPES)}), imports: imports))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function cli(scenario, ...flags) {
  return spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'),
    join(fx, scenario, 'scenario.json.erb'), '--no-graph', '--skip-ink', '--no-lint', ...flags],
  { encoding: 'utf8', env, cwd: root });
}

test('a clean mail and board scenario raises nothing', { skip }, () => {
  assert.deepEqual(lint('sm_clean'), []);
});

test('a board that does not declare se_board_state is flagged (N-1)', { skip }, () => {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = { 'globalVariables' => { 'target_ready_h' => false },
             'social' => { 'intelBoard' => { 'people' => ['h'],
               'readinessSlots' => { 'h' => [{ 'label' => 'L', 'needsIntel' => ['f'],
                 'goalString' => 'g', 'doneString' => 'd' }] } },
               'intelFacts' => { 'f' => { 'text' => 't', 'subject' => 'h' } } } }
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'])
    puts JSON.generate(ValidateSocial::Board.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.ok(out.some((s) => /se_board_state/.test(s)), 'missing se_board_state is flagged');
  // Declaring it clears the error.
  const script2 = script.replace("'target_ready_h' => false", "'target_ready_h' => false, 'se_board_state' => {}");
  const r2 = spawnSync('ruby', ['-e', script2], { encoding: 'utf8', env });
  assert.equal(r2.status, 0, r2.stderr);
  const out2 = JSON.parse(r2.stdout.trim().split('\n').pop());
  assert.ok(!out2.some((s) => /se_board_state/.test(s)), 'declaring se_board_state clears it');
});

test('without a social key the mail and board lints do not run', { skip }, () => {
  assert.deepEqual(lint('sm_nosocial'), []);
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    ctx = ValidateSocial::Context.new(json: {}, repo_root: '.', social: nil)
    puts JSON.generate([ValidateSocial::Mail.check(ctx), ValidateSocial::Board.check(ctx)])`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout.trim().split('\n').pop()), [[], []]);
});

const broken = skip ? [] : lint('sm_broken');
function has(re, n = 1) {
  const hits = broken.filter(s => re.test(s));
  assert.equal(hits.length, n, `${re}: ${hits.length} hit(s)\n${broken.join('\n')}`);
}

test('04 N3: empty authored strings and the factorStrings shape', { skip }, () => {
  has(/❌.*hampshire\]\.hints\[0\] is empty/);
  has(/❌.*hampshire\]\.replies\.landed is empty/);
  has(/❌.*senderTrust\.fail is empty/);
  has(/❌.*senderTrust\.redFlag is empty/);
  has(/❌.*intelFacts\.memo_fact\.text is empty/);
  has(/❌.*careers_attachment\.provides\[0\]\.label is empty/);
  has(/❌.*templates\.ask_review\.text is empty/);
  has(/❌.*attachmentPlausible has the key 'bogus'/);
  has(/❌.*factorStrings has the key 'preSend', which is not a factor/);
  // a null redFlag is "deliberately none" and a valid empty-or-absent pass raises nothing
  has(/redFlag is empty.*hampshire.*senderAuth/, 0);
  // supplying a fail line with no redFlag key at all is a warning
  has(/⚠️.*urgencyCalibrated supplies its own 'fail' line and has no 'redFlag' key/);
  has(/⚠️.*(senderTrust|attachmentPlausible).*no 'redFlag' key/, 0);
});

test('04 N11: no scenario string or key replaces the pre-send line', { skip }, () => {
  has(/❌.*factorStrings\.preSend: the pre-send line is fixed/);
  has(/❌.*\.preSendLine: the pre-send line is fixed/);
  // a reworded copy (curly apostrophe, trailing full stop) is caught; the plain hint is not
  has(/❌.*phishTargets\[1\]\.hints\[0\] repeats or rewords the fixed pre-send line/);
  has(/phishTargets\[1\]\.hints\[1\]/, 0);
});

test('04 N10 subset: templates, subjects, values, outcome owner, trusts, senderAuth', { skip }, () => {
  has(/❌.*nopart\]\.templateSets\.ask is missing or empty/);
  has(/❌.*nopart\]\.templateSets\.pretext names template 'tpl_missing'/);
  has(/❌.*nopart\]\.templateSets\.pretext offers template 'greet_generic', whose part is 'greeting'/);
  has(/❌.*nopart\]: template 'pretext_three' has 3 blanks/);
  has(/❌.*nopart\]: template 'pretext_three' text uses \{d\}/);
  has(/❌.*nopart\]: template 'pretext_dupe' repeats slot id 'x'/);
  has(/❌.*nopart\]: template 'pretext_unused' declares slot 'u'/);
  has(/❌.*nopart\]: slot id 'x' is used in more than one part \(greeting, pretext\)/);
  has(/❌.*nopart\]\.subjects: id 's1' is used more than once/);
  has(/❌.*nopart\]\.subjects\[1\]\.text is empty/);
  has(/❌.*nopart\]\.subjects\[1\]\.topic is missing/);
  has(/❌.*nopart\]\.character 'ghost_char' is not a social\.characters entry/);
  has(/❌.*oneprest\]\.templateSets\.pretext offers 1 template/);
  has(/❌.*oneprest\]\.subjects: every subject has a topic the target opens/);
  has(/❌.*distinctiveValues: 'ghost' is not provided by any fact/);
  has(/❌.*distinctiveValues: 'cv' is not provided/, 0);
  has(/❌.*oneprest\]\.primedFor lists 2 distinctiveValues but minDistinct is 3/);
  has(/❌.*oneprest\]\.primedFor\.trusts: 'nobody' is not a social\.people id/);
  has(/❌.*oneprest\]: attachmentPlausible is required but primedFor\.expectedAttachment/);
  has(/❌.*oneprest\]\.addressedAs: 'ghost_form' is not provided by any fact/);
  has(/❌.*oneprest\] has no character and no outcome\.setGlobal/);
  has(/❌.*oneprest\]\.senderAuth publishes auth but has no dmarcPolicy/);
  has(/❌.*oneprest\]\.requiresIntelToAttempt: 'unknown_thing'/);
  has(/❌.*nosub\]\.templateSets\.pretext offers 5 templates; a closed target offers two to four/);
  has(/❌.*nosub\]\.subjects is missing or empty/);
  has(/❌.*nosub\]\.interests\.topics is missing or empty/);
  has(/❌.*nosub\]\.outcome needs a setGlobal object/);
  has(/❌.*nosub\]\.senderAuth\.dmarcPolicy 'strict' must be/);
  // one outcome owner: a character and an outcome block together
  has(/❌.*(nopart|both)\] has both a character .* and an outcome block/, 2);
  // outcome globals: declared, and read by something
  has(/❌.*global 'phish_nopart_landed' \(outcome of social\.phishTargets\[nopart\]\) is not declared/);
  has(/⚠️.*both\]\.outcome global 'phish_both_landed' is declared but nothing else/);
  has(/phish_hampshire_landed.*nothing else/, 0); // an objective reads it
  has(/phish_pierce_landed.*nothing else/, 0);
  // the engine-written attempt counter of every target is declared
  has(/❌.*global 'phish_(nopart|oneprest|nosub|both)_attempts'/, 4);
  has(/global 'phish_(hampshire|pierce)_attempts'/, 0);
});

test('01 N18: accounts, mailboxes, seeded mail, contacts, devices', { skip }, () => {
  has(/❌.*mailboxes: id 'jed' is used more than once/);
  has(/❌.*mailboxes: 'jed' has owner 'nobody'/);
  has(/❌.*accounts: id 'guest' is used more than once/);
  has(/❌.*accounts\[weird\]\.kind 'secret'/);
  has(/❌.*accounts\[weird\]\.mailbox 'nowhere' is not in/);
  has(/❌.*accounts\[weird\]\.person 'ghost'/);
  has(/❌.*accounts\[foundless\] is a found account with no unlockedBy/);
  has(/❌.*accounts\[nomenu\] is a created account with no createMenu/);
  has(/❌.*global 'acct_nomenu' /);
  has(/❌.*global 'acct_nomenu_choice' /);
  has(/❌.*global 'acct_burner' /);
  has(/❌.*global 'acct_burner_choice' /);
  has(/❌.*global 'acct_undeclared' \(unlockedBy/);
  has(/global 'acct_(freemail|jed_pc)/, 0);
  has(/❌.*accounts\[burner\]\.createMenu: id 'm1' is used more than once/);
  has(/❌.*accounts\[burner\]\.createMenu\[1\] has no displayName/);
  has(/❌.*seededMessages: id 'seed_1' is used more than once/);
  has(/❌.*bad_1\]\.mailbox 'ghostbox'/);
  has(/❌.*bad_1\]\.folder 'draft'/);
  has(/❌.*global 'never_declared' \(deliverAt/);
  has(/❌.*bad_1\]: highlight 'h1' text "absent text" is not an exact substring/);
  has(/❌.*bad_1\]: highlight 'h3' grants 'no_such_fact'/);
  has(/❌.*fact 'memo_fact' is granted by more than one highlight/);
  has(/❌.*bad_2\] is a sent message with no fromAccount/);
  has(/❌.*bad_2\]\.deliverAt needs afterSeconds/);
  has(/❌.*seed_1\]\.fromAccount 'ghostacct'/);
  has(/❌.*c_bad\]\.person 'ghost'/);
  has(/❌.*c_bad\]\.addresses is missing or empty/);
  has(/❌.*c_bad\]\.accountIds names 'phantom'/);
  has(/❌.*c_bad\]\.character 'ghost_char'/);
  has(/❌.*c_bad\]\.targetId 'nothere'/);
  has(/❌.*global 'se_intel_undeclared' \(revealedBy/);
  has(/❌.*c_mismatch\]: target 'pierce' has address/);
  // devices
  has(/❌.*objects\[2\] \(mail_terminal\) has no minigameData\.accountIds/);
  has(/❌.*objects\[3\]: minigameData\.accountIds names 'phantom'/);
  has(/❌.*objects\[3\]: minigameData\.defaultAccount 'freemail' is not in this device's accountIds/);
  has(/❌.*objects\[4\]: minigameData\.defaultAccount 'nonesuch'/);
});

test('00 §10a: mailbox and seeded message ids hold no dot (mailState keys are mailboxes.<box>.<msgId>)', { skip }, () => {
  const social = { mailClient: {
    accounts: [{ id: 'guest', kind: 'given', address: 'guest@workstation.example', mailbox: 'jed.box' }],
    mailboxes: [{ id: 'jed.box' }, { id: 'plain' }],
    seededMessages: [
      { id: 'hello.v2', mailbox: 'plain', folder: 'inbox', from: { name: 'IT', address: 'it@ledgerwell.example' }, subject: 's', body: 'b' },
      { id: 'hello', mailbox: 'plain', folder: 'inbox', from: { name: 'IT', address: 'it@ledgerwell.example' }, subject: 's', body: 'b' }
    ]
  } };
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    require 'json'
    social = JSON.parse(${JSON.stringify(JSON.stringify(social))})
    ctx = ValidateSocial::Context.new(json: { 'social' => social }, repo_root: '.', valid_item_types: Set.new, imports: {}, social: social)
    puts JSON.generate(ValidateSocial::Mail.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  const issues = JSON.parse(r.stdout.trim().split('\n').pop());
  const dotted = issues.filter(s => /contains a dot/.test(s));
  assert.equal(dotted.length, 2, issues.join('\n'));
  assert.ok(dotted.some(s => /❌.*mailboxes: id 'jed\.box' contains a dot/.test(s)));
  assert.ok(dotted.some(s => /❌.*seededMessages: id 'hello\.v2' contains a dot/.test(s)));
});

test('03 N6: readinessSlots', { skip }, () => {
  has(/❌.*readinessSlots\.ghost is not a social\.phishTargets id/);
  has(/❌.*readinessSlots\.nopart is missing or empty/);
  has(/❌.*readinessSlots\.nosub is missing or empty/);
  has(/❌.*readinessSlots\.both is missing or empty/);
  has(/❌.*oneprest\[0\]\.label is empty/);
  has(/❌.*oneprest\[0\]\.goalString is empty/);
  has(/❌.*oneprest\[0\]\.needsIntel: 'no_fact'/);
  has(/❌.*oneprest\[1\] needs neither needsIntel nor needsGlobal/);
  has(/❌.*oneprest\[2\]\.needsGlobal: 'undeclared_flag' is not declared/);
  has(/oneprest\[2\]\.needsGlobal: '(dock_ready|acct_jed_pc)'/, 0); // declared booleans pass; only the number below fails
  has(/❌.*oneprest\[3\]\.needsGlobal: 'phish_pierce_attempts' is not a boolean/);
  has(/❌.*readinessSlots\.pierce: addressedAs 'pierce_short' is provided only by 'pierce_role'/);
  has(/❌.*readinessSlots\.pierce: contact 'c_mismatch' is revealed by 'se_intel_hampshire_careers'/);
  has(/❌.*intelBoard\.people lists 'phantom'/);
});

test('P0-R R-12: a channels.email id that a room NPC holds is an error, only with an emailRecord', { skip }, () => {
  has(/❌.*characters\.clasher\.channels\.email 'clash_mail' is also the id of an NPC in room office/);
  has(/characters\.okay\.channels\.email/, 0); // no emailRecord, so no headless record to drop
  has(/characters\.headless\.channels\.email/, 0); // its own id
});

// ── P1-M (1b): the character email-story checks (04 N10, 01 N18) and the closed-target decoy ──
// Built in-process from crafted social plus the .ink fixtures in ../fixtures/social_mail/ink,
// which sit outside `fx`, so the folder-unchanged assertion is untouched and nothing is written.
const inkPath = (name) => `test/js/fixtures/social_mail/ink/${name}`;

function mailCall(expr, social, json = {}) {
  const j = { rooms: {}, ...json, social };
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    require 'json'
    social = JSON.parse(${JSON.stringify(JSON.stringify(social))})
    json = JSON.parse(${JSON.stringify(JSON.stringify(j))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: ${JSON.stringify(root)}, valid_item_types: Set.new, imports: {}, social: social)
    puts JSON.generate(${expr})`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function emailStories(chars, targets, accounts = []) {
  const social = { characters: chars, phishTargets: targets, mailClient: { accounts } };
  return mailCall('ValidateSocial::Mail.email_stories(ctx)', social);
}

test('04 N10: a well-formed character on_email raises nothing (both the else and early-return idioms)', { skip }, () => {
  const ok = emailStories(
    { pierce: { emailRecord: { storyPath: inkPath('mail_ok.ink') }, emailKnots: { guest: 'give_more' } } },
    [{ id: 'pierce', character: 'pierce' }], [{ id: 'guest' }]);
  assert.deepEqual(ok, [], ok.join('\n'));
  const divert = emailStories(
    { pierce: { emailRecord: { storyPath: inkPath('mail_ok_divert.ink') } } },
    [{ id: 'pierce', character: 'pierce' }]);
  assert.deepEqual(divert, [], divert.join('\n'));
});

test('04 N10: on_email knot missing, undeclared email_* VARs, and se_influence on one branch only', { skip }, () => {
  const noKnot = emailStories({ pierce: { emailRecord: { storyPath: inkPath('mail_no_onemail.ink') } } },
    [{ id: 'pierce', character: 'pierce' }]);
  assert.ok(noKnot.some((s) => /❌.*mail_no_onemail\.ink has no '=== on_email ===' knot/.test(s)), noKnot.join('\n'));

  const undeclared = emailStories({ pierce: { emailRecord: { storyPath: inkPath('mail_undeclared.ink') } } },
    [{ id: 'pierce', character: 'pierce' }]);
  assert.ok(undeclared.some((s) => /reads email_urgency but declares no 'VAR email_urgency'/.test(s)), undeclared.join('\n'));
  assert.ok(undeclared.some((s) => /reads email_attachment but declares no 'VAR email_attachment'/.test(s)));
  // the declared email_landed is never flagged
  assert.ok(!undeclared.some((s) => /email_landed but declares no/.test(s)));

  const oneBranch = emailStories({ pierce: { emailRecord: { storyPath: inkPath('mail_one_branch.ink') } } },
    [{ id: 'pierce', character: 'pierce' }]);
  assert.ok(oneBranch.some((s) => /❌.*on_email.*must call se_influence on both branches/.test(s)), oneBranch.join('\n'));

  // a character target whose email story file does not exist is skipped here (owned by the ink layer)
  const missing = emailStories({ pierce: { emailRecord: { storyPath: 'scenarios/none/ink/nope.ink' } } },
    [{ id: 'pierce', character: 'pierce' }]);
  assert.deepEqual(missing, [], missing.join('\n'));
});

test('04 N10 / 01 N18: #compose_reply resolves to a same-character target; emailKnots name real knots and accounts', { skip }, () => {
  const out = emailStories(
    { lord: { emailRecord: { storyPath: inkPath('mail_bad_reply.ink') }, emailKnots: { nosuch_acct: 'on_email', guest: 'ghost_knot' } } },
    [{ id: 'lord', character: 'lord' }, { id: 'pierce', character: 'pierce' }],
    [{ id: 'guest' }]);
  assert.ok(out.some((s) => /#compose_reply:ghost_target names 'ghost_target', which is not a social\.phishTargets id/.test(s)), out.join('\n'));
  assert.ok(out.some((s) => /#compose_reply:pierce names target 'pierce', whose character is "pierce", not 'lord'/.test(s)));
  assert.ok(out.some((s) => /emailKnots key 'nosuch_acct' is not a social\.mailClient\.accounts id/.test(s)));
  assert.ok(out.some((s) => /emailKnots maps 'guest' to knot "ghost_knot", which the email story.*does not define/.test(s)));
});

test('04 N10: a closed target needs a pretext decoy that cannot satisfy pretextRelevant; open targets are exempt', { skip }, () => {
  const facts = {
    memo: { provides: [{ type: 'document', value: 'balance_sheet', kind: 'distinctive' }] },
    portal: { provides: [{ type: 'portal', value: 'staff_portal_name', kind: 'distinctive' }] },
    date: { provides: [{ type: 'date', about: 'release', value: 'mon_6th', kind: 'distinctive' }] }
  };
  const templates = {
    pretext_sheet: { part: 'pretext', text: 'Here is {document}.', slots: [{ id: 'document', type: 'document' }] },
    pretext_generic: { part: 'pretext', text: 'See attached.', slots: [] },
    pretext_payslip: { part: 'pretext', text: '{portal} {when}', slots: [{ id: 'portal', type: 'portal' }, { id: 'when', type: 'date', about: 'release' }] },
    pretext_password: { part: 'pretext', text: 'Expires {expiry}', slots: [{ id: 'expiry', type: 'date' }] }
  };
  const decoy = (primed, set) => {
    const social = { intelFacts: facts, templates, phishTargets: [{ id: 'x', primedFor: primed, templateSets: { pretext: set } }] };
    const expr = `ValidateSocial::Mail.closed_target_decoy(ctx, social['phishTargets'][0], social['templates'], 'social.phishTargets[x]')`;
    return mailCall(expr, social);
  };
  const DECOY = /needs one plausible-but-wrong decoy/;
  // pierce pattern: sheet (satisfies) + generic (decoy) → fine
  assert.deepEqual(decoy({ trusts: ['baker'], distinctiveValues: ['balance_sheet'], minDistinct: 1 }, ['pretext_sheet', 'pretext_generic']), []);
  // lord pattern (minDistinct 2): payslip (satisfies) + password (decoy, its date slot can't carry mon_6th) → fine
  assert.deepEqual(decoy({ trusts: ['portal'], distinctiveValues: ['staff_portal_name', 'mon_6th'], minDistinct: 2 }, ['pretext_payslip', 'pretext_password']), []);
  // no decoy: every pretext satisfies → flagged
  assert.ok(decoy({ trusts: ['baker'], distinctiveValues: ['balance_sheet'], minDistinct: 1 }, ['pretext_sheet']).some((s) => DECOY.test(s)));
  assert.ok(decoy({ trusts: ['portal'], distinctiveValues: ['staff_portal_name', 'mon_6th'], minDistinct: 2 }, ['pretext_payslip']).some((s) => DECOY.test(s)));
  // an open inbox (trusts *) is exempt even with a single satisfying pretext
  assert.deepEqual(decoy({ trusts: ['*'], distinctiveValues: ['balance_sheet'], minDistinct: 1 }, ['pretext_sheet']), []);
});

test('04 N10: expectedLink shape (brandId/realDomain present); the brand-in-07 cross-check is landing.rb', { skip }, () => {
  const link = (el) => mailCall(`ValidateSocial::Mail.target_expected_link({ 'expectedLink' => ${el} }, 'w')`, {});
  assert.deepEqual(link(`{ 'brandId' => 'ledgerwell', 'realDomain' => 'ledgerwell.example' }`), []);
  assert.ok(link(`{ 'realDomain' => 'x.example' }`).some((s) => /expectedLink\.brandId is missing/.test(s)));
  assert.ok(link(`{ 'brandId' => 'b' }`).some((s) => /expectedLink\.realDomain is missing/.test(s)));
  assert.ok(link(`'x'`).some((s) => /expectedLink must be an object/.test(s)));
  assert.deepEqual(mailCall(`ValidateSocial::Mail.target_expected_link({}, 'w')`, {}), []);
});

test('T2-8: boostIfGlobal/strictIfGlobal pointed at a non-boolean global is warned (the hook needs === true)', { skip }, () => {
  const bias = (target, globalVariables) =>
    mailCall(`ValidateSocial::Mail.target_factor_bias(ctx, social['phishTargets'][0], 'social.phishTargets[x]')`,
      { phishTargets: [target] }, { globalVariables });
  // A boolean flag global: fine.
  assert.deepEqual(bias({ id: 'x', boostIfGlobal: { helpdesk_alerted: 'senderTrust' } }, { helpdesk_alerted: false }), []);
  // A number global: the === true compare can never fire, so warn.
  const num = bias({ id: 'x', boostIfGlobal: { teague_influence: 'senderTrust' } }, { teague_influence: 0 });
  assert.ok(num.some((s) => /boostIfGlobal names global 'teague_influence'.*non-boolean/.test(s)), num.join('\n'));
  // strictIfGlobal is checked the same way.
  const str = bias({ id: 'x', strictIfGlobal: { some_count: 'addressedTo' } }, { some_count: 3 });
  assert.ok(str.some((s) => /strictIfGlobal names global 'some_count'.*non-boolean/.test(s)), str.join('\n'));
  // An undeclared global is left to the other declared-global lints, not this one.
  assert.deepEqual(bias({ id: 'x', boostIfGlobal: { undeclared_flag: 'senderTrust' } }, {}), []);
});

test('sender-name provides personOfValue cannot resolve (itdesk_name): error only when no trusted person is reachable, otherwise a warning', { skip }, () => {
  const RE = /offers no value that resolves to a trusted person \(baker\).*'itdesk_name'.*personOfValue cannot resolve/;
  // the fixture is sm_clean with baker_full renamed itdesk_name: the only route to Jed, and senderTrust is required
  const found = lint('sm_sender_name');
  assert.equal(found.filter((s) => RE.test(s) && s.startsWith('❌')).length, 1, found.join('\n'));
  assert.deepEqual(found.filter((s) => !RE.test(s)), lint('sm_clean'));
  assert.deepEqual(lint('sm_clean').filter((s) => /personOfValue/.test(s)), []);
  const bad = cli('sm_sender_name', '--strict-social');
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  assert.match(bad.stdout, /personOfValue cannot resolve/);
  const social = (over, provides) => ({
    intelFacts: { f: { provides: provides || [{ type: 'name', about: 'sender', value: 'itdesk_name', kind: 'distinctive' }] } },
    templates: { from_named: { part: 'from', text: '{sender_name}', slots: [{ id: 'sender_name', type: 'name', about: 'sender' }] } },
    phishTargets: [{ id: 'x', primedFor: { trusts: ['baker'] }, templateSets: { from: ['from_named'] }, ...over }]
  });
  const run = (s) => mailCall("ValidateSocial::Mail.target_sender_values(ctx, social['phishTargets'][0], social['templates'], 'w')", s);
  const REQ = { requiredFactors: ['senderTrust'] };
  const decoy = { type: 'name', about: 'sender', value: 'itdesk_name' };
  const good = { type: 'name', about: 'sender', value: 'baker_full' };
  const errs = (r) => r.filter((m) => m.startsWith('❌')).length;
  const warns = (r) => r.filter((m) => m.startsWith('⚠️')).length;
  let r = run(social(REQ));
  assert.deepEqual([errs(r), warns(r)], [1, 0]);
  // a decoy beside a resolvable trusted value is a warning, not an error (test_social_slice shape)
  r = run(social(REQ, [decoy, good]));
  assert.deepEqual([errs(r), warns(r)], [0, 1]);
  // a resolvable value for the wrong person does not count as reaching a trusted one
  r = run(social(REQ, [decoy, { type: 'name', about: 'sender', value: 'other_full' }]));
  assert.deepEqual([errs(r), warns(r)], [1, 0]);
  // advisory senderTrust: a warning
  r = run(social({ advisoryFactors: ['senderTrust'] }));
  assert.deepEqual([errs(r), warns(r)], [0, 1]);
  assert.deepEqual(run(social({})), []);
  assert.deepEqual(run(social({ ...REQ, primedFor: { trusts: ['*'] } })), []);
  assert.deepEqual(run(social(REQ, [{ type: 'name', about: 'sender', value: 'itdesk_full' }])), []); // resolves to a person, nothing to flag
  assert.deepEqual(run(social(REQ, [{ type: 'name', about: 'recipient', value: 'itdesk_name' }])), []);
  assert.deepEqual(run(social(REQ, [{ type: 'address', rule: 'sender', value: 'x' }])), []);
});

test('--strict-social: exit 1 on the broken fixture, 0 on the clean one and on a social-free one', { skip }, () => {
  const bad = cli('sm_broken', '--strict-social');
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  assert.match(bad.stdout, /--strict-social: \d+ social lint error/);
  const plain = cli('sm_broken');
  assert.equal(plain.status, 0, plain.stdout + plain.stderr);
  const clean = cli('sm_clean', '--strict-social');
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  const nosocial = cli('sm_nosocial', '--strict-social');
  assert.equal(nosocial.status, 0, nosocial.stdout + nosocial.stderr);
});

// Keep last: the runs above must not have written to the fixture folder
test('the fixture folder is unchanged by the runs', () => {
  assert.equal(folderHash(fx), fixturesBefore);
});
