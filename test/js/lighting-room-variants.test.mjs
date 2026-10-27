// Room lighting variants (systems/lighting.js): a room's lighting block can carry
// `variants`, each a partial block with a condition; the first that holds is merged
// over the base. Used for m03's day/night switch.
// Run with: node --test test/js/lighting-room-variants.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// Copy lighting.js and its two imports into a temp dir, so it loads in isolation.
const dir = mkdtempSync(join(tmpdir(), 'lighting-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'")
  .replace("'./npc-sprite-style.js'", "'./npc-sprite-style.mjs'"));
writeFileSync(join(dir, 'npc-sprite-style.mjs'), readFileSync(join(js, 'systems/npc-sprite-style.js'), 'utf8'));
const { resolveRoomLighting } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

const NIGHT = 'globalVars.clone_call_done === true';
const room = {
  ambient: '#e4e8ee',
  emitters: { reception_counter: { color: '#4de8ff', radius: 56 }, fire_alarm_point: [{ intensity: 0 }] },
  variants: [
    { condition: NIGHT, ambient: '#808aa0', panels: false,
      lights: [{ x: 5, y: 3 }],
      emitters: { reception_counter: { color: '#4de8ff', radius: 64, intensity: 0.75 } } },
  ],
};

test('no variants: the block is returned as it is, index -1', () => {
  const cfg = { mode: 'motion', offAfter: 75 };
  const r = resolveRoomLighting(cfg, {});
  assert.equal(r.index, -1);
  assert.deepEqual(r.cfg, cfg);
});

test('missing block resolves to an empty config', () => {
  const r = resolveRoomLighting(undefined, {});
  assert.equal(r.index, -1);
  assert.deepEqual(r.cfg, {});
});

test('by day the base block applies, without the variants key', () => {
  const r = resolveRoomLighting(room, { clone_call_done: false });
  assert.equal(r.index, -1);
  assert.equal(r.cfg.ambient, '#e4e8ee');
  assert.equal(r.cfg.variants, undefined);
  assert.equal(r.cfg.panels, undefined);
});

test('at night the variant is merged over the base', () => {
  const r = resolveRoomLighting(room, { clone_call_done: true });
  assert.equal(r.index, 0);
  assert.equal(r.cfg.ambient, '#808aa0');
  assert.equal(r.cfg.panels, false);
  assert.deepEqual(r.cfg.lights, [{ x: 5, y: 3 }]);
  // emitters merge by key: the variant's key wins, the base's other keys stay
  assert.equal(r.cfg.emitters.reception_counter.radius, 64);
  assert.deepEqual(r.cfg.emitters.fire_alarm_point, [{ intensity: 0 }]);
  assert.equal(r.cfg.variants, undefined);
  assert.equal(r.cfg.condition, undefined);
});

test('first matching variant wins; a variant with no condition always holds', () => {
  const cfg = { mode: 'on', variants: [
    { condition: 'globalVars.a === true', mode: 'dark' },
    { mode: 'motion' },
  ] };
  assert.equal(resolveRoomLighting(cfg, { a: true }).cfg.mode, 'dark');
  assert.equal(resolveRoomLighting(cfg, { a: false }).cfg.mode, 'motion');
  assert.equal(resolveRoomLighting(cfg, { a: false }).index, 1);
});

test('a broken condition does not hold', () => {
  const cfg = { mode: 'on', variants: [{ condition: 'globalVars.x ===', mode: 'dark' }] };
  assert.equal(resolveRoomLighting(cfg, {}).cfg.mode, 'on');
});

test('the base block is not changed by resolving', () => {
  const before = JSON.stringify(room);
  resolveRoomLighting(room, { clone_call_done: true });
  assert.equal(JSON.stringify(room), before);
});
