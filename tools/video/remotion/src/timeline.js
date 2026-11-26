// Shared by the composition (webpack) and the node scripts (lint, mix, srt, stills). Plain ESM, no deps.
export const ASPECTS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] };
export const dims = (edit, aspect) => (edit.aspects || ASPECTS)[aspect] || ASPECTS[aspect];

/** Join types that are drawn as an effect (anything else is a hard cut). */
export const JOIN_EFFECTS = ['glitch', 'blur', 'dissolve', 'seam', 'flip'];
/** Joins that only a Cyber Aware edit (theme "ca") may use / that a CA edit may not use. */
export const CA_ONLY_JOINS = ['seam', 'flip'];
export const CA_BANNED_JOINS = ['glitch', 'blur'];
/** Default and allowed frame counts per join type (lint enforces the ranges). */
export const JOIN_FRAMES = { glitch: { def: 6, min: 6, max: 10 }, blur: { def: 10, min: 6, max: 14 }, dissolve: { def: 8, min: 6, max: 10 }, seam: { def: 7, min: 6, max: 8 }, flip: { def: 14, min: 12, max: 16 } };

/** The join type a shot really uses: edit.effects.cardJoin ("glitch" | "dissolve") re-points every glitch/dissolve join, so one edit list renders A/B. Blur and cut are never changed. */
export function resolveJoin(edit, shot) {
  let t = shot.join?.type || 'cut';
  const sw = edit.effects?.cardJoin;
  if (sw && edit.theme !== 'ca' && edit.theme !== 'cc' && !shot.join?.pin && (t === 'glitch' || t === 'dissolve' || t === 'card')) t = sw; // join.pin: true keeps this join's own type (per-join override)
  else if (t === 'card') t = edit.theme === 'ca' ? 'seam' : edit.theme === 'cc' ? 'dissolve' : 'glitch';
  const n = t === 'cut' ? 0 : (shot.join?.frames ?? JOIN_FRAMES[t]?.def ?? 6);
  return { type: t, frames: n };
}

/**
 * Frame-accurate layout. Join windows are centred on the boundary between shots (the join belongs to the shot it leads into),
 * except dissolve: the outgoing shot is frozen on its last frame and breaks into blocks over the incoming shot, so the whole
 * window lies after the boundary. A first shot's join has only an incoming side.
 */
export function buildTimeline(edit) {
  const fps = edit.fps; let acc = 0; const shots = [];
  edit.shots.forEach((s, i) => {
    const start = Math.round(acc * fps); acc += s.duration;
    const end = Math.round(acc * fps);
    const rj = resolveJoin(edit, s);
    shots.push({ ...s, index: i, startFrame: start, endFrame: end, frames: end - start, startSec: start / fps, endSec: end / fps, joinType: rj.type, joinFrames: rj.frames });
  });
  const joins = shots.map((s, i) => {
    const t = s.joinType; const n = s.joinFrames;
    if (t === 'cut') return null;
    // first shot: effect only on the incoming side (from black); dissolve needs an outgoing shot
    let pre = i === 0 ? 0 : Math.floor(n / 2); let post = i === 0 ? n : Math.ceil(n / 2);
    if (t === 'dissolve' || t === 'seam' || t === 'flip') { pre = 0; post = n; } // outgoing shot frozen on its last frame, drawn over the incoming one
    return { type: t, frames: n, pre, post, boundary: s.startFrame, from: s.startFrame - pre, to: s.startFrame + post, index: i };
  });
  return { fps, shots, joins, totalFrames: shots.length ? shots[shots.length - 1].endFrame : 0 };
}

/** Merges edit-level seat_labels {attack, defend} under each shot's own seat_labels (shot-level wins per key). No labels: the timeline is returned unchanged. */
export function withSeatLabels(tl, labels) {
  if (!labels) return tl;
  return { ...tl, shots: tl.shots.map((s) => ({ ...s, seat_labels: { ...labels, ...(s.seat_labels || {}) } })) };
}

/** Effect state at a global frame: {type, intensity 0..1, side:'out'|'in', p 0..1, join} or null. */
export function effectAt(tl, frame) {
  for (const j of tl.joins) {
    if (!j || frame < j.from || frame >= j.to) continue;
    const side = frame < j.boundary ? 'out' : 'in';
    const k = side === 'out' ? (frame - j.from + 1) / (j.pre + 1) : 1 - (frame - j.boundary) / (j.post + 1);
    const i = Math.max(0, Math.min(1, k));
    return { type: j.type, intensity: i, side, p: (frame - j.from) / (j.to - j.from), join: j, k: frame - j.from };
  }
  return null;
}

export const shotAt = (tl, frame) => tl.shots.find((s) => frame >= s.startFrame && frame < s.endFrame) || tl.shots[tl.shots.length - 1];

/** Framing: crop window centre (fractions of the source) and zoom for an aspect, at shot-local progress t (0..1). */
export function framingAt(shot, aspect, t, sourceSize = [1920, 1080]) {
  const f = (shot.framing && shot.framing[aspect]) || {};
  let cx = f.cx ?? 0.5, cy = f.cy ?? 0.5, zoom = f.zoom ?? 1;
  const p = shot.pushin;
  if (p) {
    const a = p.start ?? 0, b = p.end ?? 1; let u = Math.max(0, Math.min(1, (t - a) / Math.max(1e-6, b - a)));
    if (p.ease === 'inOut') u = u * u * (3 - 2 * u); else if (p.ease === 'out') u = 1 - (1 - u) * (1 - u);
    const fz = p.from_zoom ?? 1, tz = (p.to_zoom_by_aspect && p.to_zoom_by_aspect[aspect]) ?? p.to_zoom ?? 2; const foc = (p.focus_by_aspect && p.focus_by_aspect[aspect]) || p.focus || { x: cx, y: cy };
    zoom = zoom * (fz + (tz - fz) * u);
    cx = cx + (foc.x - cx) * u; cy = cy + (foc.y - cy) * u;
  }
  return { cx, cy, zoom };
}

/** Visible source rectangle (fractions of source) for output W x H. */
export function visibleRect(fr, outW, outH, sourceSize = [1920, 1080]) {
  const [sw, sh] = sourceSize; const s0 = Math.max(outW / sw, outH / sh); const s = s0 * fr.zoom;
  const vw = outW / s / sw, vh = outH / s / sh; // fractions
  // zoom < 1 (letterbox): an axis wider than the source is centred, the other is clamped as usual; the gaps stay black.
  const cx = vw >= 1 ? 0.5 : Math.max(vw / 2, Math.min(1 - vw / 2, fr.cx)), cy = vh >= 1 ? 0.5 : Math.max(vh / 2, Math.min(1 - vh / 2, fr.cy));
  return { x0: cx - vw / 2, x1: cx + vw / 2, y0: cy - vh / 2, y1: cy + vh / 2, scale: s, cx, cy };
}

export function cardLines(shot) {
  return (shot.text || []).map((l) => (typeof l === 'string' ? { text: l } : l));
}

/** Where a gameplay shot's footage lives: {dir:'takes'|'clips', file}. source.type 'clip' = any synced video file (assets/placeholders etc.). */
export function sourceRef(shot) {
  const src = shot.source || (shot.type === 'title' || shot.type === 'cta' ? shot.clip : null); if (!src?.file) return null;
  return { dir: src.type === 'clip' ? 'clips' : 'takes', file: src.file };
}
/**
 * Still frame: a gameplay shot with `freeze: true` holds the source frame at source.in for its whole duration; `freezeAt: <source s>`
 * holds that frame instead (`freeze` may then be left out). Picture only: the audio mix still plays the take from source.in.
 * Returns the held source second snapped to the frame grid (Math.round(t * fps) / fps), or null for a moving shot.
 */
export function freezeSec(shot, fps) {
  const src = shot?.source; if (!src || shot.freeze === false) return null;
  const t = typeof shot.freezeAt === 'number' ? shot.freezeAt : shot.freeze === true ? (src.in ?? 0) : null;
  if (t == null || !Number.isFinite(t)) return null;
  return fps ? Math.round(t * fps) / fps : t;
}
/** `placeholder: true` marks stand-in footage (the lint lists it; --final refuses it). A string `placeholder` is only the label of the test pattern shown when a take is missing. */
export const isPlaceholderShot = (s) => s.placeholder === true;
/** Shot types that count as a "card" for the join rule (text cards, the title card, logo cards). */
export const isCardLike = (s) => s.type === 'card' || s.type === 'title' || s.type === 'cta' || s.type === 'ca_open' || s.type === 'ca_close' || s.type === 'cc_open' || s.type === 'cc_close';

/** Chip text on a seat at `localSec` (seconds from the shot's start): the seat.chips window that holds it, else none; with no chips, the plain seat.chip. */
export const chipTextAt = (seat, localSec) => (seat?.chips ? seat.chips.find((c) => localSec >= c.from - 1e-6 && localSec < c.to - 1e-6)?.text : seat?.chip);
/** Keys of ca.timing (seconds from the close's start), in rising order. */
export const CLOSE_TIMING_KEYS = ['slide_end', 'shrink_end', 'text', 'url', 'tag'];
/**
 * Frame numbers of the ca_close phases. Default (no timing): written for 3 s at 30 fps and stretched to `frames`.
 * With ca.timing { slide_end, shrink_end, text, url, tag } (seconds): the halves slide in until slide_end, shrink at once until shrink_end,
 * then the name/wordmark (text), the URL or Hacktivity line (url) and the tagline (tag) appear.
 */
export const closeFrames = (timing, frames, fps) => {
  if (!timing) {
    const T = (n) => Math.round(n * (frames / 90));
    return { slideEnd: T(24), flashEnd: T(28), shrinkStart: T(30), shrinkLen: T(22), text: T(52), url: T(56), tag: T(64) };
  }
  const F = (s) => Math.round(s * fps);
  const slideEnd = Math.max(1, F(timing.slide_end)), shrinkEnd = Math.max(slideEnd + 1, F(timing.shrink_end));
  return { slideEnd, flashEnd: slideEnd + Math.max(1, Math.round(0.05 * fps)), shrinkStart: slideEnd, shrinkLen: shrinkEnd - slideEnd, text: F(timing.text), url: F(timing.url), tag: F(timing.tag) };
};
/** Lines of a title_plate "card" title: its own \n breaks, else (stacked frames) one line per half of the words, else one line. */
export const stackedTitleLines = (text, stacked) => {
  if (String(text).includes('\n')) return String(text).split('\n');
  const words = String(text).trim().split(/\s+/);
  if (!stacked || words.length < 2) return [words.join(' ')];
  const k = Math.floor(words.length / 2); return [words.slice(0, k).join(' '), words.slice(k).join(' ')];
};
