import React from 'react';
import { unit, fitSize, crisp } from '../ca';
import { cardLines } from '../timeline.js';
import { PIXEL_FONT } from '../fonts';
import { CC, ccCfg, CcArt, CcShade, CcFrame } from '../cc';

/**
 * cc card (card shot with style "cc"; owner's pick C, "panel"): the case's own panel of the tile art as the ground (sis01 the ward,
 * sis02 the furnace) at 50 % brightness, the tile's dark shade, a case-accent frame, and up to two lines of cream Press Start 2P capitals.
 * No badge on the mid cards (as in the approved mock-up); the badge is on the open and end cards.
 * shot.text = ["Two", "Signatures"], shot.cc = { case } (or the accent and panel); the edit-level cc supplies them.
 */
export const CcCard: React.FC<{ shot: any; w: number; h: number; frame: number }> = ({ shot, w, h }) => {
  const cfg = ccCfg(shot); const u = unit(w, h), land = w > h;
  const text = cardLines(shot).map((l: any) => String(l.text).toUpperCase());
  const pad = Math.round(Math.min(w, h) * (land ? 0.1 : 0.12));
  const k = land ? 1 : Math.min(w, h) / 1080;
  const sizes = (land ? [144, 128, 112, 96, 80, 64, 48] : [112, 96, 88, 80, 72, 64, 48, 40]).map((v) => Math.round(v * k));
  const size = text.length ? fitSize(text, PIXEL_FONT, sizes, w - 2 * pad) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b1114' }}>
      <CcArt w={w} h={h} panel={cfg.panel} brightness={0.5} />
      <CcShade strength={0.7} />
      <CcFrame w={w} h={h} accent={cfg.accent} u={u} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: Math.round(size * 0.35), ...crisp, imageRendering: 'auto' }}>
        {text.map((l, i) => <div key={i} style={{ fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1.15, color: CC.cream, whiteSpace: 'nowrap', textShadow: `0 ${Math.round(size * 0.08)}px 0 #000, 0 0 ${Math.round(size * 0.5)}px rgba(0,0,0,0.6)` }}>{l}</div>)}
      </div>
    </div>
  );
};
