// scripts/validate_social/lab.rb and the scope/plan/report half of board.rb (P6-G):
//   10 N7  every engagement item with a correct or good flag carries a why; every completing global
//          (block and step globals, global_variable_changed event mappings) is declared
//   03 N6  step binding (item.step declared, declared step has items) and exactly one correct option
//          per question card and plan pick
// Inline scenarios, so no live mission content is compared. The lints run in-process.
// Run with: bundle exec node --test test/js/validator-social-lab.test.mjs
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
    puts JSON.generate(ValidateSocial::Board.check(ctx) + ValidateSocial::Lab.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function mini() {
  return {
    objectives: [{ aimId: 'a', tasks: [{ taskId: 't1' }, { taskId: 't2' }] }],
    globalVariables: { signed: false, sc_done: false, q_done: false, plan_ok: false, obj_done: false, rep_ok: false, res_done: false },
    rooms: { r: { npcs: [{ id: 'ruth', eventMappings: [
      { eventPattern: 'global_variable_changed:sc_done', condition: 'value === true', onceOnly: true, completeTask: 't1' },
    ] }] } },
    social: { engagement: {
      scope: {
        onCompleteGlobal: 'signed',
        steps: [{ id: 'scope', onCompleteGlobal: 'sc_done' }, { id: 'stop', onCompleteGlobal: 'q_done' }],
        cards: [
          { id: 'c1', kind: 'sort', step: 'scope', text: 'x', inScope: true, why: 'w' },
          { id: 'q1', kind: 'question', step: 'stop', text: 'q', options: [
            { id: 'a', text: 'a', correct: true, why: 'yes' }, { id: 'b', text: 'b', correct: false, why: 'no' }] },
        ],
      },
      plan: {
        onCompleteGlobal: 'plan_ok',
        steps: [{ id: 'objective', onCompleteGlobal: 'obj_done' }],
        objectives: [
          { id: 'o1', step: 'objective', correct: true, text: 't', why: 'w' },
          { id: 'o2', step: 'objective', correct: false, text: 't', why: 'w' }],
      },
      report: {
        onCompleteGlobal: 'rep_ok',
        steps: [{ id: 'results', onCompleteGlobal: 'res_done' }],
        items: [{ kind: 'confirm', step: 'results', text: 'Read' }],
      },
    } },
  };
}

const mutate = (fn) => { const j = mini(); fn(j); return lintJson(j); };
const hit = (arr, re, n = 1) => assert.equal(arr.filter((s) => re.test(s)).length, n, `${re}\n${arr.join('\n')}`);

test('a clean scope, plan and report scenario raises nothing', { skip }, () => {
  assert.deepEqual(lintJson(mini()), []);
});

test('without a social key the lab lints do not run', { skip }, () => {
  const j = mini(); delete j.social;
  assert.deepEqual(lintJson(j), []);
});

test('03 N6: an item whose step is not declared', { skip }, () => {
  hit(mutate((j) => { j.social.engagement.scope.cards[0].step = 'nope'; }), /❌.*cards\[c1\] names step 'nope', which social.engagement.scope.steps does not declare/);
});

test('03 N6: a declared step with no items', { skip }, () => {
  hit(mutate((j) => { j.social.engagement.scope.steps.push({ id: 'extra', onCompleteGlobal: 'q_done' }); }), /❌.*step 'extra' has no items/);
});

test('03 N6: an item with no step when the block declares steps', { skip }, () => {
  hit(mutate((j) => { delete j.social.engagement.plan.objectives.forEach((o) => delete o.step); }), /❌.*plan\.objectives has no step/);
});

test('03 N6: a step named with no steps declared', { skip }, () => {
  hit(mutate((j) => { delete j.social.engagement.report.steps; }), /❌.*report\.items\[0\] names step 'results', but social.engagement.report declares no steps/);
});

test('03 N6: a confirm item needs its text', { skip }, () => {
  hit(mutate((j) => { delete j.social.engagement.report.items[0].text; }), /❌.*confirm item needs a text label/);
});

test('03 N6: exactly one correct option on a question card', { skip }, () => {
  hit(mutate((j) => { j.social.engagement.scope.cards[1].options[1].correct = true; }), /❌.*q1\] \(question card\) has 2 options with correct: true/);
  hit(mutate((j) => { j.social.engagement.scope.cards[1].options[0].correct = false; }), /❌.*q1\] \(question card\) has 0 options with correct: true/);
});

test('03 N6: exactly one correct option on a plan pick', { skip }, () => {
  hit(mutate((j) => { j.social.engagement.plan.objectives[1].correct = true; }), /❌.*plan\.objectives \(plan pick\) has 2 options with correct: true/);
  hit(mutate((j) => {
    const p = j.social.engagement.plan;
    p.picks = [{ id: 'p', step: 'objective', options: [{ id: 'x', correct: false, why: 'w' }, { id: 'y', correct: false, why: 'w' }] }];
  }), /❌.*picks\[p\] \(plan pick\) has 0 options/);
});

test('03 N6: a sort card needs inScope', { skip }, () => {
  hit(mutate((j) => { delete j.social.engagement.scope.cards[0].inScope; }), /❌.*cards\[c1\]\.inScope must be true or false/);
});

test('10 N7: an option with correct or good needs a why', { skip }, () => {
  hit(mutate((j) => { delete j.social.engagement.plan.objectives[0].why; }), /❌.*objectives\[o1\] has correct but no why/);
  hit(mutate((j) => { j.social.engagement.scope.cards[1].options[1].why = '  '; }), /❌.*options\[b\] has correct but no why/);
  hit(mutate((j) => { j.social.engagement.report.findings = [{ id: 'f', step: 'results', controls: [{ id: 'c', good: true }] }]; }), /❌.*controls\[c\] has good but no why/);
});

test('10 N7: a scored option (correct or good) needs non-blank text, across all four blocks', { skip }, () => {
  // scope: a question-card option (Lab.check)
  hit(mutate((j) => { delete j.social.engagement.scope.cards[1].options[0].text; }), /❌.*options\[a\] has correct but no text; the pick would show a blank button/);
  hit(mutate((j) => { j.social.engagement.scope.cards[1].options[1].text = '  '; }), /❌.*options\[b\] has correct but no text/);
  // plan: a pick-list option (Lab.check)
  hit(mutate((j) => { delete j.social.engagement.plan.objectives[0].text; }), /❌.*objectives\[o1\] has correct but no text/);
  // report: a finding's rootCause and control parts (Lab.check)
  hit(mutate((j) => {
    j.social.engagement.report.findings = [{ id: 'f', step: 'results',
      rootCauses: [{ id: 'rc', correct: true, why: 'w' }],
      controls: [{ id: 'ct', correct: true, text: 't', why: 'w' }] }];
  }), /❌.*rootCauses\[rc\] has correct but no text/);
  // defender: a mitigation option (board.rb owns defender text, so the four blocks are covered together)
  hit(mutate((j) => {
    j.social.engagement.defender = { onCompleteGlobal: 'plan_ok', factMitigations: [
      { intel: 'xx', options: [{ id: 'g', good: true, why: 'w' }, { id: 'b', good: false, text: 't', why: 'w' }] }] };
  }), /❌.*factMitigations\[xx\]\.options\[g\]\.text is empty; the pick would show a blank button/);
});

test('10 N7: block and step globals must be declared', { skip }, () => {
  hit(mutate((j) => { delete j.globalVariables.signed; }), /❌.*'signed'.*scope\.onCompleteGlobal.*not declared/);
  hit(mutate((j) => { delete j.globalVariables.res_done; }), /❌.*'res_done'.*steps\[results\]\.onCompleteGlobal.*not declared/);
  hit(mutate((j) => { delete j.social.engagement.plan.onCompleteGlobal; }), /❌.*plan\.onCompleteGlobal is missing/);
});

test('10 N7: a completing event mapping names a declared global and a real task', { skip }, () => {
  hit(mutate((j) => { delete j.globalVariables.sc_done; }), /❌.*eventPattern names global 'sc_done'/);
  hit(mutate((j) => { j.rooms.r.npcs[0].eventMappings[0].completeTask = 'ghost_task'; }), /❌.*completeTask 'ghost_task' is not a taskId/);
});

// The report's opt-in `question` item (lab_social_engineering design C1 M2; report-model.js).
const withQuestion = (j) => {
  j.social.engagement.report.items = [{ kind: 'question', id: 'rq', step: 'results', text: 'Which?', options: [
    { id: 'y', text: 'yes', correct: true, why: 'w' }, { id: 'n', text: 'no', correct: false, why: 'w' }] }];
};

test('report question item: a clean one raises nothing', { skip }, () => {
  assert.deepEqual(mutate(withQuestion), []);
});

test('report question item: needs an id, text, two options and exactly one correct', { skip }, () => {
  hit(mutate((j) => { withQuestion(j); delete j.social.engagement.report.items[0].id; }), /❌.*items\[0\]: a question item needs an id/);
  hit(mutate((j) => { withQuestion(j); j.social.engagement.report.items[0].text = ' '; }), /❌.*items\[0\]: a question item needs text/);
  hit(mutate((j) => { withQuestion(j); j.social.engagement.report.items[0].options.pop(); }), /❌.*items\[0\]: a question item needs at least two options/);
  hit(mutate((j) => { withQuestion(j); j.social.engagement.report.items[0].options[1].correct = true; }), /❌.*items\[0\] \(report question\) has 2 options with correct: true/);
  hit(mutate((j) => { withQuestion(j); delete j.social.engagement.report.items[0].options[1].why; }), /❌.*options\[n\] has correct but no why/);
});

test('report question item: ids must be unique, and only the report reads the kind', { skip }, () => {
  hit(mutate((j) => { withQuestion(j); j.social.engagement.report.items.push({ ...j.social.engagement.report.items[0] }); }), /❌.*report\.items: id 'rq' is used more than once/);
  hit(mutate((j) => { j.social.engagement.plan.items = [{ kind: 'question', id: 'pq', step: 'objective', text: 'q', options: [] }]; }), /❌.*plan\.items\[0\]: a question item is only read by the report/);
});
