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
 *     "lights": [{ "x": 5, "y": 4, "color": "#ffd9a0", "radius": 80, "intensity": 0.8 }]  // tile coords
 *   }
 * Disable for one player: ?lighting=off, or localStorage breakEscapeLighting=off.
 */

import { TILE_SIZE, LIGHT_DEPTH } from '../utils/constants.js';

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
const PANEL_COLOR = 0xf6f9ff;
const SPILL_COLOR = 0xeef2ff;

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
  { re: /^(pc\d*|laptop\d*|monitor|security_monitor|workstation|vm-launcher|ehr-terminal|cctv_monitors|info_screen|conference_screen|nurse_call_display|drug_library_terminal|lab-workstation|checkin_kiosk|kvm_cart|log_filter_terminal|forensic_data_platform|flag-station|backup_recovery|dual_auth)/,
    color: 0x9fd4ff, radius: 44, intensity: 0.65, offsetY: 6, effect: 'screen' },
  { re: /(lamp)/, color: 0xffd9a0, radius: 80, intensity: 0.9, effect: null },
  { re: /^(server|network_rack|comms_cabinet|batrack|pi_cluster|rack|storage_array|tape_library)/, color: 0x6dffb0, radius: 40, intensity: 0.45, effect: 'blink', leds: 1 },
  { re: /^(ups_cabinet)/, color: 0x8dff9a, radius: 30, intensity: 0.4, effect: 'screen', leds: 0.4 },
  { re: /^(power_panel|suppression_panel|thermometer)/, color: 0xffb347, radius: 22, intensity: 0.45, effect: 'pulse' },
  { re: /^exit_sign/, color: 0x5dff8a, radius: 44, intensity: 0.8, effect: null },
  { re: /(vending|medicine_fridge)/, color: 0xe0f0ff, radius: 60, intensity: 0.7, effect: null },
  { re: /^xray_lightbox/, color: 0xd8ecff, radius: 52, intensity: 0.7, offsetY: 4, effect: null },
  { re: /^(vitals-monitor|bp_monitor|infusion_pump|bedhead_unit|bedhead_panel|crash_cart|crash-cart)/, color: 0x7dffc8, radius: 30, intensity: 0.5, effect: 'screen' },
  { re: /^(alarm_panel|fire_alarm_point|emergency-button)/, color: 0xff5050, radius: 26, intensity: 0.6, effect: 'pulse' },
];

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
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
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

    const state = {
      roomId,
      mode,
      cfg,
      on: startsOn,
      litAmbient: parseColor(cfg.ambient, parseColor(this.config.ambient, DEFAULT_LIT_AMBIENT)),
      darkAmbient: parseColor(cfg.darkAmbient, parseColor(this.config.darkAmbient, DEFAULT_DARK_AMBIENT)),
      panels: cfg.panels === false ? [] : this.layoutPanels(room),
      extraLights: (cfg.lights || []).map(l => ({
        x: room.position.x + l.x * TILE_SIZE,
        y: room.position.y + l.y * TILE_SIZE,
        color: parseColor(l.color, PANEL_COLOR),
        radius: l.radius || 80,
        intensity: l.intensity ?? 0.8,
      })),
      emitters: [],
      objectCount: -1,
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

  refreshEmitters(state) {
    const room = window.rooms?.[state.roomId];
    if (!room?.objects) return;
    const objs = Object.values(room.objects);
    if (objs.length === state.objectCount) return;
    state.objectCount = objs.length;
    state.emitters.forEach(e => { e.glow?.destroy(); e.leds?.forEach(l => l.img.destroy()); });
    state.emitters = [];
    for (const obj of objs) {
      const key = obj?.texture?.key;
      if (!key) continue;
      const def = EMITTERS.find(d => d.re.test(key));
      if (!def) continue;
      const glow = this.scene.add.image(0, 0, LIGHT_TEX)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(LIGHT_DEPTH + 1)
        .setTint(def.color)
        .setScale((def.radius * 0.6) / (LIGHT_TEX_SIZE / 2));
      state.emitters.push({ obj, def, glow, phase: Math.random() * Math.PI * 2, leds: this.createLeds(obj, def) });
    }
  }

  /** Status LEDs scattered over the face of a rack, each blinking at its own rate. */
  createLeds(obj, def) {
    if (!def.leds) return [];
    const w = obj.displayWidth, h = obj.displayHeight;
    const count = Math.round(Math.max(3, Math.min(14, (w * h) / 260)) * def.leds);
    const leds = [];
    for (let i = 0; i < count; i++) {
      const img = this.scene.add.image(0, 0, LED_TEX)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(LIGHT_DEPTH + 2)
        .setTint(LED_COLORS[Math.floor(Math.random() * LED_COLORS.length)]);
      leds.push({
        img,
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
    state.offTimer = setTimeout(() => {
      state.offTimer = null;
      if (window.currentPlayerRoom !== roomId) this.switchOff(roomId);
    }, state.cfg.offAfter * 1000);
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

  /** A fluorescent tube's tink as it strikes, synthesised (no asset). */
  playStrikeClick(final) {
    const sm = window.soundManager;
    const snd = this.scene.sound;
    const ctx = snd?.context;
    if (!ctx || snd.mute || (sm && sm.enabled === false)) return;
    const now = ctx.currentTime;
    if (this.lastClick && now - this.lastClick < 0.05) return;
    this.lastClick = now;
    const volume = (sm ? sm.volumeSettings.effects * sm.masterVolume : 0.8) * (final ? 0.22 : 0.15);
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
    for (const p of state.panels) sum += p.level;
    return sum / state.panels.length;
  }

  updatePanels(state, now) {
    for (const p of state.panels) {
      if (p.strikeAt !== null) {
        const t = now - p.strikeAt;
        const before = p.level;
        if (this.reducedMotion) {
          p.level = Phaser.Math.Clamp(t / FADE_MS, 0, 1);
          if (p.level >= 1) { p.strikeAt = null; this.playStrikeClick(true); }
          continue;
        }
        p.level = t < 0 ? 0 : sampleSequence(STRIKE_SEQUENCE, t);
        if (before < 0.5 && p.level >= 0.5) this.playStrikeClick(p.level >= 1);
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
      const room = window.rooms?.[state.roomId];
      if (!room?.map) continue;
      const x0 = room.position.x, y0 = room.position.y + TILE_SIZE * 2;
      const x1 = room.position.x + room.map.widthInPixels, y1 = room.position.y + room.map.heightInPixels;
      for (const npc of npcs.values()) {
        const sp = npc._sprite;
        if (!sp?.active || !sp.visible) continue;
        if (sp.x >= x0 && sp.x <= x1 && sp.y >= y0 && sp.y <= y1) { this.switchOn(state.roomId); break; }
      }
    }
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
      this.refreshEmitters(state);
      state.level = this.roomLevel(state);
      if (rx > view.right || ry > view.bottom || rx + rw < view.x || ry + rh < view.y) {
        state.emitters.forEach(e => { e.glow.setVisible(false); e.leds.forEach(l => l.img.setVisible(false)); });
        continue;
      }
      visible.push(state);
    }

    const stampOpts = { blendMode: Phaser.BlendModes.ADD, skipBatch: true };
    const coneOpts = { blendMode: Phaser.BlendModes.ADD, originX: 0, originY: 0.5, tint: 0xfff0d8, scaleX: 1.1, scaleY: 1.1, angle: 0, alpha: 1, skipBatch: true };
    const stamp = (x, y, radius, color, alpha) => {
      if (alpha <= 0.01) return;
      stampOpts.tint = color;
      stampOpts.alpha = Math.min(1, alpha);
      stampOpts.scale = (radius * RES) / (LIGHT_TEX_SIZE / 2);
      rt.stamp(LIGHT_TEX, null, (x - ox) * RES, (y - oy) * RES, stampOpts);
    };

    // Brightest rooms first: a darker room's fill then covers light that bled
    // through the wall from its lit neighbour.
    visible.sort((a, b) => b.level - a.level);
    const centre = this.tmpCentre || (this.tmpCentre = new Phaser.Math.Vector2());
    for (const state of visible) {
      const room = window.rooms[state.roomId];
      const ambient = lerpColor(state.darkAmbient, state.litAmbient, state.level);
      for (const r of this.fillAreas(state.roomId)) {
        fillRect(Math.round(r.x - ox), Math.round(r.y - oy), r.w, r.h, ambient);
      }
      for (const p of state.panels) stamp(p.x, p.y, p.radius, PANEL_COLOR, 0.5 * p.level);
      for (const l of state.extraLights) stamp(l.x, l.y, l.radius, l.color, l.intensity * (state.on ? 1 : 0.6));
      for (const e of state.emitters) {
        const obj = e.obj;
        const alive = obj?.active && obj.visible;
        if (!alive) { e.glow.setVisible(false); e.leds.forEach(l => l.img.setVisible(false)); continue; }
        const left = obj.x - obj.displayWidth * obj.originX;
        const top = obj.y - obj.displayHeight * obj.originY;
        for (const l of e.leds) {
          const lit = ((time + l.offset) % l.period) / l.period < l.duty;
          l.img.setPosition(left + l.dx, top + l.dy).setVisible(lit).setAlpha(0.95 - 0.35 * state.level);
        }
        const c = obj.getCenter ? obj.getCenter(centre) : obj;
        const x = c.x, y = c.y + (e.def.offsetY || 0);
        let k = 1;
        if (e.def.effect === 'screen') k = 0.9 + 0.1 * Math.sin(time / 90 + e.phase);
        else if (e.def.effect === 'blink') k = 0.7 + 0.3 * (Math.sin(time / 140 + e.phase) > 0.6 ? 1 : 0);
        else if (e.def.effect === 'pulse') k = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time / 300 + e.phase));
        stamp(x, y, e.def.radius, e.def.color, e.def.intensity * k);
        e.glow.setPosition(x, y).setVisible(true).setAlpha(e.def.intensity * k * (0.6 - 0.35 * state.level));
      }
    }
    // Spill goes on after every fill, since it is meant to cross the doorway.
    for (const state of visible) this.stampDoorSpill(state, stamp);

    // In a dark room the player carries a phone torch: a faint pool round them and
    // a beam the way they face, cut short at the wall it points at.
    const player = window.player;
    const here = this.rooms.get(window.currentPlayerRoom);
    if (player) {
      const target = FACING_ANGLES[player.direction] ?? 90;
      if (this.torchAngle === undefined) this.torchAngle = target;
      const diff = ((target - this.torchAngle + 540) % 360) - 180;
      this.torchAngle = (this.torchAngle + diff * 0.25 + 360) % 360;
    }
    if (player && here && here.level < 1) {
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
      coneOpts.angle = this.torchAngle;
      coneOpts.scaleX = Phaser.Math.Clamp((reach + 24) / LIGHT_TEX_SIZE, 0.35, 1.1) * RES;
      coneOpts.scaleY = 1.1 * RES;
      coneOpts.alpha = Math.min(1, 0.95 * k);
      rt.stamp(CONE_TEX, null, (px - ox) * RES, (py - oy) * RES, coneOpts);
    }
    rt.endDraw();
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
      const otherLevel = other ? other.level : 0;
      const diff = state.level - otherLevel;
      if (diff <= 0.05) continue;
      const push = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[props.direction] || [0, 0];
      const d = TILE_SIZE * 1.2;
      stamp(door.x + push[0] * d, door.y + push[1] * d, TILE_SIZE * 2.2, SPILL_COLOR, 0.55 * diff);
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
