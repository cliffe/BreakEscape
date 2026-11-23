import React from 'react';
import { unit, fitSize, crisp } from '../ca';
import { PIXEL_FONT } from '../fonts';
import { CC, ccCfg, CcArt, CcShade, CcFrame, CcBadge } from '../cc';

/**
 * cc-close (owner's pick C, same treatment as the mid cards): the case's panel, the accent frame, then the case name (first line in the
 * accent), the tile badge (INCIDENT SIMULATIONS), the rest of the series name (CRITICAL CASES, cream) and the call to action in the accent.
 * The three parts appear in steps: case name at once, badge at frame 6, series name at 8, call to action at 14.
 * shot.cc = { case, accent, case1, case2, series: [..], cta }.
 */
export const CcClose: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; frames: number }> = ({ shot, w, h, frame }) => {
  const cfg = ccCfg(shot); const u = unit(w, h), land = w > h;
  const k = land ? 1 : Math.min(w, h) / 1080;
  const pad = Math.round(Math.min(w, h) * (land ? 0.1 : 0.12));
  const maxW = w - 2 * pad;
  const lines = [cfg.case1, cfg.case2].filter(Boolean);
  const caseSize = fitSize(lines, PIXEL_FONT, (land ? [64, 56, 48, 40, 32] : [56, 48, 40, 32, 24]).map((v) => Math.round(v * k)), maxW);
  const serSize = fitSize([cfg.series[1].toUpperCase()], PIXEL_FONT, (land ? [40, 32, 24] : [48, 40, 32, 24]).map((v) => Math.round(v * k)), maxW);
  const badgeLines = [cfg.series[0].toUpperCase()];
  const badgeSize = fitSize(badgeLines, PIXEL_FONT, (land ? [32, 24, 16] : [32, 24, 16]).map((v) => Math.round(v * k)), maxW - 2 * 40 * k);
  const ctaSize = fitSize([cfg.cta], PIXEL_FONT, (land ? [32, 24, 16] : [32, 24, 16]).map((v) => Math.round(v * k)), maxW);
  const shadow = (s: number) => `0 ${Math.round(s * 0.08)}px 0 #000`;
  const gap = Math.round(caseSize * 0.9);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b1114' }}>
      <CcArt w={w} h={h} panel={cfg.panel} brightness={0.5} />
      <CcShade strength={0.7} />
      <CcFrame w={w} h={h} accent={cfg.accent} u={u} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap, ...crisp, imageRendering: 'auto' }}>
        <div>{lines.map((l, i) => <div key={i} style={{ fontFamily: PIXEL_FONT, fontSize: caseSize, lineHeight: 1.5, whiteSpace: 'nowrap', color: i === 0 ? cfg.accent : CC.cream, textShadow: shadow(caseSize) }}>{l}</div>)}</div>
        <div style={{ opacity: frame >= 6 ? 1 : 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(serSize * 0.5) }}>
          <CcBadge lines={badgeLines} size={badgeSize} u={u} />
          <div style={{ fontFamily: PIXEL_FONT, fontSize: serSize, lineHeight: 1.2, color: CC.cream, whiteSpace: 'nowrap', opacity: frame >= 8 ? 1 : 0, textShadow: shadow(serSize) }}>{cfg.series[1].toUpperCase()}</div>
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: ctaSize, lineHeight: 1.5, color: cfg.accent, whiteSpace: 'nowrap', opacity: frame >= 14 ? 1 : 0, textShadow: shadow(ctaSize) }}>{cfg.cta}</div>
      </div>
    </div>
  );
};
