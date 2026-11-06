// scripts/validate_scenario.rb check_carry_over: importGlobals / exportGlobals
// (docs/agents/CARRY_OVER_PLAN.md 2.8). A source and reader pair under
// test/js/fixtures/carry_over/scenarios. Fixture only.
// Run with: node --test test/js/validator-carry-over.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/carry_over');
const ruby = spawnSync('ruby', ['--version']);

function run(mission) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j = JSON.parse(File.read(${JSON.stringify(join(fx, 'scenarios', mission, 'scenario.json'))}))
    own = (j['globalVariables'] || {}).dup
    imports = prepare_carry_over_globals(j)
    puts JSON.generate({ issues: check_carry_over(j, ${JSON.stringify(fx)}, ${JSON.stringify(mission)},
                                                   ${JSON.stringify(join(fx, 'scenarios'))}, imports, own),
                         globals: j['globalVariables'] })`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('a clean source raises nothing', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
  assert.deepEqual(run('m91_source').issues, []);
});

test('the reader: every broken declaration and every write to an import is reported',
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const { issues, globals } = run('m92_reader');
    const has = (re, n = 1) => {
      const hits = issues.filter(s => re.test(s));
      assert.equal(hits.length, n, `${re}: ${hits.length} hit(s)\n${issues.join('\n')}`);
    };
    // imports are declared globals for the other checks, at their defaults
    assert.equal(globals.m91_assets_seized, false);
    assert.equal(globals.m91_completed, false);
    assert.equal(globals.local_flag, false, "the mission's own global is not overwritten by a colliding import");

    has(/❌.*does not list 'secret' in its exportGlobals/);
    has(/❌.*default "0" for 'm91_count' is not the same type/);
    has(/❌.*'Bad-Name' must be lower_snake_case/);
    has(/❌.*'local_flag' collides with this mission's own globalVariables/);
    has(/❌.*source mission 'm99_missing' not found/);
    has(/❌.*imports from this mission itself/);
    has(/❌.*exportGlobals lists 'm91_assets_seized', which this mission imports/);
    has(/❌.*exportGlobals lists 'missing_one', which is not in this mission's globalVariables/);
    has(/⚠️.*exported global 'never_written' is never written/);
    has(/❌.*concludeRequires\.globals uses imported 'm91_completed'/);
    has(/❌.*unlockCondition gates on imported 'm91_assets_seized'/);
    has(/⚠️.*condition on imported 'm91_assets_seized' and changes the game \(setVisible\)/);
    has(/⚠️.*'m91_team' is compared with "purple"/);
    // meltdown (a tag) and fracture (an ink assignment) are both values m91 assigns
    has(/compared with "(meltdown|fracture)"/, 0);
    // writes: the onRead setVariable, the ink assignment and the #set_global tag
    has(/❌.*imported global 'm91_assets_seized' is written at \/rooms\/lobby\/objects\[0\]\/onRead\/setVariable/);
    has(/❌.*imported global 'm91_assets_seized' is written at scenarios\/m92_reader\/ink\/reader\.ink:9/);
    has(/❌.*imported global 'm91_team' is written at scenarios\/m92_reader\/ink\/reader\.ink:7/);
    has(/local_flag' is written/, 0);
    // more write paths: #set_variable, onComplete.setGlobal, globalVarOnKO, an applyActions set_global
    has(/❌.*imported global 'm91_completed' is written at scenarios\/m92_reader\/ink\/reader\.ink:10/);
    has(/❌.*imported global 'm91_assets_seized' is written at \/objectives\[0\]\/tasks\[0\]\/onComplete\/setGlobal/);
    has(/❌.*imported global 'm91_completed' is written at \/rooms\/lobby\/npcs\[0\]\/globalVarOnKO/);
    has(/❌.*imported global 'm91_team' is written at .*applyActions set_global/);
    // more broken declarations
    has(/❌.*'m91_count' needs a "default"/);
    has(/❌.*importGlobals\[10\] needs a "var"/);
    has(/❌.*importGlobals\[11\]: the "completed" form takes only/);
    has(/❌.*importGlobals\[12\]: "as" is required when "from" \(lab_widgets\)/);
  });
