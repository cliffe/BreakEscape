// conclusionScreen is chosen per scenario (README_scenario_design.md, "The ending convention"):
// bond_visualiser (the credits) for story missions, success (the simple success screen) for short
// training episodes, end_screen for old test and demo scenarios. The schema enum accepts the three
// and rejects anything else; the "missionConclusion with no conclusionScreen" warning names both
// choices. A minimal scenario is written to a temp folder for each case.
// Run with: bundle exec node --test test/js/validator-conclusion-screen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function scenario(conclusionScreen) {
  const aim = {
    aimId: 'finish_aim', title: 'Finish', status: 'active', order: 0, missionConclusion: true,
    tasks: [{ taskId: 'finish', title: 'Finish', type: 'custom', status: 'active' }]
  };
  if (conclusionScreen !== undefined) aim.conclusionScreen = conclusionScreen;
  return {
    scenario_id: 'test_conclusion_screen', scenario_name: 'Conclusion screen fixture',
    scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [aim], globalVariables: {},
    rooms: { r1: { type: 'room_office', connections: {} } }
  };
}

function validate(json) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-conclusion-'));
  try {
    writeFileSync(join(dir, 'scenario.json'), JSON.stringify(json));
    writeFileSync(join(dir, 'mission.json'), JSON.stringify({
      display_name: 'Fixture', description: 'Fixture.', difficulty_level: 1, secgen_scenario: null
    }));
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), join(dir, 'scenario.json'),
      '--skip-ink', '--no-graph'], { encoding: 'utf8', env, cwd: root });
    return (r.stdout || '') + (r.stderr || '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const schemaError = (out) => /conclusionScreen\/type' value/.test(out);
const missingWarning = (out) => out.split('\n').find((l) => /no conclusionScreen/.test(l)) || null;

test('success with a title and body is accepted, with no missing-screen warning', { skip }, () => {
  const out = validate(scenario({ type: 'success', title: 'Inbox sorted', body: 'All done.' }));
  assert.equal(schemaError(out), false, out);
  assert.equal(missingWarning(out), null);
});

test('bond_visualiser and end_screen are still accepted', { skip }, () => {
  for (const type of ['bond_visualiser', 'end_screen']) {
    const out = validate(scenario({ type }));
    assert.equal(schemaError(out), false, `${type}: ${out}`);
  }
});

test('an unknown type fails the schema and lists the three types', { skip }, () => {
  const out = validate(scenario({ type: 'succes' }));
  assert.ok(schemaError(out), out);
  assert.match(out, /end_screen, bond_visualiser, success/);
});

test('missionConclusion with no conclusionScreen warns and names both choices', { skip }, () => {
  const line = missingWarning(validate(scenario(undefined)));
  assert.ok(line, 'expected the missing conclusionScreen warning');
  assert.match(line, /WARNING/);
  assert.match(line, /bond_visualiser/);
  assert.match(line, /"success"/);
  assert.match(line, /training episode/);
});
