import React from 'react';
import { rng } from '../rand';

/**
 * Horizontal motion-blur streak (reference 10-11 s): the outgoing frame smears sideways into a thin bright band
 * with cyan/red fringes, then the card resolves from the same smear. intensity 0..1.
 */
export const BlurStreak: React.FC<{ intensity: number; frame: number; w: number; h: number; side: 'out' | 'in'; children: React.ReactNode }> = ({ intensity, frame, w, h, side, children }) => {
  const k = Math.max(0, Math.min(1, intensity));
  const e = k * k * (3 - 2 * k);
  const r = rng(frame * 5 + 3);
  const sx = Math.round(e * w * 0.07);
  const split = Math.round(e * w * 0.02);
  const sy = 1 - e * 0.62;
  const lines = [];
  for (let i = 0; i < Math.round(e * 10); i++) {
    const y = h * (0.35 + r() * 0.3), lh = 1 + Math.round(r() * 3);
    lines.push(<div key={i} style={{ position: 'absolute', left: 0, width: w, top: y, height: lh, background: i % 3 === 0 ? '#35e0ff' : '#f4f0ff', opacity: 0.25 + r() * 0.4 }} />);
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="bs" x="-30%" y="-5%" width="160%" height="110%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={`${sx} 0`} result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
          <feOffset in="R" dx={-split} result="R2" />
          <feOffset in="B" dx={split} result="B2" />
          <feBlend in="R2" in2="G" mode="screen" result="RG" />
          <feBlend in="RG" in2="B2" mode="screen" />
        </filter>
      </svg>
      <div style={{ position: 'absolute', inset: 0, filter: k > 0.001 ? 'url(#bs)' : undefined, transform: `scaleY(${sy})`, transformOrigin: '50% 48%', opacity: 1 - 0.1 * e }}>{children}</div>
      {k > 0.001 && lines}
    </div>
  );
};
