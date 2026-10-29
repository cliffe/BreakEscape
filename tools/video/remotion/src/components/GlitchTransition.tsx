import React from 'react';
import { rng } from '../rand';

/**
 * Digital glitch wrapper, 6-10 frames, only into/out of text cards: RGB split, slice displacement
 * (feTurbulence bands -> feDisplacementMap), noise and a few bright blocks. intensity 0..1, frame = global frame (seed).
 */
export const GlitchTransition: React.FC<{ intensity: number; frame: number; w: number; h: number; children: React.ReactNode }> = ({ intensity, frame, w, h, children }) => {
  const id = 'gl';
  const r = rng(frame * 7 + 13);
  const k = Math.max(0, Math.min(1, intensity));
  const disp = k * w * 0.16;
  const split = Math.round(k * w * 0.014 + 2);
  const seed = 1 + Math.floor(r() * 997);
  const freqY = 0.012 + r() * 0.05;
  const bars = [];
  const nBars = Math.round(1 + k * 5);
  for (let i = 0; i < nBars; i++) {
    const bh = Math.round(h * (0.003 + r() * 0.02 * k));
    const by = Math.round(r() * (h - bh));
    const bw = Math.round(w * (0.1 + r() * 0.7));
    const bx = Math.round(r() * (w - bw));
    const col = ['#f0c8ff', '#ffffff', '#35e0ff', '#ff3060', '#b060ff'][Math.floor(r() * 5)];
    bars.push(<div key={i} style={{ position: 'absolute', left: bx, top: by, width: bw, height: bh, background: col, opacity: 0.35 + r() * 0.55, mixBlendMode: 'screen' }} />);
  }
  const darkBars = [];
  for (let i = 0; i < Math.round(k * 5); i++) {
    const bh = Math.round(h * (0.01 + r() * 0.06)); const by = Math.round(r() * (h - bh));
    darkBars.push(<div key={i} style={{ position: 'absolute', left: 0, top: by, width: w, height: bh, background: '#02000a', opacity: 0.55 }} />);
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id={id} x="-5%" y="0" width="110%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence" baseFrequency={`0 ${freqY}`} numOctaves="1" seed={seed} result="n" />
          <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result="nx" />
          <feComponentTransfer in="nx" result="nq">
            <feFuncR type="discrete" tableValues="0.5 0.5 0.5 0.95 0.5 0.5 0.05 0.5 0.5 0.8 0.5 0.2" />
          </feComponentTransfer>
          <feDisplacementMap in="SourceGraphic" in2="nq" scale={disp} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
          <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
          <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
          <feOffset in="R" dx={-split} dy="0" result="R2" />
          <feOffset in="B" dx={split} dy="0" result="B2" />
          <feBlend in="R2" in2="G" mode="screen" result="RG" />
          <feBlend in="RG" in2="B2" mode="screen" />
        </filter>
      </svg>
      <div style={{ position: 'absolute', inset: 0, filter: k > 0.001 ? `url(#${id})` : undefined, transform: `translateX(${Math.round((r() - 0.5) * k * w * 0.02)}px)` }}>{children}</div>
      {k > 0.001 && (
        <>
          {darkBars}
          {bars}
          <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: k * 0.28, mixBlendMode: 'overlay' }}>
            <filter id="gl-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed={seed + 5} /><feColorMatrix type="saturate" values="0" /></filter>
            <rect width={w} height={h} filter="url(#gl-noise)" />
          </svg>
        </>
      )}
    </div>
  );
};
