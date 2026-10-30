import React, { useLayoutEffect, useRef } from 'react';
import { delayRender, continueRender } from 'remotion';
import { PIXEL_FONT } from '../fonts';
import { rng } from '../rand';

/**
 * The solid red hex curtain, ported from the Hacktivity shell's launch curtain (hacktivity app/views/game_shell/_launch_curtain.html.erb), drawn on a canvas:
 *  - the screen is a grid of cw x ch cells; each column fills SOLID red (#b3151d) from the top down to its own front,
 *  - hex digits sit inside the red: a pale lead row at the edge (#ffe3e0), a pinker band just behind it (#ff8f8a), then dark digits (#6b0c12 / #8c1119),
 *  - ragged edge: columns start at slightly different times (a slow swell plus a few narrow drips that run ahead of their neighbours),
 *  - ease-in gravity: front = q^1.6 of the screen height, q = (p - lag) / 0.65,
 *  - a share of the digits flip over time.
 * Deterministic: everything is derived from `seed` and the frame number. `p` is the fall progress 0..1 (0 = not started, 1 = fully covered).
 * The fall is slowed by `fallFrames` in the caller (shell: 1.9 s).
 */
const HEX = '0123456789ABCDEF';
const TONES = ['#ffe3e0', '#ff8f8a', '#6b0c12', '#8c1119'];
const RED = '#b3151d';
const MAX_LAG = 0.35;

export function curtainLag(n: number, seed: number): number[] {
  const r = rng(seed * 101 + 7);
  const waves: Array<{ f: number; p: number; a: number }> = [];
  for (let j = 0; j < 3; j++) waves.push({ f: 0.15 + r() * 0.35, p: r() * 6.3, a: 0.02 + r() * 0.025 });
  const count = Math.max(4, Math.round(n / 7));
  const drips: Array<{ at: number; w: number; d: number }> = [];
  for (let j = 0; j < count; j++) drips.push({ at: r() * n, w: 0.8 + r() * 2.2, d: 0.08 + r() * 0.2 });
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let v = 0.3;
    for (const w of waves) v += Math.sin(i * w.f + w.p) * w.a;
    for (const d of drips) v -= d.d * Math.exp(-Math.pow((i - d.at) / d.w, 2));
    out.push(Math.min(MAX_LAG, Math.max(0, v + (r() - 0.5) * 0.015)));
  }
  return out;
}

/** Text drawn in the curtain's own layer: each column shows it only above that column's front, so the falling curtain uncovers it. */
export type CurtainLabel = { text: string; cx: number; cy: number; size: number; fill?: string; stroke?: string };

export const HexRain: React.FC<{ frame: number; w: number; h: number; p: number; cw?: number; ch?: number; seed?: number; label?: CurtainLabel }> = ({ frame, w, h, p, cw = 20, ch = 28, seed = 5, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    const x = cv.getContext('2d'); if (!x) return;
    // canvas text only uses Press Start 2P once the face is loaded: hold the frame, then draw
    const fonts: any = (document as any).fonts;
    const ready = () => Array.from(fonts as Iterable<any>).some((f: any) => /Press Start/.test(f.family) && f.status === 'loaded');
    if (!ready()) {
      const hd = delayRender('hexrain font');
      let tries = 0;
      const poll = () => { if (ready() || ++tries > 100) { draw(); continueRender(hd); } else setTimeout(poll, 50); };
      poll();
      return;
    }
    draw();
    function draw() {
      if (!x) return;
    const cols = Math.ceil(w / cw), rows = Math.ceil(h / ch);
    const lag = curtainLag(cols, seed);
    const cells = new Uint8Array(cols * rows), flips = new Uint8Array(cols * rows);
    const r = rng(seed * 13 + 1);
    for (let i = 0; i < cells.length; i++) { cells[i] = Math.floor(r() * 16); flips[i] = r() < 0.35 ? 1 : 0; }
    const tick = Math.floor(frame / 2.7); // the shell flips every 90 ms
    x.clearRect(0, 0, w, h);
    x.imageSmoothingEnabled = false;
    x.font = `${Math.round(cw * 0.9)}px monospace`; // as in v5 (the digits always drew in the fallback monospace) x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = RED;
    const fronts: number[] = [];
    for (let c = 0; c < cols; c++) {
      const q = Math.min(1, Math.max(0, (p - lag[c]) / 0.65));
      const f = Math.pow(q, 1.6) * (h + ch * 2);
      fronts.push(f);
      if (f > 0) x.fillRect(c * cw, 0, cw, Math.min(f, h));
    }
    for (let t = 0; t < TONES.length; t++) {
      x.fillStyle = TONES[t];
      for (let c = 0; c < cols; c++) {
        const f = fronts[c];
        if (f <= 0) continue;
        for (let row = 0; row < rows && row * ch < f; row++) {
          const i = c * rows + row, away = (f - row * ch) / ch;
          const tone = away < 1 ? 0 : away < 3 ? 1 : (i % 3 ? 2 : 3);
          if (tone !== t) continue;
          const d = (cells[i] + (flips[i] ? tick * (1 + (c % 3)) : 0)) & 15;
          x.fillText(HEX[d], c * cw + cw / 2, row * ch + ch / 2 + 1);
        }
      }
    }
    if (label) {
      x.save();
      x.beginPath();
      for (let c = 0; c < cols; c++) if (fronts[c] > 0) x.rect(c * cw, 0, cw, Math.min(fronts[c], h));
      x.clip();
      x.font = `${label.size}px ${PIXEL_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineJoin = 'round'; x.lineWidth = Math.max(4, Math.round(label.size / 4));
      x.strokeStyle = label.stroke ?? '#3a0409'; x.strokeText(label.text, label.cx, label.cy);
      x.fillStyle = label.fill ?? '#ffe3e0'; x.fillText(label.text, label.cx, label.cy);
      x.restore();
    }
    }
  });
  return <canvas ref={ref} width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }} />;
};
