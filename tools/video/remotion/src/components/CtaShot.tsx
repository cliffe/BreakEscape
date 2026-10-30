import React from 'react';
import { PIXEL_FONT } from '../fonts';
import { ClipBg } from './ClipBg';
import { HexRain } from './HexRain';
import { GlitchFX } from './GlitchFX';
import { CardText, textBlockHeight } from './TextCard';
import { cardLines } from '../timeline.js';

/**
 * Call to action over the laptop clip: the clip fills the frame (the agent sits in the keyhole on the left), the text sits on the
 * right in Press Start 2P, and a cascade of hex code rains down and builds over the picture. Phases swap the text with a short glitch.
 * shot.clip = { file, frames }, shot.phases = [{ duration, text: [...] }], shot.rain = { color, head, build_frames, size }.
 */
export const CtaShot: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number; aspect: string }> = ({ shot, w, h, frame, frames, fps }) => {
  const clip = shot.clip, rain = shot.rain || {};
  let t0 = 0, ph = shot.phases[0], idx = 0;
  shot.phases.forEach((p: any, i: number) => { const s = Math.round(shot.phases.slice(0, i).reduce((a: number, q: any) => a + q.duration, 0) * fps); if (frame >= s) { ph = p; t0 = s; idx = i; } });
  const local = frame - t0;
  const lines = cardLines({ text: ph.text });
  const colX = w * (shot.text_box?.x ?? 0.53), colW = w * (shot.text_box?.w ?? 0.43);
  const maxChars = Math.max(...lines.filter((l: any) => !l.scale).map((l: any) => l.text.length), 4);
  const size = Math.round(Math.min(h * 0.1, colW / maxChars) / 2) * 2;
  const bh = textBlockHeight(lines, size);
  const cy = h * (shot.text_box?.cy ?? 0.5);
  const appear = 7;
  const textStart = idx === 0 ? (shot.text_delay ?? 10) : 0;
  const lt = local - textStart;
  const k = lt < appear ? 1 - lt / appear : 0;
  const textNode = (
    <div style={{ position: 'absolute', left: colX, width: colW, top: Math.round(cy - bh / 2), height: bh, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 14px rgba(0,0,0,0.9))' }}>
      <CardText lines={lines} size={size} />
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070409' }}>
      <ClipBg file={clip.file} frame={frame} frames={clip.frames ?? 117} w={w} h={h} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,4,9,0) 40%, rgba(7,4,9,0.45) 100%)' }} />
      <HexRain frame={frame} w={w} h={h} build={rain.build_frames ?? Math.round(frames * 0.8)} color={rain.color || '#c4252b'} head={rain.head || '#ff8a80'} size={rain.size ?? 18} cover={rain.cover ?? 0.8} maxOpacity={rain.opacity ?? 0.8} seed={rain.seed ?? 5} />
      <div style={{ position: 'absolute', left: colX - size * 0.8, top: cy - bh / 2 - size * 1.2, width: colW + size * 1.6, height: bh + size * 2.4, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(7,4,9,0.82) 0%, rgba(7,4,9,0.6) 60%, rgba(7,4,9,0) 100%)' }} />
      {lt < 0 ? null : (
        k > 0 ? <GlitchFX id={`cta-g${idx}`} w={w} h={h} params={{ seed: frame * 11 + 3, k, maxShift: Math.round(w * 0.06), split: Math.round(w * 0.004), thick: 0.05, hide: k * 0.5 }}>{textNode}</GlitchFX> : textNode
      )}
    </div>
  );
};
