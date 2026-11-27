// ENG-04: the awareness validator and schema for the consequence-flip `mistake` stage and the
// montage flip (scripts/validate_social/awareness.rb, scripts/scenario-schema.json). One failing case
// per lint, built by mutating test/js/fixtures/social_awareness/clean_mistake.json.
// Run with: bundle exec node --test test/js/validator-social-mistake.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = (n) => JSON.parse(readFileSync(join(root, 'test/js/fixtures/social_awareness', n), 'utf8'));
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function lint(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: json['importGlobals'])
    puts JSON.generate(ValidateSocial::Awareness.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
function schemaRun(list) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    JSON::Validator.use_multi_json = false
    out = JSON.parse($stdin.read).map do |j|
      social, other = ValidateSocial.split_schema_errors(validate_json(j, ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
      { social: social, other: other }
    end
    puts JSON.generate(out)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(list), maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);
const clone = (o) => JSON.parse(JSON.stringify(o));
const ep = (j) => j.social.awarenessEpisode;
const kiosk = (j) => j.rooms.ep_room.objects[0];
const mk = () => fx('clean_mistake.json');
const beatsOf = (j) => ep(j).mistake.beats;

test('a clean consequence shell (mistake, montage, no attack block) gives no issues', { skip }, () => {
  assert.deepEqual(lint(mk()), []);
});

test('attack_checks is skipped without an attack-artefact stage; a stray attack block is an error', { skip }, () => {
  const j = mk();
  ep(j).attack = { target: 'nobody', maxMessages: 9 };
  const out = lint(j);
  expectIn(out, /a mistake episode has an attack block/);
  assert.equal(out.length, 1, out.join('\n'));
  // an attack-artefact episode still needs its attack block, as before
  const full = fx('clean_full.json');
  delete ep(full).attack;
  expectIn(lint(full), /a full episode needs an attack block/);
});

test('the stage order brief mistake flip defend debrief is allowed; other orders with mistake are not', { skip }, () => {
  let j = mk();
  ep(j).stages = ['brief', 'mistake', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'full' has stages/);
  j = mk();
  ep(j).stages = ['brief', 'osint', 'mistake', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'full' has stages/);
  j = mk();
  ep(j).variant = 'defendOnly';
  ep(j).id = 'e11_stub_defend';
  kiosk(j).minigameData.episodeId = 'e11_stub_defend';
  expectIn(lint(j), /variant 'defendOnly' has stages/);
});

test('a beat needs exactly one safe option', { skip }, () => {
  let j = mk();
  beatsOf(j)[0].options.forEach((o) => { o.safe = false; delete o.approvedRoute; });
  expectIn(lint(j), /has 0 options with safe: true; it must have exactly one/);
  j = mk();
  beatsOf(j)[0].options.forEach((o) => { o.safe = true; });
  expectIn(lint(j), /has 2 options with safe: true; it must have exactly one/);
  j = mk();
  beatsOf(j)[0].options[0].approvedRoute = true;
  expectIn(lint(j), /marked approvedRoute but is not safe/);
  j = mk();
  beatsOf(j)[0].options = [beatsOf(j)[0].options[0]];
  expectIn(lint(j), /at least two options/);
});

test('beat and option shape: ids, situation, label, scored, duplicates', { skip }, () => {
  let j = mk();
  beatsOf(j)[1].id = 'overtime_sheet';
  expectIn(lint(j), /id 'overtime_sheet' is used by an earlier beat/);
  j = mk();
  beatsOf(j)[0].options[1].id = 'send_wrong_sam';
  expectIn(lint(j), /id 'send_wrong_sam' is used by an earlier option/);
  j = mk();
  beatsOf(j)[0].situation = ' ';
  expectIn(lint(j), /situation is empty or missing/);
  j = mk();
  beatsOf(j)[0].options[0].label = '';
  expectIn(lint(j), /label is empty or missing/);
  j = mk();
  ep(j).mistake.scored = true;
  expectIn(lint(j), /mistake\.scored is true; it must be false/);
  j = mk();
  ep(j).mistake.beats = [];
  expectIn(lint(j), /beats must be a non-empty array/);
});

test('flipBeat must name a beat', { skip }, () => {
  let j = mk();
  ep(j).mistake.flipBeat = 'not_a_beat';
  expectIn(lint(j), /flipBeat 'not_a_beat' is not a beat id/);
  j = mk();
  delete ep(j).mistake.flipBeat;
  expectIn(lint(j), /flipBeat is missing/);
});

test('flipMontageByChoice keys must be real beats and options, with text', { skip }, () => {
  let j = mk();
  ep(j).strings.flipMontageByChoice.ghost = { x: 'y' };
  expectIn(lint(j), /flipMontageByChoice\.ghost is not a beat id/);
  j = mk();
  ep(j).strings.flipMontageByChoice.rota_app.ghost_option = 'y';
  expectIn(lint(j), /flipMontageByChoice\.rota_app\.ghost_option is not an option of beat 'rota_app'/);
  j = mk();
  ep(j).strings.flipMontageByChoice.rota_app.use_app = '  ';
  expectIn(lint(j), /flipMontageByChoice\.rota_app\.use_app has no text/);
  j = mk();
  delete ep(j).strings.flipMontageByChoice.rota_app;
  expectIn(lint(j), /^⚠️ SOCIAL: awarenessEpisode: strings\.flipMontageByChoice has no lines for beat 'rota_app'/);
  j = mk();
  delete ep(j).strings.flipMontageByChoice;
  expectIn(lint(j), /needs strings\.flipMontageByChoice/);
});

test('the mistake block, the stage and flip.mode go together', { skip }, () => {
  let j = mk();
  delete ep(j).mistake;
  expectIn(lint(j), /stages lists 'mistake' but there is no awarenessEpisode\.mistake block/);
  j = mk();
  delete ep(j).flip;
  expectIn(lint(j), /flip\.mode is not "montage"/);
  j = mk();
  ep(j).flip.mode = 'collage';
  expectIn(lint(j), /flip\.mode is "collage"; the only mode is "montage"/);
  j = fx('clean_full.json');
  ep(j).flip = { mode: 'montage' };
  expectIn(lint(j), /flip\.mode is "montage" but there is no awarenessEpisode\.mistake block/);
  j = fx('clean_full.json');
  ep(j).mistake = clone(ep(mk()).mistake);
  expectIn(lint(j), /mistake is set but stages has no 'mistake'/);
});

test('a defendOnly episode carries no mistake or flip block', { skip }, () => {
  const j = fx('clean_defend_only.json');
  assert.deepEqual(lint(j), []);
  ep(j).mistake = clone(ep(mk()).mistake);
  ep(j).flip = { mode: 'montage' };
  const out = lint(j);
  expectIn(out, /defendOnly episode has an awarenessEpisode\.mistake block/);
  expectIn(out, /defendOnly episode has an awarenessEpisode\.flip block/);
  // a flipHeading alone is fine on a defend-only shell
  const k = fx('clean_defend_only.json');
  ep(k).strings.flipHeading = 'Six months later';
  assert.deepEqual(lint(k), []);
});

test('the facilitator may carry a mistake line', { skip }, () => {
  const j = mk();
  ep(j).facilitated = true;
  ep(j).strings.facilitator = { brief: 'a', mistake: 'b', flip: 'c', defend: 'd', debrief: 'e', pause: 'f' };
  assert.deepEqual(lint(j), []);
});

test('schema: the consequence shell passes; typos in mistake, flip and strings fail under #/social', { skip }, () => {
  const cases = [
    ['a mistyped mistake key', (e) => { e.mistake.flipBeet = 'x'; }, 'flipBeet'],
    ['a mistyped beat key', (e) => { e.mistake.beats[0].sitation = 'x'; }, 'sitation'],
    ['a mistyped option key', (e) => { e.mistake.beats[0].options[0].safee = true; }, 'safee'],
    ['safe as a string', (e) => { e.mistake.beats[0].options[0].safe = 'no'; }, 'boolean'],
    ['a bad flip.mode', (e) => { e.flip.mode = 'collage'; }, 'collage'],
    ['a mistyped flip key', (e) => { e.flip.mod = 'montage'; }, 'mod'],
    ['a montage line that is not text', (e) => { e.strings.flipMontageByChoice.rota_app.use_app = 3; }, 'string'],
    ['a mistyped sandbox key', (e) => { e.strings.sandbox = { intr: 'x' }; }, 'intr']
  ];
  const scenarios = [mk(), ...cases.map(([, mutate]) => {
    const j = mk();
    mutate(j.social.awarenessEpisode);
    return j;
  })];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 1];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('#/social/awarenessEpisode') && e.includes(detail)),
      `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});
