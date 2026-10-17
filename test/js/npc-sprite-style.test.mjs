// NPC spriteStyle (systems/npc-sprite-style.js): see-through, glowing, flickering NPCs
// such as m08's ATHENA hologram. The style multiplies the engine's own alpha (hidden,
// revealed, fades), keeps its flicker flash-safe, and lights the room map round the NPC
// (systems/lighting.js stampNpcGlows) so a dim room doesn't darken the hologram.
// Run with: node --test test/js/npc-sprite-style.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-sprite-style-'));
writeFileSync(join(dir, 'npc-sprite-style.mjs'), readFileSync(join(js, 'systems/npc-sprite-style.js'), 'utf8'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'")
  .replace("'./npc-sprite-style.js'", "'./npc-sprite-style.mjs'"));

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { ADD: 1, MULTIPLY: 2 },
  Scenes: { Events: { UPDATE: 'update' } },
  Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), Vector2: class {} } };
globalThis.window = { gameState: { globalVariables: {} } };

const style = await import(pathToFileURL(join(dir, 'npc-sprite-style.mjs')).href);
const { LightingSystem } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);
const { normaliseSpriteStyle, flickerFactor, nextFlickerGap, applySpriteStyle, spriteStyleLight, FLICKER_MS } = style;

const ATHENA = { alpha: 0.8, glow: '#7fe8ff', flicker: true };

function fakeScene() {
  const handlers = new Map();
  return {
    time: { now: 0 },
    events: {
      on(ev, fn) { (handlers.get(ev) || handlers.set(ev, new Set()).get(ev)).add(fn); },
      off(ev, fn) { handlers.get(ev)?.delete(fn); },
    },
    emit(ev, ...args) { for (const fn of handlers.get(ev) || []) fn(...args); },
    count(ev) { return handlers.get(ev)?.size || 0; },
  };
}

function fakeSprite({ webgl = true } = {}) {
  const listeners = {};
  const fx = [];
  return {
    active: true, visible: true, alpha: 1, x: 100, y: 80,
    body: { center: { x: 100, y: 110 } },
    setAlpha(a) { this.alpha = a; return this; },
    once(ev, fn) { listeners[ev] = fn; },
    destroy() { this.active = false; listeners.destroy?.(); },
    fx,
    postFX: webgl ? {
      addGlow(color, outerStrength, innerStrength) { const g = { color, outerStrength, innerStrength }; fx.push(g); return g; },
      remove(g) { const i = fx.indexOf(g); if (i >= 0) fx.splice(i, 1); },
    } : undefined,
  };
}

test('normaliseSpriteStyle reads colours and clamps values; empty blocks are null', () => {
  const s = normaliseSpriteStyle(ATHENA);
  assert.equal(s.alpha, 0.8);
  assert.equal(s.glow, 0x7fe8ff);
  assert.equal(s.flicker, true);
  assert.deepEqual(s.light, { color: 0x7fe8ff, radius: 40, intensity: 0.45 });
  assert.equal(normaliseSpriteStyle({ alpha: 0.05 }).alpha, 0.3);   // never invisible
  assert.equal(normaliseSpriteStyle({ glow: '#7fe8ff', light: false }).light, null);
  assert.equal(normaliseSpriteStyle({ glow: 'cyan' }), null);        // bad colour, nothing left
  assert.equal(normaliseSpriteStyle({}), null);
  assert.equal(normaliseSpriteStyle(null), null);
  assert.equal(normaliseSpriteStyle({ alpha: 0.7 }).light, null);    // no glow, no light
});

test('the flicker is a short two-dip burst, at most two flashes every 2.5 s', () => {
  assert.equal(flickerFactor(-1), 1);
  assert.equal(flickerFactor(FLICKER_MS), 1);
  const ks = [];
  for (let t = 0; t < FLICKER_MS; t += 5) ks.push(flickerFactor(t));
  assert.ok(Math.min(...ks) >= 0.5, 'never dips below half');
  let dips = 0;
  for (let i = 1; i < ks.length; i++) if (ks[i] < 1 && ks[i - 1] === 1) dips++;
  assert.equal(dips + (ks[0] < 1 ? 1 : 0), 2);
  assert.ok(nextFlickerGap(0) >= 2500);
  assert.ok(nextFlickerGap(1) <= 7000);
});

test('the style multiplies the engine alpha and follows its changes (hide, reveal, fades)', () => {
  const scene = fakeScene();
  const sp = fakeSprite();
  applySpriteStyle(scene, sp, { alpha: 0.8 }, { reducedMotion: true });
  assert.equal(sp.alpha, 0.8);
  scene.emit('update', 16);
  assert.equal(sp.alpha, 0.8, 'no compounding frame after frame');
  sp.setAlpha(0);            // setNPCVisible(false)
  scene.emit('update', 32);
  assert.equal(sp.alpha, 0);
  sp.setAlpha(1);            // setNPCVisible(true)
  scene.emit('update', 48);
  assert.equal(sp.alpha, 0.8);
  sp.setAlpha(0.5);          // SpriteEffects.setKOAlpha
  scene.emit('update', 64);
  assert.equal(sp.alpha, 0.4);
});

test('flicker dips the alpha briefly, then recovers; still under reduced motion', () => {
  const scene = fakeScene();
  const sp = fakeSprite();
  applySpriteStyle(scene, sp, ATHENA, { random: () => 0, reducedMotion: false });
  // First burst is scheduled 2500 ms after the first tick (t = 0).
  scene.emit('update', 2400);
  assert.equal(sp.alpha, 0.8);
  scene.emit('update', 2510);
  assert.ok(sp.alpha < 0.8 && sp.alpha >= 0.4, `dipped to ${sp.alpha}`);
  scene.emit('update', 2700);
  assert.ok(Math.abs(sp.alpha - 0.8) < 1e-9, 'back to full after the burst');

  const still = fakeScene();
  const sp2 = fakeSprite();
  applySpriteStyle(still, sp2, ATHENA, { random: () => 0, reducedMotion: true });
  for (let t = 0; t < 20000; t += 10) { still.emit('update', t); assert.equal(sp2.alpha, 0.8); }
});

test('glow uses postFX on WebGL, is removed with the sprite, and is skipped on Canvas', () => {
  const scene = fakeScene();
  const sp = fakeSprite();
  const st = applySpriteStyle(scene, sp, ATHENA, { reducedMotion: true });
  assert.equal(sp.fx.length, 1);
  assert.equal(sp.fx[0].color, 0x7fe8ff);
  assert.equal(scene.count('update'), 1);
  sp.destroy();
  assert.equal(sp.fx.length, 0);
  assert.equal(scene.count('update'), 0, 'no update handler left behind');
  assert.equal(st.glowFx, null);

  const canvasSprite = fakeSprite({ webgl: false });
  const st2 = applySpriteStyle(fakeScene(), canvasSprite, ATHENA, { reducedMotion: true });
  assert.equal(st2.glowFx, null);
  assert.equal(canvasSprite.alpha, 0.8, 'alpha still applies on Canvas');
});

test('the light: none when hidden, dimmer when knocked out, follows the flicker', () => {
  const sp = fakeSprite();
  applySpriteStyle(fakeScene(), sp, ATHENA, { reducedMotion: true });
  const l = spriteStyleLight(sp);
  assert.equal(l.color, 0x7fe8ff);
  assert.equal(l.intensity, 0.45);
  assert.equal(l.x, 100);
  assert.equal(spriteStyleLight(sp, { knockedOut: true }).intensity, 0.225);
  sp._spriteStyle.k = 0.5;
  assert.equal(spriteStyleLight(sp).intensity, 0.225);
  sp._spriteStyle.k = 1;
  sp.visible = false;
  assert.equal(spriteStyleLight(sp), null);
  sp.visible = true;
  sp.alpha = 0;
  assert.equal(spriteStyleLight(sp), null);
  assert.equal(spriteStyleLight(fakeSprite()), null, 'unstyled NPCs give no light');
});

test('lighting stamps the glow for styled NPCs in the room being drawn only', () => {
  const sp = fakeSprite();
  applySpriteStyle(fakeScene(), sp, ATHENA, { reducedMotion: true });
  const plain = fakeSprite();
  window.npcManager = { npcs: new Map([['athena', { id: 'athena', _sprite: sp }], ['bob', { id: 'bob', _sprite: plain }]]) };
  window.npcHostileSystem = { isNPCKO: () => false };
  const stamps = [];
  const stamp = (x, y, radius, color, alpha) => stamps.push({ x, y, radius, color, alpha });
  const self = { fillAreas: (roomId) => roomId === 'lobby' ? [{ x: 0, y: 0, w: 320, h: 320 }] : [{ x: 400, y: 0, w: 320, h: 320 }] };
  LightingSystem.prototype.stampNpcGlows.call(self, stamp, { roomId: 'lobby' });
  assert.equal(stamps.length, 2, 'a floor pool and a core over the figure');
  assert.ok(stamps.every(st => st.color === 0x7fe8ff));
  LightingSystem.prototype.stampNpcGlows.call(self, stamp, { roomId: 'office' });
  assert.equal(stamps.length, 2, 'not stamped into a neighbouring room');
  window.npcHostileSystem = { isNPCKO: () => true };
  LightingSystem.prototype.stampNpcGlows.call(self, stamp, { roomId: 'lobby' });
  assert.ok(stamps[2].alpha < stamps[0].alpha, 'dimmer once knocked out');
  delete window.npcManager;
  delete window.npcHostileSystem;
});
