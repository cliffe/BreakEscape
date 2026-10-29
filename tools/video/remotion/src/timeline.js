// Shared by the composition (webpack) and the node scripts (lint, mix, srt, stills). Plain ESM, no deps.
export const ASPECTS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] };
export const dims = (edit, aspect) => (edit.aspects || ASPECTS)[aspect] || ASPECTS[aspect];

/** Frame-accurate layout. Join windows are centred on the boundary between shots (join belongs to the shot it leads into). */
export function buildTimeline(edit) {
  const fps = edit.fps; let acc = 0; const shots = [];
  edit.shots.forEach((s, i) => {
    const start = Math.round(acc * fps); acc += s.duration;
    const end = Math.round(acc * fps);
    shots.push({ ...s, index: i, startFrame: start, endFrame: end, frames: end - start, startSec: start / fps, endSec: end / fps });
  });
  const joins = shots.map((s, i) => {
    const t = s.join?.type || 'cut'; const n = s.join?.frames || (t === 'glitch' ? 8 : t === 'blur' ? 10 : 0);
    if (t === 'cut') return null;
    // first shot: effect only on the incoming side (from black)
    const pre = i === 0 ? 0 : Math.floor(n / 2); const post = i === 0 ? n : Math.ceil(n / 2);
    return { type: t, frames: n, pre, post, boundary: s.startFrame, from: s.startFrame - pre, to: s.startFrame + post };
  });
  return { fps, shots, joins, totalFrames: shots.length ? shots[shots.length - 1].endFrame : 0 };
}

/** Effect state at a global frame: {type, intensity 0..1, side:'out'|'in', p 0..1, join} or null. */
export function effectAt(tl, frame) {
  for (const j of tl.joins) {
    if (!j || frame < j.from || frame >= j.to) continue;
    const side = frame < j.boundary ? 'out' : 'in';
    const k = side === 'out' ? (frame - j.from + 1) / (j.pre + 1) : 1 - (frame - j.boundary) / (j.post + 1);
    const i = Math.max(0, Math.min(1, k));
    return { type: j.type, intensity: j.index === 0 ? i : i, side, p: (frame - j.from) / (j.to - j.from), join: j };
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
  const cx = Math.max(vw / 2, Math.min(1 - vw / 2, fr.cx)), cy = Math.max(vh / 2, Math.min(1 - vh / 2, fr.cy));
  return { x0: cx - vw / 2, x1: cx + vw / 2, y0: cy - vh / 2, y1: cy + vh / 2, scale: s, cx, cy };
}

export function cardLines(shot) {
  return (shot.text || []).map((l) => (typeof l === 'string' ? { text: l } : l));
}
