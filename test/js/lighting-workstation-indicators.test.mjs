// Workstation indicators (systems/lighting.js, OFFICE_LIFE_PLAN 2.3, slice 5): every workstation
// with a known owner gets a second, `indicator` emitter record beside its screen glow: a steady
// blue dot while <id>_screen_locked, a breathing warm-white dot while <id>_owner_away, nothing
// while the owner is at the desk. The screen's own record never changes.
// Run with: node test/js/lighting-workstation-indicators.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-ind-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'")
  .replace("'./npc-sprite-style.js'", "'./npc-sprite-style.mjs'")
  .replace("'./room-hearing.js'", "'./room-hearing.mjs'")
  .replace("'./workstation-state.js'", "'./workstation-state.mjs'"));
writeFileSync(join(dir, 'npc-sprite-style.mjs'), readFileSync(join(js, 'systems/npc-sprite-style.js'), 'utf8'));
writeFileSync(join(dir, 'room-hearing.mjs'), readFileSync(join(js, 'systems/room-hearing.js'), 'utf8'));
writeFileSync(join(dir, 'workstation-state.mjs'), readFileSync(join(js, 'systems/workstation-state.js'), 'utf8'));

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { ADD: 1, MULTIPLY: 2 }, Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), DegToRad: (d) => d * Math.PI / 180, Vector2: class { constructor() { this.x = 0; this.y = 0; } } } };
const NPCS = [{ id: 'tom', needsHome: 'tom_pc' }, { id: 'amara', needsHome: 'amara_pc' }];
globalThis.window = { gameState: { globalVariables: {} }, npcManager: { npcs: new Map(NPCS.map(n => [n.id, n])) } };
const { LightingSystem, workstationIndicators } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

function fakeImage() {
  const img = {};
  for (const m of ['setBlendMode', 'setVisible', 'setDepth', 'setTint', 'setScale', 'setPosition', 'setAlpha']) img[m] = () => img;
  img.destroy = () => {};
  return img;
}

function stateWith(emitters = {}) {
  const sys = Object.create(LightingSystem.prototype);
  sys.scene = { add: { image: () => fakeImage() } };
  sys.config = {};
  const state = { roomId: 'office', emitters: [] };
  sys.configureRoom(state, { map: { widthInPixels: 320, heightInPixels: 256 }, position: { x: 0, y: 0 } }, { emitters, panels: false });
  return { sys, state };
}

const obj = (data, key, x = 100, y = 100) => ({
  objectId: data.id, scenarioData: data, texture: { key }, x, y, displayWidth: 32, displayHeight: 32, active: true, visible: true,
  getCenter: (v) => { v.x = x; v.y = y; return v; },
});
const setGlobals = (g) => { window.gameState.globalVariables = { ...g }; };

test('workstationIndicators: none for a plain object or an ownerless workstation', () => {
  assert.deepEqual(workstationIndicators({ id: 'pc_x', type: 'pc' }, NPCS), []);
  assert.deepEqual(workstationIndicators({ id: 'spare_pc', workstation: true }, NPCS), []);
  assert.deepEqual(workstationIndicators(undefined, NPCS), []);
});

test('workstationIndicators: locked first, then open; both above, at the top-right corner', () => {
  const v = workstationIndicators({ id: 'tom_pc', lockChance: 0.5 }, NPCS, { width: 32, height: 40 });
  assert.equal(v.length, 2);
  assert.equal(v[0].condition, 'globalVars.tom_pc_screen_locked');
  assert.equal(v[1].condition, 'globalVars.tom_pc_owner_away');
  assert.ok(v.every(d => d.above === true));
  assert.ok(v[0].offsetX > 0 && v[0].offsetY < 0, 'right of and above the centre');
  assert.equal(v[0].effect, null, 'locked is steady');
  assert.equal(v[1].effect, 'breathe', 'open breathes');
  assert.ok(v[1].radius > v[0].radius, 'they differ in size too, for reduced motion');
  assert.notEqual(v[0].color, v[1].color);
});

test('screenOwner names the owner without needsHome', () => {
  assert.equal(workstationIndicators({ id: 'hot_desk', workstation: true, screenOwner: 'amara' }, NPCS).length, 2);
});

test('a workstation with an owner gets a second, indicator record after its screen record', () => {
  const { sys, state } = stateWith();
  sys.buildEmitters(state, [obj({ id: 'tom_pc', lockChance: 0.5 }, 'pc3'), obj({ id: 'decor_pc' }, 'pc', 200, 100)]);
  assert.equal(state.emitters.length, 3);
  const [screen, ind, decor] = state.emitters;
  assert.equal(screen.obj.objectId, 'tom_pc');
  assert.ok(!screen.indicator);
  assert.equal(ind.obj, screen.obj);
  assert.equal(ind.indicator, true);
  assert.equal(ind.base, null);
  assert.ok(!decor.indicator, 'a PC that is not a workstation gets no dot');
});

test('the indicator follows the globals; the screen record resolves the same in all three states', () => {
  const { sys, state } = stateWith();
  sys.buildEmitters(state, [obj({ id: 'tom_pc', lockChance: 0.5 }, 'pc3')]);
  const [screen, ind] = state.emitters;
  const seen = [];

  setGlobals({ tom_pc_owner_away: false, tom_pc_screen_locked: false });
  sys.resolveEmitters(state);
  assert.equal(ind.def, null, 'owner at desk: no dot');
  seen.push(screen.def);

  setGlobals({ tom_pc_owner_away: true, tom_pc_screen_locked: false });
  sys.resolveEmitters(state);
  assert.equal(ind.def.effect, 'breathe', 'away and open');
  assert.equal(ind.def.color, 0xfff1c8);
  seen.push(screen.def);

  setGlobals({ tom_pc_owner_away: true, tom_pc_screen_locked: true });
  sys.resolveEmitters(state);
  assert.equal(ind.def.color, 0x4da3ff, 'away and locked: locked wins');
  assert.equal(ind.def.effect, null);
  seen.push(screen.def);

  setGlobals({ tom_pc_owner_away: false, tom_pc_screen_locked: false });
  sys.resolveEmitters(state);
  assert.equal(ind.def, null, 'owner back: dot gone');

  assert.ok(seen[0], 'the screen glows');
  assert.ok(seen.every(d => d === seen[0]), 'the screen glow is the same definition throughout');
  assert.equal(seen[0].effect, 'screen');
});

test('clusterEmitters does not damp an indicator; neighbouring screens still share a glow', () => {
  const { sys, state } = stateWith();
  sys.buildEmitters(state, [obj({ id: 'tom_pc', lockChance: 0.5 }, 'pc3', 100, 100), obj({ id: 'amara_pc', workstation: true }, 'pc3', 120, 100)]);
  setGlobals({ tom_pc_owner_away: true, tom_pc_screen_locked: false, amara_pc_owner_away: true, amara_pc_screen_locked: true });
  sys.resolveEmitters(state);
  const screens = state.emitters.filter(e => !e.indicator);
  const dots = state.emitters.filter(e => e.indicator);
  assert.equal(dots.length, 2);
  assert.ok(dots.every(e => e.def && e.glowK === 1 && e.stampK === 1));
  assert.ok(screens.every(e => e.glowK === 0.5), 'the two screens within 32 px share');
});

test('a room emitters entry with indicators replaces the built-ins; [] turns them off', () => {
  let { sys, state } = stateWith({ tom_pc: { indicators: [{ condition: 'globalVars.tom_pc_owner_away', color: '#ff00ff', radius: 6, above: true }] } });
  sys.buildEmitters(state, [obj({ id: 'tom_pc', lockChance: 0.5 }, 'pc3')]);
  const ind = state.emitters.find(e => e.indicator);
  assert.equal(ind.variants.length, 1);
  assert.equal(ind.variants[0].color, 0xff00ff, 'colour parsed');
  const screen = state.emitters.find(e => !e.indicator);
  assert.deepEqual(screen.variants, [], 'an entry that only holds indicators adds no screen variant');
  setGlobals({ tom_pc_owner_away: true });
  sys.resolveEmitters(state);
  assert.equal(ind.def.radius, 6);

  ({ sys, state } = stateWith({ tom_pc: { indicators: [] } }));
  sys.buildEmitters(state, [obj({ id: 'tom_pc', lockChance: 0.5 }, 'pc3')]);
  assert.equal(state.emitters.filter(e => e.indicator).length, 0);
  assert.equal(state.emitters.length, 1, 'the screen glow stays');
});

test('an entry can carry a glow variant and indicators together; other objects can get dots by id', () => {
  const { sys, state } = stateWith({
    tom_pc: { color: '#ffffff', radius: 30, indicators: [{ color: '#00ff00', radius: 5, above: true }] },
    printer_1: { indicators: [{ condition: 'globalVars.paper_jam', color: '#ffb000', radius: 6, above: true, effect: 'blink' }] },
  });
  sys.buildEmitters(state, [obj({ id: 'tom_pc', lockChance: 0.5 }, 'pc3'), obj({ id: 'printer_1' }, 'printer', 200, 100)]);
  const screen = state.emitters.find(e => e.obj.objectId === 'tom_pc' && !e.indicator);
  assert.equal(screen.variants.length, 1);
  assert.equal(screen.variants[0].radius, 30);
  assert.ok(!('indicators' in screen.variants[0]));
  const printerRecs = state.emitters.filter(e => e.obj.objectId === 'printer_1');
  assert.equal(printerRecs.length, 1, 'no glow (no EMITTERS match), just the dot');
  assert.equal(printerRecs[0].indicator, true);
  setGlobals({ paper_jam: true });
  sys.resolveEmitters(state);
  assert.equal(printerRecs[0].def.effect, 'blink');
});

test('a workstation whose art has no glow still gets its dot', () => {
  const { sys, state } = stateWith();
  sys.buildEmitters(state, [obj({ id: 'amara_pc', workstation: true }, 'desk_plain')]);
  assert.equal(state.emitters.length, 1);
  assert.equal(state.emitters[0].indicator, true);
});
