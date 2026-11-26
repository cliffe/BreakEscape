import React from 'react';
import { ClipBg } from './ClipBg';
import { HexRain } from './HexRain';
import { GlitchFX } from './GlitchFX';
import { PIXEL_FONT } from '../fonts';
import { LogoMorph, logoHeight } from './EndLogos';
import { staticFile } from 'remotion';

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
export const CtaShot: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number; aspect: string }> = ({ shot, w, h, frame, fps, aspect }) => {
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
  // shot.cta_title = { svg?, scale: {aspect: n}, cy: {aspect: frac} }: the game's pixel title above "Play now", integer scale,
  // crisp black outline (four 0-blur shadows), revealed as the red reaches its top (same front model as the logo), brief glitch on arrival
  const ct = shot.cta_title;
  let titleEl: React.ReactNode = null;
  if (ct) {
    const sc = Math.max(1, Math.round(ct.scale?.[aspect] ?? 10));
    const tw = 57 * sc, th = 25 * sc;
    const tx = Math.round((w - tw) / 2), ty = Math.round(h * (ct.cy?.[aspect] ?? 0.28) - th / 2);
    const tHit = 0.3 + 0.65 * Math.pow(Math.max(0, ty) / (h + 56), 1 / 1.6);
    if (frame >= start && p >= tHit) {
      const ol = Math.max(2, Math.round(sc / 2));
      const outline = `drop-shadow(${ol}px 0 0 #000) drop-shadow(-${ol}px 0 0 #000) drop-shadow(0 ${ol}px 0 #000) drop-shadow(0 -${ol}px 0 #000)`;
      const img = <img src={staticFile(ct.svg || 'brand/safetynet_licence_to_hack.svg')} width={tw} height={th} style={{ display: 'block', imageRendering: 'pixelated' }} />;
      const tg = Math.max(0, 1 - (p - tHit) / 0.09);
      titleEl = (
        <div style={{ position: 'absolute', left: tx, top: ty, width: tw, height: th, filter: outline }}>
          {tg > 0 ? <GlitchFX id="cta-title" w={tw} h={th} params={{ seed: frame * 5 + 3, k: tg, maxShift: Math.round(tw * 0.08), split: Math.max(2, sc), thick: 0.12, hide: tg * 0.3 }}>{img}</GlitchFX> : img}
        </div>
      );
    }
  }
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
      {shot.burned_line && frame >= Math.round((shot.burned_line.from ?? 0) * fps) && frame < Math.round((shot.burned_line.to ?? 0) * fps) ? <BurnedLine text={shot.burned_line.text} w={w} h={h} /> : null}
      {frame >= start ? <HexRain frame={frame} w={w} h={h} p={p} cw={cu.cw ?? 20} ch={cu.ch ?? 28} seed={cu.seed ?? 5} label={labels} /> : null}
      {titleEl}
    </div>
  );
};

/**
 * shot.burned_line = { text, from, to } (seconds from the shot's start): the game's name burned over the closing clip, upper third, Press Start 2P,
 * white with a hard shadow, drawn under the curtain so the falling red covers it. One line in 16:9; split at ": " into two lines in 9:16 and 1:1.
 */
const BurnedLine: React.FC<{ text: string; w: number; h: number }> = ({ text, w, h }) => {
  const wide = w > h * 1.2, sq = !wide && w >= h * 0.9; // 1:1: the logo sits at the top and the spy's hat rises early, so the line is smaller
  const lines = wide ? [text] : text.split(/:\s+/).map((t, i, a) => (i < a.length - 1 ? t + ':' : t));
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.max(8, Math.floor((w * (wide ? 0.62 : sq ? 0.56 : 0.72)) / longest / 2) * 2); // glyph advance = size in Press Start 2P
  const o = Math.max(2, Math.round(size / 10));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round(h * (wide ? 0.17 : sq ? 0.172 : 0.152)), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(size * 0.7), pointerEvents: 'none', fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1, color: '#fff', textShadow: `${o}px ${o}px 0 #000, ${o}px 0 0 #000, 0 ${o}px 0 #000`, WebkitFontSmoothing: 'none' as any, textRendering: 'optimizeSpeed' as any, whiteSpace: 'nowrap' }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
};
