// calculateNPCWorldPosition (npc-sprites.js) turns a served NPC position into world pixels.
// A KO'd NPC is served at position.px/py (world pixels, any room); scenario NPCs use tile
// x/y from the room origin. A reader that offsets px by the room, or prefers x/y, would
// break every KO restore while the Rails tests still pass.
// Run with: node test/js/npc-world-position.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = (p) => join(here, '../../public/break_escape/js', p);
const dir = mkdtempSync(join(tmpdir(), 'npc-world-pos-'));
mkdirSync(join(dir, 'systems'));
mkdirSync(join(dir, 'utils'));
for (const f of ['systems/npc-sprites.js', 'systems/npc-direction.js', 'systems/npc-sprite-style.js', 'utils/constants.js']) {
  writeFileSync(join(dir, f), readFileSync(js(f), 'utf8'));
}
const S = await import(pathToFileURL(join(dir, 'systems/npc-sprites.js')).href);
const { TILE_SIZE } = await import(pathToFileURL(join(dir, 'utils/constants.js')).href);

test('position.px/py is returned as world pixels whatever the room origin', () => {
  const npc = { position: { px: -160, py: 192 } };
  assert.deepEqual(S.calculateNPCWorldPosition(npc, { position: { x: 0, y: 0 } }), { x: -160, y: 192 });
  assert.deepEqual(S.calculateNPCWorldPosition(npc, { position: { x: 640, y: 480 } }), { x: -160, y: 192 });
  assert.deepEqual(S.calculateNPCWorldPosition(npc, { worldX: 99, worldY: 99 }), { x: -160, y: 192 });
});

test('px/py wins over tile x/y when both are present', () => {
  const npc = { position: { x: 5, y: 3, px: 10, py: 20 } };
  assert.deepEqual(S.calculateNPCWorldPosition(npc, { position: { x: 64, y: 64 } }), { x: 10, y: 20 });
});

test('tile x/y offsets by the room origin times TILE_SIZE', () => {
  const npc = { position: { x: 5, y: 3 } };
  assert.deepEqual(S.calculateNPCWorldPosition(npc, { position: { x: 320, y: 128 } }),
    { x: 320 + 5 * TILE_SIZE, y: 128 + 3 * TILE_SIZE });
  assert.deepEqual(S.calculateNPCWorldPosition(npc, { worldX: 64, worldY: 32 }),
    { x: 64 + 5 * TILE_SIZE, y: 32 + 3 * TILE_SIZE });
});

test('no position returns null', () => {
  assert.equal(S.calculateNPCWorldPosition({}, { position: { x: 0, y: 0 } }), null);
  assert.equal(S.calculateNPCWorldPosition({ position: null }, {}), null);
});
