// scripts/validate_scenario.rb check_action_conditions and the schema: a scenario action's
// `condition` (systems/apply-actions.js). The validator holds the grammar the engine's strict
// evaluator reads (utils/global-condition.js parseActionCondition), so each side is run on the
// same list here. Inline fixtures only.
// Run with: node --test test/js/validator-action-condition.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseActionCondition } from '../../public/break_escape/js/utils/global-condition.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const env = { ...process.env, LANG: 'C.UTF-8' };
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
// Say so in the run log: a skipped file otherwise reads as green in a count of files
if (skip) console.error(`validator-action-condition: skipped, ${skip}`);

const ruby = (expr, input) => {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    input = JSON.parse(STDIN.read)
    puts JSON.generate(${expr})`;
  const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(input), encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
};

const GOOD = ['globalVars.a', '!globalVars.a', '! globalVars.a', '!!globalVars.a', 'globalVars.a && !globalVars.b',
  'globalVars.a || globalVars.b', 'globalVars.a && globalVars.b || !globalVars.a', 'globalVars.a === true',
  'globalVars.a !== false', 'globalVars.n >= 3', 'globalVars.n<-1.5', "globalVars.s === 'on'", 'globalVars.s !== "off"',
  'globalVars.a === null', '  globalVars.a  &&  globalVars.b  '];
const BAD = ['', '   ', '!globalVars.a === true', 'globalVars.a == true', 'globalVars.a === maybe', 'a', 'vars.a',
  '(globalVars.a)', 'globalVars.a &&', '|| globalVars.a', 'globalVars.a & globalVars.b', 'globalVars.a === true === true',
  'data.a === true', 'globalVars.', 'not globalVars.a', 'globalVars.a.includes("x")', "globalVars.s === 'it's'",
  // Whitespace is ASCII only on both sides: Unicode spaces (no-break space, byte order mark,
  // line separator) and NUL are refused by the validator and the engine alike
  'globalVars.a\u00a0', '\u00a0globalVars.a', 'globalVars.a\ufeff', 'globalVars.a\u0000', '!\u00a0globalVars.a',
  'globalVars.a\u00a0&& globalVars.b', 'globalVars.n\u2003=== 3', '\u2028globalVars.a', '\u0000'];
// ASCII whitespace of every kind is accepted around terms and operators
GOOD.push('\tglobalVars.a\n', 'globalVars.a\r\n&&\fglobalVars.b\v', '!\t!globalVars.a', 'globalVars.n\t>=\t3');

test('the validator and the engine agree on which action conditions are well formed', { skip }, () => {
  const problems = ruby('input.map { |c| action_condition_problem(c) }', [...GOOD, ...BAD, false, true, null, 3, {}, ['globalVars.a']]);
  GOOD.forEach((c, i) => {
    assert.equal(problems[i], null, `validator accepts ${c}`);
    assert.equal(typeof parseActionCondition(c), 'function', `engine reads ${c}`);
  });
  BAD.forEach((c, i) => {
    assert.equal(typeof problems[GOOD.length + i], 'string', `validator rejects ${JSON.stringify(c)}`);
    assert.equal(parseActionCondition(c), null, `engine refuses ${JSON.stringify(c)}`);
  });
  problems.slice(GOOD.length + BAD.length).forEach((p) => assert.match(p, /is not a string/));
  for (const c of [false, true, null, 3, {}, ['globalVars.a']]) assert.equal(parseActionCondition(c), null);
});

const scenario = () => ({
  globalVariables: { seen: false, vest: false },
  timers: [{ id: 't', startOnGlobal: 'seen', condition: 'globalVars.seen', actions: [
    { type: 'hint', condition: 'globalVars.seen || globalVars.vest', message: 'ok' },
    { type: 'hint', condition: '!globalVars.vest === true', message: 'malformed' },
    { type: 'hint', condition: 'globalVars.undeclared_one', message: 'undeclared' }
  ] }],
  rooms: { lab: { objects: [
    { id: 'shelf', type: 'bookcase', name: 'Shelf', triggerOnInteract: [
      { type: 'hint', condition: true, message: 'not a string' },
      { type: 'confirm_action', text: 'Sure?', onConfirm: [{ type: 'set_global', key: 'seen', value: true, condition: '' }] },
      { type: 'give_item', condition: '!globalVars.seen', item: { type: 'key', id: 'k1', name: 'Key' } },
      { type: 'hint', message: 'no condition' }
    ] },
    { id: 'station', type: 'flag_station', name: 'Station', flagRewards: [
      { type: 'set_global', key: 'vest', value: true, condition: 'globalVars.seen' },
      { type: 'set_global', key: 'seen', value: true }
    ] },
    { id: 'esd', type: 'panel', name: 'Panel', minigameData: { conditionalActions: [
      { condition: 'anything the minigame reads', actions: [{ type: 'hint', condition: 'globalVars.seen &&', message: 'stray' }] }
    ] } }
  ] } }
});

test('a malformed condition, an undeclared global, and a conditioned reward or grant are each reported', { skip }, () => {
  const issues = ruby('check_action_conditions(input)', scenario());
  const has = (re) => assert.ok(issues.some(s => re.test(s)), `expected ${re} in:\n${issues.join('\n')}`);
  has(/❌ INVALID: 'timers\[0\]\/actions\[1\]' \(hint\) condition has a term the engine cannot read: "!globalVars\.vest === true".*never runs/);
  has(/⚠️ WARNING: 'timers\[0\]\/actions\[2\]' \(hint\) condition uses globalVars\.undeclared_one, which is not in globalVariables/);
  has(/❌ INVALID: 'rooms\/lab\/objects\[0\]\/triggerOnInteract\[0\]' \(hint\) condition is not a string \(true\)/);
  has(/❌ INVALID: 'rooms\/lab\/objects\[0\]\/triggerOnInteract\[1\]\/onConfirm\[0\]' \(set_global\) condition is empty/);
  has(/⚠️ WARNING: 'rooms\/lab\/objects\[0\]\/triggerOnInteract\[2\]' \(give_item\) is a give_item with a 'condition'\. The server does not read/);
  has(/❌ INVALID: 'rooms\/lab\/objects\[1\]\/flagRewards\[0\]' \(set_global\) is a flag reward with a 'condition'\. The server applies flag rewards and does not read/);
  has(/❌ INVALID: 'rooms\/lab\/objects\[2\]\/minigameData\/conditionalActions\[0\]\/actions\[0\]' \(hint\) condition has an empty term/);
  assert.equal(issues.length, 7, issues.join('\n'));
  // The timer's own condition and the conditionalActions entry's are not action conditions
  assert.ok(!issues.some(s => /'timers\[0\]'|conditionalActions\[0\]'/.test(s)));
});

test("'||' in an action condition is not flagged by the '&&'-only checks, and the engine-limit pass runs the new check", { skip }, () => {
  const j = scenario();
  assert.ok(ruby('check_engine_limits(input)', j).some(s => /flag reward with a 'condition'/.test(s)));
  // Outside timers (whose paths that check skips anyway): an action in triggerOnInteract and
  // one in a confirm_action's onConfirm, each with '||'
  const objects = j.rooms.lab.objects;
  objects.push({ id: 'desk', type: 'notes', name: 'Desk', triggerOnInteract: [
    { type: 'hint', condition: 'globalVars.seen || globalVars.vest', message: 'or ok' },
    { type: 'confirm_action', text: 'Sure?', onConfirm: [{ type: 'hint', condition: 'globalVars.vest || globalVars.seen', message: 'nested ok' }] },
    // Nested inside an action: a lighting block read by the '&&'-only evaluator is still checked
    { type: 'give_item', item: { type: 'torch', id: 't1', name: 'Torch', lighting: { condition: 'globalVars.seen || globalVars.vest' } } }
  ] });
  // An entry of a conditionalActions list is not an action: its own condition gets the soft warning
  objects[2].minigameData.conditionalActions.push({ condition: 'globalVars.seen || globalVars.vest', actions: [] });
  // Nor is a hash with no type under an action-list key
  objects[3].triggerOnInteract.push({ condition: 'globalVars.vest || globalVars.seen', note: 'no type' });
  const issues = ruby('check_or_in_global_conditions(input)', j);
  assert.deepEqual(issues.filter(s => /objects\[3\]\/triggerOnInteract\[[01]\]'/.test(s) && !/lighting/.test(s)), [],
    `the actions' own '||' conditions are not flagged:\n${issues.join('\n')}`);
  assert.ok(issues.some(s => /❌ INVALID: 'rooms\/lab\/objects\[3\]\/triggerOnInteract\[2\]\/item\/lighting' lighting condition .* uses '\|\|'/.test(s)),
    `the lighting block nested in the give_item is reported:\n${issues.join('\n')}`);
  assert.ok(issues.some(s => /⚠️ WARNING: 'rooms\/lab\/objects\[2\]\/minigameData\/conditionalActions\[1\]' condition .* uses '\|\|'/.test(s)),
    `the conditionalActions entry gets the soft warning:\n${issues.join('\n')}`);
  assert.ok(issues.some(s => /⚠️ WARNING: 'rooms\/lab\/objects\[3\]\/triggerOnInteract\[3\]' condition .* uses '\|\|'/.test(s)),
    `the entry with no type gets the soft warning:\n${issues.join('\n')}`);
  assert.equal(issues.length, 3, issues.join('\n'));
});

test('the schema knows an action condition and wants a non-empty string', { skip }, () => {
  const errors = (json) => {
    const script = `require 'json'
      require 'set'
      require 'json-schema'
      schema = JSON.parse(File.read(${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
      puts JSON.generate(JSON::Validator.fully_validate(schema, JSON.parse(STDIN.read), strict: false))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(json), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop()).filter(e => /condition/.test(e));
  };
  const base = JSON.parse(ruby("JSON.generate(JSON.parse(ERB.new(File.read(File.join(input, 'scenarios/test_exercise_station/scenario.json.erb'))).result))", root));
  const room = Object.values(base.rooms)[0];
  const withAction = (action) => {
    const j = structuredClone(base);
    const r = j.rooms[Object.keys(base.rooms)[0]];
    r.objects = [...(r.objects || []), { type: 'notes', name: 'Probe', takeable: false, triggerOnInteract: [action] }];
    return j;
  };
  assert.ok(room, 'the fixture scenario has a room');
  assert.deepEqual(errors(withAction({ type: 'hint', message: 'm', condition: 'globalVars.a' })), []);
  assert.equal(errors(withAction({ type: 'hint', message: 'm', condition: true })).length, 1);
  assert.equal(errors(withAction({ type: 'hint', message: 'm', condition: '' })).length, 1);
});
