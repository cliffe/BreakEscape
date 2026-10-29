import React from 'react';
import { MosaicFilter } from './Mosaic';

/**
 * House-style card background: dark navy-to-near-black vertical gradient, content centred slightly above the
 * middle, and a blurred, mirrored, mosaic-ed reflection below it that fades out (reference trailer 0-76 s).
 * `children` is rendered twice (once real, once mirrored), so keep it pure.
 */
export const CardStage: React.FC<{ w: number; h: number; blockH: number; children: React.ReactNode; reflectOpacity?: number; shimmer?: number; id?: string; top?: number }> = ({ w, h, blockH, children, reflectOpacity = 0.8, shimmer = 0, id = 'cs', top: topOverride }) => {
  const centreY = h * 0.5;           // block centre (reference: text block centred, reflection fills the lower third)
  const top = topOverride ?? centreY - blockH / 2;
  const block = Math.max(8, Math.round(h / 66));
  const reflH = Math.min(h - (top + blockH), blockH * 1.05);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #0f0040 0%, #0a0233 38%, #04011a 72%, #020008 100%)' }}>
      <MosaicFilter id={`${id}-mosaic`} block={block} blur={block * 0.28} />
      {/* faint floor glow where the reflection sits */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: top + blockH, height: h - top - blockH, background: 'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(120,110,200,0.16), rgba(0,0,0,0) 70%)' }} />
      <div style={{ position: 'absolute', left: 0, width: w, top, height: blockH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      <div
        style={{
          position: 'absolute', left: shimmer, width: w, top: top + blockH, height: reflH, overflow: 'hidden', opacity: reflectOpacity,
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%)',
        }}
      >
        <div style={{ position: 'absolute', left: 0, width: w, top: 0, height: blockH, transform: `translateY(${blockH}px) scaleY(-1)`, transformOrigin: '50% 0', filter: `url(#${id}-mosaic)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </div>
      </div>
      {/* vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)' }} />
    </div>
  );
};
