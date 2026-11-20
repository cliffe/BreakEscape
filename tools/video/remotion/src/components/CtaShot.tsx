import React from 'react';
import { ClipBg } from './ClipBg';
import { HexRain } from './HexRain';
import { GlitchFX } from './GlitchFX';
import { LogoMorph, logoHeight } from './EndLogos';

/**
 * The closing piece (v7), one continuous shot:
 *  1. the laptop clip plays clean; the Hacktivity logo (transparent SVGs, no plate) assembles beside the spy and morphs Labs -> Games
 *     before the key press (shot.curtain.logo_at, assemble, morph_at, morph_frames are counted from logo_at);
 *  2. when the spy presses the keys (clip frame ~90; shot.curtain.start a few frames later) the solid red hex curtain (HexRain) falls over
 *     the picture (the clip holds its last frame after clip.frames) and covers the logo, which glitches for a few frames as the red reaches it;
 *  3. "Play now" and the URL are drawn inside the curtain layer (HexRain labels), so each column shows them only once the red has reached them.
 * shot.layout[aspect] = { clip {cx,cy,zoom}, logo {cx,cy,w}, play {cx,cy,size}, url {cx,cy,size} } (fractions of the frame).
 * shot.curtain = { start, fall, cw, ch, seed, logo_at, assemble, morph_at, morph_frames, play, url }.
 */
export const CtaShot: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number; aspect: string }> = ({ shot, w, h, frame, aspect }) => {
  const clip = shot.clip, cu = shot.curtain || {};
  const L = shot.layout?.[aspect] || {};
  const start = cu.start ?? 96, fall = cu.fall ?? 57;
  const p = Math.min(1, Math.max(0, (frame - start) / fall));
  const logoAt = cu.logo_at ?? 3;
  const lf = frame - logoAt;

  const lg = L.logo || { cx: 0.735, cy: 0.5, w: 0.38 };
  const LW = Math.round(w * lg.w), LH = logoHeight(LW);
  const lx = Math.round(w * lg.cx - LW / 2), ly = Math.round(h * lg.cy - LH / 2);
  // as the red reaches the logo (the front of a column is q^1.6 of the height; p = lag(~0.3) + 0.65 q) it glitches for a few frames
  const qTop = Math.pow(Math.max(0, ly - 10) / (h + 56), 1 / 1.6);
  const pHit = 0.3 + 0.65 * qTop;
  const gk = Math.max(0, Math.min(1, 1 - Math.abs(p - pHit) / 0.09)) * (p > 0 ? 1 : 0);
  const covered = start + fall + 6;
  const o = Math.max(2, Math.round(LW / 240));
  const logoShadow = `drop-shadow(0 ${o * 2}px ${o * 5}px rgba(0,0,0,0.85))`;
  const logoNode = <LogoMorph W={LW} frame={lf} A={cu.assemble ?? 24} t1={cu.morph_at ?? 57} M={cu.morph_frames ?? 12} />;

  const sz = (f: number) => Math.max(8, Math.round((w * f) / 8) * 8);
  const pl = L.play || { cx: 0.5, cy: 0.44, size: 0.058 }, ul = L.url || { cx: 0.5, cy: 0.58, size: 0.033 };
  const labels = [
    { text: cu.play ?? 'Play now', cx: Math.round(w * pl.cx), cy: Math.round(h * pl.cy), size: sz(pl.size) },
    { text: cu.url ?? 'hacktivity.co.uk', cx: Math.round(w * ul.cx), cy: Math.round(h * ul.cy), size: sz(ul.size) },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070409' }}>
      <ClipBg file={clip.file} frame={frame} frames={clip.frames ?? 117} w={w} h={h} crop={L.clip} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,4,9,0) 40%, rgba(7,4,9,0.45) 100%)' }} />
      {lf >= 0 && frame < covered ? (
        <div style={{ position: 'absolute', left: lx, top: ly, width: LW, height: LH, filter: logoShadow }}>
          {gk > 0 ? (
            <GlitchFX id="cta-lg" w={LW} h={LH} params={{ seed: frame * 7 + 5, k: gk, maxShift: Math.round(LW * 0.12), split: Math.max(2, Math.round(LW * 0.012)), thick: 0.12, hide: gk * 0.35 }}>{logoNode}</GlitchFX>
          ) : logoNode}
        </div>
      ) : null}
      {frame >= start ? <HexRain frame={frame} w={w} h={h} p={p} cw={cu.cw ?? 20} ch={cu.ch ?? 28} seed={cu.seed ?? 5} label={labels} /> : null}
    </div>
  );
};
