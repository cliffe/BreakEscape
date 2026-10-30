import React from 'react';
import { ClipBg } from './ClipBg';
import { HexRain } from './HexRain';
import { GlitchFX } from './GlitchFX';
import { LogoMorph, logoHeight } from './EndLogos';
import { CardText, textBlockHeight } from './TextCard';
import { cardLines } from '../timeline.js';

/**
 * The closing piece (v4), one continuous shot:
 *  1. the laptop clip plays clean with the call to action beside the spy (text on the right, Press Start 2P);
 *  2. when the spy presses the keys (clip frame ~90, glow jump; shot.curtain.start a few frames later) the solid red hex curtain (HexRain, ported
 *     from the Hacktivity shell) falls over the picture while the clip holds its last frame (ClipBg freezes after clip.frames);
 *  3. the URL is drawn inside the curtain layer (uncovered as the red falls); when the screen is covered the Hacktivity logo resolves over the red with no plate (Labs -> Games morph);
 *     "Play now" stays above the curtain throughout. Per-aspect layout in shot.layout[aspect].
 * shot.clip = { file, frames }, shot.phases = [{ duration, text }] (only phase 0's text is used), shot.text_box = { x, w, cy },
 * shot.curtain = { start, fall, cw, ch, assemble, morph_at, morph_frames, url_at, url, plate }  (frames; morph_at and url_at are counted from the covered frame).
 */
export const CtaShot: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number; aspect: string }> = ({ shot, w, h, frame, frames, aspect }) => {
  const clip = shot.clip, cu = shot.curtain || {};
  const L = shot.layout?.[aspect] || {};            // per-aspect layout: { clip {cx,cy,zoom}, play {x,w,cy}, logo {cx,cy,w}, url {cx,cy,size} } (fractions of the frame)
  const ph = shot.phases[0];
  const lines = cardLines({ text: ph.text });
  const tb = L.play || shot.text_box || {};
  const colX = w * (tb.x ?? 0.53), colW = w * (tb.w ?? 0.43);
  const maxChars = Math.max(...lines.filter((l: any) => !l.scale).map((l: any) => l.text.length), 4);
  const size = Math.round(Math.min(h * 0.1, colW / maxChars) / 2) * 2;
  const bh = textBlockHeight(lines, size);
  const cy = h * (tb.cy ?? 0.5);
  const appear = 7;
  const lt = frame - (shot.text_delay ?? 10);
  const k = lt < appear ? 1 - lt / appear : 0;
  // "Play now" sits above the curtain the whole time (drawn after it), with its own shadow so it holds on the red
  const textNode = (
    <div style={{ position: 'absolute', left: colX, width: colW, top: Math.round(cy - bh / 2), height: bh, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 14px rgba(0,0,0,0.9)) drop-shadow(0 4px 0 rgba(58,4,9,0.85))' }}>
      <CardText lines={lines} size={size} />
    </div>
  );

  const start = cu.start ?? 96, fall = cu.fall ?? 57;
  const p = Math.min(1, Math.max(0, (frame - start) / fall));
  const covered = start + fall;                 // first frame with the screen fully red
  const lf = frame - covered;                   // logo-local frame
  // the logo: straight from the transparent SVGs over the red, no plate; a thin dark outline and soft shadow on the glyphs only
  const lg = L.logo || { cx: 0.5, cy: 0.5, w: 0.48 };
  const LW = Math.round(w * lg.w);
  const LH = logoHeight(LW);
  const lx = Math.round(w * lg.cx - LW / 2), ly = Math.round(h * lg.cy - LH / 2);
  const o = Math.max(2, Math.round(LW / 240));
  const logoShadow = `drop-shadow(${o}px 0 0 #3a0409) drop-shadow(-${o}px 0 0 #3a0409) drop-shadow(0 ${o}px 0 #3a0409) drop-shadow(0 -${o}px 0 #3a0409) drop-shadow(0 ${o * 3}px ${o * 4}px rgba(30,0,4,0.75))`;
  // the URL lives in the curtain's layer (HexRain label): uncovered by the falling red, column by column
  const ul = L.url || { cx: 0.5, cy: 0.66, size: 0.04 };
  const urlSize = Math.max(8, Math.round((w * ul.size) / 8) * 8);
  const label = { text: cu.url ?? 'hacktivity.co.uk', cx: Math.round(w * ul.cx), cy: Math.round(h * ul.cy), size: urlSize };
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070409' }}>
      <ClipBg file={clip.file} frame={frame} frames={clip.frames ?? 117} w={w} h={h} crop={L.clip} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,4,9,0) 40%, rgba(7,4,9,0.45) 100%)' }} />
      <div style={{ position: 'absolute', left: colX - size * 0.8, top: cy - bh / 2 - size * 1.2, width: colW + size * 1.6, height: bh + size * 2.4, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(7,4,9,0.82) 0%, rgba(7,4,9,0.6) 60%, rgba(7,4,9,0) 100%)' }} />
      {frame >= start ? <HexRain frame={frame} w={w} h={h} p={p} cw={cu.cw ?? 20} ch={cu.ch ?? 28} seed={cu.seed ?? 5} label={label} /> : null}
      {lt < 0 ? null : (
        k > 0 ? <GlitchFX id="cta-g" w={w} h={h} params={{ seed: frame * 11 + 3, k, maxShift: Math.round(w * 0.06), split: Math.round(w * 0.004), thick: 0.05, hide: k * 0.5 }}>{textNode}</GlitchFX> : textNode
      )}
      {lf >= 0 ? (
        <div style={{ position: 'absolute', left: lx, top: ly, width: LW, height: LH, filter: logoShadow }}>
          <LogoMorph W={LW} frame={lf} A={cu.assemble ?? 24} t1={cu.morph_at ?? 27} M={cu.morph_frames ?? 12} />
        </div>
      ) : null}
    </div>
  );
};
