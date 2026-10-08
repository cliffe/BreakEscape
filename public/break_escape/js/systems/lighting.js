/**
 * Room lighting.
 *
 * A screen-sized light map (RenderTexture, MULTIPLY blend) sits above the world.
 * Each frame it is filled with every visible room's ambient colour, then lights
 * are added onto it: ceiling panels, glows from objects that give off light
 * (screens, lamps, racks, exit signs) and a small light round the player in a
 * dark room. A second, additive layer of glow sprites makes emitters bloom.
 *
 * Opt-in per scenario:
 *   "lighting": { "enabled": true, "defaultMode": "on" }
 * Per room (all optional):
 *   "lighting": {
 *     "mode": "on" | "motion" | "dark",   // motion: off until the player walks in
 *     "startOn": false,                    // motion rooms with NPCs start lit unless this is false
 *     "offAfter": 30,                      // motion: seconds after the player leaves before lights go off
 *     "flicker": true,                     // one faulty fluorescent panel
 *     "ambient": "#dfe3ec", "darkAmbient": "#101424",
 *     "panels": false,                     // no ceiling panel pools
 *     "lights": [{ "x": 5, "y": 4, "color": "#ffd9a0", "radius": 80, "intensity": 0.8 }],  // tile coords
 *     "emitters": {                        // per-room glow changes, keyed by object id or texture-key prefix
 *       "alarm_panel": [                   // first variant whose condition holds wins; none: the EMITTERS entry
 *         { "condition": "globalVars.alarm", "color": "#ff5050", "radius": 24, "intensity": 0.5, "effect": "pulse" },
 *         { "color": "#7dffa0" }
 *       ]                                  // also: offsetY, ledColor, ledAlpha (0 hides LEDs), floorTint (0-1: tint
 *                                          // a lit floor with the glow's colour), above (true: stays above the light
 *                                          // map in a lit room, for small indicators); effect null|screen|blink|pulse|breathe
 *     }
 *   }
 * Objects with lockType "ransomware_display" glow red while globalVars.ransomware_deployed holds
 * (a room "emitters" variant on the object's id wins over that, e.g. a screen that has recovered).
 * Brownout: lightingSystem.dip({ level: 0.5, ms: 1600 }), the "lighting_dip" scenario action, or the
 * ink tag #lighting_dip[:level]. One slow dip of the room lights; screens and racks hold (UPS). It
 * waits until any conversation or minigame has closed, and is skipped under prefers-reduced-motion.
 * Disable for one player: ?lighting=off, or localStorage breakEscapeLighting=off.
 */

import { TILE_SIZE, LIGHT_DEPTH, SPRITE_PADDING_BOTTOM_ATLAS, SPRITE_PADDING_BOTTOM_LEGACY } from '../utils/constants.js';
import { evaluateGlobalCondition } from '../utils/conditional-text.js';

const LIGHT_TEX = 'be_light_soft';
const LIGHT_TEX_SIZE = 128;
// Plain white block for filling rectangles. DynamicTexture.fill() in 3.60 scales
// rects by the renderer size, which clips them once the texture is bigger than the canvas.
const BLOCK_TEX = 'be_light_block';
const BLOCK_SIZE = 16;
const LED_TEX = 'be_light_led';
const CONE_TEX = 'be_light_cone';
const FACING_ANGLES = { right: 0, 'down-right': 45, down: 90, 'down-left': 135, left: 180, 'up-left': 225, up: 270, 'up-right': 315 };
const LED_COLORS = [0x4dff7a, 0x4dff7a, 0x4dff7a, 0xffb02e, 0x5cc8ff];
// The light map is anchored in world space with a margin, so it never lags the
// camera (camera follow is applied after update()).
const MARGIN = 64;
// The light map is drawn at half resolution and scaled up: light is soft anyway,
// and it quarters the fill cost.
const RES = 0.5;
// Redraw at most this often. The map is world-anchored, so camera movement inside
// the margin needs no redraw; lights only animate.
const REDRAW_MS = 33;

const DEFAULT_LIT_AMBIENT = 0xc4cad8;
const DEFAULT_DARK_AMBIENT = 0x101424;
// Glow sprites draw at their object's depth, under the MULTIPLY light map, so the map
// darkens them; this boost makes up for it. A character standing in front hides them.
const GLOW_BOOST = 1.3;
// Emitters closer than this share one glow (a desk of screens doesn't sum to white).
const CLUSTER_RADIUS = 32;
// Re-check variant conditions and texture swaps at most this often.
const RESOLVE_MS = 250;
// Built-in variant for ransom screens: they show a red lock (ransomware-display minigame).
// offsetY comes from the base entry (kiosk screens sit high). `ransom` keeps the glow
// above the light map in lit rooms too, and tints the floor red (see the draw loop).
const RANSOM_VARIANT = { condition: 'globalVars.ransomware_deployed', color: 0xff3b30, radius: 44, intensity: 0.8, effect: 'breathe', ransom: true, floorTint: 0.85 };
// Below this room level, glows draw above the light map so they bloom in the dark.
const GLOW_ABOVE_LEVEL = 0.5;
// A glow whose centre a character stands in front of fades to this.
const GLOW_COVERED = 0.3;
// Ransom red on a lit floor: MULTIPLY tint stamped into the light map (cuts G and B).
const RANSOM_FLOOR_TINT = 0xff6a5c;
// A ransom screen's glow and floor tint widen to this radius in a fully lit room.
const RANSOM_LIT_RADIUS = 56;
// Other emitters with floorTint (a room "emitters" variant) tint the floor in front of
// them with their own colour, mixed this far from white.
const FLOOR_TINT_MIX = 0.45;
// A panel's add is this times the lit ambient's distance from white (capped at 0.5).
const PANEL_HEADROOM = 0.8;
// Ceiling light: the lit ambient's hue, blended this far towards white.
const PANEL_WHITE_MIX = 0.35;

function luma(c) {
  return (0.2126 * ((c >> 16) & 255) + 0.7152 * ((c >> 8) & 255) + 0.0722 * (c & 255)) / 255;
}

/** A light's colour from a room's lit ambient: the same hue at full brightness. */
function lightColorFor(ambient) {
  const r = (ambient >> 16) & 255, g = (ambient >> 8) & 255, b = ambient & 255;
  const m = Math.max(r, g, b);
  if (!m) return 0xffffff;
  const s = 255 / m;
  return (Math.round(r * s) << 16) | (Math.round(g * s) << 8) | Math.round(b * s);
}

/** Ceiling and spill light for a room: its ambient's hue, mostly white. */
function panelColorFor(ambient) {
  return lerpColor(lightColorFor(ambient), 0xffffff, PANEL_WHITE_MIX);
}

const smooth = (t) => t * t * (3 - 2 * t);

// Fluorescent strike: [ms, level] keyframes, played per panel with a random delay.
// Kept to two flashes per tube, and the faulty panel to two short dips per burst, so
// nothing flashes more than three times a second (WCAG 2.3.1). With reduced motion
// set, tubes fade up instead and the faulty panel holds steady.
const STRIKE_SEQUENCE = [[0, 0], [60, 0.7], [160, 0.12], [420, 0.12], [460, 1]];
const FADE_MS = 400;
const DIP_MS = 90;
const DIP_LEVEL = 0.55;

function prefersReducedMotion() {
  try { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true; } catch (e) { return false; }
}

// Objects that give off light, matched on texture key.
const EMITTERS = [
  { re: /^(pc\d*|laptop\d*|monitor|security_monitor|workstation|vm-launcher|ehr-terminal|cctv_monitors|info_screen|conference_screen|nurse_call_display|drug_library_terminal|lab-workstation|kvm_cart|log_filter_terminal|forensic_data_platform|flag-station|backup_recovery|dual_auth|siem_dashboard|sis_config_panel|smartscreen|network_architecture|tablet)/,
    color: 0x9fd4ff, radius: 44, intensity: 0.65, offsetY: 6, effect: 'screen' },
  { re: /^checkin_kiosk/, color: 0x9fd4ff, radius: 44, intensity: 0.65, offsetY: -14, effect: 'screen' },
  { re: /^screens/, color: 0x9fd4ff, radius: 72, intensity: 0.45, offsetY: 16, effect: 'screen' },
  { re: /(lamp)/, color: 0xffd9a0, radius: 80, intensity: 0.9, effect: null },
  { re: /^(server|network_rack|comms_cabinet|pi_cluster|rack|storage_array|tape_library)/, color: 0x6dffb0, radius: 40, intensity: 0.45, effect: 'blink', leds: 1 },
  { re: /^batrack/, color: 0x7dffa8, radius: 30, intensity: 0.35, effect: null, leds: 0.5 },
  { re: /^(ups_cabinet)/, color: 0x8dff9a, radius: 30, intensity: 0.4, effect: 'screen', leds: 0.4 },
  { re: /^(power_panel|suppression_panel)/, color: 0xffb347, radius: 22, intensity: 0.45, effect: 'pulse' },
  { re: /^exit_sign/, color: 0x5dff8a, radius: 44, intensity: 0.8, effect: null },
  { re: /(vending|medicine_fridge)/, color: 0xe0f0ff, radius: 60, intensity: 0.7, effect: null },
  { re: /^xray_lightbox/, color: 0xd8ecff, radius: 52, intensity: 0.7, offsetY: 4, effect: null },
  { re: /^vitals-monitor/, color: 0x7dffc8, radius: 30, intensity: 0.5, offsetY: -18, effect: 'screen' },  // screen on top of a pole stand
  { re: /^(bp_monitor|infusion_pump|bedhead_unit|bedhead_panel|crash_cart|crash-cart)/, color: 0x7dffc8, radius: 30, intensity: 0.5, effect: 'screen' },
  { re: /^(fire_alarm_point)/, color: 0xff5050, radius: 26, intensity: 0.6, effect: 'pulse' },
  { re: /^alarm_panel/, color: 0xffe2a0, radius: 22, intensity: 0.35, effect: null },
  { re: /^emergency-button/, color: 0xff5050, radius: 18, intensity: 0.35, effect: null },
];

/** A scenario emitter variant with its colours parsed. */
function normaliseVariant(v) {
  if (!v || typeof v !== 'object') return null;
  const out = { ...v };
  if ('color' in out) out.color = parseColor(out.color, 0xffffff);
  if ('ledColor' in out) out.ledColor = parseColor(out.ledColor, null);
  return out;
}

function parseColor(value, fallback) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value.replace('#', ''), 16);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

function sampleSequence(seq, t) {
  if (t <= seq[0][0]) return seq[0][1];
  for (let i = 1; i < seq.length; i++) {
    if (t < seq[i][0]) return seq[i - 1][1];
  }
  return seq[seq.length - 1][1];
}

/** Rectangle a minus rectangle b, as up to four rectangles. */
function subtractRect(a, b) {
  const ax2 = a.x + a.w, ay2 = a.y + a.h, bx2 = b.x + b.w, by2 = b.y + b.h;
  if (b.x >= ax2 || bx2 <= a.x || b.y >= ay2 || by2 <= a.y) return [a];
  const out = [];
  if (b.y > a.y) out.push({ x: a.x, y: a.y, w: a.w, h: b.y - a.y });
  if (by2 < ay2) out.push({ x: a.x, y: by2, w: a.w, h: ay2 - by2 });
  const top = Math.max(a.y, b.y), bottom = Math.min(ay2, by2);
  if (b.x > a.x) out.push({ x: a.x, y: top, w: b.x - a.x, h: bottom - top });
  if (bx2 < ax2) out.push({ x: bx2, y: top, w: ax2 - bx2, h: bottom - top });
  return out;
}

function lightingDisabledByPlayer() {
  try {
    const param = new URLSearchParams(window.location.search).get('lighting');
    if (param === 'off' || param === '0') return true;
    if (window.localStorage?.getItem('breakEscapeLighting') === 'off') return true;
  } catch (e) { /* storage blocked */ }
  return false;
}

export class LightingSystem {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = config;
    this.defaultMode = config.defaultMode || 'on';
    this.rooms = new Map();   // roomId -> lighting state
    this.subscribed = false;
    this.reducedMotion = prefersReducedMotion();

    this.createLightTexture();
    const cam = scene.cameras.main;
    this.lightMap = scene.add.renderTexture(0, 0, (cam.width + MARGIN * 2) * RES, (cam.height + MARGIN * 2) * RES)
      .setOrigin(0, 0)
      .setScale(1 / RES)
      .setDepth(LIGHT_DEPTH)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    scene.scale.on('resize', () => this.resizeLightMap());
  }

  createLightTexture() {
    if (!this.scene.textures.exists(BLOCK_TEX)) {
      const block = this.scene.textures.createCanvas(BLOCK_TEX, BLOCK_SIZE, BLOCK_SIZE);
      const bctx = block.getContext();
      bctx.fillStyle = '#ffffff';
      bctx.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      block.refresh();
    }
    if (!this.scene.textures.exists(LED_TEX)) {
      const led = this.scene.textures.createCanvas(LED_TEX, 3, 3);
      const lctx = led.getContext();
      lctx.fillStyle = 'rgba(255,255,255,0.45)';
      lctx.fillRect(0, 0, 3, 3);
      lctx.fillStyle = '#ffffff';
      lctx.fillRect(1, 1, 1, 1);
      led.refresh();
    }
    if (!this.scene.textures.exists(CONE_TEX)) {
      // A torch beam pointing along +x from the middle of the left edge.
      const s = LIGHT_TEX_SIZE;
      const cone = this.scene.textures.createCanvas(CONE_TEX, s, s);
      const cctx = cone.getContext();
      const img = cctx.createImageData(s, s);
      const half = Math.PI / 7;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const dx = x, dy = y - s / 2;
          const r = Math.hypot(dx, dy) / s;
          const a = Math.abs(Math.atan2(dy, dx));
          let v = 0;
          if (r <= 1 && a < half) {
            const edge = Math.min(1, (half - a) / (half * 0.45));
            v = edge * Math.pow(1 - r, 1.3) * Math.min(1, r * 6);
          }
          const i = (y * s + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(v * 255);
        }
      }
      cctx.putImageData(img, 0, 0);
      cone.refresh();
      cone.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    if (this.scene.textures.exists(LIGHT_TEX)) return;
    const s = LIGHT_TEX_SIZE;
    const tex = this.scene.textures.createCanvas(LIGHT_TEX, s, s);
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    // Smooth falloff, (1 - t²)^2.7, sampled finely: straight-line stops left a visible
    // rim (Mach band) round each pool. The exponent keeps the same total light as the
    // old linear stops, so pools and glows are no brighter or dimmer overall.
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      g.addColorStop(t, `rgba(255,255,255,${Math.pow(1 - t * t, 2.7).toFixed(4)})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  resizeLightMap() {
    const cam = this.scene.cameras.main;
    const w = (cam.width + MARGIN * 2) * RES, h = (cam.height + MARGIN * 2) * RES;
    if (this.lightMap.width !== w || this.lightMap.height !== h) {
      this.lightMap.resize(w, h);
    }
  }

  subscribe() {
    const dispatcher = window.eventDispatcher;
    if (!dispatcher || this.subscribed) return;
    this.subscribed = true;
    dispatcher.on('room_entered', (data) => this.onRoomEntered(data?.roomId));
    dispatcher.on('room_exited', (data) => this.onRoomExited(data?.roomId));
  }

  /** Called by createRoom once a room's tiles and objects exist. */
  registerRoom(roomId, roomData) {
    const room = window.rooms?.[roomId];
    if (!room || this.rooms.has(roomId)) return;
    const cfg = roomData?.lighting || {};
    const mode = cfg.mode || this.defaultMode;
    // Only people who are actually standing in the room: not phone contacts, not
    // characters held back for a cutscene.
    const hasNpcs = (roomData?.npcs || []).some(n => n.npcType !== 'phone' && !n.behavior?.initiallyHidden);
    const startsOn = mode === 'on' || (mode === 'motion' && hasNpcs && cfg.startOn !== false);

    const litAmbient = parseColor(cfg.ambient, parseColor(this.config.ambient, DEFAULT_LIT_AMBIENT));
    // Per-room emitter variants: { key: [variant, ...] }, key = object id or texture-key prefix.
    const emitterCfg = {};
    for (const [key, val] of Object.entries(cfg.emitters || {})) {
      const list = (Array.isArray(val) ? val : [val]).map(normaliseVariant).filter(Boolean);
      if (list.length) emitterCfg[key] = list;
    }
    const state = {
      roomId,
      mode,
      cfg,
      on: startsOn,
      litAmbient,
      darkAmbient: parseColor(cfg.darkAmbient, parseColor(this.config.darkAmbient, DEFAULT_DARK_AMBIENT)),
      // Ceiling light and door spill take the lit ambient's hue (warm mood, warm tubes).
      panelColor: panelColorFor(litAmbient),
      // A panel adds just enough to take the floor under it to about white, so the lit
      // ambient's colour and darkness still show between and round the pools (a flat
      // 0.5 saturated most of a lit room to white).
      panelAdd: Math.min(0.5, (1 - luma(litAmbient)) * PANEL_HEADROOM),
      // Glows fade as the room lights up; a darker lit ambient leaves them more of their
      // glow (1 at the default ambient or brighter, 0 at a very dark one).
      glowLitFade: Phaser.Math.Clamp((luma(litAmbient) - 0.45) / (luma(DEFAULT_LIT_AMBIENT) - 0.45), 0, 1),
      emitterCfg,
      objectSig: '',
      lastResolve: -Infinity,
      panels: cfg.panels === false ? [] : this.layoutPanels(room),
      extraLights: (cfg.lights || []).map(l => ({
        x: room.position.x + l.x * TILE_SIZE,
        y: room.position.y + l.y * TILE_SIZE,
        color: parseColor(l.color, panelColorFor(litAmbient)),
        radius: l.radius || 80,
        intensity: l.intensity ?? 0.8,
      })),
      emitters: [],
      offTimer: null,
    };
    state.panels.forEach(p => { p.level = startsOn ? 1 : 0; p.strikeAt = null; });
    if (cfg.flicker && state.panels.length) {
      state.panels[Math.floor(Math.random() * state.panels.length)].faulty = true;
    }
    this.rooms.set(roomId, state);
  }

  /** Ceiling panels on a regular grid over the floor (the top two tile rows are wall). */
  layoutPanels(room) {
    const w = room.map.widthInPixels;
    const h = room.map.heightInPixels;
    const floorTop = TILE_SIZE * 2;
    const floorH = h - floorTop;
    const spacing = TILE_SIZE * 4;
    const cols = Math.max(1, Math.round(w / spacing));
    const rows = Math.max(1, Math.round(floorH / spacing));
    const panels = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        panels.push({
          x: room.position.x + (c + 0.5) * (w / cols),
          y: room.position.y + floorTop + (r + 0.5) * (floorH / rows),
          radius: spacing * 0.8,
        });
      }
    }
    return panels;
  }

  /**
   * Emitters for a room's objects. Rebuilt when an object is added or removed or a
   * texture changes (spriteVariants swaps); variant conditions are re-resolved at most
   * every RESOLVE_MS.
   */
  refreshEmitters(state, time) {
    const room = window.rooms?.[state.roomId];
    if (!room?.objects) return;
    const objs = Object.values(room.objects);
    const due = time - state.lastResolve >= RESOLVE_MS;
    if (!due && objs.length === state.emitterObjCount) return;
    if (due) state.lastResolve = time;
    const sig = objs.map(o => o?.texture?.key || '').join('|');
    if (sig !== state.objectSig) {
      state.objectSig = sig;
      state.emitterObjCount = objs.length;
      this.buildEmitters(state, objs);
    } else if (!due) {
      return;
    }
    this.resolveEmitters(state);
  }

  /** Room variants for an object: by object id first, then the longest texture-key prefix. */
  variantsFor(state, obj, key) {
    const cfg = state.emitterCfg;
    const id = obj.scenarioData?.id ?? obj.objectId;
    let list = (id && cfg[id]) || null;
    if (!list) {
      let best = '';
      for (const k of Object.keys(cfg)) {
        if (key.startsWith(k) && k.length > best.length) best = k;
      }
      if (best) list = cfg[best];
    }
    const out = list ? [...list] : [];
    if (obj.scenarioData?.lockType === 'ransomware_display') out.push(RANSOM_VARIANT);
    return out;
  }

  buildEmitters(state, objs) {
    state.emitters.forEach(e => { e.glow?.destroy(); e.leds?.forEach(l => l.img.destroy()); });
    state.emitters = [];
    for (const obj of objs) {
      const key = obj?.texture?.key;
      if (!key) continue;
      const base = EMITTERS.find(d => d.re.test(key)) || null;
      const variants = this.variantsFor(state, obj, key);
      // Without an EMITTERS match, an object glows only through a variant that says how.
      if (!base && !variants.some(v => v.color != null && v.radius != null)) continue;
      const glow = this.scene.add.image(0, 0, LIGHT_TEX)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setVisible(false);
      state.emitters.push({
        obj, key, base, variants, def: null, variantIdx: -2, glow,
        phase: Math.random() * Math.PI * 2,
        leds: base ? this.createLeds(obj, base) : [],
        glowK: 1, stampK: 1,
      });
    }
  }

  /** Pick each emitter's variant against the current globals; re-tint on a change. */
  resolveEmitters(state) {
    const gv = window.gameState?.globalVariables || {};
    let changed = false;
    for (const e of state.emitters) {
      let idx = -1;
      for (let i = 0; i < e.variants.length; i++) {
        const v = e.variants[i];
        let holds = !v.condition;
        if (!holds) {
          try { holds = evaluateGlobalCondition(v.condition, gv); } catch (err) { holds = false; }
        }
        if (holds) { idx = i; break; }
      }
      if (idx === e.variantIdx) continue;
      e.variantIdx = idx;
      changed = true;
      let def = e.base;
      if (idx >= 0) {
        const merged = { ...(e.base || {}), ...e.variants[idx] };
        def = (merged.color != null && merged.radius != null) ? merged : null;
      }
      e.def = def;
      if (!def) continue;
      e.glow.setTint(def.color).setScale((def.radius * 0.6) / (LIGHT_TEX_SIZE / 2));
      e.leds.forEach(l => l.img.setTint(def.ledColor ?? l.color));
    }
    if (changed) this.clusterEmitters(state);
  }

  /** Emitters within CLUSTER_RADIUS of each other share their glow. */
  clusterEmitters(state) {
    const c = this.tmpCentre || (this.tmpCentre = new Phaser.Math.Vector2());
    // Only plain screens share a glow with other plain screens. Racks stand in rows on
    // purpose, a lamp beside a PC is a different light, and a ransom screen is the
    // story: none of those are damped.
    const live = state.emitters.filter(e => e.def && e.obj?.active && !e.leds.length
      && e.def.effect === 'screen' && !e.def.ransom);
    const pts = live.map(e => { const p = e.obj.getCenter ? e.obj.getCenter(c) : e.obj; return { x: p.x, y: p.y }; });
    state.emitters.forEach(e => { e.glowK = 1; e.stampK = 1; });
    live.forEach((e, i) => {
      let n = 0;
      for (let j = 0; j < pts.length; j++) {
        if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) <= CLUSTER_RADIUS) n++;
      }
      e.glowK = 1 / n;
      e.stampK = 1 / Math.sqrt(n);
    });
  }

  /** Status LEDs scattered over the face of a rack, each blinking at its own rate. */
  createLeds(obj, def) {
    if (!def.leds) return [];
    const w = obj.displayWidth, h = obj.displayHeight;
    const count = Math.round(Math.max(3, Math.min(14, (w * h) / 260)) * def.leds);
    const leds = [];
    for (let i = 0; i < count; i++) {
      const color = LED_COLORS[Math.floor(Math.random() * LED_COLORS.length)];
      const img = this.scene.add.image(0, 0, LED_TEX)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(LIGHT_DEPTH + 2)
        .setTint(color)
        .setVisible(false);
      leds.push({
        img,
        color,
        // Offsets from the sprite's top-left, kept to the front panel.
        dx: Math.round(3 + Math.random() * Math.max(1, w - 6)),
        dy: Math.round(4 + Math.random() * Math.max(1, h * 0.7 - 4)),
        period: 150 + Math.random() * 1800,
        duty: Math.random() < 0.3 ? 1 : 0.2 + Math.random() * 0.6,
        offset: Math.random() * 2000,
      });
    }
    return leds;
  }

  onRoomEntered(roomId) {
    const state = this.rooms.get(roomId);
    if (!state) return;
    if (state.offTimer) { clearTimeout(state.offTimer); state.offTimer = null; }
    if (state.mode === 'motion' && !state.on) this.switchOn(roomId);
  }

  onRoomExited(roomId) {
    const state = this.rooms.get(roomId);
    if (!state || state.mode !== 'motion' || !state.cfg.offAfter) return;
    if (state.offTimer) clearTimeout(state.offTimer);
    const arm = () => {
      state.offTimer = setTimeout(() => {
        state.offTimer = null;
        if (window.currentPlayerRoom === roomId) return;
        // The sensor still sees someone: wait for them to leave too.
        if (this.npcInRoom(state)) { arm(); return; }
        this.switchOff(roomId);
      }, state.cfg.offAfter * 1000);
    };
    arm();
  }

  /** Lights on with a fluorescent strike (or instantly with animate:false). */
  switchOn(roomId, { animate = true } = {}) {
    const state = this.rooms.get(roomId);
    if (!state) return;
    state.on = true;
    const now = this.scene.time.now;
    state.panels.forEach(p => {
      if (animate) {
        p.strikeAt = now + 120 + Math.random() * 380;
      } else {
        p.level = 1; p.strikeAt = null;
      }
    });
  }

  switchOff(roomId) {
    const state = this.rooms.get(roomId);
    if (!state) return;
    state.on = false;
    state.panels.forEach(p => { p.level = 0; p.strikeAt = null; });
  }

  /** How loud a room's sounds are where the player is: own room 1, through a door 0.4, else 0. */
  hearing(roomId) {
    const here = window.currentPlayerRoom;
    if (!roomId || roomId === here) return 1;
    const doors = window.rooms?.[here]?.doorSprites || [];
    return doors.some(d => d.doorProperties?.connectedRoom === roomId) ? 0.4 : 0;
  }

  /** A fluorescent tube's tink as it strikes, synthesised (no asset). */
  playStrikeClick(final, roomId) {
    const sm = window.soundManager;
    const snd = this.scene.sound;
    const ctx = snd?.context;
    if (!ctx || snd.mute || (sm && sm.enabled === false)) return;
    const near = this.hearing(roomId);
    if (near <= 0) return;
    const now = ctx.currentTime;
    if (this.lastClick && now - this.lastClick < 0.05) return;
    this.lastClick = now;
    const volume = near * (sm ? sm.volumeSettings.effects * sm.masterVolume : 0.8) * (final ? 0.22 : 0.15);
    if (volume <= 0) return;

    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.05);
      this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2600 + Math.random() * 1200;
    band.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(band).connect(gain).connect(snd.destination || ctx.destination);
    src.start(now);

    if (final) {
      // A short mains hum as the tube settles.
      const hum = ctx.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.value = 100;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0, now);
      hg.gain.linearRampToValueAtTime(volume * 0.18, now + 0.05);
      hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      hum.connect(lp).connect(hg).connect(snd.destination || ctx.destination);
      hum.start(now);
      hum.stop(now + 1);
    }
  }

  roomLevel(state) {
    if (!state.panels.length) return state.on ? 1 : 0;
    let sum = 0;
    // A faulty tube's dip shows in its own pool, not as the whole room dimming.
    for (const p of state.panels) sum += (p.faulty && p.strikeAt === null && state.on) ? 1 : p.level;
    return sum / state.panels.length;
  }

  updatePanels(state, now) {
    for (const p of state.panels) {
      if (p.strikeAt !== null) {
        const t = now - p.strikeAt;
        const before = p.level;
        if (this.reducedMotion) {
          p.level = Phaser.Math.Clamp(t / FADE_MS, 0, 1);
          if (p.level >= 1) { p.strikeAt = null; this.playStrikeClick(true, state.roomId); }
          continue;
        }
        p.level = t < 0 ? 0 : sampleSequence(STRIKE_SEQUENCE, t);
        if (before < 0.5 && p.level >= 0.5) this.playStrikeClick(p.level >= 1, state.roomId);
        if (t >= STRIKE_SEQUENCE[STRIKE_SEQUENCE.length - 1][0]) p.strikeAt = null;
      } else if (state.on && p.faulty && !this.reducedMotion) {
        // Mostly steady; every few seconds, one or two short dips.
        if (!p.dips || now > p.nextBurst) {
          const first = now + 2500 + Math.random() * 6000;
          p.dips = Math.random() < 0.5 ? [first] : [first, first + 260 + Math.random() * 200];
          p.nextBurst = p.dips[p.dips.length - 1] + DIP_MS;
        }
        p.level = p.dips.some(d => now >= d && now < d + DIP_MS) ? DIP_LEVEL : 1;
      }
    }
  }

  /** Motion sensors see NPCs too: a patrol walking into a dark room switches it on. */
  checkNpcMotion(time) {
    if (this.nextNpcCheck && time < this.nextNpcCheck) return;
    this.nextNpcCheck = time + 300;
    const npcs = window.npcManager?.npcs;
    if (!npcs) return;
    for (const state of this.rooms.values()) {
      if (state.mode !== 'motion' || state.on) continue;
      if (this.npcInRoom(state)) this.switchOn(state.roomId);
    }
  }

  /** Is a visible NPC standing on this room's floor? */
  npcInRoom(state) {
    const npcs = window.npcManager?.npcs;
    const room = window.rooms?.[state.roomId];
    if (!npcs || !room?.map) return false;
    const x0 = room.position.x, y0 = room.position.y + TILE_SIZE * 2;
    const x1 = room.position.x + room.map.widthInPixels, y1 = room.position.y + room.map.heightInPixels;
    for (const npc of npcs.values()) {
      const sp = npc._sprite;
      if (!sp?.active || !sp.visible) continue;
      if (sp.x >= x0 && sp.x <= x1 && sp.y >= y0 && sp.y <= y1) return true;
    }
    return false;
  }

  /** Characters' figures (frame padding trimmed) and depths, for hiding LEDs behind them. */
  collectFigures() {
    const out = this.figures || (this.figures = []);
    out.length = 0;
    const add = (sp, padBottom) => {
      if (!sp?.active || !sp.visible) return;
      const w = sp.displayWidth, h = sp.displayHeight;
      const left = sp.x - w * sp.originX, top = sp.y - h * sp.originY;
      out.push({ x0: left + w * 0.2, x1: left + w * 0.8, y0: top + h * 0.1, y1: top + h - padBottom, depth: sp.depth });
    };
    add(window.player, SPRITE_PADDING_BOTTOM_ATLAS);
    for (const npc of window.npcManager?.npcs?.values() || []) {
      const sp = npc._sprite;
      add(sp, sp?.isAtlas ? SPRITE_PADDING_BOTTOM_ATLAS : SPRITE_PADDING_BOTTOM_LEGACY);
    }
    return out;
  }

  /** A point on an object (at objDepth) is hidden if a character stands in front of it. */
  hiddenByFigure(x, y, objDepth, figures) {
    for (const f of figures) {
      if (f.depth > objDepth && x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1) return true;
    }
    return false;
  }

  /** Does a character in front of the object (at objDepth) overlap this circle? */
  figureOverlapsCircle(cx, cy, r, objDepth, figures) {
    for (const f of figures) {
      if (f.depth <= objDepth) continue;
      const nx = Math.max(f.x0, Math.min(cx, f.x1)), ny = Math.max(f.y0, Math.min(cy, f.y1));
      if ((cx - nx) ** 2 + (cy - ny) ** 2 <= r * r) return true;
    }
    return false;
  }

  /**
   * Brownout: one slow dip of every room's ceiling light and ambient (generators
   * changing load). Screens and racks hold. Waits for any conversation or minigame to
   * close, so the player sees it. Skipped under prefers-reduced-motion.
   */
  dip({ level = 0.5, ms = 1600 } = {}) {
    if (this.reducedMotion) return false;
    this.pendingDip = {
      level: Phaser.Math.Clamp(Number(level) || 0.5, 0.2, 1),
      ms: Phaser.Math.Clamp(Number(ms) || 1600, 800, 4000),
      waited: false,
    };
    return true;
  }

  /** The dip's light multiplier now (1 = no dip). */
  dipFactor(time) {
    if (this.pendingDip) {
      const overlay = window.MinigameFramework?.currentMinigame;
      if (overlay) { this.pendingDip.waited = true; return 1; }
      const d = this.pendingDip;
      this.pendingDip = null;
      this.activeDip = { level: d.level, ms: d.ms, start: time + (d.waited ? 700 : 0) };
    }
    const a = this.activeDip;
    if (!a) return 1;
    const t = (time - a.start) / a.ms;
    if (t < 0) return 1;
    if (t >= 1) { this.activeDip = null; return 1; }
    // Sag over the first quarter, hold, recover over the second half.
    const shape = t < 0.25 ? smooth(t / 0.25) : t < 0.5 ? 1 : 1 - smooth((t - 0.5) / 0.5);
    return 1 - (1 - a.level) * shape;
  }

  update(time) {
    this.subscribe();
    this.checkNpcMotion(time);
    const cam = this.scene.cameras.main;
    const rt = this.lightMap;
    const view = cam.worldView;
    const covered = view.x >= rt.x && view.y >= rt.y &&
      view.right <= rt.x + rt.displayWidth && view.bottom <= rt.y + rt.displayHeight;
    if (covered && this.lastDraw !== undefined && time - this.lastDraw < REDRAW_MS) return;
    this.lastDraw = time;
    const ox = Math.floor(view.x) - MARGIN;
    const oy = Math.floor(view.y) - MARGIN;
    rt.setPosition(ox, oy);

    // Every draw below goes into one batch (skipBatch) between beginDraw and endDraw.
    // Coordinates are world positions relative to the map's origin, scaled by RES.
    const blockOpts = { originX: 0, originY: 0, tint: 0xffffff, scaleX: 1, scaleY: 1, skipBatch: true };
    const fillRect = (x, y, w, h, color) => {
      blockOpts.tint = color;
      blockOpts.scaleX = (w * RES) / BLOCK_SIZE;
      blockOpts.scaleY = (h * RES) / BLOCK_SIZE;
      rt.stamp(BLOCK_TEX, null, x * RES, y * RES, blockOpts);
    };

    rt.clear();
    rt.beginDraw();
    fillRect(0, 0, rt.width / RES, rt.height / RES, 0xffffff);

    const visible = [];
    for (const state of this.rooms.values()) {
      const room = window.rooms?.[state.roomId];
      if (!room?.map) continue;
      const rx = room.position.x, ry = room.position.y;
      const rw = room.map.widthInPixels, rh = room.map.heightInPixels;
      this.updatePanels(state, time);
      this.refreshEmitters(state, time);
      state.level = this.roomLevel(state);
      if (rx > view.right || ry > view.bottom || rx + rw < view.x || ry + rh < view.y) {
        state.emitters.forEach(e => { e.glow.setVisible(false); e.leds.forEach(l => l.img.setVisible(false)); });
        continue;
      }
      visible.push(state);
    }

    const stampOpts = { blendMode: Phaser.BlendModes.ADD, skipBatch: true };
    const multOpts = { blendMode: Phaser.BlendModes.MULTIPLY, skipBatch: true, tint: 0xffffff, alpha: 1, scale: 1 };
    const stamp = (x, y, radius, color, alpha) => {
      if (alpha <= 0.01) return;
      stampOpts.tint = color;
      stampOpts.alpha = Math.min(1, alpha);
      stampOpts.scale = (radius * RES) / (LIGHT_TEX_SIZE / 2);
      rt.stamp(LIGHT_TEX, null, (x - ox) * RES, (y - oy) * RES, stampOpts);
    };

    const player = window.player;
    const here = this.rooms.get(window.currentPlayerRoom);
    if (player) {
      const target = FACING_ANGLES[player.direction] ?? 90;
      if (this.torchAngle === undefined) this.torchAngle = target;
      const diff = ((target - this.torchAngle + 540) % 360) - 180;
      this.torchAngle = (this.torchAngle + diff * 0.25 + 360) % 360;
    }

    const dip = this.dipFactor(time);
    const figures = this.collectFigures();
    const still = this.reducedMotion;

    // Brightest rooms first: a darker room's fill then covers light that bled
    // through the wall from its lit neighbour. Among fully lit rooms, north before
    // south: a room's map overlaps the room to its south by two tiles (the south room's
    // back wall, which takes the south room's light, see fillAreas), so drawing the
    // south room later covers anything the north room stamped onto that strip (e.g. a
    // ransom floor tint). Among equally lit rooms that aren't fully lit, the player's
    // room goes first, so its torch, drawn with it, is covered where it crosses into a
    // neighbour (the torch only draws below level 1).
    const posY = (s) => window.rooms[s.roomId].position.y;
    visible.sort((a, b) => (b.level - a.level)
      || (a.level >= 1 ? posY(a) - posY(b) : (b === here) - (a === here)));
    const centre = this.tmpCentre || (this.tmpCentre = new Phaser.Math.Vector2());
    for (const state of visible) {
      // Ceiling light, ambient and extra lights run off the mains (and sag in a dip);
      // screens and racks are on UPS and hold.
      const lv = state.level * dip;
      state.drawLevel = lv;
      const ambient = lerpColor(state.darkAmbient, state.litAmbient, lv);
      for (const r of this.fillAreas(state.roomId)) {
        fillRect(Math.round(r.x - ox), Math.round(r.y - oy), r.w, r.h, ambient);
      }
      for (const p of state.panels) stamp(p.x, p.y, p.radius, state.panelColor, state.panelAdd * p.level * dip);
      for (const l of state.extraLights) stamp(l.x, l.y, l.radius, l.color, l.intensity * (state.on ? 1 : 0.6) * dip);
      const glowFade = 0.6 - 0.35 * state.level * state.glowLitFade;
      const ledLevel = 0.95 - 0.35 * state.level;
      const darkRoom = state.level < GLOW_ABOVE_LEVEL;
      for (const e of state.emitters) {
        const obj = e.obj;
        const def = e.def;
        const alive = obj?.active && obj.visible && def;
        if (!alive) { e.glow.setVisible(false); e.leds.forEach(l => l.img.setVisible(false)); continue; }
        const left = obj.x - obj.displayWidth * obj.originX;
        const top = obj.y - obj.displayHeight * obj.originY;
        const ledA = ledLevel * (def.ledAlpha ?? 1);
        for (const l of e.leds) {
          const lx = left + l.dx, ly = top + l.dy;
          const lit = ledA > 0.01 && (still || ((time + l.offset) % l.period) / l.period < l.duty)
            && !this.hiddenByFigure(lx, ly, obj.depth, figures);
          l.img.setPosition(lx, ly).setVisible(lit).setAlpha(ledA);
        }
        const c = obj.getCenter ? obj.getCenter(centre) : obj;
        const x = c.x, y = c.y + (def.offsetY || 0);
        let k = 1;
        if (!still) {
          if (def.effect === 'screen') k = 0.9 + 0.1 * Math.sin(time / 90 + e.phase);
          else if (def.effect === 'blink') k = 0.7 + 0.3 * (Math.sin(time / 140 + e.phase) > 0.6 ? 1 : 0);
          else if (def.effect === 'pulse') k = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time / 300 + e.phase));
          else if (def.effect === 'breathe') k = 0.75 + 0.25 * Math.sin(time / 700 + e.phase);
        }
        const radius = def.ransom ? def.radius + (RANSOM_LIT_RADIUS - def.radius) * state.level : def.radius;
        stamp(x, y, radius, def.color, def.intensity * k * e.stampK);
        // In a dark room (and for ransom screens) the glow draws above the light map so
        // it blooms, and fades when a character stands in front of it: screens when the
        // figure covers their centre (so the screen you're using stays lit), racks when
        // the figure overlaps the glow's inner circle (it's a big glow behind you).
        // In a lit room the glow sits just in front of its object, under the map, so
        // anyone in front covers it.
        // `above` (a variant flag): a small indicator that must stay visible in a lit
        // room takes the ransom path (above the map, figure fade, steady lit factor) but
        // keeps its own radius and gets no floor tint unless it sets floorTint.
        const above = darkRoom || def.ransom || def.above;
        if (def.ransom) e.glow.setScale((radius * 0.6) / (LIGHT_TEX_SIZE / 2));
        const covered = e.leds.length
          ? this.figureOverlapsCircle(x, y, radius * 0.3, obj.depth, figures)
          : this.hiddenByFigure(x, y, obj.depth, figures);
        e.fade = (e.fade ?? 1) + ((covered ? GLOW_COVERED : 1) - (e.fade ?? 1)) * 0.35;
        const fade = (def.ransom || def.above) ? 0.6 : glowFade;
        e.glow.setPosition(x, y).setDepth(above ? LIGHT_DEPTH + 1 : obj.depth + 0.01).setVisible(true)
          .setAlpha(Math.min(1, def.intensity * k * e.glowK * fade * (above ? e.fade : GLOW_BOOST)));
        // ADD can't colour a near-white light map, so in a lit room an emitter with
        // floorTint (ransom screens; racks in a server room) also multiplies its colour
        // into the map: red round a ransom screen, green on the floor in front of a rack.
        if (def.floorTint && state.level > 0.05) {
          const fy = def.ransom ? y : top + obj.displayHeight + 4;
          multOpts.tint = def.ransom ? RANSOM_FLOOR_TINT : lerpColor(0xffffff, def.color, FLOOR_TINT_MIX);
          multOpts.alpha = Math.min(1, def.floorTint * state.level * (def.ransom ? 0.8 + 0.2 * k : 1));
          multOpts.scale = (radius * 1.2 * RES) / (LIGHT_TEX_SIZE / 2);
          rt.stamp(LIGHT_TEX, null, (x - ox) * RES, (fy - oy) * RES, multOpts);
        }
      }
      if (state === here) this.stampTorch(rt, stamp, ox, oy, here, player);
    }
    // Spill goes on after every fill, since it is meant to cross the doorway.
    for (const state of visible) this.stampDoorSpill(state, stamp);
    rt.endDraw();
  }

  /**
   * In a dark room the player carries a phone torch: a faint pool round them and a
   * beam the way they face, cut short at the wall it points at. Drawn with the
   * player's room, so darker neighbours drawn later cover any beam that crosses a wall.
   */
  stampTorch(rt, stamp, ox, oy, here, player) {
    if (!player || here.level >= 1) return;
    const k = 1 - here.level;
    const room = window.rooms[here.roomId];
    const px = player.x, py = player.y + 4;
    const rad = Phaser.Math.DegToRad(this.torchAngle);
    const dx = Math.cos(rad), dy = Math.sin(rad);
    let reach = Infinity;
    if (dx > 0.01) reach = Math.min(reach, (room.position.x + room.map.widthInPixels - px) / dx);
    if (dx < -0.01) reach = Math.min(reach, (room.position.x - px) / dx);
    if (dy > 0.01) reach = Math.min(reach, (room.position.y + room.map.heightInPixels - py) / dy);
    if (dy < -0.01) reach = Math.min(reach, (room.position.y + TILE_SIZE - py) / dy);
    stamp(px, py + 2, 40, 0xffe6c0, 0.55 * k);
    const coneOpts = this.coneOpts || (this.coneOpts = { blendMode: Phaser.BlendModes.ADD, originX: 0, originY: 0.5, tint: 0xfff0d8, scaleX: 1.1, scaleY: 1.1, angle: 0, alpha: 1, skipBatch: true });
    coneOpts.angle = this.torchAngle;
    coneOpts.scaleX = Phaser.Math.Clamp((reach + 24) / LIGHT_TEX_SIZE, 0.35, 1.1) * RES;
    coneOpts.scaleY = 1.1 * RES;
    coneOpts.alpha = Math.min(1, 0.95 * k);
    rt.stamp(CONE_TEX, null, (px - ox) * RES, (py - oy) * RES, coneOpts);
  }

  /**
   * The part of the world a room's ambient fill covers. A room's map overlaps the
   * room to its south by two tiles: that strip is the south room's back wall, so
   * it takes the south room's light, and the north room's fill leaves it out.
   * Cached until a room is added.
   */
  fillAreas(roomId) {
    const all = window.rooms || {};
    const count = Object.keys(all).length;
    if (this.fillCacheCount !== count) {
      this.fillCache = new Map();
      this.fillCacheCount = count;
    }
    if (this.fillCache.has(roomId)) return this.fillCache.get(roomId);

    const rectOf = (r) => ({ x: r.position.x, y: r.position.y, w: r.map.widthInPixels, h: r.map.heightInPixels });
    const me = rectOf(all[roomId]);
    let pieces = [me];
    for (const [otherId, other] of Object.entries(all)) {
      if (otherId === roomId || !other?.map) continue;
      const o = rectOf(other);
      if (o.y <= me.y) continue; // only rooms further south claim the overlap
      pieces = pieces.flatMap(p => subtractRect(p, o));
    }
    this.fillCache.set(roomId, pieces);
    return pieces;
  }

  /** Light from a brighter room falls through its open doors into a darker one. */
  stampDoorSpill(state, stamp) {
    const room = window.rooms?.[state.roomId];
    for (const door of room?.doorSprites || []) {
      const props = door.doorProperties;
      if (!props?.open) continue;
      const other = this.rooms.get(props.connectedRoom);
      const otherLevel = other ? (other.drawLevel ?? other.level) : 0;
      const diff = (state.drawLevel ?? state.level) - otherLevel;
      if (diff <= 0.05) continue;
      const push = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[props.direction] || [0, 0];
      const d = TILE_SIZE * 1.2;
      stamp(door.x + push[0] * d, door.y + push[1] * d, TILE_SIZE * 2.2, state.panelColor, 0.55 * diff);
    }
  }

  destroy() {
    this.lightMap?.destroy();
    for (const state of this.rooms.values()) {
      state.emitters.forEach(e => { e.glow?.destroy(); e.leds?.forEach(l => l.img.destroy()); });
    }
    this.rooms.clear();
  }
}

/** Create the lighting system if the scenario opts in. Returns null otherwise. */
export function initLighting(scene, scenario) {
  const cfg = scenario?.lighting;
  // The Canvas renderer can't tint, so the light map would do nothing and the glows
  // would be white blobs: lighting is WebGL only.
  const webgl = scene.sys.game.renderer?.type === Phaser.WEBGL;
  if (!cfg || cfg.enabled === false || !webgl || lightingDisabledByPlayer()) {
    window.lightingSystem = null;
    return null;
  }
  window.lightingSystem?.destroy?.();
  window.lightingSystem = new LightingSystem(scene, cfg === true ? {} : cfg);
  return window.lightingSystem;
}
