import React from 'react';
import { CA, CaTab, unit, stepped, snapTo, isStacked, easeOut, tabFont } from '../ca';

/**
 * Cyber Aware flip (12 to 16 frames, once per trailer): the seam slides across the frame, the attacker seat (the outgoing
 * frame, frozen on its last frame) shrinks to a 12% strip and the defender seat (the incoming shot) takes the frame, with a
 * DEFEND tab landing on the seam. Right to left on 16:9, bottom to top on 9:16 and 1:1. Pixel-stepped. The strip is the
 * last thing drawn before the hard cut to the full defender shot.
 */
export const FlipTransition: React.FC<{ k: number; n: number; w: number; h: number; label?: string; children: React.ReactNode }> = ({ k, n, w, h, label = 'DEFEND', children }) => {
  const u = unit(w, h), stacked = isStacked(w, h);
  const extent = stacked ? h : w;
  const t = easeOut((k + 1) / (n + 1));
  const strip = 0.12;
  const pos = snapTo(extent * (1 - stepped(t, 12) * (1 - strip)), 4 * u); // the seam: outgoing is [0,pos], incoming [pos,extent]
  const tf = tabFont(w, h);
  const clip = stacked ? `inset(0 0 ${extent - pos}px 0)` : `inset(0 ${extent - pos}px 0 0)`;
  const bar = stacked
    ? [{ left: 0, width: w, top: pos - 2 * u, height: 2 * u, background: CA.ink }, { left: 0, width: w, top: pos, height: 2 * u, background: CA.line }, { left: 0, width: w, top: pos + 2 * u, height: 2 * u, background: CA.ink }]
    : [{ top: 0, height: h, left: pos - 2 * u, width: 2 * u, background: CA.ink }, { top: 0, height: h, left: pos, width: 2 * u, background: CA.line }, { top: 0, height: h, left: pos + 2 * u, width: 2 * u, background: CA.ink }];
  const tabDrop = Math.round((1 - stepped((k + 1) / Math.max(4, n * 0.5), 3)) * tf * 2);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: clip, WebkitClipPath: clip }}>{children}</div>
      {bar.map((b, i) => <div key={i} style={{ position: 'absolute', ...b }} />)}
      <CaTab label={label} bg={CA.defend} size={tf} u={u} style={stacked ? { left: '50%', transform: 'translateX(-50%)', top: pos - tf - 3 * u - tabDrop } : { left: pos + 6 * u, top: '50%', transform: `translateY(-50%) translateY(${-tabDrop}px)` }} />
    </div>
  );
};
