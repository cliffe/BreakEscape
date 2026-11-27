// NPC torch (systems/lighting.js): an NPC with behavior.torch carries a beam that
// shows only in a dim room. npcTorchStrength maps the room's current ambient to the
// beam's strength.
// Run with: node --test test/js/lighting-npc-torch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-torch-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'")
  .replace("'./npc-sprite-style.js'", "'./npc-sprite-style.mjs'")
  .replace("'./room-hearing.js'", "'./room-hearing.mjs'")
  .replace("'./workstation-state.js'", "'./workstation-state.mjs'")
  .replace("'./npc-los.js'", "'./npc-los.mjs'"));
writeFileSync(join(dir, 'npc-sprite-style.mjs'), readFileSync(join(js, 'systems/npc-sprite-style.js'), 'utf8'));
writeFileSync(join(dir, 'room-hearing.mjs'), readFileSync(join(js, 'systems/room-hearing.js'), 'utf8'));
writeFileSync(join(dir, 'workstation-state.mjs'), readFileSync(join(js, 'systems/workstation-state.js'), 'utf8'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(js, 'systems/npc-los.js'), 'utf8'));
const { npcTorchStrength, npcTorchTuning } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

test('no beam in a lit office', () => {
  assert.equal(npcTorchStrength(0xe4e8ee), 0);   // bright lobby
  assert.equal(npcTorchStrength(0xc4cad8), 0);   // engine default lit ambient
  assert.equal(npcTorchStrength(0xbcb6ae), 0);   // m03 executive wing by day
});

test('a clear beam in a dim corridor, full in a dark room', () => {
  assert.ok(npcTorchStrength(0x343a50) > 0.7);   // m03 executive wing at night
  assert.equal(npcTorchStrength(0x101424), 1);   // engine default dark ambient
});

test('strength never leaves 0..1 and rises as the room darkens', () => {
  const vals = [0xffffff, 0xa0a0a0, 0x808080, 0x606060, 0x404040, 0x000000].map(npcTorchStrength);
  for (const v of vals) assert.ok(v >= 0 && v <= 1);
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i] >= vals[i - 1]);
});

test('torch strength and length default to 1 when unset, so other NPCs are unchanged', () => {
  const std = { strength: 1, length: 1 };
  assert.deepEqual(npcTorchTuning(true), std);
  assert.deepEqual(npcTorchTuning(undefined), std);
  assert.deepEqual(npcTorchTuning({ condition: 'globalVars.night' }), std);
  assert.deepEqual(npcTorchTuning({ color: '#fff0d8' }), std);
  assert.deepEqual(npcTorchTuning({ strength: 'high', length: null }), std);
  assert.deepEqual(npcTorchTuning({ strength: NaN, length: Infinity }), std);
});

test('torch strength and length read as numbers and are clamped', () => {
  assert.deepEqual(npcTorchTuning({ strength: 1.6, length: 1.4 }), { strength: 1.6, length: 1.4 });
  assert.equal(npcTorchTuning({ strength: 0.5 }).strength, 0.5);
  assert.equal(npcTorchTuning({ strength: 0 }).strength, 0);
  assert.equal(npcTorchTuning({ strength: 9 }).strength, 3);
  assert.equal(npcTorchTuning({ strength: -2 }).strength, 0);
  assert.equal(npcTorchTuning({ length: 9 }).length, 2.5);
  assert.equal(npcTorchTuning({ length: 0 }).length, 0.25);
  assert.equal(npcTorchTuning({ strength: 2 }).length, 1);
});

test('strength scales the beam but a lit room still shows none', () => {
  // The lit-room cutoff reads npcTorchStrength (the room's ambient), not the NPC's setting.
  assert.equal(npcTorchStrength(0xbcb6ae) * npcTorchTuning({ strength: 3 }).strength, 0);
  const night = npcTorchStrength(0x343a50);
  assert.ok(night * npcTorchTuning({ strength: 1.6 }).strength > night);
});
