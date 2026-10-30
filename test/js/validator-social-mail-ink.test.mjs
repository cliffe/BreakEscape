// scripts/validate_social/mail_ink.rb: lints for ink-driven plain email (ink contacts, timedEmails,
// composeKnot, judgedWhen, sendEmail mappings, composeTo, and the mail tags inside the contact's story).
// The lints are called in-process (never the bare CLI, which rewrites graphs and compiled ink).
// Run with: bundle exec node --test test/js/validator-social-mail-ink.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

// Run ValidateSocial.check on the fixture scenario after `mutate` (Ruby code editing the Hash `j`),
// with an optional extra ink file written under a temp repo root as scenarios/x/ink/bad.ink.
function lint({ mutate = '', ink = null, files = {} } = {}) {
  let repoRoot = root;
  if (ink !== null || Object.keys(files).length) {
    repoRoot = mkdtempSync(join(tmpdir(), 'mail-ink-lint-'));
    mkdirSync(join(repoRoot, 'scenarios/x/ink'), { recursive: true });
    if (ink !== null) writeFileSync(join(repoRoot, 'scenarios/x/ink/bad.ink'), ink);
    for (const [rel, text] of Object.entries(files)) { mkdirSync(dirname(join(repoRoot, rel)), { recursive: true }); writeFileSync(join(repoRoot, rel), text); }
  }
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j, = render_erb_to_json(${JSON.stringify(join(root, 'scenarios/test_ink_email/scenario.json.erb'))}, {}, include_rendered: true)
    ${ink !== null ? "j['social']['mailClient']['contacts'][0]['emailRecord']['storyPath'] = 'scenarios/x/ink/bad.json'" : ''}
    ${mutate}
    imports = prepare_carry_over_globals(j)
    puts JSON.generate(ValidateSocial.check(j, repo_root: ${JSON.stringify(repoRoot)}, valid_item_types: Set.new(%w[notes mail_terminal phone]), imports: imports))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop()).filter((s) => /SOCIAL/.test(s));
}
const hits = (out, re) => out.filter((s) => re.test(s));

test('the fixture scenario raises no social lint', { skip }, () => {
  assert.deepEqual(lint(), []);
});

test('contacts: npc needs a record, a storyPath, a unique id and a sane timedEmails', { skip }, () => {
  const out = lint({ mutate: `
    cs = j['social']['mailClient']['contacts']
    cs << { 'id' => 'ghost', 'addresses' => ['g@x.example'], 'npc' => 'nobody_mail' }
    cs << { 'id' => 'nopath', 'addresses' => ['n@x.example'], 'npc' => 'nopath_mail', 'emailRecord' => { 'displayName' => 'X' } }
    cs << { 'id' => 'dupe', 'addresses' => ['d@x.example'], 'npc' => 'hax_mail', 'emailRecord' => { 'storyPath' => 'scenarios/test_ink_email/ink/hax_mail.json' } }
    cs[0]['timedEmails'] << { 'knot' => 'no_such_knot' }
    cs[0]['timedEmails'] << { 'knot' => 'ask_for_log', 'account' => 'nope', 'delaySeconds' => -1 }
    cs[0]['composeKnot'] = 'missing_compose'
    cs[1]['judgedWhen'] = 'undeclared_flag'` });
  assert.equal(hits(out, /❌.*contacts\[ghost\]\.npc 'nobody_mail' has no emailRecord/).length, 1);
  assert.equal(hits(out, /❌.*contacts\[nopath\]\.emailRecord has no storyPath/).length, 1);
  assert.equal(hits(out, /❌.*contacts\[dupe\]\.npc 'hax_mail' is also the npc of contact 'hax'/).length, 1);
  assert.equal(hits(out, /❌.*contacts\[hax\]\.timedEmails\[1\]\.knot 'no_such_knot' is not a knot/).length, 1);
  assert.equal(hits(out, /❌.*timedEmails\[2\]\.account 'nope'/).length, 1);
  assert.equal(hits(out, /❌.*timedEmails\[2\]\.delaySeconds must be a number/).length, 1);
  assert.equal(hits(out, /❌.*composeKnot 'missing_compose' is not a knot/).length, 1);
  assert.equal(hits(out, /❌.*judgedWhen of social\.mailClient\.contacts\[ines\]/).length, 1);
});

test('judgedWhen on a contact with no target is a warning; an ink contact on a room NPC warns about shared state', { skip }, () => {
  const out = lint({ mutate: `
    j['social']['mailClient']['contacts'][0]['judgedWhen'] = 'found_jump_log'
    j['social']['mailClient']['contacts'] << { 'id' => 'phone', 'addresses' => ['p@x.example'], 'npc' => 'hax_phone' }` });
  assert.equal(hits(out, /⚠️.*contacts\[hax\]\.judgedWhen only matters on a contact that is also a judged target/).length, 1);
  assert.equal(hits(out, /⚠️.*contacts\[phone\]\.npc 'hax_phone' names an existing NPC/).length, 1);
});

test('eventMappings sendEmail: the npc must be an ink contact and the knot must exist', { skip }, () => {
  const out = lint({ mutate: `
    maps = j['rooms']['office']['npcs'][0]['eventMappings']
    maps << { 'eventPattern' => 'room_entered:server_room', 'sendEmail' => { 'npc' => 'ghost_mail', 'knot' => 'k' } }
    maps << { 'eventPattern' => 'room_entered:server_room', 'sendEmail' => { 'npc' => 'hax_mail', 'knot' => 'no_such' } }
    maps << { 'eventPattern' => 'room_entered:server_room', 'sendEmail' => { 'knot' => 'ask_for_log' } }` });
  assert.equal(hits(out, /❌.*sendEmail: 'ghost_mail' is not the npc of any ink contact/).length, 1);
  assert.equal(hits(out, /❌.*sendEmail\.knot 'no_such' is not a knot/).length, 1);
  // the third defaults npc to the owner (hax_phone), which is not an ink contact
  assert.equal(hits(out, /❌.*sendEmail: 'hax_phone' is not the npc of any ink contact/).length, 1);
});

test('composeTo on a mail_terminal must name a contact id or npc', { skip }, () => {
  const out = lint({ mutate: `
    j['rooms']['office']['objects'][0]['minigameData']['composeTo'] = 'hax'
    j['rooms']['office']['objects'] << j['rooms']['office']['objects'][0].merge('id' => 'bad_term', 'minigameData' => { 'accountIds' => ['agent'], 'composeTo' => 'nobody' })` });
  assert.equal(hits(out, /❌.*composeTo 'nobody' is not a contact id or npc/).length, 1);
  assert.equal(hits(out, /composeTo 'hax'/).length, 0);
});

test('the tags in a contact story are linted', { skip }, () => {
  const out = lint({ ink: `VAR found_jump_log = false
=== ask ===
# subject:Hello
Hi.
-> opts
=== opts ===
* Log attached.
    # attach:kit_nope
    # forward:not_a_seed
    # subject:
    # reply_after:soon
    # mail_later:30:no_such_knot
    # send_email:ghost_mail:k
    # compose_reply:no_target
    # trigger_minigame:mail_terminal
    ~ se_influence(1)
    Reply.
    -> DONE
=== on_compose ===
Some prose before the choices.
* Fine
    -> DONE
` });
  assert.equal(hits(out, /❌.*# attach:kit_nope is not a social\.mailClient\.payloadKit id/).length, 1);
  assert.equal(hits(out, /⚠️.*# forward:not_a_seed is not a seeded message id/).length, 1);
  assert.equal(hits(out, /❌.*# subject: has no text/).length, 1);
  assert.equal(hits(out, /❌.*# reply_after:soon must be a number/).length, 1);
  assert.equal(hits(out, /❌.*# mail_later names knot 'no_such_knot'/).length, 1);
  assert.equal(hits(out, /❌.*# send_email:ghost_mail:k names 'ghost_mail'/).length, 1);
  assert.equal(hits(out, /❌.*# compose_reply:no_target is not a social\.phishTargets id/).length, 1);
  assert.equal(hits(out, /⚠️.*# trigger_minigame in an email story/).length, 1);
  assert.equal(hits(out, /⚠️.*se_influence is judged-phishing vocabulary/).length, 1);
  assert.equal(hits(out, /⚠️.*knot on_compose prints text before its first choice/).length, 1);
});

test('# send_email in another NPC story is checked, and so is composeTo in a chat', { skip }, () => {
  const out = lint({
    files: {
      'scenarios/test_ink_email/ink/ines_mail.ink': readFileSync(join(root, 'scenarios/test_ink_email/ink/ines_mail.ink'), 'utf8'),
      'scenarios/x/ink/chat.ink': '=== start ===\nHi.\n# send_email:ines_mail:no_knot:2\n# trigger_minigame:mail_terminal composeTo=nobody\n-> DONE\n'
    },
    mutate: "j['rooms']['office']['npcs'][0]['storyPath'] = 'scenarios/x/ink/chat.json'"
  });
  assert.equal(hits(out, /❌.*send_email:ines_mail:no_knot names knot 'no_knot'/).length, 1);
  assert.equal(hits(out, /❌.*composeTo=nobody is not a contact id or npc/).length, 1);
});
