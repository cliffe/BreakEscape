// Living office kit tests (LIVING_OFFICE_PLAN.md 4.5), wave 0 part: the pin test only.
//
// The other 4.5 checks (kit-owned members equal what office_kit produces, allowed writes, kit knots,
// chain mappings, pools, layer 0 and 1 passages and the rest) arrive in wave 1A with the kit tool.
// Add them to this file then; do not split them out.
//
// Pin test: the 28 check shells, the annual shell and the room_aw_* map files must be byte-identical
// to the hashes in fixtures/awareness-office-kit-pins.json, taken at HEAD before the kit work began.
// The kit never touches them. Changing a pin needs the owner's yes: do not refresh the fixture to make
// a failing run pass.
//
// Run with: node --test test/js/social-awareness-office-kit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scenarios = join(root, 'scenarios');
const rooms = join(root, 'public/break_escape/assets/rooms');
const pins = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/awareness-office-kit-pins.json'), 'utf8'));

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// Folders whose files are pinned: every check shell (ca_pre_*, ca_post_*) and the annual shell.
function pinnedShells() {
  return readdirSync(scenarios, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^(ca_pre_|ca_post_|ca_annual_)/.test(d.name))
    .map((d) => d.name)
    .sort();
}

// Every pinned file currently on disk, as repo-relative path -> sha256.
function currentFiles() {
  const out = {};
  for (const name of pinnedShells()) {
    const dir = join(scenarios, name);
    for (const f of ['scenario.json.erb', 'mission.json']) {
      if (existsSync(join(dir, f))) out[`scenarios/${name}/${f}`] = sha(join(dir, f));
    }
    const ink = join(dir, 'ink');
    if (existsSync(ink)) {
      for (const f of readdirSync(ink).sort()) out[`scenarios/${name}/ink/${f}`] = sha(join(ink, f));
    }
  }
  for (const f of readdirSync(rooms).sort()) {
    if (/^room_aw_.*\.(json|tmj)$/.test(f)) out[`public/break_escape/assets/rooms/${f}`] = sha(join(rooms, f));
  }
  return out;
}

const PIN_MSG = 'A pinned file changed. Changing a pin needs the owner\'s yes (LIVING_OFFICE_PLAN.md 4.5): ' +
  'do not edit the fixture to make this pass.';

test('pin: the pinned set is the 28 checks, the annual shell and the room_aw_* maps', () => {
  assert.equal(pins.checkShells.length, 28);
  assert.deepEqual(pinnedShells(), [...pins.checkShells, ...pins.annualShells].sort());
});

test('pin: every pinned file is byte-identical to HEAD at the start of the kit work', () => {
  const now = currentFiles();
  const changed = [];
  const missing = [];
  const added = [];
  for (const [f, h] of Object.entries(pins.files)) {
    if (!(f in now)) missing.push(f);
    else if (now[f] !== h) changed.push(f);
  }
  for (const f of Object.keys(now)) if (!(f in pins.files)) added.push(f);
  assert.deepEqual({ changed, missing, added }, { changed: [], missing: [], added: [] },
    `${PIN_MSG}\nchanged: ${changed.join(', ') || 'none'}\nmissing: ${missing.join(', ') || 'none'}\nadded: ${added.join(', ') || 'none'}`);
});

test('pin: pinned shells carry no kit_ name, no officePresets and no npcThoughts', () => {
  const bad = [];
  for (const name of pinnedShells()) {
    const text = readFileSync(join(scenarios, name, 'scenario.json.erb'), 'utf8');
    if (/(^|[^A-Za-z0-9])kit_[A-Za-z0-9]/.test(text)) bad.push(`${name}: kit_ name`);
    if (text.includes('"officePresets"')) bad.push(`${name}: officePresets`);
    if (text.includes('"npcThoughts"')) bad.push(`${name}: npcThoughts`);
  }
  assert.deepEqual(bad, [], `${PIN_MSG}\n${bad.join('\n')}`);
});
