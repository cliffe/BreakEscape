import React from 'react';
import { PIXEL_FONT } from '../fonts';
import { rng } from '../rand';

/**
 * A curtain of falling red hex characters (0-9A-F, Press Start 2P), after the blood running down in the classic Bond gun-barrel opening:
 * it comes down from the top edge with a ragged, dripping, uneven leading edge (some columns run ahead as long drips, neighbours lag),
 * and by the end covers much of the frame. Each column is one block of hex text clipped at its front; the front glyphs are bright and the
 * body is darker, so the edge reads as a wet leading edge. Glyphs re-roll every few frames. Deterministic from the frame number and a seed.
 */
export const HexRain: React.FC<{ frame: number; w: number; h: number; build: number; color?: string; head?: string; size?: number; seed?: number; maxOpacity?: number; cover?: number }> = ({ frame, w, h, build, color = '#c4252b', head = '#ff8a80', size = 18, seed = 5, maxOpacity = 0.8, cover = 0.8 }) => {
  const pitch = size, lh = Math.round(size * 1.25);
  const cols = Math.ceil(w / pitch);
  const hex = '0123456789ABCDEF';
  const base = (h * cover) / build; // average px per frame so the mean front reaches `cover` of the height at the end of `build`
  // low-frequency raggedness shared by neighbouring columns, plus per-column jitter and a few long drips
  const lf = rng(seed * 31 + 1); const knots: number[] = []; for (let i = 0; i < Math.ceil(cols / 6) + 2; i++) knots.push(lf());
  const out: React.ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    const r = rng(seed * 1000 + c);
    const k = c / 6, i0 = Math.floor(k), t = k - i0;
    const smooth = knots[i0] * (1 - t) + knots[i0 + 1] * t;
    const jitter = r();
    let speed = base * (0.45 + 0.7 * smooth + 0.55 * jitter);
    if (r() < 0.07) speed *= 1.9;                       // a long drip
    const start = Math.floor(r() * 10);                 // columns leave the top edge at slightly different frames
    const front = Math.min(h, Math.max(0, (frame - start) * speed));
    if (front <= 0) continue;
    const rows = Math.ceil(front / lh);
    let txt = '';
    for (let j = 0; j < rows; j++) txt += hex[Math.floor(rng(seed * 7919 + c * 131 + j * 17 + Math.floor((frame + c * 3 + j * 5) / 4))() * 16)] + '\n';
    const fade = Math.min(1, frame / 8);
    out.push(
      <div key={c} style={{
        position: 'absolute', left: c * pitch, top: 0, width: pitch, height: front, overflow: 'hidden', whiteSpace: 'pre', fontSize: size, lineHeight: `${lh}px`, textAlign: 'center',
        // bright wet front, darker body, and a lighter top so the curtain is not a solid slab
        backgroundImage: `linear-gradient(to top, ${head} 0px, ${color} ${lh * 2}px, ${color} 55%, rgba(120,15,20,0.9) 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
        opacity: maxOpacity * fade,
        WebkitMaskImage: `linear-gradient(to top, #000 0px, #000 ${Math.max(0, front - 40)}px, rgba(0,0,0,0.55) 100%)`, maskImage: `linear-gradient(to top, #000 0px, #000 ${Math.max(0, front - 40)}px, rgba(0,0,0,0.55) 100%)`,
        // text sits at the bottom of the box so the front glyph is the brightest
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}><div>{txt}</div></div>
    );
  }
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: PIXEL_FONT, textRendering: 'optimizeSpeed' as any, WebkitFontSmoothing: 'none' as any }}>{out}</div>;
};
