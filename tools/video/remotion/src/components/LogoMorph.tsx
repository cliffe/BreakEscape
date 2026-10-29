import React from 'react';
import { staticFile } from 'remotion';
import { PIXEL_FONT } from '../fonts';
import { CardStage } from './CardStage';
import { rng } from '../rand';

const PLUM = '#dca0dc';

/** Band-wise morph between two layers: horizontal bands flip from A to B in random order (a glitchy pixel morph, not a fade). */
const BandMorph: React.FC<{ a: React.ReactNode; b: React.ReactNode; progress: number; seed: number; bands?: number; w: number; h: number; shake?: number }> = ({ a, b, progress, seed, bands = 14, w, h, shake = 0 }) => {
  if (progress <= 0) return <>{a}</>;
  if (progress >= 1) return <>{b}</>;
  const r = rng(seed);
  const items = [];
  for (let i = 0; i < bands; i++) {
    const thr = r(); const dx = (r() - 0.5) * shake * (1 - Math.abs(progress - 0.5) * 2 + 0.2);
    const showB = thr < progress;
    const top = (i / bands) * 100, bottom = 100 - ((i + 1) / bands) * 100;
    items.push(
      <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${top}% 0 ${bottom}% 0)`, transform: `translateX(${dx}px)` }}>
        {showB ? b : a}
      </div>,
    );
  }
  return <>{items}</>;
};

const Layer: React.FC<{ w: number; h: number; align?: string; children: React.ReactNode }> = ({ align = 'flex-start', children }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: align, justifyContent: 'center' }}>{children}</div>
);

/**
 * Hacktivity Cyber Security Labs -> Hacktivity Games -> BREAK ESCAPE (Press Start 2P).
 * shot.morph = [subtitle A, subtitle B, wordmark]; `logo_end` kind morphs nothing (Hacktivity Games held).
 * Morph windows are 7 frames long, placed at 40% and 70% of the card.
 */
export const LogoMorph: React.FC<{ shot: any; w: number; h: number; frame: number; frames: number; fps: number }> = ({ shot, w, h, frame, frames, fps }) => {
  const portrait = h > w;
  const wordW = Math.round(w * (portrait ? 0.8 : 0.5));
  const wordH = Math.round(wordW * (10.3 / 41.2) * 1.0);
    const m = shot.morph || ['Cyber Security Labs', 'Games', 'BREAK ESCAPE'];
  const end = shot.kind === 'logo_end';
  const word = (
    <img src={staticFile('logo-hacktivity-word.svg')} style={{ width: wordW, height: 'auto', display: 'block', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 18px rgba(220,160,220,0.25))' }} />
  );
  const sub = (t: string) => {
    const subSize = Math.round((wordW * (t.length > 8 ? 0.8 : 0.44)) / t.length);
    return (
    <div style={{ fontFamily: PIXEL_FONT, fontSize: subSize, color: '#f2eaff', marginTop: Math.round(subSize * 0.7), textAlign: 'center', whiteSpace: 'nowrap', WebkitFontSmoothing: 'none' as any }}>{t}</div>
  ); };
  const stack = (t: string) => (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{word}{sub(t)}</div>);
  const markSize = portrait ? Math.round((w * 0.82) / 6) : Math.round((w * 0.8) / 12);
  const wordmark = portrait ? ['BREAK', 'ESCAPE'] : ['BREAK ESCAPE'];
  const mark = (
    <div style={{ fontFamily: PIXEL_FONT, fontSize: markSize, color: '#fff', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap', WebkitFontSmoothing: 'none' as any }}>
      {wordmark.map((t, i) => <div key={i}>{t}</div>)}
    </div>
  );
  const subH = (t: string) => Math.round((wordW * (t.length > 8 ? 0.8 : 0.44)) / t.length);
  const stackH = (t: string) => Math.round(wordH * 0.98 + subH(t) * 1.7);
  const markH = Math.round(wordmark.length * markSize * 1.3);
  const MW = 7;
  const t1 = Math.round(frames * 0.4), t2 = Math.round(frames * 0.72);
  const A = stack(m[0]), B = stack(m[1] ?? m[0]);
  const shake = w * 0.03;
  const content = (f: number) => {
    if (end) return <Layer w={w} h={h}>{B}</Layer>;
    const p1 = (f - t1) / MW, p2 = (f - t2) / MW;
    if (f < t1) return <Layer w={w} h={h}>{A}</Layer>;
    if (f < t1 + MW) return <BandMorph w={w} h={h} progress={p1} seed={f} shake={shake} a={<Layer w={w} h={h}>{A}</Layer>} b={<Layer w={w} h={h}>{B}</Layer>} />;
    if (f < t2) return <Layer w={w} h={h}>{B}</Layer>;
    if (f < t2 + MW) return <BandMorph w={w} h={h} progress={p2} seed={f + 99} shake={shake * 1.4} bands={18} a={<Layer w={w} h={h}>{B}</Layer>} b={<Layer w={w} h={h} align="center">{mark}</Layer>} />;
    return <Layer w={w} h={h} align="center">{mark}</Layer>;
  };
  // the reflection duplicates the content block; CardStage positions a block of height bh, so render content inside a bh-high box
  const inMark = !end && frame >= t2 + MW / 2;
  const logoH = Math.max(stackH(m[0]), stackH(m[1] ?? m[0]));
  const bh = end ? stackH(m[1] ?? m[0]) : inMark ? markH : (frame < t1 ? stackH(m[0]) : logoH);
  const top = end ? h * 0.5 - bh / 2 : inMark ? h * 0.5 - markH / 2 : h * 0.5 - logoH / 2;
  const inner = (
    <div style={{ position: 'relative', width: w, height: bh }}>
      {content(frame)}
    </div>
  );
  return <CardStage w={w} h={h} blockH={bh} top={top} id={`lm-${shot.id}`}>{inner}</CardStage>;
};
