import React from 'react';
import { useCurrentFrame } from 'remotion';
import { GlitchFX } from './GlitchFX';
import { rng } from '../rand';

/**
 * House-style card background: dark navy-to-near-black vertical gradient, content centred slightly above the
 * middle, and a mirrored, glitched reflection (low-intensity GlitchFX bands and colour split) below it that fades out (reference trailer 0-76 s).
 * `children` is rendered twice (once real, once mirrored), so keep it pure.
 */
export const CardStage: React.FC<{ w: number; h: number; blockH: number; children: React.ReactNode; reflectOpacity?: number; shimmer?: number; id?: string; top?: number }> = ({ w, h, blockH, children, reflectOpacity = 0.65, shimmer = 0, id = 'cs', top: topOverride }) => {
  const frame = useCurrentFrame();
  const centreY = h * 0.5;           // block centre (reference: text block centred, reflection fills the lower third)
  const top = topOverride ?? centreY - blockH / 2;
  const reflH = Math.min(h - (top + blockH), blockH * 1.05);
  // reflection FX (v4): wavy ripple + glitch bands + strong colour split + scanlines + flicker, all seeded from the frame number
  const fr = rng(frame * 977 + 13);
  const flick = fr() < 0.07 ? 0.4 : 0.8 + 0.2 * fr(); // brief dropouts, otherwise a slight shimmer in brightness
  const step = Math.floor(frame / 2);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #0f0040 0%, #0a0233 38%, #04011a 72%, #020008 100%)' }}>
      {/* faint floor glow where the reflection sits */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: top + blockH, height: h - top - blockH, background: 'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(120,110,200,0.16), rgba(0,0,0,0) 70%)' }} />
      <div style={{ position: 'absolute', left: 0, width: w, top, height: blockH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      <div
        style={{
          position: 'absolute', left: shimmer, width: w, top: top + blockH, height: reflH, overflow: 'hidden', opacity: reflectOpacity * flick,
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%)',
        }}
      >
        <div style={{ position: 'absolute', left: 0, width: w, top: 0, height: blockH, transform: `translateY(${blockH}px) scaleY(-1)`, transformOrigin: '50% 0' }}>
          {/* glitched reflection: low-intensity band offsets and a slight red/blue split, re-rolled every second frame (GlitchFX, no pixelation) */}
          <GlitchFX id={`${id}-refl`} w={w} h={blockH} params={{ seed: step * 17 + 3, k: 0.55, maxShift: Math.round(w * 0.03), split: Math.max(3, Math.round(w * 0.004)), pix: 0, thick: 0.14, wave: { amp: w * 0.0085, wl: blockH * 0.55, phase: frame * 0.42, step: 3, near: 0.35 } }}>
            <div style={{ position: 'absolute', left: 0, width: w, top: 0, height: blockH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
          </GlitchFX>
        </div>
        {/* scanlines over the reflection only */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)', backgroundPositionY: (frame % 5) }} />
      </div>
      {/* vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)' }} />
    </div>
  );
};
