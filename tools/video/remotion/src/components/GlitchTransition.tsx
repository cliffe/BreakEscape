import React from 'react';
import { GlitchFX } from './GlitchFX';

/**
 * Glitch v2 (see GlitchFX), 6-10 frames, only into/out of cards and the title. Matches the reference's card joins:
 * horizontal bands displaced in hard steps that jitter from frame to frame, a red/blue split on the moving bands and on
 * text edges, a brief blocky pixelation on the strongest frames. No noise wash, no dark bars.
 * intensity 0..1 (from effectAt), frame = global frame (seed).
 */
export const GlitchTransition: React.FC<{ intensity: number; frame: number; w: number; h: number; children: React.ReactNode }> = ({ intensity, frame, w, h, children }) => {
  const k = Math.max(0, Math.min(1, intensity));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <GlitchFX
        id="gl2" w={w} h={h}
        params={{ seed: frame * 31 + 7, k, maxShift: Math.round(w * (0.04 + 0.11 * k)), split: Math.round(w * (0.002 + 0.005 * k)), pix: k > 0.7 ? 0.22 : k > 0.45 ? 0.08 : 0, block: Math.max(8, Math.round(w / 100)), thick: 0.06 }}
      >
        {children}
      </GlitchFX>
    </div>
  );
};
