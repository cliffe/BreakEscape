// scripts/validate_social/board.rb: the lints for the optional defender indicators step
// (engagement.defender.indicators, design 03 "Defender mode"). Inline scenarios, lints run
// in-process (never the bare CLI, which rewrites graphs and compiled ink).
// Run with: bundle exec node --test test/js/validator-social-indicators.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function lintJson(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: nil)
    puts JSON.generate(ValidateSocial::Board.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function expectIn(arr, re, n = 1) {
  const hits = arr.filter((s) => re.test(s)).length;
  assert.equal(hits, n, `${re}: ${hits} hit(s)\n${arr.join('\n')}`);
}

const ind = (over = {}) => ({ id: 'ind_a', tell: 'senderAuth', block: true, text: 'Fails alignment', why: 'w', ...over });
const board = (indicators = [ind()]) => ({
  globalVariables: { se_board_state: {}, profile_done: false, d_mit: false, d_ind: false },
  rooms: { r: { objects: [{ type: 'case-file', id: 'b', minigameData: { mode: 'defender' } }] } },
  social: {
    mailClient: { accounts: [{ id: 'guest' }] },
    intelFacts: { f: { text: 't', subject: 'p', reduceNote: 'reduce it' } },
    engagement: { defender: { onCompleteGlobal: 'profile_done', indicators,
      factMitigations: [{ intel: 'f', options: [{ id: 'g', text: 'Good', good: true, why: 'w' }, { id: 'x', text: 'Bad', good: false, why: 'w' }] }] } }
  }
});
const stepped = (indStep = 'ind') => {
  const j = board([ind({ step: indStep })]);
  const d = j.social.engagement.defender;
  d.steps = [{ id: 'mit', onCompleteGlobal: 'd_mit' }, { id: 'ind', onCompleteGlobal: 'd_ind' }];
  d.factMitigations[0].step = 'mit';
  return j;
};

test('a clean indicators block, with and without steps, raises nothing', { skip }, () => {
  assert.deepEqual(lintJson(board()), []);
  assert.deepEqual(lintJson(board([])), []);
  assert.deepEqual(lintJson(stepped()), []);
  const j = board();
  j.social.engagement.defender.indicatorsIntro = 'Your sends, as the SOC saw them.';
  assert.deepEqual(lintJson(j), []);
});

test('entry shape: id, tell, text, why and block', { skip }, () => {
  const issues = lintJson(board([
    ind(), ind(), 'junk', ind({ id: '' }), ind({ id: 'b', tell: '' }), ind({ id: 'c', text: '', why: '', block: 'yes' })
  ]));
  expectIn(issues, /❌.*indicators: id 'ind_a' is used more than once/);
  expectIn(issues, /❌.*indicators\[2\] must be an object/);
  expectIn(issues, /❌.*indicators\[3\] has no id/);
  expectIn(issues, /❌.*indicators\[b\] has no tell/);
  expectIn(issues, /❌.*indicators\[c\]\.text is empty/);
  expectIn(issues, /❌.*indicators\[c\]\.why is empty/);
  expectIn(issues, /❌.*indicators\[c\]\.block must be true or false/);
});

test('a tell no send records is a warning: the indicator would never show', { skip }, () => {
  const issues = lintJson(board([ind({ tell: 'addressedTo' })]));
  expectIn(issues, /⚠️.*indicators\[ind_a\]\.tell 'addressedTo' is not a tell a send records/);
  assert.equal(issues.filter((s) => s.startsWith('❌')).length, 0);
});

test('no mail client: nothing is ever sent, so a warning', { skip }, () => {
  const j = board();
  delete j.social.mailClient;
  expectIn(lintJson(j), /⚠️.*no social\.mailClient, so nothing is ever sent/);
});

test('step binding: undeclared steps, a mitigation with no step, and an empty step fail', { skip }, () => {
  let j = board([ind({ step: 'ind' })]);
  expectIn(lintJson(j), /❌.*indicators\[ind_a\] names step 'ind', but social\.engagement\.defender declares no steps/);

  j = stepped('nope');
  let issues = lintJson(j);
  expectIn(issues, /❌.*indicators\[ind_a\] names step 'nope', which .*steps does not declare/);
  expectIn(issues, /❌.*steps: step 'ind' has no items/);

  j = stepped();
  delete j.social.engagement.defender.factMitigations[0].step;
  issues = lintJson(j);
  expectIn(issues, /❌.*factMitigations\[f\] has no step; .* would never count towards profile_done/);
  expectIn(issues, /❌.*steps: step 'mit' has no items/);

  // an indicator with no step gates nothing, which is allowed
  j = stepped();
  delete j.social.engagement.defender.indicators[0].step;
  issues = lintJson(j);
  expectIn(issues, /❌.*steps: step 'ind' has no items/);
  expectIn(issues, /indicators\[ind_a\] names step/, 0);
});

test('a non-array indicators still fails as before, and a non-string indicatorsIntro fails', { skip }, () => {
  let j = board();
  j.social.engagement.defender.indicators = { a: 1 };
  expectIn(lintJson(j), /❌.*defender\.indicators must be an array/);
  j = board();
  j.social.engagement.defender.indicatorsIntro = 3;
  expectIn(lintJson(j), /❌.*indicatorsIntro must be a string/);
});
