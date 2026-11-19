// An unlock_object task on a biometric lock is a known item_unlocked emitter: the reader's accepted
// path calls unlockTarget() (unlock-system.js, case 'biometric'), which emits item_unlocked. The
// validator used to leave biometric out of its known list and warned on m09's plan_cabinet.
// A lock type the engine does not know still warns, so the check is not switched off.
// Run with: node --test test/js/validator-biometric-unlock.test.mjs
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

function fixture(lockType) {
  return {
    scenario_id: 'test_biometric', scenario_name: 'Biometric fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [{ aimId: 'a1', title: 'A', status: 'active', order: 1, tasks: [
      { taskId: 'open_cab', title: 'Open the cabinet', type: 'unlock_object', targetObject: 'cab', status: 'active' }] }],
    globalVariables: {},
    rooms: { r1: { type: 'room_office', connections: {}, npcs: [], objects: [
      { type: 'safe', id: 'cab', name: 'Cabinet', locked: true, lockType, requires: 'x', takeable: false }] } }
  };
}

function warnings(lockType) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-bio-'));
  try {
    const sdir = join(dir, 'test_biometric');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    writeFileSync(file, JSON.stringify(fixture(lockType)));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({ display_name: 'F', description: 'F.', difficulty_level: 1, secgen_scenario: null }));
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), file, '--no-graph', '--no-lint', '--skip-ink', '--no-known-failures'],
      { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, cwd: root });
    return r.stdout || '';
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const NOT_KNOWN = /not in the known set of types that emit/;

test('unlock_object on a biometric lock does not warn about item_unlocked', { skip }, () => {
  assert.doesNotMatch(warnings('biometric'), NOT_KNOWN);
});

test('unlock_object on an unknown lock type still warns', { skip }, () => {
  assert.match(warnings('made_up_lock'), NOT_KNOWN);
});
