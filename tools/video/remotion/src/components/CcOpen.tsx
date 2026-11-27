import React from 'react';
import { Img, staticFile } from 'remotion';
import { unit, clamp01 } from '../ca';
import { CC, CC_LOGO, PLEX_COND, ccCfg, CcArt, CcShade, fitSpaced } from '../cc';

/**
 * cc-open (owner's pick A, "tile exact"): the Hacktivity Critical Cases tile. Phase 1 is the tile as it is on the site: the three-panel
 * painted art at 80 % brightness with the logo (critical_cases.svg, drawn from the site's own file) centred over it. Phase 2 swaps the
 * logo for the case title, in the logo's own face (IBM Plex Sans Condensed Bold, cream, hard shadow and glow), first line in the case accent.
 * No pixel font on this card: the owner waived the pixel-art UI rule for it. shot.cc = { case, accent, case1, case2, phase1 (s) }.
 * The art drifts in by 4 % over the shot (smooth, it is painted art).
 */
export const CcOpen: React.FC<{ shot: any; w: number; h: number; aspect: string; frame: number; frames: number }> = ({ shot, w, h, frame, frames }) => {
  const cfg = ccCfg(shot); const u = unit(w, h);
  const p1 = Math.max(1, Math.min(frames - 1, Math.round(shot.cc?.phase1 ? shot.cc.phase1 * (frames / shot.duration) : frames / 2)));
  const phase2 = frame >= p1;
  const drift = 1 + 0.04 * clamp01(frame / Math.max(1, frames));
  const frac = w > h ? 0.46 : w === h ? 0.74 : 0.8; // logo ink width as a share of the frame width
  const s = (frac * w) / CC_LOGO.inkW;
  const lw = CC_LOGO.w * s, lh = CC_LOGO.h * s;
  const lx = w / 2 - (CC_LOGO.inkX + CC_LOGO.inkW / 2) * s, ly = h / 2 - (CC_LOGO.inkY + CC_LOGO.inkH / 2) * s;

  const lines = [cfg.case1, cfg.case2].filter(Boolean);
  const k = Math.min(w, h) / 1080, ls = 0.04;
  const maxW = w * (w > h ? 0.8 : 0.86);
  const sizes = (w > h ? [176, 160, 144, 128, 112, 96, 80] : [208, 184, 160, 144, 128, 112, 96, 80]).map((v) => Math.round(v * (w > h ? 1 : k)));
  const size = lines.length ? fitSpaced(lines, PLEX_COND, sizes, maxW, ls) : 0;
  const fade = clamp01((frame - p1 + 1) / 6); // 6-frame crossfade of the type only

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b1114' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${drift})`, transformOrigin: '50% 50%' }}>
        <CcArt w={w} h={h} panel={null} brightness={0.8} />
        {phase2 ? <CcShade strength={0.7} /> : null}
      </div>
      {!phase2 ? <Img src={staticFile(CC_LOGO.file)} style={{ position: 'absolute', left: lx, top: ly, width: lw, height: lh, maxWidth: 'none' }} /> : null}
      {phase2 ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: fade }}>
          {lines.map((l, i) => (
            <div key={i} style={{ fontFamily: PLEX_COND, fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: `${ls}em`, whiteSpace: 'nowrap', color: i === 0 ? cfg.accent : CC.cream, textShadow: `0 ${Math.round(size * 0.045)}px 0 #000, 0 0 ${Math.round(size * 0.25)}px rgba(0,0,0,0.6)` }}>{l}</div>
          ))}
        </div>
      ) : null}
      <div style={{ position: 'absolute', inset: 0, border: `${1 * u}px solid rgba(255,255,255,0.12)`, boxSizing: 'border-box' }} />
    </div>
  );
};
