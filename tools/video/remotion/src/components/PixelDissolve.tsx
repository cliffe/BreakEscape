import React from 'react';
import { rng } from '../rand';

/**
 * Pixel dissolve: the outgoing frame (children, drawn over the incoming shot) breaks into square blocks that drop out in a
 * seeded random order. Block size is a multiple of the game's pixel size (default 24 output px). Pure clip, so every
 * remaining pixel is the original one (nearest-neighbour throughout).
 * k = frame index inside the join (0-based), n = join length. The last frame still keeps a few blocks; the next frame is a hard cut.
 */
export const PixelDissolve: React.FC<{ k: number; n: number; w: number; h: number; block?: number; seed?: number; children: React.ReactNode }> = ({ k, n, w, h, block = 24, seed = 11, children }) => {
  const cols = Math.ceil(w / block), rows = Math.ceil(h / block);
  const r = rng(seed * 977 + cols * 31 + rows);
  // each block gets a drop time in [0,1); a gentle top-weighted bias keeps it from looking like pure static
  const drop: number[] = [];
  for (let i = 0; i < cols * rows; i++) drop.push(r());
  const t = (k + 1) / (n + 1);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < cols) {
      if (drop[y * cols + x] < t) { x++; continue; }
      let x2 = x; while (x2 < cols && drop[y * cols + x2] >= t) x2++;
      rects.push(<rect key={`${y}-${x}`} x={x * block} y={y * block} width={(x2 - x) * block} height={block} />);
      x = x2;
    }
  }
  const id = `pd-${seed}`;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">{rects}</clipPath>
      </svg>
      <div style={{ position: 'absolute', inset: 0, clipPath: `url(#${id})`, WebkitClipPath: `url(#${id})` }}>{children}</div>
    </div>
  );
};
