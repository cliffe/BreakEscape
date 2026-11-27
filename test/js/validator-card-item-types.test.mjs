// The validator's "a lock requires rfid X but no item declares card_id X" check counts only the item
// type the engine accepts as a card. Game#held_keycard_ref_ids and held_keycard_ids take
// type == 'keycard' only, so a 'fob' or 'rfid' item never opens a requires lock; the validator used
// to count them and stay quiet about a door nothing could open.
// Run with: node test/js/validator-card-item-types.test.mjs
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

function fixture(itemType) {
  return {
    scenario_id: 'test_card_types', scenario_name: 'Card type fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [{ aimId: 'a1', title: 'A', status: 'active', order: 1, tasks: [
      { taskId: 'open_door', title: 'Open the door', type: 'unlock_room', targetRoom: 'r2', status: 'active' }] }],
    globalVariables: {},
    rooms: {
      r1: { type: 'room_office', connections: { north: 'r2' }, npcs: [], objects: [
        { type: itemType, id: 'badge_item', name: 'Badge', card_id: 'badge1', takeable: true }] },
      r2: { type: 'room_office', connections: { south: 'r1' }, locked: true, lockType: 'rfid', requires: 'badge1', npcs: [], objects: [] }
    }
  };
}

function output(itemType) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-card-'));
  try {
    const sdir = join(dir, 'test_card_types');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    writeFileSync(file, JSON.stringify(fixture(itemType)));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({ display_name: 'F', description: 'F.', difficulty_level: 1, secgen_scenario: null }));
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), file, '--no-graph', '--no-lint', '--skip-ink', '--no-known-failures'],
      { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, cwd: root });
    return r.stdout || '';
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const NO_CARD = /a lock requires rfid 'badge1', but no item declares card_id/;

test('a keycard item with the card_id satisfies the rfid lock', { skip }, () => {
  assert.doesNotMatch(output('keycard'), NO_CARD);
});

test('a fob item with the card_id does not, because the engine accepts only keycard', { skip }, () => {
  assert.match(output('fob'), NO_CARD);
});

test('an rfid item with the card_id does not either', { skip }, () => {
  assert.match(output('rfid'), NO_CARD);
});
