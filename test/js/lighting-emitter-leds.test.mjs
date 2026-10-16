// Room emitters can give an object rack-style blinking LEDs (`leds`), so a mission's own
// rack art (qdc_, hce_, hq_ racks) blinks like the stock racks (7.6a, m05 D16, m06 D9,
// m08 E14). Run with: node --test test/js/lighting-emitter-leds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-leds-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'"));

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { ADD: 1, MULTIPLY: 2 }, Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), DegToRad: (d) => d * Math.PI / 180, Vector2: class { constructor() { this.x = 0; this.y = 0; } } } };
globalThis.window = { gameState: { globalVariables: {} } };
const { LightingSystem } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

// A stand-in for the scene's image factory: chainable no-ops
function fakeImage() {
  const img = {};
  for (const m of ['setBlendMode', 'setVisible', 'setDepth', 'setTint', 'setScale', 'setPosition', 'setAlpha']) img[m] = () => img;
  img.destroy = () => {};
  return img;
}

function system() {
  const sys = Object.create(LightingSystem.prototype);
  sys.scene = { add: { image: () => fakeImage() } };
  sys.config = {};
  return sys;
}

function stateWith(emitters) {
  const sys = system();
  const state = { roomId: 'vault', emitters: [] };
  sys.configureRoom(state, { map: { widthInPixels: 320, heightInPixels: 256 }, position: { x: 0, y: 0 } }, { emitters, panels: false });
  return { sys, state };
}

const obj = (id, key) => ({ objectId: id, scenarioData: { id }, texture: { key }, displayWidth: 48, displayHeight: 64, active: true, visible: true });

test('a room emitter with leds gives a mission rack LEDs it has no EMITTERS entry for', () => {
  const { sys, state } = stateWith({ qdc_rack_black: { color: '#6dffb0', radius: 40, intensity: 0.45, effect: 'blink', leds: 0.6 } });
  sys.buildEmitters(state, [obj('rack_a', 'qdc_rack_black1'), obj('hsm', 'qdc_hsm1')]);
  assert.equal(state.emitters.length, 1, 'the HSM has no entry and no variant');
  const e = state.emitters[0];
  assert.ok(e.leds.length >= 3, `LEDs made (${e.leds.length})`);
  assert.equal(e.ledsMax, 0.6);
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 0.6);
});

test('without leds, a room emitter on non-rack art is a glow only, as before', () => {
  const { sys, state } = stateWith({ hq_rack: { color: '#6dffb0', radius: 40 } });
  sys.buildEmitters(state, [obj('r', 'hq_rack1')]);
  assert.equal(state.emitters[0].leds.length, 0);
});

test('stock racks keep their LEDs; a variant can turn them off with leds: 0', () => {
  window.gameState.globalVariables = { power_cut: false };
  const { sys, state } = stateWith({ server: [{ condition: 'globalVars.power_cut', leds: 0, intensity: 0.1 }] });
  sys.buildEmitters(state, [obj('s1', 'server1')]);
  const e = state.emitters[0];
  assert.ok(e.leds.length > 0);
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 1, 'the EMITTERS entry');
  window.gameState.globalVariables.power_cut = true;
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 0, 'the variant hides them');
});

test('leds are clamped to 0..1 and LEDs are made for the densest state', () => {
  window.gameState.globalVariables = { busy: false };
  const { sys, state } = stateWith({ hce_hsm: [
    { condition: 'globalVars.busy', color: '#ff5050', radius: 30, leds: 5 },
    { color: '#6dffb0', radius: 30, leds: 0.3 }] });
  sys.buildEmitters(state, [obj('h', 'hce_hsm1')]);
  const e = state.emitters[0];
  assert.equal(e.ledsMax, 1);
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 0.3);
});
