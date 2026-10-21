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
