// The validator warns about a confirm button label of more than 16 characters (UX slice 16 R1 m9):
// confirm buttons keep their label on one line, and at phone width a button holds about 18
// characters before the dialog frame cuts it. Covers confirm_action's confirmLabel and
// cancelLabel and the interaction warning's proceedLabel and declineLabel.
// Run with: node test/js/validator-confirm-label-length.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function run(objects) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-label-'));
  const j = {
    scenario_id: 'test_label_length', scenario_name: 'Label length fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [], globalVariables: { switched: false },
    rooms: { r1: { type: 'room_office', connections: {}, objects, npcs: [] } }
  };
  const file = join(dir, 'scenario.json.erb');
  writeFileSync(file, JSON.stringify(j, null, 2));
  const r = spawnSync('ruby', [VALIDATOR, file, '--no-graph', '--skip-ink'], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
  rmSync(dir, { recursive: true, force: true });
  return r.stdout + r.stderr;
}

const sw = (confirmLabel, cancelLabel) => ({
  type: 'notes', id: 'switch', name: 'Switch', takeable: false,
  triggerOnInteract: [{ type: 'confirm_action', text: 'Switch it off?', confirmLabel, cancelLabel,
    onConfirm: [{ type: 'set_global', key: 'switched', value: true }] }]
});

test('a confirm_action label over 16 characters is warned about, a short one is not', { skip }, () => {
  const long = run([sw('Switch the whole thing off', 'Leave it')]);
  assert.match(long, /⚠️ WARNING: '.*\/confirmLabel' is 26 characters \("Switch the whole thing off"\)/);
  assert.doesNotMatch(long, /cancelLabel' is/);
  const short = run([sw('Switch off', 'Leave it for now')]);
  assert.doesNotMatch(short, /Label' is \d+ characters/, '16 characters is allowed');
});

test('an interaction warning label over 16 characters is warned about', { skip }, () => {
  const out = run([{ type: 'notes', id: 'term', name: 'Terminal', takeable: false,
    interactionWarning: { text: 'This is logged.', proceedLabel: 'Carry on regardless', declineLabel: 'No' } }]);
  assert.match(out, /⚠️ WARNING: '.*interactionWarning\/proceedLabel' is 19 characters/);
});
