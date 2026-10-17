/**
 * NPC sprite style: an optional look laid over an NPC's normal sprite, for holograms,
 * ghosts and other figures that aren't solid people. The frames stay as drawn; the
 * engine adds the effect, so it holds through every animation (idle, walk, the punch
 * reaction, the fall) and through a knockout.
 *
 * Scenario NPC field (all keys optional):
 *   "spriteStyle": {
 *     "alpha": 0.8,           // see-through: 0.3-1 (default 1). Multiplies whatever alpha the
 *                             // engine sets (hidden 0, revealed 1, a fade), so it never fights them.
 *     "glow": "#7fe8ff",      // soft outline glow in this colour (Phaser postFX, WebGL only)
 *     "glowStrength": 2,      // 0.5-6, default 2
 *     "flicker": true,        // now and then a brief two-step dip, like a projector losing sync,
 *                             // plus a slow shimmer of the glow. Flash-safe (a few dips a second at
 *                             // most) and off under prefers-reduced-motion.
 *     "light": true           // with a glow: she lights the floor round her in the glow colour, and
 *                             // the room light map is lifted over her, so the lighting system
 *                             // (systems/lighting.js) doesn't darken her in a dim room. Default true
 *                             // when glow is set; or { "radius": 40, "intensity": 0.45 }; false: none.
 *   }
 *
 * The Canvas renderer has no postFX: there the style is alpha and flicker only (lighting is
 * WebGL only anyway).
 */

const DEFAULT_GLOW_STRENGTH = 2;
const DEFAULT_LIGHT = { radius: 40, intensity: 0.45 };
export const SPRITE_STYLE_FIELDS = ['alpha', 'glow', 'glowStrength', 'flicker', 'light', '_comment'];

// A flicker: two quick dips over 170 ms, then full again. Two flashes in one burst, and
// bursts at least FLICKER_GAP_MIN apart, so it stays well under 3 flashes a second.
const FLICKER_STEPS = [
  { until: 60, k: 0.5 },
  { until: 110, k: 1 },
  { until: 170, k: 0.7 },
];
export const FLICKER_MS = 170;
const FLICKER_GAP_MIN = 2500;
const FLICKER_GAP_SPREAD = 4500;

function parseColor(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value & 0xffffff;
  if (typeof value === 'string' && /^#?[0-9a-fA-F]{6}$/.test(value.trim())) {
    return parseInt(value.trim().replace('#', ''), 16);
  }
  return null;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Read a scenario spriteStyle block into numbers. Returns null when there's nothing to do
 * (no block, or a block that changes nothing).
 */
export function normaliseSpriteStyle(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const alpha = typeof raw.alpha === 'number' && Number.isFinite(raw.alpha) ? clamp(raw.alpha, 0.3, 1) : 1;
  const glow = parseColor(raw.glow);
  const glowStrength = typeof raw.glowStrength === 'number' && Number.isFinite(raw.glowStrength)
    ? clamp(raw.glowStrength, 0.5, 6) : DEFAULT_GLOW_STRENGTH;
  const flicker = raw.flicker === true;
  let light = null;
  if (glow !== null && raw.light !== false) {
    const l = raw.light && typeof raw.light === 'object' ? raw.light : {};
    light = {
      color: parseColor(l.color) ?? glow,
      radius: typeof l.radius === 'number' ? clamp(l.radius, 8, 160) : DEFAULT_LIGHT.radius,
      intensity: typeof l.intensity === 'number' ? clamp(l.intensity, 0, 1) : DEFAULT_LIGHT.intensity,
    };
  }
  if (alpha === 1 && glow === null && !flicker) return null;
  return { alpha, glow, glowStrength, flicker, light };
}

/** The flicker multiplier `ms` into a burst (1 outside one). */
export function flickerFactor(ms) {
  if (!(ms >= 0) || ms >= FLICKER_MS) return 1;
  for (const s of FLICKER_STEPS) if (ms < s.until) return s.k;
  return 1;
}

/** The gap before the next burst, from a 0-1 random number. */
export function nextFlickerGap(r) {
  return FLICKER_GAP_MIN + clamp(r, 0, 1) * FLICKER_GAP_SPREAD;
}

/** The slow shimmer on the glow's strength: within ±20%, a period of about 2.5 s. */
export function shimmerFactor(time) {
  return 1 + 0.2 * Math.sin(time / 400);
}

/**
 * The alpha to draw with. `base` is the alpha the rest of the engine last asked for
 * (1 normally, 0 hidden, a fade in between).
 */
export function styledAlpha(base, style, k = 1) {
  return clamp(base * style.alpha * k, 0, 1);
}

function prefersReducedMotion() {
  try { return !!globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch (e) { return false; }
}

/**
 * Lay a style over an NPC sprite. Safe to call once per sprite; a new sprite (room reload)
 * gets it again from createNPCSprite. Returns the state object, or null if the style is empty.
 */
export function applySpriteStyle(scene, sprite, rawStyle, { random = Math.random, reducedMotion } = {}) {
  const style = normaliseSpriteStyle(rawStyle);
  if (!style || !sprite || !scene) return null;
  if (sprite._spriteStyle) sprite._spriteStyle.detach?.();

  const state = {
    style,
    base: sprite.alpha ?? 1,   // the engine's own alpha, before ours
    applied: null,             // what we last set, so an outside change can be told apart
    k: 1,                      // current flicker factor (the light map reads it)
    flickerStart: -Infinity,
    nextFlicker: null,
    still: reducedMotion ?? prefersReducedMotion(),
    glowFx: null,
  };

  // Soft glow. postFX exists on WebGL game objects only (Phaser 3.60+).
  if (style.glow !== null && sprite.postFX?.addGlow) {
    try {
      state.glowFx = sprite.postFX.addGlow(style.glow, style.glowStrength, 0, false, 0.1, 8);
    } catch (e) {
      state.glowFx = null;
    }
  }

  const tick = (time) => {
    if (!sprite.active) return;
    // Someone else (setNPCVisible, a fade, a KO effect) changed the alpha: take it as the new base.
    if (state.applied === null || Math.abs(sprite.alpha - state.applied) > 1e-4) state.base = sprite.alpha;
    let k = 1;
    if (style.flicker && !state.still) {
      if (state.nextFlicker === null) state.nextFlicker = time + nextFlickerGap(random());
      if (time >= state.nextFlicker) {
        state.flickerStart = time;
        state.nextFlicker = time + FLICKER_MS + nextFlickerGap(random());
      }
      k = flickerFactor(time - state.flickerStart);
      if (state.glowFx) state.glowFx.outerStrength = style.glowStrength * shimmerFactor(time) * k;
    }
    state.k = k;
    const a = styledAlpha(state.base, style, k);
    sprite.setAlpha(a);
    state.applied = sprite.alpha;
  };

  const updateEvent = globalThis.Phaser?.Scenes?.Events?.UPDATE || 'update';
  const onUpdate = (time) => tick(time);
  scene.events?.on?.(updateEvent, onUpdate);
  state.detach = () => {
    scene.events?.off?.(updateEvent, onUpdate);
    if (state.glowFx && sprite.postFX?.remove) {
      try { sprite.postFX.remove(state.glowFx); } catch (e) { /* sprite already gone */ }
    }
    state.glowFx = null;
    if (sprite._spriteStyle === state) sprite._spriteStyle = null;
  };
  sprite.once?.('destroy', () => state.detach());
  state.tick = tick;
  sprite._spriteStyle = state;
  tick(scene.time?.now ?? 0);
  return state;
}

/**
 * The light a styled NPC gives off this frame, or null: { x, y, radius, color, intensity }.
 * Hidden or fully faded sprites give none; a knocked-out hologram still glows, dimmer.
 */
export function spriteStyleLight(sprite, { knockedOut = false } = {}) {
  const state = sprite?._spriteStyle;
  const light = state?.style?.light;
  if (!light || !sprite.active || !sprite.visible || !(sprite.alpha > 0.02)) return null;
  const intensity = light.intensity * state.k * (knockedOut ? 0.5 : 1);
  if (intensity <= 0.01) return null;
  const x = sprite.body?.center?.x ?? sprite.x;
  const y = (sprite.body?.center?.y ?? sprite.y) - (knockedOut ? 4 : 20);
  return { x, y, radius: light.radius, color: light.color, intensity };
}
