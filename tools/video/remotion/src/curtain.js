// The red hex curtain's per-column maths, shared by HexRain (drawing) and CtaShot (revealing the end-card title column by column).
// Plain JS so node tests can import it without a browser.
import { rng } from './rand.js';

export const MAX_LAG = 0.35;

export function curtainLag(n, seed) {
  const r = rng(seed * 101 + 7);
  const waves = [];
  for (let j = 0; j < 3; j++) waves.push({ f: 0.15 + r() * 0.35, p: r() * 6.3, a: 0.02 + r() * 0.025 });
  const count = Math.max(4, Math.round(n / 7));
  const drips = [];
  for (let j = 0; j < count; j++) drips.push({ at: r() * n, w: 0.8 + r() * 2.2, d: 0.08 + r() * 0.2 });
  const out = [];
  for (let i = 0; i < n; i++) {
    let v = 0.3;
    for (const w of waves) v += Math.sin(i * w.f + w.p) * w.a;
    for (const d of drips) v -= d.d * Math.exp(-Math.pow((i - d.at) / d.w, 2));
    out.push(Math.min(MAX_LAG, Math.max(0, v + (r() - 0.5) * 0.015)));
  }
  return out;
}

/** Front (px from the top) of every column of width cw at fall progress p: ease-in gravity, q^1.6 of (h + 2 ch). Not clamped to h. */
export function curtainFronts(p, w, h, cw = 20, ch = 28, seed = 5) {
  const cols = Math.ceil(w / cw), lag = curtainLag(cols, seed);
  const out = [];
  for (let c = 0; c < cols; c++) out.push(Math.pow(Math.min(1, Math.max(0, (p - lag[c]) / 0.65)), 1.6) * (h + ch * 2));
  return out;
}

/**
 * Clip polygon (px, relative to a box at (left, top) of size bw x bh) that keeps the part of the box where the red already is
 * (y < that column's front). The title lives in the curtain layer, so it is uncovered column by column, exactly like the curtain's text labels.
 * Returns null when nothing is visible.
 */
export function frontsClipPolygon(fronts, cw, left, top, bw, bh) {
  const pts = [];
  let any = false;
  for (let c = 0; c < fronts.length; c++) {
    const x0 = Math.max(left, c * cw), x1 = Math.min(left + bw, (c + 1) * cw);
    if (x1 <= x0) continue;
    const y = Math.min(bh, Math.max(0, fronts[c] - top));
    if (y > 0) any = true;
    pts.push([x0 - left, y], [x1 - left, y]);
  }
  if (!any || !pts.length) return null;
  const poly = [[pts[0][0], 0], ...pts, [pts[pts.length - 1][0], 0]];
  return poly;
}
export const polygonCss = (poly) => `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
