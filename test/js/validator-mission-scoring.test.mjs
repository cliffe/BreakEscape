// scripts/validate_scenario.rb check_mission_scoring: mission.json "scoring"
// (read by BreakEscape::Mission#scoring_mode). An unknown value is an error; a
// mode that only reaches 100 on conclusion warns when no aim can conclude.
// Run with: node --test test/js/validator-mission-scoring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(mission, scenario = null) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      input = JSON.parse(STDIN.read)
      puts JSON.generate(check_mission_scoring(input['mission'], input['scenario']))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ mission, scenario }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const concluding = { objectives: [{ aimId: 'a', missionConclusion: true, tasks: [] }] };
const open = { objectives: [{ aimId: 'a', tasks: [] }] };

test('no scoring key, or a valid one, is fine', { skip }, () => {
    assert.deepEqual(issues({}), []);
    for (const mode of ['tasks', 'partial_then_complete', 'completion']) {
        assert.deepEqual(issues({ scoring: mode }), []);
        assert.deepEqual(issues({ scoring: mode }, concluding), []);
    }
});

test('an unknown scoring value is an error', { skip }, () => {
    for (const bad of ['complete', 'Tasks', '', 100, null]) {
        const out = issues({ scoring: bad });
        assert.equal(out.length, 1, JSON.stringify(bad));
        assert.match(out[0], /INVALID: mission\.json 'scoring' is .* it must be one of tasks, partial_then_complete, completion/);
    }
});

test('a conclusion-only mode with no missionConclusion aim warns', { skip }, () => {
    for (const mode of ['partial_then_complete', 'completion']) {
        const out = issues({ scoring: mode }, open);
        assert.equal(out.length, 1);
        assert.match(out[0], /WARNING: mission\.json 'scoring' is ".*" but no aim has missionConclusion:true/);
    }
    assert.deepEqual(issues({ scoring: 'tasks' }, open), []);
});
