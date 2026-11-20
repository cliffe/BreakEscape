// The validator warns when an alarm-panel lamp names a CSS class with no fill rule in
// alarm-panel-minigame.css (the lamp would paint black). Real lamp classes raise nothing.
// Run with: node --test test/js/validator-alarm-lamp-class.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function fixture(lamps) {
  return {
    scenario_id: 'test_alarm', scenario_name: 'Alarm fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [{ aimId: 'a1', title: 'A', status: 'active', order: 1, tasks: [
      { taskId: 't1', title: 'Look', type: 'collect_items', targetItems: ['k'], targetCount: 1, status: 'active' }] }],
    globalVariables: { v: false },
    rooms: { r1: { type: 'room_office', connections: {}, npcs: [], objects: [
      { type: 'pc', id: 'board', name: 'Board', takeable: false, minigameData: { lamps } },
      { type: 'key', id: 'k', name: 'Key', takeable: true }] } }
  };
}

function output(lamps) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-alarm-'));
  try {
    const sdir = join(dir, 'test_alarm');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    writeFileSync(file, JSON.stringify(fixture(lamps)));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({ display_name: 'F', description: 'F.', difficulty_level: 1, secgen_scenario: null }));
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), file, '--no-graph', '--no-lint', '--skip-ink', '--no-known-failures'],
      { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, cwd: root });
    return r.stdout || '';
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('an undefined lamp class warns, naming the lamp and the class', { skip }, () => {
  const out = output([{ label: 'DOOR ONE', variable: 'v', offClass: 'ap-off', onClass: 'ap-bogus' }]);
  assert.ok(/DOOR ONE\)' onClass names class 'ap-bogus'/.test(out), 'warning names lamp and class');
});

test('a multi-state cssClass that is undefined warns', { skip }, () => {
  const out = output([{ label: 'MULTI', multiState: true, variables: ['v'], states: [{ variable: 'v', cssClass: 'ap-nope', statusText: 'X' }] }]);
  assert.ok(/MULTI\)' states\[0\]\/cssClass names class 'ap-nope'/.test(out), 'multi-state class flagged');
});

test('defined classes and omitted classes raise no lamp warning', { skip }, () => {
  const out = output([{ label: 'OK', variable: 'v', offClass: 'ap-off', onClass: 'ap-critical' }, { label: 'BARE', variable: 'v' }]);
  assert.ok(!/alarm-panel-minigame\.css/.test(out), 'no lamp class warning');
});
