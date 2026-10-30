import React from 'react';
import { PIXEL_FONT } from '../fonts';
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
 *  3. when the screen is covered the Hacktivity logo resolves in front of the red on a dark plate (the Labs -> Games morph from EndLogos),
 *     with the URL under it.
 * shot.clip = { file, frames }, shot.phases = [{ duration, text }] (only phase 0's text is used), shot.text_box = { x, w, cy },
 * shot.curtain = { start, fall, cw, ch, assemble, morph_at, morph_frames, url_at, url, plate }  (frames; morph_at and url_at are counted from the covered frame).
 */
export const CtaShot: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number; aspect: string }> = ({ shot, w, h, frame, frames }) => {
  const clip = shot.clip, cu = shot.curtain || {};
  const ph = shot.phases[0];
  const lines = cardLines({ text: ph.text });
  const portrait = h > w;
  const colX = w * (shot.text_box?.x ?? 0.53), colW = w * (shot.text_box?.w ?? 0.43);
  const maxChars = Math.max(...lines.filter((l: any) => !l.scale).map((l: any) => l.text.length), 4);
  const size = Math.round(Math.min(h * 0.1, colW / maxChars) / 2) * 2;
  const bh = textBlockHeight(lines, size);
  const cy = h * (shot.text_box?.cy ?? 0.5);
  const appear = 7;
  const lt = frame - (shot.text_delay ?? 10);
  const k = lt < appear ? 1 - lt / appear : 0;
  const textNode = (
    <div style={{ position: 'absolute', left: colX, width: colW, top: Math.round(cy - bh / 2), height: bh, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 14px rgba(0,0,0,0.9))' }}>
      <CardText lines={lines} size={size} />
    </div>
  );

  const start = cu.start ?? 96, fall = cu.fall ?? 57;
  const p = Math.min(1, Math.max(0, (frame - start) / fall));
  const covered = start + fall;                 // first frame with the screen fully red
  const lf = frame - covered;                   // logo-local frame
  // logo on a dark plate
  const LW = Math.round(w * (portrait ? 0.74 : 0.48));
  const LH = logoHeight(LW);
  const urlSize = Math.round((LW * 0.72) / 16 / 2) * 2;
  const urlH = Math.round(urlSize * 1.28);
  const gap = Math.round(LH * 0.2), padX = Math.round(LW * 0.12), padY = Math.round(LW * 0.085);
  const plateW = LW + padX * 2, plateH = LH + gap + urlH + padY * 2;
  const plateX = Math.round((w - plateW) / 2), plateY = Math.round(h / 2 - plateH / 2);
  const plateIn = Math.min(1, Math.max(0, (lf + 1) / (cu.plate_frames ?? 6)));
  const urlAt = cu.url_at ?? 40;
  const uk = lf < urlAt ? 1 : Math.max(0, 1 - (lf - urlAt) / 7);
  const urlNode = (
    <div style={{ position: 'absolute', left: padX - Math.round(LW * 0.06), width: LW + Math.round(LW * 0.12), top: padY + LH + gap, height: urlH, display: 'flex', justifyContent: 'center', fontFamily: PIXEL_FONT, color: '#fff', fontSize: urlSize, lineHeight: `${urlH}px`, whiteSpace: 'nowrap', textRendering: 'optimizeSpeed' as any, WebkitFontSmoothing: 'none' as any }}>hacktivity.co.uk</div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070409' }}>
      <ClipBg file={clip.file} frame={frame} frames={clip.frames ?? 117} w={w} h={h} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,4,9,0) 40%, rgba(7,4,9,0.45) 100%)' }} />
      <div style={{ position: 'absolute', left: colX - size * 0.8, top: cy - bh / 2 - size * 1.2, width: colW + size * 1.6, height: bh + size * 2.4, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(7,4,9,0.82) 0%, rgba(7,4,9,0.6) 60%, rgba(7,4,9,0) 100%)' }} />
      {lt < 0 ? null : (
        k > 0 ? <GlitchFX id="cta-g" w={w} h={h} params={{ seed: frame * 11 + 3, k, maxShift: Math.round(w * 0.06), split: Math.round(w * 0.004), thick: 0.05, hide: k * 0.5 }}>{textNode}</GlitchFX> : textNode
      )}
      {frame >= start ? <HexRain frame={frame} w={w} h={h} p={p} cw={cu.cw ?? 20} ch={cu.ch ?? 28} seed={cu.seed ?? 5} /> : null}
      {lf >= 0 ? (
        <div style={{ position: 'absolute', left: plateX, top: plateY, width: plateW, height: plateH, opacity: plateIn, borderRadius: 6, background: 'linear-gradient(180deg, #0f0040 0%, #0a0233 45%, #04011a 100%)', boxShadow: '0 0 0 3px rgba(221,160,221,0.35), 0 0 80px 18px rgba(0,0,0,0.75)' }}>
          <div style={{ position: 'absolute', left: padX, top: padY, width: LW, height: LH }}>
            <LogoMorph W={LW} frame={lf} A={cu.assemble ?? 24} t1={cu.morph_at ?? 27} M={cu.morph_frames ?? 12} />
          </div>
          {lf < urlAt ? null : (
            uk > 0 ? <GlitchFX id="cta-url" w={plateW} h={plateH} params={{ seed: frame * 7 + 1, k: uk, maxShift: Math.round(plateW * 0.08), split: Math.max(2, Math.round(plateW * 0.005)), thick: 0.05, hide: uk * 0.5 }}>{urlNode}</GlitchFX> : urlNode
          )}
        </div>
      ) : null}
    </div>
  );
};
