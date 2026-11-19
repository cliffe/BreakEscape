// A phone-NPC eventMapping retired in place (a "Retired ..." _comment and a condition containing
// "retired_") is an inert slot kept for once-only index stability, so the "no visible effect"
// warning skips it. A live mapping with no effect must still warn.
// Run with: node test/js/validator-retired-mapping.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

const RETIRED = { _comment: 'Retired 2026-11-18: text gone. Kept as an inert placeholder so later eventMappings keep their index.',
  eventPattern: 'npc_ko:ray', condition: 'data.retired_2026_11_18 === true', onceOnly: true };
const LIVE_NOOP = { eventPattern: 'npc_ko:ray', onceOnly: true };
// Only a "Retired" comment, or only a retired_ condition, is not enough to skip the warning.
const COMMENT_ONLY = { _comment: 'Retired but still live', eventPattern: 'npc_ko:ray', onceOnly: true };

function run(mappings) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-retired-'));
  try {
    const sdir = join(dir, 'test_retired_mapping');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    writeFileSync(file, JSON.stringify({
      scenario_id: 'test_retired_mapping', scenario_name: 'Retired mapping fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
      player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
      objectives: [], globalVariables: {},
      rooms: { r1: { type: 'room_office', connections: {}, objects: [], npcs: [
        { id: 'handler', displayName: 'Handler', npcType: 'phone', storyPath: 'ink/handler.json', eventMappings: mappings }
      ] } }
    }));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({
      display_name: 'Fixture', description: 'Fixture.', difficulty_level: 1, secgen_scenario: null }));
    const r = spawnSync('ruby', [VALIDATOR, file, '--no-graph', '--no-lint', '--skip-ink', '--no-known-failures'],
      { env, cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
    return r.stdout.split('\n').filter((l) => l.includes('no visible effect'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a retired mapping slot is not warned about', { skip }, () => {
  assert.deepEqual(run([RETIRED]), []);
});

test('a live mapping with no visible effect still warns', { skip }, () => {
  const lines = run([RETIRED, LIVE_NOOP, COMMENT_ONLY]);
  assert.equal(lines.length, 2, lines.join('\n'));
  assert.match(lines[0], /eventMappings\[1\]/);
  assert.match(lines[1], /eventMappings\[2\]/);
});
