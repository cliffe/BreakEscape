// The validator warns when an alarm-panel lamp names a CSS class with no fill rule in
// alarm-panel-minigame.css (the lamp would paint black). Real lamp classes raise nothing.
// Run with: node --test test/js/validator-alarm-lamp-class.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
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
    return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const ran = r => assert.ok(/Result: \d+ errors/.test(r.stdout), 'validator ran: ' + r.stderr.slice(0, 200));
const lampWarnings = r => r.stdout.split('\n').filter(l => /lamps\[/.test(l) && /WARNING/.test(l));

test('an undefined lamp class warns, naming the lamp and the class', { skip }, () => {
  const r = output([{ label: 'DOOR ONE', variable: 'v', offClass: 'ap-off', onClass: 'ap-bogus' }]);
  ran(r);
  assert.ok(/DOOR ONE\)' onClass names class 'ap-bogus'/.test(r.stdout), 'warning names lamp and class');
});

test('a multi-state cssClass that is undefined warns', { skip }, () => {
  const r = output([{ label: 'MULTI', multiState: true, variables: ['v'], states: [{ variable: 'v', cssClass: 'ap-nope', statusText: 'X' }] }]);
  ran(r);
  assert.ok(/MULTI\)' states\[0\]\/cssClass names class 'ap-nope'/.test(r.stdout), 'multi-state class flagged');
});

test('a multi-state state with no cssClass warns (no engine fallback)', { skip }, () => {
  const r = output([{ label: 'NOCLS', multiState: true, variables: ['v'], states: [{ variable: 'v', statusText: 'X' }] }]);
  ran(r);
  assert.ok(/NOCLS\)' states\[0\]\/cssClass is missing/.test(r.stdout), 'missing multi-state class flagged');
});

test('a class list warns only when no token has a fill rule', { skip }, () => {
  const bad = output([{ label: 'LB', variable: 'v', offClass: 'ap-off', onClass: 'ap-bogus ap-flash' }]);
  ran(bad);
  assert.ok(/LB\)' onClass names class 'ap-bogus ap-flash'/.test(bad.stdout), 'list with no fill class flagged');
  const good = output([{ label: 'LG', variable: 'v', offClass: 'ap-off', onClass: 'ap-red ap-flash' }]);
  ran(good);
  assert.ok(lampWarnings(good).length === 0, 'list with one fill class is silent');
});

test('a class with no fill rule, or only a prefix of a real class, warns', { skip }, () => {
  const flash = output([{ label: 'FL', variable: 'v', offClass: 'ap-off', onClass: 'ap-flash' }]);
  ran(flash);
  assert.ok(/FL\)' onClass names class 'ap-flash'/.test(flash.stdout), 'class without fill flagged');
  const prefix = output([{ label: 'PF', variable: 'v', offClass: 'ap-off', onClass: 'ap-re' }]);
  ran(prefix);
  assert.ok(/PF\)' onClass names class 'ap-re'/.test(prefix.stdout), 'prefix of a real class flagged');
});

test('the CSS file the check reads still exists', () => {
  assert.ok(existsSync(join(root, 'public/break_escape/css/alarm-panel-minigame.css')), 'alarm CSS present');
});

test('defined classes and omitted classes raise no lamp warning', { skip }, () => {
  const r = output([{ label: 'OK', variable: 'v', offClass: 'ap-off', onClass: 'ap-critical' }, { label: 'BARE', variable: 'v' }]);
  ran(r);
  assert.ok(lampWarnings(r).length === 0, 'no lamp class warning');
});
