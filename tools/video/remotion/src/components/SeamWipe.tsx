import React from 'react';
import { CA, unit, stepped, snapTo, isStacked } from '../ca';

/**
 * Cyber Aware seam wipe (6 to 8 frames): the outgoing frame (children, frozen on its last frame and drawn over the incoming
 * shot) splits along the seam line and the two halves are pulled apart to the edges, opening on the incoming shot. Hard
 * 8-unit steps, a 2-unit ink edge on each half. Side by side on 16:9, stacked (seam horizontal) on 9:16 and 1:1.
 * k = frame inside the join (0-based), n = join length.
 */
export const SeamWipe: React.FC<{ k: number; n: number; w: number; h: number; seed?: number; children: React.ReactNode }> = ({ k, n, w, h, seed = 1, children }) => {
  const u = unit(w, h), stacked = isStacked(w, h);
  const extent = stacked ? h : w;
  const t = (k + 1) / (n + 1);
  const gap = Math.min(extent, snapTo(stepped(t, 12) * extent, 8 * u));
  const a = (extent - gap) / 2, b = (extent + gap) / 2; // first half ends at a, second starts at b
  const id = `sw-${seed}`;
  const rects = stacked
    ? [<rect key="a" x={0} y={0} width={w} height={a} />, <rect key="b" x={0} y={b} width={w} height={extent - b} />]
    : [<rect key="a" x={0} y={0} width={a} height={h} />, <rect key="b" x={b} y={0} width={extent - b} height={h} />];
  const edge = (pos: number) => stacked
    ? <div style={{ position: 'absolute', left: 0, width: w, top: pos, height: 2 * u, background: CA.ink }} />
    : <div style={{ position: 'absolute', top: 0, height: h, left: pos, width: 2 * u, background: CA.ink }} />;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden><clipPath id={id} clipPathUnits="userSpaceOnUse">{rects}</clipPath></svg>
      <div style={{ position: 'absolute', inset: 0, clipPath: `url(#${id})`, WebkitClipPath: `url(#${id})` }}>{children}</div>
      {a > 0 ? edge(a - 2 * u) : null}
      {b < extent ? edge(b) : null}
    </div>
  );
};
